interface RateBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateBucket>();
const MAX_BUCKETS = 5_000;
let activeLiveAnalyses = 0;

function prune(now: number) {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  while (buckets.size >= MAX_BUCKETS) {
    const oldest = buckets.keys().next().value as string | undefined;
    if (!oldest) break;
    buckets.delete(oldest);
  }
}

export function clientKey(request: Request) {
  const cloudflare = request.headers.get("cf-connecting-ip")?.trim();
  if (cloudflare) return cloudflare.slice(0, 80);
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (forwarded || "unknown-client").slice(0, 80);
}

export function checkRateLimit(namespace: string, key: string, limit: number, windowMs: number, now = Date.now()) {
  prune(now);
  const bucketKey = `${namespace}:${key}`;
  const current = buckets.get(bucketKey);
  if (!current || current.resetAt <= now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (current.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1_000)) };
  }
  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function acquireLiveAnalysis(maxConcurrent = 3) {
  if (activeLiveAnalyses >= maxConcurrent) return false;
  activeLiveAnalyses += 1;
  return true;
}

export function releaseLiveAnalysis() {
  activeLiveAnalyses = Math.max(0, activeLiveAnalyses - 1);
}

export function resetRateLimitsForTests() {
  buckets.clear();
  activeLiveAnalyses = 0;
}
