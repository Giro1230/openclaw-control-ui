import { type NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const SESSION_COOKIE = "__openclaw_session";

const intlMiddleware = createIntlMiddleware(routing);

/**
 * Returns true for public paths that do not require authentication.
 * Handles locale prefixes (e.g. /login, /en/login, /ja/login).
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

  // ── 1. Check Supabase session ────────────────────────────────────
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
      // Supabase connection failed — ignore
    }
  }

  // ── 2. Check env session cookie (existence only) ─────────────────
  // Signature verification is done later by getSessionUser().
  // Here we only decide whether to redirect.
  if (!isAuthenticated) {
    const envSession = request.cookies.get(SESSION_COOKIE);
    if (envSession?.value) isAuthenticated = true;
  }

  // ── 3. No auth configured → dev bypass (allow all) ───────────────
  const hasAnyAuth =
    (supabaseUrl && supabaseAnonKey) ||
    process.env.AUTH_USERS ||
    process.env.AUTH_EMAIL;

  if (!hasAnyAuth) {
    isAuthenticated = true;
  }

  // ── 4. Redirect unauthenticated requests to /login ───────────────
  if (!isAuthenticated && !isPublicPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── 5. Run i18n middleware and merge Supabase cookies ────────────
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
  // Exclude api, _next, _vercel, and static files so next-intl does not intercept them
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
