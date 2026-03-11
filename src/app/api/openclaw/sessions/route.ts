import { NextResponse } from "next/server";
import { listGatewaySessions } from "@/lib/openclaw/gateway-client";
import { getSessionUser } from "@/lib/auth/session";

/**
 * GET /api/openclaw/sessions
 * Relays the session list from the Gateway (viewer role or above).
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  try {
    const sessions = await listGatewaySessions();
    return NextResponse.json({ sessions });
  } catch (e) {
    const err = e as Error;
    if (err.message === "OPENCLAW_GATEWAY_TIMEOUT") {
      return NextResponse.json({ error: "gateway_timeout" }, { status: 504 });
    }
    if (err.message.includes("OPENCLAW_GATEWAY_URL")) {
      return NextResponse.json(
        { sessions: [], error: "gateway_not_configured" },
        { status: 200 }
      );
    }
    return NextResponse.json({ sessions: [], error: err.message }, { status: 200 });
  }
}
