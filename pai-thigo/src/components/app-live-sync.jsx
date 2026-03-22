"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { BellRing, Volume2, VolumeX } from "lucide-react";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

function getRealtimeTables(pathname) {
  const tables = new Set();

  if (!pathname || pathname === "/login" || pathname === "/cadastro") {
    return [];
  }

  if (
    pathname === "/" ||
    pathname === "/area-cliente" ||
    pathname === "/pedidos" ||
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
    tables.add("service_checks");
    tables.add("service_check_items");
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
    pathname === "/pedidos" ||
    pathname === "/cardapio" ||
    pathname === "/carrinho" ||
    pathname === "/reservas" ||
    pathname === "/eventos" ||
    pathname === "/contato"
  ) {
    return [
      "/",
      "/area-cliente",
      "/pedidos",
      "/cardapio",
      "/carrinho",
      "/reservas",
      "/eventos",
      "/contato",
    ];
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
      "/operacao/relatorios",
      "/operacao/configuracoes",
      "/operacao/executivo",
    ];
  }

  return [];
}

function isStaffWorkspace(pathname) {
  return (
    pathname === "/area-funcionario" ||
    pathname === "/painel" ||
    pathname?.startsWith("/operacao")
  );
}

function getFulfillmentLabel(value) {
  return value === "delivery" ? "Delivery" : "Retirada";
}

function hasRecentOrderAlert(orderKey) {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const storageKey = `staff-order-alert:${orderKey}`;
    const lastValue = window.sessionStorage.getItem(storageKey);

    if (!lastValue) {
      return false;
    }

    return Date.now() - Number(lastValue) < 20000;
  } catch {
    return false;
  }
}

function rememberOrderAlert(orderKey) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(`staff-order-alert:${orderKey}`, String(Date.now()));
  } catch {}
}

const STAFF_SOUND_STORAGE_KEY = "staff-order-sound-enabled";

function readSoundPreference() {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    const storedValue = window.localStorage.getItem(STAFF_SOUND_STORAGE_KEY);

    if (storedValue === "0") {
      return false;
    }

    if (storedValue === "1") {
      return true;
    }
  } catch {}

  return true;
}

function persistSoundPreference(enabled) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STAFF_SOUND_STORAGE_KEY, enabled ? "1" : "0");
  } catch {}
}

function playOrderAlertSound(audioContextRef) {
  if (typeof window === "undefined") {
    return;
  }

  const ContextConstructor = window.AudioContext || window.webkitAudioContext;

  if (!ContextConstructor) {
    return;
  }

  let context = audioContextRef.current;

  if (!context) {
    context = new ContextConstructor();
    audioContextRef.current = context;
  }

  if (context.state === "suspended") {
    context.resume().catch(() => {});
  }

  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(900, now);
  oscillator.frequency.exponentialRampToValueAtTime(620, now + 0.26);

  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.exponentialRampToValueAtTime(0.08, now + 0.03);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.31);
}

export function AppLiveSync() {
  const pathname = usePathname();
  const router = useRouter();
  const timeoutRef = useRef(null);
  const alertTimeoutRef = useRef(null);
  const audioContextRef = useRef(null);
  const prefetchedRef = useRef(new Set());
  const [orderAlert, setOrderAlert] = useState(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => readSoundPreference());
  const soundEnabledRef = useRef(isSoundEnabled);
  const [supabase] = useState(() => getSupabaseBrowserClient());

  useEffect(() => {
    soundEnabledRef.current = isSoundEnabled;
    persistSoundPreference(isSoundEnabled);
  }, [isSoundEnabled]);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, []);

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

  useEffect(() => {
    if (!supabase || !isStaffWorkspace(pathname)) {
      return undefined;
    }

    const channel = supabase.channel(`staff-order-alerts:${pathname}`);

    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "orders",
      },
      (payload) => {
        const order = payload.new ?? {};
        const orderKey = order.checkout_reference || order.id;

        if (!orderKey || hasRecentOrderAlert(orderKey)) {
          return;
        }

        rememberOrderAlert(orderKey);

        const nextAlert = {
          id: orderKey,
          title: "Novo pedido recebido",
          message: `${getFulfillmentLabel(order.fulfillment_type)} | ${order.checkout_reference || "pedido sem referencia"}`,
          detail: order.guest_name
            ? `Cliente: ${order.guest_name}`
            : "A equipe ja pode abrir a fila de pedidos.",
        };

        setOrderAlert(nextAlert);

        if (soundEnabledRef.current) {
          playOrderAlertSound(audioContextRef);
        }

        if (alertTimeoutRef.current) {
          clearTimeout(alertTimeoutRef.current);
        }

        alertTimeoutRef.current = setTimeout(() => {
          setOrderAlert(null);
        }, 6500);

        if (
          typeof window !== "undefined" &&
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          try {
            const notification = new Notification(nextAlert.title, {
              body: `${nextAlert.message}${nextAlert.detail ? `\n${nextAlert.detail}` : ""}`,
              tag: `order-${orderKey}`,
            });

            notification.onclick = () => {
              window.focus();
              window.location.href = "/operacao/comandas";
            };
          } catch {}
        }
      },
    );

    channel.subscribe();

    return () => {
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }

      supabase.removeChannel(channel);
    };
  }, [pathname, supabase]);

  const toggleSound = () => {
    setIsSoundEnabled((currentValue) => !currentValue);
  };

  return orderAlert ? (
    <div className="staff-order-toast" role="status" aria-live="polite">
      <div className="staff-order-toast-icon">
        <BellRing size={18} />
      </div>
      <div className="staff-order-toast-copy">
        <p className="staff-order-toast-title">{orderAlert.title}</p>
        <p className="staff-order-toast-message">{orderAlert.message}</p>
        <p className="staff-order-toast-detail">{orderAlert.detail}</p>
      </div>
      <div className="staff-order-toast-actions">
        <Link href="/operacao/comandas" className="staff-order-toast-link">
          Abrir pedidos
        </Link>
        <button
          type="button"
          className={`staff-order-sound-toggle ${isSoundEnabled ? "staff-order-sound-toggle-active" : ""}`}
          onClick={toggleSound}
        >
          {isSoundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          {isSoundEnabled ? "Som ligado" : "Som desligado"}
        </button>
      </div>
    </div>
  ) : null;
}
