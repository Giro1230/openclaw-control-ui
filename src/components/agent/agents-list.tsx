"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AgentSummary } from "@/types/agent";

const KIND_LABEL: Record<string, string> = {
  assistant: "agent.kindAssistant",
  tool: "agent.kindTool",
  custom: "agent.kindCustom",
};

/**
 * 에이전트 목록: API 조회 후 테이블 렌더, 새로 만들기 링크, 행 클릭 시 상세 이동
 */
export function AgentsList() {
  const t = useTranslations("agent");
  const tCommon = useTranslations("common");
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/agents");
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data?.message || "목록 조회 실패");
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setAgents(data.agents ?? []);
        }
      } catch (e) {
        if (!cancelled) {
          setError((e as Error).message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="text-muted-foreground">{tCommon("loading")}</p>;
  }
  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">{t("listTitle")}</h2>
        <Link href="/agents/new" className="btn btn-primary">
          {t("newAgent")}
        </Link>
      </div>
      {agents.length === 0 ? (
        <p className="text-muted-foreground">{t("noAgents")}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("slug")}</TableHead>
              <TableHead>{t("kind")}</TableHead>
              <TableHead>{t("updatedAt")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents.map((agent) => (
              <TableRow key={agent.id}>
                <TableCell>
                  <Link
                    href={`/agents/${agent.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {agent.name}
                  </Link>
                </TableCell>
                <TableCell className="font-mono text-muted-foreground">
                  {agent.slug}
                </TableCell>
                <TableCell>{t(KIND_LABEL[agent.kind] ?? "kindCustom")}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(agent.updated_at).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
