import { getTranslations } from "next-intl/server";
import type { GatewaySession } from "@/lib/openclaw/gateway-client";

/**
 * Gateway에서 세션 목록을 가져와 표시.
 * Gateway 미설정 시 안내 메시지 표시.
 */
async function fetchSessions(): Promise<{
  sessions: GatewaySession[];
  error?: string;
}> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/openclaw/sessions`, {
      cache: "no-store",
    });
    const data = (await res.json()) as {
      sessions?: GatewaySession[];
      error?: string;
    };
    return { sessions: data.sessions ?? [], error: data.error };
  } catch {
    return { sessions: [], error: "fetch_failed" };
  }
}

export default async function SessionsPage() {
  const t = await getTranslations("session");
  const { sessions, error } = await fetchSessions();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <span className="badge badge-outline text-xs">
          {t("count", { count: sessions.length })}
        </span>
      </div>

      {error === "gateway_not_configured" && (
        <div className="alert alert-warning">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm">{t("gatewayNotConfigured")}</span>
        </div>
      )}

      {error === "unauthenticated" && (
        <div className="alert alert-error">
          <span className="text-sm">{t("unauthenticated")}</span>
        </div>
      )}

      {sessions.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-2 opacity-60">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-sm">{t("empty")}</p>
        </div>
      )}

      {sessions.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-base-300">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>{t("id")}</th>
                <th>{t("agent")}</th>
                <th>{t("status")}</th>
                <th>{t("createdAt")}</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id}>
                  <td className="font-mono text-xs">{session.id}</td>
                  <td className="text-sm">{session.agent_id ?? "—"}</td>
                  <td>
                    <span
                      className={`badge badge-sm ${
                        session.status === "active"
                          ? "badge-success"
                          : "badge-ghost"
                      }`}
                    >
                      {session.status}
                    </span>
                  </td>
                  <td className="text-xs opacity-70">
                    {session.created_at
                      ? new Date(session.created_at).toLocaleString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
