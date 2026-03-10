/**
 * RBAC: 앱 내 역할 (viewer / operator / admin)
 * 게이트웨이 토큰과 분리된 앱 레벨 권한.
 */
export type AppRole = "viewer" | "operator" | "admin";

/**
 * 역할이 최소 권한 이상인지 검사
 * @param userRole - 사용자 역할
 * @param required - 필요 최소 역할 (viewer < operator < admin)
 */
export function hasRole(userRole: AppRole, required: AppRole): boolean {
  const order: Record<AppRole, number> = {
    viewer: 0,
    operator: 1,
    admin: 2,
  };
  return order[userRole] >= order[required];
}

/**
 * 에이전트 수정/삭제는 operator 이상
 */
export const AGENT_WRITE_MIN_ROLE: AppRole = "operator";

/**
 * 에이전트 목록/조회는 viewer 이상
 */
export const AGENT_READ_MIN_ROLE: AppRole = "viewer";
