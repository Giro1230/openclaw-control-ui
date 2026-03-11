import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("첫 요청은 항상 허용", () => {
    const result = checkRateLimit("test-key-1", 5, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("limit 이하의 요청 모두 허용", () => {
    const key = "test-key-2";
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit(key, 5, 60_000);
      expect(result.allowed).toBe(true);
    }
  });

  it("limit 초과 시 요청 거부", () => {
    const key = "test-key-3";
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key, 5, 60_000);
    }
    const result = checkRateLimit(key, 5, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("윈도우 만료 후 카운트 리셋", () => {
    const key = "test-key-4";
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key, 5, 60_000);
    }
    // 거부 확인
    expect(checkRateLimit(key, 5, 60_000).allowed).toBe(false);

    // 윈도우 시간 경과
    vi.advanceTimersByTime(61_000);

    // 리셋 후 다시 허용
    const result = checkRateLimit(key, 5, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("서로 다른 키는 독립적으로 동작", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit("key-a", 5, 60_000);
    }
    // key-a 는 소진됐지만 key-b 는 독립적
    const result = checkRateLimit("key-b", 5, 60_000);
    expect(result.allowed).toBe(true);
  });
});

describe("getClientIp", () => {
  it("x-forwarded-for 헤더에서 첫 번째 IP 추출", () => {
    const headers = new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
    expect(getClientIp(headers)).toBe("1.2.3.4");
  });

  it("x-real-ip 헤더 폴백", () => {
    const headers = new Headers({ "x-real-ip": "9.10.11.12" });
    expect(getClientIp(headers)).toBe("9.10.11.12");
  });

  it("IP 헤더 없으면 unknown 반환", () => {
    const headers = new Headers();
    expect(getClientIp(headers)).toBe("unknown");
  });
});
