import { afterEach, describe, expect, it, vi } from "vitest";
import { buildLiveAnalysis } from "@/lib/environmental-data";

function json(value: unknown, status = 200, headers?: HeadersInit) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

function archiveDays() {
  const time: string[] = [];
  const temperature_2m_max: number[] = [];
  const precipitation_sum: number[] = [];
  for (let year = 2016; year <= 2026; year += 1) {
    for (let day = 1; day <= 31; day += 1) {
      time.push(`${year}-07-${String(day).padStart(2, "0")}`);
      temperature_2m_max.push(20 + (year - 2016) * 0.1);
      precipitation_sum.push(1);
    }
  }
  return { time, temperature_2m_max, precipitation_sum };
}

describe("live environmental analysis scheduling", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("keeps GBIF occurrence searches within the bounded request pool", async () => {
    let activeOccurrenceRequests = 0;
    let maximumOccurrenceRequests = 0;
    let occurrenceRequestCount = 0;
    let returnedTransientFailure = false;

    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("/species/match")) {
        const key = url.includes("Aves") ? 212 : url.includes("Insecta") ? 216 : url.includes("Plantae") ? 6 : 5;
        return json({ usageKey: key });
      }
      if (url.includes("/occurrence/search")) {
        occurrenceRequestCount += 1;
        activeOccurrenceRequests += 1;
        maximumOccurrenceRequests = Math.max(maximumOccurrenceRequests, activeOccurrenceRequests);
        await new Promise((resolve) => setTimeout(resolve, 2));
        activeOccurrenceRequests -= 1;
        if (!returnedTransientFailure) {
          returnedTransientFailure = true;
          return json({ error: "temporary" }, 503);
        }
        return json({
          count: 30,
          facets: [
            { field: "kingdomKey", counts: [{ name: "6", count: 10 }, { name: "5", count: 4 }] },
            { field: "classKey", counts: [{ name: "212", count: 8 }, { name: "216", count: 8 }] },
          ],
        });
      }
      if (url.includes("archive-api.open-meteo.com")) return json({ daily: archiveDays() });
      if (url.includes("api.open-meteo.com")) {
        return json({
          daily: {
            time: ["2026-08-11", "2026-08-12", "2026-08-13", "2026-08-14", "2026-08-15", "2026-08-16", "2026-08-17"],
            temperature_2m_max: [22, 23, 24, 25, 26, 21, 20],
            precipitation_probability_max: [10, 20, 30, 40, 15, 5, 25],
            wind_speed_10m_max: [10, 12, 14, 16, 11, 9, 13],
          },
        });
      }
      throw new Error(`Unexpected URL: ${url}`);
    }));

    const analysis = await buildLiveAnalysis({
      latitude: 49.8844,
      longitude: -97.14704,
      radiusKm: 5,
      label: "Winnipeg test",
    });

    expect(analysis.dataStatus).toBe("live");
    expect(analysis.cells).toHaveLength(7);
    expect(analysis.dataQuality).toEqual({ attemptedCells: 7, completeCells: 7, failedCellWindows: 0, weatherStatus: "complete" });
    expect(occurrenceRequestCount).toBe(15);
    expect(maximumOccurrenceRequests).toBeLessThanOrEqual(2);
    expect(maximumOccurrenceRequests).toBeGreaterThan(1);
  });

  it("returns an honest partial analysis when one cell window and weather are unavailable", async () => {
    let failedOccurrenceUrl = "";

    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("/species/match")) {
        const key = url.includes("Aves") ? 212 : url.includes("Insecta") ? 216 : url.includes("Plantae") ? 6 : 5;
        return json({ usageKey: key });
      }
      if (url.includes("/occurrence/search")) {
        if (!failedOccurrenceUrl) failedOccurrenceUrl = url;
        if (url === failedOccurrenceUrl) return json({ error: "rate limited" }, 429);
        return json({
          count: 30,
          facets: [
            { field: "kingdomKey", counts: [{ name: "6", count: 10 }, { name: "5", count: 4 }] },
            { field: "classKey", counts: [{ name: "212", count: 8 }, { name: "216", count: 8 }] },
          ],
        });
      }
      if (url.includes("open-meteo.com")) return json({ error: "temporary" }, 503);
      throw new Error(`Unexpected URL: ${url}`);
    }));

    const analysis = await buildLiveAnalysis({
      latitude: 51.50853,
      longitude: -0.12574,
      radiusKm: 2,
      label: "London test",
    });

    expect(analysis.dataStatus).toBe("live");
    expect(analysis.cells).toHaveLength(6);
    expect(analysis.dataQuality).toEqual({ attemptedCells: 7, completeCells: 6, failedCellWindows: 1, weatherStatus: "unavailable" });
    expect(analysis.dataStatusMessage).toContain("6 of 7 cells");
    expect(analysis.surveyWindows).toEqual([]);
    expect(analysis.climate.temperatureAnomalyC).toBeNull();
  });
});
