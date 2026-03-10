import { z } from "zod";

/** AgentConfig Zod 스키마 (폼/API 검증용) */
export const agentConfigSchema = z.object({
  system_prompt: z.string().max(10000).optional(),
  model: z.string().max(128).optional(),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().min(1).max(128000).optional(),
  tools: z.array(z.string()).optional(),
}).strict();

/** 에이전트 생성 스키마 */
export const agentCreateSchema = z.object({
  name: z.string().min(1, "이름 필수").max(128),
  slug: z.string().min(1).max(64).regex(/^[a-z0-9_-]+$/, "slug: 영소문자, 숫자, -, _ 만").optional(),
  kind: z.enum(["assistant", "tool", "custom"]),
  config: agentConfigSchema.optional(),
});

/** 에이전트 수정 스키마 */
export const agentUpdateSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  slug: z.string().min(1).max(64).regex(/^[a-z0-9_-]+$/).optional(),
  kind: z.enum(["assistant", "tool", "custom"]).optional(),
  config: agentConfigSchema.optional(),
});

export type AgentCreateSchema = z.infer<typeof agentCreateSchema>;
export type AgentUpdateSchema = z.infer<typeof agentUpdateSchema>;
