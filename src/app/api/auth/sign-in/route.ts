import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  isEnvAuthEnabled,
  validateEnvCredentials,
  createSessionToken,
  SESSION_COOKIE,
} from "@/lib/auth/env-auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * POST /api/auth/sign-in
 * body: { email: string; password: string }
 *
 * 우선순위:
 *  1. Supabase 설정 시 → Supabase 이메일/비밀번호 인증
 *  2. AUTH_USERS / AUTH_EMAIL+TOKEN env 설정 시 → env 토큰 매칭
 */
export async function POST(request: NextRequest) {
  // IP당 10분에 10회 제한
  const ip = getClientIp(request.headers);
  const rl = checkRateLimit(`sign-in:${ip}`, 10, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "too_many_requests", message: "잠시 후 다시 시도해주세요." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { email, password } = body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return NextResponse.json(
      { error: "email과 password(token)은 필수입니다." },
      { status: 400 }
    );
  }

  // ── 1. Supabase 인증 ──────────────────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
      return NextResponse.json({
        user: { id: data.user.id, email: data.user.email },
      });
    } catch {
      // Supabase 설정 오류 시 아래로 폴백
    }
  }

  // ── 2. env 토큰 인증 ─────────────────────────────────────────────
  if (isEnvAuthEnabled()) {
    const user = validateEnvCredentials(email, password);
    if (!user) {
      return NextResponse.json(
        { error: "이메일 또는 토큰이 올바르지 않습니다." },
        { status: 401 }
      );
    }

    const sessionToken = createSessionToken(user);
    const res = NextResponse.json({
      user: { email: user.email, role: user.role },
    });
    res.cookies.set(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });
    return res;
  }

  // ── 3. 인증 수단 없음 ────────────────────────────────────────────
  return NextResponse.json(
    {
      error: "인증 수단이 설정되지 않았습니다. AUTH_USERS 또는 Supabase를 설정하세요.",
    },
    { status: 503 }
  );
}
