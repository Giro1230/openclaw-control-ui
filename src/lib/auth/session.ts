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
 * Returns the currently authenticated user for use in Server Components and API Routes.
 *
 * Priority:
 *  1. Supabase session (when NEXT_PUBLIC_SUPABASE_URL is configured)
 *  2. env session cookie (__openclaw_session)
 *  3. null (unauthenticated)
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
    // Supabase not configured
  }

  // 2. env-auth session cookie
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
      // Failed to read cookie
    }
  }

  return null;
}

/** Requires authentication — throws if unauthenticated */
export async function requireSessionUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

/** Extracts AppRole from user.app_metadata.role */
export function getRoleFromUser(user: User): AppRole {
  const role = (user.app_metadata?.role as string | undefined)?.toLowerCase();
  if (role === "viewer" || role === "operator" || role === "admin") return role;
  return "operator";
}

/** Returns the current user's owner_id (= user.id), or "default-owner" if unauthenticated */
export async function getSessionOwnerId(): Promise<string> {
  const user = await getSessionUser();
  return user?.id ?? "default-owner";
}

/** Returns the current user's AppRole, or "operator" if unauthenticated */
export async function getSessionRole(): Promise<AppRole> {
  const user = await getSessionUser();
  if (!user) return "operator";
  return getRoleFromUser(user);
}
