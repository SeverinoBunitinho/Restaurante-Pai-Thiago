"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

function getRealtimeTables(pathname) {
  const tables = new Set();

  if (!pathname || pathname === "/login" || pathname === "/cadastro") {
    return [];
  }

  if (
    pathname === "/" ||
    pathname === "/area-cliente" ||
    pathname === "/eventos" ||
    pathname === "/reservas" ||
    pathname === "/contato" ||
    pathname === "/carrinho"
  ) {
    tables.add("profiles");
    tables.add("reservations");
    tables.add("orders");
    tables.add("restaurant_tables");
    tables.add("menu_items");
    tables.add("menu_categories");
    tables.add("restaurant_settings");
    tables.add("delivery_zones");
  }

  if (
    pathname === "/area-funcionario" ||
    pathname === "/painel" ||
    pathname.startsWith("/operacao")
  ) {
    tables.add("profiles");
    tables.add("staff_directory");
    tables.add("reservations");
    tables.add("orders");
    tables.add("restaurant_tables");
    tables.add("menu_items");
    tables.add("menu_categories");
    tables.add("restaurant_settings");
    tables.add("delivery_zones");
  }

  if (pathname === "/cardapio") {
    tables.add("orders");
    tables.add("menu_items");
    tables.add("menu_categories");
    tables.add("restaurant_settings");
    tables.add("delivery_zones");
  }

  return Array.from(tables);
}

function getPrefetchRoutes(pathname) {
  if (!pathname) {
    return [];
  }

  if (
    pathname === "/" ||
    pathname === "/area-cliente" ||
    pathname === "/cardapio" ||
    pathname === "/carrinho" ||
    pathname === "/reservas" ||
    pathname === "/eventos" ||
    pathname === "/contato"
  ) {
    return ["/", "/area-cliente", "/cardapio", "/carrinho", "/reservas", "/eventos", "/contato"];
  }

  if (
    pathname === "/area-funcionario" ||
    pathname === "/painel" ||
    pathname.startsWith("/operacao")
  ) {
    return [
      "/",
      "/area-funcionario",
      "/operacao",
      "/painel",
      "/reservas",
      "/operacao/reservas",
      "/operacao/mesas",
      "/operacao/comandas",
      "/operacao/menu",
      "/operacao/equipe",
      "/operacao/configuracoes",
      "/operacao/executivo",
    ];
  }

  return [];
}

export function AppLiveSync() {
  const pathname = usePathname();
  const router = useRouter();
  const timeoutRef = useRef(null);
  const prefetchedRef = useRef(new Set());
  const [supabase] = useState(() => getSupabaseBrowserClient());

  useEffect(() => {
    const routes = getPrefetchRoutes(pathname);

    routes.forEach((route) => {
      if (!prefetchedRef.current.has(route)) {
        router.prefetch(route);
        prefetchedRef.current.add(route);
      }
    });
  }, [pathname, router]);

  useEffect(() => {
    const tables = getRealtimeTables(pathname);

    if (!supabase || !tables.length) {
      return undefined;
    }

    const scheduleRefresh = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        router.refresh();
      }, 180);
    };

    const channel = supabase.channel(`live-sync:${pathname}:${tables.join(",")}`);

    tables.forEach((table) => {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
        },
        scheduleRefresh,
      );
    });

    channel.subscribe();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      supabase.removeChannel(channel);
    };
  }, [pathname, router, supabase]);

  return null;
}
