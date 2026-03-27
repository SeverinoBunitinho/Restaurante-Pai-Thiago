"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { BellRing, Volume2, VolumeX, X } from "lucide-react";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

const STATIC_NON_REALTIME_ROUTES = new Set([
  "/login",
  "/cadastro",
  "/recuperar-senha",
  "/redefinir-senha",
  "/privacidade",
  "/termos",
  "/cancelamentos",
]);

const CUSTOMER_BASE_TABLES = [
  "orders",
  "reservations",
  "restaurant_tables",
  "menu_items",
  "menu_categories",
  "restaurant_settings",
  "delivery_zones",
  "profiles",
  "customer_testimonials",
];

const STAFF_BASE_TABLES = [
  "orders",
  "reservations",
  "restaurant_tables",
  "service_checks",
  "service_check_items",
  "profiles",
  "operation_audit_logs",
];

function getRealtimeTables(pathname) {
  const tables = new Set();
  const addTables = (...tableNames) => {
    tableNames.forEach((tableName) => tables.add(tableName));
  };

  if (!pathname) {
    return [];
  }

  if (STATIC_NON_REALTIME_ROUTES.has(pathname)) {
    return [];
  }

  if (pathname === "/") {
    addTables(...CUSTOMER_BASE_TABLES);
    return Array.from(tables);
  }

  if (pathname === "/area-cliente") {
    addTables(...CUSTOMER_BASE_TABLES);
    return Array.from(tables);
  }

  if (pathname === "/pedidos") {
    addTables(...CUSTOMER_BASE_TABLES);
    return Array.from(tables);
  }

  if (pathname === "/reservas") {
    addTables(...CUSTOMER_BASE_TABLES);
    return Array.from(tables);
  }

  if (pathname === "/cardapio") {
    addTables(...CUSTOMER_BASE_TABLES);
    return Array.from(tables);
  }

  if (pathname === "/carrinho") {
    addTables(...CUSTOMER_BASE_TABLES);
    return Array.from(tables);
  }

  if (pathname === "/eventos" || pathname === "/contato") {
    addTables(...CUSTOMER_BASE_TABLES);
    return Array.from(tables);
  }

  if (pathname === "/area-funcionario") {
    addTables(
      ...STAFF_BASE_TABLES,
      "staff_directory",
      "staff_shifts",
      "menu_items",
      "menu_categories",
      "marketing_campaigns",
      "marketing_coupons",
      "restaurant_settings",
      "delivery_zones",
    );
    return Array.from(tables);
  }

  if (pathname === "/painel") {
    addTables(
      ...STAFF_BASE_TABLES,
      "staff_directory",
      "staff_shifts",
      "menu_items",
      "menu_categories",
      "marketing_campaigns",
      "marketing_coupons",
      "restaurant_settings",
      "delivery_zones",
    );
    return Array.from(tables);
  }

  if (pathname.startsWith("/operacao/comandas")) {
    addTables("orders", "service_checks", "service_check_items", "restaurant_tables", "profiles");
    return Array.from(tables);
  }

  if (pathname.startsWith("/operacao/cozinha")) {
    addTables("orders", "service_checks", "service_check_items");
    return Array.from(tables);
  }

  if (pathname.startsWith("/operacao/reservas")) {
    addTables("reservations", "orders", "restaurant_tables");
    return Array.from(tables);
  }

  if (pathname.startsWith("/operacao/mesas")) {
    addTables("restaurant_tables", "reservations", "orders", "service_checks");
    return Array.from(tables);
  }

  if (pathname.startsWith("/operacao/menu")) {
    addTables("menu_items", "menu_categories", "reservations", "orders");
    return Array.from(tables);
  }

  if (pathname.startsWith("/operacao/equipe")) {
    addTables(
      ...STAFF_BASE_TABLES,
      "staff_directory",
      "staff_shifts",
      "menu_items",
      "menu_categories",
    );
    return Array.from(tables);
  }

  if (pathname.startsWith("/operacao/escala")) {
    addTables(...STAFF_BASE_TABLES, "staff_shifts", "staff_directory");
    return Array.from(tables);
  }

  if (pathname.startsWith("/operacao/campanhas")) {
    addTables(...STAFF_BASE_TABLES, "marketing_campaigns", "marketing_coupons");
    return Array.from(tables);
  }

  if (pathname.startsWith("/operacao/auditoria")) {
    addTables("operation_audit_logs");
    return Array.from(tables);
  }

  if (pathname.startsWith("/operacao/checklists")) {
    addTables("operation_audit_logs");
    return Array.from(tables);
  }

  if (pathname.startsWith("/operacao/incidentes")) {
    addTables("operation_audit_logs");
    return Array.from(tables);
  }

  if (pathname.startsWith("/operacao/previsao")) {
    addTables(...STAFF_BASE_TABLES, "menu_items");
    return Array.from(tables);
  }

  if (pathname.startsWith("/operacao/relatorios")) {
    addTables(
      "service_checks",
      "service_check_items",
      "restaurant_tables",
      "profiles",
      "reservations",
      "orders",
      "staff_directory",
    );
    return Array.from(tables);
  }

  if (pathname.startsWith("/operacao/configuracoes")) {
    addTables(
      ...STAFF_BASE_TABLES,
      "restaurant_settings",
      "delivery_zones",
      "menu_categories",
      "menu_items",
      "staff_shifts",
      "marketing_campaigns",
      "marketing_coupons",
      "staff_directory",
    );
    return Array.from(tables);
  }

  if (pathname.startsWith("/operacao/executivo")) {
    addTables(
      ...STAFF_BASE_TABLES,
      "staff_directory",
      "staff_shifts",
      "menu_items",
      "menu_categories",
      "marketing_campaigns",
      "marketing_coupons",
    );
    return Array.from(tables);
  }

  if (pathname.startsWith("/operacao")) {
    addTables(
      ...STAFF_BASE_TABLES,
      "staff_directory",
      "staff_shifts",
      "menu_items",
      "menu_categories",
      "marketing_campaigns",
      "marketing_coupons",
      "restaurant_settings",
      "delivery_zones",
    );
    return Array.from(tables);
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
      "/operacao/cozinha",
      "/operacao/menu",
      "/operacao/equipe",
      "/operacao/escala",
      "/operacao/campanhas",
      "/operacao/relatorios",
      "/operacao/previsao",
      "/operacao/auditoria",
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

function isCustomerWorkspace(pathname) {
  return (
    pathname === "/" ||
    pathname === "/area-cliente" ||
    pathname === "/pedidos" ||
    pathname === "/cardapio" ||
    pathname === "/carrinho" ||
    pathname === "/reservas" ||
    pathname === "/eventos" ||
    pathname === "/contato"
  );
}

function getFulfillmentLabel(value) {
  return value === "delivery" ? "Delivery" : "Retirada";
}

function getOrderStatusLabel(value) {
  const labels = {
    received: "Pedido recebido",
    preparing: "Pedido em preparo",
    ready: "Pedido pronto",
    dispatching: "Pedido saiu para entrega",
    delivered: "Pedido entregue",
    cancelled: "Pedido cancelado",
  };

  return labels[value] ?? "Pedido atualizado";
}

function getReservationStatusLabel(value) {
  const labels = {
    pending: "Reserva pendente",
    confirmed: "Reserva confirmada",
    seated: "Reserva em atendimento",
    completed: "Reserva finalizada",
    cancelled: "Reserva cancelada",
  };

  return labels[value] ?? "Reserva atualizada";
}

const STAFF_ALERT_VISIBLE_MS = 6500;
const CUSTOMER_ALERT_VISIBLE_MS = 6200;

function getRefreshTiming(pathname) {
  if (pathname?.startsWith("/operacao/comandas")) {
    return {
      debounceMs: 120,
      minIntervalMs: 420,
    };
  }

  if (
    pathname?.startsWith("/operacao/reservas") ||
    pathname?.startsWith("/operacao/mesas") ||
    pathname?.startsWith("/operacao/cozinha")
  ) {
    return {
      debounceMs: 140,
      minIntervalMs: 540,
    };
  }

  if (pathname?.startsWith("/operacao") || pathname === "/painel") {
    return {
      debounceMs: 220,
      minIntervalMs: 760,
    };
  }

  if (
    pathname === "/area-cliente" ||
    pathname === "/pedidos" ||
    pathname === "/reservas"
  ) {
    return {
      debounceMs: 260,
      minIntervalMs: 980,
    };
  }

  return {
    debounceMs: 420,
    minIntervalMs: 1800,
  };
}

function getFallbackRefreshInterval(pathname) {
  if (!pathname) {
    return 18000;
  }

  if (
    pathname.startsWith("/operacao/comandas") ||
    pathname.startsWith("/operacao/reservas") ||
    pathname.startsWith("/operacao/mesas") ||
    pathname.startsWith("/operacao/cozinha")
  ) {
    return 6500;
  }

  if (pathname.startsWith("/operacao") || pathname === "/painel") {
    return 9000;
  }

  if (
    pathname === "/area-cliente" ||
    pathname === "/pedidos" ||
    pathname === "/reservas" ||
    pathname === "/cardapio" ||
    pathname === "/carrinho"
  ) {
    return 12000;
  }

  return 18000;
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

function hasRecentCustomerAlert(alertKey) {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const storageKey = `customer-live-alert:${alertKey}`;
    const lastValue = window.sessionStorage.getItem(storageKey);

    if (!lastValue) {
      return false;
    }

    return Date.now() - Number(lastValue) < 16000;
  } catch {
    return false;
  }
}

function rememberCustomerAlert(alertKey) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(`customer-live-alert:${alertKey}`, String(Date.now()));
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

function getOrCreateAudioContext(audioContextRef) {
  if (typeof window === "undefined") {
    return null;
  }

  const ContextConstructor = window.AudioContext || window.webkitAudioContext;

  if (!ContextConstructor) {
    return null;
  }

  let context = audioContextRef.current;

  if (!context) {
    context = new ContextConstructor();
    audioContextRef.current = context;
  }

  return context;
}

async function warmupAudioContext(audioContextRef) {
  const context = getOrCreateAudioContext(audioContextRef);

  if (!context) {
    return false;
  }

  if (context.state === "suspended") {
    try {
      await context.resume();
    } catch {
      return false;
    }
  }

  return context.state === "running";
}

async function playOrderAlertSound(audioContextRef) {
  const context = getOrCreateAudioContext(audioContextRef);

  if (!context) {
    return;
  }

  if (context.state === "suspended") {
    try {
      await context.resume();
    } catch {
      return;
    }
  }

  if (context.state !== "running") {
    return;
  }

  const now = context.currentTime + 0.015;

  const playBellStrike = (startAt, baseFrequency, intensity = 0.2) => {
    const partials = [
      { ratio: 1, gain: 1, decay: 1.05, type: "sine" },
      { ratio: 2.01, gain: 0.46, decay: 0.9, type: "triangle" },
      { ratio: 2.76, gain: 0.28, decay: 1.2, type: "sine" },
      { ratio: 4.09, gain: 0.16, decay: 1.45, type: "sine" },
    ];

    partials.forEach((partial) => {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      const frequency = baseFrequency * partial.ratio;
      const attackAt = startAt + 0.012;
      const releaseAt = startAt + partial.decay;

      oscillator.type = partial.type;
      oscillator.frequency.setValueAtTime(frequency, startAt);
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(180, frequency * 0.985),
        releaseAt,
      );

      gainNode.gain.setValueAtTime(0.0001, startAt);
      gainNode.gain.exponentialRampToValueAtTime(
        Math.max(0.0001, intensity * partial.gain),
        attackAt,
      );
      gainNode.gain.exponentialRampToValueAtTime(0.0001, releaseAt);

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      oscillator.start(startAt);
      oscillator.stop(releaseAt + 0.06);
    });
  };

  // Timbre de sininho em duas batidas curtas (ding-dong).
  playBellStrike(now, 1568, 0.19);
  playBellStrike(now + 0.23, 1318, 0.17);
}

function playOrderAlertPattern(audioContextRef) {
  void playOrderAlertSound(audioContextRef);
}

export function AppLiveSync() {
  const pathname = usePathname();
  const router = useRouter();
  const timeoutRef = useRef(null);
  const staffAlertTimeoutRef = useRef(null);
  const customerAlertTimeoutRef = useRef(null);
  const orderAlertExpiresAtRef = useRef(0);
  const customerAlertExpiresAtRef = useRef(0);
  const lastRefreshAtRef = useRef(0);
  const audioContextRef = useRef(null);
  const prefetchedRef = useRef(new Set());
  const [orderAlert, setOrderAlert] = useState(null);
  const [customerAlert, setCustomerAlert] = useState(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => readSoundPreference());
  const soundEnabledRef = useRef(isSoundEnabled);
  const [supabase] = useState(() => getSupabaseBrowserClient());

  useEffect(() => {
    lastRefreshAtRef.current = Date.now();
  }, [pathname]);

  const dismissStaffAlert = () => {
    if (staffAlertTimeoutRef.current) {
      clearTimeout(staffAlertTimeoutRef.current);
      staffAlertTimeoutRef.current = null;
    }

    orderAlertExpiresAtRef.current = 0;
    setOrderAlert(null);
  };

  const dismissCustomerAlert = () => {
    if (customerAlertTimeoutRef.current) {
      clearTimeout(customerAlertTimeoutRef.current);
      customerAlertTimeoutRef.current = null;
    }

    customerAlertExpiresAtRef.current = 0;
    setCustomerAlert(null);
  };

  useEffect(() => {
    soundEnabledRef.current = isSoundEnabled;
    persistSoundPreference(isSoundEnabled);

    if (isSoundEnabled) {
      void warmupAudioContext(audioContextRef);
    }
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
    const dropExpiredToasts = () => {
      const now = Date.now();

      if (orderAlertExpiresAtRef.current && now >= orderAlertExpiresAtRef.current) {
        dismissStaffAlert();
      }

      if (customerAlertExpiresAtRef.current && now >= customerAlertExpiresAtRef.current) {
        dismissCustomerAlert();
      }
    };

    const handleVisibilityChange = () => {
      if (typeof document === "undefined") {
        return;
      }

      if (document.visibilityState === "visible") {
        dropExpiredToasts();
      }
    };

    const interval = setInterval(dropExpiredToasts, 1000);
    window.addEventListener("focus", dropExpiredToasts);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", dropExpiredToasts);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!isStaffWorkspace(pathname) && !isCustomerWorkspace(pathname)) {
      return undefined;
    }

    const ensureNotificationPermission = () => {
      if (typeof window === "undefined" || !("Notification" in window)) {
        return;
      }

      if (Notification.permission !== "default") {
        return;
      }

      Notification.requestPermission().catch(() => {});
    };

    const unlockAudio = () => {
      void warmupAudioContext(audioContextRef);
      ensureNotificationPermission();
    };

    window.addEventListener("pointerdown", unlockAudio);
    window.addEventListener("keydown", unlockAudio);
    window.addEventListener("touchstart", unlockAudio);

    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };
  }, [pathname]);

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

    const { debounceMs, minIntervalMs } = getRefreshTiming(pathname);

    const scheduleRefresh = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      const elapsed = Date.now() - lastRefreshAtRef.current;
      const waitMs =
        elapsed >= minIntervalMs
          ? debounceMs
          : Math.max(debounceMs, minIntervalMs - elapsed);

      timeoutRef.current = setTimeout(() => {
        lastRefreshAtRef.current = Date.now();
        router.refresh();
      }, waitMs);
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

    channel.subscribe((status) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        scheduleRefresh();
      }
    });

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      supabase.removeChannel(channel);
    };
  }, [pathname, router, supabase]);

  useEffect(() => {
    const tables = getRealtimeTables(pathname);

    if (!tables.length || (!isStaffWorkspace(pathname) && !isCustomerWorkspace(pathname))) {
      return undefined;
    }

    const heartbeatMs = getFallbackRefreshInterval(pathname);
    const minGapMs = Math.max(1800, Math.floor(heartbeatMs * 0.7));

    const refreshIfStale = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }

      const now = Date.now();
      if (now - lastRefreshAtRef.current < minGapMs) {
        return;
      }

      lastRefreshAtRef.current = now;
      router.refresh();
    };

    const onVisibilityChange = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        refreshIfStale();
      }
    };

    const intervalId = setInterval(refreshIfStale, heartbeatMs);

    window.addEventListener("online", refreshIfStale);
    window.addEventListener("focus", refreshIfStale);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("online", refreshIfStale);
      window.removeEventListener("focus", refreshIfStale);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [pathname, router]);

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
          playOrderAlertPattern(audioContextRef);

          if ("vibrate" in navigator) {
            navigator.vibrate([160, 80, 160]);
          }
        }

        if (staffAlertTimeoutRef.current) {
          clearTimeout(staffAlertTimeoutRef.current);
          staffAlertTimeoutRef.current = null;
        }

        orderAlertExpiresAtRef.current = Date.now() + STAFF_ALERT_VISIBLE_MS;
        staffAlertTimeoutRef.current = setTimeout(() => {
          setOrderAlert(null);
          orderAlertExpiresAtRef.current = 0;
          staffAlertTimeoutRef.current = null;
        }, STAFF_ALERT_VISIBLE_MS);

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
      if (staffAlertTimeoutRef.current) {
        clearTimeout(staffAlertTimeoutRef.current);
        staffAlertTimeoutRef.current = null;
      }

      orderAlertExpiresAtRef.current = 0;

      supabase.removeChannel(channel);
    };
  }, [pathname, supabase]);

  useEffect(() => {
    if (!supabase || !isCustomerWorkspace(pathname) || isStaffWorkspace(pathname)) {
      return undefined;
    }

    const showCustomerAlert = (nextAlert) => {
      setCustomerAlert(nextAlert);

      if (customerAlertTimeoutRef.current) {
        clearTimeout(customerAlertTimeoutRef.current);
        customerAlertTimeoutRef.current = null;
      }

      customerAlertExpiresAtRef.current = Date.now() + CUSTOMER_ALERT_VISIBLE_MS;
      customerAlertTimeoutRef.current = setTimeout(() => {
        setCustomerAlert(null);
        customerAlertExpiresAtRef.current = 0;
        customerAlertTimeoutRef.current = null;
      }, CUSTOMER_ALERT_VISIBLE_MS);

      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        try {
          const notification = new Notification(nextAlert.title, {
            body: `${nextAlert.message}${nextAlert.detail ? `\n${nextAlert.detail}` : ""}`,
            tag: nextAlert.id,
          });

          notification.onclick = () => {
            window.focus();
            window.location.href = nextAlert.href;
          };
        } catch {}
      }
    };

    const channel = supabase.channel(`customer-live-alerts:${pathname}`);

    channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "orders",
      },
      (payload) => {
        const previousOrder = payload.old ?? {};
        const nextOrder = payload.new ?? {};

        if (!nextOrder.id || !nextOrder.status || nextOrder.status === previousOrder.status) {
          return;
        }

        const alertKey = `${nextOrder.id}:${nextOrder.status}`;

        if (hasRecentCustomerAlert(alertKey)) {
          return;
        }

        rememberCustomerAlert(alertKey);

        showCustomerAlert({
          id: `customer-order-${alertKey}`,
          title: "Atualizacao de pedido",
          message: `${getOrderStatusLabel(nextOrder.status)}${nextOrder.checkout_reference ? ` | ${nextOrder.checkout_reference}` : ""}`,
          detail: nextOrder.item_name
            ? `Item: ${nextOrder.item_name}`
            : "Acompanhe o andamento em Pedidos.",
          href: "/pedidos",
          linkLabel: "Ver pedidos",
        });
      },
    );

    channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "reservations",
      },
      (payload) => {
        const previousReservation = payload.old ?? {};
        const nextReservation = payload.new ?? {};

        if (
          !nextReservation.id ||
          !nextReservation.status ||
          nextReservation.status === previousReservation.status
        ) {
          return;
        }

        const alertKey = `${nextReservation.id}:${nextReservation.status}`;

        if (hasRecentCustomerAlert(alertKey)) {
          return;
        }

        rememberCustomerAlert(alertKey);

        showCustomerAlert({
          id: `customer-reservation-${alertKey}`,
          title: "Atualizacao de reserva",
          message: getReservationStatusLabel(nextReservation.status),
          detail:
            nextReservation.reservation_date && nextReservation.reservation_time
              ? `Horario: ${String(nextReservation.reservation_date)} as ${String(
                  nextReservation.reservation_time,
                ).slice(0, 5)}`
              : "Confira os detalhes na aba de Reservas.",
          href: "/reservas",
          linkLabel: "Ver reservas",
        });
      },
    );

    channel.subscribe();

    return () => {
      if (customerAlertTimeoutRef.current) {
        clearTimeout(customerAlertTimeoutRef.current);
        customerAlertTimeoutRef.current = null;
      }

      customerAlertExpiresAtRef.current = 0;

      supabase.removeChannel(channel);
    };
  }, [pathname, supabase]);

  const toggleSound = () => {
    setIsSoundEnabled((currentValue) => {
      const nextValue = !currentValue;

      if (nextValue) {
        playOrderAlertPattern(audioContextRef);
      }

      return nextValue;
    });
  };

  return (
    <>
      {orderAlert ? (
        <div className="staff-order-toast" role="status" aria-live="polite">
          <div className="staff-order-toast-icon">
            <BellRing size={18} />
          </div>
          <button
            type="button"
            className="live-toast-close live-toast-close-dark"
            onClick={dismissStaffAlert}
            aria-label="Fechar notificacao de pedido"
          >
            <X size={14} />
          </button>
          <div className="staff-order-toast-copy">
            <p className="staff-order-toast-title">{orderAlert.title}</p>
            <p className="staff-order-toast-message">{orderAlert.message}</p>
            <p className="staff-order-toast-detail">{orderAlert.detail}</p>
          </div>
          <div className="staff-order-toast-actions">
            <Link
              href="/operacao/comandas"
              className="staff-order-toast-link"
              onClick={dismissStaffAlert}
            >
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
      ) : null}

      {customerAlert ? (
        <div className="customer-live-toast" role="status" aria-live="polite">
          <div className="customer-live-toast-icon">
            <BellRing size={16} />
          </div>
          <button
            type="button"
            className="live-toast-close live-toast-close-light"
            onClick={dismissCustomerAlert}
            aria-label="Fechar notificacao"
          >
            <X size={14} />
          </button>
          <div className="customer-live-toast-copy">
            <p className="customer-live-toast-title">{customerAlert.title}</p>
            <p className="customer-live-toast-message">{customerAlert.message}</p>
            <p className="customer-live-toast-detail">{customerAlert.detail}</p>
          </div>
          <Link
            href={customerAlert.href}
            className="customer-live-toast-link"
            onClick={dismissCustomerAlert}
          >
            {customerAlert.linkLabel}
          </Link>
        </div>
      ) : null}
    </>
  );
}
