"use client";

interface StatusBadgeProps {
  online: boolean;
}

function StatusBadge({ online }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        online ? "bg-success/15 text-success" : "bg-error/15 text-error"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          online ? "bg-success animate-pulse" : "bg-error"
        }`}
      />
      {online ? "Online" : "Offline"}
    </span>
  );
}

function formatUptime(uptime: number): string {
  if (uptime < 60) return `${uptime}s`;
  if (uptime < 3600) return `${Math.floor(uptime / 60)}m`;
  return `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`;
}

export interface AssistantStatusProps {
  online: boolean;
  model?: string;
  uptime?: number;
  health: "ok" | "degraded" | "error" | "unknown";
  sessionCount: number;
  /** ISO timestamp of when the status was last fetched */
  lastChecked?: string;
}

export function AssistantStatus({
  online,
  model,
  uptime,
  health,
  sessionCount,
  lastChecked,
}: AssistantStatusProps) {
  const healthColor =
    health === "ok"
      ? "text-success"
      : health === "degraded"
        ? "text-warning"
        : health === "error"
          ? "text-error"
          : "text-base-content/40";

  const lastCheckedDisplay = lastChecked
    ? new Date(lastChecked).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;

  return (
    <div className="card bg-base-200 border border-base-300">
      <div className="card-body p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-base-content/60 uppercase tracking-wider">
            Assistant Status
          </h2>
          <div className="flex items-center gap-2">
            {lastCheckedDisplay && (
              <span
                className="text-xs text-base-content/30"
                title="Last checked"
              >
                {lastCheckedDisplay}
              </span>
            )}
            <StatusBadge online={online} />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-base-content/50">Model</p>
            <p className="mt-0.5 text-sm font-medium truncate" title={model}>
              {model ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-base-content/50">Uptime</p>
            <p className="mt-0.5 text-sm font-medium">
              {uptime !== undefined ? formatUptime(uptime) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-base-content/50">Health</p>
            <p
              className={`mt-0.5 text-sm font-medium capitalize ${healthColor}`}
              role="status"
              aria-label={`Health: ${health}`}
            >
              {health}
            </p>
          </div>
          <div>
            <p className="text-xs text-base-content/50">Active Sessions</p>
            <p className="mt-0.5 text-sm font-medium">{sessionCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
