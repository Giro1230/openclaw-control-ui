import * as Sentry from "@sentry/nextjs";

/**
 * Sentry 클라이언트 초기화
 * NEXT_PUBLIC_SENTRY_DSN 설정 시에만 활성화
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0,
  integrations: [Sentry.replayIntegration()],
  // 개인정보 보호: 사용자 IP 수집 안 함
  sendDefaultPii: false,
  beforeSend(event) {
    // 개발환경에서는 콘솔에만 출력
    if (process.env.NODE_ENV === "development") {
      console.error("[Sentry Dev]", event);
      return null;
    }
    return event;
  },
});
