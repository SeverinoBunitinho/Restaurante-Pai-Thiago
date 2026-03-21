import { NextResponse } from "next/server";

import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      app: "Pai Thiago",
      timestamp: new Date().toISOString(),
      checks: {
        supabaseConfigured: isSupabaseConfigured(),
        siteUrlConfigured: Boolean(
          process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.SITE_URL?.trim(),
        ),
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
