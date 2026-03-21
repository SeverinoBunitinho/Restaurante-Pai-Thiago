import Link from "next/link";
import { CreditCard, HeartHandshake, ReceiptText, Sparkles, TimerReset } from "lucide-react";

import { SectionHeading } from "@/components/section-heading";
import { getStaffRoleLabel, requireRole } from "@/lib/auth";
import { updateOrderCheckoutStatusAction } from "@/app/operacao/actions";
import {
  getOrdersBoard,
  getServiceBoard,
  orderStatusMeta,
  reservationStatusMeta,
} from "@/lib/staff-data";
import {
  formatCurrency,
  formatReservationMoment,
  getFulfillmentTypeLabel,
  getPaymentMethodLabel,
} from "@/lib/utils";

const orderFilters = [
  { value: "all", label: "Todos" },
  { value: "received", label: "Recebidos" },
  { value: "preparing", label: "Em preparo" },
  { value: "ready", label: "Prontos" },
  { value: "dispatching", label: "Em rota" },
  { value: "delivered", label: "Entregues" },
  { value: "cancelled", label: "Cancelados" },
];

const orderSections = [
  {
    key: "received",
    title: "Recebidos agora",
    description: "Pedidos que acabaram de chegar e precisam entrar no fluxo da equipe.",
  },
  {
    key: "preparing",
    title: "Em preparo",
    description: "Itens que ja estao com a cozinha ou bar em andamento.",
  },
  {
    key: "ready",
    title: "Prontos para entrega",
    description: "Pedidos que podem seguir para conferencia e entrega ao cliente.",
  },
  {
    key: "dispatching",
    title: "Saiu para entrega",
    description: "Pedidos de delivery que ja estao em deslocamento para o cliente.",
  },
  {
    key: "delivered",
    title: "Entregues",
    description: "Pedidos finalizados corretamente pela equipe.",
  },
  {
    key: "cancelled",
    title: "Cancelados",
    description: "Pedidos encerrados antes da entrega para manter o historico consistente.",
  },
];

const roleRituals = {
  waiter: [
    "Leia primeiro as reservas com observacao ou ocasiao especial.",
    "Confirme o clima da mesa antes de conduzir o cliente ao salao.",
    "Volte para acomodacao se precisar redistribuir rapidamente a experiencia.",
  ],
  manager: [
    "Use esta tela para perceber onde o atendimento pede mais tato da equipe.",
    "Cruze hospitalidade com setores do salao antes dos horarios de maior chegada.",
    "Entre em reservas quando for preciso mudar o status operacional da visita.",
  ],
  owner: [
    "Aqui voce enxerga a camada sensivel da experiencia, nao apenas a estrutura.",
    "Observe notas, ocasioes e areas com mais atencao especial no turno.",
    "Use isso como complemento da visao executiva e do painel do turno.",
  ],
};

function getStatusView(status) {
  return (
    reservationStatusMeta[status] ?? {
      label: status,
      badge: "bg-[rgba(20,35,29,0.08)] text-[var(--forest)]",
    }
  );
}

function getOrderActions(status, fulfillmentType = "pickup") {
  if (status === "received") {
    return [
      { label: "Iniciar preparo", value: "preparing", primary: true },
      { label: "Cancelar", value: "cancelled", primary: false },
    ];
  }

  if (status === "preparing") {
    return [{ label: "Marcar pronto", value: "ready", primary: true }];
  }

  if (status === "ready") {
    if (fulfillmentType === "delivery") {
      return [{ label: "Saiu para entrega", value: "dispatching", primary: true }];
    }

    return [{ label: "Marcar retirado", value: "delivered", primary: true }];
  }

  if (status === "dispatching") {
    return [{ label: "Confirmar entrega", value: "delivered", primary: true }];
  }

  return [];
}

function getGroupedOrderActions(status, fulfillmentType) {
  return getOrderActions(status, fulfillmentType);
}

function formatOrderMoment(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function OperacaoComandasPage({ searchParams }) {
  const session = await requireRole(["waiter", "manager", "owner"]);
  const [board, ordersBoard] = await Promise.all([
    getServiceBoard(),
    getOrdersBoard(),
  ]);
  const rituals = roleRituals[session.role] ?? roleRituals.waiter;
  const resolvedSearchParams = await searchParams;
  const statusFilter = Array.isArray(resolvedSearchParams?.status)
    ? resolvedSearchParams.status[0]
    : resolvedSearchParams?.status;
  const activeStatus = orderFilters.some((item) => item.value === statusFilter)
    ? statusFilter
    : "all";
  const groupedOrders = ordersBoard.groupedOrders ?? [];
  const orderGroupsByStatus = orderSections.reduce((accumulator, section) => {
    accumulator[section.key] = groupedOrders.filter(
      (orderGroup) => orderGroup.status === section.key,
    );

    return accumulator;
  }, {});
  const visibleSections =
    activeStatus === "all"
      ? orderSections.filter((section) => orderGroupsByStatus[section.key].length)
      : orderSections.filter((section) => section.key === activeStatus);

  return (
    <>
      <section className="pt-10">
        <div className="grid gap-4 rounded-[2.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.46)] px-5 py-5 shadow-[0_20px_60px_rgba(36,29,15,0.06)] sm:grid-cols-3 lg:px-8">
          {board.summary.map((item) => (
            <div key={item.label} className="rounded-[1.5rem] px-4 py-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--sage)]">
                {item.label}
              </p>
              <p className="mt-3 text-3xl font-semibold text-[var(--forest)]">
                {item.value}
              </p>
              <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.68)]">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="pt-14">
        <div className="grid gap-5 lg:grid-cols-[0.86fr_1.14fr]">
          <div className="luxury-card rounded-[2.2rem] p-6">
            <SectionHeading
              eyebrow="Pedidos digitais"
              title="Fila de pedidos do cliente"
              description="O cliente finaliza delivery ou retirada no carrinho e a equipe acompanha tudo daqui em tempo real."
              compact
            />

            <div className="mt-8 grid gap-4">
              {ordersBoard.summary.map((item) => (
                <article
                  key={item.label}
                  className="rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5"
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--sage)]">
                    {item.label}
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-[var(--forest)]">
                    {item.value}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.68)]">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="luxury-card-dark rounded-[2.2rem] p-6 text-[var(--cream)]">
            <p className="text-xs uppercase tracking-[0.28em] text-[rgba(217,185,122,0.92)]">
              Pedidos e delivery
            </p>
            <h2 className="display-title page-section-title mt-4 text-white">
              O fechamento do cliente chega para a equipe como um pedido consolidado
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[rgba(255,247,232,0.74)]">
              Filtre a fila por etapa para abrir somente o que precisa de acao no momento.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {orderFilters.map((filter) => {
                const href =
                  filter.value === "all"
                    ? "/operacao/comandas"
                    : `/operacao/comandas?status=${filter.value}`;

                return (
                  <Link
                    key={filter.value}
                    href={href}
                    className={`filter-chip ${
                      activeStatus === filter.value ? "filter-chip-active" : ""
                    }`}
                  >
                    {filter.label}
                  </Link>
                );
              })}
            </div>

            <div className="mt-8 space-y-4">
              {groupedOrders.length ? (
                visibleSections.map((section) => (
                  <section key={section.key} className="space-y-4">
                    <div className="rounded-[1.4rem] border border-[rgba(217,185,122,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-[rgba(217,185,122,0.88)]">
                        {section.title}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[rgba(255,247,232,0.72)]">
                        {section.description}
                      </p>
                    </div>

                    {orderGroupsByStatus[section.key].length ? (
                      orderGroupsByStatus[section.key].map((orderGroup) => {
                        const statusView = orderStatusMeta[orderGroup.status] ?? {
                          label: orderGroup.status,
                          badge:
                            "bg-[rgba(255,255,255,0.08)] text-[rgba(255,247,232,0.84)]",
                        };

                        return (
                          <article
                            key={orderGroup.id}
                            className="rounded-[1.8rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] p-5"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div>
                                <h3 className="text-xl font-semibold text-white">
                                  Pedido {orderGroup.checkoutReference}
                                </h3>
                                <p className="mt-1 text-sm text-[rgba(255,247,232,0.76)]">
                                  {orderGroup.guestName} - {orderGroup.totalItems} item(ns) -{" "}
                                  {formatCurrency(orderGroup.totalPrice)}
                                </p>
                              </div>
                              <span
                                className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${statusView.badge}`}
                              >
                                {statusView.label}
                              </span>
                            </div>

                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                              <div className="rounded-[1.4rem] border border-[rgba(217,185,122,0.12)] bg-[rgba(255,255,255,0.03)] p-4 text-sm leading-6 text-[rgba(255,247,232,0.74)]">
                                <p>Entrada: {formatOrderMoment(orderGroup.createdAt)}</p>
                                <p>E-mail do cliente: {orderGroup.guestEmail || "Nao informado"}</p>
                                <p>Atendimento: {getFulfillmentTypeLabel(orderGroup.fulfillmentType)}</p>
                              </div>
                              <div className="rounded-[1.4rem] border border-[rgba(217,185,122,0.12)] bg-[rgba(255,255,255,0.03)] p-4 text-sm leading-6 text-[rgba(255,247,232,0.74)]">
                                <p className="inline-flex items-center gap-2">
                                  <CreditCard size={15} />
                                  Pagamento: {getPaymentMethodLabel(orderGroup.paymentMethod)}
                                </p>
                                <p className="inline-flex items-center gap-2">
                                  <ReceiptText size={15} />
                                  Referencia: {orderGroup.checkoutReference}
                                </p>
                                {orderGroup.fulfillmentType === "delivery" ? (
                                  <p>Taxa: {formatCurrency(orderGroup.deliveryFee)}</p>
                                ) : (
                                  <p>Entrega: retirada no restaurante</p>
                                )}
                              </div>
                            </div>

                            {orderGroup.fulfillmentType === "delivery" ? (
                              <div className="mt-4 rounded-[1.4rem] border border-[rgba(217,185,122,0.12)] bg-[rgba(255,255,255,0.03)] p-4 text-sm leading-6 text-[rgba(255,247,232,0.74)]">
                                <p>Endereco: {orderGroup.deliveryAddress}</p>
                                <p>Bairro: {orderGroup.deliveryNeighborhood}</p>
                                {orderGroup.deliveryReference ? (
                                  <p>Referencia: {orderGroup.deliveryReference}</p>
                                ) : null}
                                <p>Previsao de entrega: {orderGroup.deliveryEtaMinutes} min</p>
                              </div>
                            ) : null}

                            <div className="mt-4 rounded-[1.5rem] border border-[rgba(217,185,122,0.12)] bg-[rgba(255,255,255,0.03)] p-4">
                              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgba(217,185,122,0.84)]">
                                Itens do pedido
                              </p>
                              <div className="mt-4 space-y-3">
                                {orderGroup.items.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex flex-wrap items-start justify-between gap-4 rounded-[1.2rem] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-3"
                                  >
                                    <div>
                                      <p className="text-sm font-semibold text-white">
                                        {item.itemName}
                                      </p>
                                      <p className="mt-1 text-sm text-[rgba(255,247,232,0.72)]">
                                        {item.quantity} item(ns)
                                      </p>
                                      {item.notes ? (
                                        <p className="mt-2 text-sm text-[rgba(255,247,232,0.72)]">
                                          Observacao: {item.notes}
                                        </p>
                                      ) : null}
                                    </div>
                                    <p className="text-sm font-semibold text-[var(--gold-soft)]">
                                      {formatCurrency(item.totalPrice)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {getGroupedOrderActions(orderGroup.status, orderGroup.fulfillmentType).length ? (
                              <div className="mt-5 flex flex-wrap gap-3">
                                {getGroupedOrderActions(orderGroup.status, orderGroup.fulfillmentType).map((action) => (
                                  <form key={action.value} action={updateOrderCheckoutStatusAction}>
                                    <input
                                      type="hidden"
                                      name="checkoutReference"
                                      value={orderGroup.checkoutReference}
                                    />
                                    <input
                                      type="hidden"
                                      name="orderIds"
                                      value={JSON.stringify(orderGroup.orderIds)}
                                    />
                                    <input
                                      type="hidden"
                                      name="nextStatus"
                                      value={action.value}
                                    />
                                    <button
                                      type="submit"
                                      className={
                                        action.primary
                                          ? "rounded-full bg-[var(--gold-soft)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--forest)] transition hover:-translate-y-0.5"
                                          : "rounded-full border border-[rgba(217,185,122,0.18)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(255,247,232,0.8)] transition hover:-translate-y-0.5"
                                      }
                                    >
                                      {action.label}
                                    </button>
                                  </form>
                                ))}
                              </div>
                            ) : (
                              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-[rgba(217,185,122,0.82)]">
                                Fluxo encerrado
                              </p>
                            )}
                          </article>
                        );
                      })
                    ) : (
                      <article className="rounded-[1.6rem] border border-dashed border-[rgba(217,185,122,0.18)] bg-[rgba(255,255,255,0.04)] p-6">
                        <p className="text-sm leading-6 text-[rgba(255,247,232,0.72)]">
                          Nenhum pedido nesta etapa agora.
                        </p>
                      </article>
                    )}
                  </section>
                ))
              ) : (
                <article className="rounded-[1.8rem] border border-dashed border-[rgba(217,185,122,0.18)] bg-[rgba(255,255,255,0.04)] p-6">
                  <p className="text-xl font-semibold text-white">
                    Nenhum pedido finalizado no momento
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[rgba(255,247,232,0.72)]">
                    Assim que o cliente finalizar o carrinho, o pedido aparece
                    aqui automaticamente para a equipe.
                  </p>
                </article>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="pt-14">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.95fr]">
          <div className="luxury-card rounded-[2.2rem] p-6">
            <SectionHeading
              eyebrow="Hospitalidade"
              title="Clientes e visitas que pedem mais contexto"
              description="Esta pagina deixou de repetir a fila de reservas. Agora ela destaca clima, observacoes e momentos especiais do atendimento."
              compact
            />

            <div className="mt-8 space-y-4">
              {board.priorityGuests.length ? (
                board.priorityGuests.map((guest) => {
                  const statusView = getStatusView(guest.status);

                  return (
                    <article
                      key={guest.id}
                      className="rounded-[1.8rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-semibold text-[var(--forest)]">
                            {guest.guestName}
                          </h3>
                          <p className="mt-1 text-sm text-[rgba(21,35,29,0.72)]">
                            {formatReservationMoment(guest.date, guest.time)} -{" "}
                            {guest.guests} pessoas
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${statusView.badge}`}
                        >
                          {statusView.label}
                        </span>
                      </div>

                      <div className="mt-4 space-y-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                        <p>
                          <span className="font-semibold text-[var(--forest)]">
                            Ocasiao:
                          </span>{" "}
                          {guest.occasion}
                        </p>
                        <p>
                          <span className="font-semibold text-[var(--forest)]">
                            Contexto:
                          </span>{" "}
                          {guest.notes || "Sem observacoes extras, apenas leitura do clima da visita."}
                        </p>
                        <p className="font-semibold text-[var(--forest)]">
                          Proxima leitura: {guest.actionLabel}
                        </p>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <Link
                          href="/operacao/reservas"
                          className="rounded-full border border-[rgba(20,35,29,0.12)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--forest)] transition hover:-translate-y-0.5"
                        >
                          Abrir reservas
                        </Link>
                        <Link
                          href="/operacao/mesas"
                          className="rounded-full border border-[rgba(20,35,29,0.12)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--forest)] transition hover:-translate-y-0.5"
                        >
                          Ver acomodacao
                        </Link>
                      </div>
                    </article>
                  );
                })
              ) : (
                <article className="rounded-[1.6rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.5)] p-6">
                  <p className="text-lg font-semibold text-[var(--forest)]">
                    Nenhuma visita com contexto especial agora
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.7)]">
                    Quando uma reserva chegar com observacao ou ocasiao mais
                    sensivel, ela aparecera aqui para orientar a equipe.
                  </p>
                </article>
              )}
            </div>
          </div>

          <div className="luxury-card-dark rounded-[2.2rem] p-6 text-[var(--cream)]">
            <p className="text-xs uppercase tracking-[0.28em] text-[rgba(217,185,122,0.92)]">
              Rituais do {getStaffRoleLabel(session.role).toLowerCase()}
            </p>
            <h2 className="display-title page-section-title mt-4 text-white">
              Como este cargo deve usar a camada de experiencia
            </h2>

            <div className="mt-8 space-y-3">
              {rituals.map((ritual) => (
                <div
                  key={ritual}
                  className="rounded-[1.4rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm leading-7 text-[rgba(255,247,232,0.8)]"
                >
                  {ritual}
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-4">
              {[
                {
                  icon: HeartHandshake,
                  title: "Clima da visita",
                  text: "A equipe passa a enxergar a intencao da reserva, nao apenas a operacao.",
                },
                {
                  icon: Sparkles,
                  title: "Atendimento mais fino",
                  text: "Observacoes e ocasioes ajudam a personalizar recepcao, ritmo e fechamento.",
                },
                {
                  icon: TimerReset,
                  title: "Decisao sem repeticao",
                  text: "Quando precisar agir, esta tela direciona para reservas ou acomodacao sem duplicar a mesma fila.",
                },
              ].map((item) => (
                <article
                  key={item.title}
                  className="rounded-[1.6rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] p-5"
                >
                  <item.icon className="text-[var(--gold-soft)]" size={18} />
                  <h3 className="mt-4 text-lg font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[rgba(255,247,232,0.72)]">
                    {item.text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="pt-14">
        <div className="grid gap-5 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="luxury-card rounded-[2.2rem] p-6">
            <SectionHeading
              eyebrow="Momentos do atendimento"
              title="O turno dividido por tipo de conducao"
              description="Aqui a equipe entende o que fazer em cada etapa da experiencia, sem transformar tudo em uma unica fila."
              compact
            />

            <div className="mt-8 grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
              {board.moments.map((moment) => (
                <section
                  key={moment.key}
                  className="min-w-0 rounded-[1.8rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5"
                >
                  <h3 className="content-copy-safe text-balance text-[clamp(1.55rem,4vw,2rem)] font-semibold leading-tight text-[var(--forest)]">
                    {moment.title}
                  </h3>
                  <div className="mt-5 space-y-4">
                    {moment.items.length ? (
                      moment.items.map((item) => (
                        <article
                          key={item.id}
                          className="rounded-[1.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.72)] p-4"
                        >
                          <p className="text-lg font-semibold text-[var(--forest)]">
                            {item.guestName}
                          </p>
                          <p className="mt-1 text-sm text-[rgba(21,35,29,0.72)]">
                            {item.time} - {item.area}
                          </p>
                          <p className="mt-3 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                            {item.actionLabel}
                          </p>
                        </article>
                      ))
                    ) : (
                      <article className="rounded-[1.4rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.5)] p-5">
                        <p className="content-copy-safe text-sm leading-6 text-[rgba(21,35,29,0.7)]">
                          Nenhuma visita encaixada nesta etapa agora.
                        </p>
                      </article>
                    )}
                  </div>
                </section>
              ))}
            </div>
          </div>

          <div className="luxury-card rounded-[2.2rem] p-6">
            <SectionHeading
              eyebrow="Foco por area"
              title="Onde a hospitalidade pede mais cuidado"
              description="Uma leitura de ambiente para ajustar atendimento, recepcao e tom da experiencia."
              compact
            />

            <div className="mt-8 space-y-4">
              {board.areaFocus.length ? (
                board.areaFocus.map((area) => (
                  <article
                    key={area.area}
                    className="rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5"
                  >
                    <h3 className="text-lg font-semibold text-[var(--forest)]">
                      {area.area}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                      {area.reservations} reserva(s) ligadas a esta area.
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                      {area.hospitality}
                    </p>
                  </article>
                ))
              ) : (
                <article className="rounded-[1.6rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.5)] p-6">
                  <p className="text-lg font-semibold text-[var(--forest)]">
                    Sem leitura por area no momento
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.7)]">
                    Assim que o turno receber mais reservas, as areas passam a
                    mostrar o clima operacional daqui.
                  </p>
                </article>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
