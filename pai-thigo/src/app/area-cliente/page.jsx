import Link from "next/link";
import {
  CalendarHeart,
  ChevronRight,
  ChefHat,
  HeartHandshake,
  Star,
  UserRound,
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

export default async function AreaClientePage() {
  const session = await requireRole("customer");
  const dashboard = await getCustomerDashboard(session.user.id);
  const firstName = dashboard.profile.fullName.split(" ")[0];
  const orderGroups = dashboard.orderGroups ?? [];

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="pb-16">
        <section className="shell pt-12">
          <div className="grid gap-5 lg:grid-cols-[1fr_0.96fr]">
            <div className="luxury-card-dark rounded-[2.4rem] p-7 text-[var(--cream)] md:p-10">
              <p className="text-xs uppercase tracking-[0.28em] text-[rgba(217,185,122,0.92)]">
                Area do cliente
              </p>
              <h1 className="display-title page-hero-title mt-4 text-white">
                Bem-vindo, {firstName}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-[rgba(255,247,232,0.74)]">
                Seu portal pessoal concentra reservas, dados da conta e uma
                rotina clara para acompanhar visitas, delivery, retirada e
                informacoes de atendimento no Pai Thiago.
              </p>

              {!dashboard.usingSupabase && dashboard.notice ? (
                <div className="mt-6 rounded-[1.4rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.05)] px-4 py-4 text-sm leading-6 text-[rgba(255,247,232,0.8)]">
                  {dashboard.notice}
                </div>
              ) : null}

              <div className="feature-stat-grid feature-stat-grid-3 mt-8">
                {dashboard.metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="feature-stat-card rounded-[1.6rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] p-5"
                  >
                    <p className="feature-stat-label text-xs uppercase tracking-[0.24em] text-[rgba(217,185,122,0.92)]">
                      {metric.label}
                    </p>
                    <p className="feature-stat-value mt-3 text-2xl font-semibold text-white">
                      {metric.value}
                    </p>
                    <p className="feature-stat-body mt-2 text-sm text-[rgba(255,247,232,0.72)]">
                      {metric.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="luxury-card rounded-[2.4rem] p-7 md:p-10">
              <SectionHeading
                eyebrow="Perfil"
                title="Uma conta pensada para voltar ao restaurante com facilidade"
                description="Os dados abaixo ajudam a equipe a reconhecer o cliente e acelerar a proxima visita."
                compact
              />

              <div className="mt-8 grid gap-4">
                <article className="rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--sage)]">
                    Contato principal
                  </p>
                  <p className="mt-3 text-lg font-semibold text-[var(--forest)]">
                    {dashboard.profile.email || "E-mail nao informado"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                    {dashboard.profile.phone || "Telefone ainda nao preenchido"}
                  </p>
                </article>

                <article className="rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--sage)]">
                    Preferencia da casa
                  </p>
                  <p className="mt-3 text-lg font-semibold text-[var(--forest)]">
                    {dashboard.profile.preferredRoom}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                    A equipe consegue usar essa referencia para sugerir o melhor
                    ambiente para a sua experiencia.
                  </p>
                </article>

                <article className="rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--sage)]">
                    Relacionamento
                  </p>
                  <p className="mt-3 text-lg font-semibold text-[var(--forest)]">
                    {dashboard.profile.loyaltyPoints} pontos
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                    Acumulados para beneficios do restaurante e historico de
                    atendimento.
                  </p>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className="shell pt-20">
          <div className="grid gap-5 lg:grid-cols-[1.04fr_0.96fr]">
            <div className="luxury-card rounded-[2.2rem] p-6">
              <SectionHeading
                eyebrow="Minhas reservas"
                title="Historico e proximas visitas"
                description="Visual de acompanhamento pensado para o cliente se localizar rapido."
                compact
              />
              <div className="mt-8 space-y-4">
                {dashboard.reservations.length ? (
                  dashboard.reservations.map((reservation) => {
                    const statusView =
                      reservationStatusMeta[reservation.status] ?? {
                        label: reservation.status,
                        badge: "bg-[rgba(20,35,29,0.08)] text-[var(--forest)]",
                      };

                    return (
                      <article
                        key={reservation.id}
                        className="rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-semibold text-[var(--forest)]">
                              {reservation.occasion}
                            </h3>
                            <p className="mt-1 text-sm text-[rgba(21,35,29,0.72)]">
                              {formatReservationMoment(
                                reservation.date,
                                reservation.time,
                              )}{" "}
                              - {reservation.guests} pessoas
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${statusView.badge}`}
                          >
                            {statusView.label}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                          Area sugerida: {reservation.area}
                        </p>
                      </article>
                    );
                  })
                ) : (
                  <article className="rounded-[1.6rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.5)] p-6">
                    <p className="text-lg font-semibold text-[var(--forest)]">
                      Nenhuma reserva registrada ainda
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.7)]">
                      Assim que voce criar sua primeira reserva, ela aparece
                      aqui com data, horario e status.
                    </p>
                    <Link
                      href="/reservas"
                      className="mt-5 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--forest)]"
                    >
                      Reservar agora
                      <ChevronRight size={16} />
                    </Link>
                  </article>
                )}
              </div>
            </div>

            <div className="luxury-card rounded-[2.2rem] p-6">
              <SectionHeading
                eyebrow="Pedidos e delivery"
                title="Acompanhe o status do que foi solicitado"
                description="Cada fechamento aparece agrupado com pagamento, tipo de atendimento e andamento em tempo real."
                compact
              />
              <div className="mt-8 space-y-4">
                {orderGroups.length ? (
                  orderGroups.map((orderGroup) => {
                    const statusView = orderStatusMeta[orderGroup.status] ?? {
                      label: orderGroup.status,
                      badge: "bg-[rgba(20,35,29,0.08)] text-[var(--forest)]",
                    };

                    return (
                      <article
                        key={orderGroup.id}
                        className="rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-semibold text-[var(--forest)]">
                              Pedido {orderGroup.checkoutReference}
                            </h3>
                            <p className="mt-1 text-sm text-[rgba(21,35,29,0.72)]">
                              {orderGroup.totalItems} item(ns) -{" "}
                              {formatCurrency(orderGroup.grandTotal)}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${statusView.badge}`}
                          >
                            {statusView.label}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                          Entrou no sistema em {formatOrderMoment(orderGroup.createdAt)}.
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                          Atendimento: {getFulfillmentTypeLabel(orderGroup.fulfillmentType)}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                          Pagamento: {getPaymentMethodLabel(orderGroup.paymentMethod)}
                        </p>
                        {orderGroup.fulfillmentType === "delivery" ? (
                          <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                            Entrega em: {orderGroup.deliveryAddress} - {orderGroup.deliveryNeighborhood}
                          </p>
                        ) : null}
                        {orderGroup.fulfillmentType === "delivery" && orderGroup.deliveryReference ? (
                          <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                            Referencia: {orderGroup.deliveryReference}
                          </p>
                        ) : null}
                        {orderGroup.fulfillmentType === "delivery" ? (
                          <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                            Taxa de entrega: {formatCurrency(orderGroup.deliveryFee)} - previsao de {orderGroup.deliveryEtaMinutes} min
                          </p>
                        ) : null}

                        <div className="mt-4 space-y-2 rounded-[1.3rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.52)] px-4 py-4">
                          {orderGroup.items.map((item) => (
                            <div key={item.id} className="flex items-start justify-between gap-4">
                              <div>
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
                              <p className="text-sm font-semibold text-[var(--forest)]">
                                {formatCurrency(item.totalPrice)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <article className="rounded-[1.6rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.5)] p-6">
                    <p className="text-lg font-semibold text-[var(--forest)]">
                      Nenhum pedido aberto agora
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.7)]">
                      Quando voce enviar um prato pelo cardapio, ele aparecera
                      aqui e seguira o status informado pela equipe.
                    </p>
                    <Link
                      href="/cardapio"
                      className="mt-5 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--forest)]"
                    >
                      Pedir no cardapio
                      <ChevronRight size={16} />
                    </Link>
                  </article>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="shell pt-20">
          <div className="luxury-card rounded-[2.2rem] p-6">
              <SectionHeading
                eyebrow="Atalhos"
                title="Acessos rapidos da sua conta"
                description="O cliente encontra aqui apenas os caminhos que ajudam a organizar a visita."
                compact
              />
              <div className="mt-8 grid gap-4">
                {[
                  {
                    icon: CalendarHeart,
                    title: "Fazer nova reserva",
                    text: "Voltar rapidamente ao formulario e escolher a data ideal.",
                    href: "/reservas",
                  },
                  {
                    icon: HeartHandshake,
                    title: "Eventos e ocasioes",
                    text: "Planejar aniversarios, encontros especiais e formatos de visita.",
                    href: "/eventos",
                  },
                  {
                    icon: ChefHat,
                    title: "Delivery e retirada",
                    text: "Monte o pedido, escolha o tipo de atendimento e acompanhe o fluxo em tempo real.",
                    href: "/carrinho",
                  },
                  {
                    icon: UserRound,
                    title: "Minha conta",
                    text: "Dados de perfil, historico e preferencia de ambiente em um unico lugar.",
                    href: "/",
                  },
                  {
                    icon: Star,
                    title: "Sugestao da semana",
                    text: experiences[1]?.title ?? "Jantar degustacao",
                    href: "/cardapio",
                  },
                ].map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5 transition hover:-translate-y-0.5"
                  >
                    <item.icon className="text-[var(--gold)]" size={20} />
                    <h2 className="mt-4 text-lg font-semibold text-[var(--forest)]">
                      {item.title}
                    </h2>
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
