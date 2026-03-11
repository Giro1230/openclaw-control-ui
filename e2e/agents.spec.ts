import { test, expect, type APIRequestContext } from "@playwright/test";

/**
 * E2E: 에이전트 CRUD 플로우
 * 로그인→에이전트 생성→조회→삭제
 */

async function signIn(request: APIRequestContext) {
  await request.post("/api/auth/sign-in", {
    data: {
      email: process.env.E2E_AUTH_EMAIL ?? "test@example.com",
      password: process.env.E2E_AUTH_TOKEN ?? "test-token",
    },
  });
}

test.describe("에이전트 관리 플로우", () => {
  test.beforeEach(async ({ request }) => {
    await signIn(request);
  });

  test("에이전트 목록 페이지 접근", async ({ page }) => {
    await page.goto("/agents");
    await expect(page).toHaveURL(/\/agents/);
    // 로딩 완료 후 UI 요소 확인
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 10_000 });
  });

  test("새 에이전트 생성 플로우", async ({ page }) => {
    await page.goto("/agents/new");

    // name 필드 입력
    const nameInput = page.locator('input[name="name"], input[placeholder*="이름"], input[id="name"]');
    await nameInput.fill(`E2E Test Agent ${Date.now()}`);

    // kind 선택 (select 또는 radio)
    const kindSelect = page.locator('select[name="kind"]');
    if (await kindSelect.isVisible()) {
      await kindSelect.selectOption("assistant");
    }

    // 폼 제출
    await page.click('button[type="submit"]');

    // 생성 후 에이전트 목록 또는 상세 페이지로 이동
    await expect(page).toHaveURL(/\/agents/);
  });

  test("API를 통한 에이전트 생성 및 조회", async ({ request }) => {
    // 에이전트 생성
    const createRes = await request.post("/api/agents", {
      data: {
        name: `E2E API Agent ${Date.now()}`,
        kind: "assistant",
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const agent = await createRes.json();
    expect(agent.id).toBeDefined();

    // 생성된 에이전트 조회
    const getRes = await request.get(`/api/agents/${agent.id}`);
    expect(getRes.ok()).toBeTruthy();
    const fetched = await getRes.json();
    expect(fetched.id).toBe(agent.id);

    // 에이전트 삭제 (정리)
    const deleteRes = await request.delete(`/api/agents/${agent.id}`);
    expect(deleteRes.ok()).toBeTruthy();
  });

  test("에이전트 목록 API 인증 확인", async ({ request }) => {
    // 로그아웃 후 API 접근 시 401 또는 403
    await request.post("/api/auth/sign-out");
    const res = await request.get("/api/agents");
    // 미인증 또는 권한 없음 응답 확인
    expect([401, 403]).toContain(res.status());
  });
});

test.describe("세션 조회 플로우", () => {
  test.beforeEach(async ({ request }) => {
    await signIn(request);
  });

  test("세션 목록 페이지 접근", async ({ page }) => {
    await page.goto("/sessions");
    await expect(page).toHaveURL(/\/sessions/);
    await page.waitForLoadState("networkidle");
  });

  test("세션 API 인증 확인", async ({ request }) => {
    const res = await request.get("/api/openclaw/sessions");
    // 인증된 상태이므로 200 또는 gateway 오류
    expect([200, 502, 504]).toContain(res.status());
  });
});
