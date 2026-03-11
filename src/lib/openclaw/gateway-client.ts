/**
 * Server-only OpenClaw Gateway client (WebSocket).
 * Must not be called from the browser. Use only in API Routes or Server Actions.
 */

import WebSocket from "ws";

const DEFAULT_TIMEOUT_MS = 10_000;

function getGatewayUrl(): string {
  const url = process.env.OPENCLAW_GATEWAY_URL;
  if (!url || !url.startsWith("ws")) {
    throw new Error("OPENCLAW_GATEWAY_URL must be set to a ws:// or wss:// address");
  }
  const token = process.env.OPENCLAW_GATEWAY_TOKEN;
  if (token) {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}token=${encodeURIComponent(token)}`;
  }
  return url;
}

/**
 * Sends a single request to the Gateway and returns the response payload.
 */
export function requestGateway<T = unknown>(
  method: string,
  payload: Record<string, unknown> = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const url = getGatewayUrl();
  const id = `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      try {
        ws.removeAllListeners();
        ws.close();
      } catch {
        /* ignore */
      }
      reject(new Error("OPENCLAW_GATEWAY_TIMEOUT"));
    }, timeoutMs);

    const ws = new WebSocket(url);

    ws.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });

    ws.on("open", () => {
      ws.send(
        JSON.stringify({
          type: method,
          id,
          payload,
        })
      );
    });

    ws.on("message", (data: Buffer | string) => {
      try {
        const msg = JSON.parse(data.toString()) as {
          type: string;
          id?: string;
          payload?: T;
          error?: string;
        };
        if (msg.id !== id) return;
        clearTimeout(timer);
        ws.removeAllListeners();
        ws.close();
        if (msg.type === "error" || msg.error) {
          reject(new Error(msg.error ?? "Gateway error"));
        } else {
          resolve((msg.payload ?? {}) as T);
        }
      } catch (e) {
        clearTimeout(timer);
        ws.close();
        reject(e);
      }
    });
  });
}

/** Fetches the Gateway status (used for health checks and connectivity verification) */
export function fetchGatewayStatus(): Promise<Record<string, unknown>> {
  return requestGateway<Record<string, unknown>>("status", {});
}

export interface GatewaySession {
  id: string;
  agent_id?: string;
  status: "active" | "closed" | string;
  created_at?: string;
  [key: string]: unknown;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  session_id: string;
  message: ChatMessage;
  [key: string]: unknown;
}

/**
 * Sends a chat message to the Gateway.
 * @param message - User message text
 * @param agentId - Target agent ID
 * @param sessionId - Optional session ID to continue an existing session
 */
export function sendChat(
  message: string,
  agentId: string,
  sessionId?: string
): Promise<ChatResponse> {
  return requestGateway<ChatResponse>("chat", {
    message,
    agent_id: agentId,
    ...(sessionId ? { session_id: sessionId } : {}),
  });
}

/** Retrieves the list of active sessions from the Gateway */
export function listGatewaySessions(): Promise<GatewaySession[]> {
  return requestGateway<GatewaySession[]>("list_sessions", {});
}
