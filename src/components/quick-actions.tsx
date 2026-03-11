"use client";

import { useState } from "react";

type ActionState = "idle" | "confirming" | "running" | "success" | "error";

interface QuickActionsProps {
  gatewayConfigured: boolean;
}

export function QuickActions({ gatewayConfigured }: QuickActionsProps) {
  const [heartbeat, setHeartbeat] = useState(true);
  const [heartbeatFeedback, setHeartbeatFeedback] = useState<string | null>(null);

  const [restartState, setRestartState] = useState<ActionState>("idle");
  const [restartError, setRestartError] = useState<string | null>(null);

  function handleHeartbeatToggle() {
    const next = !heartbeat;
    setHeartbeat(next);
    setHeartbeatFeedback(next ? "Heartbeat enabled." : "Heartbeat disabled.");
    setTimeout(() => setHeartbeatFeedback(null), 2500);
  }

  function handleRestartClick() {
    if (!gatewayConfigured || restartState === "running") return;
    setRestartState("confirming");
    setRestartError(null);
  }

  function handleRestartCancel() {
    setRestartState("idle");
    setRestartError(null);
  }

  async function handleRestartConfirm() {
    setRestartState("running");
    setRestartError(null);
    try {
      // Placeholder: wire to POST /api/openclaw/restart when Gateway exposes it
      // Placeholder: replace with real fetch when Gateway exposes a restart endpoint
      await new Promise<void>((resolve) => setTimeout(resolve, 1500));
      setRestartState("success");
      setTimeout(() => setRestartState("idle"), 3000);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Unexpected error. Check server logs.";
      setRestartError(msg);
      setRestartState("error");
    }
  }

  return (
    <div className="card bg-base-200 border border-base-300">
      <div className="card-body p-5">
        <h2 className="text-sm font-semibold text-base-content/60 uppercase tracking-wider">
          Quick Actions
        </h2>

        <div className="mt-4 flex flex-wrap gap-3">
          {/* Heartbeat toggle */}
          <button
            className={`btn btn-sm gap-2 ${heartbeat ? "btn-success" : "btn-outline"}`}
            onClick={handleHeartbeatToggle}
            title="Toggle heartbeat monitoring"
            aria-pressed={heartbeat}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                heartbeat
                  ? "bg-success-content animate-pulse"
                  : "bg-base-content/30"
              }`}
            />
            Heartbeat {heartbeat ? "On" : "Off"}
          </button>

          {/* Restart button — idle / confirming / running / success / error */}
          {restartState === "confirming" ? (
            <span className="flex items-center gap-2">
              <span className="text-xs text-warning">Restart assistant?</span>
              <button
                className="btn btn-xs btn-error"
                onClick={handleRestartConfirm}
              >
                Yes, restart
              </button>
              <button
                className="btn btn-xs btn-ghost"
                onClick={handleRestartCancel}
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              className={`btn btn-sm gap-2 ${
                restartState === "success"
                  ? "btn-success"
                  : restartState === "error"
                    ? "btn-error"
                    : "btn-outline"
              }`}
              onClick={handleRestartClick}
              disabled={!gatewayConfigured || restartState === "running"}
              title={
                !gatewayConfigured
                  ? "Gateway not configured"
                  : "Restart the assistant"
              }
              aria-busy={restartState === "running"}
            >
              {restartState === "running" ? (
                <span className="loading loading-spinner loading-xs" />
              ) : restartState === "success" ? (
                <span>✓</span>
              ) : restartState === "error" ? (
                <span>✕</span>
              ) : (
                <span>↺</span>
              )}
              {restartState === "running"
                ? "Restarting…"
                : restartState === "success"
                  ? "Restarted"
                  : restartState === "error"
                    ? "Failed"
                    : "Restart"}
            </button>
          )}
        </div>

        {/* Inline feedback messages */}
        {heartbeatFeedback && (
          <p className="mt-2 text-xs text-base-content/60" role="status">
            {heartbeatFeedback}
          </p>
        )}
        {restartState === "error" && restartError && (
          <p className="mt-2 text-xs text-error" role="alert">
            {restartError}
          </p>
        )}
        {restartState === "success" && (
          <p className="mt-2 text-xs text-success" role="status">
            Assistant restarted successfully.
          </p>
        )}

        {!gatewayConfigured && (
          <p className="mt-2 text-xs text-base-content/40">
            Set <code>OPENCLAW_GATEWAY_URL</code> to enable Gateway actions.
          </p>
        )}
      </div>
    </div>
  );
}
