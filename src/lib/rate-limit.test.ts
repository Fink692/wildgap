import { beforeEach, describe, expect, it } from "vitest";
import { acquireLiveAnalysis, checkRateLimit, clientKey, releaseLiveAnalysis, resetRateLimitsForTests } from "@/lib/rate-limit";

describe("public API admission control", () => {
  beforeEach(resetRateLimitsForTests);

  it("uses the Cloudflare client address and falls back to the first forwarded address", () => {
    expect(clientKey(new Request("https://wildgap.test", { headers: { "CF-Connecting-IP": "203.0.113.7" } }))).toBe("203.0.113.7");
    expect(clientKey(new Request("https://wildgap.test", { headers: { "X-Forwarded-For": "198.51.100.2, 10.0.0.1" } }))).toBe("198.51.100.2");
  });

  it("returns a bounded retry interval after the per-client budget is exhausted", () => {
    expect(checkRateLimit("analysis", "client-a", 2, 60_000, 1_000).allowed).toBe(true);
    expect(checkRateLimit("analysis", "client-a", 2, 60_000, 1_001).allowed).toBe(true);
    expect(checkRateLimit("analysis", "client-a", 2, 60_000, 1_002)).toEqual({ allowed: false, retryAfterSeconds: 60 });
    expect(checkRateLimit("analysis", "client-b", 2, 60_000, 1_002).allowed).toBe(true);
  });

  it("caps concurrent live analyses and releases capacity", () => {
    expect(acquireLiveAnalysis(2)).toBe(true);
    expect(acquireLiveAnalysis(2)).toBe(true);
    expect(acquireLiveAnalysis(2)).toBe(false);
    releaseLiveAnalysis();
    expect(acquireLiveAnalysis(2)).toBe(true);
  });
});
