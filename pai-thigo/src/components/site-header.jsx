import Link from "next/link";
import {
  CalendarRange,
  Dot,
  LogOut,
  Shield,
  Sparkles,
} from "lucide-react";

import { logoutAction } from "@/app/login/actions";
import { ActiveLink } from "@/components/active-link";
import { CartHeaderLink } from "@/components/cart-header-link";
import { HeaderMenuDrawer } from "@/components/header-menu-drawer";
import { HeaderSearch } from "@/components/header-search";
import { NotificationCountBadge } from "@/components/notification-count-badge";
import { NotificationCenter } from "@/components/notification-center";
import {
  getCurrentSession,
  getRouteForRole,
  getStaffRoleLabel,
  isStaffRole,
} from "@/lib/auth";
import { getRestaurantProfile } from "@/lib/restaurant-profile";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function getOrderStatusLabel(value) {
  const labels = {
    received: "Pedido recebido",
    preparing: "Pedido em preparo",
    ready: "Pedido pronto",
    dispatching: "Saiu para entrega",
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

function formatFeedMoment(rawValue) {
  if (!rawValue) {
    return "";
  }

  const parsedDate = new Date(rawValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(parsedDate)
    .replace(",", "");
}

function toEpoch(rawValue) {
  const parsedDate = new Date(rawValue ?? 0);
  const time = parsedDate.getTime();
  return Number.isFinite(time) ? time : 0;
}

async function getHeaderNotificationContext(session) {
  const emptyContext = {
    orders: 0,
    reservations: 0,
    ordersLatestAt: 0,
    reservationsLatestAt: 0,
    items: [],
  };

  if (!session) {
    return emptyContext;
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return emptyContext;
  }

  if (isStaffRole(session.role)) {
    const [ordersCountResult, reservationsCountResult, recentOrdersResult, recentReservationsResult] = await Promise.all([
      supabase
        .from("orders")
        .select("*", { head: true, count: "exact" })
        .eq("status", "received"),
      supabase
        .from("reservations")
        .select("*", { head: true, count: "exact" })
        .eq("status", "pending"),
      supabase
        .from("orders")
        .select("id, checkout_reference, guest_name, status, item_name, updated_at, created_at")
        .order("updated_at", { ascending: false })
        .limit(8),
      supabase
        .from("reservations")
        .select("id, guest_name, status, reservation_date, reservation_time, updated_at, created_at")
        .order("updated_at", { ascending: false })
        .limit(8),
    ]);

    if (
      ordersCountResult.error ||
      reservationsCountResult.error ||
      recentOrdersResult.error ||
      recentReservationsResult.error
    ) {
      return emptyContext;
    }

    const feed = [];
    let ordersLatestAt = 0;
    let reservationsLatestAt = 0;

    for (const order of recentOrdersResult.data ?? []) {
      const eventAt = order.updated_at ?? order.created_at;
      ordersLatestAt = Math.max(ordersLatestAt, toEpoch(eventAt));
      feed.push({
        id: `order:${order.id}:${order.status}`,
        kind: "order",
        title: getOrderStatusLabel(order.status),
        detail: order.checkout_reference
          ? `${order.checkout_reference}${order.guest_name ? ` | ${order.guest_name}` : ""}`
          : order.guest_name || order.item_name || "Atualizacao de pedido",
        href: "/operacao/comandas",
        timestamp: formatFeedMoment(eventAt),
        sortAt: toEpoch(eventAt),
      });
    }

    for (const reservation of recentReservationsResult.data ?? []) {
      const eventAt = reservation.updated_at ?? reservation.created_at;
      reservationsLatestAt = Math.max(reservationsLatestAt, toEpoch(eventAt));
      const hourLabel = String(reservation.reservation_time ?? "").slice(0, 5);
      feed.push({
        id: `reservation:${reservation.id}:${reservation.status}`,
        kind: "reservation",
        title: getReservationStatusLabel(reservation.status),
        detail: `${reservation.guest_name || "Reserva"}${hourLabel ? ` | ${hourLabel}` : ""}`,
        href: "/operacao/reservas",
        timestamp: formatFeedMoment(eventAt),
        sortAt: toEpoch(eventAt),
      });
    }

    const uniqueFeed = Array.from(
      new Map(
        feed
          .sort((left, right) => right.sortAt - left.sortAt)
          .map((item) => [item.id, item]),
      ).values(),
    )
      .slice(0, 10)
      .map((item) => {
        const { sortAt, ...normalizedItem } = item;
        void sortAt;
        return normalizedItem;
      });

    return {
      orders: ordersCountResult.count ?? 0,
      reservations: reservationsCountResult.count ?? 0,
      ordersLatestAt,
      reservationsLatestAt,
      items: uniqueFeed,
    };
  }

  const [ordersCountResult, reservationsCountResult, recentOrdersResult, recentReservationsResult] =
    await Promise.all([
    supabase
      .from("orders")
      .select("*", { head: true, count: "exact" })
      .eq("user_id", session.user.id)
      .in("status", ["received", "preparing", "ready", "dispatching"]),
    supabase
      .from("reservations")
      .select("*", { head: true, count: "exact" })
      .eq("user_id", session.user.id)
      .in("status", ["pending", "confirmed", "seated"]),
    supabase
      .from("orders")
      .select("id, checkout_reference, status, item_name, updated_at, created_at")
      .eq("user_id", session.user.id)
      .order("updated_at", { ascending: false })
      .limit(8),
    supabase
      .from("reservations")
      .select("id, status, reservation_date, reservation_time, updated_at, created_at")
      .eq("user_id", session.user.id)
      .order("updated_at", { ascending: false })
      .limit(8),
    ]);

  if (
    ordersCountResult.error ||
    reservationsCountResult.error ||
    recentOrdersResult.error ||
    recentReservationsResult.error
  ) {
    return emptyContext;
  }

  const feed = [];
  let ordersLatestAt = 0;
  let reservationsLatestAt = 0;

  for (const order of recentOrdersResult.data ?? []) {
    const eventAt = order.updated_at ?? order.created_at;
    ordersLatestAt = Math.max(ordersLatestAt, toEpoch(eventAt));
    feed.push({
      id: `order:${order.id}:${order.status}`,
      kind: "order",
      title: getOrderStatusLabel(order.status),
      detail: order.checkout_reference
        ? `${order.checkout_reference}${order.item_name ? ` | ${order.item_name}` : ""}`
        : order.item_name || "Atualizacao de pedido",
      href: "/pedidos",
      timestamp: formatFeedMoment(eventAt),
      sortAt: toEpoch(eventAt),
    });
  }

  for (const reservation of recentReservationsResult.data ?? []) {
    const eventAt = reservation.updated_at ?? reservation.created_at;
    reservationsLatestAt = Math.max(reservationsLatestAt, toEpoch(eventAt));
    const dayLabel = String(reservation.reservation_date ?? "");
    const hourLabel = String(reservation.reservation_time ?? "").slice(0, 5);
    feed.push({
      id: `reservation:${reservation.id}:${reservation.status}`,
      kind: "reservation",
      title: getReservationStatusLabel(reservation.status),
      detail: `${dayLabel}${hourLabel ? ` | ${hourLabel}` : ""}`,
      href: "/reservas",
      timestamp: formatFeedMoment(eventAt),
      sortAt: toEpoch(eventAt),
    });
  }

  const uniqueFeed = Array.from(
    new Map(
      feed
        .sort((left, right) => right.sortAt - left.sortAt)
        .map((item) => [item.id, item]),
    ).values(),
  )
    .slice(0, 10)
    .map((item) => {
      const { sortAt, ...normalizedItem } = item;
      void sortAt;
      return normalizedItem;
    });

  return {
    orders: ordersCountResult.count ?? 0,
    reservations: reservationsCountResult.count ?? 0,
    ordersLatestAt,
    reservationsLatestAt,
    items: uniqueFeed,
  };
}

export async function SiteHeader() {
  const session = await getCurrentSession();
  const [restaurantInfo, notificationContext] = await Promise.all([
    getRestaurantProfile(),
    getHeaderNotificationContext(session),
  ]);
  const staffSession = isStaffRole(session?.role);
  const navItems = staffSession
      ? [
        { href: "/painel", label: "Painel", exact: true },
        {
          href: "/operacao/comandas",
          label: "Pedidos",
          badgeCount: notificationContext.orders,
          badgeKind: "orders",
          badgeLatestAt: notificationContext.ordersLatestAt,
        },
        {
          href: "/operacao/reservas",
          label: "Reservas",
          badgeCount: notificationContext.reservations,
          badgeKind: "reservations",
          badgeLatestAt: notificationContext.reservationsLatestAt,
        },
        { href: "/operacao", label: "Central", exact: true },
      ]
    : [
        { href: "/cardapio", label: "Cardapio", exact: true },
        {
          href: "/pedidos",
          label: "Pedidos",
          exact: true,
          badgeCount: notificationContext.orders,
          badgeKind: "orders",
          badgeLatestAt: notificationContext.ordersLatestAt,
        },
        {
          href: "/reservas",
          label: "Reservas",
          exact: true,
          badgeCount: notificationContext.reservations,
          badgeKind: "reservations",
          badgeLatestAt: notificationContext.reservationsLatestAt,
        },
        { href: "/area-cliente", label: "Perfil", exact: true },
      ];

  const dashboardHref = session ? getRouteForRole(session.role) : "/login";

  return (
    <>
      <header className="site-header-fixed">
        <div className="site-header-shell shell">
          <div className="site-header-card nav-pill rounded-[2.2rem] px-4 py-4 sm:px-6">
            <div className={staffSession ? "staff-header-main" : "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"}>
              {staffSession ? (
                <>
                  <div className="staff-header-main-left">
                    <HeaderMenuDrawer items={navItems} />
                  </div>

                  <div className="staff-header-main-center">
                    <Link href="/" className="staff-header-brand flex min-w-0 items-center gap-4">
                      <div className="relative flex h-13 w-13 items-center justify-center rounded-full border border-[rgba(217,185,122,0.18)] bg-[linear-gradient(135deg,var(--forest),#223a31)] text-[var(--cream)] shadow-[0_18px_34px_rgba(20,35,29,0.22)]">
                        <span className="display-title text-2xl font-semibold">P</span>
                        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border border-[rgba(255,255,255,0.72)] bg-[var(--gold-soft)]" />
                      </div>
                      <div className="min-w-0">
                        <div className="hidden items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--sage)] sm:flex">
                          <span>Restaurante</span>
                          <Dot size={14} />
                          <span>acesso interno</span>
                        </div>
                        <p className="display-title text-[1.45rem] leading-none text-[var(--forest)] sm:text-[2rem]">
                          {restaurantInfo.name}
                        </p>
                      </div>
                    </Link>
                  </div>

                  <div className="staff-header-main-right site-header-actions flex w-full flex-wrap items-center justify-end gap-2">
                    <HeaderSearch staffSession />
                    <NotificationCenter
                      staffSession
                      ordersCount={notificationContext.orders}
                      reservationsCount={notificationContext.reservations}
                      ordersLatestAt={notificationContext.ordersLatestAt}
                      reservationsLatestAt={notificationContext.reservationsLatestAt}
                      items={notificationContext.items}
                    />
                    <Link
                      href={dashboardHref}
                      className="site-header-role-badge floating-badge inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-[var(--forest)] sm:px-4 sm:text-sm"
                    >
                      <Shield size={16} />
                      {getStaffRoleLabel(session.role)}
                    </Link>
                    <form action={logoutAction}>
                      <button type="submit" className="site-header-logout button-primary px-3 py-2 sm:px-4 sm:py-2.5">
                        <LogOut size={16} />
                        Sair
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <>
                  <Link href="/" className="flex w-full min-w-0 items-center gap-4 sm:w-auto">
                    <div className="relative flex h-13 w-13 items-center justify-center rounded-full border border-[rgba(217,185,122,0.18)] bg-[linear-gradient(135deg,var(--forest),#223a31)] text-[var(--cream)] shadow-[0_18px_34px_rgba(20,35,29,0.22)]">
                      <span className="display-title text-2xl font-semibold">P</span>
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border border-[rgba(255,255,255,0.72)] bg-[var(--gold-soft)]" />
                    </div>
                    <div className="min-w-0">
                      <div className="hidden items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--sage)] sm:flex">
                        <span>Restaurante</span>
                        <Dot size={14} />
                        <span>reservas e atendimento</span>
                      </div>
                      <p className="display-title text-[1.45rem] leading-none text-[var(--forest)] sm:text-[2rem]">
                        {restaurantInfo.name}
                      </p>
                    </div>
                  </Link>

                  <nav className="hidden items-center gap-2 lg:flex">
                    {navItems.map((item) => (
                      <ActiveLink
                        key={item.href}
                        href={item.href}
                        exact={item.exact}
                        className="nav-link"
                        activeClassName="nav-link-active"
                      >
                        <span className="nav-link-content">
                          <span>{item.label}</span>
                          {item.badgeCount && item.badgeKind ? (
                            <NotificationCountBadge
                              count={item.badgeCount}
                              latestAt={item.badgeLatestAt}
                              kind={item.badgeKind}
                              staffSession={staffSession}
                              className="nav-link-badge"
                              ariaLabel={`${item.badgeCount} notificacoes`}
                            />
                          ) : null}
                        </span>
                      </ActiveLink>
                    ))}
                  </nav>

                  <div className="site-header-actions flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap sm:justify-end">
                    {session ? (
                      <>
                        {session.role === "customer" ? (
                          <>
                            <CartHeaderLink compact className="md:hidden" />
                            <CartHeaderLink className="hidden md:inline-flex" />
                          </>
                        ) : null}
                        <HeaderSearch />
                        <NotificationCenter
                          staffSession={staffSession}
                          ordersCount={notificationContext.orders}
                          reservationsCount={notificationContext.reservations}
                          ordersLatestAt={notificationContext.ordersLatestAt}
                          reservationsLatestAt={notificationContext.reservationsLatestAt}
                          items={notificationContext.items}
                        />
                        <form action={logoutAction}>
                          <button type="submit" className="site-header-logout button-primary px-3 py-2 sm:px-4 sm:py-2.5">
                            <LogOut size={16} />
                            Sair
                          </button>
                        </form>
                      </>
                    ) : (
                      <>
                        <HeaderSearch />
                        <Link href="/login" className="button-secondary hidden px-4 py-2.5 sm:inline-flex">
                          Entrar
                        </Link>
                        <Link href="/login" className="button-primary px-4 py-2.5">
                          <CalendarRange size={16} />
                          Acessar
                        </Link>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            {!staffSession ? (
            <div className="site-mobile-nav mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {navItems.map((item) => (
                <ActiveLink
                  key={item.href}
                  href={item.href}
                  exact={item.exact}
                  className="mobile-nav-link"
                  activeClassName="mobile-nav-link-active"
                >
                  <span className="mobile-nav-link-content">
                    <span className="mobile-nav-link-label">{item.label}</span>
                    {item.badgeCount && item.badgeKind ? (
                      <NotificationCountBadge
                        count={item.badgeCount}
                        latestAt={item.badgeLatestAt}
                        kind={item.badgeKind}
                        staffSession={staffSession}
                        className="mobile-nav-link-badge"
                        ariaLabel={`${item.badgeCount} notificacoes`}
                      />
                    ) : null}
                  </span>
                </ActiveLink>
              ))}
            </div>
            ) : null}

            <div className="mt-4 hidden items-center justify-between rounded-[1.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.4)] px-4 py-3 xl:flex">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--sage)]">
                Gastronomia contemporanea, atendimento cuidadoso e sistema integrado
              </p>
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
                <Sparkles size={14} />
                navegacao leve com dados conectados ao sistema
              </div>
            </div>
          </div>
        </div>
      </header>

      <div
        aria-hidden
        className={`site-header-offset${staffSession ? " site-header-offset-staff" : ""}`}
      />
    </>
  );
}
