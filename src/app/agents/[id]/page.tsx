import { AgentDetail } from "@/components/agent/agent-detail";

type Props = { params: Promise<{ id: string }> };

/**
 * 에이전트 상세/설정 페이지 (조회 + 수정 폼)
 */
export default async function AgentDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <AgentDetail agentId={id} />
    </div>
  );
}
