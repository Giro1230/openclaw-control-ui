import fs from "fs";
import path from "path";
import type { Agent, AgentCreateInput, AgentUpdateInput } from "@/types/agent";

/**
 * 에이전트 JSON 파일 저장소 (AGENT_STORE_PATH 설정 시 사용, 네이티브 빌드 없음)
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

function getPath(): string {
  const p = process.env.AGENT_STORE_PATH ?? process.env.SQLITE_PATH;
  if (typeof p === "string" && p.trim()) {
    return p.trim();
  }
  return path.join(process.cwd(), "data", "agents.json");
}

function loadAll(): Agent[] {
  const filePath = getPath();
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw) as Agent[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveAll(agents: Agent[]): void {
  const filePath = getPath();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(agents, null, 2), "utf-8");
}

export function listAgents(ownerId?: string): Agent[] {
  const list = loadAll();
  const filtered = ownerId ? list.filter((a) => a.owner_id === ownerId) : list;
  return filtered.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}

export function getAgentById(id: string): Agent | undefined {
  return loadAll().find((a) => a.id === id);
}

export function getAgentBySlug(slug: string, ownerId?: string): Agent | undefined {
  return loadAll().find((a) => a.slug === slug && (ownerId == null || a.owner_id === ownerId));
}

export function createAgent(input: AgentCreateInput, ownerId: string): Agent {
  const all = loadAll();
  const now = new Date().toISOString();
  const slug = input.slug?.trim() || slugFromName(input.name) || generateId().slice(0, 12);
  if (all.some((a) => a.slug === slug && a.owner_id === ownerId)) {
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
  all.push(agent);
  saveAll(all);
  return agent;
}

export function updateAgent(id: string, input: AgentUpdateInput, ownerId: string): Agent | null {
  const all = loadAll();
  const idx = all.findIndex((a) => a.id === id && a.owner_id === ownerId);
  if (idx === -1) return null;
  const existing = all[idx];
  const slug = input.slug !== undefined ? input.slug.trim() : existing.slug;
  if (slug !== existing.slug && all.some((a) => a.owner_id === ownerId && a.slug === slug)) {
    throw new Error("SLUG_EXISTS");
  }
  const updated: Agent = {
    ...existing,
    ...(input.name !== undefined && { name: input.name.trim() }),
    ...(slug && { slug }),
    ...(input.kind !== undefined && { kind: input.kind }),
    ...(input.config !== undefined && { config: input.config }),
    updated_at: new Date().toISOString(),
  };
  all[idx] = updated;
  saveAll(all);
  return updated;
}

export function deleteAgent(id: string, ownerId: string): boolean {
  const all = loadAll();
  const idx = all.findIndex((a) => a.id === id && a.owner_id === ownerId);
  if (idx === -1) return false;
  all.splice(idx, 1);
  saveAll(all);
  return true;
}
