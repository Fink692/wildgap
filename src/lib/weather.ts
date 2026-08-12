import type { ClimateContext, HabitatAnalysis, SurveyWindow } from "@/lib/types";

export interface DailyForecast {
  time: string[];
  temperature_2m_max: number[];
  precipitation_probability_max?: number[];
  wind_speed_10m_max?: number[];
}

export interface DailyHistory {
  time: string[];
  temperature_2m_max: number[];
  precipitation_sum?: number[];
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function monthRange(year: number, monthIndex: number) {
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 0));
  return { start, end };
}

function average(values: number[]) {
  const finite = values.filter(Number.isFinite);
  return finite.length ? finite.reduce((sum, value) => sum + value, 0) / finite.length : null;
}

function sum(values: number[]) {
  return values.filter(Number.isFinite).reduce((total, value) => total + value, 0);
}

function percentile(value: number, values: number[]) {
  if (!values.length) return null;
  return Math.round((values.filter((candidate) => candidate <= value).length / values.length) * 100);
}

export function weatherArchiveRange(now = new Date()) {
  const previousMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const currentRange = monthRange(previousMonth.getUTCFullYear(), previousMonth.getUTCMonth());
  const archiveStart = monthRange(previousMonth.getUTCFullYear() - 10, previousMonth.getUTCMonth()).start;
  return { start: isoDate(archiveStart), end: isoDate(currentRange.end) };
}

export function unavailableClimateContext(now = new Date()): ClimateContext {
  const previousMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const comparisonMonth = new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(previousMonth);
  return {
    comparisonMonth,
    temperatureAnomalyC: null,
    precipitationPercentile: null,
    currentTemperatureC: null,
    baselineTemperatureC: null,
    currentPrecipitationMm: null,
    baselinePrecipitationMm: null,
    summary: "Historical context is temporarily unavailable. Forecast timing is still shown when possible.",
  };
}

export function buildClimateContext(history: DailyHistory, now = new Date()): ClimateContext {
  const previousMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const currentYear = previousMonth.getUTCFullYear();
  const month = previousMonth.getUTCMonth();
  const groups = new Map<number, { temperatures: number[]; precipitation: number[] }>();
  history.time.forEach((dateString, index) => {
    const date = new Date(`${dateString}T00:00:00Z`);
    if (date.getUTCMonth() !== month) return;
    const group = groups.get(date.getUTCFullYear()) ?? { temperatures: [], precipitation: [] };
    group.temperatures.push(history.temperature_2m_max[index]);
    group.precipitation.push(history.precipitation_sum?.[index] ?? 0);
    groups.set(date.getUTCFullYear(), group);
  });
  const current = groups.get(currentYear);
  const baselines = [...groups.entries()]
    .filter(([year]) => year < currentYear)
    .sort(([a], [b]) => b - a)
    .slice(0, 10)
    .map(([, values]) => ({ temperature: average(values.temperatures) ?? 0, precipitation: sum(values.precipitation) }));
  const currentTemperature = current ? average(current.temperatures) : null;
  const currentPrecipitation = current ? sum(current.precipitation) : null;
  const baselineTemperature = average(baselines.map((value) => value.temperature));
  const baselinePrecipitation = average(baselines.map((value) => value.precipitation));
  const temperatureAnomaly = currentTemperature !== null && baselineTemperature !== null ? currentTemperature - baselineTemperature : null;
  const precipitationPercentile = currentPrecipitation !== null ? percentile(currentPrecipitation, baselines.map((value) => value.precipitation)) : null;
  const comparisonMonth = new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(previousMonth);
  const summary = temperatureAnomaly === null || precipitationPercentile === null
    ? "Historical context is temporarily unavailable. Forecast timing is still shown when possible."
    : `${comparisonMonth} was ${Math.abs(temperatureAnomaly).toFixed(1)}°C ${temperatureAnomaly >= 0 ? "warmer" : "cooler"} than its 2016–2025 average, with precipitation at the ${precipitationPercentile}th percentile. This is context, not proof of ecological impact.`;
  return {
    comparisonMonth,
    temperatureAnomalyC: temperatureAnomaly === null ? null : Number(temperatureAnomaly.toFixed(1)),
    precipitationPercentile,
    currentTemperatureC: currentTemperature === null ? null : Number(currentTemperature.toFixed(1)),
    baselineTemperatureC: baselineTemperature === null ? null : Number(baselineTemperature.toFixed(1)),
    currentPrecipitationMm: currentPrecipitation === null ? null : Number(currentPrecipitation.toFixed(1)),
    baselinePrecipitationMm: baselinePrecipitation === null ? null : Number(baselinePrecipitation.toFixed(1)),
    summary,
  };
}

export function rankSurveyWindows(forecast: DailyForecast): SurveyWindow[] {
  return forecast.time.map((date, index) => {
    const temperature = forecast.temperature_2m_max[index];
    const precipitation = forecast.precipitation_probability_max?.[index] ?? 50;
    const wind = forecast.wind_speed_10m_max?.[index] ?? 30;
    const temperaturePenalty = temperature < 5 ? (5 - temperature) * 4 : temperature > 30 ? (temperature - 30) * 4 : 0;
    const score = Math.round(Math.max(0, 100 - precipitation * 0.55 - wind * 0.8 - temperaturePenalty));
    return {
      date,
      score,
      temperatureMaxC: Math.round(temperature),
      precipitationProbability: Math.round(precipitation),
      windMaxKph: Math.round(wind),
      label: score >= 80 ? "Excellent" : score >= 65 ? "Good" : "Fair",
    } satisfies SurveyWindow;
  }).sort((a, b) => b.score - a.score).slice(0, 3);
}

export async function recoverWeather(analysis: HabitatAnalysis) {
  if (analysis.dataQuality.weatherStatus === "complete") return analysis;
  try {
    const forecastParams = new URLSearchParams({
      latitude: String(analysis.area.latitude),
      longitude: String(analysis.area.longitude),
      daily: "temperature_2m_max,precipitation_probability_max,wind_speed_10m_max",
      forecast_days: "7",
      timezone: "auto",
    });
    const archiveRange = weatherArchiveRange();
    const archiveParams = new URLSearchParams({
      latitude: String(analysis.area.latitude),
      longitude: String(analysis.area.longitude),
      start_date: archiveRange.start,
      end_date: archiveRange.end,
      daily: "temperature_2m_max,precipitation_sum",
      timezone: "auto",
    });
    const [archiveResult, forecastResult] = await Promise.allSettled([
      fetch(`https://archive-api.open-meteo.com/v1/archive?${archiveParams}`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8_000) }),
      fetch(`https://api.open-meteo.com/v1/forecast?${forecastParams}`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8_000) }),
    ]);
    const archivePayload = archiveResult.status === "fulfilled" && archiveResult.value.ok
      ? await archiveResult.value.json() as { daily?: DailyHistory }
      : null;
    const forecastPayload = forecastResult.status === "fulfilled" && forecastResult.value.ok
      ? await forecastResult.value.json() as { daily?: DailyForecast }
      : null;
    const climateRecovered = Boolean(archivePayload?.daily);
    const forecastRecovered = Boolean(forecastPayload?.daily);
    if (!climateRecovered && !forecastRecovered) return analysis;
    const surveyWindows = forecastPayload?.daily ? rankSurveyWindows(forecastPayload.daily) : analysis.surveyWindows;
    const climate = archivePayload?.daily ? buildClimateContext(archivePayload.daily) : analysis.climate;
    const hasClimate = climate.temperatureAnomalyC !== null && climate.precipitationPercentile !== null;
    const hasForecast = surveyWindows.length > 0;
    return {
      ...analysis,
      sourceTimestamps: { ...analysis.sourceTimestamps, weather: new Date().toISOString() },
      dataStatusMessage: `${analysis.dataStatusMessage} Weather context was recovered directly from Open-Meteo.`,
      dataQuality: {
        ...analysis.dataQuality,
        weatherStatus: hasClimate && hasForecast ? "complete" as const : hasForecast ? "forecast-only" as const : "climate-only" as const,
      },
      climate,
      surveyWindows,
    };
  } catch {
    return analysis;
  }
}
