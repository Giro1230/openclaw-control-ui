import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/auth/sign-in
 * body: { email: string; password: string }
 * → Supabase email/password 로그인, 쿠키 세션 설정
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { email, password } = body as { email?: string; password?: string };
  if (!email || !password) {
    return NextResponse.json(
      { error: "email과 password는 필수입니다." },
      { status: 400 }
    );
  }

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
    return NextResponse.json(
      { error: "Supabase가 설정되지 않았습니다." },
      { status: 503 }
    );
  }
}
