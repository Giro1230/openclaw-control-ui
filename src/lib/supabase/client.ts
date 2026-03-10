import { createBrowserClient } from "@supabase/ssr";

/**
 * 브라우저용 Supabase 클라이언트 (공개 anon key만 사용)
 * 게이트웨이 토큰은 절대 이 클라이언트에 넣지 않는다.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 필요");
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
