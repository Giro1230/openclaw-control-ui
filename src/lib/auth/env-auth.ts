import { createHmac, timingSafeEqual } from "crypto";
import type { AppRole } from "@/types/rbac";

export interface EnvUser {
  email: string;
  role: AppRole;
}

const DEV_SECRET = "openclaw-dev-secret-CHANGE-IN-PRODUCTION";

/**
 * Parses the user list from environment variables.
 *
 * Multi-user:  AUTH_USERS=email:token:role,email2:token2:role2
 * Single-user: AUTH_EMAIL + AUTH_TOKEN + AUTH_ROLE (shorthand)
 */
function getEnvUsers(): Array<{ email: string; token: string; role: AppRole }> {
  const users: Array<{ email: string; token: string; role: AppRole }> = [];

  const multi = process.env.AUTH_USERS;
  if (multi) {
    for (const entry of multi.split(",")) {
      const parts = entry.trim().split(":");
      if (parts.length >= 2) {
        const email = parts[0].trim();
        const token = parts[1].trim();
        const r = parts[2]?.trim().toLowerCase();
        const role: AppRole =
          r === "viewer" || r === "admin" ? r : "operator";
        if (email && token) users.push({ email, token, role });
      }
    }
  }

  const email = process.env.AUTH_EMAIL?.trim();
  const token = process.env.AUTH_TOKEN?.trim();
  if (email && token) {
    const r = process.env.AUTH_ROLE?.trim().toLowerCase();
    const role: AppRole = r === "viewer" || r === "admin" ? r : "operator";
    users.push({ email, token, role });
  }

  return users;
}

/** Returns true when AUTH_USERS or AUTH_EMAIL/TOKEN are configured */
export function isEnvAuthEnabled(): boolean {
  return getEnvUsers().length > 0;
}

/**
 * Returns AUTH_SECRET. Logs a warning in production if the default value is used.
 * Allows the default in development for convenience.
 */
function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret === DEV_SECRET) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[SECURITY] AUTH_SECRET is set to the default value. " +
          "Replace it with a strong random string before deploying to production."
      );
    }
    return DEV_SECRET;
  }
  return secret;
}

/**
 * Validates email + token using timing-safe comparison to prevent timing attacks.
 * Returns the matched EnvUser or null.
 */
export function validateEnvCredentials(
  email: string,
  token: string
): EnvUser | null {
  const users = getEnvUsers();
  for (const u of users) {
    try {
      const emailBuf = Buffer.from(u.email);
      const inputEmailBuf = Buffer.from(email);
      const tokenBuf = Buffer.from(u.token);
      const inputTokenBuf = Buffer.from(token);

      const emailMatch =
        emailBuf.length === inputEmailBuf.length &&
        timingSafeEqual(emailBuf, inputEmailBuf);
      const tokenMatch =
        tokenBuf.length === inputTokenBuf.length &&
        timingSafeEqual(tokenBuf, inputTokenBuf);

      if (emailMatch && tokenMatch) {
        return { email: u.email, role: u.role };
      }
    } catch {
      // Length mismatch — safe to ignore
    }
  }
  return null;
}

// --- Session signing (Node.js crypto) ---

export const SESSION_COOKIE = "__openclaw_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/** Creates a signed base64 session token from an EnvUser */
export function createSessionToken(user: EnvUser): string {
  const payload = JSON.stringify({
    email: user.email,
    role: user.role,
    exp: Date.now() + SESSION_TTL_MS,
  });
  const sig = createHmac("sha256", getSecret())
    .update(payload)
    .digest("hex");
  return Buffer.from(JSON.stringify({ payload, sig })).toString("base64");
}

/** Verifies a signed session token. Returns the EnvUser if valid, or null. */
export function verifySessionToken(token: string): EnvUser | null {
  try {
    const raw = Buffer.from(token, "base64").toString("utf-8");
    const { payload, sig } = JSON.parse(raw) as {
      payload: string;
      sig: string;
    };
    const expected = createHmac("sha256", getSecret())
      .update(payload)
      .digest("hex");

    // Timing-safe signature comparison
    const sigBuf = Buffer.from(sig, "hex");
    const expectedBuf = Buffer.from(expected, "hex");
    if (
      sigBuf.length !== expectedBuf.length ||
      !timingSafeEqual(sigBuf, expectedBuf)
    ) {
      return null;
    }

    const { email, role, exp } = JSON.parse(payload) as {
      email: string;
      role: AppRole;
      exp: number;
    };
    if (Date.now() > exp) return null;
    return { email, role };
  } catch {
    return null;
  }
}
