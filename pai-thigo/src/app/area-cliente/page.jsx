import Link from "next/link";
import {
  CalendarHeart,
  ChefHat,
  ChevronRight,
  Clock3,
  HeartHandshake,
  Mail,
  ShoppingBag,
  Sparkles,
  Star,
} from "lucide-react";

import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { requireRole } from "@/lib/auth";
import { experiences } from "@/lib/mock-data";
import { getCustomerDashboard } from "@/lib/site-data";
import { orderStatusMeta, reservationStatusMeta } from "@/lib/staff-data";
import {
  formatCurrency,
  formatReservationMoment,
  getFulfillmentTypeLabel,
  getPaymentMethodLabel,
} from "@/lib/utils";

function formatOrderMoment(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

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
      description: "Conta reconhecida pela recorrencia e pelo historico de experiencias.",
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
    description: "Base pronta para organizar reservas, pedidos e o relacionamento com a casa.",
  };
}

function getUpcomingReservation(reservations) {
  return (
    reservations.find(
      (reservation) =>
        reservation.status !== "cancelled" && reservation.status !== "completed",
    ) ?? reservations[0] ?? null
  );
}

function getLatestOrder(orderGroups) {
  return orderGroups[0] ?? null;
}

export default async function AreaClientePage() {
  const session = await requireRole("customer");
  const dashboard = await getCustomerDashboard(session.user.id);
  const profileName = dashboard.profile.fullName || "Cliente";
  const firstName = profileName.split(" ")[0];
  const initials = getInitials(profileName) || "PT";
  const orderGroups = dashboard.orderGroups ?? [];
  const loyaltyTier = getLoyaltyTier(dashboard.profile.loyaltyPoints ?? 0);
  const upcomingReservation = getUpcomingReservation(dashboard.reservations);
  const latestOrder = getLatestOrder(orderGroups);
  const latestOrderStatusLabel = latestOrder
    ? orderStatusMeta[latestOrder.status]?.label ?? latestOrder.status
    : "";
  const activeOrders = orderGroups.filter(
    (order) => !["delivered", "cancelled"].includes(order.status),
  ).length;
  const completedVisits = dashboard.reservations.filter(
    (reservation) => reservation.status === "completed",
  ).length;

  const summaryHighlights = [
    {
      label: "Proxima reserva",
      value: upcomingReservation
        ? formatReservationMoment(upcomingReservation.date, upcomingReservation.time)
        : "Sem visita agendada",
      description: upcomingReservation
        ? `${upcomingReservation.guests} pessoa(s) em ${upcomingReservation.area}.`
        : "Escolha uma nova data para deixar a casa preparada.",
    },
    {
      label: "Ultimo pedido",
      value: latestOrder
        ? latestOrder.checkoutReference
        : "Nenhum pedido recente",
      description: latestOrder
        ? `${getFulfillmentTypeLabel(latestOrder.fulfillmentType)} com total de ${formatCurrency(latestOrder.grandTotal)}.`
        : "O cardapio online fica disponivel sempre que quiser pedir.",
    },
    {
      label: "Sala preferida",
      value: dashboard.profile.preferredRoom,
      description: "Essa referencia ajuda a equipe a sugerir o ambiente ideal para a visita.",
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
      eyebrow: "Relacionamento",
      title: `${dashboard.profile.loyaltyPoints} pontos`,
      description: loyaltyTier.description,
    },
    {
      icon: Clock3,
      eyebrow: "Ritmo da conta",
      title: activeOrders
        ? `${activeOrders} pedido(s) em acompanhamento`
        : "Sem pedido pendente",
      description: completedVisits
        ? `${completedVisits} visita(s) ja finalizada(s) na casa.`
        : "Sua proxima experiencia pode ser organizada por aqui.",
    },
  ];

  const actionCards = [
    {
      icon: CalendarHeart,
      title: "Reservar uma mesa",
      text: "Agende a proxima visita com data, horario e area favorita em poucos passos.",
      href: "/reservas",
    },
    {
      icon: ShoppingBag,
      title: "Acompanhar carrinho",
      text: "Revise itens do pedido, forma de pagamento e o fluxo entre delivery e retirada.",
      href: "/carrinho",
    },
    {
      icon: ChefHat,
      title: "Voltar ao cardapio",
      text: "Retome o menu da casa e envie um novo pedido quando quiser.",
      href: "/cardapio",
    },
    {
      icon: HeartHandshake,
      title: "Falar com a casa",
      text: "Use nossos contatos para combinar detalhes especiais antes da experiencia.",
      href: "/contato",
    },
  ];

  const profileSignals = [
    {
      eyebrow: "Ambiente com mais afinidade",
      title: dashboard.profile.preferredRoom,
      description:
        "Essa preferencia vira o ponto de partida para a equipe sugerir onde sua experiencia pode ficar mais confortavel.",
    },
    {
      eyebrow: "Proximo movimento recomendado",
      title: upcomingReservation
        ? "Preparar a proxima visita"
        : latestOrder
          ? "Acompanhar o pedido atual"
          : "Escolher a proxima experiencia",
      description: upcomingReservation
        ? `Sua reserva em ${upcomingReservation.area} ja pode ser acompanhada pela equipe com antecedencia.`
        : latestOrder
          ? `${getFulfillmentTypeLabel(latestOrder.fulfillmentType)} com status ${latestOrderStatusLabel.toLowerCase()}.`
          : "Sua conta esta pronta para reservar, pedir novamente ou explorar novas sugestoes da casa.",
    },
    {
      eyebrow: "Leitura do relacionamento",
      title: completedVisits
        ? `${completedVisits} visita(s) ja concluidas`
        : "Historico em construcao",
      description: activeOrders
        ? `${activeOrders} fluxo(s) seguem em acompanhamento pela operacao neste momento.`
        : "A recorrencia da conta ajuda a casa a receber voce com mais contexto a cada nova visita.",
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
                      Perfil privado
                    </p>
                    <h1 className="display-title page-hero-title mt-3 text-white">
                      {firstName}, sua experiencia no Pai Thiago agora fica ainda
                      mais organizada
                    </h1>
                    <p className="mt-5 max-w-3xl text-base leading-8 text-[rgba(255,247,232,0.76)]">
                      Seu perfil concentra reservas, pedidos, dados da conta e
                      detalhes que ajudam a casa a receber voce com mais cuidado,
                      clareza e continuidade entre uma visita e outra.
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
                      ? "Dados sincronizados com pedidos, reservas e atendimento em tempo real."
                      : dashboard.notice}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/reservas" className="button-primary">
                  <CalendarHeart size={16} />
                  Reservar mesa
                </Link>
                <Link href="/cardapio" className="button-secondary">
                  <ChefHat size={16} />
                  Ver cardapio
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
                  eyebrow="Conta e relacionamento"
                  title="Um perfil pensado para deixar a visita mais fluida"
                  description="Os dados abaixo ajudam o atendimento a reconhecer preferencia, contato e historico sem perder a elegancia da experiencia."
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
          <div className="grid gap-5 xl:grid-cols-[1fr_1.02fr]">
            <div className="luxury-card rounded-[2.4rem] p-6 md:p-8">
              <SectionHeading
                eyebrow="Reservas"
                title="Sua agenda com a casa"
                description="Acompanhe proximas visitas, o status de cada reserva e a leitura da equipe sobre o ambiente selecionado."
                compact
              />

              <div className="mt-8 space-y-4">
                {dashboard.reservations.length ? (
                  dashboard.reservations.map((reservation, index) => {
                    const statusView =
                      reservationStatusMeta[reservation.status] ?? {
                        label: reservation.status,
                        badge: "bg-[rgba(20,35,29,0.08)] text-[var(--forest)]",
                      };

                    return (
                      <article
                        key={reservation.id}
                        className="rounded-[1.7rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(182,135,66,0.14)] bg-[rgba(255,255,255,0.64)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--gold)]">
                              <CalendarHeart size={14} />
                              {index === 0 ? "Proxima experiencia" : "Historico da conta"}
                            </div>
                            <h2 className="mt-4 text-xl font-semibold text-[var(--forest)]">
                              {reservation.occasion}
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                              {formatReservationMoment(reservation.date, reservation.time)}{" "}
                              para {reservation.guests} pessoa(s).
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${statusView.badge}`}
                          >
                            {statusView.label}
                          </span>
                        </div>

                        <div className="mt-5 grid gap-3 md:grid-cols-2">
                          <div className="rounded-[1.35rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.5)] px-4 py-3">
                            <p className="text-xs uppercase tracking-[0.2em] text-[var(--sage)]">
                              Ambiente
                            </p>
                            <p className="mt-2 text-sm font-semibold text-[var(--forest)]">
                              {reservation.area}
                            </p>
                          </div>
                          <div className="rounded-[1.35rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.5)] px-4 py-3">
                            <p className="text-xs uppercase tracking-[0.2em] text-[var(--sage)]">
                              Observacao
                            </p>
                            <p className="mt-2 text-sm font-semibold text-[var(--forest)]">
                              {reservation.notes || "Sem observacao adicional nesta reserva."}
                            </p>
                          </div>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <article className="rounded-[1.7rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.5)] p-6">
                    <p className="text-lg font-semibold text-[var(--forest)]">
                      Sua agenda ainda nao tem reservas
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.7)]">
                      Quando voce agendar a primeira visita, ela aparece aqui com
                      data, horario, ambiente escolhido e status atualizado pela
                      equipe.
                    </p>
                    <Link
                      href="/reservas"
                      className="mt-5 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--forest)]"
                    >
                      Criar reserva
                      <ChevronRight size={16} />
                    </Link>
                  </article>
                )}
              </div>
            </div>

            <div className="luxury-card rounded-[2.4rem] p-6 md:p-8">
              <SectionHeading
                eyebrow="Pedidos"
                title="Tudo o que entrou pela sua conta"
                description="Cada pedido fica agrupado com status, forma de pagamento, itens e leitura de entrega ou retirada."
                compact
              />

              <div className="mt-8 space-y-4">
                {orderGroups.length ? (
                  orderGroups.map((orderGroup, index) => {
                    const statusView = orderStatusMeta[orderGroup.status] ?? {
                      label: orderGroup.status,
                      badge: "bg-[rgba(20,35,29,0.08)] text-[var(--forest)]",
                    };

                    return (
                      <article
                        key={orderGroup.id}
                        className="rounded-[1.7rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(182,135,66,0.14)] bg-[rgba(255,255,255,0.64)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--gold)]">
                              <ShoppingBag size={14} />
                              {index === 0 ? "Pedido mais recente" : "Historico de pedidos"}
                            </div>
                            <h2 className="mt-4 text-xl font-semibold text-[var(--forest)]">
                              {orderGroup.checkoutReference}
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                              {orderGroup.totalItems} item(ns) com total de{" "}
                              {formatCurrency(orderGroup.grandTotal)}.
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${statusView.badge}`}
                          >
                            {statusView.label}
                          </span>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-[1.35rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.5)] px-4 py-3">
                            <p className="text-xs uppercase tracking-[0.2em] text-[var(--sage)]">
                              Fluxo
                            </p>
                            <p className="mt-2 text-sm font-semibold text-[var(--forest)]">
                              {getFulfillmentTypeLabel(orderGroup.fulfillmentType)}
                            </p>
                            <p className="mt-1 text-sm text-[rgba(21,35,29,0.7)]">
                              {getPaymentMethodLabel(orderGroup.paymentMethod)}
                            </p>
                          </div>
                          <div className="rounded-[1.35rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.5)] px-4 py-3">
                            <p className="text-xs uppercase tracking-[0.2em] text-[var(--sage)]">
                              Entrada no sistema
                            </p>
                            <p className="mt-2 text-sm font-semibold text-[var(--forest)]">
                              {formatOrderMoment(orderGroup.createdAt)}
                            </p>
                            {orderGroup.fulfillmentType === "delivery" ? (
                              <p className="mt-1 text-sm text-[rgba(21,35,29,0.7)]">
                                Previsao de {orderGroup.deliveryEtaMinutes} min
                              </p>
                            ) : (
                              <p className="mt-1 text-sm text-[rgba(21,35,29,0.7)]">
                                Retirada alinhada com a equipe
                              </p>
                            )}
                          </div>
                        </div>

                        {orderGroup.fulfillmentType === "delivery" ? (
                          <div className="mt-4 rounded-[1.35rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.5)] px-4 py-3">
                            <p className="text-xs uppercase tracking-[0.2em] text-[var(--sage)]">
                              Entrega
                            </p>
                            <p className="mt-2 text-sm font-semibold text-[var(--forest)]">
                              {orderGroup.deliveryAddress} - {orderGroup.deliveryNeighborhood}
                            </p>
                            {orderGroup.deliveryReference ? (
                              <p className="mt-1 text-sm text-[rgba(21,35,29,0.7)]">
                                Referencia: {orderGroup.deliveryReference}
                              </p>
                            ) : null}
                            <p className="mt-1 text-sm text-[rgba(21,35,29,0.7)]">
                              Taxa de entrega: {formatCurrency(orderGroup.deliveryFee)}
                            </p>
                          </div>
                        ) : null}

                        <div className="mt-4 space-y-2 rounded-[1.35rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.52)] px-4 py-4">
                          {orderGroup.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-start justify-between gap-4"
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-[var(--forest)]">
                                  {item.itemName}
                                </p>
                                <p className="text-sm text-[rgba(21,35,29,0.7)]">
                                  {item.quantity} item(ns)
                                </p>
                                {item.notes ? (
                                  <p className="mt-1 text-sm text-[rgba(21,35,29,0.7)]">
                                    Observacao: {item.notes}
                                  </p>
                                ) : null}
                              </div>
                              <p className="shrink-0 text-sm font-semibold text-[var(--forest)]">
                                {formatCurrency(item.totalPrice)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <article className="rounded-[1.7rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.5)] p-6">
                    <p className="text-lg font-semibold text-[var(--forest)]">
                      Nenhum pedido foi enviado ainda
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.7)]">
                      Assim que voce fizer um pedido pelo cardapio, ele aparece
                      aqui com itens, pagamento, forma de atendimento e status
                      informado pela equipe.
                    </p>
                    <Link
                      href="/cardapio"
                      className="mt-5 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--forest)]"
                    >
                      Fazer pedido
                      <ChevronRight size={16} />
                    </Link>
                  </article>
                )}
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
                Um perfil mais inteligente, sem repetir informacao e com foco no que importa
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[rgba(255,247,232,0.76)]">
                Aqui a conta deixa de repetir cadastro e passa a mostrar sinais
                uteis da sua jornada com a casa: ambiente preferido, proximo passo
                recomendado e o ritmo atual do relacionamento.
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

              <div className="mt-5 rounded-[1.6rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-[rgba(217,185,122,0.92)]">
                  Curadoria da semana
                </p>
                <p className="mt-3 text-lg font-semibold text-white">
                  {experiences[1]?.title ?? "Jantar degustacao"}
                </p>
                <p className="mt-2 text-sm leading-6 text-[rgba(255,247,232,0.72)]">
                  Uma sugestao pensada para continuar a experiencia com o ritmo e
                  a identidade da casa, sem repetir os mesmos dados do perfil.
                </p>
              </div>
            </div>

            <div className="luxury-card rounded-[2.4rem] p-6 md:p-8">
              <SectionHeading
                eyebrow="Atalhos elegantes"
                title="Os caminhos mais uteis da sua conta"
                description="Acessos pensados para o cliente circular pelo sistema sem esforço, tanto no celular quanto no desktop."
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
                    <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--forest)]">
                      Abrir caminho
                      <ChevronRight size={16} />
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-5 rounded-[1.8rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.5)] p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(182,135,66,0.16)] bg-[rgba(255,255,255,0.74)] text-[var(--gold)]">
                    <Sparkles size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--sage)]">
                      Acabamento da conta
                    </p>
                    <p className="mt-1 text-lg font-semibold text-[var(--forest)]">
                      Seu perfil foi desenhado para reunir tudo em um lugar so
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-[rgba(21,35,29,0.72)]">
                  Reserve, acompanhe pedidos, consulte o relacionamento com a casa
                  e volte ao cardapio sem se perder no sistema. Essa area foi
                  reorganizada para ficar mais clara, premium e util no dia a dia.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
