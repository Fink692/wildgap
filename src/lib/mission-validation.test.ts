import { describe, expect, it } from "vitest";
import { parseMission, safeEvidenceUrl } from "@/lib/mission-validation";
import { decodeMission, encodeMission, MAX_PORTABLE_MISSION_LENGTH } from "@/lib/portable-mission";
import type { Mission } from "@/lib/types";

const mission: Mission = {
  id: "76782843-5d8e-45fa-bd08-240fd3ed7627",
  areaLabel: "Winnipeg, Manitoba, Canada",
  latitude: 49.8844,
  longitude: -97.14704,
  h3Cell: "8726cc4d9ffffff",
  polygon: [[-97.2, 49.8], [-97.1, 49.8], [-97.1, 49.9], [-97.2, 49.8]],
  targetTaxon: "Insects",
  analysisSnapshot: {
    gapScore: 82,
    confidence: "High",
    explanation: "Recent observation coverage is lower than comparable nearby cells.",
    dataStatus: "demo-snapshot",
    generatedAt: "2026-08-10T18:00:00.000Z",
    metrics: {
      recentRecords: 12,
      priorRecords: 160,
      annualizedPriorRecords: 53.3,
      recentTaxa: { Plants: 4, Fungi: 1, Birds: 6, Insects: 1 },
      priorTaxa: { Plants: 60, Fungi: 15, Birds: 45, Insects: 40 },
      densityGap: 0.8,
      coverageChange: 0.7,
      targetGap: 0.9,
    },
  },
  surveyWindow: {
    date: "2026-08-12",
    score: 85,
    temperatureMaxC: 23,
    precipitationProbability: 15,
    windMaxKph: 18,
    label: "Excellent",
  },
  scheduledDate: "2026-08-12",
  durationMinutes: 60,
  status: "planned",
  isPublic: true,
  createdAt: "2026-08-10T18:05:00.000Z",
};

describe("mission trust-boundary validation", () => {
  it("round-trips a valid mission and binds it to the route identifier", () => {
    const encoded = encodeMission(mission);
    expect(decodeMission(encoded, mission.id)).toEqual(mission);
    expect(decodeMission(encoded, "different-route-id")).toBeNull();
  });

  it("rejects malformed, partial, and oversized portable state", () => {
    const partial = btoa(JSON.stringify({ id: mission.id }));
    expect(decodeMission(partial, mission.id)).toBeNull();
    expect(decodeMission("not+base64", mission.id)).toBeNull();
    expect(decodeMission("a".repeat(MAX_PORTABLE_MISSION_LENGTH + 1), mission.id)).toBeNull();
  });

  it("rejects unsafe evidence schemes at every deserialization boundary", () => {
    expect(safeEvidenceUrl("javascript:alert(1)")).toBeNull();
    expect(safeEvidenceUrl("https://www.inaturalist.org/observations/123")).toBe("https://www.inaturalist.org/observations/123");
    expect(parseMission({ ...mission, evidenceUrl: "data:text/html,unsafe" }, mission.id)).toBeNull();
  });

  it("rejects out-of-range field guidance", () => {
    expect(parseMission({ ...mission, latitude: 100 }, mission.id)).toBeNull();
    expect(parseMission({ ...mission, durationMinutes: 10_000 }, mission.id)).toBeNull();
  });
});
