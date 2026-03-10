import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  isEnvAuthEnabled,
  verifySessionToken,
  SESSION_COOKIE,
} from "@/lib/auth/env-auth";
import type { User } from "@supabase/supabase-js";
import type { AppRole } from "@/types/rbac";

/**
 * 서버 컴포넌트 / API Route에서 현재 로그인 사용자 반환.
 *
 * 우선순위:
 *  1. Supabase 세션 (NEXT_PUBLIC_SUPABASE_URL 설정 시)
 *  2. env 세션 쿠키 (__openclaw_session)
 *  3. null (미인증)
 */
export async function getSessionUser(): Promise<User | null> {
  // 1. Supabase
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) return user;
  } catch {
    // Supabase 미설정
  }

  // 2. env 토큰 세션
  if (isEnvAuthEnabled()) {
    try {
      const cookieStore = await cookies();
      const raw = cookieStore.get(SESSION_COOKIE)?.value;
      if (raw) {
        const envUser = verifySessionToken(raw);
        if (envUser) {
          return {
            id: envUser.email,
            email: envUser.email,
            app_metadata: { role: envUser.role },
            user_metadata: {},
            aud: "authenticated",
            created_at: "",
          } as unknown as User;
        }
      }
    } catch {
      // 쿠키 읽기 실패
    }
  }

  return null;
}

/** 로그인 필수 컨텍스트 — 미인증 시 에러 throw */
export async function requireSessionUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

/** user.app_metadata.role → AppRole */
export function getRoleFromUser(user: User): AppRole {
  const role = (user.app_metadata?.role as string | undefined)?.toLowerCase();
  if (role === "viewer" || role === "operator" || role === "admin") return role;
  return "operator";
}

/** 현재 사용자 owner_id (= user.id). 없으면 "default-owner". */
export async function getSessionOwnerId(): Promise<string> {
  const user = await getSessionUser();
  return user?.id ?? "default-owner";
}

/** 현재 사용자 AppRole. 없으면 operator. */
export async function getSessionRole(): Promise<AppRole> {
  const user = await getSessionUser();
  if (!user) return "operator";
  return getRoleFromUser(user);
}
