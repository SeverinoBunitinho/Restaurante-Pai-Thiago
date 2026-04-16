import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export function getRouteForRole(role) {
  return role === "customer" ? "/area-cliente" : "/area-funcionario";
}

export function getStaffRoleLabel(role) {
  if (role === "waiter") {
    return "Garcom";
  }

  if (role === "manager") {
    return "Gerente";
  }

  if (role === "owner") {
    return "Dono";
  }

  return "Equipe";
}

export function isStaffRole(role) {
  return ["waiter", "manager", "owner"].includes(role);
}

async function ensureStaffProfileConsistency(user, profile) {
  const role = profile?.role ?? "customer";
  const userEmail = user.email?.toLowerCase() ?? "";

  if (isStaffRole(role) || !userEmail || !userEmail.endsWith("@paithiago.com.br")) {
    return profile;
  }

  const admin = getSupabaseAdminClient();

  if (!admin) {
    return profile;
  }

  const { data: staffRecord } = await admin
    .from("staff_directory")
    .select("role, full_name, phone, active")
    .eq("email", userEmail)
    .maybeSingle();

  if (!staffRecord || !staffRecord.active || !isStaffRole(staffRecord.role)) {
    return profile;
  }

  const syncedProfile = {
    user_id: user.id,
    email: userEmail,
    full_name:
      staffRecord.full_name ||
      profile?.full_name ||
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "Equipe",
    phone: staffRecord.phone ?? profile?.phone ?? "",
    role: staffRecord.role,
    loyalty_points: profile?.loyalty_points ?? 0,
    updated_at: new Date().toISOString(),
  };

  await admin.from("profiles").upsert(syncedProfile, { onConflict: "user_id" });

  return syncedProfile;
}

export const getCurrentSession = cache(async function getCurrentSession() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, full_name, email, phone, role, loyalty_points")
    .eq("user_id", user.id)
    .maybeSingle();

  const profileWithStaffSync = await ensureStaffProfileConsistency(user, profile);

  const resolvedProfile =
    profileWithStaffSync ??
    {
      user_id: user.id,
      full_name:
        user.user_metadata?.full_name ??
        user.email?.split("@")[0] ??
        "Usuario",
      email: user.email ?? "",
      phone: user.user_metadata?.phone ?? "",
      role: "customer",
      loyalty_points: 0,
    };

  return {
    user,
    profile: resolvedProfile,
    role: resolvedProfile.role,
  };
});

export async function redirectIfAuthenticated() {
  const session = await getCurrentSession();

  if (session) {
    redirect(getRouteForRole(session.role));
  }
}

export async function requireAuth() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function requireRole(allowedRoles) {
  const session = await requireAuth();
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!roles.includes(session.role)) {
    redirect(getRouteForRole(session.role));
  }

  return session;
}
