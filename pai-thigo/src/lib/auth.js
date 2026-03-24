import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

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

  const resolvedProfile =
    profile ??
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
