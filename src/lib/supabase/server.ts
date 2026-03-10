import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 서버용 Supabase 클라이언트 (쿠키 기반 세션)
 * API 라우트·서버 컴포넌트에서 사용. 게이트웨이 토큰은 별도 서버 전용 저장소에서만 로드.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 필요");
  }
  const cookieMethods: CookieMethodsServer = {
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet) {
      try {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      } catch {
        // Server Component에서는 set 무시
      }
    },
  };
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: cookieMethods,
  });
}
