/**
 * 에이전트 도메인 타입
 * OpenClaw Gateway와 연동되는 에이전트 설정/메타데이터.
 */

/** 에이전트 런타임 타입 (gateway에서 인식하는 종류) */
export type AgentKind = "assistant" | "tool" | "custom";

/** DB/API용 에이전트 레코드 */
export interface Agent {
  id: string;
  name: string;
  slug: string;
  kind: AgentKind;
  /** 시스템/사용자 프롬프트 등 설정 JSON */
  config: AgentConfig;
  /** 소유자(팀/유저) 식별. RLS에서 사용 */
  owner_id: string;
  created_at: string;
  updated_at: string;
}

/** 에이전트 설정 본문 (확장 가능) */
export interface AgentConfig {
  system_prompt?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  tools?: string[];
  [key: string]: unknown;
}

/** 목록 조회 시 사용하는 경량 타입 */
export interface AgentSummary {
  id: string;
  name: string;
  slug: string;
  kind: AgentKind;
  updated_at: string;
}

/** 생성/수정 요청 바디 */
export interface AgentCreateInput {
  name: string;
  slug?: string;
  kind: AgentKind;
  config?: AgentConfig;
}

export interface AgentUpdateInput {
  name?: string;
  slug?: string;
  kind?: AgentKind;
  config?: AgentConfig;
}
