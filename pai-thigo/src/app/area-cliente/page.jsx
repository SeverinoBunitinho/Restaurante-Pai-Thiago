import Link from "next/link";
import {
  CalendarHeart,
  ChefHat,
  HeartHandshake,
  Mail,
  ReceiptText,
  ShoppingBag,
  Sparkles,
  Star,
} from "lucide-react";

import { updateCustomerVipPreferenceAction } from "@/app/area-cliente/actions";
import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { requireRole } from "@/lib/auth";
import { getCustomerDashboard } from "@/lib/site-data";
import { formatCurrency } from "@/lib/utils";

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getLoyaltyTier(points) {
  if (points >= 120) {
    return {
      label: "Cliente assinatura",
      description: "Conta reconhecida pela recorrencia e historico consistente de visitas.",
    };
  }

  if (points >= 40) {
    return {
      label: "Cliente recorrente",
      description: "Preferencias consolidadas para agilizar reservas e atendimento.",
    };
  }

  return {
    label: "Conta ativa",
    description: "Base pronta para organizar reservas, pedidos e relacionamento com a casa.",
  };
}

export default async function AreaClientePage({ searchParams }) {
  const session = await requireRole("customer");
  const resolvedSearchParams = await searchParams;
  const vipNotice = Array.isArray(resolvedSearchParams?.vipNotice)
    ? resolvedSearchParams.vipNotice[0]
    : resolvedSearchParams?.vipNotice;
  const vipError = Array.isArray(resolvedSearchParams?.vipError)
    ? resolvedSearchParams.vipError[0]
    : resolvedSearchParams?.vipError;
  const dashboard = await getCustomerDashboard(session.user.id);
  const profileName = dashboard.profile.fullName || "Cliente";
  const firstName = profileName.split(" ")[0];
  const initials = getInitials(profileName) || "PT";
  const orderGroups = dashboard.orderGroups ?? [];
  const reservations = dashboard.reservations ?? [];
  const fallbackTier = getLoyaltyTier(dashboard.profile.loyaltyPoints ?? 0);
  const vip = dashboard.vip ?? {
    level: fallbackTier.label,
    description: fallbackTier.description,
    benefits: [],
    nextGoal: "Continue evoluindo sua relacao com a casa.",
    lifetime: {
      orders: 0,
      reservations: 0,
      spent: 0,
      avgTicket: 0,
    },
    favoriteItem: "",
  };
  const activeOrders = orderGroups.filter(
    (order) => !["delivered", "cancelled"].includes(order.status),
  ).length;
  const activeReservations = reservations.filter(
    (reservation) =>
      reservation.status !== "cancelled" && reservation.status !== "completed",
  ).length;

  const summaryHighlights = [
    {
      label: "Status da conta",
      value: vip.level,
      description: vip.description,
    },
    {
      label: "Reservas em andamento",
      value: `${activeReservations}`,
      description:
        activeReservations > 0
          ? "Sua agenda ativa esta sendo acompanhada pela equipe."
          : "Sem reservas ativas no momento.",
    },
    {
      label: "Pedidos em andamento",
      value: `${activeOrders}`,
      description:
        activeOrders > 0
          ? "Pedidos em preparo, rota ou retirada na fila da operacao."
          : "Sem pedidos pendentes no momento.",
    },
  ];

  const relationshipCards = [
    {
      icon: Mail,
      eyebrow: "Contato principal",
      title: dashboard.profile.email || "E-mail nao informado",
      description:
        dashboard.profile.phone || "Telefone ainda nao preenchido na conta.",
    },
    {
      icon: Star,
      eyebrow: "Preferencia registrada",
      title: dashboard.profile.preferredRoom,
      description:
        "Este ambiente vira referencia para organizar sua proxima experiencia.",
    },
    {
      icon: Sparkles,
      eyebrow: "Pontos acumulados",
      title: `${dashboard.profile.loyaltyPoints} pontos`,
      description: "Pontuacao usada para reconhecer recorrencia e historico da conta.",
    },
    {
      icon: Star,
      eyebrow: "Prato mais pedido",
      title: vip.favoriteItem || "Ainda sem recorrencia suficiente",
      description: "Conforme seu historico cresce, o sistema identifica preferencias.",
    },
  ];

  const actionCards = [
    {
      icon: CalendarHeart,
      title: "Reservas",
      text: "Gerencie datas, horarios e ambientes em uma pagina dedicada.",
      href: "/reservas",
    },
    {
      icon: ReceiptText,
      title: "Pedidos",
      text: "Acompanhe status, pagamento e itens em uma aba exclusiva.",
      href: "/pedidos",
    },
    {
      icon: ChefHat,
      title: "Cardapio",
      text: "Explore os pratos ativos e envie novos pedidos para o carrinho.",
      href: "/cardapio",
    },
    {
      icon: HeartHandshake,
      title: "Contato",
      text: "Use os canais oficiais para ajustes de atendimento e ocasioes especiais.",
      href: "/contato",
    },
  ];

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="pb-16">
        <section className="shell pt-12">
          <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
            <div className="luxury-card-dark rounded-[2.7rem] p-7 text-[var(--cream)] md:p-10">
              <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-18 w-18 shrink-0 items-center justify-center rounded-[1.9rem] border border-[rgba(217,185,122,0.2)] bg-[rgba(255,255,255,0.06)] text-4xl font-semibold text-white shadow-[0_20px_40px_rgba(7,14,11,0.2)]">
                    <span className="display-title text-[2.2rem] leading-none">{initials}</span>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-[rgba(217,185,122,0.92)]">
                      Perfil
                    </p>
                    <h1 className="display-title page-hero-title mt-3 text-white">
                      {firstName}, acompanhe sua experiencia no Pai Thiago
                    </h1>
                    <p className="mt-5 max-w-3xl text-base leading-8 text-[rgba(255,247,232,0.76)]">
                      Aqui voce acompanha seu perfil, preferencias e historico da
                      conta. Pedidos, reservas, eventos e contato continuam em
                      abas proprias para manter a navegacao simples.
                    </p>
                  </div>
                </div>

                <div className="min-w-0 rounded-[1.7rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.05)] p-4 lg:max-w-[19rem]">
                  <p className="text-xs uppercase tracking-[0.22em] text-[rgba(217,185,122,0.92)]">
                    Nivel VIP
                  </p>
                  <p className="mt-3 text-lg font-semibold text-white">
                    {vip.level}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[rgba(255,247,232,0.72)]">
                    {dashboard.usingSupabase
                      ? vip.nextGoal
                      : dashboard.notice}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/pedidos" className="button-primary">
                  <ReceiptText size={16} />
                  Ver pedidos
                </Link>
                <Link href="/reservas" className="button-secondary">
                  <CalendarHeart size={16} />
                  Ver reservas
                </Link>
                <Link href="/carrinho" className="button-secondary">
                  <ShoppingBag size={16} />
                  Meu carrinho
                </Link>
              </div>

              <div className="feature-stat-grid feature-stat-grid-3 mt-8">
                {summaryHighlights.map((item) => (
                  <article
                    key={item.label}
                    className="feature-stat-card rounded-[1.6rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] p-5"
                  >
                    <p className="feature-stat-label text-xs uppercase tracking-[0.24em] text-[rgba(217,185,122,0.92)]">
                      {item.label}
                    </p>
                    <p className="feature-stat-value mt-3 text-2xl font-semibold text-white">
                      {item.value}
                    </p>
                    <p className="feature-stat-body mt-2 text-sm text-[rgba(255,247,232,0.72)]">
                      {item.description}
                    </p>
                  </article>
                ))}
              </div>

              {vipError ? (
                <div className="mt-6 rounded-[1.2rem] border border-[rgba(138,93,59,0.24)] bg-[rgba(138,93,59,0.12)] px-4 py-3 text-sm leading-6 text-[rgba(255,229,199,0.94)]">
                  {vipError}
                </div>
              ) : null}
              {vipNotice ? (
                <div className="mt-4 rounded-[1.2rem] border border-[rgba(95,123,109,0.3)] bg-[rgba(95,123,109,0.14)] px-4 py-3 text-sm leading-6 text-[rgba(247,255,251,0.92)]">
                  {vipNotice}
                </div>
              ) : null}
            </div>

            <div className="grid gap-5">
              <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                {dashboard.metrics.map((metric) => (
                  <article
                    key={metric.label}
                    className="luxury-card rounded-[1.9rem] p-5"
                  >
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--sage)]">
                      {metric.label}
                    </p>
                    <p className="mt-3 text-[2rem] font-semibold text-[var(--forest)]">
                      {metric.value}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                      {metric.description}
                    </p>
                  </article>
                ))}
              </div>

              <div className="luxury-card rounded-[2.4rem] p-7 md:p-8">
                <SectionHeading
                  eyebrow="Dados de atendimento"
                  title="Dados essenciais para um atendimento personalizado"
                  description="Contato, preferencias e pontuacao ficam concentrados no perfil para facilitar cada proxima visita."
                  compact
                />

                <div className="mt-8 grid gap-4">
                  {relationshipCards.map((card) => (
                    <article
                      key={card.eyebrow}
                      className="rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5 shadow-[0_16px_30px_rgba(39,30,18,0.05)]"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[rgba(182,135,66,0.16)] bg-[rgba(255,255,255,0.76)] text-[var(--gold)]">
                          <card.icon size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs uppercase tracking-[0.22em] text-[var(--sage)]">
                            {card.eyebrow}
                          </p>
                          <p className="mt-2 text-lg font-semibold text-[var(--forest)]">
                            {card.title}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                            {card.description}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="luxury-card rounded-[2.4rem] p-7 md:p-8">
                <SectionHeading
                  eyebrow="Programa VIP"
                  title="Beneficios por recorrencia e historico"
                  description="Seu perfil recebe vantagens de acordo com pontos, consumo e frequencia."
                  compact
                />

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <article className="rounded-[1.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--sage)]">
                      Pedidos no historico
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--forest)]">
                      {vip.lifetime.orders}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                      Base total de pedidos vinculados a sua conta.
                    </p>
                  </article>
                  <article className="rounded-[1.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--sage)]">
                      Valor acumulado
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--forest)]">
                      {formatCurrency(Number(vip.lifetime.spent ?? 0))}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                      Total de contas entregues no relacionamento com a casa.
                    </p>
                  </article>
                  <article className="rounded-[1.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--sage)]">
                      Ticket medio
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--forest)]">
                      {formatCurrency(Number(vip.lifetime.avgTicket ?? 0))}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                      Media por checkout entregue da sua conta.
                    </p>
                  </article>
                  <article className="rounded-[1.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--sage)]">
                      Reservas no historico
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--forest)]">
                      {vip.lifetime.reservations}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                      Numero total de reservas vinculadas ao seu perfil.
                    </p>
                  </article>
                </div>

                <div className="mt-6 rounded-[1.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--sage)]">
                    Beneficios ativos
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(vip.benefits ?? []).length ? (
                      vip.benefits.map((benefit) => (
                        <span
                          key={benefit}
                          className="rounded-full border border-[rgba(20,35,29,0.12)] px-3 py-1 text-xs font-semibold tracking-[0.12em] text-[var(--forest)]"
                        >
                          {benefit}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                        Beneficios aparecem conforme seu nivel evolui.
                      </span>
                    )}
                  </div>
                </div>

                <form action={updateCustomerVipPreferenceAction} className="mt-6 grid gap-4 rounded-[1.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.52)] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--sage)]">
                    Ajustar perfil VIP
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-sm font-semibold text-[var(--forest)]">
                        Ambiente preferido
                      </span>
                      <input
                        name="preferredRoom"
                        defaultValue={dashboard.profile.preferredRoom || "Salao principal"}
                        maxLength={80}
                        className="rounded-[1rem] border border-[rgba(20,35,29,0.12)] bg-white px-3 py-2 text-sm text-[var(--forest)] outline-none"
                      />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-sm font-semibold text-[var(--forest)]">
                        Telefone preferencial
                      </span>
                      <input
                        name="phone"
                        defaultValue={dashboard.profile.phone || ""}
                        maxLength={32}
                        className="rounded-[1rem] border border-[rgba(20,35,29,0.12)] bg-white px-3 py-2 text-sm text-[var(--forest)] outline-none"
                      />
                    </label>
                  </div>
                  <button type="submit" className="button-secondary w-full sm:w-auto">
                    Atualizar preferencias
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        <section className="shell pt-20">
          <div className="luxury-card rounded-[2.4rem] p-6 md:p-8">
            <SectionHeading
              eyebrow="Atalhos uteis"
              title="Cada tarefa no lugar certo"
              description="Abrimos cada fluxo em pagina propria para facilitar a navegacao no celular e no computador."
              compact
            />

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {actionCards.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="staff-feature-link rounded-[1.7rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(182,135,66,0.16)] bg-[rgba(255,255,255,0.72)] text-[var(--gold)]">
                    <item.icon size={18} />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-[var(--forest)]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                    {item.text}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
