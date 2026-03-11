import { NextResponse } from "next/server";
import { fetchGatewayStatus } from "@/lib/openclaw/gateway-client";
import { getSessionUser } from "@/lib/auth/session";

/**
 * GET /api/openclaw/status
 * Returns Gateway connectivity status. Authentication required.
 * The Gateway token is used server-side only and never exposed to the client.
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
