import { NextResponse } from "next/server";
import { fetchGatewayStatus } from "@/lib/openclaw/gateway-client";
import { getSessionUser } from "@/lib/auth/session";

/**
 * GET: OpenClaw Gateway 상태 (인증 필수)
 * 서버에서만 Gateway 호출하여 토큰 노출 방지
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

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
