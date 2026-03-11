import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Agent } from "@/types/agent";

// store Mock - 정적 import 전에 모킹 선언
vi.mock("@/lib/agent/store", () => ({
  listAgents: vi.fn(),
  createAgent: vi.fn(),
}));

vi.mock("@/lib/auth/get-role", () => ({
  getAppRole: vi.fn().mockResolvedValue("operator"),
  getOwnerId: vi.fn().mockResolvedValue("owner-123"),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() =>
    Promise.resolve({ get: vi.fn(), set: vi.fn(), delete: vi.fn() })
  ),
}));

// 모킹 후 route import
const { GET, POST } = await import("@/app/api/agents/route");
const { listAgents, createAgent } = await import("@/lib/agent/store");
const { getAppRole } = await import("@/lib/auth/get-role");

const mockAgent: Agent = {
  id: "agt_test_123",
  name: "Test Agent",
  slug: "test-agent",
  kind: "assistant",
  config: {},
  owner_id: "owner-123",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

function makeRequest(body?: unknown, method = "GET"): Request {
  return new Request("http://localhost/api/agents", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("GET /api/agents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("에이전트 목록 반환 (200)", async () => {
    vi.mocked(listAgents).mockReturnValue([mockAgent]);
    const req = makeRequest();
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.agents).toHaveLength(1);
    expect(json.agents[0].id).toBe("agt_test_123");
  });

  it("빈 목록 반환 (200)", async () => {
    vi.mocked(listAgents).mockReturnValue([]);
    const req = makeRequest();
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.agents).toHaveLength(0);
  });

  it("viewer 역할도 목록 조회 가능", async () => {
    vi.mocked(getAppRole).mockResolvedValueOnce("viewer");
    vi.mocked(listAgents).mockReturnValue([mockAgent]);
    const req = makeRequest();
    const res = await GET(req);
    expect(res.status).toBe(200);
  });
});

describe("POST /api/agents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAppRole).mockResolvedValue("operator");
  });

  it("유효한 입력으로 에이전트 생성 (201)", async () => {
    vi.mocked(createAgent).mockReturnValue(mockAgent);
    const req = makeRequest({ name: "Test Agent", kind: "assistant" }, "POST");
    const res = await POST(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.id).toBe("agt_test_123");
  });

  it("잘못된 JSON 시 400 반환", async () => {
    const req = new Request("http://localhost/api/agents", {
      method: "POST",
      body: "not-json",
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("invalid_json");
  });

  it("name 누락 시 400 반환 (validation)", async () => {
    const req = makeRequest({ kind: "assistant" }, "POST");
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("validation");
  });

  it("유효하지 않은 kind 시 400 반환", async () => {
    const req = makeRequest({ name: "Test", kind: "invalid-kind" }, "POST");
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("slug 중복 시 409 반환", async () => {
    vi.mocked(createAgent).mockImplementation(() => {
      throw new Error("SLUG_EXISTS");
    });
    const req = makeRequest({ name: "Test Agent", kind: "assistant" }, "POST");
    const res = await POST(req);
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toBe("slug_exists");
  });

  it("viewer 역할은 생성 불가 (403)", async () => {
    vi.mocked(getAppRole).mockResolvedValueOnce("viewer");
    const req = makeRequest({ name: "Test", kind: "assistant" }, "POST");
    const res = await POST(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("forbidden");
  });
});
