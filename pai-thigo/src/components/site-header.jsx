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

export async function SiteHeader() {
  const session = await getCurrentSession();
  const restaurantInfo = await getRestaurantProfile();
  const staffSession = isStaffRole(session?.role);
  const navItems = staffSession
    ? [
        { href: "/painel", label: "Inicio", exact: true },
        { href: "/operacao/comandas", label: "Pedidos" },
        { href: "/operacao/reservas", label: "Reservas" },
        { href: "/operacao", label: "Central", exact: true },
        { href: "/area-funcionario", label: "Minha area", exact: true },
      ]
    : [
        { href: "/", label: "Inicio", exact: true },
        { href: "/cardapio", label: "Cardapio", exact: true },
        { href: "/pedidos", label: "Pedidos", exact: true },
        { href: "/reservas", label: "Reservas", exact: true },
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
                    {item.label}
                  </ActiveLink>
                ))}
              </nav>

              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap sm:justify-end">
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

            <div className="mobile-nav-grid mt-4 lg:hidden">
              {navItems.map((item) => (
                <ActiveLink
                  key={item.href}
                  href={item.href}
                  exact={item.exact}
                  className="mobile-nav-link"
                  activeClassName="mobile-nav-link-active"
                >
                  {item.label}
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
