import * as Sentry from "@sentry/nextjs";

/**
 * Sentry 서버 초기화
 */
Sentry.init({
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!(process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN),
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  sendDefaultPii: false,
  beforeSend(event, hint) {
    const err = hint.originalException;
    // 예상된 오류(인증 실패 등)는 Sentry로 보내지 않음
    if (err instanceof Error) {
      if (
        err.message === "UNAUTHENTICATED" ||
        err.message === "SLUG_EXISTS"
      ) {
        return null;
      }
    }
    return event;
  },
});
