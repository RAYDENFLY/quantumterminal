type RateLimitBucket = { count: number; resetAt: number };

// Very small in-memory rate limiter.
// NOTE: Works well for local/dev and single-instance deployments.
// On Vercel (serverless), instances are ephemeral so this is best-effort.
const globalAny = globalThis as any;
if (!globalAny.__qtRateLimit) {
  globalAny.__qtRateLimit = new Map<string, RateLimitBucket>();
}

const buckets: Map<string, RateLimitBucket> = globalAny.__qtRateLimit;

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (existing.count >= limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  buckets.set(key, existing);
  return { ok: true, remaining: Math.max(0, limit - existing.count), resetAt: existing.resetAt };
}
