import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/openclaw/gateway-client", () => ({
  listGatewaySessions: vi.fn(),
  fetchGatewayStatus: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() =>
    Promise.resolve({ get: vi.fn(), set: vi.fn(), delete: vi.fn() })
  ),
}));

const { GET: sessionsGET } = await import("@/app/api/openclaw/sessions/route");
const { GET: statusGET } = await import("@/app/api/openclaw/status/route");
const { listGatewaySessions, fetchGatewayStatus } = await import("@/lib/openclaw/gateway-client");
const { getSessionUser } = await import("@/lib/auth/session");

const mockSessions = [
  { id: "sess_1", agent_id: "agt_1", status: "active", created_at: "2024-01-01T00:00:00Z" },
  { id: "sess_2", agent_id: "agt_2", status: "closed", created_at: "2024-01-02T00:00:00Z" },
];

const mockUser = {
  id: "user-123",
  email: "test@example.com",
  app_metadata: { role: "operator" },
  user_metadata: {},
  aud: "authenticated",
  created_at: "",
};

describe("GET /api/openclaw/sessions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns session list for authenticated user (200)", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(mockUser as never);
    vi.mocked(listGatewaySessions).mockResolvedValue(mockSessions);
    const res = await sessionsGET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.sessions).toHaveLength(2);
  });

  it("returns 401 for unauthenticated request", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);
    const res = await sessionsGET();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("unauthenticated");
  });

  it("returns 504 on Gateway timeout", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(mockUser as never);
    vi.mocked(listGatewaySessions).mockRejectedValue(new Error("OPENCLAW_GATEWAY_TIMEOUT"));
    const res = await sessionsGET();
    expect(res.status).toBe(504);
    const json = await res.json();
    expect(json.error).toBe("gateway_timeout");
  });

  it("returns empty array when Gateway is not configured (200)", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(mockUser as never);
    vi.mocked(listGatewaySessions).mockRejectedValue(new Error("OPENCLAW_GATEWAY_URL not set"));
    const res = await sessionsGET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.sessions).toHaveLength(0);
    expect(json.error).toBe("gateway_not_configured");
  });
});

describe("GET /api/openclaw/status", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns Gateway status for authenticated user (200)", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(mockUser as never);
    vi.mocked(fetchGatewayStatus).mockResolvedValue({ version: "1.0.0", uptime: 3600 });
    const res = await statusGET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.status).toBeDefined();
  });

  it("returns 401 for unauthenticated request (security fix)", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);
    const res = await statusGET();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("unauthorized");
  });

  it("returns 504 on Gateway timeout", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(mockUser as never);
    vi.mocked(fetchGatewayStatus).mockRejectedValue(new Error("OPENCLAW_GATEWAY_TIMEOUT"));
    const res = await statusGET();
    expect(res.status).toBe(504);
    const json = await res.json();
    expect(json.ok).toBe(false);
  });

  it("returns 502 on Gateway connection failure", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(mockUser as never);
    vi.mocked(fetchGatewayStatus).mockRejectedValue(new Error("ECONNREFUSED"));
    const res = await statusGET();
    expect(res.status).toBe(502);
  });
});
