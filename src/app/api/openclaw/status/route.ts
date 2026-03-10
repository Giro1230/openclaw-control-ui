import { NextResponse } from "next/server";
import { fetchGatewayStatus } from "@/lib/openclaw/gateway-client";

/**
 * GET: OpenClaw Gateway 상태 (서버에서만 Gateway 호출, 토큰 노출 없음)
 */
export async function GET() {
  try {
    const status = await fetchGatewayStatus();
    return NextResponse.json({ ok: true, status });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: err.message === "OPENCLAW_GATEWAY_TIMEOUT" ? 504 : 502 }
    );
  }
}
