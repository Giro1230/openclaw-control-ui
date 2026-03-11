import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock Next.js server-only modules
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

// Default env for tests
process.env.AUTH_SECRET = "test-secret-for-unit-tests-only-32chars";
