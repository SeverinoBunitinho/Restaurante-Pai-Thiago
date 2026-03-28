import Link from "next/link";
import {
  Activity,
  Calculator,
  Download,
  TrendingUp,
  WalletCards,
} from "lucide-react";

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

function formatShortDate(value) {
  const parsed = new Date(value ?? "");

  if (Number.isNaN(parsed.getTime())) {
    return "--/--";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(parsed);
}

function compactChartItems(items = [], limit = 4, fallbackLabel = "Outros") {
  if (items.length <= limit) {
    return items;
  }

  const pinned = items.slice(0, limit - 1);
  const overflow = items.slice(limit - 1);
  const overflowValue = overflow.reduce(
    (accumulator, entry) => accumulator + Number(entry.value ?? 0),
    0,
  );

  return [
    ...pinned,
    {
      label: fallbackLabel,
      value: overflowValue,
      tone: "rgba(20,35,29,0.45)",
    },
  ];
}

function RevenueTrendChart({ timeline = [] }) {
  if (!timeline.length) {
    return (
      <article className="rounded-[1.7rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.5)] p-6">
        <p className="text-lg font-semibold text-[var(--forest)]">
          Tendencia indisponivel neste periodo
        </p>
        <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
          Assim que houver contas fechadas, o grafico de faturamento diario aparece aqui.
        </p>
      </article>
    );
  }

  const entries = timeline
    .slice()
    .sort((left, right) =>
      String(left.date).localeCompare(String(right.date), "pt-BR"),
    )
    .slice(-14);
  const values = entries.map((entry) => Number(entry.revenue ?? 0));
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const range = Math.max(1, maxValue - minValue);

  const width = 700;
  const height = 260;
  const padding = { top: 20, right: 26, bottom: 34, left: 16 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const baseline = padding.top + chartHeight;

  const points = entries.map((entry, index) => {
    const x =
      entries.length === 1
        ? padding.left + chartWidth / 2
        : padding.left + (index / (entries.length - 1)) * chartWidth;
    const y =
      baseline - ((Number(entry.revenue ?? 0) - minValue) / range) * chartHeight;

    return {
      x,
      y,
      date: entry.date,
      revenue: Number(entry.revenue ?? 0),
      closedChecks: Number(entry.closedChecks ?? 0),
    };
  });

  const polylinePoints = points.map((point) => `${point.x},${point.y}`).join(" ");
  const areaPath = [
    `M ${points[0].x} ${baseline}`,
    ...points.map((point) => `L ${point.x} ${point.y}`),
    `L ${points[points.length - 1].x} ${baseline}`,
    "Z",
  ].join(" ");

  const labelIndexes = Array.from(
    new Set([0, Math.floor((entries.length - 1) / 2), entries.length - 1]),
  );
  const peakPoint = points.reduce((currentPeak, point) =>
    point.revenue > currentPeak.revenue ? point : currentPeak,
  );
  const latestPoint = points[points.length - 1];

  return (
    <article className="rounded-[1.7rem] border border-[rgba(20,35,29,0.1)] bg-[rgba(255,255,255,0.68)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sage)]">
            Faturamento diario
          </p>
          <p className="mt-2 text-xl font-semibold text-[var(--forest)]">
            {formatCurrency(latestPoint.revenue)} no ultimo dia do periodo
          </p>
        </div>
        <span className="rounded-full border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.84)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--forest)]">
          Pico: {formatCurrency(peakPoint.revenue)}
        </span>
      </div>

      <div className="mt-5 overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[16.5rem] min-w-[34rem] w-full"
          role="img"
          aria-label="Grafico de tendencia de faturamento diario"
        >
          <defs>
            <linearGradient id="reportsTrendFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(95,123,109,0.36)" />
              <stop offset="100%" stopColor="rgba(95,123,109,0.04)" />
            </linearGradient>
            <linearGradient id="reportsTrendLine" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#5f7b6d" />
              <stop offset="65%" stopColor="#b68742" />
              <stop offset="100%" stopColor="#8a5d3b" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + ratio * chartHeight;
            return (
              <line
                key={`grid-${ratio}`}
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                stroke="rgba(20,35,29,0.09)"
                strokeDasharray="4 7"
              />
            );
          })}

          <path d={areaPath} fill="url(#reportsTrendFill)" />
          <polyline
            fill="none"
            points={polylinePoints}
            stroke="url(#reportsTrendLine)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((point, index) => (
            <circle
              key={`point-${point.date}`}
              cx={point.x}
              cy={point.y}
              r={index === points.length - 1 ? 6 : 4}
              fill={index === points.length - 1 ? "var(--gold)" : "var(--forest)"}
              opacity={index === points.length - 1 ? 1 : 0.68}
            />
          ))}

          {labelIndexes.map((index) => (
            <text
              key={`label-${points[index].date}`}
              x={points[index].x}
              y={height - 8}
              textAnchor="middle"
              fill="rgba(21,35,29,0.72)"
              fontSize="12"
              fontWeight="700"
              letterSpacing="0.08em"
            >
              {formatShortDate(points[index].date)}
            </text>
          ))}
        </svg>
      </div>
    </article>
  );
}

function DonutBreakdownCard({
  title,
  description,
  slices = [],
  centerLabel = "Total",
}) {
  const safeSlices = slices.filter((slice) => Number(slice.value ?? 0) > 0);
  const total = safeSlices.reduce(
    (accumulator, slice) => accumulator + Number(slice.value ?? 0),
    0,
  );

  if (!total) {
    return (
      <article className="rounded-[1.7rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.5)] p-5">
        <p className="text-base font-semibold text-[var(--forest)]">{title}</p>
        <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
          Sem dados suficientes para montar o grafico neste periodo.
        </p>
      </article>
    );
  }

  const gradientStops = safeSlices.map((slice, index) => {
    const currentValue = Number(slice.value ?? 0);
    const cumulativeBefore = safeSlices
      .slice(0, index)
      .reduce(
        (accumulator, currentSlice) =>
          accumulator + Number(currentSlice.value ?? 0),
        0,
      );
    const start = (cumulativeBefore / total) * 100;
    const end = ((cumulativeBefore + currentValue) / total) * 100;

    return `${slice.tone} ${start}% ${end}%`;
  });

  return (
    <article className="rounded-[1.7rem] border border-[rgba(20,35,29,0.1)] bg-[rgba(255,255,255,0.68)] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sage)]">
        {title}
      </p>
      <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.76)]">
        {description}
      </p>

      <div className="mt-5 flex items-center gap-4">
        <div className="relative h-28 w-28 shrink-0">
          <div
            className="absolute inset-0 rounded-full border border-[rgba(20,35,29,0.1)]"
            style={{ background: `conic-gradient(${gradientStops.join(", ")})` }}
          />
          <div className="absolute inset-[20%] flex items-center justify-center rounded-full border border-[rgba(20,35,29,0.1)] bg-[rgba(255,255,255,0.9)]">
            <div className="text-center">
              <p className="text-lg font-semibold text-[var(--forest)]">{total}</p>
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-[var(--sage)]">
                {centerLabel}
              </p>
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          {safeSlices.map((slice) => {
            const value = Number(slice.value ?? 0);
            const share = (value / total) * 100;
            return (
              <div key={`${title}-${slice.label}`} className="flex items-center justify-between gap-2 text-sm">
                <span className="inline-flex items-center gap-2 text-[rgba(21,35,29,0.78)]">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: slice.tone }}
                  />
                  <span className="truncate">{slice.label}</span>
                </span>
                <span className="shrink-0 font-semibold text-[var(--forest)]">
                  {share.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}

function RankingBarsCard({
  title,
  description,
  items = [],
  valueFormatter = (value) => String(value),
  emptyTitle,
  emptyDescription,
}) {
  if (!items.length) {
    return (
      <article className="rounded-[1.7rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.5)] p-5">
        <p className="text-base font-semibold text-[var(--forest)]">
          {emptyTitle || title}
        </p>
        <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
          {emptyDescription || "Sem base para o ranking neste periodo."}
        </p>
      </article>
    );
  }

  const maxValue = Math.max(...items.map((item) => Number(item.value ?? 0)), 1);

  return (
    <article className="rounded-[1.7rem] border border-[rgba(20,35,29,0.1)] bg-[rgba(255,255,255,0.68)] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sage)]">
        {title}
      </p>
      <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.76)]">
        {description}
      </p>

      <div className="mt-5 space-y-4">
        {items.map((item) => {
          const rawValue = Number(item.value ?? 0);
          const widthPercent = rawValue > 0 ? Math.max(10, (rawValue / maxValue) * 100) : 2;

          return (
            <div key={`${title}-${item.label}`} className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[var(--forest)]">{item.label}</p>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgba(21,35,29,0.68)]">
                  {valueFormatter(rawValue)}
                </p>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-[rgba(20,35,29,0.08)]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${widthPercent}%`,
                    background:
                      item.tone || "linear-gradient(90deg, rgba(95,123,109,0.92), rgba(182,135,66,0.92))",
                  }}
                />
              </div>
              {item.meta ? (
                <p className="text-xs leading-5 text-[rgba(21,35,29,0.64)]">{item.meta}</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </article>
  );
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

function WaiterDailyPerformanceChart({
  waiterName = "",
  dailySeries = [],
  selectedRate = 10,
}) {
  if (!dailySeries.length) {
    return (
      <article className="rounded-[1.6rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.5)] p-5">
        <p className="text-base font-semibold text-[var(--forest)]">
          Sem historico diario deste garcom no periodo
        </p>
        <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
          Assim que ele fechar contas, o grafico individual aparece automaticamente.
        </p>
      </article>
    );
  }

  const entries = dailySeries
    .slice()
    .sort((left, right) =>
      String(left.date).localeCompare(String(right.date), "pt-BR"),
    )
    .slice(-14)
    .map((entry) => ({
      date: entry.date,
      revenue: Number(entry.revenue ?? 0),
      commission: Number(entry.commission ?? 0),
      closedChecks: Number(entry.closedChecks ?? 0),
    }));
  const maxRevenue = Math.max(...entries.map((entry) => entry.revenue), 1);
  const maxCommission = Math.max(...entries.map((entry) => entry.commission), 1);
  const totalRevenue = entries.reduce(
    (accumulator, entry) => accumulator + entry.revenue,
    0,
  );
  const totalCommission = entries.reduce(
    (accumulator, entry) => accumulator + entry.commission,
    0,
  );
  const totalClosedChecks = entries.reduce(
    (accumulator, entry) => accumulator + entry.closedChecks,
    0,
  );
  const width = 680;
  const height = 240;
  const padding = { top: 22, right: 24, bottom: 36, left: 22 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const baseline = padding.top + chartHeight;
  const step = entries.length === 1 ? chartWidth : chartWidth / (entries.length - 1);
  const barWidth = Math.min(24, Math.max(8, step * 0.42));

  const revenuePoints = entries.map((entry, index) => ({
    x: entries.length === 1 ? padding.left + chartWidth / 2 : padding.left + index * step,
    y: baseline - (entry.revenue / maxRevenue) * chartHeight,
    ...entry,
  }));
  const commissionPoints = entries.map((entry, index) => ({
    x: entries.length === 1 ? padding.left + chartWidth / 2 : padding.left + index * step,
    y: baseline - (entry.commission / maxCommission) * chartHeight,
    ...entry,
  }));
  const commissionPolyline = commissionPoints
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  return (
    <article className="rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.72)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sage)]">
            Historico individual
          </p>
          <h3 className="mt-2 text-lg font-semibold text-[var(--forest)]">
            {waiterName}
          </h3>
          <p className="mt-1 text-sm leading-6 text-[rgba(21,35,29,0.68)]">
            Receita e comissao diaria no periodo filtrado.
          </p>
        </div>
        <span className="rounded-full border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.84)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--forest)]">
          Regra simulada: {selectedRate}%
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[1rem] border border-[rgba(20,35,29,0.09)] bg-[rgba(255,255,255,0.82)] px-3 py-2.5">
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-[var(--sage)]">
            Total vendido
          </p>
          <p className="mt-1 text-lg font-semibold text-[var(--forest)]">
            {formatCurrency(totalRevenue)}
          </p>
        </div>
        <div className="rounded-[1rem] border border-[rgba(20,35,29,0.09)] bg-[rgba(255,255,255,0.82)] px-3 py-2.5">
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-[var(--sage)]">
            Comissao acumulada
          </p>
          <p className="mt-1 text-lg font-semibold text-[var(--forest)]">
            {formatCurrency(totalCommission)}
          </p>
        </div>
        <div className="rounded-[1rem] border border-[rgba(20,35,29,0.09)] bg-[rgba(255,255,255,0.82)] px-3 py-2.5">
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-[var(--sage)]">
            Fechamentos
          </p>
          <p className="mt-1 text-lg font-semibold text-[var(--forest)]">
            {totalClosedChecks}
          </p>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[15rem] min-w-[34rem] w-full"
          role="img"
          aria-label={`Grafico diario de ${waiterName}`}
        >
          <defs>
            <linearGradient id="waiterRevenueBars" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(95,123,109,0.92)" />
              <stop offset="100%" stopColor="rgba(95,123,109,0.35)" />
            </linearGradient>
            <linearGradient id="waiterCommissionLine" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#b68742" />
              <stop offset="100%" stopColor="#8a5d3b" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + ratio * chartHeight;
            return (
              <line
                key={`wg-grid-${ratio}`}
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                stroke="rgba(20,35,29,0.08)"
                strokeDasharray="4 7"
              />
            );
          })}

          {revenuePoints.map((point) => {
            const barHeight = Math.max(2, baseline - point.y);
            return (
              <rect
                key={`wg-bar-${point.date}`}
                x={point.x - barWidth / 2}
                y={baseline - barHeight}
                width={barWidth}
                height={barHeight}
                rx="6"
                fill="url(#waiterRevenueBars)"
              />
            );
          })}

          <polyline
            fill="none"
            points={commissionPolyline}
            stroke="url(#waiterCommissionLine)"
            strokeWidth="3.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {commissionPoints.map((point) => (
            <circle
              key={`wg-point-${point.date}`}
              cx={point.x}
              cy={point.y}
              r="3.8"
              fill="var(--gold)"
            />
          ))}

          {revenuePoints.map((point, index) => {
            if (
              !(
                index === 0 ||
                index === revenuePoints.length - 1 ||
                index === Math.floor((revenuePoints.length - 1) / 2)
              )
            ) {
              return null;
            }

            return (
              <text
                key={`wg-label-${point.date}`}
                x={point.x}
                y={height - 9}
                textAnchor="middle"
                fill="rgba(21,35,29,0.72)"
                fontSize="12"
                fontWeight="700"
                letterSpacing="0.08em"
              >
                {formatShortDate(point.date)}
              </text>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs leading-5 text-[rgba(21,35,29,0.64)]">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[rgba(95,123,109,0.88)]" />
          Barras: receita diaria
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--gold)]" />
          Linha: comissao diaria
        </span>
      </div>
    </article>
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
  const selectedWaiterSeries = selectedWaiter
    ? (
        board.waiterDailySeries.find(
          (entry) => entry.userId === selectedWaiter.userId,
        )?.series ?? []
      )
    : [];
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
  const calculationDeltaLabel =
    calculationDelta === 0
      ? "Sem diferenca para o valor atual."
      : calculationDelta > 0
        ? `Aumento previsto de ${formatCurrency(calculationDelta)} em relacao ao valor atual.`
        : `Reducao prevista de ${formatCurrency(Math.abs(calculationDelta))} em relacao ao valor atual.`;
  const calculationDeltaBadgeClass =
    calculationDelta > 0
      ? "border-[rgba(182,135,66,0.28)] bg-[rgba(182,135,66,0.1)] text-[var(--gold)]"
      : calculationDelta < 0
        ? "border-[rgba(138,93,59,0.26)] bg-[rgba(138,93,59,0.1)] text-[var(--clay)]"
        : "border-[rgba(95,123,109,0.24)] bg-[rgba(95,123,109,0.1)] text-[var(--sage)]";
  const exportHref =
    board.period === "custom" && board.startDate && board.endDate
      ? `/api/operacao/relatorios/export?period=custom&start=${board.startDate}&end=${board.endDate}`
      : `/api/operacao/relatorios/export?period=${board.period}`;
  const exportJsonHref = `${exportHref}&format=json`;
  const chartPalette = [
    "#5f7b6d",
    "#1f8b7a",
    "#b68742",
    "#8a5d3b",
    "#7f968b",
    "#d9b97a",
  ];

  const timelineRevenue = board.financialTimeline.reduce(
    (accumulator, entry) => accumulator + Number(entry.revenue ?? 0),
    0,
  );
  const timelineClosedChecks = board.financialTimeline.reduce(
    (accumulator, entry) => accumulator + Number(entry.closedChecks ?? 0),
    0,
  );
  const waiterGrossSales = board.waiterCommissions.reduce(
    (accumulator, waiter) => accumulator + Number(waiter.grossSales ?? 0),
    0,
  );
  const waiterClosedChecks = board.waiterCommissions.reduce(
    (accumulator, waiter) => accumulator + Number(waiter.closedChecks ?? 0),
    0,
  );
  const totalRevenue = timelineRevenue || waiterGrossSales;
  const totalClosedChecks = timelineClosedChecks || waiterClosedChecks;
  const totalCommission = board.waiterCommissions.reduce(
    (accumulator, waiter) => accumulator + Number(waiter.commissionAmount ?? 0),
    0,
  );
  const estimatedNetResult = totalRevenue - totalCommission;
  const averageTicket = totalClosedChecks ? totalRevenue / totalClosedChecks : 0;
  const activeTablesCount = board.tableOccupancy.length;
  const occupiedTablesNow = board.tableOccupancy.filter(
    (table) => Number(table.openAccounts ?? 0) > 0,
  ).length;
  const tablesWithMovement = board.tableOccupancy.filter(
    (table) => Number(table.totalAccounts ?? 0) > 0,
  ).length;
  const idleTables = Math.max(0, activeTablesCount - tablesWithMovement);

  const areaPerformanceMap = new Map();
  for (const table of board.tableOccupancy) {
    const areaName = table.area || "Sem area";
    const current = areaPerformanceMap.get(areaName) ?? {
      area: areaName,
      revenue: 0,
      accounts: 0,
      openNow: 0,
      tables: 0,
    };

    current.revenue += Number(table.grossSales ?? 0);
    current.accounts += Number(table.totalAccounts ?? 0);
    current.openNow += Number(table.openAccounts ?? 0);
    current.tables += 1;
    areaPerformanceMap.set(areaName, current);
  }

  const areaPerformance = Array.from(areaPerformanceMap.values()).sort(
    (left, right) => {
      if (right.revenue !== left.revenue) {
        return right.revenue - left.revenue;
      }

      return right.accounts - left.accounts;
    },
  );

  const areaRevenueSlices = compactChartItems(
    areaPerformance.map((area, index) => ({
      label: area.area,
      value: area.revenue,
      tone: chartPalette[index % chartPalette.length],
    })),
    5,
    "Outras areas",
  );

  const tableStatusSlices = compactChartItems(
    [
      {
        label: "Ocupadas agora",
        value: occupiedTablesNow,
        tone: "#b68742",
      },
      {
        label: "Livres com giro",
        value: Math.max(0, tablesWithMovement - occupiedTablesNow),
        tone: "#5f7b6d",
      },
      {
        label: "Sem giro",
        value: idleTables,
        tone: "#8a5d3b",
      },
    ],
    4,
  );

  const waiterCommissionRanking = board.waiterCommissions
    .slice(0, 6)
    .map((waiter, index) => ({
      label: waiter.fullName,
      value: Number(waiter.commissionAmount ?? 0),
      meta: `${waiter.closedChecks} fechamento(s)`,
      tone: `linear-gradient(90deg, ${chartPalette[index % chartPalette.length]}, rgba(20,35,29,0.9))`,
    }));

  const areaAccountsRanking = areaPerformance
    .slice()
    .sort((left, right) => right.accounts - left.accounts)
    .slice(0, 6)
    .map((area, index) => ({
      label: area.area,
      value: Number(area.accounts ?? 0),
      meta: `${area.tables} mesa(s) ativa(s) no setor`,
      tone: `linear-gradient(90deg, ${chartPalette[index % chartPalette.length]}, rgba(20,35,29,0.84))`,
    }));

  const dashboardHighlights = [
    {
      icon: WalletCards,
      label: "Faturamento",
      value: formatCurrency(totalRevenue),
      note: `${totalClosedChecks} conta(s) fechada(s) no periodo`,
      cardClass:
        "bg-gradient-to-br from-[rgba(95,123,109,0.9)] to-[rgba(36,58,50,0.96)] text-white border-[rgba(95,123,109,0.3)]",
      noteClass: "text-[rgba(244,240,232,0.82)]",
    },
    {
      icon: Calculator,
      label: "Comissao prevista",
      value: formatCurrency(totalCommission),
      note: `${board.commissionRate}% de regra atual`,
      cardClass:
        "bg-gradient-to-br from-[rgba(182,135,66,0.92)] to-[rgba(138,93,59,0.92)] text-white border-[rgba(182,135,66,0.34)]",
      noteClass: "text-[rgba(255,247,232,0.86)]",
    },
    {
      icon: TrendingUp,
      label: "Resultado liquido",
      value: formatCurrency(estimatedNetResult),
      note: `Ticket medio: ${formatCurrency(averageTicket)}`,
      cardClass:
        "bg-gradient-to-br from-[rgba(20,35,29,0.94)] to-[rgba(42,64,54,0.96)] text-white border-[rgba(217,185,122,0.24)]",
      noteClass: "text-[rgba(255,247,232,0.82)]",
    },
    {
      icon: Activity,
      label: "Mesas ocupadas agora",
      value: `${occupiedTablesNow} / ${activeTablesCount}`,
      note: `${tablesWithMovement} mesa(s) tiveram giro no periodo`,
      cardClass:
        "bg-gradient-to-br from-[rgba(255,255,255,0.88)] to-[rgba(247,239,227,0.92)] text-[var(--forest)] border-[rgba(20,35,29,0.12)]",
      noteClass: "text-[rgba(21,35,29,0.7)]",
    },
  ];

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
                title="Comissao por garcom com calculo por dia, semana, mes e ano"
                description="Selecione o periodo e o profissional para calcular, comparar e fechar a comissao com leitura clara."
                compact
              />

              <div className="mt-6 rounded-[1.4rem] border border-[rgba(20,35,29,0.1)] bg-[rgba(255,255,255,0.62)] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sage)]">
                  Periodo ativo
                </p>
                <p className="mt-2 text-base font-semibold text-[var(--forest)]">
                  {board.periodLabel}
                </p>
                <p className="mt-1 text-sm leading-6 text-[rgba(21,35,29,0.68)]">
                  {selectedWaiter
                    ? `Garcom selecionado: ${selectedWaiter.fullName}`
                    : "Selecione um garcom para abrir o calculo individual."}
                </p>
              </div>

              <form
                method="get"
                className="mt-5 grid gap-4 rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.56)] p-4 md:grid-cols-2"
              >
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
                <button
                  type="submit"
                  className="button-primary w-full justify-center md:col-span-2"
                >
                  <Calculator size={16} />
                  Calcular comissao
                </button>
              </form>

              {selectedWaiter ? (
                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
                    <p
                      className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.16em] ${calculationDeltaBadgeClass}`}
                    >
                      Delta: {formatCurrency(calculationDelta)}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.68)]">
                      {calculationDeltaLabel}
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

              {selectedWaiter ? (
                <div className="mt-6">
                  <WaiterDailyPerformanceChart
                    waiterName={selectedWaiter.fullName}
                    dailySeries={selectedWaiterSeries}
                    selectedRate={calculatorRate}
                  />
                </div>
              ) : null}
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

      {activeTab === "overview" ? (
        <section className="pt-14">
          <div className="luxury-card rounded-[2.2rem] p-6">
            <SectionHeading
              eyebrow="Dashboard executivo"
              title="Painel visual de faturamento, comissao e ocupacao"
              description="Leitura em estilo dashboard para gerente e dono decidirem rapido sem sair da operacao."
              compact
            />

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {dashboardHighlights.map((item) => (
                <article
                  key={item.label}
                  className={`rounded-[1.6rem] border p-5 shadow-[0_14px_30px_rgba(20,35,29,0.08)] ${item.cardClass}`}
                >
                  <item.icon size={18} />
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] opacity-90">
                    {item.label}
                  </p>
                  <p className="mt-2 text-[1.75rem] font-semibold leading-tight">
                    {item.value}
                  </p>
                  <p className={`mt-2 text-sm leading-6 ${item.noteClass}`}>
                    {item.note}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-6 grid gap-5 xl:grid-cols-[1.24fr_0.76fr]">
              <RevenueTrendChart timeline={board.financialTimeline} />

              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
                <DonutBreakdownCard
                  title="Receita por area"
                  description="Divisao de faturamento entre os setores da casa."
                  slices={areaRevenueSlices}
                  centerLabel="setores"
                />
                <DonutBreakdownCard
                  title="Status das mesas"
                  description="Leitura imediata de ocupacao e giro no periodo."
                  slices={tableStatusSlices}
                  centerLabel="mesas"
                />
              </div>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-2">
              <RankingBarsCard
                title="Comissao por garcom"
                description="Comparativo por valor acumulado no periodo filtrado."
                items={waiterCommissionRanking}
                valueFormatter={(value) => formatCurrency(value)}
                emptyTitle="Sem comissao para exibir"
                emptyDescription="Feche comandas com garcom responsavel para montar o grafico."
              />
              <RankingBarsCard
                title="Giro de contas por area"
                description="Quantidade de contas abertas no periodo por setor."
                items={areaAccountsRanking}
                valueFormatter={(value) => `${value} conta(s)`}
                emptyTitle="Sem giro por setor neste periodo"
                emptyDescription="A leitura por area aparece conforme as contas forem abertas."
              />
            </div>

            <details className="mt-6 rounded-[1.4rem] border border-[rgba(20,35,29,0.1)] bg-[rgba(255,255,255,0.62)] px-4 py-3">
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.18em] text-[var(--forest)]">
                Ver detalhes completos de garcons e mesas
              </summary>
              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <WaiterCommissionsList waiterCommissions={board.waiterCommissions} />
                <OccupancyList tableOccupancy={board.tableOccupancy} />
              </div>
            </details>
          </div>
        </section>
      ) : null}

      {activeTab === "occupancy" ? (
        <section className="pt-14">
          <div className="grid gap-5 xl:grid-cols-[0.86fr_1.14fr]">
            <div className="luxury-card rounded-[2.2rem] p-6">
              <SectionHeading
                eyebrow="Radar de ocupacao"
                title="Setores, giro e mesas no mesmo painel"
                description="Visao compacta para enxergar gargalos antes de abrir novas reservas."
                compact
              />

              <div className="mt-8 space-y-5">
                <DonutBreakdownCard
                  title="Distribuicao de contas por area"
                  description="Percentual de movimentacao entre os setores."
                  slices={compactChartItems(
                    areaPerformance
                      .slice()
                      .sort((left, right) => right.accounts - left.accounts)
                      .map((area, index) => ({
                        label: area.area,
                        value: area.accounts,
                        tone: chartPalette[index % chartPalette.length],
                      })),
                    5,
                    "Outros setores",
                  )}
                  centerLabel="contas"
                />
                <RankingBarsCard
                  title="Mesas em giro"
                  description="Ranking por volume de contas abertas no periodo."
                  items={board.tableOccupancy.slice(0, 8).map((table, index) => ({
                    label: `${table.name} (${table.area})`,
                    value: Number(table.totalAccounts ?? 0),
                    meta: `${table.closedAccounts} fechada(s) | ${formatCurrency(
                      Number(table.grossSales ?? 0),
                    )}`,
                    tone: `linear-gradient(90deg, ${chartPalette[index % chartPalette.length]}, rgba(20,35,29,0.84))`,
                  }))}
                  valueFormatter={(value) => `${value} conta(s)`}
                  emptyTitle="Sem giro de mesas no periodo"
                  emptyDescription="As mesas entram no ranking assim que recebem atendimento."
                />
              </div>
            </div>

            <div className="luxury-card rounded-[2.2rem] p-6">
              <SectionHeading
                eyebrow="Ocupacao"
                title="Leitura completa por mesa"
                description="Analise por mesa para tomada de decisao de operacao e capacidade."
                compact
              />
              <div className="mt-8">
                <OccupancyList tableOccupancy={board.tableOccupancy} />
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
