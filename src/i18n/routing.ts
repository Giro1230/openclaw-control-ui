import { defineRouting } from "next-intl/routing";

/** 지원 로케일: ko(기본), en, ja, zh (나라별 언어 팩) */
export const routing = defineRouting({
  locales: ["ko", "en", "ja", "zh"],
  defaultLocale: "ko",
  localePrefix: "as-needed",
});
