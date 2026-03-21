"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const reservationStatuses = [
  "pending",
  "confirmed",
  "seated",
  "completed",
  "cancelled",
];

const orderStatuses = [
  "received",
  "preparing",
  "ready",
  "dispatching",
  "delivered",
  "cancelled",
];

function normalizeLines(value) {
  return String(value ?? "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function createSlug(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseCurrencyValue(value) {
  const normalized = String(value ?? "")
    .trim()
    .replace(",", ".");
  const amount = Number(normalized);

  return Number.isFinite(amount) ? amount : NaN;
}

function revalidateStaffPaths() {
  revalidatePath("/");
  revalidatePath("/area-cliente");
  revalidatePath("/area-funcionario");
  revalidatePath("/contato");
  revalidatePath("/eventos");
  revalidatePath("/painel");
  revalidatePath("/operacao");
  revalidatePath("/operacao/configuracoes");
  revalidatePath("/operacao/reservas");
  revalidatePath("/operacao/mesas");
  revalidatePath("/operacao/comandas");
  revalidatePath("/operacao/equipe");
  revalidatePath("/operacao/menu");
  revalidatePath("/operacao/executivo");
  revalidatePath("/cardapio");
  revalidatePath("/carrinho");
  revalidatePath("/reservas");
}

export async function createMenuItemAction(_previousState, formData) {
  await requireRole(["manager", "owner"]);

  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const prepTime = String(formData.get("prepTime") ?? "").trim();
  const spiceLevel = String(formData.get("spiceLevel") ?? "").trim();
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const allergens = String(formData.get("allergens") ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const sortOrder = Number(String(formData.get("sortOrder") ?? "").trim() || "0");
  const isSignature = formData.has("isSignature");
  const isAvailable = formData.has("isAvailable");
  const price = parseCurrencyValue(formData.get("price"));

  if (!categoryId || !name || !description) {
    return {
      status: "error",
      message: "Categoria, nome e descricao sao obrigatorios para cadastrar um prato.",
    };
  }

  if (!Number.isFinite(price) || price < 0) {
    return {
      status: "error",
      message: "Informe um preco valido para o prato.",
    };
  }

  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    return {
      status: "error",
      message: "A ordem de exibicao precisa ser um numero inteiro maior ou igual a zero.",
    };
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return {
      status: "error",
      message: "Nao foi possivel conectar ao Supabase para cadastrar o prato.",
    };
  }

  const { data: category, error: categoryError } = await supabase
    .from("menu_categories")
    .select("id")
    .eq("id", categoryId)
    .maybeSingle();

  if (categoryError || !category) {
    return {
      status: "error",
      message: "A categoria selecionada nao existe mais no sistema.",
    };
  }

  const { error } = await supabase.from("menu_items").insert({
    category_id: categoryId,
    name,
    description,
    price,
    prep_time: prepTime || null,
    spice_level: spiceLevel || null,
    tags,
    allergens,
    is_signature: isSignature,
    is_available: isAvailable,
    sort_order: sortOrder,
  });

  if (error) {
    return {
      status: "error",
      message:
        error.code === "23505"
          ? "Ja existe um prato com esse nome dentro da categoria escolhida."
          : "Nao foi possivel cadastrar o prato agora.",
    };
  }

  revalidateStaffPaths();

  return {
    status: "success",
    message: "Prato cadastrado com sucesso. O cardapio ja foi atualizado.",
  };
}

export async function deleteMenuItemAction(formData) {
  await requireRole(["manager", "owner"]);

  const itemId = String(formData.get("itemId") ?? "").trim();

  if (!itemId) {
    return;
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return;
  }

  await supabase.from("menu_items").delete().eq("id", itemId);

  revalidateStaffPaths();
}

export async function updateOrderStatusAction(formData) {
  await requireRole(["waiter", "manager", "owner"]);

  const orderId = String(formData.get("orderId") ?? "").trim();
  const nextStatus = String(formData.get("nextStatus") ?? "").trim();

  if (!orderId || !orderStatuses.includes(nextStatus)) {
    return;
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return;
  }

  await supabase.from("orders").update({ status: nextStatus }).eq("id", orderId);

  revalidateStaffPaths();
}

export async function updateOrderCheckoutStatusAction(formData) {
  await requireRole(["waiter", "manager", "owner"]);

  const checkoutReference = String(formData.get("checkoutReference") ?? "").trim();
  const orderIdsPayload = String(formData.get("orderIds") ?? "").trim();
  const nextStatus = String(formData.get("nextStatus") ?? "").trim();

  if (!orderStatuses.includes(nextStatus)) {
    return;
  }

  let orderIds = [];

  if (orderIdsPayload) {
    try {
      const parsed = JSON.parse(orderIdsPayload);
      if (Array.isArray(parsed)) {
        orderIds = parsed
          .map((value) => String(value ?? "").trim())
          .filter(Boolean);
      }
    } catch {}
  }

  if (!checkoutReference && !orderIds.length) {
    return;
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return;
  }

  let query = supabase.from("orders").update({ status: nextStatus });

  if (orderIds.length) {
    query = query.in("id", orderIds);
  } else {
    query = query.eq("checkout_reference", checkoutReference);
  }

  await query;

  revalidateStaffPaths();
}

export async function updateReservationStatusAction(formData) {
  await requireRole(["waiter", "manager", "owner"]);

  const reservationId = String(formData.get("reservationId") ?? "").trim();
  const nextStatus = String(formData.get("nextStatus") ?? "").trim();

  if (!reservationId || !reservationStatuses.includes(nextStatus)) {
    return;
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return;
  }

  await supabase
    .from("reservations")
    .update({ status: nextStatus })
    .eq("id", reservationId);

  revalidateStaffPaths();
}

export async function assignReservationTableAction(formData) {
  await requireRole(["waiter", "manager", "owner"]);

  const reservationId = String(formData.get("reservationId") ?? "").trim();
  const tableId = String(formData.get("tableId") ?? "").trim();

  if (!reservationId) {
    return;
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return;
  }

  await supabase
    .from("reservations")
    .update({ assigned_table_id: tableId || null })
    .eq("id", reservationId);

  revalidateStaffPaths();
}

export async function toggleRestaurantTableActiveAction(formData) {
  await requireRole(["manager", "owner"]);

  const tableId = String(formData.get("tableId") ?? "").trim();
  const currentActive = String(formData.get("currentActive") ?? "")
    .trim()
    .toLowerCase();

  if (!tableId) {
    return;
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return;
  }

  await supabase
    .from("restaurant_tables")
    .update({ is_active: currentActive !== "true" })
    .eq("id", tableId);

  revalidateStaffPaths();
}

export async function toggleMenuItemAvailabilityAction(formData) {
  await requireRole(["manager", "owner"]);

  const itemId = String(formData.get("itemId") ?? "").trim();
  const currentAvailability = String(formData.get("currentAvailability") ?? "")
    .trim()
    .toLowerCase();

  if (!itemId) {
    return;
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return;
  }

  await supabase
    .from("menu_items")
    .update({ is_available: currentAvailability !== "true" })
    .eq("id", itemId);

  revalidateStaffPaths();
}

export async function toggleStaffDirectoryStatusAction(formData) {
  const session = await requireRole(["manager", "owner"]);

  const staffId = String(formData.get("staffId") ?? "").trim();
  const staffRole = String(formData.get("staffRole") ?? "").trim();
  const nextActive = String(formData.get("nextActive") ?? "")
    .trim()
    .toLowerCase();

  if (!staffId || !staffRole || (nextActive !== "true" && nextActive !== "false")) {
    return;
  }

  if (staffRole === "owner") {
    return;
  }

  if (session.role === "manager" && staffRole !== "waiter") {
    return;
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return;
  }

  await supabase
    .from("staff_directory")
    .update({ active: nextActive === "true" })
    .eq("id", staffId);

  revalidateStaffPaths();
}

export async function updateRestaurantSettingsAction(_previousState, formData) {
  await requireRole(["manager", "owner"]);

  const name = String(formData.get("name") ?? "").trim();
  const tagline = String(formData.get("tagline") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const mapUrl = String(formData.get("mapUrl") ?? "").trim();
  const googleBusinessUrl = String(formData.get("googleBusinessUrl") ?? "").trim();
  const instagramUrl = String(formData.get("instagramUrl") ?? "").trim();
  const facebookUrl = String(formData.get("facebookUrl") ?? "").trim();
  const instagramHandle = String(formData.get("instagramHandle") ?? "").trim();
  const facebookHandle = String(formData.get("facebookHandle") ?? "").trim();
  const holidayPolicy = String(formData.get("holidayPolicy") ?? "").trim();
  const deliveryHotline = String(formData.get("deliveryHotline") ?? "").trim();
  const deliveryCoverageNote = String(
    formData.get("deliveryCoverageNote") ?? "",
  ).trim();
  const aboutStory = String(formData.get("aboutStory") ?? "").trim();
  const aboutMission = String(formData.get("aboutMission") ?? "").trim();
  const scheduleLines = normalizeLines(formData.get("scheduleText"));
  const serviceNotes = normalizeLines(formData.get("serviceNotesText"));
  const deliveryMinimumOrder = parseCurrencyValue(
    formData.get("deliveryMinimumOrder"),
  );
  const pickupEtaMinutes = Number(
    String(formData.get("pickupEtaMinutes") ?? "").trim(),
  );

  if (
    !name ||
    !tagline ||
    !description ||
    !address ||
    !city ||
    !phone ||
    !whatsapp ||
    !email
  ) {
    return {
      status: "error",
      message:
        "Nome, assinatura, descricao, endereco, cidade, telefone, WhatsApp e e-mail sao obrigatorios.",
    };
  }

  if (!scheduleLines.length) {
    return {
      status: "error",
      message: "Informe pelo menos uma linha de horario para a casa.",
    };
  }

  if (!serviceNotes.length) {
    return {
      status: "error",
      message: "Adicione pelo menos uma nota operacional para o site.",
    };
  }

  if (!Number.isFinite(deliveryMinimumOrder) || deliveryMinimumOrder < 0) {
    return {
      status: "error",
      message: "O pedido minimo do delivery precisa ser um valor valido.",
    };
  }

  if (!Number.isInteger(pickupEtaMinutes) || pickupEtaMinutes < 0) {
    return {
      status: "error",
      message: "O prazo de retirada precisa ser um numero inteiro valido.",
    };
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return {
      status: "error",
      message: "Nao foi possivel conectar ao Supabase para salvar as configuracoes.",
    };
  }

  const { error } = await supabase.from("restaurant_settings").upsert({
    id: "main",
    restaurant_name: name,
    tagline,
    description,
    address,
    city,
    phone,
    whatsapp,
    email,
    map_url: mapUrl || null,
    google_business_url: googleBusinessUrl || null,
    instagram_url: instagramUrl || null,
    facebook_url: facebookUrl || null,
    instagram_handle: instagramHandle || null,
    facebook_handle: facebookHandle || null,
    schedule_lines: scheduleLines,
    holiday_policy: holidayPolicy || "",
    service_notes: serviceNotes,
    delivery_minimum_order: deliveryMinimumOrder,
    pickup_eta_minutes: pickupEtaMinutes,
    delivery_hotline: deliveryHotline || whatsapp,
    delivery_coverage_note: deliveryCoverageNote || "",
    about_story: aboutStory || null,
    about_mission: aboutMission || null,
  });

  if (error) {
    return {
      status: "error",
      message: "Nao foi possivel salvar as configuracoes gerais da casa agora.",
    };
  }

  revalidateStaffPaths();

  return {
    status: "success",
    message:
      "Configuracoes da casa atualizadas com sucesso. O site ja foi sincronizado.",
  };
}

export async function createDeliveryZoneAction(_previousState, formData) {
  await requireRole(["manager", "owner"]);

  const name = String(formData.get("name") ?? "").trim();
  const fee = parseCurrencyValue(formData.get("fee"));
  const etaMinutes = Number(String(formData.get("etaMinutes") ?? "").trim());
  const serviceWindow = String(formData.get("serviceWindow") ?? "").trim();
  const sortOrder = Number(String(formData.get("sortOrder") ?? "0").trim() || "0");
  const isActive = formData.has("isActive");
  const slug = createSlug(name);

  if (!name || !slug) {
    return {
      status: "error",
      message: "Informe um nome valido para criar a zona de delivery.",
    };
  }

  if (!Number.isFinite(fee) || fee < 0) {
    return {
      status: "error",
      message: "A taxa de entrega precisa ser um valor valido.",
    };
  }

  if (!Number.isInteger(etaMinutes) || etaMinutes < 0) {
    return {
      status: "error",
      message: "O tempo estimado precisa ser um numero inteiro valido.",
    };
  }

  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    return {
      status: "error",
      message: "A ordem da zona precisa ser um numero inteiro maior ou igual a zero.",
    };
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return {
      status: "error",
      message: "Nao foi possivel conectar ao Supabase para criar a zona de entrega.",
    };
  }

  const { error } = await supabase.from("delivery_zones").insert({
    slug,
    name,
    fee,
    eta_minutes: etaMinutes,
    service_window: serviceWindow || null,
    sort_order: sortOrder,
    is_active: isActive,
  });

  if (error) {
    return {
      status: "error",
      message:
        error.code === "23505"
          ? "Ja existe uma zona de delivery com esse nome."
          : "Nao foi possivel cadastrar a zona de delivery agora.",
    };
  }

  revalidateStaffPaths();

  return {
    status: "success",
    message:
      "Zona de delivery cadastrada com sucesso. O checkout ja pode usar essa cobertura.",
  };
}

export async function toggleDeliveryZoneActiveAction(formData) {
  await requireRole(["manager", "owner"]);

  const zoneId = String(formData.get("zoneId") ?? "").trim();
  const nextActive = String(formData.get("nextActive") ?? "")
    .trim()
    .toLowerCase();

  if (!zoneId || (nextActive !== "true" && nextActive !== "false")) {
    return;
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return;
  }

  await supabase
    .from("delivery_zones")
    .update({ is_active: nextActive === "true" })
    .eq("id", zoneId);

  revalidateStaffPaths();
}
