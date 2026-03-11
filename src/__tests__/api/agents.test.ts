import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Agent } from "@/types/agent";

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

  it("returns agent list with 200", async () => {
    vi.mocked(listAgents).mockReturnValue([mockAgent]);
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.agents).toHaveLength(1);
    expect(json.agents[0].id).toBe("agt_test_123");
  });

  it("returns empty list with 200", async () => {
    vi.mocked(listAgents).mockReturnValue([]);
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.agents).toHaveLength(0);
  });

  it("allows viewer role to list agents", async () => {
    vi.mocked(getAppRole).mockResolvedValueOnce("viewer");
    vi.mocked(listAgents).mockReturnValue([mockAgent]);
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
  });
});

describe("POST /api/agents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAppRole).mockResolvedValue("operator");
  });

  it("creates an agent with valid input (201)", async () => {
    vi.mocked(createAgent).mockReturnValue(mockAgent);
    const req = makeRequest({ name: "Test Agent", kind: "assistant" }, "POST");
    const res = await POST(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.id).toBe("agt_test_123");
  });

  it("returns 400 for invalid JSON", async () => {
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

  it("returns 400 for missing name (validation)", async () => {
    const req = makeRequest({ kind: "assistant" }, "POST");
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("validation");
  });

  it("returns 400 for invalid kind", async () => {
    const req = makeRequest({ name: "Test", kind: "invalid-kind" }, "POST");
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 409 for duplicate slug", async () => {
    vi.mocked(createAgent).mockImplementation(() => {
      throw new Error("SLUG_EXISTS");
    });
    const req = makeRequest({ name: "Test Agent", kind: "assistant" }, "POST");
    const res = await POST(req);
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toBe("slug_exists");
  });

  it("returns 403 for viewer role", async () => {
    vi.mocked(getAppRole).mockResolvedValueOnce("viewer");
    const req = makeRequest({ name: "Test", kind: "assistant" }, "POST");
    const res = await POST(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("forbidden");
  });
});
