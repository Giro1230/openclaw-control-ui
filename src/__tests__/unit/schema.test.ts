import { describe, it, expect } from "vitest";
import {
  agentConfigSchema,
  agentCreateSchema,
  agentUpdateSchema,
} from "@/lib/agent/schema";

describe("agentConfigSchema", () => {
  it("유효한 설정 파싱 성공", () => {
    const result = agentConfigSchema.safeParse({
      system_prompt: "You are a helpful assistant.",
      model: "gpt-4",
      temperature: 0.7,
      max_tokens: 2048,
      tools: ["search", "code"],
    });
    expect(result.success).toBe(true);
  });

  it("빈 객체도 유효 (모든 필드 optional)", () => {
    expect(agentConfigSchema.safeParse({}).success).toBe(true);
  });

  it("temperature 범위 초과 시 실패", () => {
    const result = agentConfigSchema.safeParse({ temperature: 3.0 });
    expect(result.success).toBe(false);
  });

  it("max_tokens 최소값 미만 시 실패", () => {
    const result = agentConfigSchema.safeParse({ max_tokens: 0 });
    expect(result.success).toBe(false);
  });

  it("system_prompt 10000자 초과 시 실패", () => {
    const result = agentConfigSchema.safeParse({
      system_prompt: "a".repeat(10001),
    });
    expect(result.success).toBe(false);
  });

  it("미지의 키 포함 시 strict 모드로 실패", () => {
    const result = agentConfigSchema.safeParse({ unknown_field: "value" });
    expect(result.success).toBe(false);
  });
});

describe("agentCreateSchema", () => {
  it("유효한 에이전트 생성 입력 파싱 성공", () => {
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

  it("name 누락 시 실패", () => {
    const result = agentCreateSchema.safeParse({ kind: "assistant" });
    expect(result.success).toBe(false);
  });

  it("빈 name 시 실패", () => {
    const result = agentCreateSchema.safeParse({ name: "", kind: "assistant" });
    expect(result.success).toBe(false);
  });

  it("유효하지 않은 kind 값 실패", () => {
    const result = agentCreateSchema.safeParse({
      name: "Test",
      kind: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("slug 형식 검증 - 올바른 slug", () => {
    const result = agentCreateSchema.safeParse({
      name: "Test",
      kind: "tool",
      slug: "my-valid-slug_123",
    });
    expect(result.success).toBe(true);
  });

  it("slug 형식 검증 - 대문자 포함 실패", () => {
    const result = agentCreateSchema.safeParse({
      name: "Test",
      kind: "tool",
      slug: "Invalid-Slug",
    });
    expect(result.success).toBe(false);
  });

  it("slug 형식 검증 - 특수문자 포함 실패", () => {
    const result = agentCreateSchema.safeParse({
      name: "Test",
      kind: "tool",
      slug: "invalid slug!",
    });
    expect(result.success).toBe(false);
  });

  it("name 128자 초과 시 실패", () => {
    const result = agentCreateSchema.safeParse({
      name: "a".repeat(129),
      kind: "assistant",
    });
    expect(result.success).toBe(false);
  });

  it("config 포함 시 정상 파싱", () => {
    const result = agentCreateSchema.safeParse({
      name: "Test Agent",
      kind: "custom",
      config: { temperature: 1.0, model: "claude-3" },
    });
    expect(result.success).toBe(true);
  });
});

describe("agentUpdateSchema", () => {
  it("모든 필드 optional - 빈 객체 유효", () => {
    expect(agentUpdateSchema.safeParse({}).success).toBe(true);
  });

  it("name만 업데이트 가능", () => {
    const result = agentUpdateSchema.safeParse({ name: "New Name" });
    expect(result.success).toBe(true);
  });

  it("config만 업데이트 가능", () => {
    const result = agentUpdateSchema.safeParse({
      config: { temperature: 0.5 },
    });
    expect(result.success).toBe(true);
  });

  it("유효하지 않은 kind 값 실패", () => {
    const result = agentUpdateSchema.safeParse({ kind: "unknown" });
    expect(result.success).toBe(false);
  });
});
