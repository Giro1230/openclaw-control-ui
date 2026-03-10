import type { Agent, AgentCreateInput, AgentUpdateInput } from "@/types/agent";

/**
 * 에이전트 인메모리 저장소 (SQLITE_PATH 미설정 시 사용)
 */

function generateId(): string {
  return `agt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "");
}

const store = new Map<string, Agent>();

export function listAgents(ownerId?: string): Agent[] {
  const list = Array.from(store.values());
  if (ownerId) {
    return list.filter((a) => a.owner_id === ownerId);
  }
  return list.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}

export function getAgentById(id: string): Agent | undefined {
  return store.get(id);
}

export function getAgentBySlug(slug: string, ownerId?: string): Agent | undefined {
  const list = Array.from(store.values());
  return list.find((a) => a.slug === slug && (ownerId == null || a.owner_id === ownerId));
}

export function createAgent(input: AgentCreateInput, ownerId: string): Agent {
  const now = new Date().toISOString();
  const slug = input.slug?.trim() || slugFromName(input.name) || generateId().slice(0, 12);
  if (getAgentBySlug(slug, ownerId)) {
    throw new Error("SLUG_EXISTS");
  }
  const agent: Agent = {
    id: generateId(),
    name: input.name.trim(),
    slug,
    kind: input.kind,
    config: input.config ?? {},
    owner_id: ownerId,
    created_at: now,
    updated_at: now,
  };
  store.set(agent.id, agent);
  return agent;
}

export function updateAgent(id: string, input: AgentUpdateInput, ownerId: string): Agent | null {
  const existing = store.get(id);
  if (!existing || existing.owner_id !== ownerId) {
    return null;
  }
  const slug = input.slug !== undefined ? input.slug.trim() : existing.slug;
  if (slug && slug !== existing.slug) {
    const conflict = getAgentBySlug(slug, ownerId);
    if (conflict) {
      throw new Error("SLUG_EXISTS");
    }
  }
  const updated: Agent = {
    ...existing,
    ...(input.name !== undefined && { name: input.name.trim() }),
    ...(slug && { slug }),
    ...(input.kind !== undefined && { kind: input.kind }),
    ...(input.config !== undefined && { config: input.config }),
    updated_at: new Date().toISOString(),
  };
  store.set(id, updated);
  return updated;
}

export function deleteAgent(id: string, ownerId: string): boolean {
  const existing = store.get(id);
  if (!existing || existing.owner_id !== ownerId) {
    return false;
  }
  return store.delete(id);
}
