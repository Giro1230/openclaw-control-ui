"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Agent, AgentKind } from "@/types/agent";

type Props = { agentId: string };

/**
 * 에이전트 상세: GET 후 표시, 수정 폼 제출 시 PATCH, 삭제 시 DELETE 후 목록으로
 */
export function AgentDetail({ agentId }: Props) {
  const t = useTranslations("agent");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [edit, setEdit] = useState({
    name: "",
    slug: "",
    kind: "assistant" as AgentKind,
    system_prompt: "",
    model: "",
    temperature: "",
    max_tokens: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/agents/${agentId}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError(t("notFound"));
          } else {
            setError("조회 실패");
          }
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setAgent(data);
          setEdit({
            name: data.name,
            slug: data.slug,
            kind: data.kind,
            system_prompt: data.config?.system_prompt ?? "",
            model: data.config?.model ?? "",
            temperature: data.config?.temperature?.toString() ?? "",
            max_tokens: data.config?.max_tokens?.toString() ?? "",
          });
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
  }, [agentId, t]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agent) return;
    setSubmitting(true);
    setError(null);
    const payload = {
      name: edit.name.trim(),
      slug: edit.slug.trim() || undefined,
      kind: edit.kind,
      config: {
        ...(edit.system_prompt && { system_prompt: edit.system_prompt }),
        ...(edit.model && { model: edit.model }),
        ...(edit.temperature && {
          temperature: Number(edit.temperature),
        }),
        ...(edit.max_tokens && {
          max_tokens: Number(edit.max_tokens),
        }),
      },
    };
    try {
      const res = await fetch(`/api/agents/${agent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.error === "validation" && data.details) {
          setError(Object.values(data.details).flat().join(", "));
        } else if (data.error === "slug_exists") {
          setError("이미 사용 중인 슬러그입니다.");
        } else {
          setError(data.message || "수정 실패");
        }
        setSubmitting(false);
        return;
      }
      setAgent(data);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!agent || !deleteConfirm) return;
    const res = await fetch(`/api/agents/${agent.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/agents");
      router.refresh();
    } else {
      setError(t("forbidden"));
    }
  }

  if (loading) {
    return <p className="text-muted-foreground">{tCommon("loading")}</p>;
  }
  if (error && !agent) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" asChild>
          <Link href="/agents">{tCommon("back")}</Link>
        </Button>
      </div>
    );
  }
  if (!agent) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/agents">← {tCommon("back")}</Link>
          </Button>
          <h2 className="text-xl font-semibold">{agent.name}</h2>
          <span className="rounded bg-muted px-2 py-0.5 text-sm text-muted-foreground">
            {agent.slug}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="name">{t("name")} *</Label>
          <Input
            id="name"
            value={edit.name}
            onChange={(e) => setEdit((f) => ({ ...f, name: e.target.value }))}
            required
            maxLength={128}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">{t("slug")}</Label>
          <Input
            id="slug"
            value={edit.slug}
            onChange={(e) => setEdit((f) => ({ ...f, slug: e.target.value }))}
            maxLength={64}
          />
        </div>
        <div className="space-y-2">
          <Label>{t("kind")}</Label>
          <Select
            value={edit.kind}
            onValueChange={(v) =>
              setEdit((f) => ({ ...f, kind: v as AgentKind }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="assistant">{t("kindAssistant")}</SelectItem>
              <SelectItem value="tool">{t("kindTool")}</SelectItem>
              <SelectItem value="custom">{t("kindCustom")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="system_prompt">{t("systemPrompt")}</Label>
          <Textarea
            id="system_prompt"
            value={edit.system_prompt}
            onChange={(e) =>
              setEdit((f) => ({ ...f, system_prompt: e.target.value }))
            }
            rows={4}
            className="font-mono text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="model">{t("model")}</Label>
            <Input
              id="model"
              value={edit.model}
              onChange={(e) => setEdit((f) => ({ ...f, model: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="temperature">{t("temperature")}</Label>
            <Input
              id="temperature"
              type="number"
              min={0}
              max={2}
              step={0.1}
              value={edit.temperature}
              onChange={(e) =>
                setEdit((f) => ({ ...f, temperature: e.target.value }))
              }
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="max_tokens">{t("maxTokens")}</Label>
          <Input
            id="max_tokens"
            type="number"
            min={1}
            max={128000}
            value={edit.max_tokens}
            onChange={(e) =>
              setEdit((f) => ({ ...f, max_tokens: e.target.value }))
            }
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? tCommon("loading") : tCommon("save")}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/agents">{tCommon("cancel")}</Link>
          </Button>
        </div>
      </form>

      <div className="border-t pt-6">
        <p className="mb-2 text-sm text-muted-foreground">
          {t("deleteConfirm")}
        </p>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.checked)}
            />
            확인
          </label>
          <Button
            type="button"
            variant="destructive"
            disabled={!deleteConfirm}
            onClick={handleDelete}
          >
            {tCommon("delete")}
          </Button>
        </div>
      </div>
    </div>
  );
}
