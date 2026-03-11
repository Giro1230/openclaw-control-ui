import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SESSION_COOKIE } from "@/lib/auth/env-auth";

/**
 * POST /api/auth/sign-out
 * Terminates the Supabase session and clears the env-auth session cookie.
 */
export async function POST() {
  const res = NextResponse.json({ ok: true });

  // Sign out from Supabase
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Supabase not configured — ignore
  }

  // Clear env-auth session cookie
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return res;
}
