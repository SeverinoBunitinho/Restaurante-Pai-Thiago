import Link from "next/link";
import { ArrowRight, Radar, ReceiptText, ShieldCheck, Sparkles } from "lucide-react";

import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getStaffRoleLabel, requireRole } from "@/lib/auth";
import {
  getExecutiveBoard,
  getMenuManagementBoard,
  getReservationsBoard,
  getStaffDirectoryBoard,
  getTablesBoard,
  reservationStatusMeta,
} from "@/lib/staff-data";
import { getStaffModules } from "@/lib/staff-modules";
import { formatReservationMoment } from "@/lib/utils";

function getStatusView(status) {
  return (
    reservationStatusMeta[status] ?? {
      label: status,
      badge: "bg-[rgba(20,35,29,0.08)] text-[var(--forest)]",
    }
  );
}

export default async function PainelPage() {
  const session = await requireRole(["waiter", "manager", "owner"]);

  const [reservationsBoard, tablesBoard, staffBoard, menuBoard, executiveBoard] =
    await Promise.all([
      getReservationsBoard(),
      getTablesBoard(),
      session.role === "waiter"
        ? Promise.resolve({ staff: [] })
        : getStaffDirectoryBoard(),
      session.role === "waiter"
        ? Promise.resolve({ summary: [], categories: [] })
        : getMenuManagementBoard(),
      session.role === "owner"
        ? getExecutiveBoard()
        : Promise.resolve({ metrics: [], insights: [] }),
    ]);

  const modules = getStaffModules(session.role);
  const occupiedTables = tablesBoard.tables.filter(
    (table) => table.state === "ocupada",
  ).length;
  const reservedTables = tablesBoard.tables.filter(
    (table) => table.state === "reservada",
  ).length;
  const activeTeam = staffBoard.staff?.filter((member) => member.active).length ?? 0;
  const activeMenuItems =
    menuBoard.categories?.flatMap((category) => category.items).filter((item) => item.available)
      .length ?? 0;

  const commandCards = [
    {
      label: "Pendencias do turno",
      value: reservationsBoard.summary[0]?.value ?? "0",
      description: "Demandas que ainda precisam de retorno da equipe.",
    },
    {
      label: "Mesas ocupadas",
      value: String(occupiedTables),
      description: "Atendimentos em andamento no salao.",
    },
    {
      label: "Mesas reservadas",
      value: String(reservedTables),
      description: "Chegadas previstas nas proximas janelas.",
    },
    ...(session.role !== "waiter"
      ? [
          {
            label: "Equipe ativa",
            value: String(activeTeam),
            description: "Profissionais liberados para operar a casa.",
          },
        ]
      : []),
    ...(session.role !== "waiter"
      ? [
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
              <Link
                href="/operacao/comandas"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.7)] px-4 py-2 text-sm font-semibold text-[var(--forest)] transition hover:-translate-y-0.5"
              >
                <ReceiptText size={16} />
                Abrir pedidos dos clientes
              </Link>
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
          <div className="staff-kpi-strip grid gap-4 rounded-[2.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.46)] px-5 py-5 shadow-[0_20px_60px_rgba(36,29,15,0.06)] sm:grid-cols-2 xl:grid-cols-5 lg:px-8">
            {commandCards.map((card) => (
              <div key={card.label} className="staff-kpi-item rounded-[1.5rem] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--sage)]">
                  {card.label}
                </p>
                <p className="mt-3 text-3xl font-semibold text-[var(--forest)]">
                  {card.value}
                </p>
                <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.68)]">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="shell pt-20">
          <div className="grid gap-5 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="luxury-card rounded-[2.2rem] p-6">
              <SectionHeading
                eyebrow="Rotas taticas"
                title="Modulos para agir sem perder tempo"
                description="Os acessos abaixo foram reunidos para transformar o painel em um ponto rapido de decisao."
                compact
              />

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {modules.map((module) => (
                  <Link
                    key={module.key}
                    href={module.href}
                    className="staff-feature-link rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5"
                  >
                    <module.icon className="text-[var(--gold)]" size={20} />
                    <h3 className="mt-4 text-lg font-semibold text-[var(--forest)]">
                      {module.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                      {module.description}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="luxury-card rounded-[2.2rem] p-6">
              <SectionHeading
                eyebrow="Leitura do salao"
                title="Estado das mesas e distribuicao de areas"
                description="Uma leitura consolidada para decidir onde acomodar melhor as proximas reservas."
                compact
              />

              <div className="mt-8 space-y-4">
                {tablesBoard.tables.length ? (
                  tablesBoard.tables.slice(0, 4).map((table) => (
                    <article
                      key={table.id}
                      className="staff-surface-card rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-[var(--forest)]">
                            {table.name}
                          </h3>
                          <p className="mt-1 text-sm text-[rgba(21,35,29,0.72)]">
                            {table.area} - capacidade {table.capacity}
                          </p>
                        </div>
                        <span className="rounded-full bg-[rgba(20,35,29,0.08)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--forest)]">
                          {table.state}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                        {table.detail}
                      </p>
                    </article>
                  ))
                ) : (
                  <article className="rounded-[1.6rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.56)] p-5">
                    <p className="text-lg font-semibold text-[var(--forest)]">
                      Sem leitura de mesas no momento
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                      O estado do salao reaparece automaticamente assim que a
                      conexao com o banco for restabelecida.
                    </p>
                  </article>
                )}
              </div>
            </div>
          </div>
        </section>

        {session.role !== "waiter" ? (
          <section className="shell pt-20">
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
          <section className="shell pt-20">
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
