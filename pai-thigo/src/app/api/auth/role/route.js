import { NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function isStaffRole(role) {
  return ["waiter", "manager", "owner"].includes(String(role ?? ""));
}

export async function GET() {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, message: "supabase_unavailable" },
      { status: 503 },
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { ok: false, message: "unauthorized" },
      { status: 401 },
    );
  }

  const admin = getSupabaseAdminClient();

  if (!admin) {
    return NextResponse.json({ ok: true, role: "customer" });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.role) {
    return NextResponse.json({ ok: true, role: profile.role });
  }

  const email = String(user.email ?? "").trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ ok: true, role: "customer" });
  }

  const { data: staffRecord } = await admin
    .from("staff_directory")
    .select("role, full_name, phone, active")
    .eq("email", email)
    .maybeSingle();

  if (!staffRecord || !staffRecord.active || !isStaffRole(staffRecord.role)) {
    return NextResponse.json({ ok: true, role: "customer" });
  }

  await admin.from("profiles").upsert(
    {
      user_id: user.id,
      email,
      full_name:
        staffRecord.full_name ||
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "Equipe",
      phone: staffRecord.phone ?? "",
      role: staffRecord.role,
      loyalty_points: 0,
      preferred_room: "Salao principal",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  return NextResponse.json({ ok: true, role: staffRecord.role });
}
