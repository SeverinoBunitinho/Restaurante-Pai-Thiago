import "server-only";

import { getMenuCategories } from "@/lib/site-data";
import { sortStaffDirectory } from "@/lib/staff-modules";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const reservationStatusMeta = {
  pending: {
    label: "Pendente",
    badge: "bg-[rgba(182,135,66,0.12)] text-[var(--gold)]",
  },
  confirmed: {
    label: "Confirmada",
    badge: "bg-[rgba(95,123,109,0.12)] text-[var(--sage)]",
  },
  seated: {
    label: "No salao",
    badge: "bg-[rgba(20,35,29,0.12)] text-[var(--forest)]",
  },
  completed: {
    label: "Finalizada",
    badge: "bg-[rgba(57,111,91,0.12)] text-[rgba(57,111,91,1)]",
  },
  cancelled: {
    label: "Cancelada",
    badge: "bg-[rgba(138,93,59,0.12)] text-[var(--clay)]",
  },
};

export const orderStatusMeta = {
  received: {
    label: "Recebido",
    badge: "bg-[rgba(182,135,66,0.12)] text-[var(--gold)]",
  },
  preparing: {
    label: "Em preparo",
    badge: "bg-[rgba(20,35,29,0.12)] text-[var(--forest)]",
  },
  ready: {
    label: "Pronto",
    badge: "bg-[rgba(57,111,91,0.12)] text-[rgba(57,111,91,1)]",
  },
  dispatching: {
    label: "Saiu para entrega",
    badge: "bg-[rgba(88,120,176,0.14)] text-[rgba(58,84,132,1)]",
  },
  delivered: {
    label: "Entregue",
    badge: "bg-[rgba(95,123,109,0.12)] text-[var(--sage)]",
  },
  cancelled: {
    label: "Cancelado",
    badge: "bg-[rgba(138,93,59,0.12)] text-[var(--clay)]",
  },
};

function getTodayInBrazil() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function mapReservation(reservation) {
  const assignedTable = reservation.assigned_table;
  const area =
    assignedTable?.name && assignedTable?.area
      ? `${assignedTable.name} - ${assignedTable.area}`
      : reservation.area_preference ?? "Salao principal";

  return {
    id: reservation.id,
    guestName: reservation.guest_name,
    date: reservation.reservation_date,
    time: String(reservation.reservation_time).slice(0, 5),
    guests: reservation.guests,
    occasion: reservation.occasion ?? "Visita na casa",
    status: reservation.status,
    area,
    notes: reservation.notes ?? "",
  };
}

function mapOrder(order) {
  const quantity = Number(order.quantity ?? 0);
  const totalPrice = Number(order.total_price ?? 0);

  return {
    id: order.id,
    guestName: order.guest_name,
    guestEmail: order.guest_email ?? "",
    checkoutReference: order.checkout_reference ?? "",
    itemName: order.item_name,
    quantity,
    unitPrice:
      Number(order.unit_price ?? NaN) ||
      (quantity > 0 ? totalPrice / quantity : 0),
    totalPrice,
    notes: order.notes ?? "",
    paymentMethod: order.payment_method ?? "pix",
    fulfillmentType: order.fulfillment_type ?? "pickup",
    deliveryNeighborhood: order.delivery_neighborhood ?? "",
    deliveryAddress: order.delivery_address ?? "",
    deliveryReference: order.delivery_reference ?? "",
    deliveryFee: Number(order.delivery_fee ?? 0),
    deliveryEtaMinutes: Number(order.delivery_eta_minutes ?? 0),
    status: order.status,
    createdAt: order.created_at,
  };
}

function getOrderStatusPriority(status) {
  const priority = {
    received: 0,
    preparing: 1,
    ready: 2,
    dispatching: 3,
    delivered: 4,
    cancelled: 5,
  };

  return priority[status] ?? 0;
}

function groupOrdersByCheckout(liveOrders) {
  const groups = new Map();

  for (const order of liveOrders) {
    const groupKey = order.checkoutReference || order.id;
    const currentGroup = groups.get(groupKey) ?? {
      id: groupKey,
      checkoutReference:
        order.checkoutReference || `ITEM-${order.id.slice(0, 8).toUpperCase()}`,
      guestName: order.guestName,
      guestEmail: order.guestEmail,
      paymentMethod: order.paymentMethod,
      fulfillmentType: order.fulfillmentType,
      deliveryNeighborhood: order.deliveryNeighborhood,
      deliveryAddress: order.deliveryAddress,
      deliveryReference: order.deliveryReference,
      deliveryFee: order.deliveryFee,
      deliveryEtaMinutes: order.deliveryEtaMinutes,
      createdAt: order.createdAt,
      orderIds: [],
      items: [],
      subtotal: 0,
      totalItems: 0,
      statuses: [],
    };

    currentGroup.orderIds.push(order.id);
    currentGroup.items.push(order);
    currentGroup.totalItems += order.quantity;
    currentGroup.subtotal += order.totalPrice;
    currentGroup.statuses.push(order.status);

    if (new Date(order.createdAt) < new Date(currentGroup.createdAt)) {
      currentGroup.createdAt = order.createdAt;
    }

    groups.set(groupKey, currentGroup);
  }

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      status: [...group.statuses].sort(
        (left, right) => getOrderStatusPriority(left) - getOrderStatusPriority(right),
      )[0],
      totalPrice: group.subtotal + Number(group.deliveryFee ?? 0),
    }))
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
}

function buildFallbackReservationBoard() {
  return {
    summary: [
      {
        label: "Pendentes",
        value: "0",
        description: "Nenhuma solicitacao pode ser exibida enquanto a leitura estiver em contingencia.",
      },
      {
        label: "Confirmadas",
        value: "0",
        description: "As confirmacoes voltam a aparecer quando o painel recuperar a conexao.",
      },
      {
        label: "Concluidas",
        value: "0",
        description: "O historico volta a ser preenchido assim que a sincronizacao for retomada.",
      },
    ],
    reservations: [],
    usingSupabase: false,
  };
}

function buildFallbackTablesBoard() {
  return {
    today: getTodayInBrazil(),
    summary: [
      {
        label: "Mesas ativas",
        value: "0",
        description: "A estrutura volta a ser lida quando o banco responder novamente.",
      },
      {
        label: "Areas com demanda",
        value: "0",
        description: "Sem leitura consolidada dos setores neste momento.",
      },
      {
        label: "Reservas de hoje",
        value: "0",
        description: "O movimento do dia reaparece assim que a sincronizacao for retomada.",
      },
    ],
    tables: [],
    areaDemand: [],
    usingSupabase: false,
  };
}

function buildFallbackServiceBoard() {
  return {
    summary: [
      {
        label: "Ocasioes especiais",
        value: "0",
        description: "Nenhuma leitura especial pode ser exibida sem a camada operacional ativa.",
      },
      {
        label: "Com observacoes",
        value: "0",
        description: "As notas do atendimento retornam quando a sincronizacao for restabelecida.",
      },
      {
        label: "Chegadas de hoje",
        value: "0",
        description: "O turno de hoje volta a ser exibido assim que o painel recuperar a conexao.",
      },
    ],
    priorityGuests: [],
    moments: [
      {
        key: "preparo",
        title: "Antes da chegada",
        items: [],
      },
      {
        key: "recepcao",
        title: "Recepcao e acomodacao",
        items: [],
      },
      {
        key: "ritmo",
        title: "Mesa em andamento",
        items: [],
      },
    ],
    areaFocus: [],
    usingSupabase: false,
  };
}

function buildFallbackSeatingBoard() {
  return {
    summary: [
      {
        label: "Mesas prontas",
        value: "0",
        description: "Nenhuma mesa pode ser lida enquanto a estrutura estiver em contingencia.",
      },
      {
        label: "Reservas sem mesa",
        value: "0",
        description: "A fila de acomodacao volta a aparecer assim que a sincronizacao retornar.",
      },
      {
        label: "Setores ativos",
        value: "0",
        description: "Os setores ativos serao exibidos quando o painel recuperar os dados.",
      },
    ],
    opportunities: [],
    assignments: [],
    tables: [],
    usingSupabase: false,
  };
}

function buildFallbackStaffDirectory() {
  return {
    staff: [],
    usingSupabase: false,
  };
}

function buildFallbackMenuManagement() {
  return {
    summary: [
      {
        label: "Categorias",
        value: "0",
        description: "Nenhuma categoria pode ser lida enquanto a sincronizacao estiver indisponivel.",
      },
      {
        label: "Itens ativos",
        value: "0",
        description: "O catalogo volta a refletir a cozinha assim que o banco responder novamente.",
      },
    ],
    categories: [],
    usingSupabase: false,
  };
}

function buildFallbackExecutiveBoard() {
  return {
    metrics: [
      {
        label: "Reservas totais",
        value: "0",
        description: "O movimento consolidado reaparece quando a visao executiva sincronizar.",
      },
      {
        label: "Equipe ativa",
        value: "0",
        description: "A leitura da equipe retorna assim que a conexao for retomada.",
      },
      {
        label: "Itens no cardapio",
        value: "0",
        description: "O catalogo executivo fica temporariamente sem leitura.",
      },
      {
        label: "Mesas ativas",
        value: "0",
        description: "A estrutura do restaurante sera exibida novamente apos a reconexao.",
      },
      {
        label: "Reservas hoje",
        value: "0",
        description: "Sem leitura do turno atual enquanto o painel estiver em contingencia.",
      },
      {
        label: "Clientes cadastrados",
        value: "0",
        description: "A base de clientes volta a aparecer quando o Supabase responder.",
      },
    ],
    insights: [
      "A leitura executiva entrou em contingencia e aguarda a retomada da conexao com o banco.",
      "A navegacao da area do dono segue disponivel para preservar o acesso aos modulos internos.",
      "Quando a sincronizacao voltar, indicadores, equipe, clientes e menu reaparecem automaticamente.",
    ],
    usingSupabase: false,
  };
}

function buildFallbackOrdersBoard() {
  return {
    summary: [
      {
        label: "Pedidos recebidos",
        value: "0",
        description: "Nenhum fechamento pode ser exibido enquanto a fila estiver em contingencia.",
      },
      {
        label: "Em preparo",
        value: "0",
        description: "A producao volta a aparecer assim que a operacao recuperar os dados.",
      },
      {
        label: "Prontos",
        value: "0",
        description: "Nenhum pedido pronto pode ser lido enquanto a sincronizacao estiver indisponivel.",
      },
      {
        label: "Em rota",
        value: "0",
        description: "As entregas voltam a ser listadas quando a conexao for retomada.",
      },
    ],
    liveOrders: [],
    groupedOrders: [],
    usingSupabase: false,
  };
}

export async function getReservationsBoard() {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return buildFallbackReservationBoard();
  }

  const [
    pendingResult,
    confirmedResult,
    completedResult,
    reservationsResult,
  ] = await Promise.all([
    supabase
      .from("reservations")
      .select("*", { head: true, count: "exact" })
      .eq("status", "pending"),
    supabase
      .from("reservations")
      .select("*", { head: true, count: "exact" })
      .eq("status", "confirmed"),
    supabase
      .from("reservations")
      .select("*", { head: true, count: "exact" })
      .eq("status", "completed"),
    supabase
      .from("reservations")
      .select(
        "id, guest_name, reservation_date, reservation_time, guests, occasion, status, notes, area_preference, assigned_table:restaurant_tables(name, area)",
      )
      .order("reservation_date", { ascending: true })
      .order("reservation_time", { ascending: true })
      .limit(18),
  ]);

  if (
    pendingResult.error ||
    confirmedResult.error ||
    completedResult.error ||
    reservationsResult.error
  ) {
    return buildFallbackReservationBoard();
  }

  return {
    summary: [
      {
        label: "Pendentes",
        value: String(pendingResult.count ?? 0),
        description: "Solicitacoes aguardando retorno da equipe.",
      },
      {
        label: "Confirmadas",
        value: String(confirmedResult.count ?? 0),
        description: "Clientes com atendimento alinhado para o turno.",
      },
      {
        label: "Concluidas",
        value: String(completedResult.count ?? 0),
        description: "Experiencias finalizadas e historico consolidado.",
      },
    ],
    reservations: (reservationsResult.data ?? []).map(mapReservation),
    usingSupabase: true,
  };
}

export async function getTablesBoard() {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return buildFallbackTablesBoard();
  }

  const today = getTodayInBrazil();
  const [tablesResult, reservationsResult] = await Promise.all([
    supabase
      .from("restaurant_tables")
      .select("id, name, area, capacity, is_active")
      .eq("is_active", true)
      .order("area", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("reservations")
      .select(
        "id, reservation_time, status, area_preference, assigned_table:restaurant_tables(name, area)",
      )
      .eq("reservation_date", today),
  ]);

  if (tablesResult.error || reservationsResult.error) {
    return buildFallbackTablesBoard();
  }

  const areaDemandMap = new Map();

  for (const reservation of reservationsResult.data ?? []) {
    const area =
      reservation.assigned_table?.area ??
      reservation.area_preference ??
      "Salao principal";
    areaDemandMap.set(area, (areaDemandMap.get(area) ?? 0) + 1);
  }

  const tables = (tablesResult.data ?? []).map((table) => {
    const tableReservations = (reservationsResult.data ?? []).filter(
      (reservation) => reservation.assigned_table?.name === table.name,
    );

    const seatedReservation = tableReservations.find(
      (reservation) => reservation.status === "seated",
    );
    const futureReservation = tableReservations.find(
      (reservation) =>
        reservation.status === "confirmed" || reservation.status === "pending",
    );

    let state = "livre";
    let detail = "Sem reserva atribuida no momento.";

    if (seatedReservation) {
      state = "ocupada";
      detail = `Atendimento em andamento desde ${String(seatedReservation.reservation_time).slice(0, 5)}.`;
    } else if (futureReservation) {
      state = "reservada";
      detail = `Reserva prevista para ${String(futureReservation.reservation_time).slice(0, 5)}.`;
    } else if ((areaDemandMap.get(table.area) ?? 0) > 0) {
      detail = `${areaDemandMap.get(table.area)} reserva(s) previstas para ${table.area}.`;
    }

    return {
      id: table.id,
      name: table.name,
      area: table.area,
      capacity: table.capacity,
      state,
      isActive: table.is_active,
      detail,
    };
  });

  return {
    today,
    summary: [
      {
        label: "Mesas ativas",
        value: String(tables.length),
        description: "Estrutura liberada para o atendimento.",
      },
      {
        label: "Areas com demanda",
        value: String(areaDemandMap.size),
        description: "Leitura rapida dos setores mais requisitados.",
      },
      {
        label: "Reservas de hoje",
        value: String((reservationsResult.data ?? []).length),
        description: `Movimento previsto para ${today}.`,
      },
    ],
    tables,
    areaDemand: Array.from(areaDemandMap.entries()).map(([area, reservations]) => ({
      area,
      reservations,
    })),
    usingSupabase: true,
  };
}

export async function getSeatingBoard() {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return buildFallbackSeatingBoard();
  }

  const today = getTodayInBrazil();
  const [tablesResult, reservationsResult] = await Promise.all([
    supabase
      .from("restaurant_tables")
      .select("id, name, area, capacity, is_active")
      .order("area", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("reservations")
      .select(
        "id, assigned_table_id, guest_name, reservation_date, reservation_time, guests, occasion, status, notes, area_preference, assigned_table:restaurant_tables(id, name, area, capacity)",
      )
      .eq("reservation_date", today)
      .in("status", ["pending", "confirmed", "seated"])
      .order("reservation_time", { ascending: true }),
  ]);

  if (tablesResult.error || reservationsResult.error) {
    return buildFallbackSeatingBoard();
  }

  const reservations = reservationsResult.data ?? [];
  const tables = tablesResult.data ?? [];
  const mappedTables = tables.map((table) => {
    const activeReservation = reservations.find(
      (reservation) => reservation.assigned_table_id === table.id,
    );

    let state = "livre";
    let detail = "Mesa pronta para acomodar a proxima experiencia.";

    if (!table.is_active) {
      state = "pausada";
      detail = "Setor pausado temporariamente pela gestao.";
    } else if (activeReservation?.status === "seated") {
      state = "ocupada";
      detail = `Atendimento em andamento para ${activeReservation.guest_name}.`;
    } else if (activeReservation) {
      state = "reservada";
      detail = `Separada para ${activeReservation.guest_name} as ${String(activeReservation.reservation_time).slice(0, 5)}.`;
    }

    return {
      id: table.id,
      name: table.name,
      area: table.area,
      capacity: table.capacity,
      isActive: table.is_active,
      state,
      detail,
    };
  });

  const opportunities = reservations
    .filter((reservation) => !reservation.assigned_table_id)
    .map((reservation) => {
      const preferredArea = reservation.area_preference ?? "";
      const suggestedTables = mappedTables
        .filter(
          (table) =>
            table.isActive &&
            table.state === "livre" &&
            table.capacity >= reservation.guests,
        )
        .sort((left, right) => {
          const leftAreaScore = left.area === preferredArea ? 0 : 1;
          const rightAreaScore = right.area === preferredArea ? 0 : 1;

          if (leftAreaScore !== rightAreaScore) {
            return leftAreaScore - rightAreaScore;
          }

          return left.capacity - right.capacity;
        })
        .slice(0, 3)
        .map((table) => ({
          id: table.id,
          name: table.name,
          area: table.area,
          capacity: table.capacity,
        }));

      return {
        id: reservation.id,
        guestName: reservation.guest_name,
        guests: reservation.guests,
        date: reservation.reservation_date,
        time: String(reservation.reservation_time).slice(0, 5),
        status: reservation.status,
        occasion: reservation.occasion ?? "Visita na casa",
        areaPreference: reservation.area_preference ?? "Sem preferencia",
        notes: reservation.notes ?? "",
        suggestedTables,
      };
    });

  const assignments = reservations
    .filter((reservation) => reservation.assigned_table)
    .map((reservation) => ({
      id: reservation.id,
      guestName: reservation.guest_name,
      guests: reservation.guests,
      date: reservation.reservation_date,
      time: String(reservation.reservation_time).slice(0, 5),
      status: reservation.status,
      occasion: reservation.occasion ?? "Visita na casa",
      assignedTable: {
        id: reservation.assigned_table.id,
        name: reservation.assigned_table.name,
        area: reservation.assigned_table.area,
        capacity: reservation.assigned_table.capacity,
      },
    }));

  return {
    summary: [
      {
        label: "Mesas prontas",
        value: String(mappedTables.filter((table) => table.state === "livre").length),
        description: "Estrutura imediatamente disponivel para acomodacao.",
      },
      {
        label: "Reservas sem mesa",
        value: String(opportunities.length),
        description: "Chegadas que ainda pedem distribuicao no salao.",
      },
      {
        label: "Setores ativos",
        value: String(
          new Set(
            mappedTables
              .filter((table) => table.isActive)
              .map((table) => table.area),
          ).size,
        ),
        description: "Areas liberadas para operar no turno de hoje.",
      },
    ],
    opportunities,
    assignments,
    tables: mappedTables,
    usingSupabase: true,
  };
}

export async function getServiceBoard() {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return buildFallbackServiceBoard();
  }

  const today = getTodayInBrazil();
  const { data, error } = await supabase
    .from("reservations")
    .select(
      "id, guest_name, reservation_date, reservation_time, guests, occasion, status, notes, area_preference, assigned_table:restaurant_tables(name, area)",
    )
    .eq("reservation_date", today)
    .in("status", ["pending", "confirmed", "seated"])
    .order("reservation_time", { ascending: true });

  if (error) {
    return buildFallbackServiceBoard();
  }

  const reservations = (data ?? []).map(mapReservation);
  const priorityGuests = reservations
    .filter(
      (reservation) =>
        reservation.notes ||
        (reservation.occasion && reservation.occasion !== "Visita na casa"),
    )
    .map((reservation) => ({
      ...reservation,
      actionLabel: reservation.status === "pending"
        ? "Confirmar detalhes antes da chegada"
        : reservation.status === "confirmed"
          ? "Receber e conduzir com o contexto da visita"
          : "Acompanhar fechamento e satisfacao",
    }));

  const areaMap = new Map();

  for (const reservation of reservations) {
    const current = areaMap.get(reservation.area) ?? {
      area: reservation.area,
      reservations: 0,
      hospitality: "Fluxo regular do turno.",
    };

    current.reservations += 1;

    if (
      reservation.notes ||
      (reservation.occasion && reservation.occasion !== "Visita na casa")
    ) {
      current.hospitality =
        "Area com visita especial e necessidade de leitura mais cuidadosa.";
    }

    areaMap.set(reservation.area, current);
  }

  return {
    summary: [
      {
        label: "Ocasioes especiais",
        value: String(
          reservations.filter(
            (reservation) =>
              reservation.occasion && reservation.occasion !== "Visita na casa",
          ).length,
        ),
        description: "Momentos que pedem mais personalizacao no atendimento.",
      },
      {
        label: "Com observacoes",
        value: String(reservations.filter((reservation) => reservation.notes).length),
        description: "Notas de contexto para receber melhor o cliente.",
      },
      {
        label: "Chegadas de hoje",
        value: String(reservations.length),
        description: "Fluxo total de atendimento previsto para o dia.",
      },
    ],
    priorityGuests,
    moments: [
      {
        key: "preparo",
        title: "Antes da chegada",
        items: reservations
          .filter((reservation) => reservation.status === "pending")
          .map((reservation) => ({
            ...reservation,
            actionLabel: "Confirmar detalhes e alinhar mesa ideal",
          })),
      },
      {
        key: "recepcao",
        title: "Recepcao e acomodacao",
        items: reservations
          .filter((reservation) => reservation.status === "confirmed")
          .map((reservation) => ({
            ...reservation,
            actionLabel: "Receber, conduzir e apresentar o ritmo da casa",
          })),
      },
      {
        key: "ritmo",
        title: "Mesa em andamento",
        items: reservations
          .filter((reservation) => reservation.status === "seated")
          .map((reservation) => ({
            ...reservation,
            actionLabel: "Acompanhar satisfacao e preparar fechamento",
          })),
      },
    ],
    areaFocus: Array.from(areaMap.values()),
    usingSupabase: true,
  };
}

export async function getStaffDirectoryBoard() {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return buildFallbackStaffDirectory();
  }

  const [staffDirectoryResult, profilesResult] = await Promise.all([
    supabase
      .from("staff_directory")
      .select("id, email, full_name, role, active, created_at")
      .order("created_at", { ascending: true }),
    supabase
      .from("profiles")
      .select("email, role")
      .in("role", ["waiter", "manager", "owner"]),
  ]);

  if (staffDirectoryResult.error || profilesResult.error) {
    return buildFallbackStaffDirectory();
  }

  const profileEmails = new Set(
    (profilesResult.data ?? []).map((profile) => profile.email.toLowerCase()),
  );

  const staff = (staffDirectoryResult.data ?? [])
    .map((member) => ({
      ...member,
      hasAccount: profileEmails.has(member.email.toLowerCase()),
    }))
    .sort(sortStaffDirectory);

  return {
    staff,
    usingSupabase: true,
  };
}

export async function getMenuManagementBoard() {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return buildFallbackMenuManagement();
  }

  const categories = await getMenuCategories({ includeUnavailable: true });
  const items = categories.flatMap((category) => category.items);

  return {
    summary: [
      {
        label: "Categorias",
        value: String(categories.length),
        description: "Estrutura atual do cardapio.",
      },
      {
        label: "Itens ativos",
        value: String(items.filter((item) => item.available).length),
        description: "Pratos visiveis para o cliente no momento.",
      },
      {
        label: "Itens pausados",
        value: String(items.filter((item) => !item.available).length),
        description: "Produtos temporariamente indisponiveis.",
      },
    ],
    categories,
    usingSupabase: true,
  };
}

export async function getExecutiveBoard() {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return buildFallbackExecutiveBoard();
  }

  const [
    reservationsResult,
    todayResult,
    customerProfilesResult,
    staffProfilesResult,
    tablesResult,
    menuItemsResult,
  ] = await Promise.all([
    supabase.from("reservations").select("*", { head: true, count: "exact" }),
    supabase
      .from("reservations")
      .select("*", { head: true, count: "exact" })
      .eq("reservation_date", getTodayInBrazil()),
    supabase
      .from("profiles")
      .select("*", { head: true, count: "exact" })
      .eq("role", "customer"),
    supabase
      .from("profiles")
      .select("*", { head: true, count: "exact" })
      .in("role", ["waiter", "manager", "owner"]),
    supabase
      .from("restaurant_tables")
      .select("*", { head: true, count: "exact" })
      .eq("is_active", true),
    supabase.from("menu_items").select("*", { head: true, count: "exact" }),
  ]);

  if (
    reservationsResult.error ||
    todayResult.error ||
    customerProfilesResult.error ||
    staffProfilesResult.error ||
    tablesResult.error ||
    menuItemsResult.error
  ) {
    return buildFallbackExecutiveBoard();
  }

  return {
    metrics: [
      {
        label: "Reservas totais",
        value: String(reservationsResult.count ?? 0),
        description: "Base completa de relacionamento com clientes.",
      },
      {
        label: "Reservas hoje",
        value: String(todayResult.count ?? 0),
        description: "Movimento atual do restaurante.",
      },
      {
        label: "Clientes cadastrados",
        value: String(customerProfilesResult.count ?? 0),
        description: "Usuarios que podem reservar pela conta propria.",
      },
      {
        label: "Equipe ativa",
        value: String(staffProfilesResult.count ?? 0),
        description: "Profissionais operando com acesso interno.",
      },
      {
        label: "Mesas ativas",
        value: String(tablesResult.count ?? 0),
        description: "Capacidade disponivel para os turnos.",
      },
      {
        label: "Itens no menu",
        value: String(menuItemsResult.count ?? 0),
        description: "Catalogo atual da cozinha.",
      },
    ],
    insights: [
      `${todayResult.count ?? 0} atendimento(s) programado(s) para hoje no sistema.`,
      `${staffProfilesResult.count ?? 0} perfil(is) internos com papel operacional ativo.`,
      `${menuItemsResult.count ?? 0} item(ns) de menu sustentando a experiencia atual da casa.`,
    ],
    usingSupabase: true,
  };
}

export async function getOrdersBoard() {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return buildFallbackOrdersBoard();
  }

  const ordersResult = await supabase
    .from("orders")
    .select(
      "id, guest_name, guest_email, checkout_reference, item_name, quantity, unit_price, total_price, notes, payment_method, fulfillment_type, delivery_neighborhood, delivery_address, delivery_reference, delivery_fee, delivery_eta_minutes, status, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(18);

  if (ordersResult.error) {
    return buildFallbackOrdersBoard();
  }

  const liveOrders = (ordersResult.data ?? []).map(mapOrder);

  const groupedOrders = groupOrdersByCheckout(liveOrders);

  return {
    summary: [
      {
        label: "Pedidos recebidos",
        value: String(groupedOrders.filter((order) => order.status === "received").length),
        description: "Pedidos que acabaram de entrar no sistema.",
      },
      {
        label: "Em preparo",
        value: String(groupedOrders.filter((order) => order.status === "preparing").length),
        description: "Fluxo atual da cozinha e da operacao.",
      },
      {
        label: "Prontos",
        value: String(groupedOrders.filter((order) => order.status === "ready").length),
        description: "Itens aguardando entrega ou retirada pela equipe.",
      },
      {
        label: "Em rota",
        value: String(groupedOrders.filter((order) => order.status === "dispatching").length),
        description: "Pedidos de delivery em deslocamento para o cliente.",
      },
    ],
    liveOrders,
    groupedOrders,
    usingSupabase: true,
  };
}

export async function getOrderCheckoutPrintReport(checkoutReference) {
  const supabase = await getSupabaseServerClient();

  if (!supabase || !checkoutReference) {
    return null;
  }

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, guest_name, guest_email, checkout_reference, item_name, quantity, unit_price, total_price, notes, payment_method, fulfillment_type, delivery_neighborhood, delivery_address, delivery_reference, delivery_fee, delivery_eta_minutes, status, created_at, updated_at",
    )
    .eq("checkout_reference", checkoutReference)
    .order("created_at", { ascending: true });

  if (error || !data?.length) {
    return null;
  }

  const mappedOrders = data.map(mapOrder);
  const groupedOrders = groupOrdersByCheckout(mappedOrders);
  const report =
    groupedOrders.find(
      (group) => group.checkoutReference === checkoutReference,
    ) ?? groupedOrders[0];

  if (!report) {
    return null;
  }

  const firstOrder = data[0];
  const lastOrder = data[data.length - 1];

  return {
    ...report,
    guestName: report.guestName || firstOrder.guest_name || "",
    guestEmail: report.guestEmail || firstOrder.guest_email || "",
    createdAt: report.createdAt,
    updatedAt: lastOrder.updated_at || lastOrder.created_at,
  };
}
