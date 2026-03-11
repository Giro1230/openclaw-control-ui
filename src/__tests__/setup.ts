import "@testing-library/jest-dom";
import { vi } from "vitest";

// Next.js 서버 전용 모듈 Mock
vi.mock("next/headers", () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      get: vi.fn(),
      getAll: vi.fn(() => []),
      set: vi.fn(),
      delete: vi.fn(),
    })
  ),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

// 환경변수 기본값
process.env.AUTH_SECRET = "test-secret-for-unit-tests-only-32chars";
