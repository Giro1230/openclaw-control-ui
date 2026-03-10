import { createHmac } from "crypto";
import type { AppRole } from "@/types/rbac";

export interface EnvUser {
  email: string;
  role: AppRole;
}

/**
 * env에서 사용자 목록 파싱.
 *
 * 다중 사용자: AUTH_USERS=email:token:role,email2:token2:role2
 * 단일 사용자: AUTH_EMAIL + AUTH_TOKEN + AUTH_ROLE (단축 설정)
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

/** AUTH_USERS 또는 AUTH_EMAIL/TOKEN 이 설정된 경우 true */
export function isEnvAuthEnabled(): boolean {
  return getEnvUsers().length > 0;
}

/** 이메일 + 토큰 검증. 일치하면 EnvUser 반환, 아니면 null. */
export function validateEnvCredentials(
  email: string,
  token: string
): EnvUser | null {
  const match = getEnvUsers().find(
    (u) => u.email === email && u.token === token
  );
  return match ? { email: match.email, role: match.role } : null;
}

// --- 세션 서명 (Node.js crypto) ---

const SESSION_COOKIE = "__openclaw_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7일

function getSecret(): string {
  return (
    process.env.AUTH_SECRET ??
    "openclaw-dev-secret-CHANGE-IN-PRODUCTION"
  );
}

/** EnvUser → 서명된 base64 세션 토큰 생성 */
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

/** 서명된 세션 토큰 검증. 유효하면 EnvUser, 아니면 null. */
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
    if (sig !== expected) return null;

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

export { SESSION_COOKIE };
