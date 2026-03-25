import Link from "next/link";
import { BarChart3, Download, TrendingUp, WalletCards } from "lucide-react";

import { SectionHeading } from "@/components/section-heading";
import { getServiceReportsBoard, reportPeriodOptions } from "@/lib/checks-data";
import { requireRole } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";

export default async function OperacaoRelatoriosPage({ searchParams }) {
  await requireRole(["manager", "owner"]);

  const resolvedSearchParams = await searchParams;
  const period = Array.isArray(resolvedSearchParams?.period)
    ? resolvedSearchParams.period[0]
    : resolvedSearchParams?.period;
  const startDate = Array.isArray(resolvedSearchParams?.start)
    ? resolvedSearchParams.start[0]
    : resolvedSearchParams?.start;
  const endDate = Array.isArray(resolvedSearchParams?.end)
    ? resolvedSearchParams.end[0]
    : resolvedSearchParams?.end;
  const board = await getServiceReportsBoard(period ?? "30d", {
    startDate: startDate ?? "",
    endDate: endDate ?? "",
  });
  const exportHref =
    board.period === "custom" && board.startDate && board.endDate
      ? `/api/operacao/relatorios/export?period=custom&start=${board.startDate}&end=${board.endDate}`
      : `/api/operacao/relatorios/export?period=${board.period}`;
  const exportJsonHref = `${exportHref}&format=json`;

  return (
    <>
      <section className="pt-10">
        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="luxury-card rounded-[2.2rem] p-6">
            <SectionHeading
              eyebrow="Relatorios internos"
              title="Comissao dos garcons e ocupacao das mesas"
              description="Gerente e dono acompanham o desempenho do salao por periodo, sem precisar sair da operacao."
              compact
            />

            <div className="mt-6 flex flex-wrap gap-3">
              {reportPeriodOptions.map((option) => (
                <Link
                  key={option.value}
                  href={
                    option.value === "custom"
                      ? "/operacao/relatorios?period=custom"
                      : `/operacao/relatorios?period=${option.value}`
                  }
                  className={`filter-chip ${
                    board.period === option.value ? "filter-chip-active" : ""
                  }`}
                >
                  {option.label}
                </Link>
              ))}
            </div>

            <form method="get" className="mt-5 grid gap-3 rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.56)] p-4 sm:grid-cols-[1fr_1fr_auto]">
              <input type="hidden" name="period" value="custom" />
              <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sage)]">
                Inicio
                <input
                  type="date"
                  name="start"
                  defaultValue={board.startDate || ""}
                  className="rounded-xl border border-[rgba(20,35,29,0.12)] bg-white px-3 py-2 text-sm normal-case tracking-normal text-[var(--forest)] outline-none"
                />
              </label>
              <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sage)]">
                Fim
                <input
                  type="date"
                  name="end"
                  defaultValue={board.endDate || ""}
                  className="rounded-xl border border-[rgba(20,35,29,0.12)] bg-white px-3 py-2 text-sm normal-case tracking-normal text-[var(--forest)] outline-none"
                />
              </label>
              <button type="submit" className="button-secondary self-end">
                Aplicar
              </button>
            </form>

            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={exportHref}
                className="button-primary inline-flex w-full items-center justify-center gap-2 sm:w-auto"
              >
                <Download size={16} />
                Exportar CSV
              </a>
              <a
                href={exportJsonHref}
                className="button-secondary inline-flex w-full items-center justify-center gap-2 sm:w-auto"
              >
                <Download size={16} />
                Exportar JSON
              </a>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {board.summary.map((item) => {
                const numericValue = Number(item.value);
                const formattedValue = item.label.includes("Faturamento") ||
                  item.label.includes("Comissao") ||
                  item.label.includes("Ticket")
                  ? formatCurrency(numericValue)
                  : item.value;

                return (
                  <article
                    key={item.label}
                    className="rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5"
                  >
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--sage)]">
                      {item.label}
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-[var(--forest)]">
                      {formattedValue}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.68)]">
                      {item.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="luxury-card-dark rounded-[2.2rem] p-6 text-[var(--cream)]">
            <p className="text-xs uppercase tracking-[0.28em] text-[rgba(217,185,122,0.92)]">
              Leitura do periodo
            </p>
            <h2 className="display-title page-section-title mt-4 text-white">
              {board.periodLabel} com regra atual de {board.commissionRate}% para comissao
            </h2>
            <p className="mt-4 text-sm leading-7 text-[rgba(255,247,232,0.74)]">
              O relatorio considera contas fechadas no periodo para comissao e
              giro das mesas, enquanto a ocupacao ao vivo continua mostrando as
              mesas com conta aberta agora.
            </p>

            <div className="mt-8 grid gap-4">
              {[
                {
                  icon: WalletCards,
                  title: "Comissao segura",
                  text: "A conta precisa estar fechada para entrar no calculo do garcom.",
                },
                {
                  icon: BarChart3,
                  title: "Ocupacao por mesa",
                  text: "Cada mesa mostra giro, cancelamentos e valor movimentado no periodo.",
                },
                {
                  icon: TrendingUp,
                  title: "Leitura executiva rapida",
                  text: "Gerente e dono conseguem perceber gargalos do salao sem sair da central interna.",
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
        <div className="luxury-card rounded-[2.2rem] p-6">
          <SectionHeading
            eyebrow="Financeiro diario"
            title="Linha de faturamento por dia"
            description="Visao de fechamento para apoiar decisoes de escala, compras e campanhas."
            compact
          />

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {board.financialTimeline.length ? (
              board.financialTimeline.slice(-8).map((entry) => (
                <article
                  key={entry.date}
                  className="rounded-[1.5rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--sage)]">
                    {entry.date}
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-[var(--forest)]">
                    {formatCurrency(entry.revenue)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                    {entry.closedChecks} conta(s) fechada(s).
                  </p>
                </article>
              ))
            ) : (
              <article className="rounded-[1.6rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.52)] p-5 md:col-span-2 xl:col-span-4">
                <p className="text-lg font-semibold text-[var(--forest)]">
                  Sem linha financeira para este periodo
                </p>
                <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                  O grafico diario aparece conforme as contas forem fechadas no periodo filtrado.
                </p>
              </article>
            )}
          </div>
        </div>
      </section>

      <section className="pt-14">
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="luxury-card rounded-[2.2rem] p-6">
            <SectionHeading
              eyebrow="Comissoes"
              title="Fechamento por garcom"
              description="Cada valor abaixo considera apenas comandas fechadas e abertas pelo garcom."
              compact
            />

            <div className="mt-8 space-y-4">
              {board.waiterCommissions.length ? (
                board.waiterCommissions.map((waiter) => (
                  <article
                    key={waiter.userId}
                    className="rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold text-[var(--forest)]">
                          {waiter.fullName}
                        </h3>
                        <p className="mt-1 text-sm text-[rgba(21,35,29,0.7)]">
                          {waiter.email}
                        </p>
                      </div>
                      <span className="rounded-full bg-[rgba(95,123,109,0.12)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sage)]">
                        {waiter.closedChecks} conta(s) fechada(s)
                      </span>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      <div className="rounded-[1.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.72)] p-4">
                        <p className="text-xs uppercase tracking-[0.22em] text-[var(--sage)]">
                          Total vendido
                        </p>
                        <p className="mt-3 text-2xl font-semibold text-[var(--forest)]">
                          {formatCurrency(waiter.grossSales)}
                        </p>
                      </div>
                      <div className="rounded-[1.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.72)] p-4">
                        <p className="text-xs uppercase tracking-[0.22em] text-[var(--sage)]">
                          Comissao prevista
                        </p>
                        <p className="mt-3 text-2xl font-semibold text-[var(--forest)]">
                          {formatCurrency(waiter.commissionAmount)}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-[rgba(21,35,29,0.68)]">
                      Ultimo fechamento contabilizado em{" "}
                      {new Intl.DateTimeFormat("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(new Date(waiter.lastCloseAt))}
                      .
                    </p>
                  </article>
                ))
              ) : (
                <article className="rounded-[1.6rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.5)] p-6">
                  <p className="text-lg font-semibold text-[var(--forest)]">
                    Nenhuma comissao calculada neste periodo
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                    Assim que os garcons fecharem comandas, a comissao aparece aqui automaticamente.
                  </p>
                </article>
              )}
            </div>
          </div>

          <div className="luxury-card rounded-[2.2rem] p-6">
            <SectionHeading
              eyebrow="Ocupacao"
              title="Leitura de giro por mesa"
              description="Um retrato do salao para perceber quais mesas giram mais e onde a operacao pode melhorar."
              compact
            />

            <div className="mt-8 space-y-4">
              {board.tableOccupancy.length ? (
                board.tableOccupancy.map((table) => (
                  <article
                    key={table.id}
                    className="rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-[var(--sage)]">
                          {table.area}
                        </p>
                        <h3 className="mt-2 text-xl font-semibold text-[var(--forest)]">
                          {table.name}
                        </h3>
                        <p className="mt-1 text-sm text-[rgba(21,35,29,0.7)]">
                          Capacidade para {table.capacity} pessoa(s)
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
                          table.openAccounts
                            ? "bg-[rgba(182,135,66,0.12)] text-[var(--gold)]"
                            : "bg-[rgba(95,123,109,0.12)] text-[var(--sage)]"
                        }`}
                      >
                        {table.openAccounts ? "aberta agora" : "sem conta aberta"}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      <div className="rounded-[1.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.72)] p-4">
                        <p className="text-xs uppercase tracking-[0.22em] text-[var(--sage)]">
                          Contas no periodo
                        </p>
                        <p className="mt-3 text-2xl font-semibold text-[var(--forest)]">
                          {table.totalAccounts}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.68)]">
                          {table.closedAccounts} fechadas e {table.cancelledAccounts} canceladas.
                        </p>
                      </div>
                      <div className="rounded-[1.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.72)] p-4">
                        <p className="text-xs uppercase tracking-[0.22em] text-[var(--sage)]">
                          Valor movimentado
                        </p>
                        <p className="mt-3 text-2xl font-semibold text-[var(--forest)]">
                          {formatCurrency(table.grossSales)}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.68)]">
                          Baseado apenas nas comandas fechadas da mesa.
                        </p>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <article className="rounded-[1.6rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.5)] p-6">
                  <p className="text-lg font-semibold text-[var(--forest)]">
                    Nenhum dado de ocupacao neste periodo
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                    O relatorio de mesas comeca a ser preenchido assim que as comandas forem abertas e fechadas no sistema.
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
