import "server-only";

import { getMenuCategories } from "@/lib/site-data";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const serviceCheckStatusMeta = {
  open: {
    label: "Conta aberta",
    badge: "bg-[rgba(182,135,66,0.12)] text-[var(--gold)]",
  },
  closed: {
    label: "Conta fechada",
    badge: "bg-[rgba(95,123,109,0.12)] text-[var(--sage)]",
  },
  cancelled: {
    label: "Conta cancelada",
    badge: "bg-[rgba(138,93,59,0.12)] text-[var(--clay)]",
  },
};

export const reportPeriodOptions = [
  { value: "day", label: "Dia" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
  { value: "year", label: "Ano" },
  { value: "custom", label: "Periodo customizado" },
];

const reportPeriodAliases = {
  today: "day",
  "7d": "week",
  "30d": "month",
};

function getBrazilDateString() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getStartIsoForPeriod(period) {
  const now = new Date();

  if (period === "day") {
    return `${getBrazilDateString()}T00:00:00-03:00`;
  }

  const days = {
    week: 7,
    month: 30,
    year: 365,
    "90d": 90,
  }[period] ?? 30;

  const start = new Date(now);
  start.setDate(start.getDate() - days + 1);
  start.setHours(0, 0, 0, 0);

  return start.toISOString();
}

function getPeriodLabel(period, customStartDate = "", customEndDate = "") {
  if (period === "custom" && customStartDate && customEndDate) {
    return `${customStartDate} ate ${customEndDate}`;
  }

  const legacyPeriodLabelByValue = {
    "90d": "Ultimos 90 dias",
  };

  if (legacyPeriodLabelByValue[period]) {
    return legacyPeriodLabelByValue[period];
  }

  return (
    reportPeriodOptions.find((option) => option.value === period)?.label ??
    "Mes"
  );
}

function getBrazilDayKey(value) {
  const parsed = new Date(value ?? "");
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(parsed);
}

function isDateOnlyValid(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ""));
}

function resolveReportRange(period, customStartDate = "", customEndDate = "") {
  const resolvedPeriod = reportPeriodAliases[period] ?? period;
  const normalizedPeriod = reportPeriodOptions.some(
    (option) => option.value === resolvedPeriod,
  )
    ? resolvedPeriod
    : resolvedPeriod === "90d"
      ? "90d"
      : "month";

  if (
    normalizedPeriod === "custom" &&
    isDateOnlyValid(customStartDate) &&
    isDateOnlyValid(customEndDate) &&
    customStartDate <= customEndDate
  ) {
    return {
      period: "custom",
      startIso: `${customStartDate}T00:00:00-03:00`,
      endIso: `${customEndDate}T23:59:59-03:00`,
      startDate: customStartDate,
      endDate: customEndDate,
      periodLabel: getPeriodLabel("custom", customStartDate, customEndDate),
    };
  }

  return {
    period: normalizedPeriod === "custom" ? "month" : normalizedPeriod,
    startIso: getStartIsoForPeriod(normalizedPeriod === "custom" ? "month" : normalizedPeriod),
    endIso: "",
    startDate: "",
    endDate: "",
    periodLabel: getPeriodLabel(normalizedPeriod === "custom" ? "month" : normalizedPeriod),
  };
}

function normalizeTableQuery(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function extractDigits(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function matchTableByQuery(tables, query) {
  const normalizedQuery = normalizeTableQuery(query);

  if (!normalizedQuery) {
    return null;
  }

  const queryDigits = extractDigits(normalizedQuery);

  return (
    tables.find((table) => normalizeTableQuery(table.name) === normalizedQuery) ??
    tables.find((table) => normalizeTableQuery(table.area) === normalizedQuery) ??
    tables.find((table) => {
      if (!queryDigits) {
        return false;
      }

      const tableDigits = extractDigits(table.name);

      return (
        tableDigits === queryDigits ||
        Number(tableDigits || "0") === Number(queryDigits || "0")
      );
    }) ??
    tables.find((table) =>
      normalizeTableQuery(table.name).includes(normalizedQuery),
    ) ??
    null
  );
}

function mapTable(table) {
  return {
    id: table.id,
    name: table.name,
    area: table.area,
    capacity: table.capacity,
    isActive: table.is_active,
  };
}

function mapServiceCheckRow(check) {
  const items = (check.service_check_items ?? [])
    .map((item) => ({
      id: item.id,
      itemName: item.item_name,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
      totalPrice: Number(item.total_price),
      notes: item.notes ?? "",
      createdAt: item.created_at,
    }))
    .sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt));

  const subtotal =
    Number(check.subtotal ?? 0) ||
    items.reduce((total, item) => total + item.totalPrice, 0);
  const total = Number(check.total ?? 0) || subtotal;

  return {
    id: check.id,
    guestName: check.guest_name ?? "",
    notes: check.notes ?? "",
    status: check.status,
    openedAt: check.opened_at,
    closedAt: check.closed_at,
    cancelledAt: check.cancelled_at,
    paymentMethod: check.payment_method ?? "pix",
    subtotal,
    total,
    commissionRate: Number(check.commission_rate ?? 0),
    commissionAmount: Number(check.commission_amount ?? 0),
    reportReference: check.report_reference ?? "",
    table: check.table
      ? {
          id: check.table.id,
          name: check.table.name,
          area: check.table.area,
          capacity: check.table.capacity,
        }
      : null,
    openedBy: check.opened_by
      ? {
          userId: check.opened_by.user_id,
          fullName: check.opened_by.full_name,
          email: check.opened_by.email,
          role: check.opened_by.role,
        }
      : null,
    closedBy: check.closed_by
      ? {
          userId: check.closed_by.user_id,
          fullName: check.closed_by.full_name,
          email: check.closed_by.email,
          role: check.closed_by.role,
        }
      : null,
    cancelledBy: check.cancelled_by
      ? {
          userId: check.cancelled_by.user_id,
          fullName: check.cancelled_by.full_name,
          email: check.cancelled_by.email,
          role: check.cancelled_by.role,
        }
      : null,
    items,
    totalItems: items.reduce((totalItems, item) => totalItems + item.quantity, 0),
  };
}

function buildFallbackChecksBoard(searchQuery = "") {
  return {
    summary: [
      {
        label: "Contas abertas",
        value: "0",
        description: "A fila de comandas reaparece quando a operacao recuperar a leitura do banco.",
      },
      {
        label: "Fechadas hoje",
        value: "0",
        description: "Os fechamentos do turno voltam a aparecer quando o sistema sincronizar.",
      },
      {
        label: "Mesas ativas",
        value: "0",
        description: "A leitura de mesas e contas esta temporariamente em contingencia.",
      },
    ],
    tables: [],
    menuCategories: [],
    openChecks: [],
    selectedTable: null,
    selectedCheck: null,
    searchQuery,
    searchState: searchQuery ? "not-found" : "idle",
    usingSupabase: false,
  };
}

function buildFallbackReportsBoard(period, customStartDate = "", customEndDate = "") {
  const range = resolveReportRange(period, customStartDate, customEndDate);

  return {
    period: range.period,
    periodLabel: range.periodLabel,
    startDate: range.startDate,
    endDate: range.endDate,
    commissionRate: 10,
    summary: [
      {
        label: "Mesas em operacao",
        value: "0",
        description: "A leitura operacional volta quando o banco responder novamente.",
      },
      {
        label: "Contas fechadas",
        value: "0",
        description: "Os fechamentos do periodo reaparecem assim que a sincronizacao voltar.",
      },
      {
        label: "Faturamento em comandas",
        value: "0",
        description: "Total movimentado em contas fechadas no periodo.",
      },
      {
        label: "Comissao prevista",
        value: "0",
        description: "O calculo de comissao depende da camada de comandas em producao.",
      },
      {
        label: "Resultado liquido estimado",
        value: "0",
        description: "Faturamento menos comissao prevista da equipe.",
      },
    ],
    waiterCommissions: [],
    tableOccupancy: [],
    financialTimeline: [],
    liveOpenTablesCount: 0,
    usingSupabase: false,
  };
}

async function getCommissionRate(supabase) {
  const { data, error } = await supabase
    .from("restaurant_settings")
    .select("waiter_commission_rate")
    .eq("id", "main")
    .maybeSingle();

  if (error) {
    return 10;
  }

  return Number(data?.waiter_commission_rate ?? 10);
}

export async function getServiceChecksBoard(searchQuery = "") {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return buildFallbackChecksBoard(searchQuery);
  }

  const startOfToday = `${getBrazilDateString()}T00:00:00-03:00`;

  const [tablesResult, openChecksResult, todayClosedResult, menuCategories] =
    await Promise.all([
      supabase
        .from("restaurant_tables")
        .select("id, name, area, capacity, is_active")
        .order("area", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("service_checks")
        .select(
          "id, guest_name, notes, status, opened_at, closed_at, cancelled_at, payment_method, subtotal, total, commission_rate, commission_amount, report_reference, table:restaurant_tables!service_checks_table_id_fkey(id, name, area, capacity), opened_by:profiles!service_checks_opened_by_user_id_fkey(user_id, full_name, email, role), closed_by:profiles!service_checks_closed_by_user_id_fkey(user_id, full_name, email, role), cancelled_by:profiles!service_checks_cancelled_by_user_id_fkey(user_id, full_name, email, role), service_check_items(id, item_name, quantity, unit_price, total_price, notes, created_at)",
        )
        .eq("status", "open")
        .order("opened_at", { ascending: false }),
      supabase
        .from("service_checks")
        .select("id, total")
        .eq("status", "closed")
        .gte("closed_at", startOfToday),
      getMenuCategories(),
    ]);

  if (tablesResult.error || openChecksResult.error || todayClosedResult.error) {
    return buildFallbackChecksBoard(searchQuery);
  }

  const tables = (tablesResult.data ?? []).map(mapTable);
  const openChecks = (openChecksResult.data ?? []).map(mapServiceCheckRow);
  const selectedTable = matchTableByQuery(tables, searchQuery);
  const selectedCheck = selectedTable
    ? openChecks.find((check) => check.table?.id === selectedTable.id) ?? null
    : null;
  const closedToday = todayClosedResult.data ?? [];

  return {
    summary: [
      {
        label: "Contas abertas",
        value: String(openChecks.length),
        description: "Mesas com atendimento ativo no salao neste momento.",
      },
      {
        label: "Fechadas hoje",
        value: String(closedToday.length),
        description: "Contas encerradas ao longo do turno atual.",
      },
      {
        label: "Mesas ativas",
        value: String(tables.filter((table) => table.isActive).length),
        description: "Estrutura liberada para abrir novas contas.",
      },
      {
        label: "Faturamento do turno",
        value: String(
          closedToday.reduce(
            (accumulator, check) => accumulator + Number(check.total ?? 0),
            0,
          ),
        ),
        description: "Soma das contas fechadas hoje para leitura operacional.",
      },
    ],
    tables,
    menuCategories,
    openChecks,
    selectedTable,
    selectedCheck,
    searchQuery,
    searchState: searchQuery
      ? selectedTable
        ? selectedCheck
          ? "found"
          : "empty"
        : "not-found"
      : "idle",
    usingSupabase: true,
  };
}

export async function getServiceReportsBoard(period = "month", options = {}) {
  const supabase = await getSupabaseServerClient();
  const customStartDate = options.startDate ?? "";
  const customEndDate = options.endDate ?? "";

  if (!supabase) {
    return buildFallbackReportsBoard(period, customStartDate, customEndDate);
  }

  const range = resolveReportRange(period, customStartDate, customEndDate);

  const [commissionRate, tablesResult, closedChecksResult, periodChecksResult, openNowResult] =
    await Promise.all([
      getCommissionRate(supabase),
      supabase
        .from("restaurant_tables")
        .select("id, name, area, capacity, is_active")
        .eq("is_active", true)
        .order("name", { ascending: true }),
      supabase
        .from("service_checks")
        .select(
          "id, total, commission_rate, commission_amount, closed_at, table:restaurant_tables!service_checks_table_id_fkey(id, name, area), opened_by:profiles!service_checks_opened_by_user_id_fkey(user_id, full_name, email, role)",
        )
        .eq("status", "closed")
        .gte("closed_at", range.startIso),
      supabase
        .from("service_checks")
        .select(
          "id, status, total, opened_at, table:restaurant_tables!service_checks_table_id_fkey(id, name, area)",
        )
        .gte("opened_at", range.startIso),
      supabase
        .from("service_checks")
        .select("id, table_id")
        .eq("status", "open"),
    ]);

  if (range.endIso && !closedChecksResult.error) {
    const filtered = (closedChecksResult.data ?? []).filter(
      (check) => new Date(check.closed_at) <= new Date(range.endIso),
    );
    closedChecksResult.data = filtered;
  }

  if (range.endIso && !periodChecksResult.error) {
    const filtered = (periodChecksResult.data ?? []).filter(
      (check) => new Date(check.opened_at) <= new Date(range.endIso),
    );
    periodChecksResult.data = filtered;
  }

  if (
    tablesResult.error ||
    closedChecksResult.error ||
    periodChecksResult.error ||
    openNowResult.error
  ) {
    return buildFallbackReportsBoard(period, customStartDate, customEndDate);
  }

  const closedChecks = closedChecksResult.data ?? [];
  const periodChecks = periodChecksResult.data ?? [];
  const activeTables = (tablesResult.data ?? []).map(mapTable);
  const liveOpenTableIds = new Set((openNowResult.data ?? []).map((check) => check.table_id));

  const waiterCommissionMap = new Map();

  for (const check of closedChecks) {
    const waiter = check.opened_by;

    if (!waiter || waiter.role !== "waiter") {
      continue;
    }

    const current = waiterCommissionMap.get(waiter.user_id) ?? {
      userId: waiter.user_id,
      fullName: waiter.full_name,
      email: waiter.email,
      closedChecks: 0,
      grossSales: 0,
      commissionAmount: 0,
      lastCloseAt: check.closed_at,
    };

    const total = Number(check.total ?? 0);
    const commissionAmount =
      Number(check.commission_amount ?? 0) ||
      total * (Number(check.commission_rate ?? commissionRate) / 100);

    current.closedChecks += 1;
    current.grossSales += total;
    current.commissionAmount += commissionAmount;

    if (
      !current.lastCloseAt ||
      new Date(check.closed_at) > new Date(current.lastCloseAt)
    ) {
      current.lastCloseAt = check.closed_at;
    }

    waiterCommissionMap.set(waiter.user_id, current);
  }

  const tableOccupancyMap = new Map(
    activeTables.map((table) => [
      table.id,
      {
        id: table.id,
        name: table.name,
        area: table.area,
        capacity: table.capacity,
        totalAccounts: 0,
        closedAccounts: 0,
        cancelledAccounts: 0,
        openAccounts: liveOpenTableIds.has(table.id) ? 1 : 0,
        grossSales: 0,
      },
    ]),
  );

  for (const check of periodChecks) {
    const table = check.table;

    if (!table) {
      continue;
    }

    const current = tableOccupancyMap.get(table.id) ?? {
      id: table.id,
      name: table.name,
      area: table.area,
      capacity: 0,
      totalAccounts: 0,
      closedAccounts: 0,
      cancelledAccounts: 0,
      openAccounts: 0,
      grossSales: 0,
    };

    current.totalAccounts += 1;

    if (check.status === "closed") {
      current.closedAccounts += 1;
      current.grossSales += Number(check.total ?? 0);
    }

    if (check.status === "cancelled") {
      current.cancelledAccounts += 1;
    }

    tableOccupancyMap.set(table.id, current);
  }

  const waiterCommissions = Array.from(waiterCommissionMap.values()).sort(
    (left, right) => right.grossSales - left.grossSales,
  );
  const tableOccupancy = Array.from(tableOccupancyMap.values()).sort((left, right) => {
    if (right.totalAccounts !== left.totalAccounts) {
      return right.totalAccounts - left.totalAccounts;
    }

    return left.name.localeCompare(right.name, "pt-BR");
  });

  const totalGrossSales = closedChecks.reduce(
    (accumulator, check) => accumulator + Number(check.total ?? 0),
    0,
  );
  const totalCommission = waiterCommissions.reduce(
    (accumulator, waiter) => accumulator + waiter.commissionAmount,
    0,
  );
  const estimatedNetResult = totalGrossSales - totalCommission;
  const financialTimelineMap = new Map();

  for (const check of closedChecks) {
    const dayKey = getBrazilDayKey(check.closed_at);
    if (!dayKey) {
      continue;
    }

    const current = financialTimelineMap.get(dayKey) ?? {
      date: dayKey,
      revenue: 0,
      closedChecks: 0,
    };

    current.revenue += Number(check.total ?? 0);
    current.closedChecks += 1;
    financialTimelineMap.set(dayKey, current);
  }

  const financialTimeline = Array.from(financialTimelineMap.values()).sort((left, right) =>
    String(left.date).localeCompare(String(right.date), "pt-BR"),
  );
  const averageTicket = closedChecks.length ? totalGrossSales / closedChecks.length : 0;

  return {
    period: range.period,
    periodLabel: range.periodLabel,
    startDate: range.startDate,
    endDate: range.endDate,
    commissionRate,
    summary: [
      {
        label: "Mesas em operacao",
        value: String(liveOpenTableIds.size),
        description: "Mesas com conta aberta neste momento.",
      },
      {
        label: "Contas fechadas",
        value: String(closedChecks.length),
        description: `Fechamentos registrados em ${range.periodLabel.toLowerCase()}.`,
      },
      {
        label: "Faturamento em comandas",
        value: String(totalGrossSales),
        description: "Total movimentado nas contas fechadas do periodo.",
      },
      {
        label: "Comissao prevista",
        value: String(totalCommission),
        description: `Calculo usando a regra atual de ${commissionRate}% para garcons.`,
      },
      {
        label: "Resultado liquido estimado",
        value: String(estimatedNetResult),
        description: "Faturamento de comandas menos comissao prevista da equipe.",
      },
      {
        label: "Ticket medio",
        value: String(averageTicket),
        description: "Media por conta fechada para leitura comercial do periodo.",
      },
    ],
    waiterCommissions,
    tableOccupancy,
    financialTimeline,
    liveOpenTablesCount: liveOpenTableIds.size,
    usingSupabase: true,
  };
}

export async function getServiceCheckPrintReport(checkId) {
  const supabase = await getSupabaseServerClient();

  if (!supabase || !checkId) {
    return null;
  }

  const { data, error } = await supabase
    .from("service_checks")
    .select(
      "id, guest_name, notes, status, opened_at, closed_at, cancelled_at, payment_method, subtotal, total, commission_rate, commission_amount, report_reference, table:restaurant_tables!service_checks_table_id_fkey(id, name, area, capacity), opened_by:profiles!service_checks_opened_by_user_id_fkey(user_id, full_name, email, role), closed_by:profiles!service_checks_closed_by_user_id_fkey(user_id, full_name, email, role), cancelled_by:profiles!service_checks_cancelled_by_user_id_fkey(user_id, full_name, email, role), service_check_items(id, item_name, quantity, unit_price, total_price, notes, created_at)",
    )
    .eq("id", checkId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapServiceCheckRow(data);
}
