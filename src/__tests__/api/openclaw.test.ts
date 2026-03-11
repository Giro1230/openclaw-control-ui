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

  it("인증된 사용자 - 세션 목록 반환 (200)", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(mockUser as never);
    vi.mocked(listGatewaySessions).mockResolvedValue(mockSessions);
    const res = await sessionsGET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.sessions).toHaveLength(2);
  });

  it("미인증 사용자 - 401 반환", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);
    const res = await sessionsGET();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("unauthenticated");
  });

  it("Gateway 타임아웃 - 504 반환", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(mockUser as never);
    vi.mocked(listGatewaySessions).mockRejectedValue(new Error("OPENCLAW_GATEWAY_TIMEOUT"));
    const res = await sessionsGET();
    expect(res.status).toBe(504);
    const json = await res.json();
    expect(json.error).toBe("gateway_timeout");
  });

  it("Gateway URL 미설정 - 빈 배열 반환 (200)", async () => {
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

  it("인증된 사용자 - Gateway 상태 반환 (200)", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(mockUser as never);
    vi.mocked(fetchGatewayStatus).mockResolvedValue({ version: "1.0.0", uptime: 3600 });
    const res = await statusGET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.status).toBeDefined();
  });

  it("미인증 사용자 - 401 반환 (보안 강화됨)", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);
    const res = await statusGET();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("unauthorized");
  });

  it("Gateway 타임아웃 - 504 반환", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(mockUser as never);
    vi.mocked(fetchGatewayStatus).mockRejectedValue(new Error("OPENCLAW_GATEWAY_TIMEOUT"));
    const res = await statusGET();
    expect(res.status).toBe(504);
    const json = await res.json();
    expect(json.ok).toBe(false);
  });

  it("Gateway 연결 실패 - 502 반환", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(mockUser as never);
    vi.mocked(fetchGatewayStatus).mockRejectedValue(new Error("ECONNREFUSED"));
    const res = await statusGET();
    expect(res.status).toBe(502);
  });
});
