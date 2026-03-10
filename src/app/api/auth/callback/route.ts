import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/auth/callback
 * OAuth / 이메일 확인 후 Supabase가 리다이렉트하는 엔드포인트.
 * code를 session으로 교환하고 홈으로 이동.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

  if (code) {
    try {
      const supabase = await createClient();
      await supabase.auth.exchangeCodeForSession(code);
    } catch {
      // 코드 교환 실패 시 로그인 페이지로
      return NextResponse.redirect(new URL("/login?error=callback", request.url));
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}
