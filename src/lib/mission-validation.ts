import type { CellMetrics, Mission, SurveyWindow, TaxonCounts } from "@/lib/types";

const TAXA = new Set(["Plants", "Fungi", "Birds", "Insects"]);
const CONFIDENCE = new Set(["High", "Medium", "Low"]);
const DATA_STATUS = new Set(["live", "demo-snapshot"]);
const MISSION_STATUS = new Set(["planned", "completed"]);

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function boundedString(value: unknown, max: number, min = 1) {
  return typeof value === "string" && value.length >= min && value.length <= max ? value : null;
}

function boundedNumber(value: unknown, min: number, max: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max ? value : null;
}

function integer(value: unknown, min: number, max: number) {
  const parsed = boundedNumber(value, min, max);
  return parsed !== null && Number.isInteger(parsed) ? parsed : null;
}

function isoTimestamp(value: unknown) {
  const parsed = boundedString(value, 40);
  return parsed && Number.isFinite(Date.parse(parsed)) ? parsed : null;
}

function isoDate(value: unknown) {
  const parsed = boundedString(value, 10, 10);
  return parsed && /^\d{4}-\d{2}-\d{2}$/.test(parsed) && Number.isFinite(Date.parse(`${parsed}T00:00:00Z`)) ? parsed : null;
}

export function safeEvidenceUrl(value: unknown): string | null {
  const candidate = boundedString(value, 2_048);
  if (!candidate) return null;
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

function taxonCounts(value: unknown): TaxonCounts | null {
  const source = record(value);
  if (!source) return null;
  const Plants = integer(source.Plants, 0, 100_000_000);
  const Fungi = integer(source.Fungi, 0, 100_000_000);
  const Birds = integer(source.Birds, 0, 100_000_000);
  const Insects = integer(source.Insects, 0, 100_000_000);
  if ([Plants, Fungi, Birds, Insects].some((count) => count === null)) return null;
  return { Plants: Plants!, Fungi: Fungi!, Birds: Birds!, Insects: Insects! };
}

function cellMetrics(value: unknown): CellMetrics | null {
  const source = record(value);
  if (!source) return null;
  const recentRecords = integer(source.recentRecords, 0, 100_000_000);
  const priorRecords = integer(source.priorRecords, 0, 100_000_000);
  const annualizedPriorRecords = boundedNumber(source.annualizedPriorRecords, 0, 100_000_000);
  const recentTaxa = taxonCounts(source.recentTaxa);
  const priorTaxa = taxonCounts(source.priorTaxa);
  const densityGap = boundedNumber(source.densityGap, 0, 1);
  const coverageChange = boundedNumber(source.coverageChange, 0, 1);
  const targetGap = boundedNumber(source.targetGap, 0, 1);
  if (recentRecords === null || priorRecords === null || annualizedPriorRecords === null || !recentTaxa || !priorTaxa || densityGap === null || coverageChange === null || targetGap === null) return null;
  return { recentRecords, priorRecords, annualizedPriorRecords, recentTaxa, priorTaxa, densityGap, coverageChange, targetGap };
}

function surveyWindow(value: unknown): SurveyWindow | null {
  const source = record(value);
  if (!source) return null;
  const date = isoDate(source.date);
  const score = boundedNumber(source.score, 0, 100);
  const temperatureMaxC = boundedNumber(source.temperatureMaxC, -100, 100);
  const precipitationProbability = boundedNumber(source.precipitationProbability, 0, 100);
  const windMaxKph = boundedNumber(source.windMaxKph, 0, 500);
  const label = boundedString(source.label, 40);
  if (!date || score === null || temperatureMaxC === null || precipitationProbability === null || windMaxKph === null || !label) return null;
  return { date, score, temperatureMaxC, precipitationProbability, windMaxKph, label };
}

function polygon(value: unknown): [number, number][] | null {
  if (!Array.isArray(value) || value.length < 4 || value.length > 20) return null;
  const points: [number, number][] = [];
  for (const point of value) {
    if (!Array.isArray(point) || point.length !== 2) return null;
    const longitude = boundedNumber(point[0], -180, 180);
    const latitude = boundedNumber(point[1], -90, 90);
    if (longitude === null || latitude === null) return null;
    points.push([longitude, latitude]);
  }
  return points;
}

export function parseMission(value: unknown, expectedId?: string): Mission | null {
  const source = record(value);
  if (!source) return null;

  const id = boundedString(source.id, 80);
  const areaLabel = boundedString(source.areaLabel, 160);
  const latitude = boundedNumber(source.latitude, -90, 90);
  const longitude = boundedNumber(source.longitude, -180, 180);
  const h3Cell = boundedString(source.h3Cell, 32);
  const missionPolygon = polygon(source.polygon);
  const targetTaxon = typeof source.targetTaxon === "string" && TAXA.has(source.targetTaxon) ? source.targetTaxon as Mission["targetTaxon"] : null;
  const analysis = record(source.analysisSnapshot);
  const gapScore = analysis?.gapScore === null ? null : boundedNumber(analysis?.gapScore, 0, 100);
  const gapScoreValid = Boolean(analysis && "gapScore" in analysis && (analysis.gapScore === null || gapScore !== null));
  const confidence = typeof analysis?.confidence === "string" && CONFIDENCE.has(analysis.confidence) ? analysis.confidence as Mission["analysisSnapshot"]["confidence"] : null;
  const explanation = boundedString(analysis?.explanation, 1_000);
  const dataStatus = typeof analysis?.dataStatus === "string" && DATA_STATUS.has(analysis.dataStatus) ? analysis.dataStatus as Mission["analysisSnapshot"]["dataStatus"] : null;
  const generatedAt = isoTimestamp(analysis?.generatedAt);
  const metrics = analysis?.metrics === undefined ? undefined : cellMetrics(analysis.metrics);
  const window = source.surveyWindow === undefined ? undefined : surveyWindow(source.surveyWindow);
  const scheduledDate = isoDate(source.scheduledDate);
  const durationMinutes = integer(source.durationMinutes, 15, 240);
  const status = typeof source.status === "string" && MISSION_STATUS.has(source.status) ? source.status as Mission["status"] : null;
  const evidenceUrl = source.evidenceUrl === undefined ? undefined : safeEvidenceUrl(source.evidenceUrl);
  const createdAt = isoTimestamp(source.createdAt);
  const completedAt = source.completedAt === undefined ? undefined : isoTimestamp(source.completedAt);

  if (!id || (expectedId && id !== expectedId) || !areaLabel || latitude === null || longitude === null || !h3Cell || !missionPolygon || !targetTaxon || !analysis || !gapScoreValid || !confidence || !explanation || !dataStatus || !generatedAt || (analysis.metrics !== undefined && !metrics) || (source.surveyWindow !== undefined && !window) || !scheduledDate || durationMinutes === null || !status || (source.evidenceUrl !== undefined && !evidenceUrl) || !createdAt || (source.completedAt !== undefined && !completedAt)) return null;
  if (status === "completed" && !completedAt) return null;

  return {
    id,
    areaLabel,
    latitude,
    longitude,
    h3Cell,
    polygon: missionPolygon,
    targetTaxon,
    analysisSnapshot: { gapScore: gapScore!, confidence, explanation, dataStatus, generatedAt, metrics: metrics ?? undefined },
    surveyWindow: window ?? undefined,
    scheduledDate,
    durationMinutes,
    status,
    evidenceUrl: evidenceUrl ?? undefined,
    createdAt,
    completedAt: completedAt ?? undefined,
  };
}
