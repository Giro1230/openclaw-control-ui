import type { Agent, AgentCreateInput, AgentUpdateInput } from "@/types/agent";
import * as file from "./store-file";
import * as memory from "./store-memory";

/**
 * Agent store facade.
 * Routes to the JSON file store when AGENT_STORE_PATH (or SQLITE_PATH) is set;
 * otherwise uses the in-memory store.
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
