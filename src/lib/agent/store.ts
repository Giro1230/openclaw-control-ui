import type { Agent, AgentCreateInput, AgentUpdateInput } from "@/types/agent";
import * as file from "./store-file";
import * as memory from "./store-memory";

/**
 * 에이전트 저장소: AGENT_STORE_PATH(또는 SQLITE_PATH) 설정 시 JSON 파일, 없으면 인메모리
 */
function isFileStoreEnabled(): boolean {
  const p = process.env.AGENT_STORE_PATH ?? process.env.SQLITE_PATH;
  return typeof p === "string" && p.trim().length > 0;
}

export function listAgents(ownerId?: string): Agent[] {
  return isFileStoreEnabled() ? file.listAgents(ownerId) : memory.listAgents(ownerId);
}

export function getAgentById(id: string): Agent | undefined {
  return isFileStoreEnabled() ? file.getAgentById(id) : memory.getAgentById(id);
}

export function getAgentBySlug(slug: string, ownerId?: string): Agent | undefined {
  return isFileStoreEnabled() ? file.getAgentBySlug(slug, ownerId) : memory.getAgentBySlug(slug, ownerId);
}

export function createAgent(input: AgentCreateInput, ownerId: string): Agent {
  return isFileStoreEnabled() ? file.createAgent(input, ownerId) : memory.createAgent(input, ownerId);
}

export function updateAgent(id: string, input: AgentUpdateInput, ownerId: string): Agent | null {
  return isFileStoreEnabled() ? file.updateAgent(id, input, ownerId) : memory.updateAgent(id, input, ownerId);
}

export function deleteAgent(id: string, ownerId: string): boolean {
  return isFileStoreEnabled() ? file.deleteAgent(id, ownerId) : memory.deleteAgent(id, ownerId);
}
