import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  validateEnvCredentials,
  createSessionToken,
  verifySessionToken,
  isEnvAuthEnabled,
} from "@/lib/auth/env-auth";

describe("isEnvAuthEnabled", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.AUTH_USERS;
    delete process.env.AUTH_EMAIL;
    delete process.env.AUTH_TOKEN;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("AUTH_USERS 설정 시 true 반환", () => {
    process.env.AUTH_USERS = "test@example.com:secret:operator";
    expect(isEnvAuthEnabled()).toBe(true);
  });

  it("AUTH_EMAIL + AUTH_TOKEN 설정 시 true 반환", () => {
    process.env.AUTH_EMAIL = "test@example.com";
    process.env.AUTH_TOKEN = "my-token";
    expect(isEnvAuthEnabled()).toBe(true);
  });

  it("환경변수 없으면 false 반환", () => {
    expect(isEnvAuthEnabled()).toBe(false);
  });
});

describe("validateEnvCredentials", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.AUTH_USERS = "admin@test.com:correct-token:admin,viewer@test.com:view-token:viewer";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("올바른 이메일/토큰 쌍 반환 EnvUser", () => {
    const user = validateEnvCredentials("admin@test.com", "correct-token");
    expect(user).not.toBeNull();
    expect(user?.email).toBe("admin@test.com");
    expect(user?.role).toBe("admin");
  });

  it("viewer 역할 사용자 인증 성공", () => {
    const user = validateEnvCredentials("viewer@test.com", "view-token");
    expect(user).not.toBeNull();
    expect(user?.role).toBe("viewer");
  });

  it("잘못된 토큰 시 null 반환", () => {
    const user = validateEnvCredentials("admin@test.com", "wrong-token");
    expect(user).toBeNull();
  });

  it("존재하지 않는 이메일 시 null 반환", () => {
    const user = validateEnvCredentials("nobody@test.com", "correct-token");
    expect(user).toBeNull();
  });

  it("빈 문자열 이메일 시 null 반환", () => {
    const user = validateEnvCredentials("", "correct-token");
    expect(user).toBeNull();
  });

  it("timing-safe 비교 - 다른 길이의 토큰도 안전하게 처리", () => {
    const user = validateEnvCredentials("admin@test.com", "a");
    expect(user).toBeNull();
  });
});

describe("createSessionToken / verifySessionToken", () => {
  it("생성한 토큰을 검증하면 EnvUser 반환", () => {
    const user = { email: "test@example.com", role: "operator" as const };
    const token = createSessionToken(user);
    const verified = verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.email).toBe(user.email);
    expect(verified?.role).toBe(user.role);
  });

  it("admin 역할 토큰 정상 처리", () => {
    const user = { email: "admin@example.com", role: "admin" as const };
    const token = createSessionToken(user);
    const verified = verifySessionToken(token);
    expect(verified?.role).toBe("admin");
  });

  it("변조된 토큰 검증 실패 → null 반환", () => {
    const user = { email: "test@example.com", role: "operator" as const };
    const token = createSessionToken(user);
    // base64 디코딩 후 페이로드 변조
    const tampered = token.slice(0, -5) + "XXXXX";
    const verified = verifySessionToken(tampered);
    expect(verified).toBeNull();
  });

  it("완전히 잘못된 토큰 → null 반환", () => {
    expect(verifySessionToken("not-a-valid-token")).toBeNull();
  });

  it("빈 토큰 → null 반환", () => {
    expect(verifySessionToken("")).toBeNull();
  });

  it("base64이지만 내용이 올바르지 않은 토큰 → null 반환", () => {
    const fakeToken = Buffer.from(JSON.stringify({ payload: "{}", sig: "badhex" })).toString("base64");
    expect(verifySessionToken(fakeToken)).toBeNull();
  });
});
