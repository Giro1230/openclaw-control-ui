import { getSessionUser } from "@/lib/auth/session";
import { AssistantStatus } from "@/components/assistant-status";
import { QuickActions } from "@/components/quick-actions";
import type { GatewaySession } from "@/lib/openclaw/gateway-client";

interface GatewayStatus {
  ok: boolean;
  uptime?: number;
  model?: string;
  status?: Record<string, unknown>;
}

interface SessionsPayload {
  sessions: GatewaySession[];
}

async function fetchGatewayStatus(baseUrl: string, cookie: string): Promise<GatewayStatus> {
  try {
    const res = await fetch(`${baseUrl}/api/openclaw/status`, {
      headers: { cookie },
      next: { revalidate: 0 },
    });
    if (!res.ok) return { ok: false };
    const data = (await res.json()) as GatewayStatus;
    return data;
  } catch {
    return { ok: false };
  }
}

async function fetchRecentSessions(baseUrl: string, cookie: string): Promise<GatewaySession[]> {
  try {
    const res = await fetch(`${baseUrl}/api/openclaw/sessions`, {
      headers: { cookie },
      next: { revalidate: 0 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as SessionsPayload;
    return data.sessions ?? [];
  } catch {
    return [];
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default async function HomePage() {
  const user = await getSessionUser();

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    `http://localhost:${process.env.PORT ?? 3000}`;

  const cookieHeader = "";

  const [gatewayStatus, recentSessions] = user
    ? await Promise.all([
        fetchGatewayStatus(baseUrl, cookieHeader),
        fetchRecentSessions(baseUrl, cookieHeader),
      ])
    : [{ ok: false } as GatewayStatus, [] as GatewaySession[]];

  const gatewayConfigured = !!process.env.OPENCLAW_GATEWAY_URL;
  const activeSessions = recentSessions.filter((s) => s.status === "active");

  const health: "ok" | "degraded" | "error" | "unknown" = !gatewayConfigured
    ? "unknown"
    : gatewayStatus.ok
      ? "ok"
      : "degraded";

  const model =
    typeof gatewayStatus.status?.model === "string"
      ? gatewayStatus.status.model
      : undefined;

  const uptime =
    typeof gatewayStatus.status?.uptime === "number"
      ? (gatewayStatus.status.uptime as number)
      : typeof gatewayStatus.uptime === "number"
        ? gatewayStatus.uptime
        : undefined;

  const RECENT_LIMIT = 8;
  const displaySessions = recentSessions.slice(0, RECENT_LIMIT);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Assistant Panel</h1>
        <p className="mt-1 text-sm text-base-content/50">
          {user ? `Signed in as ${user.email}` : "Not signed in"}
        </p>
      </div>

      {/* Status + Actions row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AssistantStatus
            online={gatewayStatus.ok}
            model={model}
            uptime={uptime}
            health={health}
            sessionCount={activeSessions.length}
          />
        </div>
        <QuickActions gatewayConfigured={gatewayConfigured} />
      </div>

      {/* Recent sessions */}
      <div className="card bg-base-200 border border-base-300">
        <div className="card-body p-5">
          <h2 className="text-sm font-semibold text-base-content/60 uppercase tracking-wider">
            Recent Conversations
          </h2>

          {!user ? (
            <p className="mt-3 text-sm text-base-content/40">Sign in to view sessions.</p>
          ) : displaySessions.length === 0 ? (
            <p className="mt-3 text-sm text-base-content/40">
              {gatewayConfigured
                ? "No sessions yet."
                : "Connect a Gateway to see conversations."}
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-base-300">
              {displaySessions.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        s.status === "active" ? "bg-success" : "bg-base-content/20"
                      }`}
                    />
                    <span className="truncate text-sm font-mono text-base-content/70">
                      {s.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span
                      className={`text-xs ${
                        s.status === "active" ? "text-success" : "text-base-content/40"
                      }`}
                    >
                      {s.status}
                    </span>
                    {s.created_at && (
                      <span className="text-xs text-base-content/40">
                        {formatDate(s.created_at)}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
