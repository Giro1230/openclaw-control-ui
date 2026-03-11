/**
 * Agent domain types.
 * Represents agent configuration and metadata for the OpenClaw Gateway.
 */

/** Agent runtime kind (recognized by the Gateway) */
export type AgentKind = "assistant" | "tool" | "custom";

/** Agent record stored in the database or file store */
export interface Agent {
  id: string;
  name: string;
  slug: string;
  kind: AgentKind;
  /** Configuration JSON (system prompt, model settings, etc.) */
  config: AgentConfig;
  /** Owner identifier (team or user). Used for RLS filtering. */
  owner_id: string;
  created_at: string;
  updated_at: string;
}

/** Agent configuration body (extensible) */
export interface AgentConfig {
  system_prompt?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  tools?: string[];
  [key: string]: unknown;
}

/** Lightweight type used for list responses */
export interface AgentSummary {
  id: string;
  name: string;
  slug: string;
  kind: AgentKind;
  updated_at: string;
}

/** Request body for creating an agent */
export interface AgentCreateInput {
  name: string;
  slug?: string;
  kind: AgentKind;
  config?: AgentConfig;
}

/** Request body for updating an agent */
export interface AgentUpdateInput {
  name?: string;
  slug?: string;
  kind?: AgentKind;
  config?: AgentConfig;
}
