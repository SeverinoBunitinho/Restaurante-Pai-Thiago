import "server-only";

import {
  menuCategories as fallbackMenuCategories,
  operationsModules,
  restaurantInfo as fallbackRestaurantInfo,
  testimonials as fallbackTestimonials,
} from "@/lib/mock-data";
import { getRestaurantProfile } from "@/lib/restaurant-profile";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
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
const RESERVATION_SLOT_MINUTES = 120;
const ACTIVE_RESERVATION_STATUSES = ["pending", "confirmed", "seated"];
const ANY_AREA_PREFERENCE_VALUES = new Set([
  "",
  "__any__",
  "sem preferencia",
  "qualquer area",
  "qualquer",
]);

const DEFAULT_MENU_ITEM_IMAGE = "/images/menu-placeholder.svg";
const RESERVATION_CONFIRMATION_PREFIX = "RSV";
const portionSizeOptions = ["small", "medium", "large"];
const defaultPortionMultiplierBySize = {
  small: 0.8,
  medium: 1,
  large: 1.35,
};

function sanitizeMenuItemImageUrl(value) {
  const rawValue = String(value ?? "").trim();

  if (!rawValue) {
    return "";
  }

  if (rawValue.startsWith("/")) {
    return rawValue;
  }

  try {
    const parsedUrl = new URL(rawValue);

    if (parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:") {
      return parsedUrl.toString();
    }
  } catch {}

  return "";
}

function normalizeMenuImageKey(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const fallbackMenuImageById = new Map();
const fallbackMenuImageByName = new Map();

for (const category of fallbackMenuCategories) {
  for (const item of category.items ?? []) {
    if (!item?.imageUrl) {
      continue;
    }

    fallbackMenuImageById.set(item.id, item.imageUrl);
    fallbackMenuImageByName.set(normalizeMenuImageKey(item.name), item.imageUrl);
  }
}

function resolveMenuItemImage(itemId, itemName, imageUrl) {
  const directImageUrl = sanitizeMenuItemImageUrl(imageUrl);

  if (directImageUrl) {
    return directImageUrl;
  }

  return (
    sanitizeMenuItemImageUrl(fallbackMenuImageById.get(itemId)) ||
    sanitizeMenuItemImageUrl(fallbackMenuImageByName.get(normalizeMenuImageKey(itemName))) ||
    DEFAULT_MENU_ITEM_IMAGE
  );
}

function normalizePortionSize(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return portionSizeOptions.includes(normalized) ? normalized : "medium";
}

function getPortionLabel(size) {
  if (size === "small") {
    return "Pequena";
  }

  if (size === "large") {
    return "Grande";
  }

  return "Media";
}

function buildPortionPricing(basePrice, portionPricesInput = {}) {
  const parsedBasePrice = Number(basePrice ?? 0);
  const safeBasePrice =
    Number.isFinite(parsedBasePrice) && parsedBasePrice >= 0 ? parsedBasePrice : 0;
  const payload = {};

  for (const size of portionSizeOptions) {
    const inputPrice = Number(portionPricesInput[size] ?? NaN);
    const fallbackPrice = safeBasePrice * defaultPortionMultiplierBySize[size];
    const resolvedPrice = Number.isFinite(inputPrice) && inputPrice >= 0
      ? inputPrice
      : fallbackPrice;

    payload[size] = Number(resolvedPrice.toFixed(2));
  }

  return payload;
}

function resolvePortionUnitPrice(basePrice, portionPrices, portionSize) {
  const normalizedPortion = normalizePortionSize(portionSize);
  const pricing = buildPortionPricing(basePrice, portionPrices ?? {});
  return pricing[normalizedPortion] ?? pricing.medium ?? Number(basePrice ?? 0);
}

function normalizeReservationArea(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeWhatsappNumber(value) {
  const digitsOnly = String(value ?? "").replace(/\D/g, "");

  if (!digitsOnly) {
    return "";
  }

  if (digitsOnly.startsWith("55")) {
    return digitsOnly;
  }

  if (digitsOnly.length === 10 || digitsOnly.length === 11) {
    return `55${digitsOnly}`;
  }

  return digitsOnly;
}

function buildReservationConfirmationCode(reservationId) {
  return `${RESERVATION_CONFIRMATION_PREFIX}-${String(reservationId ?? "")
    .slice(0, 8)
    .toUpperCase()}`;
}

function buildReservationWhatsappUrl({
  restaurantWhatsapp,
  guestName,
  confirmationCode,
  reservationDate,
  reservationTime,
  tableName,
  areaName,
}) {
  const normalizedNumber = normalizeWhatsappNumber(restaurantWhatsapp);

  if (!normalizedNumber) {
    return "";
  }

  const messageLines = [
    "Ola, equipe Pai Thiago.",
    `Confirmacao de reserva: ${confirmationCode}.`,
    `Cliente: ${guestName}.`,
    `Data e horario: ${reservationDate} as ${reservationTime}.`,
    `Mesa: ${tableName}.`,
    `Area: ${areaName}.`,
    "Estou enviando meu comprovante para acompanhamento.",
  ];

  return `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(
    messageLines.join("\n"),
  )}`;
}

function isAnyAreaPreference(value) {
  const normalizedArea = normalizeReservationArea(value);
  return ANY_AREA_PREFERENCE_VALUES.has(normalizedArea);
}

function normalizeReservationTime(value) {
  const normalizedTime = String(value ?? "").trim().slice(0, 5);

  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(normalizedTime)) {
    return null;
  }

  return normalizedTime;
}

function convertTimeToMinutes(value) {
  const normalizedTime = normalizeReservationTime(value);

  if (!normalizedTime) {
    return null;
  }

  const [hours, minutes] = normalizedTime.split(":").map(Number);
  return hours * 60 + minutes;
}

function hasReservationTimeOverlap(startMinutes, compareMinutes) {
  if (
    startMinutes == null ||
    compareMinutes == null ||
    !Number.isFinite(startMinutes) ||
    !Number.isFinite(compareMinutes)
  ) {
    return false;
  }

  const targetEnd = startMinutes + RESERVATION_SLOT_MINUTES;
  const compareEnd = compareMinutes + RESERVATION_SLOT_MINUTES;

  return startMinutes < compareEnd && compareMinutes < targetEnd;
}

function sortTablesByBestFit(tables) {
  return [...tables].sort((left, right) => {
    const leftCapacity = Number(left.capacity ?? 0);
    const rightCapacity = Number(right.capacity ?? 0);

    if (leftCapacity !== rightCapacity) {
      return leftCapacity - rightCapacity;
    }

    return String(left.name ?? "").localeCompare(String(right.name ?? ""), "pt-BR");
  });
}

function findReservationTableAssignment({
  tables,
  reservations,
  guests,
  reservationTime,
  areaPreference,
}) {
  const requestedMinutes = convertTimeToMinutes(reservationTime);
  const normalizedAreaPreference = isAnyAreaPreference(areaPreference)
    ? ""
    : normalizeReservationArea(areaPreference);
  const activeTables = tables.filter((table) => table.is_active);
  const capacityCompatibleTables = activeTables.filter(
    (table) => Number(table.capacity ?? 0) >= guests,
  );
  const matchesPreferredArea = (table) =>
    normalizeReservationArea(table.area) === normalizedAreaPreference;

  const preferredAreaCapacityTables = normalizedAreaPreference
    ? capacityCompatibleTables.filter(matchesPreferredArea)
    : capacityCompatibleTables;
  const busyTableIds = new Set(
    reservations
      .filter((reservation) => reservation.assigned_table_id)
      .filter((reservation) =>
        hasReservationTimeOverlap(
          requestedMinutes,
          convertTimeToMinutes(reservation.reservation_time),
        ),
      )
      .map((reservation) => reservation.assigned_table_id),
  );
  const availableTables = capacityCompatibleTables.filter(
    (table) => !busyTableIds.has(table.id),
  );
  const preferredAreaAvailableTables = normalizedAreaPreference
    ? availableTables.filter(matchesPreferredArea)
    : availableTables;
  const sortedPreferredAreaTables = sortTablesByBestFit(preferredAreaAvailableTables);
  const sortedAvailableTables = sortTablesByBestFit(availableTables);
  const areaSummaryMap = new Map();
  const tableSnapshots = sortTablesByBestFit(activeTables).map((table) => {
    const tableArea = String(table.area ?? "").trim() || "Salao principal";
    const normalizedTableArea = normalizeReservationArea(tableArea);
    const tableCapacity = Number(table.capacity ?? 0);
    const isOccupied = busyTableIds.has(table.id);
    const isCompatible = tableCapacity >= guests;
    const isPreferredArea =
      normalizedAreaPreference &&
      normalizedTableArea === normalizedAreaPreference;
    const currentAreaSummary = areaSummaryMap.get(tableArea) ?? {
      area: tableArea,
      total: 0,
      occupied: 0,
      free: 0,
      compatible: 0,
      compatibleFree: 0,
    };

    currentAreaSummary.total += 1;
    currentAreaSummary.occupied += isOccupied ? 1 : 0;
    currentAreaSummary.free += isOccupied ? 0 : 1;
    currentAreaSummary.compatible += isCompatible ? 1 : 0;
    currentAreaSummary.compatibleFree += isCompatible && !isOccupied ? 1 : 0;
    areaSummaryMap.set(tableArea, currentAreaSummary);

    return {
      id: table.id,
      name: table.name,
      area: tableArea,
      capacity: tableCapacity,
      status: isOccupied ? "occupied" : "free",
      occupied: isOccupied,
      compatible: isCompatible,
      preferredArea: Boolean(isPreferredArea),
    };
  });
  const tableSnapshotsInView = normalizedAreaPreference
    ? tableSnapshots.filter((table) => table.preferredArea)
    : tableSnapshots;
  const sortedAreaSummaries = Array.from(areaSummaryMap.values()).sort(
    (left, right) => left.area.localeCompare(right.area, "pt-BR"),
  );
  const selectedAreaSummary = normalizedAreaPreference
    ? sortedAreaSummaries.find(
        (areaSummary) =>
          normalizeReservationArea(areaSummary.area) === normalizedAreaPreference,
      ) ?? {
        area: areaPreference || "Area selecionada",
        total: 0,
        occupied: 0,
        free: 0,
        compatible: 0,
        compatibleFree: 0,
      }
    : null;

  if (sortedPreferredAreaTables.length) {
    return {
      selectedTable: sortedPreferredAreaTables[0],
      areaAdjusted: false,
      totalActiveTables: activeTables.length,
      occupiedTablesCount: busyTableIds.size,
      freeTablesCount: Math.max(activeTables.length - busyTableIds.size, 0),
      capacityCompatibleCount: capacityCompatibleTables.length,
      preferredAreaCapacityCount: preferredAreaCapacityTables.length,
      availableCount: availableTables.length,
      preferredAreaAvailableCount: preferredAreaAvailableTables.length,
      areaSummaries: sortedAreaSummaries,
      selectedAreaSummary,
      tablesOverview: tableSnapshots,
      tablesOverviewInView: tableSnapshotsInView,
    };
  }

  if (normalizedAreaPreference && sortedAvailableTables.length) {
    return {
      selectedTable: sortedAvailableTables[0],
      areaAdjusted: true,
      totalActiveTables: activeTables.length,
      occupiedTablesCount: busyTableIds.size,
      freeTablesCount: Math.max(activeTables.length - busyTableIds.size, 0),
      capacityCompatibleCount: capacityCompatibleTables.length,
      preferredAreaCapacityCount: preferredAreaCapacityTables.length,
      availableCount: availableTables.length,
      preferredAreaAvailableCount: preferredAreaAvailableTables.length,
      areaSummaries: sortedAreaSummaries,
      selectedAreaSummary,
      tablesOverview: tableSnapshots,
      tablesOverviewInView: tableSnapshotsInView,
    };
  }

  return {
    selectedTable: null,
    areaAdjusted: false,
    totalActiveTables: activeTables.length,
    occupiedTablesCount: busyTableIds.size,
    freeTablesCount: Math.max(activeTables.length - busyTableIds.size, 0),
    capacityCompatibleCount: capacityCompatibleTables.length,
    preferredAreaCapacityCount: preferredAreaCapacityTables.length,
    availableCount: availableTables.length,
    preferredAreaAvailableCount: preferredAreaAvailableTables.length,
    areaSummaries: sortedAreaSummaries,
    selectedAreaSummary,
    tablesOverview: tableSnapshots,
    tablesOverviewInView: tableSnapshotsInView,
  };
}

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
        portionPrices: buildPortionPricing(item.price, item.portion_prices ?? {}),
        imageUrl: resolveMenuItemImage(item.id, item.name, item.image_url),
        prepTime: item.prep_time ?? "12 min",
        spiceLevel: item.spice_level ?? "suave",
        tags: item.tags ?? [],
        allergens: item.allergens ?? [],
        signature: Boolean(item.is_signature),
        available: item.is_available ?? true,
        stockQuantity:
          Number.isFinite(Number(item.stock_quantity)) &&
          Number(item.stock_quantity) >= 0
            ? Number(item.stock_quantity)
            : null,
        lowStockThreshold:
          Number.isFinite(Number(item.low_stock_threshold)) &&
          Number(item.low_stock_threshold) >= 0
            ? Number(item.low_stock_threshold)
            : 0,
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
    vip: {
      level: "Conta ativa",
      description:
        "Seus beneficios VIP aparecem aqui assim que o historico for sincronizado.",
      benefits: [
        "Atendimento priorizado para reservas com antecedencia.",
        "Historico de preferencias para agilizar cada visita.",
      ],
      nextGoal: "Sem leitura de pontos no momento.",
      lifetime: {
        orders: 0,
        reservations: 0,
        spent: 0,
        avgTicket: 0,
      },
      favoriteItem: "",
    },
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

  const newColumnsSelect =
    "id, name, slug, description, highlight_color, sort_order, menu_items(id, name, description, image_url, price, prep_time, spice_level, tags, allergens, is_signature, is_available, sort_order, stock_quantity, low_stock_threshold, portion_prices)";
  const legacyColumnsSelect =
    "id, name, slug, description, highlight_color, sort_order, menu_items(id, name, description, image_url, price, prep_time, spice_level, tags, allergens, is_signature, is_available, sort_order)";
  let queryResult = await supabase
    .from("menu_categories")
    .select(newColumnsSelect)
    .order("sort_order", { ascending: true });

  if (queryResult.error) {
    const message = String(queryResult.error.message ?? "").toLowerCase();
    const missingNewColumns =
      message.includes("stock_quantity") ||
      message.includes("low_stock_threshold") ||
      message.includes("portion_prices");

    if (missingNewColumns) {
      queryResult = await supabase
        .from("menu_categories")
        .select(legacyColumnsSelect)
        .order("sort_order", { ascending: true });
    }
  }

  const { data, error } = queryResult;

  if (error || !data?.length) {
    return buildFallbackMenuCategories(includeUnavailable);
  }

  return data
    .map((category) => mapMenuCategory(category, includeUnavailable))
    .filter((category) => includeUnavailable || category.items.length > 0);
}

export async function getPublicTestimonials() {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return fallbackTestimonials;
  }

  const { data, error } = await supabase
    .from("customer_testimonials")
    .select("id, customer_name, customer_role, quote, rating, approved, sort_order")
    .eq("approved", true)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true })
    .limit(8);

  if (error || !data?.length) {
    return fallbackTestimonials;
  }

  return data.map((item) => ({
    name: item.customer_name,
    role: item.customer_role,
    quote: item.quote,
    rating: Number(item.rating ?? 5),
  }));
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
    reservationsCountResult,
    ordersCountResult,
    orderHistoryResult,
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
      supabase
        .from("reservations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("orders")
        .select(
          "checkout_reference, item_name, quantity, total_price, delivery_fee, status, created_at",
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(220),
    ]);

  if (
    reservationsError ||
    ordersError ||
    reservationsCountResult.error ||
    ordersCountResult.error ||
    orderHistoryResult.error
  ) {
    return buildFallbackCustomerDashboard();
  }

  const mappedReservations = (reservations ?? []).map(mapReservation);
  const mappedOrders = (orders ?? []).map(mapOrder);
  const orderGroups = groupCustomerOrdersByCheckout(mappedOrders);
  const openOrdersCount = orderGroups.filter(
    (order) => !["delivered", "cancelled"].includes(order.status),
  );
  const lifetimeReservations = Number(reservationsCountResult.count ?? 0);
  const lifetimeOrders = Number(ordersCountResult.count ?? 0);
  const orderHistory = orderHistoryResult.data ?? [];
  const checkoutTotalsMap = new Map();
  const itemDemandMap = new Map();

  for (const order of orderHistory) {
    const checkoutKey = order.checkout_reference || `single-${order.created_at}`;
    const currentCheckout = checkoutTotalsMap.get(checkoutKey) ?? {
      total: 0,
      deliveryFee: 0,
      status: order.status ?? "",
    };

    currentCheckout.total += Number(order.total_price ?? 0);
    currentCheckout.deliveryFee = Math.max(
      currentCheckout.deliveryFee,
      Number(order.delivery_fee ?? 0),
    );
    currentCheckout.status = order.status ?? currentCheckout.status;
    checkoutTotalsMap.set(checkoutKey, currentCheckout);

    const itemName = String(order.item_name ?? "").trim();
    if (itemName && order.status !== "cancelled") {
      itemDemandMap.set(
        itemName,
        (itemDemandMap.get(itemName) ?? 0) + Number(order.quantity ?? 0),
      );
    }
  }

  const completedCheckouts = Array.from(checkoutTotalsMap.values()).filter(
    (checkout) => checkout.status === "delivered",
  );
  const lifetimeSpent = completedCheckouts.reduce(
    (total, checkout) => total + checkout.total + checkout.deliveryFee,
    0,
  );
  const averageTicket = completedCheckouts.length
    ? lifetimeSpent / completedCheckouts.length
    : 0;
  const favoriteItem = Array.from(itemDemandMap.entries())
    .sort((left, right) => right[1] - left[1])[0]?.[0] ?? "";

  const loyaltyPoints = Number(profile?.loyalty_points ?? 0);
  let vipLevel = "Conta ativa";
  let vipDescription =
    "Conta preparada para organizar pedidos, reservas e relacionamento com a casa.";
  let vipBenefits = [
    "Historico da conta unificado com reservas e pedidos.",
    "Atendimento mais agil com preferencias salvas.",
  ];
  let nextGoal = "Chegue a 40 pontos para liberar vantagens do nivel recorrente.";

  if (loyaltyPoints >= 180 || lifetimeSpent >= 2200) {
    vipLevel = "Colecionador da casa";
    vipDescription =
      "Cliente com relacionamento premium, historico consistente e prioridade em datas especiais.";
    vipBenefits = [
      "Janela antecipada para reservas em datas de alta procura.",
      "Curadoria de menu com recomendacoes por preferencia.",
      "Atendimento prioritario na confirmacao de experiencias especiais.",
    ];
    nextGoal = "Nivel maximo ativo. Continue acumulando historico premium.";
  } else if (loyaltyPoints >= 90 || lifetimeSpent >= 1000) {
    vipLevel = "Cliente ouro";
    vipDescription =
      "Perfil recorrente com alto indice de retorno e preferencia consolidada.";
    vipBenefits = [
      "Sugestoes personalizadas por historico de consumo.",
      "Prioridade na fila de acomodacao para reservas confirmadas.",
      "Acesso antecipado a campanhas especiais da casa.",
    ];
    nextGoal = "Atingindo 180 pontos, seu perfil vira Colecionador da casa.";
  } else if (loyaltyPoints >= 40 || completedCheckouts.length >= 10) {
    vipLevel = "Cliente recorrente";
    vipDescription =
      "Conta com boa frequencia e preferencia consistente para acelerar atendimento.";
    vipBenefits = [
      "Registro de preferencias para reduzir tempo de atendimento.",
      "Acompanhamento mais rapido de pedidos e reservas.",
    ];
    nextGoal = "Atingindo 90 pontos, seu perfil avanca para Cliente ouro.";
  }

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
        value: String(lifetimeReservations),
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
        value: String(loyaltyPoints),
        description: "Relacionamento ativo com o restaurante.",
      },
    ],
    reservations: mappedReservations,
    orders: mappedOrders,
    orderGroups,
    vip: {
      level: vipLevel,
      description: vipDescription,
      benefits: vipBenefits,
      nextGoal,
      lifetime: {
        orders: lifetimeOrders,
        reservations: lifetimeReservations,
        spent: lifetimeSpent,
        avgTicket: averageTicket,
      },
      favoriteItem,
    },
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

function parseReservationAvailabilityInput(input) {
  const guests = Number(input.guests ?? 0);
  const reservationDate = String(input.date ?? "").trim();
  const reservationTime = normalizeReservationTime(input.time);
  const areaPreference = String(input.areaPreference ?? "").trim();
  const normalizedAreaPreference = isAnyAreaPreference(areaPreference)
    ? null
    : areaPreference;

  if (
    !Number.isFinite(guests) ||
    guests < 1 ||
    guests > 20 ||
    !reservationDate ||
    !reservationTime
  ) {
    return {
      ok: false,
      message:
        "Preencha data, horario e quantidade de pessoas validos para concluir a reserva.",
    };
  }

  return {
    ok: true,
    guests,
    reservationDate,
    reservationTime,
    normalizedAreaPreference,
  };
}

async function resolveReservationAvailability({
  supabase,
  reservationDate,
  reservationTime,
  guests,
  areaPreference,
}) {
  const adminClient = getSupabaseAdminClient();
  const availabilityClient = adminClient ?? supabase;
  const [tablesResult, occupiedReservationsResult] = await Promise.all([
    availabilityClient
      .from("restaurant_tables")
      .select("id, name, area, capacity, is_active")
      .eq("is_active", true),
    availabilityClient
      .from("reservations")
      .select("assigned_table_id, reservation_time")
      .eq("reservation_date", reservationDate)
      .in("status", ACTIVE_RESERVATION_STATUSES)
      .not("assigned_table_id", "is", null),
  ]);

  if (tablesResult.error || occupiedReservationsResult.error) {
    return {
      ok: false,
      message:
        "Nao foi possivel validar a disponibilidade de mesas agora. Tente novamente em instantes.",
    };
  }

  const assignment = findReservationTableAssignment({
    tables: tablesResult.data ?? [],
    reservations: occupiedReservationsResult.data ?? [],
    guests,
    reservationTime,
    areaPreference,
  });
  const requestedMinutes = convertTimeToMinutes(reservationTime);

  return {
    ok: true,
    assignment,
    tables: tablesResult.data ?? [],
    reservations: occupiedReservationsResult.data ?? [],
    requestedMinutes,
  };
}

export async function getReservationAvailabilitySnapshot(input) {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return {
      ok: false,
      status: 503,
      message:
        "O banco do Supabase nao esta disponivel agora. Verifique a configuracao antes de consultar disponibilidade real.",
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      status: 401,
      message: "Entre no sistema para consultar disponibilidade de mesas.",
    };
  }

  const parsedInput = parseReservationAvailabilityInput(input);

  if (!parsedInput.ok) {
    return {
      ok: false,
      status: 400,
      message: parsedInput.message,
    };
  }

  const availability = await resolveReservationAvailability({
    supabase,
    reservationDate: parsedInput.reservationDate,
    reservationTime: parsedInput.reservationTime,
    guests: parsedInput.guests,
    areaPreference: parsedInput.normalizedAreaPreference,
  });

  if (!availability.ok) {
    return {
      ok: false,
      status: 503,
      message: availability.message,
    };
  }

  const { assignment } = availability;
  const hasAvailability = Boolean(assignment.selectedTable);
  let guidance = "Ha mesas disponiveis para esse horario.";

  if (!hasAvailability) {
    if (!assignment.capacityCompatibleCount) {
      guidance = `Nao existe mesa ativa para ${parsedInput.guests} pessoa(s).`;
    } else if (
      parsedInput.normalizedAreaPreference &&
      !assignment.preferredAreaCapacityCount
    ) {
      guidance = "A area escolhida nao comporta essa quantidade de pessoas.";
    } else {
      guidance = "Nao ha mesa livre nesse horario para essa quantidade.";
    }
  } else if (assignment.areaAdjusted) {
    guidance =
      "A area preferida esta ocupada nesse horario, mas existe vaga em outro setor.";
  }

  return {
    ok: true,
    status: 200,
    generatedAt: new Date().toISOString(),
    reservationDate: parsedInput.reservationDate,
    reservationTime: parsedInput.reservationTime,
    guests: parsedInput.guests,
    areaPreference: parsedInput.normalizedAreaPreference || "Sem preferencia",
    hasAvailability,
    totalTables: assignment.totalActiveTables,
    occupiedTables: assignment.occupiedTablesCount,
    freeTables: assignment.freeTablesCount,
    compatibleTables: assignment.capacityCompatibleCount,
    compatibleFreeTables: assignment.availableCount,
    preferredAreaCompatibleTables: assignment.preferredAreaCapacityCount,
    preferredAreaFreeTables: assignment.preferredAreaAvailableCount,
    areaSummaries: assignment.areaSummaries,
    selectedAreaSummary: assignment.selectedAreaSummary,
    tablesOverview: assignment.tablesOverview,
    tablesOverviewInView: assignment.tablesOverviewInView,
    areaAdjusted: assignment.areaAdjusted,
    suggestedTable: assignment.selectedTable
      ? {
          id: assignment.selectedTable.id,
          name: assignment.selectedTable.name,
          area: assignment.selectedTable.area,
          capacity: Number(assignment.selectedTable.capacity ?? 0),
        }
      : null,
    guidance,
  };
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
  const selectedTableId = String(input.selectedTableId ?? "").trim();
  const guestName = (input.guestName || profile?.full_name || "").trim();
  const email = (input.email || profile?.email || user.email || "").trim();
  const phone = (input.phone || profile?.phone || "").trim();

  if (!guestName || !phone) {
    return {
      ok: false,
      message: "Nome e telefone sao obrigatorios para registrar a reserva.",
    };
  }

  const parsedInput = parseReservationAvailabilityInput(input);

  if (!parsedInput.ok) {
    return parsedInput;
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

  const availability = await resolveReservationAvailability({
    supabase,
    reservationDate: parsedInput.reservationDate,
    reservationTime: parsedInput.reservationTime,
    guests: parsedInput.guests,
    areaPreference: parsedInput.normalizedAreaPreference,
  });

  if (!availability.ok) {
    return availability;
  }

  const { assignment, tables, reservations, requestedMinutes } = availability;
  let resolvedTable = assignment.selectedTable;
  let selectedByUser = false;

  if (selectedTableId) {
    const selectedTable = tables.find((table) => table.id === selectedTableId);

    if (!selectedTable || !selectedTable.is_active) {
      return {
        ok: false,
        message:
          "A mesa escolhida nao esta mais ativa. Escolha outra mesa livre para concluir.",
      };
    }

    if (Number(selectedTable.capacity ?? 0) < parsedInput.guests) {
      return {
        ok: false,
        message:
          "A mesa escolhida nao comporta essa quantidade de pessoas. Escolha outra mesa.",
      };
    }

    const selectedTableBusy = reservations.some((reservation) => {
      if (reservation.assigned_table_id !== selectedTableId) {
        return false;
      }

      return hasReservationTimeOverlap(
        requestedMinutes,
        convertTimeToMinutes(reservation.reservation_time),
      );
    });

    if (selectedTableBusy) {
      return {
        ok: false,
        message:
          "Essa mesa acabou de ficar ocupada neste horario. Escolha outra mesa livre.",
      };
    }

    resolvedTable = selectedTable;
    selectedByUser = true;
  }

  if (!resolvedTable) {
    if (!assignment.capacityCompatibleCount) {
      return {
        ok: false,
        message: `Nao existe mesa ativa para ${parsedInput.guests} pessoa(s) neste momento. Ajuste a quantidade ou fale com a equipe.`,
      };
    }

    if (
      parsedInput.normalizedAreaPreference &&
      !assignment.preferredAreaCapacityCount
    ) {
      return {
        ok: false,
        message:
          "A area escolhida nao comporta essa quantidade de pessoas. Selecione outra area ou sem preferencia.",
      };
    }

    return {
      ok: false,
      message:
        "Nao ha mesa disponivel nesse horario para essa quantidade. Tente outro horario ou area.",
    };
  }

  const payload = {
    user_id: isStaff ? null : user.id,
    assigned_table_id: resolvedTable.id,
    guest_name: guestName,
    email: email || null,
    phone,
    reservation_date: parsedInput.reservationDate,
    reservation_time: parsedInput.reservationTime,
    guests: parsedInput.guests,
    area_preference: parsedInput.normalizedAreaPreference,
    occasion: input.occasion || null,
    notes: input.notes || null,
    status: "pending",
    source: isStaff ? "staff" : "customer",
  };

  const insertResult = await supabase
    .from("reservations")
    .insert(payload)
    .select("id, reservation_date, reservation_time, guest_name")
    .maybeSingle();

  if (insertResult.error || !insertResult.data) {
    return {
      ok: false,
      message:
        "Nao foi possivel gravar a reserva agora. Verifique o schema e as policies do Supabase.",
    };
  }

  const confirmationCode = buildReservationConfirmationCode(insertResult.data.id);
  const reservationDate = String(insertResult.data.reservation_date ?? parsedInput.reservationDate);
  const reservationTime = String(
    insertResult.data.reservation_time ?? parsedInput.reservationTime,
  ).slice(0, 5);
  const restaurantProfile = await getRestaurantProfile();
  const whatsappUrl = buildReservationWhatsappUrl({
    restaurantWhatsapp: restaurantProfile.whatsapp,
    guestName: guestName || insertResult.data.guest_name || "Cliente",
    confirmationCode,
    reservationDate,
    reservationTime,
    tableName: resolvedTable.name,
    areaName: resolvedTable.area,
  });

  return {
    ok: true,
    mode: "supabase",
    reservation: {
      id: insertResult.data.id,
      confirmationCode,
      guestName: guestName || insertResult.data.guest_name || "Cliente",
      reservationDate,
      reservationTime,
      guests: parsedInput.guests,
      tableName: resolvedTable.name,
      areaName: resolvedTable.area,
      whatsappUrl,
    },
    assignedTable: {
      name: resolvedTable.name,
      area: resolvedTable.area,
      capacity: Number(resolvedTable.capacity ?? 0),
    },
    areaAdjusted: assignment.areaAdjusted && !selectedByUser,
    selectedByUser,
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
  const portionSize = normalizePortionSize(input.portionSize);

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

  let menuItemResult = await supabase
    .from("menu_items")
    .select("id, name, price, is_available, stock_quantity, portion_prices")
    .eq("id", menuItemId)
    .maybeSingle();

  if (menuItemResult.error) {
    const message = String(menuItemResult.error.message ?? "").toLowerCase();
    const missingColumns =
      message.includes("stock_quantity") || message.includes("portion_prices");

    if (missingColumns) {
      menuItemResult = await supabase
        .from("menu_items")
        .select("id, name, price, is_available")
        .eq("id", menuItemId)
        .maybeSingle();
    }
  }

  const { data: menuItem, error: menuItemError } = menuItemResult;

  if (menuItemError || !menuItem || !menuItem.is_available) {
    return {
      ok: false,
      message: "Esse prato nao esta disponivel agora para receber pedido.",
    };
  }

  const stockQuantity = Number(menuItem.stock_quantity ?? NaN);
  const hasStockControl = Number.isFinite(stockQuantity) && stockQuantity >= 0;

  if (hasStockControl && quantity > stockQuantity) {
    return {
      ok: false,
      message: `Estoque insuficiente para ${menuItem.name}. Disponivel agora: ${stockQuantity}.`,
    };
  }

  const portionLabel = getPortionLabel(portionSize);
  const unitPrice = resolvePortionUnitPrice(
    Number(menuItem.price),
    menuItem.portion_prices,
    portionSize,
  );
  const totalPrice = unitPrice * quantity;
  const itemName =
    portionSize === "medium"
      ? menuItem.name
      : `${menuItem.name} (${portionLabel})`;
  const normalizedNotes = [notes, portionSize !== "medium" ? `Porcao: ${portionLabel}` : ""]
    .filter(Boolean)
    .join(" | ");

  const { error } = await supabase.from("orders").insert({
    user_id: user.id,
    menu_item_id: menuItem.id,
    guest_name: profile.full_name,
    guest_email: profile.email,
    checkout_reference: `PT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    item_name: itemName,
    quantity,
    unit_price: unitPrice,
    total_price: totalPrice,
    notes: normalizedNotes || null,
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

  if (hasStockControl) {
    await supabase
      .from("menu_items")
      .update({ stock_quantity: Math.max(0, stockQuantity - quantity) })
      .eq("id", menuItem.id);
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
          portionSize: normalizePortionSize(item.portionSize),
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
  let menuItemsResult = await supabase
    .from("menu_items")
    .select("id, name, price, is_available, stock_quantity, portion_prices")
    .in("id", menuItemIds);

  if (menuItemsResult.error) {
    const message = String(menuItemsResult.error.message ?? "").toLowerCase();
    const missingColumns =
      message.includes("stock_quantity") || message.includes("portion_prices");

    if (missingColumns) {
      menuItemsResult = await supabase
        .from("menu_items")
        .select("id, name, price, is_available")
        .in("id", menuItemIds);
    }
  }

  const { data: menuItems, error: menuItemsError } = menuItemsResult;

  if (menuItemsError || !menuItems?.length) {
    return {
      ok: false,
      message: "Nao foi possivel validar os itens do carrinho no momento.",
    };
  }

  const menuMap = new Map(menuItems.map((item) => [item.id, item]));
  const quantityByItemId = new Map();

  for (const cartItem of cartItems) {
    quantityByItemId.set(
      cartItem.menuItemId,
      (quantityByItemId.get(cartItem.menuItemId) ?? 0) + cartItem.quantity,
    );
  }

  for (const [itemId, totalQuantity] of quantityByItemId.entries()) {
    const menuItem = menuMap.get(itemId);

    if (!menuItem || !menuItem.is_available) {
      return {
        ok: false,
        message: "Um dos itens do carrinho nao esta mais disponivel.",
      };
    }

    const stockQuantity = Number(menuItem.stock_quantity ?? NaN);
    const hasStockControl = Number.isFinite(stockQuantity) && stockQuantity >= 0;

    if (hasStockControl && totalQuantity > stockQuantity) {
      return {
        ok: false,
        message: `Estoque insuficiente para ${menuItem.name}. Disponivel agora: ${stockQuantity}.`,
      };
    }
  }

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

    const portionLabel = getPortionLabel(cartItem.portionSize);
    const unitPrice = resolvePortionUnitPrice(
      Number(menuItem.price),
      menuItem.portion_prices,
      cartItem.portionSize,
    );
    const totalPrice = unitPrice * cartItem.quantity;
    itemsSubtotal += totalPrice;
    const itemName =
      cartItem.portionSize === "medium"
        ? menuItem.name
        : `${menuItem.name} (${portionLabel})`;
    const normalizedNotes = [
      cartItem.notes,
      cartItem.portionSize !== "medium" ? `Porcao: ${portionLabel}` : "",
    ]
      .filter(Boolean)
      .join(" | ");

    ordersPayload.push({
      user_id: user.id,
      menu_item_id: menuItem.id,
      guest_name: profile.full_name,
      guest_email: profile.email,
      checkout_reference: checkoutReference,
      item_name: itemName,
      quantity: cartItem.quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
      notes: normalizedNotes || null,
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

  for (const [itemId, totalQuantity] of quantityByItemId.entries()) {
    const menuItem = menuMap.get(itemId);
    const stockQuantity = Number(menuItem?.stock_quantity ?? NaN);
    const hasStockControl = Number.isFinite(stockQuantity) && stockQuantity >= 0;

    if (!menuItem || !hasStockControl) {
      continue;
    }

    const nextStockQuantity = Math.max(0, stockQuantity - totalQuantity);
    await supabase
      .from("menu_items")
      .update({
        stock_quantity: nextStockQuantity,
        is_available: nextStockQuantity > 0 ? Boolean(menuItem.is_available) : false,
      })
      .eq("id", itemId);
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
