"use client";

import { useCallback, useEffect, useState } from "react";

const THEMES = [
  { id: "light", label: "라이트" },
  { id: "dark", label: "다크" },
  { id: "corporate", label: "Corporate" },
  { id: "business", label: "Business" },
] as const;

const STORAGE_KEY = "openclaw-theme";

/**
 * DaisyUI 테마 전환 드롭다운 (data-theme + localStorage)
 */
export function ThemeSwitcher() {
  const [theme, setThemeState] = useState<string>("corporate");

  const setTheme = useCallback((id: string) => {
    document.documentElement.setAttribute("data-theme", id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
    setThemeState(id);
  }, []);

  useEffect(() => {
    const stored =
      typeof document !== "undefined"
        ? localStorage.getItem(STORAGE_KEY)
        : null;
    const initial = stored && THEMES.some((t) => t.id === stored) ? stored : "corporate";
    document.documentElement.setAttribute("data-theme", initial);
    setThemeState(initial);
  }, []);

  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <div className="dropdown dropdown-end">
      <label tabIndex={0} className="btn btn-ghost btn-sm gap-1">
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
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12"
          />
        </svg>
        <span className="hidden sm:inline">{current.label}</span>
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
        className="dropdown-content menu z-50 mt-2 w-36 rounded-box bg-base-100 p-2 shadow-lg"
      >
        {THEMES.map(({ id, label }) => (
          <li key={id}>
            <button
              type="button"
              onClick={() => setTheme(id)}
              className={theme === id ? "active" : ""}
            >
              {label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
