import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

function normalizeRole(value) {
  const allowedRoles = new Set(["customer", "waiter", "manager", "owner"]);
  return allowedRoles.has(value) ? value : "customer";
}

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
  try {
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

    const fallbackProfile = {
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

    const resolvedProfile = {
      user_id: profile?.user_id ?? fallbackProfile.user_id,
      full_name: String(profile?.full_name ?? "").trim() || fallbackProfile.full_name,
      email: String(profile?.email ?? "").trim() || fallbackProfile.email,
      phone: String(profile?.phone ?? "").trim() || fallbackProfile.phone,
      role: normalizeRole(profile?.role),
      loyalty_points: Number.isFinite(Number(profile?.loyalty_points))
        ? Number(profile.loyalty_points)
        : 0,
    };

    return {
      user,
      profile: resolvedProfile,
      role: resolvedProfile.role,
    };
  } catch {
    return null;
  }
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
