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
import {
  getCurrentSession,
  getRouteForRole,
  getStaffRoleLabel,
  isStaffRole,
} from "@/lib/auth";
import { getRestaurantProfile } from "@/lib/restaurant-profile";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function formatBadgeCount(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return "";
  }

  if (value > 99) {
    return "99+";
  }

  return String(value);
}

async function getHeaderNotificationCounts(session) {
  const emptyCounts = {
    orders: 0,
    reservations: 0,
  };

  if (!session) {
    return emptyCounts;
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return emptyCounts;
  }

  if (isStaffRole(session.role)) {
    const [ordersResult, reservationsResult] = await Promise.all([
      supabase
        .from("orders")
        .select("*", { head: true, count: "exact" })
        .eq("status", "received"),
      supabase
        .from("reservations")
        .select("*", { head: true, count: "exact" })
        .eq("status", "pending"),
    ]);

    if (ordersResult.error || reservationsResult.error) {
      return emptyCounts;
    }

    return {
      orders: ordersResult.count ?? 0,
      reservations: reservationsResult.count ?? 0,
    };
  }

  const [ordersResult, reservationsResult] = await Promise.all([
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
  ]);

  if (ordersResult.error || reservationsResult.error) {
    return emptyCounts;
  }

  return {
    orders: ordersResult.count ?? 0,
    reservations: reservationsResult.count ?? 0,
  };
}

export async function SiteHeader() {
  const session = await getCurrentSession();
  const [restaurantInfo, notificationCounts] = await Promise.all([
    getRestaurantProfile(),
    getHeaderNotificationCounts(session),
  ]);
  const staffSession = isStaffRole(session?.role);
  const navItems = staffSession
    ? [
        { href: "/painel", label: "Painel", exact: true },
        { href: "/operacao/comandas", label: "Pedidos", badgeCount: notificationCounts.orders },
        { href: "/operacao/reservas", label: "Reservas", badgeCount: notificationCounts.reservations },
        { href: "/operacao", label: "Central", exact: true },
        { href: "/area-funcionario", label: "Portal", exact: true },
      ]
    : [
        { href: "/cardapio", label: "Cardapio", exact: true },
        { href: "/pedidos", label: "Pedidos", exact: true, badgeCount: notificationCounts.orders },
        { href: "/reservas", label: "Reservas", exact: true, badgeCount: notificationCounts.reservations },
        { href: "/eventos", label: "Eventos", exact: true },
        { href: "/contato", label: "Contato", exact: true },
        { href: "/area-cliente", label: "Perfil", exact: true },
      ];

  const dashboardHref = session ? getRouteForRole(session.role) : "/login";

  return (
    <>
      <header className="site-header-fixed">
        <div className="site-header-shell shell">
          <div className="site-header-card nav-pill rounded-[2.2rem] px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <Link href="/" className="flex w-full min-w-0 items-center gap-4 sm:w-auto">
                <div className="relative flex h-13 w-13 items-center justify-center rounded-full border border-[rgba(217,185,122,0.18)] bg-[linear-gradient(135deg,var(--forest),#223a31)] text-[var(--cream)] shadow-[0_18px_34px_rgba(20,35,29,0.22)]">
                  <span className="display-title text-2xl font-semibold">P</span>
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border border-[rgba(255,255,255,0.72)] bg-[var(--gold-soft)]" />
                </div>
                <div className="min-w-0">
                  <div className="hidden items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--sage)] sm:flex">
                    <span>Restaurante</span>
                    <Dot size={14} />
                    <span>{staffSession ? "acesso interno" : "reservas e atendimento"}</span>
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
                      {item.badgeCount ? (
                        <span className="nav-link-badge" aria-label={`${item.badgeCount} notificacoes`}>
                          {formatBadgeCount(item.badgeCount)}
                        </span>
                      ) : null}
                    </span>
                  </ActiveLink>
                ))}
              </nav>

              <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap">
                {session ? (
                  <>
                    {session.role === "customer" ? (
                      <>
                        <CartHeaderLink compact className="md:hidden" />
                        <CartHeaderLink className="hidden md:inline-flex" />
                      </>
                    ) : null}
                    {staffSession ? (
                      <Link
                        href={dashboardHref}
                        className="floating-badge hidden items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-[var(--forest)] md:inline-flex"
                      >
                        <Shield size={16} />
                        {getStaffRoleLabel(session.role)}
                      </Link>
                    ) : null}
                    <form action={logoutAction}>
                      <button type="submit" className="button-primary px-3 py-2 sm:px-4 sm:py-2.5">
                        <LogOut size={16} />
                        Sair
                      </button>
                    </form>
                  </>
                ) : (
                  <>
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

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {navItems.map((item) => (
                <ActiveLink
                  key={item.href}
                  href={item.href}
                  exact={item.exact}
                  className="mobile-nav-link"
                  activeClassName="mobile-nav-link-active"
                >
                  <span className="mobile-nav-link-content">
                    <span>{item.label}</span>
                    {item.badgeCount ? (
                      <span className="mobile-nav-link-badge" aria-label={`${item.badgeCount} notificacoes`}>
                        {formatBadgeCount(item.badgeCount)}
                      </span>
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

      <div aria-hidden className="site-header-offset" />
    </>
  );
}
