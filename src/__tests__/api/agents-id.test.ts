import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Agent } from "@/types/agent";

vi.mock("@/lib/agent/store", () => ({
  getAgentById: vi.fn(),
  updateAgent: vi.fn(),
  deleteAgent: vi.fn(),
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

const { GET, PATCH, DELETE } = await import("@/app/api/agents/[id]/route");
const { getAgentById, updateAgent, deleteAgent } = await import("@/lib/agent/store");
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

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function makeRequest(body?: unknown, method = "GET"): Request {
  return new Request(`http://localhost/api/agents/agt_test_123`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("GET /api/agents/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("존재하는 에이전트 조회 (200)", async () => {
    vi.mocked(getAgentById).mockReturnValue(mockAgent);
    const res = await GET(makeRequest(), makeParams("agt_test_123"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.id).toBe("agt_test_123");
  });

  it("존재하지 않는 에이전트 (404)", async () => {
    vi.mocked(getAgentById).mockReturnValue(undefined);
    const res = await GET(makeRequest(), makeParams("non-existent"));
    expect(res.status).toBe(404);
  });

  it("다른 owner의 에이전트 조회 시 404 (정보 노출 방지)", async () => {
    const otherAgent = { ...mockAgent, owner_id: "other-owner" };
    vi.mocked(getAgentById).mockReturnValue(otherAgent);
    const res = await GET(makeRequest(), makeParams("agt_test_123"));
    expect(res.status).toBe(404);
  });

  it("viewer 역할도 조회 가능", async () => {
    vi.mocked(getAppRole).mockResolvedValueOnce("viewer");
    vi.mocked(getAgentById).mockReturnValue(mockAgent);
    const res = await GET(makeRequest(), makeParams("agt_test_123"));
    expect(res.status).toBe(200);
  });
});

describe("PATCH /api/agents/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAppRole).mockResolvedValue("operator");
  });

  it("정상 업데이트 (200)", async () => {
    const updated = { ...mockAgent, name: "Updated Name" };
    vi.mocked(updateAgent).mockReturnValue(updated);
    const req = makeRequest({ name: "Updated Name" }, "PATCH");
    const res = await PATCH(req, makeParams("agt_test_123"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.name).toBe("Updated Name");
  });

  it("존재하지 않는 에이전트 (404)", async () => {
    vi.mocked(updateAgent).mockReturnValue(null);
    const req = makeRequest({ name: "Updated" }, "PATCH");
    const res = await PATCH(req, makeParams("non-existent"));
    expect(res.status).toBe(404);
  });

  it("slug 충돌 시 409", async () => {
    vi.mocked(updateAgent).mockImplementation(() => {
      throw new Error("SLUG_EXISTS");
    });
    const req = makeRequest({ slug: "existing-slug" }, "PATCH");
    const res = await PATCH(req, makeParams("agt_test_123"));
    expect(res.status).toBe(409);
  });

  it("viewer 역할은 수정 불가 (403)", async () => {
    vi.mocked(getAppRole).mockResolvedValueOnce("viewer");
    const req = makeRequest({ name: "Updated" }, "PATCH");
    const res = await PATCH(req, makeParams("agt_test_123"));
    expect(res.status).toBe(403);
  });

  it("잘못된 JSON (400)", async () => {
    const req = new Request("http://localhost/api/agents/agt_test_123", {
      method: "PATCH",
      body: "{broken-json}",
      headers: { "Content-Type": "application/json" },
    });
    const res = await PATCH(req, makeParams("agt_test_123"));
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/agents/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAppRole).mockResolvedValue("operator");
  });

  it("정상 삭제 (200)", async () => {
    vi.mocked(deleteAgent).mockReturnValue(true);
    const res = await DELETE(makeRequest(undefined, "DELETE"), makeParams("agt_test_123"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it("존재하지 않는 에이전트 삭제 (404)", async () => {
    vi.mocked(deleteAgent).mockReturnValue(false);
    const res = await DELETE(makeRequest(undefined, "DELETE"), makeParams("non-existent"));
    expect(res.status).toBe(404);
  });

  it("viewer 역할은 삭제 불가 (403)", async () => {
    vi.mocked(getAppRole).mockResolvedValueOnce("viewer");
    const res = await DELETE(makeRequest(undefined, "DELETE"), makeParams("agt_test_123"));
    expect(res.status).toBe(403);
  });
});
