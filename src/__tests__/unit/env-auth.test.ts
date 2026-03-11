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

  it("returns true when AUTH_USERS is set", () => {
    process.env.AUTH_USERS = "test@example.com:secret:operator";
    expect(isEnvAuthEnabled()).toBe(true);
  });

  it("returns true when AUTH_EMAIL + AUTH_TOKEN are set", () => {
    process.env.AUTH_EMAIL = "test@example.com";
    process.env.AUTH_TOKEN = "my-token";
    expect(isEnvAuthEnabled()).toBe(true);
  });

  it("returns false when no env vars are set", () => {
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

  it("returns EnvUser for correct email/token pair", () => {
    const user = validateEnvCredentials("admin@test.com", "correct-token");
    expect(user).not.toBeNull();
    expect(user?.email).toBe("admin@test.com");
    expect(user?.role).toBe("admin");
  });

  it("authenticates viewer role user", () => {
    const user = validateEnvCredentials("viewer@test.com", "view-token");
    expect(user).not.toBeNull();
    expect(user?.role).toBe("viewer");
  });

  it("returns null for wrong token", () => {
    const user = validateEnvCredentials("admin@test.com", "wrong-token");
    expect(user).toBeNull();
  });

  it("returns null for unknown email", () => {
    const user = validateEnvCredentials("nobody@test.com", "correct-token");
    expect(user).toBeNull();
  });

  it("returns null for empty email", () => {
    const user = validateEnvCredentials("", "correct-token");
    expect(user).toBeNull();
  });

  it("handles different-length tokens safely (no timing side-channel)", () => {
    const user = validateEnvCredentials("admin@test.com", "a");
    expect(user).toBeNull();
  });
});

describe("createSessionToken / verifySessionToken", () => {
  it("round-trips EnvUser through token creation and verification", () => {
    const user = { email: "test@example.com", role: "operator" as const };
    const token = createSessionToken(user);
    const verified = verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.email).toBe(user.email);
    expect(verified?.role).toBe(user.role);
  });

  it("handles admin role correctly", () => {
    const user = { email: "admin@example.com", role: "admin" as const };
    const token = createSessionToken(user);
    const verified = verifySessionToken(token);
    expect(verified?.role).toBe("admin");
  });

  it("returns null for tampered token", () => {
    const user = { email: "test@example.com", role: "operator" as const };
    const token = createSessionToken(user);
    const tampered = token.slice(0, -5) + "XXXXX";
    const verified = verifySessionToken(tampered);
    expect(verified).toBeNull();
  });

  it("returns null for completely invalid token", () => {
    expect(verifySessionToken("not-a-valid-token")).toBeNull();
  });

  it("returns null for empty token", () => {
    expect(verifySessionToken("")).toBeNull();
  });

  it("returns null for valid base64 with invalid contents", () => {
    const fakeToken = Buffer.from(JSON.stringify({ payload: "{}", sig: "badhex" })).toString("base64");
    expect(verifySessionToken(fakeToken)).toBeNull();
  });
});
