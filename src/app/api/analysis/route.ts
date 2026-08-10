import { NextRequest } from "next/server";
import { buildWinnipegSnapshot } from "@/lib/demo-snapshot";
import { buildLiveAnalysis, isNearWinnipeg } from "@/lib/environmental-data";

export const maxDuration = 60;

function validCoordinate(value: number, min: number, max: number) {
  return Number.isFinite(value) && value >= min && value <= max;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const latitude = Number(params.get("lat"));
  const longitude = Number(params.get("lng"));
  const radiusKm = Number(params.get("radiusKm") ?? 5);
  const label = (params.get("label") ?? "Selected area").slice(0, 120);
  const forceDemo = params.get("demo") === "1";

  if (!validCoordinate(latitude, -90, 90) || !validCoordinate(longitude, -180, 180) || ![2, 5, 10].includes(radiusKm)) {
    return Response.json(
      { error: "Use valid latitude/longitude values and a radiusKm of 2, 5, or 10." },
      { status: 400 },
    );
  }

  if (forceDemo && isNearWinnipeg(latitude, longitude)) {
    return Response.json(buildWinnipegSnapshot(radiusKm), {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  }

  try {
    const analysis = await buildLiveAnalysis({ latitude, longitude, radiusKm, label });
    return Response.json(analysis, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (error) {
    console.error("WildGap live analysis failed", error);
    if (isNearWinnipeg(latitude, longitude)) {
      return Response.json(buildWinnipegSnapshot(radiusKm), {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
          "X-WildGap-Fallback": "winnipeg-snapshot",
        },
      });
    }
    return Response.json(
      {
        error: "Live environmental sources did not respond in time. No estimates were substituted; please retry.",
        detail: error instanceof Error ? error.message : "Unknown upstream failure",
      },
      { status: 503, headers: { "Retry-After": "30" } },
    );
  }
}
