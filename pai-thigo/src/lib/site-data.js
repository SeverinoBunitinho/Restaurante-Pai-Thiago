import "server-only";

import {
  menuCategories as fallbackMenuCategories,
  operationsModules,
  restaurantInfo as fallbackRestaurantInfo,
} from "@/lib/mock-data";
import { getRestaurantProfile } from "@/lib/restaurant-profile";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  formatCurrency,
  fulfillmentTypeOptions,
  paymentMethodOptions,
} from "@/lib/utils";

const fallbackReservationAreas = [
  "Salao principal",
  "Lounge",
  "Sala reservada",
  "Varanda",
];

function getTodayInBrazil() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getFulfillmentStatusPriority(status) {
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

function getDeliveryNeighborhoodConfig(slug) {
  return (
    fallbackRestaurantInfo.delivery.neighborhoods.find(
      (item) => item.slug === slug,
    ) ?? null
  );
}

function groupCustomerOrdersByCheckout(orders) {
  const groups = new Map();

  for (const order of orders) {
    const groupKey = order.checkoutReference || order.id;
    const currentGroup = groups.get(groupKey) ?? {
      id: groupKey,
      checkoutReference:
        order.checkoutReference || `ITEM-${order.id.slice(0, 8).toUpperCase()}`,
      createdAt: order.createdAt,
      paymentMethod: order.paymentMethod,
      fulfillmentType: order.fulfillmentType,
      deliveryNeighborhood: order.deliveryNeighborhood,
      deliveryAddress: order.deliveryAddress,
      deliveryReference: order.deliveryReference,
      deliveryFee: order.deliveryFee,
      deliveryEtaMinutes: order.deliveryEtaMinutes,
      items: [],
      statuses: [],
      subtotal: 0,
      totalItems: 0,
    };

    currentGroup.items.push(order);
    currentGroup.statuses.push(order.status);
    currentGroup.subtotal += order.totalPrice;
    currentGroup.totalItems += order.quantity;

    if (new Date(order.createdAt) < new Date(currentGroup.createdAt)) {
      currentGroup.createdAt = order.createdAt;
    }

    groups.set(groupKey, currentGroup);
  }

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      status: [...group.statuses].sort(
        (left, right) =>
          getFulfillmentStatusPriority(left) - getFulfillmentStatusPriority(right),
      )[0],
      grandTotal: group.subtotal + Number(group.deliveryFee ?? 0),
    }))
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
}

function mapMenuCategory(category, includeUnavailable = false) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
    accent: category.highlight_color ?? "gold",
    items: (category.menu_items ?? [])
      .filter((item) => includeUnavailable || item.is_available)
      .sort((left, right) => (left.sort_order ?? 0) - (right.sort_order ?? 0))
      .map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: Number(item.price),
        prepTime: item.prep_time ?? "12 min",
        spiceLevel: item.spice_level ?? "suave",
        tags: item.tags ?? [],
        allergens: item.allergens ?? [],
        signature: Boolean(item.is_signature),
        available: item.is_available ?? true,
      })),
  };
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
  return {
    id: order.id,
    reservationId: order.reservation_id,
    checkoutReference: order.checkout_reference ?? "",
    itemName: order.item_name,
    quantity: order.quantity,
    unitPrice: Number(order.unit_price),
    totalPrice: Number(order.total_price),
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

function buildFallbackCustomerDashboard() {
  return {
    profile: {
      fullName: "Cliente",
      email: "",
      phone: "",
      loyaltyPoints: 0,
      preferredRoom: "Salao principal",
    },
    metrics: [
      {
        label: "Reservas realizadas",
        value: "0",
        description: "Seu historico volta a aparecer assim que a sincronizacao for retomada.",
      },
      {
        label: "Pedidos em aberto",
        value: "0",
        description: "Nenhum pedido pode ser exibido enquanto a leitura estiver em contingencia.",
      },
      {
        label: "Pontos da casa",
        value: "0",
        description: "Os beneficios da conta retornam quando o painel recuperar a conexao.",
      },
    ],
    reservations: [],
    orders: [],
    orderGroups: [],
    notice:
      "Sua area continua disponivel, mas os dados pessoais estao aguardando sincronizacao com o banco neste momento.",
    usingSupabase: false,
  };
}

function buildFallbackMenuCategories(includeUnavailable = false) {
  return fallbackMenuCategories
    .map((category) => ({
      ...category,
      items: includeUnavailable
        ? category.items
        : category.items.filter((item) => item.available),
    }))
    .filter((category) => includeUnavailable || category.items.length > 0);
}

function buildFallbackStaffDashboard(role) {
  const roleHighlights = {
    waiter: {
      label: "Mesas em atendimento",
      value: "0",
      description: "O salao volta a ser medido assim que a leitura operacional for retomada.",
    },
    manager: {
      label: "Equipe escalada",
      value: "0",
      description: "A cobertura do turno sera exibida quando a sincronizacao estiver ativa.",
    },
    owner: {
      label: "Capacidade ativa",
      value: "0",
      description: "A capacidade ativa volta a aparecer quando o painel recuperar os dados.",
    },
  };

  return {
    stats: [
      {
        label: "Reservas totais",
        value: "0",
        description: "Sem leitura consolidada enquanto o banco nao responde.",
      },
      {
        label: "Pendentes",
        value: "0",
        description: "As pendencias voltam a ser contadas quando a operacao sincronizar.",
      },
      {
        label: "Hoje",
        value: "0",
        description: "O turno de hoje sera exibido novamente apos a reconexao.",
      },
      roleHighlights[role] ?? roleHighlights.waiter,
    ],
    reservations: [],
    modules: operationsModules,
    alerts: [
      "O painel interno entrou em modo de contingencia e esta preservando a navegacao da equipe.",
      "Assim que a conexao com o banco for retomada, reservas, pedidos e indicadores voltam a refletir a operacao real.",
    ],
    usingSupabase: false,
  };
}

export async function getMenuCategories(options = {}) {
  const { includeUnavailable = false } = options;
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return buildFallbackMenuCategories(includeUnavailable);
  }

  const { data, error } = await supabase
    .from("menu_categories")
    .select(
      "id, name, slug, description, highlight_color, sort_order, menu_items(id, name, description, price, prep_time, spice_level, tags, allergens, is_signature, is_available, sort_order)",
    )
    .order("sort_order", { ascending: true });

  if (error || !data?.length) {
    return buildFallbackMenuCategories(includeUnavailable);
  }

  return data
    .map((category) => mapMenuCategory(category, includeUnavailable))
    .filter((category) => includeUnavailable || category.items.length > 0);
}

export async function getReservationAreaOptions() {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return fallbackReservationAreas;
  }

  const { data, error } = await supabase
    .from("restaurant_tables")
    .select("area")
    .eq("is_active", true)
    .order("area", { ascending: true });

  if (error || !data?.length) {
    return fallbackReservationAreas;
  }

  return Array.from(
    new Set(
      data
        .map((row) => row.area?.trim())
        .filter(Boolean),
    ),
  );
}

export async function getCustomerDashboard(userId) {
  const supabase = await getSupabaseServerClient();

  if (!supabase || !userId) {
    return buildFallbackCustomerDashboard();
  }

  const [
    { data: profile },
    { data: reservations, error: reservationsError },
    { data: orders, error: ordersError },
  ] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, email, phone, loyalty_points, preferred_room")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("reservations")
        .select(
          "id, guest_name, reservation_date, reservation_time, guests, occasion, status, notes, area_preference, assigned_table:restaurant_tables(name, area)",
        )
        .eq("user_id", userId)
        .order("reservation_date", { ascending: true })
        .order("reservation_time", { ascending: true })
        .limit(6),
      supabase
        .from("orders")
        .select(
          "id, reservation_id, checkout_reference, item_name, quantity, unit_price, total_price, notes, payment_method, fulfillment_type, delivery_neighborhood, delivery_address, delivery_reference, delivery_fee, delivery_eta_minutes, status, created_at",
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

  if (reservationsError || ordersError) {
    return buildFallbackCustomerDashboard();
  }

  const mappedReservations = (reservations ?? []).map(mapReservation);
  const mappedOrders = (orders ?? []).map(mapOrder);
  const orderGroups = groupCustomerOrdersByCheckout(mappedOrders);
  const openOrdersCount = orderGroups.filter(
    (order) => !["delivered", "cancelled"].includes(order.status),
  );

  return {
    profile: {
      fullName: profile?.full_name ?? "Cliente",
      email: profile?.email ?? "",
      phone: profile?.phone ?? "",
      loyaltyPoints: profile?.loyalty_points ?? 0,
      preferredRoom: profile?.preferred_room ?? "Salao principal",
    },
    metrics: [
      {
        label: "Reservas realizadas",
        value: String(mappedReservations.length),
        description: "Historico centralizado na sua conta.",
      },
      {
        label: "Pedidos em aberto",
        value: String(openOrdersCount.length),
        description: openOrdersCount.length
          ? "Seu pedido esta em acompanhamento pela equipe."
          : "Nenhum pedido aguardando preparo no momento.",
      },
      {
        label: "Pontos da casa",
        value: String(profile?.loyalty_points ?? 0),
        description: "Relacionamento ativo com o restaurante.",
      },
    ],
    reservations: mappedReservations,
    orders: mappedOrders,
    orderGroups,
    usingSupabase: true,
  };
}

export async function getStaffDashboard(role = "waiter") {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return buildFallbackStaffDashboard(role);
  }

  const today = getTodayInBrazil();

  const [
    { count: totalReservations, error: totalReservationsError },
    { count: pendingReservations, error: pendingReservationsError },
    { count: todayReservations, error: todayReservationsError },
    { count: menuItemsCount, error: menuItemsError },
    { count: tablesCount, error: tablesCountError },
    reservationQueueResult,
  ] = await Promise.all([
    supabase.from("reservations").select("*", { head: true, count: "exact" }),
    supabase
      .from("reservations")
      .select("*", { head: true, count: "exact" })
      .eq("status", "pending"),
    supabase
      .from("reservations")
      .select("*", { head: true, count: "exact" })
      .eq("reservation_date", today),
    supabase.from("menu_items").select("*", { head: true, count: "exact" }),
    supabase
      .from("restaurant_tables")
      .select("*", { head: true, count: "exact" })
      .eq("is_active", true),
    supabase
      .from("reservations")
      .select(
        "id, guest_name, reservation_date, reservation_time, guests, occasion, status, notes, area_preference, assigned_table:restaurant_tables(name, area)",
      )
      .order("reservation_date", { ascending: true })
      .order("reservation_time", { ascending: true })
      .limit(8),
  ]);

  if (
    totalReservationsError ||
    pendingReservationsError ||
    todayReservationsError ||
    menuItemsError ||
    tablesCountError ||
    reservationQueueResult.error
  ) {
    return buildFallbackStaffDashboard(role);
  }

  const roleSpecificStat = {
    waiter: {
      label: "Mesas ativas",
      value: String(tablesCount ?? 0),
      description: "Estrutura pronta para acomodar o turno.",
    },
    manager: {
      label: "Itens no cardapio",
      value: String(menuItemsCount ?? 0),
      description: "Catalogo vivo para a operacao da casa.",
    },
    owner: {
      label: "Base de reservas",
      value: String(totalReservations ?? 0),
      description: "Leitura executiva do relacionamento com clientes.",
    },
  };

  return {
    stats: [
      {
        label: "Reservas totais",
        value: String(totalReservations ?? 0),
        description: "Fluxo consolidado no Supabase.",
      },
      {
        label: "Pendentes",
        value: String(pendingReservations ?? 0),
        description: "Demandas aguardando retorno da equipe.",
      },
      {
        label: "Hoje",
        value: String(todayReservations ?? 0),
        description: `Atendimentos previstos para ${today}.`,
      },
      roleSpecificStat[role] ?? roleSpecificStat.waiter,
    ],
    reservations: (reservationQueueResult.data ?? []).map(mapReservation),
    modules: operationsModules,
    alerts: [
      pendingReservations
        ? `${pendingReservations} reserva(s) aguardando confirmacao da equipe.`
        : "Nenhuma reserva pendente no momento.",
      todayReservations
        ? `${todayReservations} atendimento(s) programado(s) para hoje.`
        : "Nao ha atendimentos registrados para hoje ainda.",
    ],
    usingSupabase: true,
  };
}

export async function getDashboardData(role = "manager") {
  return getStaffDashboard(role);
}

export async function createReservation(input) {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return {
      ok: false,
      message:
        "O banco do Supabase nao esta disponivel agora. Verifique a configuracao antes de registrar reservas reais.",
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      message: "Voce precisa entrar no sistema antes de enviar a reserva.",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, phone, role")
    .eq("user_id", user.id)
    .maybeSingle();

  const actingRole = profile?.role ?? "customer";
  const isStaff = ["waiter", "manager", "owner"].includes(actingRole);
  const guestName = (input.guestName || profile?.full_name || "").trim();
  const email = (input.email || profile?.email || user.email || "").trim();
  const phone = (input.phone || profile?.phone || "").trim();

  if (!guestName || !phone) {
    return {
      ok: false,
      message: "Nome e telefone sao obrigatorios para registrar a reserva.",
    };
  }

  if (
    guestName.length > 100 ||
    phone.length > 40 ||
    email.length > 160 ||
    String(input.occasion ?? "").trim().length > 120 ||
    String(input.notes ?? "").trim().length > 500
  ) {
    return {
      ok: false,
      message: "Revise os dados da reserva. Existe um campo acima do tamanho permitido.",
    };
  }

  const payload = {
    user_id: isStaff ? null : user.id,
    guest_name: guestName,
    email: email || null,
    phone,
    reservation_date: input.date,
    reservation_time: input.time,
    guests: input.guests,
    area_preference: input.areaPreference || null,
    occasion: input.occasion || null,
    notes: input.notes || null,
    status: "pending",
    source: isStaff ? "staff" : "customer",
  };

  const { error } = await supabase.from("reservations").insert(payload);

  if (error) {
    return {
      ok: false,
      message:
        "Nao foi possivel gravar a reserva agora. Verifique o schema e as policies do Supabase.",
    };
  }

  return {
    ok: true,
    mode: "supabase",
  };
}

export async function createOrder(input) {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return {
      ok: false,
      message:
        "O banco do Supabase nao esta disponivel agora. Verifique a configuracao antes de enviar pedidos reais.",
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      message: "Voce precisa entrar como cliente antes de enviar um pedido.",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, email, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return {
      ok: false,
      message: "Nao foi possivel validar o perfil antes de registrar o pedido.",
    };
  }

  if (profile.role !== "customer") {
    return {
      ok: false,
      message: "Somente clientes podem abrir pedidos pelo cardapio.",
    };
  }

  const quantity = Number(input.quantity ?? 0);
  const menuItemId = String(input.menuItemId ?? "").trim();
  const notes = String(input.notes ?? "").trim();

  if (!menuItemId || !Number.isFinite(quantity) || quantity < 1 || quantity > 20) {
    return {
      ok: false,
      message: "Escolha um item valido e uma quantidade entre 1 e 20.",
    };
  }

  if (notes.length > 300) {
    return {
      ok: false,
      message: "As observacoes do pedido precisam ter no maximo 300 caracteres.",
    };
  }

  const { data: menuItem, error: menuItemError } = await supabase
    .from("menu_items")
    .select("id, name, price, is_available")
    .eq("id", menuItemId)
    .maybeSingle();

  if (menuItemError || !menuItem || !menuItem.is_available) {
    return {
      ok: false,
      message: "Esse prato nao esta disponivel agora para receber pedido.",
    };
  }

  const unitPrice = Number(menuItem.price);
  const totalPrice = unitPrice * quantity;

  const { error } = await supabase.from("orders").insert({
    user_id: user.id,
    menu_item_id: menuItem.id,
    guest_name: profile.full_name,
    guest_email: profile.email,
    checkout_reference: `PT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    item_name: menuItem.name,
    quantity,
    unit_price: unitPrice,
    total_price: totalPrice,
    notes: notes || null,
    fulfillment_type: "pickup",
    delivery_fee: 0,
    payment_method: "pix",
    status: "received",
    source: "customer",
  });

  if (error) {
    return {
      ok: false,
      message:
        "Nao foi possivel enviar o pedido agora. Verifique o schema e as policies do Supabase.",
    };
  }

  return {
    ok: true,
    mode: "supabase",
    message: "Pedido enviado. A equipe ja recebeu a solicitacao no sistema.",
  };
}

export async function createCartOrder(input) {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return {
      ok: false,
      message:
        "O banco do Supabase nao esta disponivel agora. Verifique a configuracao antes de finalizar pedidos reais.",
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      message: "Voce precisa entrar como cliente antes de finalizar o carrinho.",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, email, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return {
      ok: false,
      message: "Nao foi possivel validar o perfil antes de finalizar o pedido.",
    };
  }

  if (profile.role !== "customer") {
    return {
      ok: false,
      message: "Somente clientes podem finalizar pedidos pelo carrinho.",
    };
  }

  const paymentMethod = String(input.paymentMethod ?? "").trim();
  const fulfillmentType = String(input.fulfillmentType ?? "").trim();
  const deliveryNeighborhood = String(input.deliveryNeighborhood ?? "").trim();
  const deliveryAddress = String(input.deliveryAddress ?? "").trim();
  const deliveryReference = String(input.deliveryReference ?? "").trim();
  const allowedPaymentMethods = new Set(
    paymentMethodOptions.map((option) => option.value),
  );
  const allowedFulfillmentTypes = new Set(
    fulfillmentTypeOptions.map((option) => option.value),
  );

  if (!allowedPaymentMethods.has(paymentMethod)) {
    return {
      ok: false,
      message: "Escolha uma forma de pagamento valida para finalizar o pedido.",
    };
  }

  if (!allowedFulfillmentTypes.has(fulfillmentType)) {
    return {
      ok: false,
      message: "Escolha entre delivery ou retirada antes de finalizar o pedido.",
    };
  }

  const cartItems = Array.isArray(input.items)
    ? input.items
        .map((item) => ({
          menuItemId: String(item.menuItemId ?? "").trim(),
          quantity: Number(item.quantity ?? 0),
          notes: String(item.notes ?? "").trim(),
        }))
        .filter(
          (item) =>
            item.menuItemId &&
            Number.isFinite(item.quantity) &&
            item.quantity >= 1 &&
            item.quantity <= 20,
        )
    : [];

  if (!cartItems.length) {
    return {
      ok: false,
      message: "Adicione ao menos um item ao carrinho antes de finalizar.",
    };
  }

  if (cartItems.some((item) => item.notes.length > 300)) {
    return {
      ok: false,
      message: "Cada observacao de item pode ter no maximo 300 caracteres.",
    };
  }

  let deliveryFee = 0;
  const restaurantProfile = await getRestaurantProfile();
  let deliveryEtaMinutes = restaurantProfile.delivery.pickupEtaMinutes;
  let resolvedNeighborhood = "";
  let resolvedAddress = "";
  let resolvedReference = "";

  if (fulfillmentType === "delivery") {
    const neighborhoodConfig =
      restaurantProfile.delivery.neighborhoods.find(
        (item) => item.slug === deliveryNeighborhood,
      ) ?? getDeliveryNeighborhoodConfig(deliveryNeighborhood);

    if (!neighborhoodConfig) {
      return {
        ok: false,
        message: "Escolha um bairro de entrega dentro da area atendida.",
      };
    }

    if (!deliveryAddress) {
      return {
        ok: false,
        message: "Informe o endereco completo para a entrega.",
      };
    }

    if (deliveryAddress.length > 180 || deliveryReference.length > 180) {
      return {
        ok: false,
        message: "Endereco e referencia de entrega precisam respeitar o limite de caracteres.",
      };
    }

    resolvedNeighborhood = neighborhoodConfig.name;
    resolvedAddress = deliveryAddress;
    resolvedReference = deliveryReference;
    deliveryFee = neighborhoodConfig.fee;
    deliveryEtaMinutes = neighborhoodConfig.etaMinutes;
  }

  const menuItemIds = cartItems.map((item) => item.menuItemId);
  const { data: menuItems, error: menuItemsError } = await supabase
    .from("menu_items")
    .select("id, name, price, is_available")
    .in("id", menuItemIds);

  if (menuItemsError || !menuItems?.length) {
    return {
      ok: false,
      message: "Nao foi possivel validar os itens do carrinho no momento.",
    };
  }

  const menuMap = new Map(menuItems.map((item) => [item.id, item]));
  const checkoutReference = `${
    fulfillmentType === "delivery" ? "DLV" : "RET"
  }-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

  const ordersPayload = [];
  let itemsSubtotal = 0;

  for (const cartItem of cartItems) {
    const menuItem = menuMap.get(cartItem.menuItemId);

    if (!menuItem || !menuItem.is_available) {
      return {
        ok: false,
        message: "Um dos itens do carrinho nao esta mais disponivel.",
      };
    }

    const unitPrice = Number(menuItem.price);
    const totalPrice = unitPrice * cartItem.quantity;
    itemsSubtotal += totalPrice;

    ordersPayload.push({
      user_id: user.id,
      menu_item_id: menuItem.id,
      guest_name: profile.full_name,
      guest_email: profile.email,
      checkout_reference: checkoutReference,
      item_name: menuItem.name,
      quantity: cartItem.quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
      notes: cartItem.notes || null,
      fulfillment_type: fulfillmentType,
      delivery_neighborhood: resolvedNeighborhood || null,
      delivery_address: resolvedAddress || null,
      delivery_reference: resolvedReference || null,
      delivery_fee: deliveryFee,
      delivery_eta_minutes: deliveryEtaMinutes,
      payment_method: paymentMethod,
      status: "received",
      source: "customer",
    });
  }

  if (
    fulfillmentType === "delivery" &&
    itemsSubtotal < restaurantProfile.delivery.minimumOrder
  ) {
    return {
      ok: false,
      message: `O pedido minimo para delivery e de ${formatCurrency(restaurantProfile.delivery.minimumOrder)} em itens.`,
    };
  }

  const { error } = await supabase.from("orders").insert(ordersPayload);

  if (error) {
    return {
      ok: false,
      message:
        "Nao foi possivel finalizar o delivery agora. Rode o schema atualizado do Supabase com as colunas novas de entrega e tente novamente.",
    };
  }

  return {
    ok: true,
    mode: "supabase",
    checkoutReference,
    fulfillmentType,
    deliveryFee,
    deliveryEtaMinutes,
    grandTotal: itemsSubtotal + deliveryFee,
    message:
      fulfillmentType === "delivery"
        ? "Pedido de delivery enviado com sucesso. A equipe ja recebeu os itens e os dados de entrega."
        : "Pedido enviado com sucesso. A equipe ja recebeu os itens para preparo e retirada.",
  };
}
