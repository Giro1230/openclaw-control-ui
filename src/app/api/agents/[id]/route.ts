import { NextResponse } from "next/server";
import { hasRole, AGENT_READ_MIN_ROLE, AGENT_WRITE_MIN_ROLE } from "@/types/rbac";
import { getAppRole, getOwnerId } from "@/lib/auth/get-role";
import { getAgentById, updateAgent, deleteAgent } from "@/lib/agent/store";
import { agentUpdateSchema } from "@/lib/agent/schema";

type Params = { params: Promise<{ id: string }> };

/**
 * GET: 에이전트 단건 조회 (viewer 이상)
 */
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const role = await getAppRole(_request.headers);
  if (!hasRole(role, AGENT_READ_MIN_ROLE)) {
    return NextResponse.json(
      { error: "forbidden", message: "역할 권한 부족" },
      { status: 403 }
    );
  }
  const ownerId = await getOwnerId(_request.headers);
  const agent = getAgentById(id);
  if (!agent || agent.owner_id !== ownerId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(agent);
}

/**
 * PATCH: 에이전트 수정 (operator 이상)
 */
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const role = await getAppRole(request.headers);
  if (!hasRole(role, AGENT_WRITE_MIN_ROLE)) {
    return NextResponse.json(
      { error: "forbidden", message: "역할 권한 부족" },
      { status: 403 }
    );
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = agentUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const ownerId = await getOwnerId(request.headers);
  try {
    const updated = updateAgent(id, parsed.data, ownerId);
    if (!updated) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (e) {
    const err = e as Error;
    if (err.message === "SLUG_EXISTS") {
      return NextResponse.json({ error: "slug_exists" }, { status: 409 });
    }
    throw e;
  }
}

/**
 * DELETE: 에이전트 삭제 (operator 이상)
 */
export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const role = await getAppRole(_request.headers);
  if (!hasRole(role, AGENT_WRITE_MIN_ROLE)) {
    return NextResponse.json(
      { error: "forbidden", message: "역할 권한 부족" },
      { status: 403 }
    );
  }
  const ownerId = await getOwnerId(_request.headers);
  const ok = deleteAgent(id, ownerId);
  if (!ok) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
