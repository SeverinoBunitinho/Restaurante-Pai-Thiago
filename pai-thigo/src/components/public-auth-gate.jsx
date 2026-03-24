"use client";

import { useEffect, startTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

function getRouteForRole(role) {
  return role === "customer" ? "/area-cliente" : "/area-funcionario";
}

export function PublicAuthGate() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const forcePublicAccess = searchParams?.get("forcePublic") === "1";

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

      if (!isMounted) {
        return;
      }

      if (forcePublicAccess) {
        if (user) {
          await supabase.auth.signOut();
        }

        if (pathname !== "/login") {
          startTransition(() => {
            router.replace("/login?forcePublic=1");
          });
        }

        return;
      }

      if (!user) {
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      const targetRoute = getRouteForRole(profile?.role ?? "customer");

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
  }, [forcePublicAccess, pathname, router]);

  return null;
}
