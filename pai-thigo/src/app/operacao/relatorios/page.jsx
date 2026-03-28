import Link from "next/link";
import { Calculator, Download, TrendingUp, WalletCards } from "lucide-react";

import { SectionHeading } from "@/components/section-heading";
import { getServiceReportsBoard, reportPeriodOptions } from "@/lib/checks-data";
import { requireRole } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";

const reportTabOptions = [
  { value: "overview", label: "Visao geral" },
  { value: "commissions", label: "Comissao por garcom" },
  { value: "occupancy", label: "Ocupacao de mesas" },
];

function formatDateTime(value) {
  const parsed = new Date(value ?? "");

  if (Number.isNaN(parsed.getTime())) {
    return "Sem fechamento registrado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(parsed);
}

function normalizeActiveTab(value) {
  const normalized = String(value ?? "").trim().toLowerCase();

  return reportTabOptions.some((item) => item.value === normalized)
    ? normalized
    : "overview";
}

function parseCommissionRate(value, fallbackRate) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  const safeFallback = Number.isFinite(Number(fallbackRate))
    ? Number(fallbackRate)
    : 10;

  if (!Number.isFinite(parsed)) {
    return safeFallback;
  }

  return Math.max(0, Math.min(100, parsed));
}

function buildReportsHref({
  tab,
  period,
  startDate,
  endDate,
  waiterId,
  calculatorRate,
}) {
  const params = new URLSearchParams();
  const safeTab = normalizeActiveTab(tab);

  if (safeTab !== "overview") {
    params.set("tab", safeTab);
  }

  if (period) {
    params.set("period", period);
  }

  if (period === "custom" && startDate && endDate) {
    params.set("start", startDate);
    params.set("end", endDate);
  }

  if (waiterId) {
    params.set("waiter", waiterId);
  }

  if (calculatorRate !== "" && calculatorRate != null) {
    params.set("rate", String(calculatorRate));
  }

  const query = params.toString();

  return query ? `/operacao/relatorios?${query}` : "/operacao/relatorios";
}

function WaiterCommissionsChart({
  waiterCommissions = [],
  selectedWaiterId = "",
}) {
  if (!waiterCommissions.length) {
    return (
      <article className="rounded-[1.6rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.5)] p-6">
        <p className="text-lg font-semibold text-[var(--forest)]">
          Grafico indisponivel neste periodo
        </p>
        <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
          Feche comandas com garcom responsavel para visualizar a comissao em barras.
        </p>
      </article>
    );
  }

  const sortedWaiters = waiterCommissions
    .slice()
    .sort(
      (left, right) =>
        Number(right.commissionAmount ?? 0) - Number(left.commissionAmount ?? 0),
    );
  const maxCommission = Math.max(
    ...sortedWaiters.map((waiter) => Number(waiter.commissionAmount ?? 0)),
    0,
  );
  const safeMaxCommission = maxCommission > 0 ? maxCommission : 1;
  const totalCommission = sortedWaiters.reduce(
    (accumulator, waiter) =>
      accumulator + Number(waiter.commissionAmount ?? 0),
    0,
  );

  return (
    <div className="space-y-3">
      {sortedWaiters.map((waiter) => {
        const commissionAmount = Number(waiter.commissionAmount ?? 0);
        const widthRatio = Math.max(
          0,
          Math.min(1, commissionAmount / safeMaxCommission),
        );
        const barWidthPercent = commissionAmount > 0 ? Math.max(8, widthRatio * 100) : 2;
        const sharePercent =
          totalCommission > 0
            ? (commissionAmount / totalCommission) * 100
            : 0;
        const isSelected = waiter.userId === selectedWaiterId;

        return (
          <article
            key={`chart-${waiter.userId}`}
            className={`rounded-[1.4rem] border p-4 ${
              isSelected
                ? "border-[rgba(182,135,66,0.28)] bg-[rgba(182,135,66,0.08)]"
                : "border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.62)]"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[var(--forest)]">
                {waiter.fullName}
              </p>
              <span className="rounded-full border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.84)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--forest)]">
                {formatCurrency(commissionAmount)}
              </span>
            </div>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[rgba(20,35,29,0.08)]">
              <div
                className={`h-full rounded-full ${
                  isSelected
                    ? "bg-gradient-to-r from-[var(--gold)] to-[var(--clay)]"
                    : "bg-gradient-to-r from-[var(--sage)] to-[var(--gold)]"
                }`}
                style={{ width: `${barWidthPercent}%` }}
              />
            </div>

            <p className="mt-2 text-xs leading-5 text-[rgba(21,35,29,0.68)]">
              {waiter.closedChecks} fechamento(s) |{" "}
              {sharePercent.toFixed(1).replace(".", ",")}% da comissao do periodo
            </p>
          </article>
        );
      })}
    </div>
  );
}

function WaiterCommissionsList({ waiterCommissions = [] }) {
  if (!waiterCommissions.length) {
    return (
      <article className="rounded-[1.6rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.5)] p-6">
        <p className="text-lg font-semibold text-[var(--forest)]">
          Nenhuma comissao calculada neste periodo
        </p>
        <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
          Assim que os garcons fecharem comandas, a comissao aparece aqui automaticamente.
        </p>
      </article>
    );
  }

  return (
    <div className="space-y-4">
      {waiterCommissions.map((waiter) => (
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
            Ultimo fechamento contabilizado em {formatDateTime(waiter.lastCloseAt)}.
          </p>
        </article>
      ))}
    </div>
  );
}

function OccupancyList({ tableOccupancy = [] }) {
  if (!tableOccupancy.length) {
    return (
      <article className="rounded-[1.6rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.5)] p-6">
        <p className="text-lg font-semibold text-[var(--forest)]">
          Nenhum dado de ocupacao neste periodo
        </p>
        <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
          O relatorio de mesas comeca a ser preenchido assim que as comandas forem abertas e fechadas no sistema.
        </p>
      </article>
    );
  }

  return (
    <div className="space-y-4">
      {tableOccupancy.map((table) => (
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
      ))}
    </div>
  );
}

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
  const tab = Array.isArray(resolvedSearchParams?.tab)
    ? resolvedSearchParams.tab[0]
    : resolvedSearchParams?.tab;
  const selectedWaiterIdFromQuery = Array.isArray(resolvedSearchParams?.waiter)
    ? resolvedSearchParams.waiter[0]
    : resolvedSearchParams?.waiter;
  const calculatorRateFromQuery = Array.isArray(resolvedSearchParams?.rate)
    ? resolvedSearchParams.rate[0]
    : resolvedSearchParams?.rate;

  const activeTab = normalizeActiveTab(tab);
  const board = await getServiceReportsBoard(period ?? "month", {
    startDate: startDate ?? "",
    endDate: endDate ?? "",
  });
  const selectedWaiter =
    board.waiterCommissions.find(
      (item) => item.userId === selectedWaiterIdFromQuery,
    ) ?? board.waiterCommissions[0] ?? null;
  const calculatorRate = parseCommissionRate(
    calculatorRateFromQuery,
    board.commissionRate,
  );
  const calculatedCommission = selectedWaiter
    ? selectedWaiter.grossSales * (calculatorRate / 100)
    : 0;
  const calculationDelta = selectedWaiter
    ? calculatedCommission - Number(selectedWaiter.commissionAmount ?? 0)
    : 0;
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
              title="Comissao por garcom com calculo por dia, semana, mes e ano"
              description="Gerente e dono acompanham desempenho do salao com ferramenta de comissao sem sair da operacao."
              compact
            />

            <div className="mt-6 flex flex-wrap gap-3">
              {reportTabOptions.map((item) => (
                <Link
                  key={item.value}
                  href={buildReportsHref({
                    tab: item.value,
                    period: board.period,
                    startDate: board.startDate,
                    endDate: board.endDate,
                    waiterId: selectedWaiter?.userId ?? "",
                    calculatorRate,
                  })}
                  className={`filter-chip ${activeTab === item.value ? "filter-chip-active" : ""}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {reportPeriodOptions.map((option) => (
                <Link
                  key={option.value}
                  href={
                    option.value === "custom"
                      ? buildReportsHref({
                          tab: activeTab,
                          period: "custom",
                          startDate: board.startDate,
                          endDate: board.endDate,
                          waiterId: selectedWaiter?.userId ?? "",
                          calculatorRate,
                        })
                      : buildReportsHref({
                          tab: activeTab,
                          period: option.value,
                          waiterId: selectedWaiter?.userId ?? "",
                          calculatorRate,
                        })
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
              <input type="hidden" name="tab" value={activeTab} />
              <input type="hidden" name="period" value="custom" />
              {selectedWaiter ? (
                <input type="hidden" name="waiter" value={selectedWaiter.userId} />
              ) : null}
              <input type="hidden" name="rate" value={calculatorRate} />
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
                  item.label.includes("Ticket") ||
                  item.label.includes("Resultado") ||
                  item.label.includes("Lucro")
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
              A aba de comissao usa contas fechadas por garcom no periodo filtrado.
              O calculo pode ser ajustado com taxa manual para simular cenarios de pagamento.
            </p>

            <div className="mt-8 grid gap-4">
              {[
                {
                  icon: WalletCards,
                  title: "Comissao por periodo",
                  text: "Filtre por dia, semana, mes ou ano para pagar a equipe com mais precisao.",
                },
                {
                  icon: Calculator,
                  title: "Calculadora integrada",
                  text: "Escolha o garcom, ajuste a taxa e compare comissao atual x simulada na hora.",
                },
                {
                  icon: TrendingUp,
                  title: "Leitura executiva rapida",
                  text: "Gerente e dono acompanham venda, comissao e ocupacao no mesmo painel.",
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

      {activeTab === "commissions" ? (
        <section className="pt-14">
          <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
            <div className="luxury-card rounded-[2.2rem] p-6">
              <SectionHeading
                eyebrow="Calculadora"
                title="Calcular comissao por garcom"
                description="Escolha o profissional e simule a taxa para fechar comissao do periodo."
                compact
              />

              <form method="get" className="mt-8 grid gap-4">
                <input type="hidden" name="tab" value="commissions" />
                <input type="hidden" name="period" value={board.period} />
                {board.period === "custom" && board.startDate && board.endDate ? (
                  <>
                    <input type="hidden" name="start" value={board.startDate} />
                    <input type="hidden" name="end" value={board.endDate} />
                  </>
                ) : null}
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--sage)]">
                    Garcom
                  </span>
                  <select
                    name="waiter"
                    defaultValue={selectedWaiter?.userId ?? ""}
                    className="rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 text-sm text-[var(--forest)] outline-none"
                  >
                    {board.waiterCommissions.length ? (
                      board.waiterCommissions.map((waiter) => (
                        <option key={waiter.userId} value={waiter.userId}>
                          {waiter.fullName}
                        </option>
                      ))
                    ) : (
                      <option value="">Sem garcom no periodo</option>
                    )}
                  </select>
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--sage)]">
                    Taxa de comissao (%)
                  </span>
                  <input
                    name="rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    defaultValue={calculatorRate}
                    className="rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 text-sm text-[var(--forest)] outline-none"
                  />
                </label>
                <button type="submit" className="button-primary w-full justify-center">
                  <Calculator size={16} />
                  Calcular comissao
                </button>
              </form>

              {selectedWaiter ? (
                <div className="mt-6 grid gap-3">
                  <article className="rounded-[1.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.72)] p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--sage)]">
                      Base de vendas do garcom
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--forest)]">
                      {formatCurrency(selectedWaiter.grossSales)}
                    </p>
                  </article>
                  <article className="rounded-[1.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.72)] p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--sage)]">
                      Comissao atual no sistema
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--forest)]">
                      {formatCurrency(selectedWaiter.commissionAmount)}
                    </p>
                  </article>
                  <article className="rounded-[1.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.72)] p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--sage)]">
                      Comissao calculada ({calculatorRate}%)
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--forest)]">
                      {formatCurrency(calculatedCommission)}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.68)]">
                      Diferenca para o valor atual: {formatCurrency(calculationDelta)}.
                    </p>
                  </article>
                </div>
              ) : (
                <article className="mt-6 rounded-[1.6rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.5)] p-6">
                  <p className="text-lg font-semibold text-[var(--forest)]">
                    Ainda sem base para calcular comissao
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                    Feche comandas com garcom responsavel para habilitar os calculos.
                  </p>
                </article>
              )}
            </div>

            <div className="luxury-card rounded-[2.2rem] p-6">
              <SectionHeading
                eyebrow="Grafico de comissoes"
                title="Comparativo por garcom no periodo"
                description="Visual rapido para dono e gerente acompanharem quem lidera em comissao."
                compact
              />

              <div className="mt-8">
                <WaiterCommissionsChart
                  waiterCommissions={board.waiterCommissions}
                  selectedWaiterId={selectedWaiter?.userId ?? ""}
                />
              </div>

              <details className="mt-6 rounded-[1.4rem] border border-[rgba(20,35,29,0.1)] bg-[rgba(255,255,255,0.62)] px-4 py-3">
                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.18em] text-[var(--forest)]">
                  Ver lista detalhada
                </summary>
                <div className="mt-4">
                  <WaiterCommissionsList waiterCommissions={board.waiterCommissions} />
                </div>
              </details>

              <div className="mt-4 rounded-[1.3rem] border border-[rgba(20,35,29,0.1)] bg-[rgba(255,255,255,0.72)] px-4 py-3 text-xs leading-6 text-[rgba(21,35,29,0.66)]">
                Dica: selecione um garcom na calculadora para destacar a barra dele no grafico.
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "overview" || activeTab === "occupancy" ? (
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
      ) : null}

      {activeTab === "overview" ? (
        <section className="pt-14">
          <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
            <div className="luxury-card rounded-[2.2rem] p-6">
              <SectionHeading
                eyebrow="Comissoes"
                title="Grafico de comissao por garcom"
                description="Visual em barras para comparar desempenho de cada garcom no periodo."
                compact
              />
              <div className="mt-8">
                <WaiterCommissionsChart
                  waiterCommissions={board.waiterCommissions}
                  selectedWaiterId={selectedWaiter?.userId ?? ""}
                />
              </div>
              <details className="mt-6 rounded-[1.4rem] border border-[rgba(20,35,29,0.1)] bg-[rgba(255,255,255,0.62)] px-4 py-3">
                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.18em] text-[var(--forest)]">
                  Ver lista detalhada
                </summary>
                <div className="mt-4">
                  <WaiterCommissionsList waiterCommissions={board.waiterCommissions} />
                </div>
              </details>
            </div>
            <div className="luxury-card rounded-[2.2rem] p-6">
              <SectionHeading
                eyebrow="Ocupacao"
                title="Leitura de giro por mesa"
                description="Um retrato do salao para perceber quais mesas giram mais e onde a operacao pode melhorar."
                compact
              />
              <div className="mt-8">
                <OccupancyList tableOccupancy={board.tableOccupancy} />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "occupancy" ? (
        <section className="pt-14">
          <div className="luxury-card rounded-[2.2rem] p-6">
            <SectionHeading
              eyebrow="Ocupacao"
              title="Leitura de giro por mesa"
              description="Analise por mesa para tomada de decisao de operacao e capacidade."
              compact
            />
            <div className="mt-8">
              <OccupancyList tableOccupancy={board.tableOccupancy} />
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
