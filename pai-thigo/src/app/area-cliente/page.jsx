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

import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { requireRole } from "@/lib/auth";
import { getCustomerDashboard } from "@/lib/site-data";
import { getFulfillmentTypeLabel } from "@/lib/utils";

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

export default async function AreaClientePage() {
  const session = await requireRole("customer");
  const dashboard = await getCustomerDashboard(session.user.id);
  const profileName = dashboard.profile.fullName || "Cliente";
  const firstName = profileName.split(" ")[0];
  const initials = getInitials(profileName) || "PT";
  const orderGroups = dashboard.orderGroups ?? [];
  const reservations = dashboard.reservations ?? [];
  const loyaltyTier = getLoyaltyTier(dashboard.profile.loyaltyPoints ?? 0);
  const activeOrders = orderGroups.filter(
    (order) => !["delivered", "cancelled"].includes(order.status),
  ).length;
  const activeReservations = reservations.filter(
    (reservation) =>
      reservation.status !== "cancelled" && reservation.status !== "completed",
  ).length;
  const completedVisits = reservations.filter(
    (reservation) => reservation.status === "completed",
  ).length;
  const latestOrder = orderGroups[0] ?? null;

  const summaryHighlights = [
    {
      label: "Status da conta",
      value: loyaltyTier.label,
      description: loyaltyTier.description,
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
  ];

  const profileSignals = [
    {
      eyebrow: "Jornada recente",
      title: completedVisits
        ? `${completedVisits} visita(s) concluidas`
        : "Historico em construcao",
      description:
        "O perfil registra seu ritmo de visitas para a casa receber voce com mais contexto.",
    },
    {
      eyebrow: "Canal em destaque",
      title: latestOrder
        ? getFulfillmentTypeLabel(latestOrder.fulfillmentType)
        : "Reserva presencial",
      description: latestOrder
        ? "Seu pedido mais recente define o canal atual de atendimento."
        : "Sem pedido recente, a jornada fica centrada nas reservas da casa.",
    },
    {
      eyebrow: "Proxima recomendacao",
      title:
        activeReservations > 0
          ? "Acompanhar a reserva"
          : activeOrders > 0
            ? "Acompanhar os pedidos"
            : "Escolher a proxima experiencia",
      description:
        activeReservations > 0
          ? "Abra Reservas para conferir horario, ambiente e status da agenda."
          : activeOrders > 0
            ? "Abra Pedidos para acompanhar status, itens e forma de atendimento."
            : "Use Cardapio, Reservas ou Eventos para iniciar uma nova jornada.",
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
                      {firstName}, sua conta agora fica organizada por pagina
                    </h1>
                    <p className="mt-5 max-w-3xl text-base leading-8 text-[rgba(255,247,232,0.76)]">
                      Aqui voce acompanha apenas os sinais da sua conta. Pedidos,
                      reservas, eventos e contato seguem em abas proprias para
                      manter a navegacao clara.
                    </p>
                  </div>
                </div>

                <div className="min-w-0 rounded-[1.7rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.05)] p-4 lg:max-w-[19rem]">
                  <p className="text-xs uppercase tracking-[0.22em] text-[rgba(217,185,122,0.92)]">
                    Status da conta
                  </p>
                  <p className="mt-3 text-lg font-semibold text-white">
                    {loyaltyTier.label}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[rgba(255,247,232,0.72)]">
                    {dashboard.usingSupabase
                      ? "Dados sincronizados com o sistema em tempo real."
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
                  title="Informacoes base para receber voce com mais contexto"
                  description="Contato, preferencia e pontuacao ficam concentrados no perfil, sem misturar fluxos de outras paginas."
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
            </div>
          </div>
        </section>

        <section className="shell pt-20">
          <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
            <div className="luxury-card-dark rounded-[2.4rem] p-7 text-[var(--cream)] md:p-8">
              <p className="text-xs uppercase tracking-[0.28em] text-[rgba(217,185,122,0.92)]">
                Leitura da conta
              </p>
              <h2 className="display-title page-section-title mt-4 text-white">
                Sinais da sua jornada sem misturar os outros fluxos
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[rgba(255,247,232,0.76)]">
                Pedidos e reservas ficam em paginas proprias. O perfil mostra
                apenas leitura da conta para manter a experiencia mais limpa.
              </p>

              <div className="mt-8 grid gap-4">
                {profileSignals.map((item) => (
                  <article
                    key={item.eyebrow}
                    className="rounded-[1.6rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] p-5"
                  >
                    <p className="text-xs uppercase tracking-[0.22em] text-[rgba(217,185,122,0.92)]">
                      {item.eyebrow}
                    </p>
                    <p className="mt-3 text-lg font-semibold text-white">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-[rgba(255,247,232,0.72)]">
                      {item.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <div className="luxury-card rounded-[2.4rem] p-6 md:p-8">
              <SectionHeading
                eyebrow="Atalhos uteis"
                title="Cada tarefa no lugar certo"
                description="Use os caminhos abaixo para entrar na pagina correta sem repetir conteudo."
                compact
              />

              <div className="mt-8 grid gap-4 md:grid-cols-2">
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
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
