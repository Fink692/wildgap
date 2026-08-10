import { NextRequest } from "next/server";
import type { GeocodeResult } from "@/lib/types";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 2 || query.length > 100) {
    return Response.json({ error: "Enter between 2 and 100 characters." }, { status: 400 });
  }
  try {
    const upstream = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`,
      { next: { revalidate: 86_400 }, signal: AbortSignal.timeout(5_000) },
    );
    if (!upstream.ok) throw new Error(`Geocoder returned ${upstream.status}`);
    const payload = (await upstream.json()) as {
      results?: Array<{
        id: number;
        name: string;
        latitude: number;
        longitude: number;
        country?: string;
        admin1?: string;
        timezone?: string;
      }>;
    };
    const results: GeocodeResult[] = (payload.results ?? []).map((result) => ({
      id: result.id,
      name: result.name,
      latitude: result.latitude,
      longitude: result.longitude,
      country: result.country ?? "",
      admin1: result.admin1,
      timezone: result.timezone,
    }));
    return Response.json({ results });
  } catch {
    return Response.json({ error: "Location search is temporarily unavailable." }, { status: 503 });
  }
}
