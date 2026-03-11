"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeSwitcher } from "./theme-switcher";
import { AuthMenu } from "./auth-menu";

/**
 * 상단 앱 네비게이션 (DaisyUI navbar + shadcn 스타일, 세션/에이전트/설정 + 나라별 언어 전환)
 */
export function AppNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Dashboard" },
    { href: "/sessions", label: t("sessions") },
    { href: "/settings", label: t("settings") },
  ];

  return (
    <header className="navbar sticky top-0 z-50 w-full border-b border-base-300 bg-base-100/95 backdrop-blur">
      <div className="container mx-auto flex max-w-6xl flex-1 items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="btn btn-ghost text-xl font-semibold">
          OpenClaw
        </Link>
        <nav className="flex flex-1 gap-2">
          {links.map(({ href, label }) => {
            const isActive =
              (href === "/" && pathname === "/") ||
              (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "btn btn-ghost btn-sm",
                  isActive ? "btn-active" : ""
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <ThemeSwitcher />
        <LocaleSwitcher />
        <AuthMenu />
      </div>
    </header>
  );
}
