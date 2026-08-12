import type { HabitatAnalysis, SurveyWindow } from "@/lib/types";

export interface DailyForecast {
  time: string[];
  temperature_2m_max: number[];
  precipitation_probability_max?: number[];
  wind_speed_10m_max?: number[];
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

export async function recoverForecast(analysis: HabitatAnalysis) {
  if (analysis.dataQuality.weatherStatus !== "unavailable") return analysis;
  try {
    const params = new URLSearchParams({
      latitude: String(analysis.area.latitude),
      longitude: String(analysis.area.longitude),
      daily: "temperature_2m_max,precipitation_probability_max,wind_speed_10m_max",
      forecast_days: "7",
      timezone: "auto",
    });
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return analysis;
    const payload = (await response.json()) as { daily?: DailyForecast };
    if (!payload.daily) return analysis;
    const surveyWindows = rankSurveyWindows(payload.daily);
    if (!surveyWindows.length) return analysis;
    return {
      ...analysis,
      sourceTimestamps: { ...analysis.sourceTimestamps, weather: new Date().toISOString() },
      dataStatusMessage: `${analysis.dataStatusMessage} Forecast timing was recovered directly from Open-Meteo.`,
      dataQuality: { ...analysis.dataQuality, weatherStatus: "forecast-only" as const },
      surveyWindows,
    };
  } catch {
    return analysis;
  }
}
