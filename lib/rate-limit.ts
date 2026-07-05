// Lightweight in-memory rate limiter.
//
// This lives in the server process's memory, so it works well for a single
// instance (the default on Vercel/Render free tiers and typical small
// deploys). If you ever scale to multiple instances, each would keep its own
// counter -- at that point, move this to a shared store like Upstash Redis.
// For preventing casual spam of the submission queue, in-memory is enough.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Occasionally sweep expired buckets so the Map doesn't grow unbounded.
let lastSweep = Date.now();
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
}

// Returns { allowed: true } or { allowed: false, retryAfterSeconds }.
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (existing.count < limit) {
    existing.count += 1;
    return { allowed: true };
  }

  return {
    allowed: false,
    retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
  };
}

// Best-effort client IP from common proxy headers (Vercel sets these).
export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
