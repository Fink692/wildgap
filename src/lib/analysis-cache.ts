import type { HabitatAnalysis } from "@/lib/types";

interface CacheEntry {
  analysis: HabitatAnalysis;
  expiresAt: number;
}

const entries = new Map<string, CacheEntry>();
const MAX_ENTRIES = 100;
const CACHE_TTL_MS = 60 * 60 * 1_000;

export function analysisCacheKey(input: {
  latitude: number;
  longitude: number;
  radiusKm: number;
  label: string;
}) {
  return [input.latitude.toFixed(5), input.longitude.toFixed(5), input.radiusKm].join(":");
}

export function getCachedAnalysis(key: string, now = Date.now()) {
  const entry = entries.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= now) {
    entries.delete(key);
    return null;
  }
  entries.delete(key);
  entries.set(key, entry);
  return entry.analysis;
}

export function setCachedAnalysis(key: string, analysis: HabitatAnalysis, now = Date.now()) {
  entries.delete(key);
  entries.set(key, { analysis, expiresAt: now + CACHE_TTL_MS });
  while (entries.size > MAX_ENTRIES) {
    const oldest = entries.keys().next().value as string | undefined;
    if (!oldest) break;
    entries.delete(oldest);
  }
}

export function resetAnalysisCacheForTests() {
  entries.clear();
}
