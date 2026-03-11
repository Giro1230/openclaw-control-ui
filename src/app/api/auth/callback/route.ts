import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/auth/callback
 * Endpoint Supabase redirects to after OAuth or email confirmation.
 * Exchanges the code for a session, then redirects to the app.
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
      // Code exchange failed — redirect to login with error flag
      return NextResponse.redirect(new URL("/login?error=callback", request.url));
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}
