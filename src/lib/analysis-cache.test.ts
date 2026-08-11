import { beforeEach, describe, expect, it } from "vitest";
import { analysisCacheKey, getCachedAnalysis, resetAnalysisCacheForTests, setCachedAnalysis } from "@/lib/analysis-cache";
import { buildWinnipegSnapshot } from "@/lib/demo-snapshot";

describe("complete analysis cache", () => {
  beforeEach(resetAnalysisCacheForTests);

  it("reuses an identical public analysis within one hour", () => {
    const input = { latitude: 49.8844, longitude: -97.14704, radiusKm: 5, label: "Winnipeg" };
    const key = analysisCacheKey(input);
    const analysis = buildWinnipegSnapshot();
    setCachedAnalysis(key, analysis, 1_000);
    expect(getCachedAnalysis(key, 3_599_999)).toBe(analysis);
  });

  it("expires an analysis after one hour", () => {
    const key = "expired";
    setCachedAnalysis(key, buildWinnipegSnapshot(), 1_000);
    expect(getCachedAnalysis(key, 3_601_000)).toBeNull();
  });
});
