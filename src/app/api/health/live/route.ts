import { NextResponse } from "next/server";

const START_TIME = Date.now();

/**
 * GET /api/health/live
 * Liveness probe: confirms the process is alive.
 * No authentication required (used by load balancers and orchestrators).
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      uptime: Math.floor((Date.now() - START_TIME) / 1000),
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    }
  );
}
