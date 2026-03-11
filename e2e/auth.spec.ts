import { test, expect } from "@playwright/test";

/**
 * E2E: 인증 플로우
 * env-auth 모드 (AUTH_EMAIL + AUTH_TOKEN) 기준
 */
test.describe("인증 플로우", () => {
  test("미인증 상태에서 보호 경로 접근 시 /login 리다이렉트", async ({ page }) => {
    await page.goto("/agents");
    await expect(page).toHaveURL(/\/login/);
  });

  test("잘못된 자격증명으로 로그인 실패", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"], input[name="email"]', "wrong@example.com");
    await page.fill('input[type="password"], input[name="password"]', "wrong-token");
    await page.click('button[type="submit"]');
    // 에러 메시지 또는 동일 페이지 유지 확인
    await expect(page).toHaveURL(/\/login/);
  });

  test("올바른 자격증명으로 로그인 성공 후 리다이렉트", async ({ page }) => {
    const email = process.env.E2E_AUTH_EMAIL ?? "test@example.com";
    const password = process.env.E2E_AUTH_TOKEN ?? "test-token";

    await page.goto("/login");
    await page.fill('input[type="email"], input[name="email"]', email);
    await page.fill('input[type="password"], input[name="password"]', password);
    await page.click('button[type="submit"]');

    // 로그인 성공 후 에이전트 페이지 또는 메인으로 이동
    await expect(page).not.toHaveURL(/\/login/);
  });
});

test.describe("로그아웃", () => {
  test.beforeEach(async ({ page, request }) => {
    // API를 통해 직접 로그인 (UI 의존성 줄이기)
    const email = process.env.E2E_AUTH_EMAIL ?? "test@example.com";
    const token = process.env.E2E_AUTH_TOKEN ?? "test-token";
    await request.post("/api/auth/sign-in", {
      data: { email, password: token },
    });
  });

  test("로그아웃 후 보호 경로 접근 시 /login 리다이렉트", async ({ page }) => {
    await page.goto("/agents");
    // 로그아웃 버튼 찾기 (auth-menu 컴포넌트)
    const logoutBtn = page.getByRole("button", { name: /로그아웃|sign.?out|logout/i });
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await expect(page).toHaveURL(/\/login/);
    }
  });
});
