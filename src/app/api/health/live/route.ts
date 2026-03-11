import { NextResponse } from "next/server";

const START_TIME = Date.now();

/**
 * GET /api/health/live
 * Liveness probe: 프로세스가 살아있는지 확인
 * 쿠버네티스/Docker 헬스체크용, 인증 불필요
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
