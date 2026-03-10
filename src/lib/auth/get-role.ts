import type { AppRole } from "@/types/rbac";
import { getSessionUser, getRoleFromUser } from "@/lib/auth/session";

/**
 * API Route에서 현재 요청의 AppRole 반환.
 * Supabase 세션 우선, 없으면 x-app-role 헤더(개발용), 기본 operator.
 */
export async function getAppRole(headers: Headers): Promise<AppRole> {
  const user = await getSessionUser();
  if (user) return getRoleFromUser(user);

  const role = headers.get("x-app-role")?.toLowerCase();
  if (role === "viewer" || role === "operator" || role === "admin") return role;
  return "operator";
}

/**
 * API Route에서 owner_id 반환.
 * Supabase user.id 우선, 없으면 "default-owner".
 */
export async function getOwnerId(_headers: Headers): Promise<string> {
  const user = await getSessionUser();
  return user?.id ?? "default-owner";
}
