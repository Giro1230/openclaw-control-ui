"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * 이메일/비밀번호 로그인 페이지.
 * Supabase 미설정 환경에서는 에러 메시지 표시.
 */
export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? t("loginError"));
        return;
      }
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError(t("loginError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <div className="card w-full max-w-sm bg-base-200 shadow-lg">
        <div className="card-body gap-4">
          <h1 className="card-title text-2xl justify-center">{t("loginTitle")}</h1>

          {searchParams.get("error") === "callback" && (
            <div className="alert alert-error text-sm">
              <span>{t("loginError")}</span>
            </div>
          )}

          {error && (
            <div className="alert alert-error text-sm">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control gap-1">
              <label className="label label-text text-sm font-medium">
                {t("email")}
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-control gap-1">
              <label className="label label-text text-sm font-medium">
                {t("password")}
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? t("loggingIn") : t("login")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
