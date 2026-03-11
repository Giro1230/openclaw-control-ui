import { z } from "zod";

/** Zod schema for AgentConfig (form and API validation) */
export const agentConfigSchema = z.object({
  system_prompt: z.string().max(10000).optional(),
  model: z.string().max(128).optional(),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().min(1).max(128000).optional(),
  tools: z.array(z.string()).optional(),
}).strict();

/** Schema for agent creation requests */
export const agentCreateSchema = z.object({
  name: z.string().min(1, "name is required").max(128),
  slug: z.string().min(1).max(64).regex(/^[a-z0-9_-]+$/, "slug: lowercase letters, digits, hyphens and underscores only").optional(),
  kind: z.enum(["assistant", "tool", "custom"]),
  config: agentConfigSchema.optional(),
});

/** Schema for agent update requests */
export const agentUpdateSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  slug: z.string().min(1).max(64).regex(/^[a-z0-9_-]+$/).optional(),
  kind: z.enum(["assistant", "tool", "custom"]).optional(),
  config: agentConfigSchema.optional(),
});

export type AgentCreateSchema = z.infer<typeof agentCreateSchema>;
export type AgentUpdateSchema = z.infer<typeof agentUpdateSchema>;
