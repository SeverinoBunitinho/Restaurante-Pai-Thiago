import "server-only";

import { orderStatusMeta } from "@/lib/staff-data";
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
      statusMeta: campaignStatusMeta,
      usingSupabase: false,
    };
  }

  const [campaignsResult, couponsResult] = await Promise.all([
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
  ]);

  if (campaignsResult.error || couponsResult.error) {
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
      .select("id, reservation_date, status")
      .gte("created_at", startIso),
    supabase
      .from("orders")
      .select("id, item_name, quantity, total_price, fulfillment_type, status, created_at")
      .gte("created_at", startIso),
    supabase
      .from("service_checks")
      .select("id, total, status, opened_at")
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
  let deliveryOrders = 0;

  for (const reservation of reservations) {
    const day = String(reservation.reservation_date ?? "");
    reservationsByDay.set(day, (reservationsByDay.get(day) ?? 0) + 1);
  }

  for (const order of orders) {
    const createdAt = parseDateTime(order.created_at);
    if (!createdAt) {
      continue;
    }

    const day = formatBrazilDate(createdAt).split("/").reverse().join("-");
    ordersByDay.set(day, (ordersByDay.get(day) ?? 0) + 1);

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
    const openedAt = parseDateTime(check.opened_at);
    if (!openedAt) {
      continue;
    }

    const day = formatBrazilDate(openedAt).split("/").reverse().join("-");
    revenueByDay.set(day, (revenueByDay.get(day) ?? 0) + Number(check.total ?? 0));
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
    insights: [
      `${deliveryShare}% dos pedidos recentes foram em delivery.`,
      topItems.length
        ? `Item com maior tracao: ${topItems[0].name} (${topItems[0].quantity} unidade(s)).`
        : "Ainda nao ha itens suficientes para indicar tracao de cardapio.",
      demandByWeekday.length
        ? `Dia da semana com maior demanda: ${demandByWeekday[0].weekday}.`
        : "Ainda nao ha historico suficiente para leitura por dia da semana.",
    ],
    usingSupabase: true,
  };
}

export { campaignStatusMeta, kitchenColumns, shiftStatusMeta };
