"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTransition } from "react";

const LOCALES = [
  { code: "ko", label: "한국어" },
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "zh", label: "中文" },
] as const;

/**
 * 나라별 언어 전환 드롭다운 (DaisyUI dropdown)
 */
export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function onSelect(next: string) {
    startTransition(() => {
      router.replace(pathname, { locale: next as "ko" | "en" | "ja" | "zh" });
    });
  }

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  return (
    <div className="dropdown dropdown-end">
      <label tabIndex={0} className="btn btn-ghost btn-sm gap-1">
        <span className="text-base-content/70">{current.label}</span>
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </label>
      <ul
        tabIndex={0}
        className="dropdown-content menu z-50 mt-2 w-40 rounded-box bg-base-100 p-2 shadow-lg"
      >
        {LOCALES.map(({ code, label }) => (
          <li key={code}>
            <button
              type="button"
              onClick={() => onSelect(code)}
              className={locale === code ? "active" : ""}
              disabled={isPending}
            >
              {label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
