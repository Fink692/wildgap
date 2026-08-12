import { describe, expect, it } from "vitest";
import { rankSurveyWindows } from "@/lib/weather";

describe("rankSurveyWindows", () => {
  it("ranks the safest comfortable days and returns only three", () => {
    const windows = rankSurveyWindows({
      time: ["2026-08-12", "2026-08-13", "2026-08-14", "2026-08-15"],
      temperature_2m_max: [22, 40, 18, 25],
      precipitation_probability_max: [5, 0, 90, 20],
      wind_speed_10m_max: [8, 5, 10, 12],
    });

    expect(windows).toHaveLength(3);
    expect(windows[0]).toMatchObject({ date: "2026-08-12", label: "Excellent" });
    expect(windows.map((window) => window.date)).not.toContain("2026-08-14");
  });
});
