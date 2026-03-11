import type { AppRole } from "@/types/rbac";
import { getSessionUser, getRoleFromUser } from "@/lib/auth/session";

/**
 * Returns the AppRole for the current request in an API Route.
 * Prefers Supabase session; falls back to x-app-role header (dev only); defaults to operator.
 */
export async function getAppRole(headers: Headers): Promise<AppRole> {
  const user = await getSessionUser();
  if (user) return getRoleFromUser(user);

  const role = headers.get("x-app-role")?.toLowerCase();
  if (role === "viewer" || role === "operator" || role === "admin") return role;
  return "operator";
}

/**
 * Returns the owner_id for the current request.
 * Uses Supabase user.id when available; falls back to "default-owner".
 */
export async function getOwnerId(_headers: Headers): Promise<string> {
  const user = await getSessionUser();
  return user?.id ?? "default-owner";
}
