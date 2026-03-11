import { NextResponse } from "next/server";
import { sendChat } from "@/lib/openclaw/gateway-client";
import { getSessionUser } from "@/lib/auth/session";

/**
 * POST /api/openclaw/chat
 * Body: { message: string; agent_id: string; session_id?: string }
 * Relays the chat message to the Gateway (token never exposed to the client).
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { message, agent_id, session_id } = body as {
    message?: string;
    agent_id?: string;
    session_id?: string;
  };

  if (!message || !agent_id) {
    return NextResponse.json(
      { error: "message and agent_id are required" },
      { status: 400 }
    );
  }

  try {
    const result = await sendChat(message, agent_id, session_id);
    return NextResponse.json(result);
  } catch (e) {
    const err = e as Error;
    if (err.message === "OPENCLAW_GATEWAY_TIMEOUT") {
      return NextResponse.json({ error: "gateway_timeout" }, { status: 504 });
    }
    if (err.message.includes("OPENCLAW_GATEWAY_URL")) {
      return NextResponse.json(
        { error: "gateway_not_configured" },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}
