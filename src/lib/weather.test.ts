import { afterEach, describe, expect, it, vi } from "vitest";
import { recoverWeather, rankSurveyWindows } from "@/lib/weather";
import { buildWinnipegSnapshot } from "@/lib/demo-snapshot";

describe("rankSurveyWindows", () => {
  afterEach(() => vi.unstubAllGlobals());

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

  it("recovers climate context and forecast windows when server-side weather is unavailable", async () => {
    const analysis = buildWinnipegSnapshot(5);
    analysis.dataQuality.weatherStatus = "unavailable";
    analysis.surveyWindows = [];
    const now = new Date();
    const previousMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const history = { time: [] as string[], temperature_2m_max: [] as number[], precipitation_sum: [] as number[] };
    for (let year = previousMonth.getUTCFullYear() - 10; year <= previousMonth.getUTCFullYear(); year += 1) {
      history.time.push(new Date(Date.UTC(year, previousMonth.getUTCMonth(), 15)).toISOString().slice(0, 10));
      history.temperature_2m_max.push(year === previousMonth.getUTCFullYear() ? 25 : 20);
      history.precipitation_sum.push(year === previousMonth.getUTCFullYear() ? 2 : 1);
    }
    vi.stubGlobal("fetch", async (input: string | URL | Request) => {
      const daily = String(input).includes("archive-api") ? history : {
        time: ["2026-08-12", "2026-08-13", "2026-08-14"],
        temperature_2m_max: [22, 24, 26],
        precipitation_probability_max: [5, 20, 60],
        wind_speed_10m_max: [8, 10, 12],
      };
      return new Response(JSON.stringify({ daily }), { status: 200 });
    });

    const recovered = await recoverWeather(analysis);
    expect(recovered.dataQuality.weatherStatus).toBe("complete");
    expect(recovered.surveyWindows).toHaveLength(3);
    expect(recovered.climate.temperatureAnomalyC).toBe(5);
    expect(recovered.dataStatusMessage).toContain("recovered directly");
  });

  it("keeps the honest manual-date fallback when browser recovery fails", async () => {
    const analysis = buildWinnipegSnapshot(5);
    analysis.dataQuality.weatherStatus = "unavailable";
    analysis.surveyWindows = [];
    vi.stubGlobal("fetch", async () => new Response("unavailable", { status: 503 }));

    expect(await recoverWeather(analysis)).toBe(analysis);
  });
});
