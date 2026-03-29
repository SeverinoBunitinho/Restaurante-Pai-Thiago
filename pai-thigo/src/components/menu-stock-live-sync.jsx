"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function MenuStockLiveSync() {
  const router = useRouter();
  const channelName = "menu-stock-live-sync";

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return undefined;
    }

    let refreshTimeoutId = null;
    const refreshMenuBoard = () => {
      if (refreshTimeoutId) {
        clearTimeout(refreshTimeoutId);
      }

      refreshTimeoutId = setTimeout(() => {
        router.refresh();
      }, 280);
    };

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "menu_items",
        },
        refreshMenuBoard,
      )
      .subscribe();

    return () => {
      if (refreshTimeoutId) {
        clearTimeout(refreshTimeoutId);
      }

      supabase.removeChannel(channel);
    };
  }, [channelName, router]);

  return null;
}
