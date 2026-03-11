import { getSessionUser } from "@/lib/auth/session";
import {
  fetchGatewayStatus as gatewayStatus,
  listGatewaySessions,
} from "@/lib/openclaw/gateway-client";
import { AssistantStatus } from "@/components/assistant-status";
import { QuickActions } from "@/components/quick-actions";
import { logger } from "@/lib/logger";
import type { GatewaySession } from "@/lib/openclaw/gateway-client";

type HealthLevel = "ok" | "degraded" | "error" | "unknown";

interface FetchResult<T> {
  data: T | null;
  error: string | null;
}

async function safeGetGatewayStatus(): Promise<
  FetchResult<{ ok: boolean; uptime?: number; model?: string; status?: Record<string, unknown> }>
> {
  try {
    const raw = await gatewayStatus();
    return { data: { ok: true, status: raw }, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    logger.warn({ err: msg }, "Dashboard: gateway status fetch failed");
    return { data: { ok: false }, error: msg };
  }
}

async function safeGetSessions(): Promise<FetchResult<GatewaySession[]>> {
  try {
    const sessions = await listGatewaySessions();
    return { data: sessions, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    logger.warn({ err: msg }, "Dashboard: gateway sessions fetch failed");
    return { data: [], error: msg };
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

const RECENT_LIMIT = 8;

export default async function HomePage() {
  const user = await getSessionUser();
  const gatewayConfigured = !!process.env.OPENCLAW_GATEWAY_URL;
  const fetchedAt = new Date().toISOString();

  const [statusResult, sessionsResult] =
    user && gatewayConfigured
      ? await Promise.all([safeGetGatewayStatus(), safeGetSessions()])
      : [
          { data: { ok: false }, error: null } as FetchResult<{ ok: boolean }>,
          { data: [], error: null } as FetchResult<GatewaySession[]>,
        ];

  const statusData = statusResult.data;
  const sessions = sessionsResult.data ?? [];
  const activeSessions = sessions.filter((s) => s.status === "active");

  const health: HealthLevel = !gatewayConfigured
    ? "unknown"
    : statusResult.error
      ? "error"
      : statusData?.ok
        ? "ok"
        : "degraded";

  const model =
    typeof (statusData as { status?: Record<string, unknown> } | null)?.status?.model === "string"
      ? ((statusData as { status?: Record<string, unknown> }).status!.model as string)
      : undefined;

  const uptime = (() => {
    const s = statusData as { uptime?: unknown; status?: Record<string, unknown> } | null;
    if (typeof s?.status?.uptime === "number") return s.status.uptime as number;
    if (typeof s?.uptime === "number") return s.uptime as number;
    return undefined;
  })();

  const fetchError =
    statusResult.error ?? sessionsResult.error ?? null;

  const displaySessions = sessions.slice(0, RECENT_LIMIT);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Assistant Panel</h1>
        <p className="mt-1 text-sm text-base-content/50">
          {user ? `Signed in as ${user.email}` : "Not signed in"}
        </p>
      </div>

      {/* Error banner */}
      {fetchError && user && gatewayConfigured && (
        <div
          role="alert"
          className="alert alert-warning flex items-start gap-3 py-3 text-sm"
        >
          <span className="shrink-0">⚠</span>
          <span>
            <strong>Gateway unreachable.</strong>{" "}
            {fetchError.includes("TIMEOUT")
              ? "Connection timed out. Check that the Gateway is running."
              : fetchError.includes("GATEWAY_URL")
                ? "OPENCLAW_GATEWAY_URL is not configured."
                : "Could not connect to Gateway. Check server logs for details."}
          </span>
        </div>
      )}

      {/* Status + Actions */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AssistantStatus
            online={statusData?.ok ?? false}
            model={model}
            uptime={uptime}
            health={health}
            sessionCount={activeSessions.length}
            lastChecked={fetchedAt}
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
            <p className="mt-3 text-sm text-base-content/40">
              Sign in to view sessions.
            </p>
          ) : !gatewayConfigured ? (
            <p className="mt-3 text-sm text-base-content/40">
              Set <code className="text-xs">OPENCLAW_GATEWAY_URL</code> to see conversations.
            </p>
          ) : sessionsResult.error ? (
            <p className="mt-3 text-sm text-error/70">
              Failed to load sessions — Gateway may be unavailable.
            </p>
          ) : displaySessions.length === 0 ? (
            <p className="mt-3 text-sm text-base-content/40">No sessions yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-base-300">
              {displaySessions.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between py-2.5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        s.status === "active"
                          ? "bg-success"
                          : "bg-base-content/20"
                      }`}
                    />
                    <span className="truncate text-sm font-mono text-base-content/70">
                      {s.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span
                      className={`text-xs ${
                        s.status === "active"
                          ? "text-success"
                          : "text-base-content/40"
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
