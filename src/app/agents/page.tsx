import { AgentsList } from "@/components/agent/agents-list";

/**
 * 에이전트 목록 페이지 (테이블 + 새로 만들기)
 */
export default function AgentsPage() {
  return (
    <div className="space-y-6">
      <AgentsList />
    </div>
  );
}
