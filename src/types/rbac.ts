/**
 * RBAC: application-level roles (viewer / operator / admin).
 * Separate from Gateway tokens — controls what the user can do in the dashboard.
 */
export type AppRole = "viewer" | "operator" | "admin";

/**
 * Returns true if the user's role meets or exceeds the required minimum.
 * @param userRole - The user's current role
 * @param required - Minimum required role (viewer < operator < admin)
 */
export function hasRole(userRole: AppRole, required: AppRole): boolean {
  const order: Record<AppRole, number> = {
    viewer: 0,
    operator: 1,
    admin: 2,
  };
  return order[userRole] >= order[required];
}

/** Minimum role required to create, edit, or delete agents */
export const AGENT_WRITE_MIN_ROLE: AppRole = "operator";

/** Minimum role required to list or view agents */
export const AGENT_READ_MIN_ROLE: AppRole = "viewer";
