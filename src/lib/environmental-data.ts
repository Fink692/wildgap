import { createHash, randomUUID } from "node:crypto";
import { areaForCell, cellsForArea, centerForCell, polygonForCell, polygonWkt } from "@/lib/geo";
import { confidenceFor, explainScore, scoreCells, TARGET_TAXA } from "@/lib/scoring";
import type {
  ClimateContext,
  HabitatAnalysis,
  SurveyWindow,
  TargetTaxon,
  TaxonCounts,
} from "@/lib/types";

const GBIF_BASE = "https://api.gbif.org/v1";
const WEATHER_BASE = "https://api.open-meteo.com/v1";
const ARCHIVE_BASE = "https://archive-api.open-meteo.com/v1";
const DEFAULT_TAXON_KEYS: Record<TargetTaxon, number> = {
  Plants: 6,
  Fungi: 5,
  Birds: 212,
  Insects: 216,
};

type JsonRecord = Record<string, unknown>;

async function fetchJson<T>(url: string, revalidate: number): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "WildGap/1.0 hackathon project" },
      next: { revalidate },
      signal: AbortSignal.timeout(8_000),
    });
    if (response.ok) return (await response.json()) as T;
    if (response.status === 429 && attempt < 2) {
      const retryAfter = Number(response.headers.get("retry-after") ?? 0);
      await new Promise<void>((resolve) => setTimeout(resolve, Math.max(retryAfter * 1_000, 600 * (attempt + 1))));
      continue;
    }
    throw new Error(`Upstream request failed (${response.status})`);
  }
  throw new Error("Upstream request exhausted retries");
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function shiftYears(date: Date, years: number) {
  const shifted = new Date(date);
  shifted.setUTCFullYear(shifted.getUTCFullYear() + years);
  return shifted;
}

async function resolveTaxonKeys() {
  const entries = await Promise.all(
    TARGET_TAXA.map(async (target) => {
      const scientificName = target === "Birds" ? "Aves" : target === "Insects" ? "Insecta" : target === "Plants" ? "Plantae" : "Fungi";
      try {
        const match = await fetchJson<{ usageKey?: number }>(
          `${GBIF_BASE}/species/match?name=${encodeURIComponent(scientificName)}`,
          604_800,
        );
        return [target, match.usageKey ?? DEFAULT_TAXON_KEYS[target]] as const;
      } catch {
        return [target, DEFAULT_TAXON_KEYS[target]] as const;
      }
    }),
  );
  return Object.fromEntries(entries) as Record<TargetTaxon, number>;
}

interface GbifFacetCount { name: string; count: number }
interface GbifFacet { field: string; counts: GbifFacetCount[] }
interface GbifResponse { count: number; facets?: GbifFacet[] }

function countsFromFacets(response: GbifResponse, keys: Record<TargetTaxon, number>): TaxonCounts {
  const allCounts = (response.facets ?? []).flatMap((facet) => facet.counts ?? []);
  const valueFor = (target: TargetTaxon) =>
    allCounts.find((entry) => Number(entry.name) === keys[target])?.count ?? 0;
  return {
    Plants: valueFor("Plants"),
    Fungi: valueFor("Fungi"),
    Birds: valueFor("Birds"),
    Insects: valueFor("Insects"),
  };
}

async function gbifWindow(
  polygon: [number, number][],
  start: Date,
  end: Date,
  keys: Record<TargetTaxon, number>,
) {
  const query = new URLSearchParams({
    geometry: polygonWkt(polygon),
    hasCoordinate: "true",
    hasGeospatialIssue: "false",
    occurrenceStatus: "PRESENT",
    eventDate: `${isoDate(start)},${isoDate(end)}`,
    limit: "0",
    facetLimit: "100",
  });
  query.append("basisOfRecord", "HUMAN_OBSERVATION");
  query.append("basisOfRecord", "MACHINE_OBSERVATION");
  query.append("basisOfRecord", "OBSERVATION");
  query.append("facet", "kingdomKey");
  query.append("facet", "classKey");
  const response = await fetchJson<GbifResponse>(
    `${GBIF_BASE}/occurrence/search?${query.toString()}`,
    86_400,
  );
  return { records: response.count, taxa: countsFromFacets(response, keys) };
}

async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  mapper: (value: T, index: number) => Promise<R>,
) {
  const results = new Array<R>(values.length);
  let cursor = 0;
  async function worker() {
    while (cursor < values.length) {
      const index = cursor++;
      results[index] = await mapper(values[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, worker));
  return results;
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

interface DailyWeather {
  time: string[];
  temperature_2m_max: number[];
  precipitation_sum?: number[];
  precipitation_probability_max?: number[];
  wind_speed_10m_max?: number[];
}

function monthRange(year: number, monthIndex: number) {
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 0));
  return { start, end };
}

async function climateAndSurveyWindows(latitude: number, longitude: number) {
  const now = new Date();
  const previousMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const currentRange = monthRange(previousMonth.getUTCFullYear(), previousMonth.getUTCMonth());
  const archiveStart = monthRange(previousMonth.getUTCFullYear() - 10, previousMonth.getUTCMonth()).start;
  const archiveUrl = `${ARCHIVE_BASE}/archive?latitude=${latitude}&longitude=${longitude}&start_date=${isoDate(archiveStart)}&end_date=${isoDate(currentRange.end)}&daily=temperature_2m_max,precipitation_sum&timezone=auto`;
  const forecastUrl = `${WEATHER_BASE}/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,precipitation_probability_max,wind_speed_10m_max&forecast_days=7&timezone=auto`;
  const [archive, forecast] = await Promise.all([
    fetchJson<{ daily: DailyWeather }>(archiveUrl, 86_400),
    fetchJson<{ daily: DailyWeather }>(forecastUrl, 3_600),
  ]);

  const currentYear = previousMonth.getUTCFullYear();
  const month = previousMonth.getUTCMonth();
  const groups = new Map<number, { temperatures: number[]; precipitation: number[] }>();
  archive.daily.time.forEach((dateString, index) => {
    const date = new Date(`${dateString}T00:00:00Z`);
    if (date.getUTCMonth() !== month) return;
    const group = groups.get(date.getUTCFullYear()) ?? { temperatures: [], precipitation: [] };
    group.temperatures.push(archive.daily.temperature_2m_max[index]);
    group.precipitation.push(archive.daily.precipitation_sum?.[index] ?? 0);
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
  const temperatureAnomaly = currentTemperature !== null && baselineTemperature !== null
    ? currentTemperature - baselineTemperature
    : null;
  const precipitationPercentile = currentPrecipitation !== null
    ? percentile(currentPrecipitation, baselines.map((value) => value.precipitation))
    : null;
  const monthLabel = new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(previousMonth);
  const summary = temperatureAnomaly === null || precipitationPercentile === null
    ? "Historical context is temporarily unavailable. Forecast timing is still shown when possible."
    : `${monthLabel} was ${Math.abs(temperatureAnomaly).toFixed(1)}°C ${temperatureAnomaly >= 0 ? "warmer" : "cooler"} than its 2016–2025 average, with precipitation at the ${precipitationPercentile}th percentile. This is context, not proof of ecological impact.`;
  const climate: ClimateContext = {
    comparisonMonth: monthLabel,
    temperatureAnomalyC: temperatureAnomaly === null ? null : Number(temperatureAnomaly.toFixed(1)),
    precipitationPercentile,
    currentTemperatureC: currentTemperature === null ? null : Number(currentTemperature.toFixed(1)),
    baselineTemperatureC: baselineTemperature === null ? null : Number(baselineTemperature.toFixed(1)),
    currentPrecipitationMm: currentPrecipitation === null ? null : Number(currentPrecipitation.toFixed(1)),
    baselinePrecipitationMm: baselinePrecipitation === null ? null : Number(baselinePrecipitation.toFixed(1)),
    summary,
  };

  const windows: SurveyWindow[] = forecast.daily.time.map((date, index) => {
    const temperature = forecast.daily.temperature_2m_max[index];
    const precipitation = forecast.daily.precipitation_probability_max?.[index] ?? 50;
    const wind = forecast.daily.wind_speed_10m_max?.[index] ?? 30;
    const temperaturePenalty = temperature < 5 ? (5 - temperature) * 4 : temperature > 30 ? (temperature - 30) * 4 : 0;
    const score = Math.round(Math.max(0, 100 - precipitation * 0.55 - wind * 0.8 - temperaturePenalty));
    return {
      date,
      score,
      temperatureMaxC: Math.round(temperature),
      precipitationProbability: Math.round(precipitation),
      windMaxKph: Math.round(wind),
      label: score >= 80 ? "Excellent" : score >= 65 ? "Good" : "Fair",
    };
  }).sort((a, b) => b.score - a.score).slice(0, 3);
  return { climate, windows };
}

export async function buildLiveAnalysis(input: {
  latitude: number;
  longitude: number;
  radiusKm: number;
  label: string;
}): Promise<HabitatAnalysis> {
  const now = new Date();
  const recentStart = shiftYears(now, -1);
  const priorStart = shiftYears(now, -4);
  const h3Cells = cellsForArea(input.latitude, input.longitude, input.radiusKm);
  const taxonKeys = await resolveTaxonKeys();
  const [rawCells, weather] = await Promise.all([
    mapWithConcurrency(h3Cells, 4, async (cell) => {
      const polygon = polygonForCell(cell);
      const [recent, prior] = await Promise.all([
        gbifWindow(polygon, recentStart, now, taxonKeys),
        gbifWindow(polygon, priorStart, recentStart, taxonKeys),
      ]);
      return {
        recentRecords: recent.records,
        priorRecords: prior.records,
        recentTaxa: recent.taxa,
        priorTaxa: prior.taxa,
        areaKm2: areaForCell(cell),
      };
    }),
    climateAndSurveyWindows(input.latitude, input.longitude),
  ]);
  const scored = scoreCells(rawCells);
  const totalPrior = rawCells.reduce((total, cell) => total + cell.priorRecords, 0);
  const comparableCells = rawCells.filter((cell) => cell.priorRecords >= 20).length;
  const rankingSuppressed = totalPrior < 50 || comparableCells < 3;
  const cells = h3Cells.map((cell, index) => {
    const result = scored[index];
    return {
      id: cell,
      polygon: polygonForCell(cell),
      center: centerForCell(cell),
      areaKm2: Number(rawCells[index].areaKm2.toFixed(2)),
      gapScore: rankingSuppressed ? null : result.gapScore,
      confidence: confidenceFor(rawCells[index].priorRecords),
      targetTaxon: result.targetTaxon,
      explanation: explainScore(result.metrics, result.targetTaxon),
      metrics: result.metrics,
    };
  }).sort((a, b) => (b.gapScore ?? 0) - (a.gapScore ?? 0));
  const fingerprint = createHash("sha1")
    .update(`${input.latitude.toFixed(4)}:${input.longitude.toFixed(4)}:${input.radiusKm}:${isoDate(now)}`)
    .digest("hex")
    .slice(0, 12);

  return {
    id: `${fingerprint}-${randomUUID().slice(0, 8)}`,
    area: input,
    generatedAt: now.toISOString(),
    dataStatus: "live",
    dataStatusMessage: "Live GBIF occurrence coverage and Open-Meteo weather context.",
    rankingSuppressed,
    rankingMessage: rankingSuppressed
      ? "Not enough comparable baseline records to rank cells responsibly. Every cell remains available for an exploratory mission."
      : "Scores rank observation coverage gaps, not habitat health or wildlife abundance.",
    cells,
    climate: weather.climate,
    surveyWindows: weather.windows,
    sources: {
      gbif: "https://www.gbif.org/",
      weather: "https://open-meteo.com/",
      basemap: "https://openfreemap.org/",
    },
  };
}

export function isNearWinnipeg(latitude: number, longitude: number) {
  return Math.abs(latitude - 49.8844) < 0.75 && Math.abs(longitude + 97.14704) < 1;
}
