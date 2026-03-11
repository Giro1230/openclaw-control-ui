import pino from "pino";
import { randomUUID } from "crypto";

const isDev = process.env.NODE_ENV === "development";

/**
 * 구조화 JSON 로거 (pino).
 * 개발환경: pretty-print, 프로덕션: JSON 스트림
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? "debug" : "info"),
  ...(isDev && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss",
        ignore: "pid,hostname",
      },
    },
  }),
  base: {
    service: "openclaw-dashboard",
    env: process.env.NODE_ENV,
  },
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie", "password", "token"],
    censor: "[REDACTED]",
  },
});

export type Logger = typeof logger;

/**
 * 요청 컨텍스트 로거 생성
 */
export function createRequestLogger(options: {
  requestId?: string;
  userId?: string;
  route: string;
  method: string;
}) {
  const requestId = options.requestId ?? randomUUID();
  return logger.child({
    requestId,
    userId: options.userId ?? "anonymous",
    route: options.route,
    method: options.method,
  });
}

/**
 * API Route용 요청 로거 미들웨어 래퍼
 */
export function withRequestLogging<T>(
  handler: (log: Logger) => Promise<T>,
  context: { route: string; method: string; userId?: string }
): Promise<T> {
  const start = Date.now();
  const log = createRequestLogger(context);

  log.debug({ msg: "요청 시작" });

  return handler(log)
    .then((result) => {
      log.info({ latencyMs: Date.now() - start, msg: "요청 완료" });
      return result;
    })
    .catch((err: Error) => {
      log.error({
        latencyMs: Date.now() - start,
        err: { message: err.message, name: err.name },
        msg: "요청 오류",
      });
      throw err;
    });
}
