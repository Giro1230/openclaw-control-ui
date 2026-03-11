import { NextResponse } from "next/server";
import { hasRole, AGENT_READ_MIN_ROLE, AGENT_WRITE_MIN_ROLE } from "@/types/rbac";
import { getAppRole, getOwnerId } from "@/lib/auth/get-role";
import { listAgents, createAgent } from "@/lib/agent/store";
import { agentCreateSchema } from "@/lib/agent/schema";

/** GET /api/agents — List agents (viewer role or above) */
export async function GET(request: Request) {
  const role = await getAppRole(request.headers);
  if (!hasRole(role, AGENT_READ_MIN_ROLE)) {
    return NextResponse.json(
      { error: "forbidden", message: "Insufficient role" },
      { status: 403 }
    );
  }
  const ownerId = await getOwnerId(request.headers);
  const list = listAgents(ownerId);
  return NextResponse.json({ agents: list });
}

/** POST /api/agents — Create an agent (operator role or above) */
export async function POST(request: Request) {
  const role = await getAppRole(request.headers);
  if (!hasRole(role, AGENT_WRITE_MIN_ROLE)) {
    return NextResponse.json(
      { error: "forbidden", message: "Insufficient role" },
      { status: 403 }
    );
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = agentCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const ownerId = await getOwnerId(request.headers);
  try {
    const agent = createAgent(parsed.data, ownerId);
    return NextResponse.json(agent, { status: 201 });
  } catch (e) {
    const err = e as Error;
    if (err.message === "SLUG_EXISTS") {
      return NextResponse.json({ error: "slug_exists" }, { status: 409 });
    }
    throw e;
  }
}
