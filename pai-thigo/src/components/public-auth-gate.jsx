"use client";

import { useEffect, startTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

function getRouteForRole(role) {
  return role === "customer" ? "/area-cliente" : "/area-funcionario";
}

export function PublicAuthGate() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return undefined;
    }

    const checkPublicAccess = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!isMounted || !user) {
        return;
      }

      let resolvedRole = "customer";

      try {
        const response = await fetch("/api/auth/role", { cache: "no-store" });

        if (response.ok) {
          const payload = await response.json();
          resolvedRole = String(payload?.role ?? "customer");
        } else if (String(user.email ?? "").toLowerCase().endsWith("@paithiago.com.br")) {
          resolvedRole = "waiter";
        }
      } catch {
        if (String(user.email ?? "").toLowerCase().endsWith("@paithiago.com.br")) {
          resolvedRole = "waiter";
        }
      }

      const targetRoute = getRouteForRole(resolvedRole);

      if (pathname !== targetRoute) {
        startTransition(() => {
          router.replace(targetRoute);
        });
      }
    };

    void checkPublicAccess();

    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  return null;
}
