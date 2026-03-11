import { describe, it, expect } from "vitest";
import {
  agentConfigSchema,
  agentCreateSchema,
  agentUpdateSchema,
} from "@/lib/agent/schema";

describe("agentConfigSchema", () => {
  it("accepts valid config", () => {
    const result = agentConfigSchema.safeParse({
      system_prompt: "You are a helpful assistant.",
      model: "gpt-4",
      temperature: 0.7,
      max_tokens: 2048,
      tools: ["search", "code"],
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty object (all fields optional)", () => {
    expect(agentConfigSchema.safeParse({}).success).toBe(true);
  });

  it("rejects temperature out of range", () => {
    const result = agentConfigSchema.safeParse({ temperature: 3.0 });
    expect(result.success).toBe(false);
  });

  it("rejects max_tokens below minimum", () => {
    const result = agentConfigSchema.safeParse({ max_tokens: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects system_prompt over 10000 characters", () => {
    const result = agentConfigSchema.safeParse({
      system_prompt: "a".repeat(10001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects unknown keys (strict mode)", () => {
    const result = agentConfigSchema.safeParse({ unknown_field: "value" });
    expect(result.success).toBe(false);
  });
});

describe("agentCreateSchema", () => {
  it("accepts valid create input", () => {
    const result = agentCreateSchema.safeParse({
      name: "My Agent",
      kind: "assistant",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("My Agent");
      expect(result.data.kind).toBe("assistant");
    }
  });

  it("rejects missing name", () => {
    const result = agentCreateSchema.safeParse({ kind: "assistant" });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = agentCreateSchema.safeParse({ name: "", kind: "assistant" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid kind", () => {
    const result = agentCreateSchema.safeParse({
      name: "Test",
      kind: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid slug format", () => {
    const result = agentCreateSchema.safeParse({
      name: "Test",
      kind: "tool",
      slug: "my-valid-slug_123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects slug with uppercase letters", () => {
    const result = agentCreateSchema.safeParse({
      name: "Test",
      kind: "tool",
      slug: "Invalid-Slug",
    });
    expect(result.success).toBe(false);
  });

  it("rejects slug with special characters", () => {
    const result = agentCreateSchema.safeParse({
      name: "Test",
      kind: "tool",
      slug: "invalid slug!",
    });
    expect(result.success).toBe(false);
  });

  it("rejects name over 128 characters", () => {
    const result = agentCreateSchema.safeParse({
      name: "a".repeat(129),
      kind: "assistant",
    });
    expect(result.success).toBe(false);
  });

  it("accepts config field", () => {
    const result = agentCreateSchema.safeParse({
      name: "Test Agent",
      kind: "custom",
      config: { temperature: 1.0, model: "claude-3" },
    });
    expect(result.success).toBe(true);
  });
});

describe("agentUpdateSchema", () => {
  it("accepts empty object (all fields optional)", () => {
    expect(agentUpdateSchema.safeParse({}).success).toBe(true);
  });

  it("accepts name-only update", () => {
    const result = agentUpdateSchema.safeParse({ name: "New Name" });
    expect(result.success).toBe(true);
  });

  it("accepts config-only update", () => {
    const result = agentUpdateSchema.safeParse({
      config: { temperature: 0.5 },
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid kind", () => {
    const result = agentUpdateSchema.safeParse({ kind: "unknown" });
    expect(result.success).toBe(false);
  });
});
