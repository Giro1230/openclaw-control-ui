"use client";

import { useState } from "react";

interface QuickActionsProps {
  gatewayConfigured: boolean;
}

export function QuickActions({ gatewayConfigured }: QuickActionsProps) {
  const [heartbeat, setHeartbeat] = useState(true);
  const [restarting, setRestarting] = useState(false);

  async function handleRestart() {
    if (!gatewayConfigured) return;
    setRestarting(true);
    // Placeholder: wire to POST /api/openclaw/restart when Gateway supports it
    await new Promise((r) => setTimeout(r, 1500));
    setRestarting(false);
  }

  return (
    <div className="card bg-base-200 border border-base-300">
      <div className="card-body p-5">
        <h2 className="text-sm font-semibold text-base-content/60 uppercase tracking-wider">
          Quick Actions
        </h2>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            className={`btn btn-sm gap-2 ${
              heartbeat ? "btn-success" : "btn-outline"
            }`}
            onClick={() => setHeartbeat((v) => !v)}
            title="Toggle heartbeat monitoring"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                heartbeat ? "bg-success-content animate-pulse" : "bg-base-content/30"
              }`}
            />
            Heartbeat {heartbeat ? "On" : "Off"}
          </button>

          <button
            className="btn btn-sm btn-outline gap-2"
            onClick={handleRestart}
            disabled={!gatewayConfigured || restarting}
            title={
              gatewayConfigured
                ? "Restart the assistant"
                : "Gateway not configured"
            }
          >
            {restarting ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <span>↺</span>
            )}
            {restarting ? "Restarting…" : "Restart"}
          </button>
        </div>

        {!gatewayConfigured && (
          <p className="mt-2 text-xs text-base-content/40">
            Set <code>OPENCLAW_GATEWAY_URL</code> to enable Gateway actions.
          </p>
        )}
      </div>
    </div>
  );
}
