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
 * Body: { email: string; password: string }
 *
 * Priority:
 *  1. Supabase email/password auth (when NEXT_PUBLIC_SUPABASE_URL is set)
 *  2. env-auth token matching (AUTH_USERS or AUTH_EMAIL+TOKEN)
 */
export async function POST(request: NextRequest) {
  // 10 requests per IP per 10 minutes
  const ip = getClientIp(request.headers);
  const rl = checkRateLimit(`sign-in:${ip}`, 10, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "too_many_requests", message: "Too many login attempts. Please try again later." },
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
      { error: "email and password (token) are required" },
      { status: 400 }
    );
  }

  // ── 1. Supabase auth ──────────────────────────────────────────────
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
      // Supabase misconfigured — fall through to env-auth
    }
  }

  // ── 2. env-auth ───────────────────────────────────────────────────
  if (isEnvAuthEnabled()) {
    const user = validateEnvCredentials(email, password);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or token" },
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

  // ── 3. No auth configured ─────────────────────────────────────────
  return NextResponse.json(
    {
      error: "No authentication method configured. Set AUTH_USERS or configure Supabase.",
    },
    { status: 503 }
  );
}
