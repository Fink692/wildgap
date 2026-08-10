import type {
  CellMetrics,
  Confidence,
  TargetTaxon,
  TaxonCounts,
} from "@/lib/types";

export const TARGET_TAXA: TargetTaxon[] = [
  "Plants",
  "Fungi",
  "Birds",
  "Insects",
];

export function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function percentileRank(value: number, values: number[]) {
  if (values.length <= 1) return 0.5;
  const below = values.filter((candidate) => candidate < value).length;
  const equal = values.filter((candidate) => candidate === value).length;
  return (below + Math.max(0, equal - 1) / 2) / (values.length - 1);
}

export function confidenceFor(priorRecords: number): Confidence {
  if (priorRecords >= 100) return "High";
  if (priorRecords >= 20) return "Medium";
  return "Low";
}

export function chooseTargetTaxon(
  recent: TaxonCounts,
  prior: TaxonCounts,
  neighborhoodRecent: TaxonCounts,
): { target: TargetTaxon; targetGap: number } {
  const historicalGap = TARGET_TAXA.filter(
    (taxon) => prior[taxon] >= 3 && recent[taxon] === 0,
  ).sort((a, b) => prior[b] - prior[a]);

  if (historicalGap[0]) return { target: historicalGap[0], targetGap: 1 };

  const nearbyGap = TARGET_TAXA.filter(
    (taxon) => neighborhoodRecent[taxon] >= 10 && recent[taxon] <= 1,
  ).sort(
    (a, b) =>
      neighborhoodRecent[b] - recent[b] - (neighborhoodRecent[a] - recent[a]),
  );

  if (nearbyGap[0]) return { target: nearbyGap[0], targetGap: 0.5 };

  const leastObserved = [...TARGET_TAXA].sort(
    (a, b) => recent[a] - recent[b],
  )[0];
  return { target: leastObserved, targetGap: 0 };
}

interface RawCell {
  recentRecords: number;
  priorRecords: number;
  recentTaxa: TaxonCounts;
  priorTaxa: TaxonCounts;
  areaKm2: number;
}

export function scoreCells(rawCells: RawCell[]) {
  const recentDensities = rawCells.map(
    (cell) => Math.log1p(cell.recentRecords) / Math.max(cell.areaKm2, 0.1),
  );
  const neighborhoodRecent = rawCells.reduce<TaxonCounts>(
    (total, cell) => {
      for (const taxon of TARGET_TAXA) total[taxon] += cell.recentTaxa[taxon];
      return total;
    },
    { Plants: 0, Fungi: 0, Birds: 0, Insects: 0 },
  );

  return rawCells.map((cell, index) => {
    const annualizedPriorRecords = cell.priorRecords / 3;
    const densityGap = clamp(
      1 - percentileRank(recentDensities[index], recentDensities),
    );
    const coverageChange = clamp(
      1 - cell.recentRecords / (annualizedPriorRecords + 5),
    );
    const { target, targetGap } = chooseTargetTaxon(
      cell.recentTaxa,
      cell.priorTaxa,
      neighborhoodRecent,
    );
    const gapScore = Math.round(
      100 * (0.55 * densityGap + 0.3 * coverageChange + 0.15 * targetGap),
    );
    const metrics: CellMetrics = {
      recentRecords: cell.recentRecords,
      priorRecords: cell.priorRecords,
      annualizedPriorRecords: Math.round(annualizedPriorRecords),
      recentTaxa: cell.recentTaxa,
      priorTaxa: cell.priorTaxa,
      densityGap,
      coverageChange,
      targetGap,
    };

    return { gapScore, targetTaxon: target, metrics };
  });
}

export function explainScore(metrics: CellMetrics, target: TargetTaxon) {
  if (metrics.priorRecords < 20) {
    return `Only ${metrics.priorRecords} usable baseline records were found. Treat this as an exploratory ${target.toLowerCase()} survey, not a ranked ecological conclusion.`;
  }
  if (metrics.targetGap === 1) {
    return `${target} appeared in the earlier observation window but have no recent records here. A repeat survey can help close that monitoring gap.`;
  }
  if (metrics.coverageChange > 0.6) {
    return `Recent observation coverage is well below this cell's earlier annual rate. A ${target.toLowerCase()} survey would add timely evidence.`;
  }
  return `This cell has fewer recent records than nearby cells. Surveying ${target.toLowerCase()} would improve the area's spatial coverage.`;
}
