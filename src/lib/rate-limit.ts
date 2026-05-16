// src/lib/rate-limit.ts
// In-memory IP rate limiter. Works for single-instance and warm serverless functions.
// At scale, swap the Map for Upstash Redis — same interface.

import { NextRequest, NextResponse } from "next/server";

type Bucket = { hits: number[]; };
const buckets = new Map<string, Bucket>();

export function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export type RateLimitResult =
  | { ok: true; remaining: number; resetMs: number }
  | { ok: false; resetMs: number };

export function rateLimit(opts: {
  key: string;            // unique per-endpoint key, e.g. "signup"
  ip: string;             // client IP
  limit: number;          // max requests
  windowMs: number;       // rolling window
}): RateLimitResult {
  const fullKey = `${opts.key}:${opts.ip}`;
  const now = Date.now();
  const cutoff = now - opts.windowMs;

  let b = buckets.get(fullKey);
  if (!b) { b = { hits: [] }; buckets.set(fullKey, b); }

  // Drop old hits
  b.hits = b.hits.filter((t) => t > cutoff);

  if (b.hits.length >= opts.limit) {
    const oldest = b.hits[0]!;
    return { ok: false, resetMs: oldest + opts.windowMs - now };
  }

  b.hits.push(now);
  // Cheap GC: prune empty/old buckets occasionally
  if (buckets.size > 5000 && Math.random() < 0.05) {
    for (const [k, v] of Array.from(buckets.entries())) {
      v.hits = v.hits.filter((t) => t > cutoff);
      if (v.hits.length === 0) buckets.delete(k);
    }
  }

  return { ok: true, remaining: opts.limit - b.hits.length, resetMs: opts.windowMs };
}

// Convenience: returns 429 response or null to continue.
export function enforceRateLimit(req: NextRequest, opts: { key: string; limit: number; windowMs: number; }): NextResponse | null {
  const ip = getClientIp(req);
  const result = rateLimit({ ...opts, ip });
  if (result.ok) return null;
  const retryAfter = Math.ceil(result.resetMs / 1000);
  return NextResponse.json(
    { error: `Too many requests. Try again in ${Math.max(retryAfter, 1)}s.` },
    { status: 429, headers: { "Retry-After": String(Math.max(retryAfter, 1)) } },
  );
}
