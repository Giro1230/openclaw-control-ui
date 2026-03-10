import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SESSION_COOKIE } from "@/lib/auth/env-auth";

/**
 * POST /api/auth/sign-out
 * Supabase 세션 종료 + env 세션 쿠키 삭제
 */
export async function POST() {
  const res = NextResponse.json({ ok: true });

  // Supabase 로그아웃
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Supabase 미설정 시 무시
  }

  // env 세션 쿠키 삭제
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return res;
}
