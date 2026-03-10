import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";
import { AppNav } from "@/components/app-nav";

export const metadata: Metadata = {
  title: "OpenClaw Control",
  description: "OpenClaw 대시보드",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale} data-theme="corporate" suppressHydrationWarning>
      <body className="min-h-screen bg-base-100 font-sans antialiased text-base-content">
        <NextIntlClientProvider messages={messages}>
          <AppNav />
          <main className="container mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
