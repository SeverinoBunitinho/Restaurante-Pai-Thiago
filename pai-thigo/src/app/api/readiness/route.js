import { NextResponse } from "next/server";

import { getProductionReadinessReport } from "@/lib/production-readiness";

export const dynamic = "force-dynamic";

export async function GET() {
  const report = await getProductionReadinessReport();

  return NextResponse.json(report, {
    status: report.publishReady ? 200 : 503,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
