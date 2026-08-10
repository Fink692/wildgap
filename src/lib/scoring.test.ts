import { describe, expect, it } from "vitest";
import { chooseTargetTaxon, confidenceFor, percentileRank, scoreCells } from "@/lib/scoring";
import type { TaxonCounts } from "@/lib/types";

const empty: TaxonCounts = { Plants: 0, Fungi: 0, Birds: 0, Insects: 0 };

describe("WildGap scoring", () => {
  it("assigns documented confidence thresholds", () => {
    expect(confidenceFor(19)).toBe("Low");
    expect(confidenceFor(20)).toBe("Medium");
    expect(confidenceFor(99)).toBe("Medium");
    expect(confidenceFor(100)).toBe("High");
  });

  it("ranks low-density cells above high-density cells", () => {
    const result = scoreCells([
      { recentRecords: 2, priorRecords: 150, recentTaxa: empty, priorTaxa: { ...empty, Insects: 20 }, areaKm2: 10 },
      { recentRecords: 100, priorRecords: 300, recentTaxa: { ...empty, Insects: 40 }, priorTaxa: { ...empty, Insects: 100 }, areaKm2: 10 },
      { recentRecords: 40, priorRecords: 160, recentTaxa: { ...empty, Birds: 15 }, priorTaxa: { ...empty, Birds: 50 }, areaKm2: 10 },
    ]);
    expect(result[0].gapScore).toBeGreaterThan(result[1].gapScore);
  });

  it("targets a historically present group with no recent record", () => {
    expect(chooseTargetTaxon(empty, { ...empty, Fungi: 8 }, { ...empty, Fungi: 25 })).toEqual({ target: "Fungi", targetGap: 1 });
  });

  it("keeps percentile ranks bounded", () => {
    expect(percentileRank(1, [1, 2, 3])).toBeGreaterThanOrEqual(0);
    expect(percentileRank(3, [1, 2, 3])).toBeLessThanOrEqual(1);
  });
});
