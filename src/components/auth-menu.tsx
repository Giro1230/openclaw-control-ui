"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createBrowserClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { Link } from "@/i18n/navigation";

/**
 * 네비바용 인증 메뉴.
 * 로그인 상태이면 이메일 + 로그아웃 버튼, 아니면 로그인 링크.
 * Supabase 미설정 환경에서는 렌더링하지 않음.
 */
export function AuthMenu() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      setReady(true);
      return;
    }

    const supabase = createBrowserClient(supabaseUrl, supabaseKey);

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (!ready) return null;

  if (!user) {
    return (
      <Link href="/login" className="btn btn-ghost btn-sm">
        {t("login")}
      </Link>
    );
  }

  async function handleSignOut() {
    await fetch("/api/auth/sign-out", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="dropdown dropdown-end">
      <button tabIndex={0} className="btn btn-ghost btn-sm gap-1 max-w-[180px]">
        <span className="truncate text-xs opacity-70">{user.email}</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      <ul tabIndex={0} className="dropdown-content menu bg-base-200 rounded-box z-50 w-40 p-2 shadow">
        <li>
          <button onClick={handleSignOut} className="text-error">
            {t("signOut")}
          </button>
        </li>
      </ul>
    </div>
  );
}
