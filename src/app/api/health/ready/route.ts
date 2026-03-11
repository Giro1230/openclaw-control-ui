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
 * Readiness probe: 의존 서비스(Gateway, Supabase) 준비 상태 확인
 * 인증 불필요 (로드밸런서/오케스트레이터에서 호출)
 */
export async function GET() {
  const checks: HealthCheck[] = [];
  let overallStatus: HealthStatus = "ok";

  // ── Gateway 연결 확인 ──────────────────────────────────────────────
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
      checks.push({
        name: "gateway",
        status: res.ok ? "ok" : "degraded",
        latencyMs: Date.now() - start,
        detail: res.ok ? undefined : `HTTP ${res.status}`,
      });
      if (!res.ok) overallStatus = "degraded";
    } catch {
      checks.push({
        name: "gateway",
        status: "degraded",
        latencyMs: Date.now() - start,
        detail: "연결 불가",
      });
      overallStatus = "degraded";
    }
  } else {
    checks.push({ name: "gateway", status: "ok", detail: "미설정 (선택사항)" });
  }

  // ── Supabase 연결 확인 ────────────────────────────────────────────
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
      checks.push({
        name: "supabase",
        status: res.ok || res.status === 400 ? "ok" : "degraded",
        latencyMs: Date.now() - start,
      });
    } catch {
      checks.push({
        name: "supabase",
        status: "degraded",
        latencyMs: Date.now() - start,
        detail: "연결 불가",
      });
      overallStatus = "degraded";
    }
  } else {
    checks.push({ name: "supabase", status: "ok", detail: "미설정 (env-auth 사용 중)" });
  }

  const httpStatus = (overallStatus as string) === "error" ? 503 : 200;

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
