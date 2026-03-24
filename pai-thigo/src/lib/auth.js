import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

function normalizeRole(value) {
  const allowedRoles = new Set(["customer", "waiter", "manager", "owner"]);
  return allowedRoles.has(value) ? value : "customer";
}

function isKnownRole(value) {
  return ["customer", "waiter", "manager", "owner"].includes(String(value ?? ""));
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

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, full_name, email, phone, role, loyalty_points")
      .eq("user_id", user.id)
      .maybeSingle();

    let resolvedProfileSource = profile ?? null;

    if (!resolvedProfileSource || profileError || !isKnownRole(profile?.role)) {
      try {
        const admin = getSupabaseAdminClient();

        if (admin) {
          const { data: adminProfile } = await admin
            .from("profiles")
            .select("user_id, full_name, email, phone, role, loyalty_points")
            .eq("user_id", user.id)
            .maybeSingle();

          if (adminProfile) {
            resolvedProfileSource = adminProfile;
          } else if (user.email) {
            const { data: staffEntry } = await admin
              .from("staff_directory")
              .select("email, full_name, role, active")
              .eq("email", user.email.toLowerCase())
              .eq("active", true)
              .maybeSingle();

            if (staffEntry?.role) {
              resolvedProfileSource = {
                user_id: user.id,
                full_name: staffEntry.full_name,
                email: staffEntry.email,
                phone: "",
                role: staffEntry.role,
                loyalty_points: 0,
              };
            }
          }
        }
      } catch {}
    }

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
      user_id: resolvedProfileSource?.user_id ?? fallbackProfile.user_id,
      full_name:
        String(resolvedProfileSource?.full_name ?? "").trim() || fallbackProfile.full_name,
      email: String(resolvedProfileSource?.email ?? "").trim() || fallbackProfile.email,
      phone: String(resolvedProfileSource?.phone ?? "").trim() || fallbackProfile.phone,
      role: normalizeRole(resolvedProfileSource?.role),
      loyalty_points: Number.isFinite(Number(resolvedProfileSource?.loyalty_points))
        ? Number(resolvedProfileSource.loyalty_points)
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
