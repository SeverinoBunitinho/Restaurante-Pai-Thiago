import Link from "next/link";
import { Clock3, PackageCheck, ShoppingBag, Sparkles } from "lucide-react";

import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { requireRole } from "@/lib/auth";
import { getCustomerDashboard } from "@/lib/site-data";
import { orderStatusMeta } from "@/lib/staff-data";
import {
  formatCurrency,
  getFulfillmentTypeLabel,
  getPaymentMethodLabel,
} from "@/lib/utils";

function normalizeCheckoutReference(value) {
  return String(value ?? "").trim().toLowerCase();
}

function formatOrderMoment(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getOrderStatusFlow(fulfillmentType) {
  if (fulfillmentType === "delivery") {
    return ["received", "preparing", "ready", "dispatching", "delivered"];
  }

  return ["received", "preparing", "ready", "delivered"];
}

function getOrderStepState(sequence, currentStatus, stepStatus) {
  const currentIndex = sequence.indexOf(currentStatus);
  const stepIndex = sequence.indexOf(stepStatus);

  if (currentStatus === "cancelled") {
    return "pending";
  }

  if (currentIndex === -1 || stepIndex === -1) {
    return "pending";
  }

  if (currentIndex === stepIndex) {
    return "current";
  }

  if (currentIndex > stepIndex) {
    return "done";
  }

  return "pending";
}

export default async function PedidosPage({ searchParams }) {
  const session = await requireRole("customer");
  const resolvedSearchParams = await searchParams;
  const dashboard = await getCustomerDashboard(session.user.id);
  const orderGroups = dashboard.orderGroups ?? [];
  const trackedCheckout =
    Array.isArray(resolvedSearchParams?.checkout)
      ? resolvedSearchParams.checkout[0]
      : resolvedSearchParams?.checkout;
  const normalizedTrackedCheckout = normalizeCheckoutReference(trackedCheckout);
  const trackedOrderGroup = normalizedTrackedCheckout
    ? orderGroups.find(
        (orderGroup) =>
          normalizeCheckoutReference(orderGroup.checkoutReference) ===
          normalizedTrackedCheckout,
      ) ?? null
    : null;
  const activeOrders = orderGroups.filter(
    (order) => !["delivered", "cancelled"].includes(order.status),
  ).length;
  const deliveredOrders = orderGroups.filter(
    (order) => order.status === "delivered",
  ).length;

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="pb-16">
        <section className="shell pt-12">
          <div className="hero-stage luxury-card-dark rounded-[2.4rem] p-7 text-[var(--cream)] md:p-10">
            <p className="text-xs uppercase tracking-[0.28em] text-[rgba(217,185,122,0.92)]">
              Pedidos
            </p>
            <h1 className="display-title page-hero-title mt-4 text-white">
              Acompanhe seus pedidos em um painel dedicado
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[rgba(255,247,232,0.74)]">
              Esta pagina concentra apenas o fluxo de pedidos: status, forma de
              atendimento, pagamento e historico de itens.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <article className="rounded-[1.6rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-[rgba(217,185,122,0.9)]">
                  Pedidos no total
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {orderGroups.length}
                </p>
                <p className="mt-2 text-sm leading-6 text-[rgba(255,247,232,0.72)]">
                  Historico registrado pela sua conta.
                </p>
              </article>
              <article className="rounded-[1.6rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-[rgba(217,185,122,0.9)]">
                  Em andamento
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {activeOrders}
                </p>
                <p className="mt-2 text-sm leading-6 text-[rgba(255,247,232,0.72)]">
                  Pedidos ainda em preparo, rota ou retirada.
                </p>
              </article>
              <article className="rounded-[1.6rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-[rgba(217,185,122,0.9)]">
                  Entregues
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {deliveredOrders}
                </p>
                <p className="mt-2 text-sm leading-6 text-[rgba(255,247,232,0.72)]">
                  Fechamentos ja concluidos pela equipe.
                </p>
              </article>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/cardapio" className="button-primary">
                <ShoppingBag size={16} />
                Fazer novo pedido
              </Link>
              <Link href="/carrinho" className="button-secondary">
                <PackageCheck size={16} />
                Ver carrinho
              </Link>
            </div>
          </div>
        </section>

        {trackedCheckout ? (
          <section id="acompanhamento" className="shell pt-10">
            <div className="luxury-card rounded-[2rem] p-6">
              {trackedOrderGroup ? (
                <>
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--sage)]">
                    Acompanhamento em tempo real
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold text-[var(--forest)]">
                    {trackedOrderGroup.checkoutReference}
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-[rgba(21,35,29,0.72)]">
                    Este painel atualiza automaticamente quando a equipe muda o
                    status do pedido.
                  </p>

                  {trackedOrderGroup.status === "cancelled" ? (
                    <div className="mt-5 rounded-[1.4rem] border border-[rgba(138,93,59,0.2)] bg-[rgba(138,93,59,0.08)] px-4 py-4 text-sm leading-6 text-[var(--clay)]">
                      Este pedido foi cancelado pela operacao.
                    </div>
                  ) : (
                    <div className="mt-5 grid gap-3 md:grid-cols-5">
                      {(() => {
                        const statusFlow = getOrderStatusFlow(
                          trackedOrderGroup.fulfillmentType,
                        );

                        return statusFlow.map((step) => {
                        const stepMeta = orderStatusMeta[step] ?? {
                          label: step,
                        };
                        const stepState = getOrderStepState(
                          statusFlow,
                          trackedOrderGroup.status,
                          step,
                        );
                        const stepClasses =
                          stepState === "done"
                            ? "border-[rgba(95,123,109,0.24)] bg-[rgba(95,123,109,0.12)] text-[var(--sage)]"
                            : stepState === "current"
                              ? "border-[rgba(182,135,66,0.28)] bg-[rgba(182,135,66,0.14)] text-[var(--gold)]"
                              : "border-[rgba(20,35,29,0.1)] bg-[rgba(255,255,255,0.6)] text-[rgba(21,35,29,0.68)]";

                        return (
                          <div
                            key={step}
                            className={`rounded-[1.2rem] border px-3 py-3 text-center text-xs font-semibold uppercase tracking-[0.16em] ${stepClasses}`}
                          >
                            {stepMeta.label}
                          </div>
                        );
                        });
                      })()}
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-[1.4rem] border border-[rgba(138,93,59,0.2)] bg-[rgba(138,93,59,0.08)] px-4 py-4 text-sm leading-6 text-[var(--clay)]">
                  Nenhum pedido foi localizado para a referencia informada.
                </div>
              )}
            </div>
          </section>
        ) : null}

        <section className="shell pt-20">
          <SectionHeading
            eyebrow="Historico"
            title="Tudo o que foi enviado pela sua conta"
            description="Cada pedido aparece com status, horario, forma de atendimento, pagamento e itens."
          />

          <div className="mt-10 space-y-4">
            {orderGroups.length ? (
              orderGroups.map((orderGroup, index) => {
                const statusView = orderStatusMeta[orderGroup.status] ?? {
                  label: orderGroup.status,
                  badge: "bg-[rgba(20,35,29,0.08)] text-[var(--forest)]",
                };

                return (
                  <article
                    key={orderGroup.id}
                    className={`luxury-card rounded-[2rem] p-6 ${
                      trackedOrderGroup?.id === orderGroup.id
                        ? "border border-[rgba(182,135,66,0.24)]"
                        : ""
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(182,135,66,0.14)] bg-[rgba(255,255,255,0.64)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--gold)]">
                          <ShoppingBag size={14} />
                          {index === 0 ? "Pedido mais recente" : "Pedido anterior"}
                        </div>
                        <h2 className="mt-4 text-2xl font-semibold text-[var(--forest)]">
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
                          Atendimento
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

                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link
                        href={`/pedidos?checkout=${encodeURIComponent(orderGroup.checkoutReference)}#acompanhamento`}
                        className="inline-flex items-center gap-2 rounded-full border border-[rgba(20,35,29,0.12)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--forest)] transition hover:-translate-y-0.5"
                      >
                        Ver acompanhamento ao vivo
                      </Link>
                    </div>
                  </article>
                );
              })
            ) : (
              <article className="luxury-card rounded-[2rem] p-6">
                <p className="text-lg font-semibold text-[var(--forest)]">
                  Nenhum pedido enviado ate agora
                </p>
                <p className="mt-2 text-sm leading-7 text-[rgba(21,35,29,0.72)]">
                  Assim que voce fizer um pedido no cardapio, ele aparece aqui
                  com status atualizado em tempo real.
                </p>
                <Link
                  href="/cardapio"
                  className="mt-6 inline-flex items-center gap-2 rounded-full border border-[rgba(20,35,29,0.1)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--forest)]"
                >
                  <Sparkles size={14} />
                  Ir para o cardapio
                </Link>
              </article>
            )}
          </div>
        </section>

        <section className="shell pt-20">
          <div className="luxury-card rounded-[2rem] p-6">
            <div className="flex items-center gap-3">
              <Clock3 className="text-[var(--gold)]" size={18} />
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--sage)]">
                Leitura rapida
              </p>
            </div>
            <p className="mt-4 text-sm leading-7 text-[rgba(21,35,29,0.72)]">
              Pedidos ficam nesta aba. Reservas, eventos, contato e perfil seguem
              organizados em suas proprias paginas para a navegacao ficar mais
              clara no desktop e no celular.
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
