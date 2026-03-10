"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
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
import type { AgentKind } from "@/types/agent";

type FormState = {
  name: string;
  slug: string;
  kind: AgentKind;
  system_prompt: string;
  model: string;
  temperature: string;
  max_tokens: string;
};

const defaultForm: FormState = {
  name: "",
  slug: "",
  kind: "assistant",
  system_prompt: "",
  model: "",
  temperature: "",
  max_tokens: "",
};

/**
 * 에이전트 생성 폼: 이름/슬러그/종류/설정 입력 후 POST /api/agents
 */
export function AgentForm() {
  const t = useTranslations("agent");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [form, setForm] = useState<FormState>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      kind: form.kind,
      config: {
        ...(form.system_prompt && { system_prompt: form.system_prompt }),
        ...(form.model && { model: form.model }),
        ...(form.temperature && {
          temperature: Number(form.temperature),
        }),
        ...(form.max_tokens && {
          max_tokens: Number(form.max_tokens),
        }),
      },
    };
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
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
          setError(data.message || "생성 실패");
        }
        setSubmitting(false);
        return;
      }
      router.push(`/agents/${data.id}`);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/agents">← {tCommon("back")}</Link>
        </Button>
        <h2 className="text-xl font-semibold">{t("newAgent")}</h2>
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
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
            maxLength={128}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">{t("slug")}</Label>
          <Input
            id="slug"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            placeholder={t("slugPlaceholder")}
            maxLength={64}
          />
        </div>
        <div className="space-y-2">
          <Label>{t("kind")}</Label>
          <Select
            value={form.kind}
            onValueChange={(v) => setForm((f) => ({ ...f, kind: v as AgentKind }))}
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
            value={form.system_prompt}
            onChange={(e) =>
              setForm((f) => ({ ...f, system_prompt: e.target.value }))
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
              value={form.model}
              onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
              placeholder="gpt-4o"
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
              value={form.temperature}
              onChange={(e) =>
                setForm((f) => ({ ...f, temperature: e.target.value }))
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
            value={form.max_tokens}
            onChange={(e) =>
              setForm((f) => ({ ...f, max_tokens: e.target.value }))
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
    </div>
  );
}
