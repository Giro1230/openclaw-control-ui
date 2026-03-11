/**
 * 인메모리 슬라이딩 윈도우 rate limiter.
 * 단일 인스턴스 환경 적합. 멀티 인스턴스/엣지 환경은 Redis(Upstash) 사용 권장.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL_MS = 60_000;

// 만료된 항목 주기적 정리 (메모리 누수 방지)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetAt) store.delete(key);
    }
  }, CLEANUP_INTERVAL_MS);
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * IP/식별자 기반 rate limit 체크
 * @param key - IP 주소 또는 사용자 식별자
 * @param limit - 허용 횟수
 * @param windowMs - 윈도우 크기 (밀리초)
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || now > existing.resetAt) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
  };
}

/**
 * NextRequest에서 클라이언트 IP 추출
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}
