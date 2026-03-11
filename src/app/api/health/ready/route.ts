import { NextResponse } from "next/server";

type HealthStatus = "ok" | "degraded" | "error";

interface HealthCheck {
  name: string;
  status: HealthStatus;
  latencyMs?: number;
  detail?: string;
}

/**
 * GET /api/health/ready
 * Readiness probe: checks whether dependent services (Gateway, Supabase) are reachable.
 * No authentication required (used by load balancers and orchestrators).
 *
 * HTTP status codes:
 *  200 — all checks ok
 *  207 — degraded (some checks failed but service can still serve traffic)
 *  503 — error (service should not receive traffic)
 */
export async function GET() {
  const checks: HealthCheck[] = [];
  let overallStatus: HealthStatus = "ok";

  // ── Gateway connectivity check ────────────────────────────────────
  const gatewayUrl = process.env.OPENCLAW_GATEWAY_URL;
  if (gatewayUrl) {
    const start = Date.now();
    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 3000);
      const res = await fetch(`${gatewayUrl}/health`, {
        signal: ctrl.signal,
        headers: { Authorization: `Bearer ${process.env.OPENCLAW_GATEWAY_TOKEN ?? ""}` },
      }).finally(() => clearTimeout(timeout));
      const checkStatus: HealthStatus = res.ok ? "ok" : "degraded";
      checks.push({
        name: "gateway",
        status: checkStatus,
        latencyMs: Date.now() - start,
        detail: res.ok ? undefined : `HTTP ${res.status}`,
      });
      if (checkStatus === "degraded" && overallStatus === "ok") overallStatus = "degraded";
    } catch {
      checks.push({
        name: "gateway",
        status: "degraded",
        latencyMs: Date.now() - start,
        detail: "unreachable",
      });
      if (overallStatus === "ok") overallStatus = "degraded";
    }
  } else {
    checks.push({ name: "gateway", status: "ok", detail: "not configured (optional)" });
  }

  // ── Supabase connectivity check ───────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    const start = Date.now();
    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 3000);
      const res = await fetch(`${supabaseUrl}/rest/v1/`, {
        signal: ctrl.signal,
        headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "" },
      }).finally(() => clearTimeout(timeout));
      const checkStatus: HealthStatus = res.ok || res.status === 400 ? "ok" : "degraded";
      checks.push({
        name: "supabase",
        status: checkStatus,
        latencyMs: Date.now() - start,
      });
      if (checkStatus === "degraded" && overallStatus === "ok") overallStatus = "degraded";
    } catch {
      checks.push({
        name: "supabase",
        status: "degraded",
        latencyMs: Date.now() - start,
        detail: "unreachable",
      });
      if (overallStatus === "ok") overallStatus = "degraded";
    }
  } else {
    checks.push({ name: "supabase", status: "ok", detail: "not configured (using env-auth)" });
  }

  // 200 = ok, 207 = degraded (partial), 503 = error (critical failure)
  const httpStatus =
    (overallStatus as string) === "error" ? 503 : overallStatus === "degraded" ? 207 : 200;

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks,
    },
    {
      status: httpStatus,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    }
  );
}
