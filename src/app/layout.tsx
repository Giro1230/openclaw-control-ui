import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenClaw Control",
  description: "OpenClaw 대시보드",
};

/**
 * 루트 레이아웃: html/body 설정.
 * 로케일별 UI(AppNav, 번역)는 app/[locale]/layout.tsx에서 처리.
 */
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  return (
    <html lang={locale} data-theme="corporate" suppressHydrationWarning>
      <body className="min-h-screen bg-base-100 font-sans antialiased text-base-content">
        {children}
      </body>
    </html>
  );
}
