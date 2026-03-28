import Link from "next/link";
import {
  BriefcaseBusiness,
  CalendarRange,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Dot,
  House,
  LayoutDashboard,
  LogIn,
  LogOut,
  Mail,
  Shield,
  ShoppingBag,
  Sparkles,
  UserRound,
  UtensilsCrossed,
} from "lucide-react";

import { logoutAction } from "@/app/login/actions";
import { ActiveLink } from "@/components/active-link";
import { CartHeaderLink } from "@/components/cart-header-link";
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
import { getStaffModules } from "@/lib/staff-modules";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const staffDropdownSectionsTemplate = [
  {
    title: "Principal",
    hrefs: ["/painel", "/operacao"],
  },
  {
    title: "Atendimento",
    hrefs: [
      "/operacao/comandas",
      "/operacao/reservas",
      "/operacao/mesas",
      "/operacao/cozinha",
    ],
  },
  {
    title: "Gestao",
    hrefs: [
      "/operacao/menu",
      "/operacao/equipe",
      "/operacao/escala",
      "/operacao/checklists",
      "/operacao/incidentes",
      "/operacao/campanhas",
    ],
  },
  {
    title: "Inteligencia",
    hrefs: [
      "/operacao/relatorios",
      "/operacao/previsao",
      "/operacao/configuracoes",
      "/operacao/executivo",
      "/operacao/auditoria",
    ],
  },
  {
    title: "Conta",
    hrefs: ["/area-funcionario"],
  },
];

const customerDropdownSectionsTemplate = [
  {
    title: "Principal",
    hrefs: ["/cardapio", "/pedidos", "/reservas"],
  },
  {
    title: "Experiencia",
    hrefs: ["/eventos", "/contato"],
  },
  {
    title: "Conta",
    hrefs: ["/area-cliente", "/carrinho"],
  },
];

function buildStaffDropdownSections({ role, notifications }) {
  const modules = getStaffModules(role);
  const availableItems = new Map([
    [
      "/painel",
      { href: "/painel", label: "Painel", exact: true, icon: LayoutDashboard },
    ],
    [
      "/operacao/comandas",
      {
        href: "/operacao/comandas",
        label: "Abrir pedidos dos clientes",
        icon: ClipboardList,
      },
    ],
    [
      "/operacao",
      { href: "/operacao", label: "Central", exact: true, icon: BriefcaseBusiness },
    ],
    [
      "/area-funcionario",
      { href: "/area-funcionario", label: "Portal", exact: true, icon: Shield },
    ],
  ]);

  for (const moduleItem of modules) {
    if (!availableItems.has(moduleItem.href)) {
      availableItems.set(moduleItem.href, {
        href: moduleItem.href,
        label: moduleItem.title,
        icon: moduleItem.icon,
      });
    }
  }

  const withBadge = (item) => {
    if (item.href === "/operacao/comandas") {
      return {
        ...item,
        badgeCount: notifications.orders,
        badgeKind: "orders",
        badgeLatestAt: notifications.ordersLatestAt,
      };
    }

    if (item.href === "/operacao/reservas") {
      return {
        ...item,
        badgeCount: notifications.reservations,
        badgeKind: "reservations",
        badgeLatestAt: notifications.reservationsLatestAt,
      };
    }

    return item;
  };

  const templateHrefs = new Set(
    staffDropdownSectionsTemplate.flatMap((section) => section.hrefs),
  );

  const sections = staffDropdownSectionsTemplate
    .map((section) => ({
      title: section.title,
      items: section.hrefs
        .map((href) => availableItems.get(href))
        .filter(Boolean)
        .map(withBadge),
    }))
    .filter((section) => section.items.length);

  const extraItems = Array.from(availableItems.values())
    .filter((item) => !templateHrefs.has(item.href))
    .sort((left, right) => left.label.localeCompare(right.label, "pt-BR"))
    .map(withBadge);

  if (extraItems.length) {
    sections.push({
      title: "Outros",
      items: extraItems,
    });
  }

  return sections;
}

function buildCustomerDropdownSections({ notifications }) {
  const availableItems = new Map([
    [
      "/cardapio",
      { href: "/cardapio", label: "Cardapio", exact: true, icon: UtensilsCrossed },
    ],
    [
      "/pedidos",
      { href: "/pedidos", label: "Pedidos", exact: true, icon: ClipboardList },
    ],
    [
      "/reservas",
      { href: "/reservas", label: "Reservas", exact: true, icon: CalendarRange },
    ],
    [
      "/eventos",
      { href: "/eventos", label: "Eventos", exact: true, icon: Sparkles },
    ],
    [
      "/contato",
      { href: "/contato", label: "Contato", exact: true, icon: Mail },
    ],
    [
      "/area-cliente",
      { href: "/area-cliente", label: "Perfil", exact: true, icon: UserRound },
    ],
    [
      "/carrinho",
      { href: "/carrinho", label: "Meu carrinho", exact: true, icon: ShoppingBag },
    ],
  ]);

  const withBadge = (item) => {
    if (item.href === "/pedidos") {
      return {
        ...item,
        badgeCount: notifications.orders,
        badgeKind: "orders",
        badgeLatestAt: notifications.ordersLatestAt,
      };
    }

    if (item.href === "/reservas") {
      return {
        ...item,
        badgeCount: notifications.reservations,
        badgeKind: "reservations",
        badgeLatestAt: notifications.reservationsLatestAt,
      };
    }

    return item;
  };

  const templateHrefs = new Set(
    customerDropdownSectionsTemplate.flatMap((section) => section.hrefs),
  );

  const sections = customerDropdownSectionsTemplate
    .map((section) => ({
      title: section.title,
      items: section.hrefs
        .map((href) => availableItems.get(href))
        .filter(Boolean)
        .map(withBadge),
    }))
    .filter((section) => section.items.length);

  const extraItems = Array.from(availableItems.values())
    .filter((item) => !templateHrefs.has(item.href))
    .sort((left, right) => left.label.localeCompare(right.label, "pt-BR"))
    .map(withBadge);

  if (extraItems.length) {
    sections.push({
      title: "Outros",
      items: extraItems,
    });
  }

  return sections;
}

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
  const staffDropdownSections = staffSession && session
    ? buildStaffDropdownSections({
        role: session.role,
        notifications: {
          orders: notificationContext.orders,
          reservations: notificationContext.reservations,
          ordersLatestAt: notificationContext.ordersLatestAt,
          reservationsLatestAt: notificationContext.reservationsLatestAt,
        },
      })
    : [];
  const staffDropdownItemCount = staffDropdownSections.reduce(
    (total, section) => total + section.items.length,
    0,
  );
  const customerSession = session?.role === "customer";
  const customerDropdownSections = customerSession
    ? buildCustomerDropdownSections({
        notifications: {
          orders: notificationContext.orders,
          reservations: notificationContext.reservations,
          ordersLatestAt: notificationContext.ordersLatestAt,
          reservationsLatestAt: notificationContext.reservationsLatestAt,
        },
      })
    : [];
  const customerDropdownItemCount = customerDropdownSections.reduce(
    (total, section) => total + section.items.length,
    0,
  );
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
  const mobileDockItems = session
    ? staffSession
      ? [
          { href: "/painel", label: "Painel", exact: true, icon: LayoutDashboard },
          {
            href: "/operacao/comandas",
            label: "Pedidos",
            icon: ClipboardList,
            badgeCount: notificationContext.orders,
            badgeKind: "orders",
            badgeLatestAt: notificationContext.ordersLatestAt,
          },
          {
            href: "/operacao/reservas",
            label: "Reservas",
            icon: CalendarRange,
            badgeCount: notificationContext.reservations,
            badgeKind: "reservations",
            badgeLatestAt: notificationContext.reservationsLatestAt,
          },
          { href: "/operacao", label: "Central", exact: true, icon: BriefcaseBusiness },
        ]
      : [
          { href: "/cardapio", label: "Cardapio", exact: true, icon: UtensilsCrossed },
          {
            href: "/pedidos",
            label: "Pedidos",
            exact: true,
            icon: ClipboardList,
            badgeCount: notificationContext.orders,
            badgeKind: "orders",
            badgeLatestAt: notificationContext.ordersLatestAt,
          },
          {
            href: "/reservas",
            label: "Reservas",
            exact: true,
            icon: CalendarRange,
            badgeCount: notificationContext.reservations,
            badgeKind: "reservations",
            badgeLatestAt: notificationContext.reservationsLatestAt,
          },
          { href: "/area-cliente", label: "Perfil", exact: true, icon: UserRound },
        ]
    : [
        { href: "/", label: "Inicio", exact: true, icon: House },
        { href: "/cardapio", label: "Cardapio", exact: true, icon: UtensilsCrossed },
        { href: "/reservas", label: "Reservas", exact: true, icon: CalendarRange },
        { href: "/login", label: "Entrar", exact: true, icon: LogIn },
      ];
  const showMobileBottomNav = !customerSession;

  const dashboardHref = session ? getRouteForRole(session.role) : "/login";

  return (
    <>
      <header className="site-header-fixed">
        <div className="site-header-shell shell">
          <div className="site-header-card nav-pill rounded-[1.75rem] px-3 py-2.5 sm:rounded-[2.2rem] sm:px-6 sm:py-4">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <Link href="/" className="flex w-full min-w-0 items-center gap-3 sm:w-auto sm:gap-4">
                <div className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(217,185,122,0.18)] bg-[linear-gradient(135deg,var(--forest),#223a31)] text-[var(--cream)] shadow-[0_18px_34px_rgba(20,35,29,0.22)] sm:h-13 sm:w-13">
                  <span className="display-title text-[1.32rem] font-semibold sm:text-2xl">P</span>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-[rgba(255,255,255,0.72)] bg-[var(--gold-soft)] sm:h-3 sm:w-3" />
                </div>
                <div className="min-w-0">
                  <div className="hidden items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--sage)] sm:flex">
                    <span>Restaurante</span>
                    <Dot size={14} />
                    <span>{staffSession ? "acesso interno" : "reservas e atendimento"}</span>
                  </div>
                  <p className="display-title text-[1.26rem] leading-none text-[var(--forest)] sm:text-[2rem]">
                    {restaurantInfo.name}
                  </p>
                </div>
              </Link>

              <nav className="hidden items-center lg:flex">
                {staffSession ? (
                  <details className="header-dropdown">
                    <summary className="header-dropdown-trigger">
                      <span>Menu</span>
                      <ChevronDown className="header-dropdown-chevron" size={16} />
                    </summary>

                    <div className="header-dropdown-panel">
                      <div className="header-dropdown-head">
                        <p className="header-dropdown-head-eyebrow">navegacao interna</p>
                        <p className="header-dropdown-head-title">
                          {staffDropdownItemCount} acesso(s) do{" "}
                          {getStaffRoleLabel(session.role).toLowerCase()}
                        </p>
                      </div>

                      {staffDropdownSections.map((section) => (
                        <section key={section.title} className="header-dropdown-section">
                          <p className="header-dropdown-section-title">{section.title}</p>
                          <div className="header-dropdown-section-list">
                            {section.items.map((item) => (
                              <ActiveLink
                                key={item.href}
                                href={item.href}
                                exact={item.exact}
                                className="header-dropdown-link"
                                activeClassName="header-dropdown-link-active"
                              >
                                <span className="header-dropdown-link-main">
                                  <span className="header-dropdown-link-icon">
                                    <item.icon size={14} />
                                  </span>
                                  <span className="header-dropdown-link-title">{item.label}</span>
                                </span>
                                <span className="header-dropdown-link-side">
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
                                  <ChevronRight size={14} className="header-dropdown-link-arrow" />
                                </span>
                              </ActiveLink>
                            ))}
                          </div>
                        </section>
                      ))}
                    </div>
                  </details>
                ) : customerSession ? (
                  <details className="header-dropdown">
                    <summary className="header-dropdown-trigger">
                      <span>Menu</span>
                      <ChevronDown className="header-dropdown-chevron" size={16} />
                    </summary>

                    <div className="header-dropdown-panel">
                      <div className="header-dropdown-head">
                        <p className="header-dropdown-head-eyebrow">navegacao do cliente</p>
                        <p className="header-dropdown-head-title">
                          {customerDropdownItemCount} acesso(s) para acompanhar pedidos, reservas e perfil
                        </p>
                      </div>

                      {customerDropdownSections.map((section) => (
                        <section key={section.title} className="header-dropdown-section">
                          <p className="header-dropdown-section-title">{section.title}</p>
                          <div className="header-dropdown-section-list">
                            {section.items.map((item) => (
                              <ActiveLink
                                key={item.href}
                                href={item.href}
                                exact={item.exact}
                                className="header-dropdown-link"
                                activeClassName="header-dropdown-link-active"
                              >
                                <span className="header-dropdown-link-main">
                                  <span className="header-dropdown-link-icon">
                                    <item.icon size={14} />
                                  </span>
                                  <span className="header-dropdown-link-title">{item.label}</span>
                                </span>
                                <span className="header-dropdown-link-side">
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
                                  <ChevronRight size={14} className="header-dropdown-link-arrow" />
                                </span>
                              </ActiveLink>
                            ))}
                          </div>
                        </section>
                      ))}
                    </div>
                  </details>
                ) : (
                  <div className="flex items-center gap-2">
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
                  </div>
                )}
              </nav>

              <div className="site-header-actions flex w-full flex-wrap items-center gap-1.5 sm:w-auto sm:flex-nowrap sm:justify-end sm:gap-2">
                {session ? (
                  <>
                    {session.role === "customer" ? (
                      <>
                        <CartHeaderLink compact className="site-mobile-cart-link" />
                        <CartHeaderLink className="site-desktop-cart-link" />
                        <details className="header-dropdown site-header-menu-dropdown lg:hidden">
                          <summary className="header-dropdown-trigger">
                            <span>Menu</span>
                            <ChevronDown className="header-dropdown-chevron" size={16} />
                          </summary>
                          <div className="header-dropdown-panel">
                            <div className="header-dropdown-head">
                              <p className="header-dropdown-head-eyebrow">acesso do cliente</p>
                              <p className="header-dropdown-head-title">
                                Navegue por cardapio, pedidos, reservas, contato e perfil.
                              </p>
                            </div>
                            {customerDropdownSections.map((section) => (
                              <section key={`mobile-${section.title}`} className="header-dropdown-section">
                                <p className="header-dropdown-section-title">{section.title}</p>
                                <div className="header-dropdown-section-list">
                                  {section.items.map((item) => (
                                    <ActiveLink
                                      key={`mobile-${item.href}`}
                                      href={item.href}
                                      exact={item.exact}
                                      className="header-dropdown-link"
                                      activeClassName="header-dropdown-link-active"
                                    >
                                      <span className="header-dropdown-link-main">
                                        <span className="header-dropdown-link-icon">
                                          <item.icon size={14} />
                                        </span>
                                        <span className="header-dropdown-link-title">{item.label}</span>
                                      </span>
                                      <span className="header-dropdown-link-side">
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
                                        <ChevronRight size={14} className="header-dropdown-link-arrow" />
                                      </span>
                                    </ActiveLink>
                                  ))}
                                </div>
                              </section>
                            ))}
                          </div>
                        </details>
                      </>
                    ) : null}
                    {staffSession ? (
                      <Link
                        href={dashboardHref}
                        className="site-header-role-badge site-mobile-role-chip floating-badge inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-[var(--forest)] sm:px-4 sm:text-sm"
                      >
                        <Shield size={16} />
                        {getStaffRoleLabel(session.role)}
                      </Link>
                    ) : null}
                    {staffSession ? <HeaderSearch staffSession /> : null}
                    <NotificationCenter
                      staffSession={staffSession}
                      ordersCount={notificationContext.orders}
                      reservationsCount={notificationContext.reservations}
                      ordersLatestAt={notificationContext.ordersLatestAt}
                      reservationsLatestAt={notificationContext.reservationsLatestAt}
                      items={notificationContext.items}
                    />
                    <form action={logoutAction} className="site-header-logout-form">
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
            </div>

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

      {showMobileBottomNav ? (
        <nav className="mobile-bottom-nav lg:hidden" aria-label="Navegacao rapida no celular">
          {mobileDockItems.map((item) => (
            <ActiveLink
              key={item.href}
              href={item.href}
              exact={item.exact}
              className="mobile-bottom-nav-link"
              activeClassName="mobile-bottom-nav-link-active"
            >
              <span className="mobile-bottom-nav-icon">
                <item.icon size={15} />
              </span>
              <span className="mobile-bottom-nav-label">{item.label}</span>
              {item.badgeCount && item.badgeKind ? (
                <NotificationCountBadge
                  count={item.badgeCount}
                  latestAt={item.badgeLatestAt}
                  kind={item.badgeKind}
                  staffSession={staffSession}
                  className="mobile-bottom-nav-badge"
                  ariaLabel={`${item.badgeCount} notificacoes`}
                />
              ) : null}
            </ActiveLink>
          ))}
        </nav>
      ) : null}

      <div aria-hidden className="site-header-offset" />
      {showMobileBottomNav ? (
        <div aria-hidden className="mobile-bottom-nav-spacer lg:hidden" />
      ) : null}
    </>
  );
}
