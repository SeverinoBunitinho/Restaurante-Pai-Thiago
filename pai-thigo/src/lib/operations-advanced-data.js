import "server-only";

import { orderStatusMeta } from "@/lib/staff-data";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const kitchenColumns = [
  {
    key: "received",
    title: "Recebidos",
    description: "Pedidos novos aguardando inicio de preparo.",
  },
  {
    key: "preparing",
    title: "Em preparo",
    description: "Pedidos em producao na cozinha ou no bar.",
  },
  {
    key: "ready",
    title: "Prontos",
    description: "Pedidos prontos para retirada ou envio.",
  },
  {
    key: "dispatching",
    title: "Em rota",
    description: "Pedidos de delivery em deslocamento.",
  },
];

const shiftStatusMeta = {
  planned: {
    label: "Planejado",
    badge: "bg-[rgba(182,135,66,0.12)] text-[var(--gold)]",
  },
  confirmed: {
    label: "Confirmado",
    badge: "bg-[rgba(95,123,109,0.12)] text-[var(--sage)]",
  },
  completed: {
    label: "Concluido",
    badge: "bg-[rgba(20,35,29,0.12)] text-[var(--forest)]",
  },
  absent: {
    label: "Ausente",
    badge: "bg-[rgba(138,93,59,0.12)] text-[var(--clay)]",
  },
};

const campaignStatusMeta = {
  draft: {
    label: "Rascunho",
    badge: "bg-[rgba(182,135,66,0.12)] text-[var(--gold)]",
  },
  active: {
    label: "Ativa",
    badge: "bg-[rgba(95,123,109,0.12)] text-[var(--sage)]",
  },
  paused: {
    label: "Pausada",
    badge: "bg-[rgba(138,93,59,0.12)] text-[var(--clay)]",
  },
  finished: {
    label: "Finalizada",
    badge: "bg-[rgba(20,35,29,0.12)] text-[var(--forest)]",
  },
};

const demandShiftBuckets = [
  {
    key: "lunch",
    title: "Almoco",
    timeRange: "11h as 15h",
  },
  {
    key: "dinner",
    title: "Jantar",
    timeRange: "18h as 23h",
  },
  {
    key: "offpeak",
    title: "Entre turnos",
    timeRange: "demais horarios",
  },
];

const checklistTemplate = {
  opening: [
    {
      key: "room-ready",
      label: "Salao pronto para abertura",
      description: "Mesas limpas, materiais repostos e fluxo de entrada liberado.",
    },
    {
      key: "kitchen-briefing",
      label: "Briefing da cozinha",
      description: "Equipe alinhada com menu ativo, indisponibilidades e ritmo esperado.",
    },
    {
      key: "team-positioning",
      label: "Equipe posicionada",
      description: "Garcons e lideranca com setores definidos para o turno.",
    },
    {
      key: "systems-check",
      label: "Sistema e impressao testados",
      description: "Comandas, impressao e notificacoes validadas antes da abertura.",
    },
  ],
  closing: [
    {
      key: "checks-closed",
      label: "Contas fechadas",
      description: "Comandas do turno encerradas ou justificadas para continuidade.",
    },
    {
      key: "cash-reconciliation",
      label: "Conferencia financeira",
      description: "Fechamento de caixa e meios de pagamento revisados pela lideranca.",
    },
    {
      key: "next-shift-handoff",
      label: "Passagem de turno",
      description: "Pendencias, reservas e observacoes transferidas para o proximo ciclo.",
    },
    {
      key: "sanitization-done",
      label: "Higienizacao final",
      description: "Salao e apoio fechados conforme padrao da casa.",
    },
  ],
};

function getTodayInBrazilWithTime() {
  const now = new Date();
  const date = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(now);

  return {
    date,
    startIso: `${date}T00:00:00-03:00`,
    endIso: `${date}T23:59:59-03:00`,
  };
}

function formatBrazilDate(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(value);
}

function getTodayInBrazil() {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
}

function parseDateTime(value) {
  const parsed = new Date(value ?? "");
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getBrazilHourFromDate(value) {
  const parsedDate = parseDateTime(value);

  if (!parsedDate) {
    return null;
  }

  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      hour12: false,
      timeZone: "America/Sao_Paulo",
    }).format(parsedDate),
  );

  return Number.isFinite(hour) ? hour : null;
}

function getHourFromTime(value) {
  const normalized = String(value ?? "").slice(0, 5);

  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(normalized)) {
    return null;
  }

  return Number.parseInt(normalized.split(":")[0], 10);
}

function resolveDemandShiftByHour(hour) {
  if (!Number.isFinite(hour)) {
    return "offpeak";
  }

  if (hour >= 11 && hour <= 15) {
    return "lunch";
  }

  if (hour >= 18 && hour <= 23) {
    return "dinner";
  }

  return "offpeak";
}

function elapsedMinutesSince(value) {
  const parsedDate = parseDateTime(value);

  if (!parsedDate) {
    return 0;
  }

  return Math.max(0, Math.round((Date.now() - parsedDate.getTime()) / 60000));
}

function groupOrders(orders = []) {
  const groups = new Map();

  for (const order of orders) {
    const groupKey = order.checkout_reference || order.id;
    const current = groups.get(groupKey) ?? {
      id: groupKey,
      checkoutReference:
        order.checkout_reference ||
        `CKT-${String(order.id).slice(0, 8).toUpperCase()}`,
      guestName: order.guest_name || "Cliente",
      status: order.status || "received",
      createdAt: order.created_at,
      updatedAt: order.updated_at || order.created_at,
      fulfillmentType: order.fulfillment_type || "pickup",
      paymentMethod: order.payment_method || "pix",
      orderIds: [],
      items: [],
      totalItems: 0,
      totalPrice: 0,
    };

    current.orderIds.push(order.id);
    current.items.push({
      id: order.id,
      itemName: order.item_name,
      quantity: Number(order.quantity ?? 0),
      totalPrice: Number(order.total_price ?? 0),
      notes: order.notes ?? "",
    });
    current.totalItems += Number(order.quantity ?? 0);
    current.totalPrice += Number(order.total_price ?? 0);

    const updatedAt = parseDateTime(order.updated_at || order.created_at);
    const currentUpdatedAt = parseDateTime(current.updatedAt);

    if (
      updatedAt &&
      (!currentUpdatedAt || updatedAt.getTime() > currentUpdatedAt.getTime())
    ) {
      current.updatedAt = order.updated_at || order.created_at;
      current.status = order.status || current.status;
    }

    groups.set(groupKey, current);
  }

  return Array.from(groups.values()).sort((left, right) => {
    const leftDate = parseDateTime(left.updatedAt) || new Date(0);
    const rightDate = parseDateTime(right.updatedAt) || new Date(0);
    return rightDate.getTime() - leftDate.getTime();
  });
}

export async function getKitchenBoard() {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return {
      summary: [
        {
          label: "Fila ativa",
          value: "0",
          description: "A fila reaparece quando o banco estiver conectado.",
        },
        {
          label: "Em preparo",
          value: "0",
          description: "Sem leitura de producao no momento.",
        },
        {
          label: "Prontos para expedir",
          value: "0",
          description: "A expedicao volta assim que os dados forem sincronizados.",
        },
      ],
      columns: kitchenColumns.map((column) => ({
        ...column,
        orders: [],
      })),
      usingSupabase: false,
    };
  }

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, checkout_reference, guest_name, item_name, quantity, total_price, notes, payment_method, fulfillment_type, status, created_at, updated_at",
    )
    .in("status", kitchenColumns.map((column) => column.key))
    .order("updated_at", { ascending: false })
    .limit(120);

  if (error) {
    return {
      summary: [
        {
          label: "Fila ativa",
          value: "0",
          description: "A leitura da cozinha entrou em contingencia temporaria.",
        },
        {
          label: "Em preparo",
          value: "0",
          description: "Sem dados para produzir indicadores da cozinha.",
        },
        {
          label: "Prontos para expedir",
          value: "0",
          description: "A expedicao volta a ser exibida apos a reconexao.",
        },
      ],
      columns: kitchenColumns.map((column) => ({
        ...column,
        orders: [],
      })),
      usingSupabase: false,
    };
  }

  const groupedOrders = groupOrders(data ?? []);
  const groupedByStatus = kitchenColumns.reduce((accumulator, column) => {
    accumulator[column.key] = groupedOrders
      .filter((group) => group.status === column.key)
      .map((group) => ({
        ...group,
        ageMinutes: elapsedMinutesSince(group.createdAt),
      }));
    return accumulator;
  }, {});

  return {
    summary: [
      {
        label: "Fila ativa",
        value: String(groupedOrders.length),
        description: "Pedidos atualmente em fluxo operacional.",
      },
      {
        label: "Em preparo",
        value: String((groupedByStatus.preparing ?? []).length),
        description: "Pedidos em producao na cozinha.",
      },
      {
        label: "Prontos para expedir",
        value: String((groupedByStatus.ready ?? []).length),
        description: "Pedidos aguardando retirada ou entrega.",
      },
    ],
    columns: kitchenColumns.map((column) => ({
      ...column,
      orders: groupedByStatus[column.key] ?? [],
      statusView: orderStatusMeta[column.key] ?? orderStatusMeta.received,
    })),
    usingSupabase: true,
  };
}

export async function getShiftBoard() {
  const supabase = await getSupabaseServerClient();
  const today = getTodayInBrazil();

  if (!supabase) {
    return {
      today,
      roster: [],
      shifts: [],
      summary: [
        {
          label: "Turnos planejados",
          value: "0",
          description: "A escala volta a aparecer quando o banco estiver ativo.",
        },
        {
          label: "Cobertura confirmada",
          value: "0",
          description: "Sem leitura de cobertura no momento.",
        },
        {
          label: "Ausencias",
          value: "0",
          description: "Sem leitura de ausencias no momento.",
        },
      ],
      statusMeta: shiftStatusMeta,
      usingSupabase: false,
    };
  }

  const [rosterResult, shiftsResult] = await Promise.all([
    supabase
      .from("staff_directory")
      .select("id, full_name, email, role, active")
      .in("role", ["waiter", "manager"])
      .eq("active", true)
      .order("role", { ascending: true })
      .order("full_name", { ascending: true }),
    supabase
      .from("staff_shifts")
      .select(
        "id, staff_id, role, shift_date, shift_label, starts_at, ends_at, status, notes, created_at, staff:staff_directory(full_name, email, role)",
      )
      .gte("shift_date", today)
      .order("shift_date", { ascending: true })
      .order("starts_at", { ascending: true })
      .limit(80),
  ]);

  if (rosterResult.error || shiftsResult.error) {
    return {
      today,
      roster: (rosterResult.data ?? []).map((member) => ({
        id: member.id,
        fullName: member.full_name,
        email: member.email,
        role: member.role,
      })),
      shifts: [],
      summary: [
        {
          label: "Turnos planejados",
          value: "0",
          description:
            "A tabela de escala ainda nao foi encontrada ou nao respondeu no banco.",
        },
        {
          label: "Cobertura confirmada",
          value: "0",
          description: "Sem leitura de cobertura da equipe neste momento.",
        },
        {
          label: "Ausencias",
          value: "0",
          description: "Sem dados de ausencias neste momento.",
        },
      ],
      statusMeta: shiftStatusMeta,
      usingSupabase: false,
    };
  }

  const shifts = (shiftsResult.data ?? []).map((shift) => ({
    id: shift.id,
    staffId: shift.staff_id,
    staffName: shift.staff?.full_name ?? "Equipe",
    staffEmail: shift.staff?.email ?? "",
    role: shift.role ?? shift.staff?.role ?? "waiter",
    shiftDate: shift.shift_date,
    shiftLabel: shift.shift_label ?? "turno",
    startsAt: String(shift.starts_at ?? "").slice(0, 5),
    endsAt: String(shift.ends_at ?? "").slice(0, 5),
    status: shift.status ?? "planned",
    notes: shift.notes ?? "",
    createdAt: shift.created_at,
  }));

  return {
    today,
    roster: (rosterResult.data ?? []).map((member) => ({
      id: member.id,
      fullName: member.full_name,
      email: member.email,
      role: member.role,
    })),
    shifts,
    summary: [
      {
        label: "Turnos planejados",
        value: String(shifts.length),
        description: "Escala futura registrada para a equipe.",
      },
      {
        label: "Cobertura confirmada",
        value: String(
          shifts.filter((shift) => shift.status === "confirmed").length,
        ),
        description: "Turnos prontos para operar no horario definido.",
      },
      {
        label: "Ausencias",
        value: String(shifts.filter((shift) => shift.status === "absent").length),
        description: "Turnos marcados com ausencia.",
      },
    ],
    statusMeta: shiftStatusMeta,
    usingSupabase: true,
  };
}

function buildOccupancySignal({
  activeTables = 0,
  openChecks = 0,
  activeReservations = 0,
}) {
  const normalizedActiveTables = Math.max(0, Number(activeTables ?? 0));
  const normalizedOpenChecks = Math.max(0, Number(openChecks ?? 0));
  const normalizedActiveReservations = Math.max(
    0,
    Number(activeReservations ?? 0),
  );
  const pressure =
    normalizedActiveTables > 0
      ? (normalizedOpenChecks + normalizedActiveReservations * 0.55) /
        normalizedActiveTables
      : 0;

  if (pressure <= 0.38) {
    return {
      level: "baixa",
      label: "Ocupacao baixa",
      message:
        "Janela favoravel para campanha de estimulacao com cupom automatico.",
      pressure,
      activeTables: normalizedActiveTables,
      openChecks: normalizedOpenChecks,
      activeReservations: normalizedActiveReservations,
      discount: 15,
      minOrder: 60,
    };
  }

  if (pressure <= 0.62) {
    return {
      level: "moderada",
      label: "Ocupacao moderada",
      message:
        "Da para ativar campanha leve sem pressionar a operacao do salao.",
      pressure,
      activeTables: normalizedActiveTables,
      openChecks: normalizedOpenChecks,
      activeReservations: normalizedActiveReservations,
      discount: 10,
      minOrder: 80,
    };
  }

  return {
    level: "alta",
    label: "Ocupacao alta",
    message:
      "Fluxo aquecido. Priorize experiencia e evite novas ofertas agressivas agora.",
    pressure,
    activeTables: normalizedActiveTables,
    openChecks: normalizedOpenChecks,
    activeReservations: normalizedActiveReservations,
    discount: 0,
    minOrder: 0,
  };
}

export async function getCampaignsBoard() {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return {
      campaigns: [],
      coupons: [],
      summary: [
        {
          label: "Campanhas ativas",
          value: "0",
          description: "As campanhas voltam a aparecer quando o banco estiver ativo.",
        },
        {
          label: "Cupons ativos",
          value: "0",
          description: "Sem leitura de cupons no momento.",
        },
        {
          label: "Expiram nesta semana",
          value: "0",
          description: "Sem agenda de expiracao no momento.",
        },
      ],
      occupancySignal: buildOccupancySignal({}),
      autoCouponSuggestion: {
        canCreate: false,
        reason: "Sem conexao ativa para ler ocupacao em tempo real.",
      },
      statusMeta: campaignStatusMeta,
      usingSupabase: false,
    };
  }

  const { date: todayDate } = getTodayInBrazilWithTime();
  const [campaignsResult, couponsResult, tablesResult, openChecksResult, reservationsResult] = await Promise.all([
    supabase
      .from("marketing_campaigns")
      .select(
        "id, title, description, channel, starts_on, ends_on, status, target_audience, highlight_offer, created_at",
      )
      .order("starts_on", { ascending: false })
      .limit(80),
    supabase
      .from("marketing_coupons")
      .select(
        "id, campaign_id, code, coupon_type, amount, min_order, usage_limit, usage_count, is_active, starts_on, ends_on, created_at, campaign:marketing_campaigns(title)",
      )
      .order("created_at", { ascending: false })
      .limit(120),
    supabase
      .from("restaurant_tables")
      .select("id", { head: true, count: "exact" })
      .eq("is_active", true),
    supabase
      .from("service_checks")
      .select("id", { head: true, count: "exact" })
      .eq("status", "open"),
    supabase
      .from("reservations")
      .select("id", { head: true, count: "exact" })
      .eq("reservation_date", todayDate)
      .in("status", ["pending", "confirmed", "seated"]),
  ]);

  if (
    campaignsResult.error ||
    couponsResult.error ||
    tablesResult.error ||
    openChecksResult.error ||
    reservationsResult.error
  ) {
    return {
      campaigns: [],
      coupons: [],
      summary: [
        {
          label: "Campanhas ativas",
          value: "0",
          description:
            "As tabelas de campanhas/cupons ainda nao responderam no banco.",
        },
        {
          label: "Cupons ativos",
          value: "0",
          description: "Sem leitura de cupons no momento.",
        },
        {
          label: "Expiram nesta semana",
          value: "0",
          description: "Sem leitura de expiracao no momento.",
        },
      ],
      occupancySignal: buildOccupancySignal({}),
      autoCouponSuggestion: {
        canCreate: false,
        reason: "Nao foi possivel ler ocupacao para sugerir cupom automatico.",
      },
      statusMeta: campaignStatusMeta,
      usingSupabase: false,
    };
  }

  const campaigns = (campaignsResult.data ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description ?? "",
    channel: item.channel ?? "site",
    startsOn: item.starts_on,
    endsOn: item.ends_on,
    status: item.status ?? "draft",
    targetAudience: item.target_audience ?? "",
    highlightOffer: item.highlight_offer ?? "",
    createdAt: item.created_at,
  }));

  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const coupons = (couponsResult.data ?? []).map((item) => ({
    id: item.id,
    campaignId: item.campaign_id,
    campaignTitle: item.campaign?.title ?? "",
    code: item.code,
    couponType: item.coupon_type ?? "percentage",
    amount: Number(item.amount ?? 0),
    minOrder: Number(item.min_order ?? 0),
    usageLimit: item.usage_limit == null ? null : Number(item.usage_limit),
    usageCount: Number(item.usage_count ?? 0),
    isActive: Boolean(item.is_active),
    startsOn: item.starts_on,
    endsOn: item.ends_on,
    createdAt: item.created_at,
  }));

  const expiringSoon = coupons.filter((coupon) => {
    const endDate = parseDateTime(coupon.endsOn);
    if (!coupon.isActive || !endDate) {
      return false;
    }
    return endDate >= today && endDate <= nextWeek;
  });
  const occupancySignal = buildOccupancySignal({
    activeTables: tablesResult.count ?? 0,
    openChecks: openChecksResult.count ?? 0,
    activeReservations: reservationsResult.count ?? 0,
  });
  const autoCouponSuggestion = {
    canCreate: occupancySignal.level !== "alta",
    discount: occupancySignal.discount,
    minOrder: occupancySignal.minOrder,
    reason:
      occupancySignal.level === "alta"
        ? "Fluxo de atendimento alto no momento."
        : "Sinal favoravel para ativacao de cupom por baixa ocupacao.",
  };

  return {
    campaigns,
    coupons,
    summary: [
      {
        label: "Campanhas ativas",
        value: String(campaigns.filter((item) => item.status === "active").length),
        description: "Acoes promocionais em vigor neste momento.",
      },
      {
        label: "Cupons ativos",
        value: String(coupons.filter((item) => item.isActive).length),
        description: "Codigos atualmente habilitados para uso.",
      },
      {
        label: "Expiram nesta semana",
        value: String(expiringSoon.length),
        description: "Cupons ativos com vencimento nos proximos 7 dias.",
      },
    ],
    occupancySignal,
    autoCouponSuggestion,
    statusMeta: campaignStatusMeta,
    usingSupabase: true,
  };
}

export async function getAuditBoard() {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return {
      summary: [
        {
          label: "Eventos auditados",
          value: "0",
          description: "A trilha de auditoria volta assim que o banco sincronizar.",
        },
        {
          label: "Ultimas 24h",
          value: "0",
          description: "Sem leitura da janela recente no momento.",
        },
        {
          label: "Atores distintos",
          value: "0",
          description: "Sem leitura de responsaveis no momento.",
        },
      ],
      events: [],
      usingSupabase: false,
    };
  }

  const { data, error } = await supabase
    .from("operation_audit_logs")
    .select(
      "id, actor_user_id, actor_name, actor_role, event_type, entity_type, entity_id, entity_label, description, metadata, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(120);

  if (error) {
    return {
      summary: [
        {
          label: "Eventos auditados",
          value: "0",
          description:
            "A tabela de auditoria ainda nao foi encontrada ou nao respondeu no banco.",
        },
        {
          label: "Ultimas 24h",
          value: "0",
          description: "Sem leitura da janela recente no momento.",
        },
        {
          label: "Atores distintos",
          value: "0",
          description: "Sem leitura de responsaveis no momento.",
        },
      ],
      events: [],
      usingSupabase: false,
    };
  }

  const events = (data ?? []).map((item) => ({
    id: item.id,
    actorUserId: item.actor_user_id,
    actorName: item.actor_name || "Sistema",
    actorRole: item.actor_role || "staff",
    eventType: item.event_type || "evento",
    entityType: item.entity_type || "registro",
    entityId: item.entity_id || "",
    entityLabel: item.entity_label || "",
    description: item.description || "",
    metadata: item.metadata ?? {},
    createdAt: item.created_at,
  }));

  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const recent = events.filter((event) => {
    const parsed = parseDateTime(event.createdAt);
    return parsed ? parsed.getTime() >= dayAgo : false;
  });
  const actors = new Set(events.map((event) => event.actorUserId).filter(Boolean));

  return {
    summary: [
      {
        label: "Eventos auditados",
        value: String(events.length),
        description: "Registros recentes de alteracoes operacionais.",
      },
      {
        label: "Ultimas 24h",
        value: String(recent.length),
        description: "Atividade recente da equipe no sistema.",
      },
      {
        label: "Atores distintos",
        value: String(actors.size),
        description: "Perfis que geraram eventos na trilha.",
      },
    ],
    events,
    usingSupabase: true,
  };
}

function average(values = []) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value) {
  return Math.round(Number(value ?? 0));
}

export async function getForecastBoard() {
  const supabase = await getSupabaseServerClient();
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 30);

  if (!supabase) {
    return {
      generatedAt: new Date().toISOString(),
      coverageWindow: "30 dias",
      metrics: [
        {
          label: "Previsao de reservas (amanha)",
          value: "0",
          description: "A previsao volta assim que o banco for conectado.",
        },
        {
          label: "Previsao de pedidos (amanha)",
          value: "0",
          description: "Sem leitura de pedidos para projetar o proximo turno.",
        },
        {
          label: "Previsao de faturamento (amanha)",
          value: "0",
          description: "Sem base de fechamento para previsao financeira.",
        },
      ],
      topItems: [],
      demandByWeekday: [],
      shiftForecast: demandShiftBuckets.map((bucket) => ({
        ...bucket,
        reservations: 0,
        orders: 0,
        revenue: 0,
        pressure: "leve",
      })),
      hourlyPeaks: [],
      insights: [
        "Sem conexao ativa para calcular previsao de demanda.",
      ],
      usingSupabase: false,
    };
  }

  const startIso = startDate.toISOString();

  const [reservationsResult, ordersResult, checksResult] = await Promise.all([
    supabase
      .from("reservations")
      .select("id, reservation_date, reservation_time, status")
      .gte("created_at", startIso),
    supabase
      .from("orders")
      .select("id, item_name, quantity, total_price, fulfillment_type, status, created_at")
      .gte("created_at", startIso),
    supabase
      .from("service_checks")
      .select("id, total, status, opened_at, closed_at")
      .gte("opened_at", startIso),
  ]);

  if (reservationsResult.error || ordersResult.error || checksResult.error) {
    return {
      generatedAt: new Date().toISOString(),
      coverageWindow: "30 dias",
      metrics: [
        {
          label: "Previsao de reservas (amanha)",
          value: "0",
          description:
            "A base de previsao ainda nao conseguiu consultar todas as tabelas.",
        },
        {
          label: "Previsao de pedidos (amanha)",
          value: "0",
          description: "Sem base de pedidos para projetar o proximo turno.",
        },
        {
          label: "Previsao de faturamento (amanha)",
          value: "0",
          description: "Sem base de comandas para previsao financeira.",
        },
      ],
      topItems: [],
      demandByWeekday: [],
      shiftForecast: demandShiftBuckets.map((bucket) => ({
        ...bucket,
        reservations: 0,
        orders: 0,
        revenue: 0,
        pressure: "leve",
      })),
      hourlyPeaks: [],
      insights: [
        "A previsao volta a ficar completa apos a sincronizacao do banco.",
      ],
      usingSupabase: false,
    };
  }

  const reservations = (reservationsResult.data ?? []).filter(
    (item) => item.status !== "cancelled",
  );
  const orders = (ordersResult.data ?? []).filter(
    (item) => item.status !== "cancelled",
  );
  const checks = (checksResult.data ?? []).filter(
    (item) => item.status === "closed",
  );

  const reservationsByDay = new Map();
  const ordersByDay = new Map();
  const revenueByDay = new Map();
  const weekdayDemand = new Map();
  const itemDemand = new Map();
  const hourlyDemand = new Map();
  const shiftReservations = new Map(
    demandShiftBuckets.map((bucket) => [bucket.key, 0]),
  );
  const shiftOrders = new Map(demandShiftBuckets.map((bucket) => [bucket.key, 0]));
  const shiftRevenue = new Map(demandShiftBuckets.map((bucket) => [bucket.key, 0]));
  let deliveryOrders = 0;

  for (const reservation of reservations) {
    const day = String(reservation.reservation_date ?? "");
    reservationsByDay.set(day, (reservationsByDay.get(day) ?? 0) + 1);

    const reservationHour = getHourFromTime(reservation.reservation_time);
    if (reservationHour != null) {
      const shiftKey = resolveDemandShiftByHour(reservationHour);
      shiftReservations.set(
        shiftKey,
        (shiftReservations.get(shiftKey) ?? 0) + 1,
      );
      const hourLabel = `${String(reservationHour).padStart(2, "0")}:00`;
      hourlyDemand.set(hourLabel, (hourlyDemand.get(hourLabel) ?? 0) + 1);
    }
  }

  for (const order of orders) {
    const createdAt = parseDateTime(order.created_at);
    if (!createdAt) {
      continue;
    }

    const day = formatBrazilDate(createdAt).split("/").reverse().join("-");
    ordersByDay.set(day, (ordersByDay.get(day) ?? 0) + 1);
    const orderHour = getBrazilHourFromDate(createdAt);

    if (orderHour != null) {
      const shiftKey = resolveDemandShiftByHour(orderHour);
      shiftOrders.set(shiftKey, (shiftOrders.get(shiftKey) ?? 0) + 1);
      const hourLabel = `${String(orderHour).padStart(2, "0")}:00`;
      hourlyDemand.set(hourLabel, (hourlyDemand.get(hourLabel) ?? 0) + 1);
    }

    if (order.fulfillment_type === "delivery") {
      deliveryOrders += 1;
    }

    const itemName = String(order.item_name ?? "").trim();
    if (itemName) {
      itemDemand.set(
        itemName,
        (itemDemand.get(itemName) ?? 0) + Number(order.quantity ?? 0),
      );
    }

    const weekday = new Intl.DateTimeFormat("pt-BR", {
      weekday: "short",
      timeZone: "America/Sao_Paulo",
    }).format(createdAt);
    weekdayDemand.set(weekday, (weekdayDemand.get(weekday) ?? 0) + 1);
  }

  for (const check of checks) {
    const checkMoment = parseDateTime(check.closed_at || check.opened_at);
    if (!checkMoment) {
      continue;
    }

    const day = formatBrazilDate(checkMoment).split("/").reverse().join("-");
    revenueByDay.set(day, (revenueByDay.get(day) ?? 0) + Number(check.total ?? 0));

    const checkHour = getBrazilHourFromDate(checkMoment);
    if (checkHour != null) {
      const shiftKey = resolveDemandShiftByHour(checkHour);
      shiftRevenue.set(
        shiftKey,
        (shiftRevenue.get(shiftKey) ?? 0) + Number(check.total ?? 0),
      );
      const hourLabel = `${String(checkHour).padStart(2, "0")}:00`;
      hourlyDemand.set(hourLabel, (hourlyDemand.get(hourLabel) ?? 0) + 1);
    }
  }

  const lastSevenDays = [];
  for (let index = 0; index < 7; index += 1) {
    const day = new Date(today);
    day.setDate(day.getDate() - index);
    const key = formatBrazilDate(day).split("/").reverse().join("-");
    lastSevenDays.push({
      reservations: reservationsByDay.get(key) ?? 0,
      orders: ordersByDay.get(key) ?? 0,
      revenue: revenueByDay.get(key) ?? 0,
    });
  }

  const forecastReservations = round(
    average(lastSevenDays.map((entry) => entry.reservations)),
  );
  const forecastOrders = round(average(lastSevenDays.map((entry) => entry.orders)));
  const forecastRevenue = round(
    average(lastSevenDays.map((entry) => entry.revenue)),
  );
  const deliveryShare = orders.length
    ? Math.round((deliveryOrders / orders.length) * 100)
    : 0;

  const topItems = Array.from(itemDemand.entries())
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((left, right) => right.quantity - left.quantity)
    .slice(0, 6);

  const demandByWeekday = Array.from(weekdayDemand.entries())
    .map(([weekday, count]) => ({ weekday, count }))
    .sort((left, right) => right.count - left.count);
  const shiftForecast = demandShiftBuckets.map((bucket) => {
    const reservationsCount = shiftReservations.get(bucket.key) ?? 0;
    const ordersCount = shiftOrders.get(bucket.key) ?? 0;
    const revenueTotal = shiftRevenue.get(bucket.key) ?? 0;
    const reservationsForecast = round(reservationsCount / 30);
    const ordersForecast = round(ordersCount / 30);
    const revenueForecast = round(revenueTotal / 30);
    const pressureScore = ordersForecast + reservationsForecast;
    const pressure =
      pressureScore >= 16 ? "alto" : pressureScore >= 9 ? "medio" : "leve";

    return {
      ...bucket,
      reservations: reservationsForecast,
      orders: ordersForecast,
      revenue: revenueForecast,
      pressure,
    };
  });
  const hourlyPeaks = Array.from(hourlyDemand.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 4);

  return {
    generatedAt: new Date().toISOString(),
    coverageWindow: "30 dias",
    metrics: [
      {
        label: "Previsao de reservas (amanha)",
        value: String(forecastReservations),
        description: "Media movel simples com base nos ultimos 7 dias.",
      },
      {
        label: "Previsao de pedidos (amanha)",
        value: String(forecastOrders),
        description: "Estimativa do volume de producao para o proximo turno.",
      },
      {
        label: "Previsao de faturamento (amanha)",
        value: String(forecastRevenue),
        description: "Projecao baseada em contas fechadas recentes.",
      },
    ],
    topItems,
    demandByWeekday,
    shiftForecast,
    hourlyPeaks,
    insights: [
      `${deliveryShare}% dos pedidos recentes foram em delivery.`,
      topItems.length
        ? `Item com maior tracao: ${topItems[0].name} (${topItems[0].quantity} unidade(s)).`
        : "Ainda nao ha itens suficientes para indicar tracao de cardapio.",
      demandByWeekday.length
        ? `Dia da semana com maior demanda: ${demandByWeekday[0].weekday}.`
        : "Ainda nao ha historico suficiente para leitura por dia da semana.",
      shiftForecast.length
        ? `Turno com maior pressao prevista: ${shiftForecast.slice().sort((left, right) => (right.orders + right.reservations) - (left.orders + left.reservations))[0]?.title}.`
        : "Sem leitura de turno disponivel no momento.",
    ],
    usingSupabase: true,
  };
}

function buildChecklistItemsFromTemplate(shift, latestStateMap) {
  return (checklistTemplate[shift] ?? []).map((item) => {
    const itemState = latestStateMap.get(`${shift}:${item.key}`);

    return {
      ...item,
      checked: Boolean(itemState?.checked),
      note: itemState?.note ?? "",
      actorName: itemState?.actorName ?? "",
      actorRole: itemState?.actorRole ?? "",
      updatedAt: itemState?.updatedAt ?? null,
    };
  });
}

function createChecklistFallbackBoard() {
  const { date } = getTodayInBrazilWithTime();
  const openingItems = buildChecklistItemsFromTemplate("opening", new Map());
  const closingItems = buildChecklistItemsFromTemplate("closing", new Map());

  return {
    date,
    summary: [
      {
        label: "Abertura",
        value: `0/${openingItems.length}`,
        description: "Itens concluidos na abertura do turno.",
      },
      {
        label: "Fechamento",
        value: `0/${closingItems.length}`,
        description: "Itens concluidos para encerrar o turno com seguranca.",
      },
      {
        label: "Progresso total",
        value: "0%",
        description: "Checklist fica ativo assim que o banco estiver conectado.",
      },
    ],
    openingItems,
    closingItems,
    latestEvents: [],
    usingSupabase: false,
  };
}

export async function getOperationalChecklistBoard() {
  const adminClient = getSupabaseAdminClient();

  if (!adminClient) {
    return createChecklistFallbackBoard();
  }

  const { date, startIso, endIso } = getTodayInBrazilWithTime();
  const logsResult = await adminClient
    .from("operation_audit_logs")
    .select(
      "id, actor_name, actor_role, event_type, entity_id, entity_label, metadata, created_at",
    )
    .eq("event_type", "checklist_item_set")
    .gte("created_at", startIso)
    .lte("created_at", endIso)
    .order("created_at", { ascending: false })
    .limit(300);

  if (logsResult.error) {
    return createChecklistFallbackBoard();
  }

  const latestStateMap = new Map();
  const latestEvents = [];

  for (const row of logsResult.data ?? []) {
    const metadata = row.metadata ?? {};
    const shift = String(metadata.shift ?? "").trim().toLowerCase();
    const itemKey = String(metadata.itemKey ?? "").trim();

    if (!["opening", "closing"].includes(shift) || !itemKey) {
      continue;
    }

    const mapKey = `${shift}:${itemKey}`;
    if (!latestStateMap.has(mapKey)) {
      latestStateMap.set(mapKey, {
        checked: Boolean(metadata.checked),
        note: String(metadata.note ?? "").trim(),
        actorName: row.actor_name || "Equipe",
        actorRole: row.actor_role || "staff",
        updatedAt: row.created_at,
      });
    }

    if (latestEvents.length < 8) {
      latestEvents.push({
        id: row.id,
        shift,
        itemLabel:
          String(metadata.itemLabel ?? "").trim() || row.entity_label || itemKey,
        checked: Boolean(metadata.checked),
        actorName: row.actor_name || "Equipe",
        actorRole: row.actor_role || "staff",
        createdAt: row.created_at,
      });
    }
  }

  const openingItems = buildChecklistItemsFromTemplate("opening", latestStateMap);
  const closingItems = buildChecklistItemsFromTemplate("closing", latestStateMap);
  const openingDone = openingItems.filter((item) => item.checked).length;
  const closingDone = closingItems.filter((item) => item.checked).length;
  const totalItems = openingItems.length + closingItems.length;
  const totalDone = openingDone + closingDone;
  const progressValue = totalItems
    ? `${Math.round((totalDone / totalItems) * 100)}%`
    : "0%";

  return {
    date,
    summary: [
      {
        label: "Abertura",
        value: `${openingDone}/${openingItems.length}`,
        description: "Itens concluidos na abertura do turno.",
      },
      {
        label: "Fechamento",
        value: `${closingDone}/${closingItems.length}`,
        description: "Itens concluidos para encerrar o turno com seguranca.",
      },
      {
        label: "Progresso total",
        value: progressValue,
        description: "Visao unificada da disciplina operacional do dia.",
      },
    ],
    openingItems,
    closingItems,
    latestEvents,
    usingSupabase: true,
  };
}

function getIncidentSeverityRank(severity) {
  const rank = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  return rank[severity] ?? 1;
}

function createIncidentsFallbackBoard() {
  return {
    summary: [
      {
        label: "Incidentes abertos",
        value: "0",
        description: "Sem leitura de incidentes no momento.",
      },
      {
        label: "Criticidade alta",
        value: "0",
        description: "Sem leitura de severidade no momento.",
      },
      {
        label: "Resolvidos hoje",
        value: "0",
        description: "Sem leitura de resolucoes no momento.",
      },
    ],
    openIncidents: [],
    resolvedIncidents: [],
    recentIncidents: [],
    usingSupabase: false,
  };
}

export async function getIncidentsBoard() {
  const adminClient = getSupabaseAdminClient();

  if (!adminClient) {
    return createIncidentsFallbackBoard();
  }

  const { date, startIso, endIso } = getTodayInBrazilWithTime();
  const logsResult = await adminClient
    .from("operation_audit_logs")
    .select(
      "id, actor_name, actor_role, event_type, entity_id, entity_label, description, metadata, created_at",
    )
    .in("event_type", ["incident_reported", "incident_resolved"])
    .order("created_at", { ascending: true })
    .limit(500);

  if (logsResult.error) {
    return createIncidentsFallbackBoard();
  }

  const incidentsMap = new Map();

  for (const row of logsResult.data ?? []) {
    const metadata = row.metadata ?? {};
    const incidentId = String(row.entity_id ?? "").trim();
    if (!incidentId) {
      continue;
    }

    const currentIncident = incidentsMap.get(incidentId) ?? {
      id: incidentId,
      title: String(metadata.title ?? "").trim() || row.entity_label || incidentId,
      category: String(metadata.category ?? "geral").trim(),
      severity: String(metadata.severity ?? "low").trim(),
      location: String(metadata.location ?? "").trim(),
      description: String(metadata.description ?? row.description ?? "").trim(),
      status: "open",
      reportedBy: row.actor_name || "Equipe",
      reportedByRole: row.actor_role || "staff",
      createdAt: row.created_at,
      resolvedAt: null,
      resolvedBy: "",
      resolutionNote: "",
    };

    if (row.event_type === "incident_reported") {
      currentIncident.status = "open";
      currentIncident.createdAt = currentIncident.createdAt || row.created_at;
      currentIncident.title =
        String(metadata.title ?? "").trim() || currentIncident.title;
      currentIncident.category =
        String(metadata.category ?? "").trim() || currentIncident.category;
      currentIncident.severity =
        String(metadata.severity ?? "").trim() || currentIncident.severity;
      currentIncident.location =
        String(metadata.location ?? "").trim() || currentIncident.location;
      currentIncident.description =
        String(metadata.description ?? "").trim() || currentIncident.description;
      currentIncident.reportedBy = row.actor_name || currentIncident.reportedBy;
      currentIncident.reportedByRole =
        row.actor_role || currentIncident.reportedByRole;
    }

    if (row.event_type === "incident_resolved") {
      currentIncident.status = "resolved";
      currentIncident.resolvedAt = row.created_at;
      currentIncident.resolvedBy = row.actor_name || "Equipe";
      currentIncident.resolutionNote = String(metadata.resolutionNote ?? "").trim();
    }

    incidentsMap.set(incidentId, currentIncident);
  }

  const allIncidents = Array.from(incidentsMap.values());
  const openIncidents = allIncidents
    .filter((incident) => incident.status === "open")
    .sort((left, right) => {
      const severityDiff =
        getIncidentSeverityRank(right.severity) -
        getIncidentSeverityRank(left.severity);
      if (severityDiff !== 0) {
        return severityDiff;
      }

      return (
        (parseDateTime(right.createdAt)?.getTime() ?? 0) -
        (parseDateTime(left.createdAt)?.getTime() ?? 0)
      );
    });
  const resolvedIncidents = allIncidents
    .filter((incident) => incident.status === "resolved")
    .sort(
      (left, right) =>
        (parseDateTime(right.resolvedAt)?.getTime() ?? 0) -
        (parseDateTime(left.resolvedAt)?.getTime() ?? 0),
    );
  const resolvedToday = resolvedIncidents.filter((incident) => {
    if (!incident.resolvedAt) {
      return false;
    }

    const resolvedTimestamp = parseDateTime(incident.resolvedAt)?.getTime();
    const startTimestamp = parseDateTime(startIso)?.getTime() ?? 0;
    const endTimestamp = parseDateTime(endIso)?.getTime() ?? 0;

    if (!resolvedTimestamp) {
      return false;
    }

    return resolvedTimestamp >= startTimestamp && resolvedTimestamp <= endTimestamp;
  });

  return {
    summary: [
      {
        label: "Incidentes abertos",
        value: String(openIncidents.length),
        description: "Itens que ainda exigem acompanhamento da equipe.",
      },
      {
        label: "Criticidade alta",
        value: String(
          openIncidents.filter((incident) =>
            ["critical", "high"].includes(incident.severity),
          ).length,
        ),
        description: "Ocorrencias abertas com risco elevado para operacao.",
      },
      {
        label: "Resolvidos hoje",
        value: String(resolvedToday.length),
        description: `Incidentes concluidos em ${date}.`,
      },
    ],
    openIncidents,
    resolvedIncidents,
    recentIncidents: allIncidents
      .slice()
      .sort(
        (left, right) =>
          (parseDateTime(right.createdAt)?.getTime() ?? 0) -
          (parseDateTime(left.createdAt)?.getTime() ?? 0),
      )
      .slice(0, 8),
    usingSupabase: true,
  };
}

export { campaignStatusMeta, checklistTemplate, kitchenColumns, shiftStatusMeta };
