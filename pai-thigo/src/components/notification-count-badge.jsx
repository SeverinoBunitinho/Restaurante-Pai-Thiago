"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import {
  getUnreadCount,
  markNotificationAsRead,
  NOTIFICATION_READ_EVENT,
} from "@/lib/notification-read-state";

function formatBadgeCount(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return "";
  }

  if (value > 99) {
    return "99+";
  }

  return String(value);
}

function isViewedRoute(kind, staffSession, pathname) {
  if (!pathname) {
    return false;
  }

  if (kind === "orders") {
    return staffSession
      ? pathname.startsWith("/operacao/comandas")
      : pathname === "/pedidos";
  }

  if (kind === "reservations") {
    return staffSession
      ? pathname.startsWith("/operacao/reservas")
      : pathname === "/reservas";
  }

  return false;
}

export function NotificationCountBadge({
  count = 0,
  latestAt = 0,
  kind,
  staffSession = false,
  className = "",
  ariaLabel = "",
}) {
  const pathname = usePathname();
  const [, setVersion] = useState(0);

  useEffect(() => {
    if (isViewedRoute(kind, staffSession, pathname)) {
      markNotificationAsRead(kind, staffSession, latestAt);
    }
  }, [kind, latestAt, pathname, staffSession]);

  useEffect(() => {
    const refresh = () => {
      setVersion((currentValue) => currentValue + 1);
    };

    window.addEventListener(NOTIFICATION_READ_EVENT, refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener(NOTIFICATION_READ_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const unreadCount = getUnreadCount(count, kind, staffSession, latestAt);

  if (!unreadCount) {
    return null;
  }

  return (
    <span className={className} aria-label={ariaLabel || `${unreadCount} notificacoes`}>
      {formatBadgeCount(unreadCount)}
    </span>
  );
}
