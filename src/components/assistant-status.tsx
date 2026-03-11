"use client";

interface StatusBadgeProps {
  online: boolean;
}

function StatusBadge({ online }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        online
          ? "bg-success/15 text-success"
          : "bg-error/15 text-error"
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

interface AssistantStatusProps {
  online: boolean;
  model?: string;
  uptime?: number;
  health: "ok" | "degraded" | "error" | "unknown";
  sessionCount: number;
}

export function AssistantStatus({
  online,
  model,
  uptime,
  health,
  sessionCount,
}: AssistantStatusProps) {
  const healthColor =
    health === "ok"
      ? "text-success"
      : health === "degraded"
        ? "text-warning"
        : health === "error"
          ? "text-error"
          : "text-base-content/40";

  const uptimeDisplay =
    uptime !== undefined
      ? uptime < 60
        ? `${uptime}s`
        : uptime < 3600
          ? `${Math.floor(uptime / 60)}m`
          : `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`
      : "—";

  return (
    <div className="card bg-base-200 border border-base-300">
      <div className="card-body p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-base-content/60 uppercase tracking-wider">
            Assistant Status
          </h2>
          <StatusBadge online={online} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-base-content/50">Model</p>
            <p className="mt-0.5 text-sm font-medium truncate">
              {model ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-base-content/50">Uptime</p>
            <p className="mt-0.5 text-sm font-medium">{uptimeDisplay}</p>
          </div>
          <div>
            <p className="text-xs text-base-content/50">Health</p>
            <p className={`mt-0.5 text-sm font-medium capitalize ${healthColor}`}>
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
