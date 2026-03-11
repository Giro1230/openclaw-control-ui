import pino from "pino";
import { randomUUID } from "crypto";

const isDev = process.env.NODE_ENV === "development";

/**
 * Structured JSON logger (pino).
 * Development: pretty-print with colors.
 * Production: JSON stream for log aggregators.
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

/** Creates a child logger bound to a specific request context */
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
 * Wraps an API handler with request-level logging (start, latency, errors).
 */
export function withRequestLogging<T>(
  handler: (log: Logger) => Promise<T>,
  context: { route: string; method: string; userId?: string }
): Promise<T> {
  const start = Date.now();
  const log = createRequestLogger(context);

  log.debug({ msg: "request started" });

  return handler(log)
    .then((result) => {
      log.info({ latencyMs: Date.now() - start, msg: "request completed" });
      return result;
    })
    .catch((err: Error) => {
      log.error({
        latencyMs: Date.now() - start,
        err: { message: err.message, name: err.name },
        msg: "request error",
      });
      throw err;
    });
}
