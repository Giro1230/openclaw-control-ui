import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Agent } from "@/types/agent";

/**
 * Security regression tests.
 * Verifies that authentication bypass and privilege escalation are not possible.
 */

vi.mock("@/lib/auth/session", () => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/lib/auth/get-role", () => ({
  getAppRole: vi.fn(),
  getOwnerId: vi.fn(),
}));

vi.mock("@/lib/agent/store", () => ({
  listAgents: vi.fn().mockReturnValue([]),
  createAgent: vi.fn(),
  getAgentById: vi.fn(),
  updateAgent: vi.fn(),
  deleteAgent: vi.fn(),
}));

vi.mock("@/lib/openclaw/gateway-client", () => ({
  fetchGatewayStatus: vi.fn(),
  listGatewaySessions: vi.fn(),
  sendChat: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/headers", () => ({
  cookies: vi.fn(() =>
    Promise.resolve({ get: vi.fn(), set: vi.fn(), delete: vi.fn() })
  ),
}));

const { GET: statusGET } = await import("@/app/api/openclaw/status/route");
const { GET: sessionsGET } = await import("@/app/api/openclaw/sessions/route");
const { POST: chatPOST } = await import("@/app/api/openclaw/chat/route");
const { GET: agentsGET, POST: agentsPOST } = await import("@/app/api/agents/route");
const { GET: agentGET } = await import("@/app/api/agents/[id]/route");
const { getSessionUser } = await import("@/lib/auth/session");
const { getAppRole, getOwnerId } = await import("@/lib/auth/get-role");
const { getAgentById } = await import("@/lib/agent/store");

// ── Authentication bypass tests ───────────────────────────────────────────────

describe("Authentication bypass — protected endpoints must reject unauthenticated requests", () => {
  beforeEach(() => {
    vi.mocked(getSessionUser).mockResolvedValue(null);
    vi.mocked(getAppRole).mockResolvedValue("operator");
    vi.mocked(getOwnerId).mockResolvedValue("default-owner");
  });

  it("GET /api/openclaw/status → 401 without session", async () => {
    const res = await statusGET();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("GET /api/openclaw/sessions → 401 without session", async () => {
    const res = await sessionsGET();
    expect(res.status).toBe(401);
  });

  it("POST /api/openclaw/chat → 401 without session", async () => {
    const req = new Request("http://localhost/api/openclaw/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "hello", agent_id: "agt_1" }),
    });
    const res = await chatPOST(req);
    expect(res.status).toBe(401);
  });
});

// ── Privilege escalation tests ────────────────────────────────────────────────

describe("Privilege escalation — viewer role must not write agents", () => {
  beforeEach(() => {
    vi.mocked(getAppRole).mockResolvedValue("viewer");
    vi.mocked(getOwnerId).mockResolvedValue("owner-123");
  });

  it("POST /api/agents → 403 for viewer role", async () => {
    const req = new Request("http://localhost/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Injected", kind: "assistant" }),
    });
    const res = await agentsPOST(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("forbidden");
  });
});

// ── Owner isolation tests ─────────────────────────────────────────────────────

describe("Owner isolation — agents must not be accessible across owners", () => {
  const bobAgent: Agent = {
    id: "agt_bob",
    name: "Bob Agent",
    slug: "bob-agent",
    kind: "assistant",
    config: {},
    owner_id: "owner-bob",
    created_at: "",
    updated_at: "",
  };

  beforeEach(() => {
    vi.mocked(getAppRole).mockResolvedValue("operator");
    vi.mocked(getOwnerId).mockResolvedValue("owner-alice");
    vi.mocked(getAgentById).mockReturnValue(bobAgent);
  });

  it("GET /api/agents/:id → 404 when agent belongs to different owner", async () => {
    const req = new Request("http://localhost/api/agents/agt_bob");
    const res = await agentGET(req, { params: Promise.resolve({ id: "agt_bob" }) });
    expect(res.status).toBe(404);
  });
});

// ── Input validation / injection tests ───────────────────────────────────────

describe("Input validation — malformed requests must not reach business logic", () => {
  beforeEach(() => {
    vi.mocked(getAppRole).mockResolvedValue("operator");
    vi.mocked(getOwnerId).mockResolvedValue("owner-123");
  });

  it("POST /api/agents with oversized name (>128 chars) → 400", async () => {
    const req = new Request("http://localhost/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "a".repeat(200), kind: "assistant" }),
    });
    const res = await agentsPOST(req);
    expect(res.status).toBe(400);
  });

  it("POST /api/agents with path-traversal slug → 400", async () => {
    const req = new Request("http://localhost/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test", kind: "assistant", slug: "../../etc/passwd" }),
    });
    const res = await agentsPOST(req);
    expect(res.status).toBe(400);
  });

  it("POST /api/agents with unknown kind → 400", async () => {
    const req = new Request("http://localhost/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test", kind: "superadmin" }),
    });
    const res = await agentsPOST(req);
    expect(res.status).toBe(400);
  });

  it("GET /api/agents with viewer role → 200 (reads are permitted)", async () => {
    vi.mocked(getAppRole).mockResolvedValueOnce("viewer");
    const req = new Request("http://localhost/api/agents");
    const res = await agentsGET(req);
    expect(res.status).toBe(200);
  });
});
