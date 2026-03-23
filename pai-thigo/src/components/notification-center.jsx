"use client";

import Link from "next/link";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { BellRing, CalendarRange, ClipboardList, RefreshCw, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

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

export function NotificationCenter({
  items = [],
  ordersCount = 0,
  reservationsCount = 0,
  ordersLatestAt = 0,
  reservationsLatestAt = 0,
  staffSession = false,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const panelRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [, setVersion] = useState(0);

  const unreadOrdersCount = getUnreadCount(
    ordersCount,
    "orders",
    staffSession,
    ordersLatestAt,
  );
  const unreadReservationsCount = getUnreadCount(
    reservationsCount,
    "reservations",
    staffSession,
    reservationsLatestAt,
  );

  const totalCount = Math.max(0, unreadOrdersCount + unreadReservationsCount);

  const normalizedItems = useMemo(
    () =>
      Array.isArray(items)
        ? items.filter((item) => item?.id && item?.title && item?.href).slice(0, 10)
        : [],
    [items],
  );

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

  useEffect(() => {
    const viewingOrders = staffSession
      ? pathname?.startsWith("/operacao/comandas")
      : pathname === "/pedidos";
    const viewingReservations = staffSession
      ? pathname?.startsWith("/operacao/reservas")
      : pathname === "/reservas";

    if (viewingOrders) {
      markNotificationAsRead("orders", staffSession, ordersLatestAt);
    }

    if (viewingReservations) {
      markNotificationAsRead("reservations", staffSession, reservationsLatestAt);
    }
  }, [
    pathname,
    staffSession,
    ordersLatestAt,
    reservationsLatestAt,
  ]);

  const markVisibleAsRead = () => {
    markNotificationAsRead("orders", staffSession, ordersLatestAt);
    markNotificationAsRead("reservations", staffSession, reservationsLatestAt);
  };

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div className="notification-center" ref={panelRef}>
      <button
        type="button"
        className={`notification-center-trigger ${open ? "notification-center-trigger-active" : ""}`}
        onClick={() =>
          setOpen((currentValue) => {
            const nextValue = !currentValue;

            if (nextValue) {
              markVisibleAsRead();
            }

            return nextValue;
          })
        }
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Central de notificacoes${totalCount ? ` com ${totalCount} novas` : ""}`}
      >
        <BellRing size={16} />
        <span className="notification-center-trigger-text">Notificacoes</span>
        {totalCount ? (
          <span className="notification-center-trigger-badge">{formatBadgeCount(totalCount)}</span>
        ) : null}
      </button>

      {open ? (
        <div className="notification-center-panel" role="dialog" aria-label="Central de notificacoes">
          <div className="notification-center-header">
            <p className="notification-center-eyebrow">
              {staffSession ? "Central interna" : "Area do cliente"}
            </p>
            <button
              type="button"
              className="notification-center-close"
              onClick={() => setOpen(false)}
              aria-label="Fechar notificacoes"
            >
              <X size={15} />
            </button>
          </div>

          <h3 className="notification-center-title">Atualizacoes em tempo real</h3>

          <div className="notification-center-counts">
            <span className="notification-count-pill">
              <ClipboardList size={14} />
              Pedidos
              <strong>{formatBadgeCount(unreadOrdersCount) || "0"}</strong>
            </span>
            <span className="notification-count-pill">
              <CalendarRange size={14} />
              Reservas
              <strong>{formatBadgeCount(unreadReservationsCount) || "0"}</strong>
            </span>
          </div>

          <div className="notification-center-feed">
            {normalizedItems.length ? (
              normalizedItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="notification-feed-item"
                  onClick={() => {
                    if (item.kind === "order") {
                      markNotificationAsRead("orders", staffSession, ordersLatestAt);
                    }

                    if (item.kind === "reservation") {
                      markNotificationAsRead(
                        "reservations",
                        staffSession,
                        reservationsLatestAt,
                      );
                    }

                    setOpen(false);
                  }}
                >
                  <p className="notification-feed-title">{item.title}</p>
                  <p className="notification-feed-detail">{item.detail}</p>
                  <p className="notification-feed-time">{item.timestamp || "Agora"}</p>
                </Link>
              ))
            ) : (
              <p className="notification-feed-empty">
                Nenhuma atualizacao recente para exibir no momento.
              </p>
            )}
          </div>

          <button
            type="button"
            className="notification-center-refresh"
            onClick={() => {
              startTransition(() => {
                router.refresh();
              });
            }}
          >
            <RefreshCw size={14} />
            Atualizar agora
          </button>
        </div>
      ) : null}
    </div>
  );
}
