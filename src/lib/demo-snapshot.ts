import { randomUUID } from "node:crypto";
import { areaForCell, cellsForArea, centerForCell, polygonForCell } from "@/lib/geo";
import { confidenceFor, explainScore, scoreCells } from "@/lib/scoring";
import type { HabitatAnalysis, TaxonCounts } from "@/lib/types";

const FIXTURE_COUNTS = [
  [182, 530],
  [48, 315],
  [96, 280],
  [22, 190],
  [68, 402],
  [10, 115],
  [35, 245],
] as const;

function taxa(total: number, seed: number): TaxonCounts {
  return {
    Plants: Math.round(total * (0.25 + (seed % 3) * 0.03)),
    Fungi: Math.round(total * (0.03 + (seed % 2) * 0.02)),
    Birds: Math.round(total * (0.48 - (seed % 3) * 0.03)),
    Insects: Math.round(total * 0.14),
  };
}

export function buildWinnipegSnapshot(radiusKm = 5): HabitatAnalysis {
  const latitude = 49.8844;
  const longitude = -97.14704;
  const h3Cells = cellsForArea(latitude, longitude, radiusKm);
  const raw = h3Cells.map((cell, index) => {
    const [recentRecords, priorRecords] = FIXTURE_COUNTS[index % FIXTURE_COUNTS.length];
    return {
      recentRecords,
      priorRecords,
      recentTaxa: taxa(recentRecords, index),
      priorTaxa: taxa(priorRecords, index + 2),
      areaKm2: areaForCell(cell),
    };
  });
  const scored = scoreCells(raw);
  const rankingSuppressed = raw.reduce((sum, cell) => sum + cell.priorRecords, 0) < 50;

  const cells = h3Cells.map((cell, index) => {
    const result = scored[index];
    return {
      id: cell,
      polygon: polygonForCell(cell),
      center: centerForCell(cell),
      areaKm2: Number(raw[index].areaKm2.toFixed(2)),
      gapScore: rankingSuppressed ? null : result.gapScore,
      confidence: confidenceFor(raw[index].priorRecords),
      targetTaxon: result.targetTaxon,
      explanation: explainScore(result.metrics, result.targetTaxon),
      metrics: result.metrics,
    };
  });

  return {
    id: randomUUID(),
    area: { label: "Winnipeg, Manitoba, Canada", latitude, longitude, radiusKm },
    generatedAt: "2026-08-10T12:00:00.000Z",
    sourceTimestamps: {
      gbif: "2026-08-10T12:00:00.000Z",
      weather: "2026-08-10T12:00:00.000Z",
    },
    dataStatus: "demo-snapshot",
    dataStatusMessage:
      "Clearly labeled demo snapshot from August 10, 2026. Retry to request live sources.",
    dataQuality: {
      attemptedCells: h3Cells.length,
      completeCells: h3Cells.length,
      failedCellWindows: 0,
      weatherStatus: "complete",
    },
    rankingSuppressed,
    rankingMessage: rankingSuppressed
      ? "Not enough comparable baseline records to rank cells responsibly."
      : "Scores rank observation coverage gaps, not habitat health or wildlife abundance.",
    cells: cells.sort((a, b) => (b.gapScore ?? 0) - (a.gapScore ?? 0)),
    climate: {
      comparisonMonth: "July 2026",
      temperatureAnomalyC: 1.2,
      precipitationPercentile: 30,
      currentTemperatureC: 24.1,
      baselineTemperatureC: 22.9,
      currentPrecipitationMm: 46,
      baselinePrecipitationMm: 68,
      summary:
        "The snapshot shows a warmer, drier July than the 2016–2025 comparison. This is field context, not proof of ecological impact.",
    },
    surveyWindows: [
      { date: "2026-08-12", score: 93, temperatureMaxC: 25, precipitationProbability: 10, windMaxKph: 14, label: "Excellent" },
      { date: "2026-08-14", score: 84, temperatureMaxC: 23, precipitationProbability: 20, windMaxKph: 18, label: "Good" },
      { date: "2026-08-15", score: 75, temperatureMaxC: 27, precipitationProbability: 25, windMaxKph: 21, label: "Fair" },
    ],
    sources: {
      gbif: "https://www.gbif.org/",
      weather: "https://open-meteo.com/",
      basemap: "https://openfreemap.org/",
    },
  };
}
