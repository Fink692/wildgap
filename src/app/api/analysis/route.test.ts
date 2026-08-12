import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/analysis/route";

describe("GET /api/analysis", () => {
  it("rejects invalid coordinates", async () => {
    const response = await GET(new NextRequest("http://localhost/api/analysis?lat=999&lng=0&radiusKm=5"));
    expect(response.status).toBe(400);
  });

  it("returns the explicit Winnipeg demo snapshot without external calls", async () => {
    const response = await GET(new NextRequest("http://localhost/api/analysis?lat=49.8844&lng=-97.14704&radiusKm=5&demo=1"));
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.dataStatus).toBe("demo-snapshot");
    expect(payload.cells).toHaveLength(7);
    expect(response.headers.get("X-WildGap-Cache")).toBe("SNAPSHOT");
  });
});
