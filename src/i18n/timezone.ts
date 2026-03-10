/**
 * 앱에서 허용하는 IANA 타임존 목록 (env 검증용)
 * Intl.DateTimeFormat 등에서 사용하는 값과 동일.
 */
export const SUPPORTED_TIMEZONES = [
  "Asia/Seoul",
  "Asia/Tokyo",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "UTC",
] as const;

export type SupportedTimezone = (typeof SUPPORTED_TIMEZONES)[number];

const SET = new Set<string>(SUPPORTED_TIMEZONES);

/**
 * env에서 읽은 문자열이 허용된 타임존인지 검사 후 반환, 아니면 기본값
 */
export function resolveTimezone(envValue: string | undefined): SupportedTimezone {
  if (envValue && SET.has(envValue)) {
    return envValue as SupportedTimezone;
  }
  return "Asia/Seoul";
}
