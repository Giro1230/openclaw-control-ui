import { type NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const SESSION_COOKIE = "__openclaw_session";

const intlMiddleware = createIntlMiddleware(routing);

/**
 * /login 및 공개 경로 여부 판단 (로케일 접두사 포함).
 * "as-needed" 라우팅이므로 /login, /en/login, /ja/login 모두 허용.
 */
function isPublicPath(pathname: string): boolean {
  if (pathname.startsWith("/api/")) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.match(/^(\/[a-z]{2})?\/login(\/|$)/)) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  let isAuthenticated = false;

  // ── 1. Supabase 세션 확인 ───────────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let supabaseResponse = NextResponse.next({ request });

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options?: CookieOptions }[]
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options ?? {})
          );
        },
      },
    });

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) isAuthenticated = true;
    } catch {
      // Supabase 연결 실패 시 무시
    }
  }

  // ── 2. env 세션 쿠키 확인 (__openclaw_session 존재 여부만 체크) ──
  // 서명 검증은 getSessionUser() 가 수행. 여기서는 리다이렉트 여부만 판단.
  if (!isAuthenticated) {
    const envSession = request.cookies.get(SESSION_COOKIE);
    if (envSession?.value) isAuthenticated = true;
  }

  // ── 3. 인증 수단 없음 → 개발 모드 (인증 우회) ───────────────────
  const hasAnyAuth =
    (supabaseUrl && supabaseAnonKey) ||
    process.env.AUTH_USERS ||
    process.env.AUTH_EMAIL;

  if (!hasAnyAuth) {
    isAuthenticated = true;
  }

  // ── 4. 보호 경로 미인증 시 /login 리다이렉트 ─────────────────────
  if (!isAuthenticated && !isPublicPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── 5. i18n 미들웨어 실행 + Supabase 쿠키 병합 ──────────────────
  const intlResponse = intlMiddleware(request);
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value, {
      path: cookie.path,
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite as "strict" | "lax" | "none" | undefined,
    });
  });

  return intlResponse;
}

export const config = {
  // api, _next, _vercel, 파일 확장자 → next-intl 이 API 라우트를 잡지 않도록 제외
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
