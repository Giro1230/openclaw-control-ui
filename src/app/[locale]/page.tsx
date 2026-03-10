import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/**
 * 대시보드 루트 페이지 (간단 안내 + 세션/에이전트 링크)
 */
export default async function HomePage() {
  const t = await getTranslations("nav");
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">OpenClaw Control</h1>
      <p className="max-w-xl text-base-content/70">
        세션, 에이전트, 설정을 관리합니다.
      </p>
      <div className="flex flex-wrap gap-4">
        <Link href="/sessions" className="btn btn-primary">
          {t("sessions")}
        </Link>
        <Link href="/agents" className="btn btn-outline">
          {t("agents")}
        </Link>
      </div>
    </div>
  );
}
