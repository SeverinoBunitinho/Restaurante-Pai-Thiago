import Link from "next/link";
import { ArrowRight, Radar, ShieldCheck, Sparkles } from "lucide-react";

import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getStaffRoleLabel, requireRole } from "@/lib/auth";
import {
  getExecutiveBoard,
  getMenuManagementBoard,
  getOrdersBoard,
  getReservationsBoard,
  getStaffDirectoryBoard,
  getTablesBoard,
  orderStatusMeta,
  reservationStatusMeta,
} from "@/lib/staff-data";
import { formatCurrency, formatReservationMoment } from "@/lib/utils";

function getStatusView(status) {
  return (
    reservationStatusMeta[status] ?? {
      label: status,
      badge: "bg-[rgba(20,35,29,0.08)] text-[var(--forest)]",
    }
  );
}

function getOrderStatusView(status) {
  return (
    orderStatusMeta[status] ?? {
      label: "Pedido",
      badge: "bg-[rgba(20,35,29,0.08)] text-[var(--forest)]",
    }
  );
}

function formatOrderMoment(value) {
  const parsedDate = new Date(value ?? "");

  if (Number.isNaN(parsedDate.getTime())) {
    return "Atualizado agora";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsedDate);
}

function toMetricValue(value) {
  const parsedValue = Number.parseInt(String(value ?? "0"), 10);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

export default async function PainelPage() {
  const session = await requireRole(["waiter", "manager", "owner"]);

  const [reservationsBoard, tablesBoard, ordersBoard, staffBoard, menuBoard, executiveBoard] =
    await Promise.all([
      getReservationsBoard(),
      getTablesBoard(),
      getOrdersBoard(),
      session.role === "waiter"
        ? Promise.resolve({ staff: [] })
        : getStaffDirectoryBoard(),
      session.role === "waiter"
        ? Promise.resolve({ summary: [], categories: [], stockAlerts: [] })
        : getMenuManagementBoard(),
      session.role === "owner"
        ? getExecutiveBoard()
        : Promise.resolve({ metrics: [], insights: [] }),
    ]);

  const groupedOrders = ordersBoard.groupedOrders ?? [];
  const openOrders = groupedOrders.filter(
    (order) => !["delivered", "cancelled"].includes(order.status),
  );
  const occupiedTables = tablesBoard.tables.filter(
    (table) => table.state === "ocupada",
  ).length;
  const reservedTables = tablesBoard.tables.filter(
    (table) => table.state === "reservada",
  ).length;
  const freeTables = tablesBoard.tables.filter((table) => table.state === "livre").length;
  const activeTeam = staffBoard.staff?.filter((member) => member.active).length ?? 0;
  const activeMenuItems =
    menuBoard.categories?.flatMap((category) => category.items).filter((item) => item.available)
      .length ?? 0;
  const pendingReservations = toMetricValue(
    reservationsBoard.summary.find((item) => item.label === "Pendentes")?.value,
  );
  const confirmedReservations = toMetricValue(
    reservationsBoard.summary.find((item) => item.label === "Confirmadas")?.value,
  );
  const preparingOrders = groupedOrders.filter((order) => order.status === "preparing").length;
  const readyOrders = groupedOrders.filter((order) => order.status === "ready").length;
  const dispatchingOrders = groupedOrders.filter((order) => order.status === "dispatching").length;
  const waitlistWithoutTable = reservationsBoard.waitlistSummary?.total ?? 0;
  const stockAlerts = menuBoard.stockAlerts?.length ?? 0;
  const inFlowRevenue = openOrders.reduce(
    (total, order) => total + Number(order.totalPrice ?? 0),
    0,
  );
  const upcomingReservations = reservationsBoard.reservations
    .filter((reservation) => ["pending", "confirmed", "seated"].includes(reservation.status))
    .slice(0, 4);

  const dashboardCards = [
    {
      label: "Pedidos em fluxo",
      value: String(openOrders.length),
      description: `${preparingOrders} em preparo e ${readyOrders} prontos para sair.`,
    },
    {
      label: "Reservas pendentes",
      value: String(pendingReservations),
      description: `${confirmedReservations} confirmadas e ${waitlistWithoutTable} sem mesa.`,
    },
    {
      label: "Mesas livres",
      value: String(freeTables),
      description: `${occupiedTables} ocupadas e ${reservedTables} reservadas agora.`,
    },
    {
      label: "Delivery em rota",
      value: String(dispatchingOrders),
      description: "Pedidos de entrega em deslocamento neste momento.",
    },
    {
      label: "Faturamento em fluxo",
      value: formatCurrency(inFlowRevenue),
      description: "Total parcial dos pedidos ainda em andamento.",
    },
    ...(session.role !== "waiter"
      ? [
          {
            label: "Estoque critico",
            value: String(stockAlerts),
            description: "Itens que precisam de reposicao ou revisao imediata.",
          },
          {
            label: "Equipe ativa",
            value: String(activeTeam),
            description: "Profissionais liberados para operar a casa.",
          },
          {
            label: "Itens ativos",
            value: String(activeMenuItems),
            description: "Catalogo atualmente disponivel para o cliente.",
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="pb-16">
        <section className="shell pt-12">
          <div className="grid gap-5 lg:grid-cols-[1fr_0.95fr]">
            <div className="luxury-card-dark rounded-[2.4rem] p-7 text-[var(--cream)] md:p-10">
              <p className="text-xs uppercase tracking-[0.28em] text-[rgba(217,185,122,0.92)]">
                Painel do turno
              </p>
              <h1 className="display-title page-hero-title mt-4 text-white">
                Panorama operacional do {getStaffRoleLabel(session.role).toLowerCase()}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-[rgba(255,247,232,0.74)]">
                Esta pagina concentra prioridades do turno, leitura do salao,
                equipe e modulos mais sensiveis da operacao em uma visao rapida e objetiva.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <span className="staff-status-chip inline-flex items-center gap-2 rounded-full border border-[rgba(217,185,122,0.2)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[rgba(255,247,232,0.82)]">
                  <Radar size={14} />
                  turno sob controle
                </span>
                <span className="staff-status-chip inline-flex items-center gap-2 rounded-full border border-[rgba(217,185,122,0.2)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[rgba(255,247,232,0.82)]">
                  <ShieldCheck size={14} />
                  leitura por cargo
                </span>
              </div>
            </div>

            <div className="luxury-card rounded-[2.4rem] p-7 md:p-10">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--gold)]">
                Prioridade imediata
              </p>
              <h2 className="mt-4 text-3xl font-semibold text-[var(--forest)]">
                O que merece atencao agora
              </h2>
              <div className="mt-6 space-y-4">
                {reservationsBoard.reservations.length ? (
                  reservationsBoard.reservations.slice(0, 3).map((reservation) => {
                    const statusView = getStatusView(reservation.status);

                    return (
                      <article
                        key={reservation.id}
                        className="staff-surface-card rounded-[1.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.62)] px-4 py-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-[var(--forest)]">
                              {reservation.guestName}
                            </p>
                            <p className="mt-1 text-sm text-[rgba(21,35,29,0.68)]">
                              {formatReservationMoment(
                                reservation.date,
                                reservation.time,
                              )}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] ${statusView.badge}`}
                          >
                            {statusView.label}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-[rgba(21,35,29,0.68)]">
                          {reservation.occasion} - {reservation.area}
                        </p>
                      </article>
                    );
                  })
                ) : (
                  <article className="rounded-[1.4rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.56)] px-4 py-5">
                    <p className="text-sm font-semibold text-[var(--forest)]">
                      Nenhuma prioridade operacional disponivel agora
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.68)]">
                      Assim que reservas e atendimentos voltarem a ser lidos, a
                      triagem do turno reaparece neste painel.
                    </p>
                  </article>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="shell pt-20">
          <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="luxury-card rounded-[2.2rem] p-6">
              <SectionHeading
                eyebrow="Dashboard em tempo real"
                title="Visao geral do que esta acontecendo agora"
                description="Leitura consolidada de pedidos, reservas, mesas e operacao para decidir rapido sem trocar de pagina."
                compact
              />

              <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {dashboardCards.map((card) => (
                  <article
                    key={card.label}
                    className="staff-surface-card rounded-[1.5rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.62)] px-4 py-4"
                  >
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--sage)]">
                      {card.label}
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-[var(--forest)]">
                      {card.value}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.68)]">
                      {card.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <div className="luxury-card rounded-[2.2rem] p-6">
              <SectionHeading
                eyebrow="Movimento recente"
                title="Entradas mais novas do sistema"
                description="Pedidos ativos e reservas proximas para agir no momento certo."
                compact
              />

              <div className="mt-8">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--gold)]">
                  Pedidos do momento
                </p>
                <div className="mt-3 space-y-3">
                  {openOrders.length ? (
                    openOrders.slice(0, 4).map((order) => {
                      const statusView = getOrderStatusView(order.status);

                      return (
                        <article
                          key={order.id}
                          className="rounded-[1.3rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.62)] p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <p className="max-w-[16rem] break-words text-sm font-semibold text-[var(--forest)]">
                              {order.checkoutReference}
                            </p>
                            <span
                              className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${statusView.badge}`}
                            >
                              {statusView.label}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-[rgba(21,35,29,0.72)]">
                            {order.guestName || "Cliente"} - {order.totalItems} item(ns)
                          </p>
                          <p className="mt-1 text-xs text-[rgba(21,35,29,0.62)]">
                            {formatOrderMoment(order.createdAt)}
                          </p>
                        </article>
                      );
                    })
                  ) : (
                    <article className="rounded-[1.3rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.56)] p-4 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                      Nenhum pedido ativo no momento.
                    </article>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--gold)]">
                  Proximas reservas
                </p>
                <div className="mt-3 space-y-3">
                  {upcomingReservations.length ? (
                    upcomingReservations.map((reservation) => {
                      const statusView = getStatusView(reservation.status);

                      return (
                        <article
                          key={reservation.id}
                          className="rounded-[1.3rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.62)] p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <p className="max-w-[16rem] break-words text-sm font-semibold text-[var(--forest)]">
                              {reservation.guestName}
                            </p>
                            <span
                              className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${statusView.badge}`}
                            >
                              {statusView.label}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-[rgba(21,35,29,0.72)]">
                            {formatReservationMoment(reservation.date, reservation.time)} -{" "}
                            {reservation.guests} pessoa(s)
                          </p>
                        </article>
                      );
                    })
                  ) : (
                    <article className="rounded-[1.3rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.56)] p-4 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                      Nenhuma reserva ativa para acompanhar agora.
                    </article>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="shell pt-14">
          <div className="luxury-card rounded-[2.2rem] p-6">
            <SectionHeading
              eyebrow="Leitura do salao"
              title="Mesas em destaque no turno"
              description="Resumo curto das mesas para acomodacao e ritmo de atendimento."
              compact
            />

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {tablesBoard.tables.length ? (
                tablesBoard.tables.slice(0, 4).map((table) => (
                  <article
                    key={table.id}
                    className="staff-surface-card rounded-[1.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-[var(--forest)]">
                          {table.name}
                        </h3>
                        <p className="mt-1 text-sm text-[rgba(21,35,29,0.72)]">
                          {table.area}
                        </p>
                      </div>
                      <span className="rounded-full bg-[rgba(20,35,29,0.08)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--forest)]">
                        {table.state}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                      {table.detail}
                    </p>
                  </article>
                ))
              ) : (
                <article className="rounded-[1.4rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.56)] p-4 text-sm leading-6 text-[rgba(21,35,29,0.72)] md:col-span-2 xl:col-span-4">
                  Sem leitura de mesas no momento.
                </article>
              )}
            </div>
          </div>
        </section>

        {session.role !== "waiter" ? (
          <section className="shell pt-14">
            <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
              <div className="luxury-card rounded-[2.2rem] p-6">
                <SectionHeading
                  eyebrow="Equipe"
                  title="Status da equipe interna"
                  description="Visao curta para saber quem esta ativo sem sair do painel do turno."
                  compact
                />
                <div className="mt-8 space-y-4">
                  {staffBoard.staff?.length ? (
                    staffBoard.staff.slice(0, 4).map((member) => (
                      <article
                        key={member.id}
                        className="staff-surface-card rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-semibold text-[var(--forest)]">
                              {member.full_name}
                            </h3>
                            <p className="mt-1 text-sm text-[rgba(21,35,29,0.72)]">
                              {member.email}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
                              member.active
                                ? "bg-[rgba(95,123,109,0.12)] text-[var(--sage)]"
                                : "bg-[rgba(138,93,59,0.12)] text-[var(--clay)]"
                            }`}
                          >
                            {member.active ? "ativo" : "pausado"}
                          </span>
                        </div>
                      </article>
                    ))
                  ) : (
                    <article className="rounded-[1.6rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.56)] p-5">
                      <p className="text-lg font-semibold text-[var(--forest)]">
                        Sem leitura da equipe interna agora
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                        Os acessos voltam a aparecer quando a camada interna da
                        equipe for sincronizada novamente.
                      </p>
                    </article>
                  )}
                </div>
              </div>

              <div className="luxury-card rounded-[2.2rem] p-6">
                <SectionHeading
                  eyebrow="Cardapio"
                  title="Leitura de disponibilidade da cozinha"
                  description="Resumo do menu para apoiar decisoes rapidas durante o turno."
                  compact
                />
                <div className="mt-8 space-y-4">
                  {menuBoard.categories?.length ? (
                    menuBoard.categories.slice(0, 3).map((category) => (
                      <article
                        key={category.id}
                        className="staff-surface-card rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-semibold text-[var(--forest)]">
                              {category.name}
                            </h3>
                            <p className="mt-1 text-sm text-[rgba(21,35,29,0.72)]">
                              {category.description}
                            </p>
                          </div>
                          <span className="rounded-full bg-[rgba(182,135,66,0.12)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--gold)]">
                            {category.items.filter((item) => item.available).length} ativos
                          </span>
                        </div>
                      </article>
                    ))
                  ) : (
                    <article className="rounded-[1.6rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.56)] p-5">
                      <p className="text-lg font-semibold text-[var(--forest)]">
                        Sem leitura do cardapio neste instante
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                        O resumo de disponibilidade volta a aparecer assim que a
                        base do menu for sincronizada novamente.
                      </p>
                    </article>
                  )}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {session.role === "owner" ? (
          <section className="shell pt-14">
            <div className="staff-cta-panel luxury-card-dark rounded-[2.2rem] p-6 text-[var(--cream)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-[rgba(217,185,122,0.92)]">
                    Visao do dono
                  </p>
                  <h2 className="display-title page-section-title mt-4 text-white">
                    Sinais estrategicos da casa em um unico lugar
                  </h2>
                </div>
                <Sparkles className="text-[var(--gold-soft)]" size={22} />
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {executiveBoard.metrics.length ? (
                  executiveBoard.metrics.slice(0, 3).map((metric) => (
                    <div
                      key={metric.label}
                      className="rounded-[1.6rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] px-4 py-4"
                    >
                      <p className="text-xs uppercase tracking-[0.22em] text-[rgba(217,185,122,0.9)]">
                        {metric.label}
                      </p>
                      <p className="mt-3 text-2xl font-semibold text-white">
                        {metric.value}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[rgba(255,247,232,0.72)]">
                        {metric.description}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.6rem] border border-dashed border-[rgba(217,185,122,0.18)] bg-[rgba(255,255,255,0.04)] px-4 py-5 text-sm leading-6 text-[rgba(255,247,232,0.72)] md:col-span-3">
                    A leitura executiva sera exibida aqui assim que o painel do
                    dono recuperar a sincronizacao com o banco.
                  </div>
                )}
              </div>

              <div className="mt-8 space-y-3">
                {executiveBoard.insights.length ? (
                  executiveBoard.insights.map((insight) => (
                    <div
                      key={insight}
                      className="rounded-[1.4rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm leading-6 text-[rgba(255,247,232,0.8)]"
                    >
                      {insight}
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.4rem] border border-dashed border-[rgba(217,185,122,0.18)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm leading-6 text-[rgba(255,247,232,0.8)]">
                    Sem sinais estrategicos disponiveis neste instante.
                  </div>
                )}
              </div>

              <Link
                href="/operacao/executivo"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--gold)] px-6 py-4 text-sm font-semibold text-[var(--forest)] transition hover:-translate-y-0.5"
              >
                Abrir visao executiva completa
                <ArrowRight size={16} />
              </Link>
            </div>
          </section>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  );
}
