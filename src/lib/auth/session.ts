import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import type { AppRole } from "@/types/rbac";

/**
 * 서버 컴포넌트 / API Route에서 현재 Supabase 로그인 사용자 반환.
 * 미설정 환경(로컬 개발 등)에서는 null 반환.
 */
export async function getSessionUser(): Promise<User | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ?? null;
  } catch {
    return null;
  }
}

/**
 * 로그인 필수 컨텍스트에서 사용자 반환. 미인증 시 에러.
 */
export async function requireSessionUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

/**
 * user.app_metadata.role → AppRole 변환.
 * 미설정이면 개발 편의상 operator 반환.
 */
export function getRoleFromUser(user: User): AppRole {
  const role = (user.app_metadata?.role as string | undefined)?.toLowerCase();
  if (role === "viewer" || role === "operator" || role === "admin") return role;
  return "operator";
}

/**
 * 현재 로그인 사용자의 owner_id (= user.id) 반환. 없으면 "default-owner".
 */
export async function getSessionOwnerId(): Promise<string> {
  const user = await getSessionUser();
  return user?.id ?? "default-owner";
}

/**
 * 현재 로그인 사용자의 AppRole 반환. 없으면 operator.
 */
export async function getSessionRole(): Promise<AppRole> {
  const user = await getSessionUser();
  if (!user) return "operator";
  return getRoleFromUser(user);
}
