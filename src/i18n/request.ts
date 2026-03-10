import { getRequestConfig } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { resolveTimezone } from "@/i18n/timezone";

/**
 * next-intl 요청별 설정 (locale·timeZone env 반영)
 */
export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  const validLocales = ["ko", "en", "ja", "zh"] as const;
  if (!locale || !validLocales.includes(locale as (typeof validLocales)[number])) {
    locale = routing.defaultLocale;
  }
  const messages = (await import(`../messages/${locale}.json`)).default;
  const timeZone = resolveTimezone(process.env.I18N_TIMEZONE);
  return {
    locale,
    messages,
    timeZone,
  };
});
