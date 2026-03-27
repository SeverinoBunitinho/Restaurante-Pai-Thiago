"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth";
import {
  buildEmergencyCleanupCutoffIso,
  closedOrderStatuses,
  closedReservationStatuses,
  emergencyCleanupConfirmationText,
  normalizeEmergencyCleanupRetentionDays,
} from "@/lib/emergency-cleanup";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { paymentMethodOptions } from "@/lib/utils";

const reservationStatuses = [
  "pending",
  "confirmed",
  "seated",
  "completed",
  "cancelled",
];
const activeReservationStatuses = ["pending", "confirmed", "seated"];
const reservationSlotMinutes = 120;

const orderStatuses = [
  "received",
  "preparing",
  "ready",
  "dispatching",
  "delivered",
  "cancelled",
];

const staffRoles = ["waiter", "manager"];
const staffEducationLevels = [
  "fundamental",
  "medio",
  "tecnico",
  "superior",
  "pos_graduacao",
  "mestrado",
  "doutorado",
  "outro",
];
const shiftStatuses = ["planned", "confirmed", "completed", "absent"];
const campaignStatuses = ["draft", "active", "paused", "finished"];
const campaignChannels = ["site", "whatsapp", "instagram", "email", "interno"];
const couponTypes = ["percentage", "fixed_amount"];
const paymentMethods = new Set(paymentMethodOptions.map((option) => option.value));
const MENU_IMAGES_BUCKET = "menu-images";
const MENU_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const MENU_IMAGE_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];
const portionSizeOptions = ["small", "medium", "large"];
const defaultPortionMultiplierBySize = {
  small: 0.8,
  medium: 1,
  large: 1.35,
};

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

function parseNonNegativeInteger(value) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number.parseInt(normalized, 10);

  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function normalizeStaffIdentifier(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, "");
}

function normalizeCpf(value) {
  return String(value ?? "")
    .replace(/\D/g, "")
    .trim();
}

function normalizeRg(value) {
  return String(value ?? "")
    .replace(/[^0-9xX]/g, "")
    .toUpperCase()
    .trim();
}

function normalizeEducationLevel(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return staffEducationLevels.includes(normalized) ? normalized : "";
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

function normalizeMenuImageUrl(value) {
  const rawValue = String(value ?? "").trim();

  if (!rawValue) {
    return "";
  }

  if (rawValue.startsWith("/")) {
    return rawValue;
  }

  try {
    const parsed = new URL(rawValue);

    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch {}

  return null;
}

function isMenuImageFileCandidate(value) {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    typeof value.arrayBuffer === "function" &&
    Number(value.size ?? 0) > 0
  );
}

function normalizeFileSlug(value) {
  return String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getImageExtensionFromMimeType(mimeType) {
  const extensionByMimeType = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
  };

  return extensionByMimeType[mimeType] ?? "";
}

function getImageExtensionFromFileName(fileName) {
  const normalized = String(fileName ?? "").trim().toLowerCase();
  const dotIndex = normalized.lastIndexOf(".");

  if (dotIndex === -1) {
    return "";
  }

  const extension = normalized.slice(dotIndex + 1);
  const allowed = new Set(["jpg", "jpeg", "png", "webp", "avif"]);

  if (!allowed.has(extension)) {
    return "";
  }

  return extension === "jpeg" ? "jpg" : extension;
}

async function uploadMenuImageFile(adminClient, file, dishName) {
  const mimeType = String(file.type ?? "").trim().toLowerCase();

  if (!MENU_IMAGE_ALLOWED_MIME_TYPES.includes(mimeType)) {
    return {
      ok: false,
      message:
        "Formato de imagem invalido. Use JPG, PNG, WEBP ou AVIF para o cardapio.",
    };
  }

  const fileSize = Number(file.size ?? 0);

  if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > MENU_IMAGE_MAX_BYTES) {
    return {
      ok: false,
      message: "A imagem precisa ter no maximo 5 MB.",
    };
  }

  const extension =
    getImageExtensionFromMimeType(mimeType) ||
    getImageExtensionFromFileName(file.name) ||
    "jpg";
  const slug = normalizeFileSlug(dishName) || "prato";
  const filePath = `menu-items/${Date.now()}-${crypto.randomUUID()}-${slug}.${extension}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const uploadOptions = {
    cacheControl: "3600",
    upsert: false,
    contentType: mimeType,
  };

  let uploadResult = await adminClient.storage
    .from(MENU_IMAGES_BUCKET)
    .upload(filePath, bytes, uploadOptions);

  if (uploadResult.error) {
    const uploadMessage = String(uploadResult.error.message ?? "").toLowerCase();
    const shouldCreateBucket =
      uploadMessage.includes("bucket") &&
      (uploadMessage.includes("not found") || uploadMessage.includes("does not exist"));

    if (shouldCreateBucket) {
      const createBucketResult = await adminClient.storage.createBucket(
        MENU_IMAGES_BUCKET,
        {
          public: true,
          fileSizeLimit: MENU_IMAGE_MAX_BYTES,
          allowedMimeTypes: MENU_IMAGE_ALLOWED_MIME_TYPES,
        },
      );
      const createMessage = String(createBucketResult.error?.message ?? "").toLowerCase();

      if (
        createBucketResult.error &&
        !createMessage.includes("already") &&
        !createMessage.includes("duplicate")
      ) {
        return {
          ok: false,
          message: "Nao foi possivel preparar o bucket de imagens do cardapio.",
        };
      }

      uploadResult = await adminClient.storage
        .from(MENU_IMAGES_BUCKET)
        .upload(filePath, bytes, uploadOptions);
    }
  }

  if (uploadResult.error) {
    return {
      ok: false,
      message: "Nao foi possivel enviar a imagem agora. Tente novamente.",
    };
  }

  const { data: publicUrlData } = adminClient.storage
    .from(MENU_IMAGES_BUCKET)
    .getPublicUrl(filePath);

  if (!publicUrlData?.publicUrl) {
    return {
      ok: false,
      message: "A imagem foi enviada, mas nao foi possivel gerar o link publico.",
    };
  }

  return {
    ok: true,
    publicUrl: publicUrlData.publicUrl,
    path: filePath,
  };
}

function isDateOnly(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ""));
}

function isTimeOnly(value) {
  return /^\d{2}:\d{2}$/.test(String(value ?? ""));
}

function normalizeReservationArea(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeReservationTime(value) {
  const normalizedTime = String(value ?? "").trim().slice(0, 5);

  if (!isTimeOnly(normalizedTime)) {
    return null;
  }

  return normalizedTime;
}

function convertReservationTimeToMinutes(value) {
  const normalizedTime = normalizeReservationTime(value);

  if (!normalizedTime) {
    return null;
  }

  const [hours, minutes] = normalizedTime.split(":").map(Number);
  return hours * 60 + minutes;
}

function hasReservationSlotOverlap(sourceMinutes, comparisonMinutes) {
  if (
    sourceMinutes == null ||
    comparisonMinutes == null ||
    !Number.isFinite(sourceMinutes) ||
    !Number.isFinite(comparisonMinutes)
  ) {
    return false;
  }

  const sourceEnd = sourceMinutes + reservationSlotMinutes;
  const comparisonEnd = comparisonMinutes + reservationSlotMinutes;

  return sourceMinutes < comparisonEnd && comparisonMinutes < sourceEnd;
}

function sortTablesForReservation(tables, areaPreference) {
  const normalizedPreference = normalizeReservationArea(areaPreference);

  return [...tables].sort((left, right) => {
    const leftArea = normalizeReservationArea(left.area);
    const rightArea = normalizeReservationArea(right.area);
    const leftAreaScore =
      normalizedPreference && leftArea !== normalizedPreference ? 1 : 0;
    const rightAreaScore =
      normalizedPreference && rightArea !== normalizedPreference ? 1 : 0;

    if (leftAreaScore !== rightAreaScore) {
      return leftAreaScore - rightAreaScore;
    }

    const leftCapacity = Number(left.capacity ?? 0);
    const rightCapacity = Number(right.capacity ?? 0);

    if (leftCapacity !== rightCapacity) {
      return leftCapacity - rightCapacity;
    }

    return String(left.name ?? "").localeCompare(
      String(right.name ?? ""),
      "pt-BR",
    );
  });
}

async function resolveAvailableTableForReservation(supabase, reservation) {
  if (!reservation?.reservation_date) {
    return null;
  }

  const guests = Number(reservation.guests ?? 0);
  const requestedMinutes = convertReservationTimeToMinutes(
    reservation.reservation_time,
  );

  if (!Number.isFinite(guests) || guests < 1 || requestedMinutes == null) {
    return null;
  }

  const [tablesResult, occupiedReservationsResult] = await Promise.all([
    supabase
      .from("restaurant_tables")
      .select("id, name, area, capacity, is_active")
      .eq("is_active", true),
    supabase
      .from("reservations")
      .select("assigned_table_id, reservation_time")
      .eq("reservation_date", reservation.reservation_date)
      .in("status", activeReservationStatuses)
      .not("assigned_table_id", "is", null)
      .neq("id", reservation.id),
  ]);

  if (tablesResult.error || occupiedReservationsResult.error) {
    return null;
  }

  const busyTableIds = new Set(
    (occupiedReservationsResult.data ?? [])
      .filter((item) =>
        hasReservationSlotOverlap(
          requestedMinutes,
          convertReservationTimeToMinutes(item.reservation_time),
        ),
      )
      .map((item) => item.assigned_table_id),
  );

  const compatibleTables = (tablesResult.data ?? []).filter(
    (table) =>
      Number(table.capacity ?? 0) >= guests && !busyTableIds.has(table.id),
  );

  return sortTablesForReservation(
    compatibleTables,
    reservation.area_preference,
  )[0] ?? null;
}

function buildRouteWithParams(pathname, params = {}) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    searchParams.set(key, String(value));
  }

  const search = searchParams.toString();

  return search ? `${pathname}?${search}` : pathname;
}

function normalizeReservationStatusFilter(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return reservationStatuses.includes(normalized) ? normalized : "";
}

function buildReservationsRedirectPath({
  statusFilter,
  reservationNotice,
  reservationError,
}) {
  return buildRouteWithParams("/operacao/reservas", {
    status: normalizeReservationStatusFilter(statusFilter) || undefined,
    reservationNotice,
    reservationError,
  });
}

function buildMesasRedirectPath({ mesaNotice, mesaError }) {
  return buildRouteWithParams("/operacao/mesas", {
    mesaNotice,
    mesaError,
  });
}

function buildMenuRedirectPath({ menuNotice, menuError }) {
  return buildRouteWithParams("/operacao/menu", {
    menuNotice,
    menuError,
  });
}

function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

function getStaffRoleLabelForAudit(role) {
  if (role === "owner") {
    return "Dono";
  }

  if (role === "manager") {
    return "Gerente";
  }

  if (role === "waiter") {
    return "Garcom";
  }

  return "Perfil";
}

function getComandasRedirect(tableName, extras = {}) {
  return buildRouteWithParams("/operacao/comandas", {
    mesa: tableName,
    ...extras,
  });
}

function getComandasCheckoutRedirect(checkoutReference, extras = {}) {
  return buildRouteWithParams("/operacao/comandas", {
    comanda: checkoutReference,
    ...extras,
  });
}

function getEscalaRedirect(extras = {}) {
  return buildRouteWithParams("/operacao/escala", extras);
}

function getCampanhasRedirect(extras = {}) {
  return buildRouteWithParams("/operacao/campanhas", extras);
}

function getChecklistsRedirect(extras = {}) {
  return buildRouteWithParams("/operacao/checklists", extras);
}

function getIncidentesRedirect(extras = {}) {
  return buildRouteWithParams("/operacao/incidentes", extras);
}

async function writeOperationAuditLog(supabase, session, payload) {
  if (!supabase || !session?.profile?.user_id) {
    return;
  }

  try {
    await supabase.from("operation_audit_logs").insert({
      actor_user_id: session.profile.user_id,
      actor_name: session.profile.full_name || session.profile.email || "Equipe",
      actor_role: session.role || "staff",
      event_type: payload.eventType || "event",
      entity_type: payload.entityType || "record",
      entity_id: payload.entityId || null,
      entity_label: payload.entityLabel || null,
      description: payload.description || "",
      metadata: payload.metadata ?? {},
    });
  } catch {}
}

async function getWaiterCommissionRate(supabase) {
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

async function syncServiceCheckTotals(supabase, checkId) {
  const itemsResult = await supabase
    .from("service_check_items")
    .select("id, total_price")
    .eq("check_id", checkId);

  if (itemsResult.error) {
    return {
      ok: false,
      subtotal: 0,
      itemCount: 0,
    };
  }

  const subtotal = (itemsResult.data ?? []).reduce(
    (total, item) => total + Number(item.total_price ?? 0),
    0,
  );
  const itemCount = (itemsResult.data ?? []).length;
  const updateResult = await supabase
    .from("service_checks")
    .update({
      subtotal,
      total: subtotal,
    })
    .eq("id", checkId);

  if (updateResult.error) {
    return {
      ok: false,
      subtotal,
      itemCount,
    };
  }

  return {
    ok: true,
    subtotal,
    itemCount,
  };
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
  revalidatePath("/operacao/relatorios");
  revalidatePath("/operacao/executivo");
  revalidatePath("/operacao/cozinha");
  revalidatePath("/operacao/escala");
  revalidatePath("/operacao/campanhas");
  revalidatePath("/operacao/checklists");
  revalidatePath("/operacao/incidentes");
  revalidatePath("/operacao/auditoria");
  revalidatePath("/operacao/previsao");
  revalidatePath("/impressao/conta");
  revalidatePath("/cardapio");
  revalidatePath("/carrinho");
  revalidatePath("/reservas");
}

function getTodayInBrazilDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function addDaysToDateString(dateString, daysToAdd) {
  const baseDate = new Date(`${dateString}T00:00:00-03:00`);
  baseDate.setDate(baseDate.getDate() + Number(daysToAdd ?? 0));
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(baseDate);
}

export async function createStaffAccountAction(formData) {
  const session = await requireRole(["manager", "owner"]);

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = normalizeEmail(formData.get("email"));
  const login = normalizeStaffIdentifier(formData.get("login"));
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const birthDateRaw = String(formData.get("birthDate") ?? "").trim();
  const birthDate = isDateOnly(birthDateRaw) ? birthDateRaw : "";
  const educationLevel = normalizeEducationLevel(formData.get("educationLevel"));
  const rg = normalizeRg(formData.get("rg"));
  const cpf = normalizeCpf(formData.get("cpf"));
  const password = String(formData.get("password") ?? "").trim();
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const redirectWithStaffError = (staffError) =>
    redirect(
      buildRouteWithParams("/operacao/equipe", {
        staffError,
      }),
    );
  const requiresManagerFullProfile = session.role === "owner" && role === "manager";

  if (!fullName || !email || !password || !staffRoles.includes(role)) {
    redirectWithStaffError(
      "Preencha nome, e-mail, senha e cargo para salvar a conta interna.",
    );
  }

  if (!passwordConfirm || password !== passwordConfirm) {
    redirectWithStaffError("A confirmacao de senha precisa ser igual a senha informada.");
  }

  if (password.length < 6) {
    redirectWithStaffError("A senha da equipe precisa ter no minimo 6 caracteres.");
  }

  if (session.role === "manager" && role !== "waiter") {
    redirectWithStaffError("O gerente pode cadastrar apenas garcons.");
  }

  if (!phone || !address || !cpf || !birthDate || !educationLevel) {
    redirectWithStaffError(
      "Preencha telefone, endereco, data de nascimento, CPF e grau de escolaridade.",
    );
  }

  if (cpf.length !== 11) {
    redirectWithStaffError("O CPF precisa ter 11 digitos.");
  }

  if (birthDate > getTodayInBrazilDate()) {
    redirectWithStaffError("A data de nascimento nao pode estar no futuro.");
  }

  if (requiresManagerFullProfile) {
    if (!login) {
      redirectWithStaffError(
        "Para cadastrar gerente, informe o login interno para controle operacional.",
      );
    }

    if (login.length < 3) {
      redirectWithStaffError("O login interno precisa ter no minimo 3 caracteres.");
    }
  }

  const userMetadata = {
    full_name: fullName,
    phone: phone || undefined,
    address: address || undefined,
    birth_date: birthDate || undefined,
    education_level: educationLevel || undefined,
    rg: rg || undefined,
    cpf: cpf || undefined,
    staff_login: login || undefined,
  };
  const staffMetadata = {
    phone: phone || null,
    address: address || null,
    birth_date: birthDate || null,
    education_level: educationLevel || null,
    rg: rg || null,
    cpf: cpf || null,
    login: login || null,
  };

  const supabase = await getSupabaseServerClient();
  const adminClient = getSupabaseAdminClient();

  if (!supabase || !adminClient) {
    redirectWithStaffError(
      "Nao foi possivel conectar ao Supabase administrativo para criar a conta.",
    );
  }

  const staffDirectoryPayload = {
    email,
    full_name: fullName,
    role,
    active: true,
    login: login || null,
    phone: phone || null,
    address: address || null,
    birth_date: birthDate || null,
    education_level: educationLevel || null,
    rg: rg || null,
    cpf: cpf || null,
  };
  const legacyStaffDirectoryPayload = {
    email,
    full_name: fullName,
    role,
    active: true,
    login: login || null,
    phone: phone || null,
    address: address || null,
    rg: rg || null,
    cpf: cpf || null,
  };
  const basicStaffDirectoryPayload = {
    email,
    full_name: fullName,
    role,
    active: true,
  };
  let directoryResult = await supabase
    .from("staff_directory")
    .upsert(staffDirectoryPayload, { onConflict: "email" });

  if (directoryResult.error) {
    const directoryErrorMessage = String(
      directoryResult.error.message ?? "",
    ).toLowerCase();
    const hasBirthDateOrEducationColumnIssue =
      directoryErrorMessage.includes("birth_date") ||
      directoryErrorMessage.includes("education_level");
    if (hasBirthDateOrEducationColumnIssue) {
      directoryResult = await supabase
        .from("staff_directory")
        .upsert(legacyStaffDirectoryPayload, { onConflict: "email" });
    }
  }

  if (directoryResult.error) {
    const directoryErrorMessage = String(
      directoryResult.error.message ?? "",
    ).toLowerCase();
    const hasMissingColumn =
      directoryErrorMessage.includes("column") ||
      directoryErrorMessage.includes("login") ||
      directoryErrorMessage.includes("phone") ||
      directoryErrorMessage.includes("address") ||
      directoryErrorMessage.includes("rg") ||
      directoryErrorMessage.includes("cpf");

    if (hasMissingColumn) {
      directoryResult = await supabase
        .from("staff_directory")
        .upsert(basicStaffDirectoryPayload, { onConflict: "email" });
    }
  }

  if (directoryResult.error) {
    redirectWithStaffError("Nao foi possivel atualizar a base interna da equipe agora.");
  }

  const {
    data: { users },
    error: listUsersError,
  } = await adminClient.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (listUsersError) {
    redirectWithStaffError("Nao foi possivel verificar as contas internas existentes.");
  }

  const existingUser = users.find(
    (user) => user.email?.toLowerCase() === email,
  );

  if (existingUser) {
    const { error } = await adminClient.auth.admin.updateUserById(existingUser.id, {
      email,
      password,
      email_confirm: true,
      user_metadata: userMetadata,
    });

    if (error) {
      redirectWithStaffError(
        "A conta interna existe, mas nao foi possivel atualizar a senha.",
      );
    }
  } else {
    const { error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: userMetadata,
    });

    if (error) {
      redirectWithStaffError("Nao foi possivel criar a conta interna no Auth agora.");
    }
  }

  await writeOperationAuditLog(supabase, session, {
    eventType: "staff_account_saved",
    entityType: "staff_directory",
    entityId: email,
    entityLabel: fullName,
    description: `${getStaffRoleLabelForAudit(role)} interno salvo pela gestao.`,
    metadata: {
      role,
      email,
      actorRole: session.role,
      mode: existingUser ? "update" : "create",
      ...staffMetadata,
    },
  });

  revalidateStaffPaths();

  redirect(
    buildRouteWithParams("/operacao/equipe", {
      staffNotice:
        role === "manager"
          ? "Conta de gerente salva com sucesso."
          : "Conta de garcom salva com sucesso.",
    }),
  );
}

export async function openServiceCheckAction(formData) {
  const session = await requireRole(["waiter", "manager", "owner"]);

  const tableId = String(formData.get("tableId") ?? "").trim();
  const guestName = String(formData.get("guestName") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!tableId) {
    redirect(
      buildRouteWithParams("/operacao/comandas", {
        comandaError: "Selecione uma mesa para abrir a conta.",
      }),
    );
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    redirect(
      buildRouteWithParams("/operacao/comandas", {
        comandaError: "Nao foi possivel conectar ao Supabase para abrir a conta.",
      }),
    );
  }

  const { data: table, error: tableError } = await supabase
    .from("restaurant_tables")
    .select("id, name, is_active")
    .eq("id", tableId)
    .maybeSingle();

  if (tableError || !table) {
    redirect(
      buildRouteWithParams("/operacao/comandas", {
        comandaError: "A mesa escolhida nao existe mais no sistema.",
      }),
    );
  }

  if (!table.is_active) {
    redirect(
      getComandasRedirect(table.name, {
        comandaError: "A mesa escolhida esta pausada e nao pode receber conta agora.",
      }),
    );
  }

  const existingCheckResult = await supabase
    .from("service_checks")
    .select("id")
    .eq("table_id", tableId)
    .eq("status", "open")
    .maybeSingle();

  if (existingCheckResult.error) {
    redirect(
      getComandasRedirect(table.name, {
        comandaError: "Nao foi possivel verificar se a mesa ja tem conta aberta.",
      }),
    );
  }

  if (existingCheckResult.data) {
    redirect(
      getComandasRedirect(table.name, {
        comandaError: "Essa mesa ja possui uma conta aberta.",
      }),
    );
  }

  const reportReference = `CMD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

  const { error } = await supabase.from("service_checks").insert({
    table_id: table.id,
    opened_by_user_id: session.profile.user_id,
    guest_name: guestName || null,
    notes: notes || null,
    report_reference: reportReference,
  });

  if (error) {
    redirect(
      getComandasRedirect(table.name, {
        comandaError: "Nao foi possivel abrir a conta desta mesa agora.",
      }),
    );
  }

  await writeOperationAuditLog(supabase, session, {
    eventType: "service_check_opened",
    entityType: "service_check",
    entityId: table.id,
    entityLabel: table.name,
    description: "Conta aberta no modulo de comandas.",
    metadata: {
      tableId: table.id,
      tableName: table.name,
      guestName: guestName || null,
    },
  });

  revalidateStaffPaths();

  redirect(
    getComandasRedirect(table.name, {
      comandaNotice: "Conta aberta com sucesso.",
    }),
  );
}

export async function addServiceCheckItemAction(formData) {
  const session = await requireRole(["waiter", "manager", "owner"]);
  const checkId = String(formData.get("checkId") ?? "").trim();
  const tableName = String(formData.get("tableName") ?? "").trim();
  const menuItemId = String(formData.get("menuItemId") ?? "").trim();
  const quantity = Number(String(formData.get("quantity") ?? "").trim() || "0");
  const notes = String(formData.get("notes") ?? "").trim();
  const portionSize = normalizePortionSize(formData.get("portionSize"));

  if (!checkId || !menuItemId || !Number.isInteger(quantity) || quantity < 1) {
    redirect(
      getComandasRedirect(tableName, {
        comandaError: "Selecione um produto valido e a quantidade desejada.",
      }),
    );
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    redirect(
      getComandasRedirect(tableName, {
        comandaError: "Nao foi possivel conectar ao Supabase para lancar o item.",
      }),
    );
  }

  const checkResult = await supabase
    .from("service_checks")
    .select("id, status")
    .eq("id", checkId)
    .maybeSingle();

  let menuItemResult = await supabase
    .from("menu_items")
    .select("id, name, price, is_available, stock_quantity, portion_prices")
    .eq("id", menuItemId)
    .maybeSingle();

  if (menuItemResult.error) {
    const message = String(menuItemResult.error.message ?? "").toLowerCase();
    const missingExtendedColumns =
      message.includes("stock_quantity") || message.includes("portion_prices");

    if (missingExtendedColumns) {
      menuItemResult = await supabase
        .from("menu_items")
        .select("id, name, price, is_available")
        .eq("id", menuItemId)
        .maybeSingle();
    }
  }

  if (checkResult.error || !checkResult.data || checkResult.data.status !== "open") {
    redirect(
      getComandasRedirect(tableName, {
        comandaError: "A conta precisa estar aberta para receber novos itens.",
      }),
    );
  }

  if (
    menuItemResult.error ||
    !menuItemResult.data ||
    !menuItemResult.data.is_available
  ) {
    redirect(
      getComandasRedirect(tableName, {
        comandaError: "O item escolhido nao esta mais disponivel no cardapio.",
      }),
    );
  }

  const menuItem = menuItemResult.data;
  const stockQuantity = Number(menuItem.stock_quantity ?? NaN);
  const hasStockControl = Number.isFinite(stockQuantity) && stockQuantity >= 0;

  if (hasStockControl && quantity > stockQuantity) {
    redirect(
      getComandasRedirect(tableName, {
        comandaError: `Estoque insuficiente para ${menuItem.name}. Disponivel agora: ${stockQuantity}.`,
      }),
    );
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
  const insertResult = await supabase.from("service_check_items").insert({
    check_id: checkId,
    menu_item_id: menuItem.id,
    created_by_user_id: session.profile.user_id,
    item_name: itemName,
    quantity,
    unit_price: unitPrice,
    total_price: totalPrice,
    notes: normalizedNotes || null,
  });

  if (insertResult.error) {
    redirect(
      getComandasRedirect(tableName, {
        comandaError: "Nao foi possivel associar o produto a conta agora.",
      }),
    );
  }

  if (hasStockControl) {
    const nextStock = Math.max(0, stockQuantity - quantity);
    await supabase
      .from("menu_items")
      .update({ stock_quantity: nextStock })
      .eq("id", menuItem.id);
  }

  const totals = await syncServiceCheckTotals(supabase, checkId);

  if (!totals.ok) {
    redirect(
      getComandasRedirect(tableName, {
        comandaError: "O item entrou, mas o total da conta nao pode ser recalculado agora.",
      }),
    );
  }

  await writeOperationAuditLog(supabase, session, {
    eventType: "service_check_item_added",
    entityType: "service_check",
    entityId: checkId,
    entityLabel: tableName || null,
    description: "Item associado a conta de mesa.",
    metadata: {
      menuItemId,
      quantity,
      portionSize,
      unitPrice,
    },
  });

  revalidateStaffPaths();

  redirect(
    getComandasRedirect(tableName, {
      comandaNotice: `Produto associado a conta com sucesso (${portionLabel.toLowerCase()}).`,
    }),
  );
}

export async function removeServiceCheckItemAction(formData) {
  const session = await requireRole(["waiter", "manager", "owner"]);
  const checkId = String(formData.get("checkId") ?? "").trim();
  const checkItemId = String(formData.get("checkItemId") ?? "").trim();
  const tableName = String(formData.get("tableName") ?? "").trim();

  if (!checkId || !checkItemId) {
    redirect(
      getComandasRedirect(tableName, {
        comandaError: "Nao foi possivel identificar o item para remocao.",
      }),
    );
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    redirect(
      getComandasRedirect(tableName, {
        comandaError: "Nao foi possivel conectar ao Supabase para remover o item.",
      }),
    );
  }

  const [checkResult, checkItemResult] = await Promise.all([
    supabase
      .from("service_checks")
      .select("id, status")
      .eq("id", checkId)
      .maybeSingle(),
    supabase
      .from("service_check_items")
      .select("id, check_id, item_name, menu_item_id, quantity")
      .eq("id", checkItemId)
      .maybeSingle(),
  ]);

  if (checkResult.error || !checkResult.data || checkResult.data.status !== "open") {
    redirect(
      getComandasRedirect(tableName, {
        comandaError: "Somente contas abertas podem remover itens.",
      }),
    );
  }

  if (
    checkItemResult.error ||
    !checkItemResult.data ||
    checkItemResult.data.check_id !== checkId
  ) {
    redirect(
      getComandasRedirect(tableName, {
        comandaError: "O item informado nao pertence a conta selecionada.",
      }),
    );
  }

  const checkItem = checkItemResult.data;

  const removeResult = await supabase
    .from("service_check_items")
    .delete()
    .eq("id", checkItemId);

  if (removeResult.error) {
    redirect(
      getComandasRedirect(tableName, {
        comandaError: "Nao foi possivel remover o item desta conta agora.",
      }),
    );
  }

  if (checkItem.menu_item_id) {
    let menuItemResult = await supabase
      .from("menu_items")
      .select("id, stock_quantity")
      .eq("id", checkItem.menu_item_id)
      .maybeSingle();

    if (menuItemResult.error) {
      const message = String(menuItemResult.error.message ?? "").toLowerCase();
      const missingStockColumn = message.includes("stock_quantity");

      if (missingStockColumn) {
        menuItemResult = { data: null, error: null };
      }
    }

    const stockQuantity = Number(menuItemResult.data?.stock_quantity ?? NaN);
    const hasStockControl = Number.isFinite(stockQuantity) && stockQuantity >= 0;

    if (hasStockControl) {
      await supabase
        .from("menu_items")
        .update({ stock_quantity: stockQuantity + Number(checkItem.quantity ?? 0) })
        .eq("id", checkItem.menu_item_id);
    }
  }

  const totals = await syncServiceCheckTotals(supabase, checkId);

  if (!totals.ok) {
    redirect(
      getComandasRedirect(tableName, {
        comandaError:
          "O item foi removido, mas o total da conta nao pode ser recalculado agora.",
      }),
    );
  }

  await writeOperationAuditLog(supabase, session, {
    eventType: "service_check_item_removed",
    entityType: "service_check",
    entityId: checkId,
    entityLabel: tableName || null,
    description: "Item removido da conta de mesa.",
    metadata: {
      checkItemId,
      itemName: checkItem.item_name,
      quantity: Number(checkItem.quantity ?? 0),
    },
  });

  revalidateStaffPaths();

  redirect(
    getComandasRedirect(tableName, {
      comandaNotice: "Item removido da conta com sucesso.",
    }),
  );
}

export async function cancelServiceCheckAction(formData) {
  const session = await requireRole(["waiter", "manager", "owner"]);

  const checkId = String(formData.get("checkId") ?? "").trim();
  const tableName = String(formData.get("tableName") ?? "").trim();

  if (!checkId) {
    redirect(
      getComandasRedirect(tableName, {
        comandaError: "Nao foi possivel identificar a conta a ser cancelada.",
      }),
    );
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    redirect(
      getComandasRedirect(tableName, {
        comandaError: "Nao foi possivel conectar ao Supabase para cancelar a conta.",
      }),
    );
  }

  const checkResult = await supabase
    .from("service_checks")
    .select("id, status")
    .eq("id", checkId)
    .maybeSingle();

  if (checkResult.error || !checkResult.data || checkResult.data.status !== "open") {
    redirect(
      getComandasRedirect(tableName, {
        comandaError: "Somente contas abertas podem ser canceladas.",
      }),
    );
  }

  await syncServiceCheckTotals(supabase, checkId);

  const { error } = await supabase
    .from("service_checks")
    .update({
      status: "cancelled",
      cancelled_by_user_id: session.profile.user_id,
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", checkId);

  if (error) {
    redirect(
      getComandasRedirect(tableName, {
        comandaError: "Nao foi possivel cancelar a conta desta mesa agora.",
      }),
    );
  }

  await writeOperationAuditLog(supabase, session, {
    eventType: "service_check_cancelled",
    entityType: "service_check",
    entityId: checkId,
    entityLabel: tableName || null,
    description: "Conta cancelada no modulo de comandas.",
    metadata: {
      checkId,
      tableName,
    },
  });

  revalidateStaffPaths();

  redirect(
    getComandasRedirect(tableName, {
      comandaNotice: "Conta cancelada com sucesso.",
    }),
  );
}

export async function closeServiceCheckAction(formData) {
  const session = await requireRole(["waiter", "manager", "owner"]);

  const checkId = String(formData.get("checkId") ?? "").trim();
  const tableName = String(formData.get("tableName") ?? "").trim();
  const paymentMethod = String(formData.get("paymentMethod") ?? "").trim();

  if (!checkId || !paymentMethods.has(paymentMethod)) {
    redirect(
      getComandasRedirect(tableName, {
        comandaError: "Escolha uma forma de pagamento valida para fechar a conta.",
      }),
    );
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    redirect(
      getComandasRedirect(tableName, {
        comandaError: "Nao foi possivel conectar ao Supabase para fechar a conta.",
      }),
    );
  }

  const checkResult = await supabase
    .from("service_checks")
    .select(
      "id, status, opened_by_user_id, opened_by:profiles!service_checks_opened_by_user_id_fkey(user_id, role)",
    )
    .eq("id", checkId)
    .maybeSingle();

  if (checkResult.error || !checkResult.data || checkResult.data.status !== "open") {
    redirect(
      getComandasRedirect(tableName, {
        comandaError: "Somente contas abertas podem ser fechadas.",
      }),
    );
  }

  const totals = await syncServiceCheckTotals(supabase, checkId);

  if (!totals.ok) {
    redirect(
      getComandasRedirect(tableName, {
        comandaError: "Nao foi possivel recalcular o total da conta antes do fechamento.",
      }),
    );
  }

  if (!totals.itemCount) {
    redirect(
      getComandasRedirect(tableName, {
        comandaError: "Adicione ao menos um item antes de fechar a conta.",
      }),
    );
  }

  const commissionRate =
    checkResult.data.opened_by?.role === "waiter"
      ? await getWaiterCommissionRate(supabase)
      : 0;
  const commissionAmount = totals.subtotal * (commissionRate / 100);

  const { error } = await supabase
    .from("service_checks")
    .update({
      status: "closed",
      payment_method: paymentMethod,
      subtotal: totals.subtotal,
      total: totals.subtotal,
      commission_rate: commissionRate,
      commission_amount: commissionAmount,
      closed_by_user_id: session.profile.user_id,
      closed_at: new Date().toISOString(),
    })
    .eq("id", checkId);

  if (error) {
    redirect(
      getComandasRedirect(tableName, {
        comandaError: "Nao foi possivel fechar a conta desta mesa agora.",
      }),
    );
  }

  await writeOperationAuditLog(supabase, session, {
    eventType: "service_check_closed",
    entityType: "service_check",
    entityId: checkId,
    entityLabel: tableName || null,
    description: "Conta fechada com pagamento registrado.",
    metadata: {
      paymentMethod,
      subtotal: totals.subtotal,
      commissionRate,
      commissionAmount,
    },
  });

  revalidateStaffPaths();

  redirect(buildRouteWithParams("/impressao/conta", { check: checkId }));
}

export async function createMenuItemAction(_previousState, formData) {
  await requireRole(["manager", "owner"]);

  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const rawImageUrl = String(formData.get("imageUrl") ?? "").trim();
  const urlImage = normalizeMenuImageUrl(rawImageUrl);
  const uploadedImageFile = formData.get("imageFile");
  const hasUploadedImageFile = isMenuImageFileCandidate(uploadedImageFile);
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
  const stockQuantity = parseNonNegativeInteger(formData.get("stockQuantity"));
  const lowStockThreshold = parseNonNegativeInteger(formData.get("lowStockThreshold"));
  const portionSmallPrice = parseCurrencyValue(formData.get("portionSmallPrice"));
  const portionMediumPrice = parseCurrencyValue(formData.get("portionMediumPrice"));
  const portionLargePrice = parseCurrencyValue(formData.get("portionLargePrice"));
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

  if (
    stockQuantity != null &&
    lowStockThreshold != null &&
    lowStockThreshold > stockQuantity
  ) {
    return {
      status: "error",
      message: "O alerta de estoque nao pode ser maior que o estoque total.",
    };
  }

  if (urlImage === null) {
    return {
      status: "error",
      message:
        "A imagem precisa estar em URL valida (http/https) ou caminho local iniciando com /images/.",
    };
  }

  const supabaseAdmin = getSupabaseAdminClient();
  const supabaseServer = await getSupabaseServerClient();
  const supabase = supabaseAdmin ?? supabaseServer;

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

  const orderResult = await supabase
    .from("menu_items")
    .select("sort_order")
    .eq("category_id", categoryId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextSortOrder =
    Number.isFinite(Number(orderResult.data?.sort_order))
      ? Number(orderResult.data.sort_order) + 1
      : 0;

  let resolvedImageUrl = urlImage || "";
  let uploadedImagePath = "";
  const adminClient = getSupabaseAdminClient();

  if (hasUploadedImageFile) {
    if (!adminClient) {
      return {
        status: "error",
        message:
          "Upload por arquivo indisponivel agora. Configure a SUPABASE_SERVICE_ROLE_KEY para liberar imagens locais.",
      };
    }

    const uploadResult = await uploadMenuImageFile(
      adminClient,
      uploadedImageFile,
      name,
    );

    if (!uploadResult.ok) {
      return {
        status: "error",
        message: uploadResult.message,
      };
    }

    resolvedImageUrl = uploadResult.publicUrl;
    uploadedImagePath = uploadResult.path;
  }

  const portionPrices = buildPortionPricing(price, {
    small: Number.isFinite(portionSmallPrice) && portionSmallPrice >= 0
      ? portionSmallPrice
      : undefined,
    medium: Number.isFinite(portionMediumPrice) && portionMediumPrice >= 0
      ? portionMediumPrice
      : undefined,
    large: Number.isFinite(portionLargePrice) && portionLargePrice >= 0
      ? portionLargePrice
      : undefined,
  });

  const insertPayload = {
    category_id: categoryId,
    name,
    description,
    image_url: resolvedImageUrl || null,
    price,
    prep_time: prepTime || null,
    spice_level: spiceLevel || null,
    tags,
    allergens,
    is_signature: isSignature,
    is_available: isAvailable,
    sort_order: nextSortOrder,
    stock_quantity: stockQuantity,
    low_stock_threshold: lowStockThreshold ?? 0,
    portion_prices: portionPrices,
  };

  const payloadWithoutImage = { ...insertPayload };
  delete payloadWithoutImage.image_url;
  const compatibilityPayloads = [insertPayload, payloadWithoutImage].flatMap((payload) => [
    payload,
    (() => {
      const withoutStock = { ...payload };
      delete withoutStock.stock_quantity;
      delete withoutStock.low_stock_threshold;
      delete withoutStock.portion_prices;
      return withoutStock;
    })(),
  ]);

  let error = null;
  let imageColumnMissing = false;
  let stockColumnsMissing = false;

  for (const payload of compatibilityPayloads) {
    const result = await supabase.from("menu_items").insert(payload);
    error = result.error;

    if (!error) {
      imageColumnMissing = payload.image_url == null;
      stockColumnsMissing =
        payload.stock_quantity === undefined ||
        payload.low_stock_threshold === undefined ||
        payload.portion_prices === undefined;
      break;
    }

    const errorMessage = String(error.message ?? "").toLowerCase();
    const canTryNext =
      errorMessage.includes("image_url") ||
      errorMessage.includes("stock_quantity") ||
      errorMessage.includes("low_stock_threshold") ||
      errorMessage.includes("portion_prices") ||
      error.code === "PGRST204";

    if (!canTryNext) {
      break;
    }
  }

  if (!error && imageColumnMissing && uploadedImagePath && adminClient) {
    await adminClient.storage.from(MENU_IMAGES_BUCKET).remove([uploadedImagePath]);
  }

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
    message:
      imageColumnMissing && stockColumnsMissing
        ? "Prato cadastrado. O banco ainda nao tem colunas de imagem/estoque/porcoes, mas o item ja entrou no cardapio."
        : imageColumnMissing
          ? "Prato cadastrado. A imagem nao foi salva porque a coluna image_url ainda nao existe no banco."
          : stockColumnsMissing
            ? "Prato cadastrado. Os campos de estoque/porcoes nao foram salvos porque o banco ainda nao tem essas colunas."
            : "Prato cadastrado com sucesso. O cardapio ja foi atualizado.",
  };
}

export async function updateMenuItemAction(formData) {
  await requireRole(["manager", "owner"]);

  const itemId = String(formData.get("itemId") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const rawImageUrl = String(formData.get("imageUrl") ?? "").trim();
  const urlImage = normalizeMenuImageUrl(rawImageUrl);
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
  const stockQuantity = parseNonNegativeInteger(formData.get("stockQuantity"));
  const lowStockThreshold = parseNonNegativeInteger(formData.get("lowStockThreshold"));
  const portionSmallPrice = parseCurrencyValue(formData.get("portionSmallPrice"));
  const portionMediumPrice = parseCurrencyValue(formData.get("portionMediumPrice"));
  const portionLargePrice = parseCurrencyValue(formData.get("portionLargePrice"));
  const isSignature = formData.has("isSignature");
  const isAvailable = formData.has("isAvailable");
  const price = parseCurrencyValue(formData.get("price"));

  if (!itemId) {
    redirect(
      buildMenuRedirectPath({
        menuError: "Nao foi possivel identificar o prato para editar.",
      }),
    );
  }

  if (!categoryId || !name || !description) {
    redirect(
      buildMenuRedirectPath({
        menuError: "Categoria, nome e descricao sao obrigatorios para editar o prato.",
      }),
    );
  }

  if (!Number.isFinite(price) || price < 0) {
    redirect(
      buildMenuRedirectPath({
        menuError: "Informe um preco valido para atualizar o prato.",
      }),
    );
  }

  if (
    stockQuantity != null &&
    lowStockThreshold != null &&
    lowStockThreshold > stockQuantity
  ) {
    redirect(
      buildMenuRedirectPath({
        menuError: "O alerta de estoque nao pode ser maior que o estoque total.",
      }),
    );
  }

  if (urlImage === null) {
    redirect(
      buildMenuRedirectPath({
        menuError:
          "A imagem precisa estar em URL valida (http/https) ou caminho local iniciando com /images/.",
      }),
    );
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    redirect(
      buildMenuRedirectPath({
        menuError: "Nao foi possivel conectar ao Supabase para editar o prato.",
      }),
    );
  }

  const [categoryResult, itemResult] = await Promise.all([
    supabase
      .from("menu_categories")
      .select("id")
      .eq("id", categoryId)
      .maybeSingle(),
    supabase
      .from("menu_items")
      .select("id")
      .eq("id", itemId)
      .maybeSingle(),
  ]);

  if (categoryResult.error || !categoryResult.data) {
    redirect(
      buildMenuRedirectPath({
        menuError: "A categoria selecionada nao existe mais no sistema.",
      }),
    );
  }

  if (itemResult.error || !itemResult.data) {
    redirect(
      buildMenuRedirectPath({
        menuError: "O prato selecionado nao foi encontrado para edicao.",
      }),
    );
  }

  const portionPrices = buildPortionPricing(price, {
    small: Number.isFinite(portionSmallPrice) && portionSmallPrice >= 0
      ? portionSmallPrice
      : undefined,
    medium: Number.isFinite(portionMediumPrice) && portionMediumPrice >= 0
      ? portionMediumPrice
      : undefined,
    large: Number.isFinite(portionLargePrice) && portionLargePrice >= 0
      ? portionLargePrice
      : undefined,
  });

  const updatePayload = {
    category_id: categoryId,
    name,
    description,
    image_url: urlImage || null,
    price,
    prep_time: prepTime || null,
    spice_level: spiceLevel || null,
    tags,
    allergens,
    is_signature: isSignature,
    is_available: isAvailable,
    stock_quantity: stockQuantity,
    low_stock_threshold: lowStockThreshold ?? 0,
    portion_prices: portionPrices,
  };

  const payloadWithoutImage = { ...updatePayload };
  delete payloadWithoutImage.image_url;
  const compatibilityPayloads = [updatePayload, payloadWithoutImage].flatMap((payload) => [
    payload,
    (() => {
      const withoutStock = { ...payload };
      delete withoutStock.stock_quantity;
      delete withoutStock.low_stock_threshold;
      delete withoutStock.portion_prices;
      return withoutStock;
    })(),
  ]);

  let error = null;
  let imageColumnMissing = false;
  let stockColumnsMissing = false;

  for (const payload of compatibilityPayloads) {
    const result = await supabase
      .from("menu_items")
      .update(payload)
      .eq("id", itemId);
    error = result.error;

    if (!error) {
      imageColumnMissing = payload.image_url == null;
      stockColumnsMissing =
        payload.stock_quantity === undefined ||
        payload.low_stock_threshold === undefined ||
        payload.portion_prices === undefined;
      break;
    }

    const errorMessage = String(error.message ?? "").toLowerCase();
    const canTryNext =
      errorMessage.includes("image_url") ||
      errorMessage.includes("stock_quantity") ||
      errorMessage.includes("low_stock_threshold") ||
      errorMessage.includes("portion_prices") ||
      error.code === "PGRST204";

    if (!canTryNext) {
      break;
    }
  }

  if (error) {
    redirect(
      buildMenuRedirectPath({
        menuError: "Nao foi possivel atualizar o prato agora.",
      }),
    );
  }

  revalidateStaffPaths();

  const successMessage =
    imageColumnMissing && stockColumnsMissing
      ? "Prato atualizado. O banco ainda nao tem colunas de imagem/estoque/porcoes."
      : imageColumnMissing
        ? "Prato atualizado. A imagem nao foi salva porque a coluna image_url ainda nao existe."
        : stockColumnsMissing
          ? "Prato atualizado. Campos de estoque/porcoes nao foram salvos porque o banco nao tem essas colunas."
          : "Prato atualizado com sucesso.";

  redirect(
    buildMenuRedirectPath({
      menuNotice: successMessage,
    }),
  );
}

export async function createMenuCategoryAction(_previousState, formData) {
  await requireRole(["manager", "owner"]);

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const accent = String(formData.get("accent") ?? "gold")
    .trim()
    .toLowerCase();
  const allowedAccents = new Set(["gold", "sage", "clay", "cream"]);

  if (!name) {
    return {
      status: "error",
      message: "Informe o nome da categoria para salvar.",
    };
  }

  if (!allowedAccents.has(accent)) {
    return {
      status: "error",
      message: "Escolha um tom valido para a categoria.",
    };
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return {
      status: "error",
      message: "Nao foi possivel conectar ao Supabase para criar categoria.",
    };
  }

  const slugBase = createSlug(name);
  const slug = slugBase ? slugBase.slice(0, 64) : `categoria-${Date.now()}`;
  const orderResult = await supabase
    .from("menu_categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextSortOrder =
    Number.isFinite(Number(orderResult.data?.sort_order))
      ? Number(orderResult.data.sort_order) + 1
      : 0;
  const { error } = await supabase.from("menu_categories").insert({
    name,
    slug,
    description: description || null,
    highlight_color: accent,
    sort_order: nextSortOrder,
  });

  if (error) {
    const isDuplicate =
      error.code === "23505" ||
      String(error.message ?? "").toLowerCase().includes("duplicate");

    return {
      status: "error",
      message: isDuplicate
        ? "Ja existe uma categoria com esse nome. Tente um nome diferente."
        : "Nao foi possivel salvar a categoria agora.",
    };
  }

  revalidateStaffPaths();

  return {
    status: "success",
    message: "Categoria adicionada com sucesso no cardapio interno.",
  };
}

export async function createRestaurantTableAction(formData) {
  const session = await requireRole(["manager", "owner"]);

  const name = String(formData.get("tableName") ?? "").trim();
  const area = String(formData.get("area") ?? "").trim();
  const capacity = Number.parseInt(
    String(formData.get("capacity") ?? "").trim(),
    10,
  );

  if (!name || !area || !Number.isInteger(capacity) || capacity < 1 || capacity > 20) {
    redirect(
      buildMesasRedirectPath({
        mesaError: "Preencha nome, area e capacidade valida (1 a 20) para adicionar mesa.",
      }),
    );
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    redirect(
      buildMesasRedirectPath({
        mesaError: "Nao foi possivel conectar ao Supabase para criar a mesa.",
      }),
    );
  }

  const { data: existingTable, error: existingTableError } = await supabase
    .from("restaurant_tables")
    .select("id")
    .ilike("name", name)
    .limit(1)
    .maybeSingle();

  if (existingTableError) {
    redirect(
      buildMesasRedirectPath({
        mesaError: "Nao foi possivel validar se a mesa ja existe.",
      }),
    );
  }

  if (existingTable) {
    redirect(
      buildMesasRedirectPath({
        mesaError: "Ja existe uma mesa com esse nome.",
      }),
    );
  }

  const { data: insertedTable, error } = await supabase
    .from("restaurant_tables")
    .insert({
      name,
      area,
      capacity,
      is_active: true,
    })
    .select("id, name")
    .maybeSingle();

  if (error) {
    redirect(
      buildMesasRedirectPath({
        mesaError: "Nao foi possivel adicionar a nova mesa agora.",
      }),
    );
  }

  await writeOperationAuditLog(supabase, session, {
    eventType: "table_created",
    entityType: "restaurant_table",
    entityId: insertedTable?.id ?? name,
    entityLabel: insertedTable?.name ?? name,
    description: "Nova mesa adicionada ao salao.",
    metadata: {
      area,
      capacity,
    },
  });

  revalidateStaffPaths();

  redirect(
    buildMesasRedirectPath({
      mesaNotice: `Mesa ${name} adicionada com sucesso.`,
    }),
  );
}

export async function deleteMenuItemAction(formData) {
  await requireRole(["manager", "owner"]);

  const itemId = String(formData.get("itemId") ?? "").trim();

  if (!itemId) {
    redirect(
      buildMenuRedirectPath({
        menuError: "Nao foi possivel identificar o item para exclusao.",
      }),
    );
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    redirect(
      buildMenuRedirectPath({
        menuError: "Nao foi possivel conectar ao Supabase para excluir o item.",
      }),
    );
  }

  const { error } = await supabase.from("menu_items").delete().eq("id", itemId);

  if (error) {
    redirect(
      buildMenuRedirectPath({
        menuError: "Nao foi possivel remover o prato agora.",
      }),
    );
  }

  revalidateStaffPaths();

  redirect(
    buildMenuRedirectPath({
      menuNotice: "Prato removido com sucesso do cardapio interno.",
    }),
  );
}

export async function updateOrderStatusAction(formData) {
  const session = await requireRole(["waiter", "manager", "owner"]);

  const orderId = String(formData.get("orderId") ?? "").trim();
  const nextStatus = String(formData.get("nextStatus") ?? "").trim();

  if (!orderId || !orderStatuses.includes(nextStatus)) {
    return;
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from("orders")
    .update({ status: nextStatus })
    .eq("id", orderId);

  if (!error) {
    await writeOperationAuditLog(supabase, session, {
      eventType: "order_status_updated",
      entityType: "order",
      entityId: orderId,
      entityLabel: orderId,
      description: "Status de pedido atualizado pela equipe.",
      metadata: {
        nextStatus,
      },
    });
  }

  revalidateStaffPaths();
}

export async function updateOrderCheckoutStatusAction(formData) {
  const session = await requireRole(["waiter", "manager", "owner"]);

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

  const { error } = await query;

  if (!error) {
    await writeOperationAuditLog(supabase, session, {
      eventType: "order_status_updated",
      entityType: "order_checkout",
      entityId: checkoutReference || null,
      entityLabel: checkoutReference || null,
      description: "Status de pedido atualizado pela equipe.",
      metadata: {
        nextStatus,
        orderCount: orderIds.length,
      },
    });
  }

  revalidateStaffPaths();
}

export async function closeOrderCheckoutAction(formData) {
  const session = await requireRole(["waiter", "manager", "owner"]);

  const checkoutReference = String(formData.get("checkoutReference") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const printCopy = String(formData.get("printCopy") ?? "").trim().toLowerCase();

  const resolvedStatus =
    status === "all" || orderStatuses.includes(status) ? status : "";
  const resolvedPrintCopy = printCopy === "house" ? "house" : "customer";

  if (!checkoutReference) {
    redirect(
      buildRouteWithParams("/operacao/comandas", {
        status: resolvedStatus || undefined,
        pedidoError: "Informe uma comanda valida para fechar e imprimir.",
      }),
    );
  }

  const supabaseAdmin = getSupabaseAdminClient();
  const supabaseServer = await getSupabaseServerClient();
  const supabase = supabaseAdmin ?? supabaseServer;

  if (!supabase) {
    redirect(
      getComandasCheckoutRedirect(checkoutReference, {
        status: resolvedStatus || undefined,
        pedidoError: "Nao foi possivel conectar ao Supabase para fechar a comanda.",
      }),
    );
  }

  const existingOrdersResult = await supabase
    .from("orders")
    .select("id, status")
    .eq("checkout_reference", checkoutReference);

  if (existingOrdersResult.error || !existingOrdersResult.data?.length) {
    redirect(
      getComandasCheckoutRedirect(checkoutReference, {
        status: resolvedStatus || undefined,
        pedidoError: "Nenhum pedido foi encontrado para essa comanda.",
      }),
    );
  }

  const hasClosableOrders = existingOrdersResult.data.some(
    (order) => order.status !== "cancelled",
  );

  if (!hasClosableOrders) {
    redirect(
      getComandasCheckoutRedirect(checkoutReference, {
        status: resolvedStatus || undefined,
        pedidoError:
          "Essa comanda esta totalmente cancelada e nao pode gerar fechamento.",
      }),
    );
  }

  const hasOpenFlowOrders = existingOrdersResult.data.some(
    (order) => order.status !== "delivered" && order.status !== "cancelled",
  );

  if (hasOpenFlowOrders) {
    const updateResult = await supabase
      .from("orders")
      .update({ status: "delivered" })
      .eq("checkout_reference", checkoutReference)
      .neq("status", "cancelled");

    if (updateResult.error) {
      redirect(
        getComandasCheckoutRedirect(checkoutReference, {
          status: resolvedStatus || undefined,
          pedidoError: "Nao foi possivel fechar o pedido para impressao agora.",
        }),
      );
    }
  }

  revalidateStaffPaths();

  await writeOperationAuditLog(supabase, session, {
    eventType: "order_checkout_closed",
    entityType: "order_checkout",
    entityId: checkoutReference,
    entityLabel: checkoutReference,
    description: "Comanda de pedido fechada e enviada para impressao.",
    metadata: {
      printCopy: resolvedPrintCopy,
      statusFilter: resolvedStatus || "all",
    },
  });

  redirect(
    buildRouteWithParams("/impressao/conta", {
      pedido: checkoutReference,
      via: resolvedPrintCopy,
    }),
  );
}

export async function runEmergencyCleanupAction(_previousState, formData) {
  const session = await requireRole(["owner"]);
  const confirmationText = String(formData.get("confirmationText") ?? "")
    .trim()
    .toUpperCase();
  const retentionDays = normalizeEmergencyCleanupRetentionDays(
    formData.get("retentionDays") ?? formData.get("dias"),
  );
  const buildErrorResponse = (message) => ({
    status: "error",
    message,
    refreshKey: "",
  });
  const buildSuccessResponse = (message) => ({
    status: "success",
    message,
    refreshKey: `${Date.now()}`,
  });

  if (confirmationText !== emergencyCleanupConfirmationText) {
    return buildErrorResponse(
      `Digite exatamente "${emergencyCleanupConfirmationText}" para confirmar a limpeza emergencial.`,
    );
  }

  const supabaseAdmin = getSupabaseAdminClient();
  const isUsingAdminClient = Boolean(supabaseAdmin);
  const supabaseServer = await getSupabaseServerClient();
  const supabase = supabaseAdmin ?? supabaseServer;

  if (!supabase) {
    return buildErrorResponse(
      "Nao foi possivel conectar ao Supabase para executar a limpeza emergencial.",
    );
  }

  const cutoffIso = buildEmergencyCleanupCutoffIso(retentionDays);

  const [ordersCountResult, reservationsCountResult] = await Promise.all([
    supabase
      .from("orders")
      .select("*", { head: true, count: "exact" })
      .in("status", closedOrderStatuses)
      .lt("updated_at", cutoffIso),
    supabase
      .from("reservations")
      .select("*", { head: true, count: "exact" })
      .in("status", closedReservationStatuses)
      .lt("updated_at", cutoffIso),
  ]);

  if (ordersCountResult.error || reservationsCountResult.error) {
    return buildErrorResponse(
      "Nao foi possivel listar os registros para limpeza. Tente novamente em instantes.",
    );
  }

  const expectedOrders = Number(ordersCountResult.count ?? 0);
  const expectedReservations = Number(reservationsCountResult.count ?? 0);
  let removedOrders = 0;
  let removedReservations = 0;

  if (!expectedOrders && !expectedReservations) {
    return buildSuccessResponse(
      `Nenhum registro encerrado com mais de ${retentionDays} dia(s) foi encontrado para limpeza.`,
    );
  }

  if (expectedOrders) {
    const removeOrdersResult = await supabase
      .from("orders")
      .delete()
      .in("status", closedOrderStatuses)
      .lt("updated_at", cutoffIso)
      .select("id", { count: "exact" });

    if (removeOrdersResult.error) {
      return buildErrorResponse(
        "A limpeza foi interrompida ao remover pedidos encerrados.",
      );
    }

    removedOrders = Number(
      removeOrdersResult.count ?? removeOrdersResult.data?.length ?? expectedOrders,
    );
  }

  if (expectedReservations) {
    const removeReservationsResult = await supabase
      .from("reservations")
      .delete()
      .in("status", closedReservationStatuses)
      .lt("updated_at", cutoffIso)
      .select("id", { count: "exact" });

    if (removeReservationsResult.error) {
      return buildErrorResponse(
        "A limpeza foi interrompida ao remover reservas encerradas.",
      );
    }

    removedReservations = Number(
      removeReservationsResult.count ??
        removeReservationsResult.data?.length ??
        expectedReservations,
    );
  }

  await writeOperationAuditLog(supabase, session, {
    eventType: "emergency_cleanup_executed",
    entityType: "operations_cleanup",
    entityId: null,
    entityLabel: "Limpeza emergencial",
    description:
      "Rotina extrema executada para remover historico encerrado de pedidos e reservas.",
    metadata: {
      retentionDays,
      cutoffIso,
      expectedOrders,
      expectedReservations,
      removedOrders,
      removedReservations,
    },
  });

  revalidateStaffPaths();

  if (!removedOrders && !removedReservations) {
    const [remainingOrdersResult, remainingReservationsResult] = await Promise.all([
      supabase
        .from("orders")
        .select("*", { head: true, count: "exact" })
        .in("status", closedOrderStatuses)
        .lt("updated_at", cutoffIso),
      supabase
        .from("reservations")
        .select("*", { head: true, count: "exact" })
        .in("status", closedReservationStatuses)
        .lt("updated_at", cutoffIso),
    ]);
    const remainingOrders = Number(remainingOrdersResult.count ?? 0);
    const remainingReservations = Number(remainingReservationsResult.count ?? 0);
    const remainingTotal = remainingOrders + remainingReservations;

    if (remainingTotal > 0 && !isUsingAdminClient) {
      return buildErrorResponse(
        "A limpeza foi bloqueada por RLS em producao. Configure SUPABASE_SERVICE_ROLE_KEY na Vercel e rode novo deploy.",
      );
    }

    if (remainingTotal > 0) {
      return buildErrorResponse(
        "Existem registros elegiveis, mas o banco nao permitiu a remocao. Revise relacionamentos/politicas no Supabase.",
      );
    }

    return buildSuccessResponse(
      `Nenhum registro encerrado com mais de ${retentionDays} dia(s) foi encontrado para limpeza.`,
    );
  }

  return buildSuccessResponse(
    `Limpeza emergencial concluida: ${removedOrders} pedido(s) e ${removedReservations} reserva(s) encerrados removidos.`,
  );
}

export async function updateReservationStatusAction(formData) {
  const session = await requireRole(["waiter", "manager", "owner"]);

  const reservationId = String(formData.get("reservationId") ?? "").trim();
  const nextStatus = String(formData.get("nextStatus") ?? "").trim();
  const statusFilter = String(formData.get("statusFilter") ?? "").trim();
  const redirectWithError = (reservationError) =>
    redirect(
      buildReservationsRedirectPath({
        statusFilter,
        reservationError,
      }),
    );
  const redirectWithNotice = (reservationNotice) =>
    redirect(
      buildReservationsRedirectPath({
        statusFilter,
        reservationNotice,
      }),
    );

  if (!reservationId || !reservationStatuses.includes(nextStatus)) {
    redirectWithError("Nao foi possivel atualizar essa reserva.");
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    redirectWithError(
      "Nao foi possivel conectar ao Supabase para atualizar o status.",
    );
  }

  const reservationResult = await supabase
    .from("reservations")
    .select(
      "id, reservation_date, reservation_time, guests, area_preference, assigned_table_id, status",
    )
    .eq("id", reservationId)
    .maybeSingle();

  if (reservationResult.error || !reservationResult.data) {
    redirectWithError("Reserva nao encontrada na fila.");
  }

  const reservation = reservationResult.data;
  const updatePayload = {
    status: nextStatus,
  };
  let autoAssignedTableId = null;
  let autoAssignedTable = null;

  if (nextStatus === "seated" && !reservation.assigned_table_id) {
    const resolvedTable = await resolveAvailableTableForReservation(
      supabase,
      reservation,
    );

    if (!resolvedTable) {
      redirectWithError(
        "Sem mesa livre compativel neste momento. A reserva segue na fila inteligente de espera.",
      );
    }

    updatePayload.assigned_table_id = resolvedTable.id;
    autoAssignedTableId = resolvedTable.id;
    autoAssignedTable = resolvedTable;
  }

  const { error } = await supabase
    .from("reservations")
    .update(updatePayload)
    .eq("id", reservationId);

  if (error) {
    redirectWithError("Nao foi possivel atualizar o status dessa reserva agora.");
  }

  const statusLabels = {
    pending: "Pendente",
    confirmed: "Confirmada",
    seated: "No salao",
    completed: "Finalizada",
    cancelled: "Cancelada",
  };
  const reservationNotice =
    nextStatus === "seated" && autoAssignedTable
      ? `Reserva acomodada automaticamente na ${autoAssignedTable.name} (${autoAssignedTable.area}).`
      : `Status atualizado para ${statusLabels[nextStatus] ?? nextStatus}.`;

  await writeOperationAuditLog(supabase, session, {
    eventType: "reservation_status_updated",
    entityType: "reservation",
    entityId: reservationId,
    entityLabel: reservationId,
    description: "Status da reserva atualizado na fila operacional.",
    metadata: {
      nextStatus,
      autoAssignedTableId,
    },
  });

  revalidateStaffPaths();
  redirectWithNotice(reservationNotice);
}

export async function markReservationNoShowAction(formData) {
  const session = await requireRole(["waiter", "manager", "owner"]);

  const reservationId = String(formData.get("reservationId") ?? "").trim();
  const statusFilter = String(formData.get("statusFilter") ?? "").trim();
  const redirectWithError = (reservationError) =>
    redirect(
      buildReservationsRedirectPath({
        statusFilter,
        reservationError,
      }),
    );
  const redirectWithNotice = (reservationNotice) =>
    redirect(
      buildReservationsRedirectPath({
        statusFilter,
        reservationNotice,
      }),
    );

  if (!reservationId) {
    redirectWithError("Nao foi possivel identificar a reserva para no-show.");
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    redirectWithError("Nao foi possivel conectar ao banco para marcar no-show.");
  }

  const reservationResult = await supabase
    .from("reservations")
    .select(
      "id, guest_name, reservation_date, reservation_time, status, assigned_table_id",
    )
    .eq("id", reservationId)
    .maybeSingle();

  if (reservationResult.error || !reservationResult.data) {
    redirectWithError("Reserva nao encontrada para marcar no-show.");
  }

  const reservation = reservationResult.data;

  if (reservation.status === "completed") {
    redirectWithError("Reserva finalizada nao pode ser marcada como no-show.");
  }

  if (reservation.status === "cancelled") {
    redirectWithError("Reserva ja esta cancelada.");
  }

  const { error } = await supabase
    .from("reservations")
    .update({
      status: "cancelled",
      assigned_table_id: null,
    })
    .eq("id", reservationId);

  if (error) {
    redirectWithError("Nao foi possivel registrar o no-show dessa reserva.");
  }

  await writeOperationAuditLog(supabase, session, {
    eventType: "reservation_marked_no_show",
    entityType: "reservation",
    entityId: reservationId,
    entityLabel: reservation.guest_name || reservationId,
    description: "Reserva marcada como no-show e liberada da fila ativa.",
    metadata: {
      previousStatus: reservation.status,
      reservationDate: reservation.reservation_date,
      reservationTime: String(reservation.reservation_time ?? "").slice(0, 5),
      releasedTable: Boolean(reservation.assigned_table_id),
    },
  });

  revalidateStaffPaths();
  redirectWithNotice("No-show registrado com sucesso e mesa liberada.");
}

export async function assignReservationTableAction(formData) {
  const session = await requireRole(["waiter", "manager", "owner"]);

  const reservationId = String(formData.get("reservationId") ?? "").trim();
  const tableId = String(formData.get("tableId") ?? "").trim();
  const redirectWithError = (mesaError) =>
    redirect(
      buildMesasRedirectPath({
        mesaError,
      }),
    );
  const redirectWithNotice = (mesaNotice) =>
    redirect(
      buildMesasRedirectPath({
        mesaNotice,
      }),
    );

  if (!reservationId) {
    redirectWithError("Nao foi possivel identificar a reserva selecionada.");
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    redirectWithError("Nao foi possivel conectar ao Supabase para atualizar a mesa.");
  }

  const reservationResult = await supabase
    .from("reservations")
    .select(
      "id, reservation_date, reservation_time, guests, status, assigned_table_id",
    )
    .eq("id", reservationId)
    .maybeSingle();

  if (reservationResult.error || !reservationResult.data) {
    redirectWithError("A reserva selecionada nao foi encontrada.");
  }

  const reservation = reservationResult.data;
  let selectedTableName = "";

  if (tableId) {
    const tableResult = await supabase
      .from("restaurant_tables")
      .select("id, name, area, capacity, is_active")
      .eq("id", tableId)
      .maybeSingle();

    if (tableResult.error || !tableResult.data || !tableResult.data.is_active) {
      redirectWithError("A mesa escolhida nao esta ativa para uso agora.");
    }

    if (Number(tableResult.data.capacity ?? 0) < Number(reservation.guests ?? 0)) {
      redirectWithError(
        "A mesa escolhida nao comporta a quantidade de pessoas desta reserva.",
      );
    }

    const tableReservationsResult = await supabase
      .from("reservations")
      .select("reservation_time")
      .eq("reservation_date", reservation.reservation_date)
      .eq("assigned_table_id", tableId)
      .in("status", activeReservationStatuses)
      .neq("id", reservationId);

    if (tableReservationsResult.error) {
      redirectWithError("Nao foi possivel validar conflito de horario da mesa.");
    }

    const requestedMinutes = convertReservationTimeToMinutes(
      reservation.reservation_time,
    );
    const hasConflict = (tableReservationsResult.data ?? []).some((item) =>
      hasReservationSlotOverlap(
        requestedMinutes,
        convertReservationTimeToMinutes(item.reservation_time),
      ),
    );

    if (hasConflict) {
      redirectWithError(
        "Essa mesa ja esta comprometida no mesmo horario. Escolha outra opcao.",
      );
    }

    selectedTableName = `${tableResult.data.name} (${tableResult.data.area})`;
  }

  const updatePayload = {
    assigned_table_id: tableId || null,
  };

  if (!tableId && reservation.status === "seated") {
    updatePayload.status = "confirmed";
  }

  const { error } = await supabase
    .from("reservations")
    .update(updatePayload)
    .eq("id", reservationId);

  if (error) {
    redirectWithError("Nao foi possivel atualizar o vinculo da mesa agora.");
  }

  const downgradedStatus =
    !tableId && reservation.status === "seated" ? "confirmed" : null;
  const successMessage = tableId
    ? `Mesa vinculada com sucesso: ${selectedTableName}.`
    : downgradedStatus
      ? "Mesa removida e reserva voltou para Confirmada."
      : "Mesa desvinculada da reserva com sucesso.";

  await writeOperationAuditLog(supabase, session, {
    eventType: "reservation_table_assigned",
    entityType: "reservation",
    entityId: reservationId,
    entityLabel: reservationId,
    description: tableId
      ? "Mesa vinculada a reserva no modulo de acomodacao."
      : "Mesa desvinculada da reserva no modulo de acomodacao.",
    metadata: {
      tableId: tableId || null,
      downgradedStatus,
    },
  });

  revalidateStaffPaths();
  redirectWithNotice(successMessage);
}

export async function toggleRestaurantTableActiveAction(formData) {
  const session = await requireRole(["manager", "owner"]);

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

  const nextActive = currentActive !== "true";
  const { error } = await supabase
    .from("restaurant_tables")
    .update({ is_active: nextActive })
    .eq("id", tableId);

  if (!error) {
    await writeOperationAuditLog(supabase, session, {
      eventType: "table_state_changed",
      entityType: "restaurant_table",
      entityId: tableId,
      entityLabel: tableId,
      description: nextActive
        ? "Mesa reativada para operacao."
        : "Mesa pausada pela gestao.",
      metadata: {
        nextActive,
      },
    });
  }

  revalidateStaffPaths();
}

export async function toggleMenuItemAvailabilityAction(formData) {
  const session = await requireRole(["manager", "owner"]);

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

  const nextAvailable = currentAvailability !== "true";
  const { error } = await supabase
    .from("menu_items")
    .update({ is_available: nextAvailable })
    .eq("id", itemId);

  if (!error) {
    await writeOperationAuditLog(supabase, session, {
      eventType: "menu_item_availability_changed",
      entityType: "menu_item",
      entityId: itemId,
      entityLabel: itemId,
      description: nextAvailable
        ? "Item de cardapio reativado."
        : "Item de cardapio pausado.",
      metadata: {
        nextAvailable,
      },
    });
  }

  revalidateStaffPaths();
}

export async function toggleStaffDirectoryStatusAction(formData) {
  const session = await requireRole(["manager", "owner"]);

  const staffId = String(formData.get("staffId") ?? "").trim();
  const staffRole = String(formData.get("staffRole") ?? "").trim();
  const nextActiveValue = String(formData.get("nextActive") ?? "")
    .trim()
    .toLowerCase();

  if (
    !staffId ||
    !staffRole ||
    (nextActiveValue !== "true" && nextActiveValue !== "false")
  ) {
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

  const nextActive = nextActiveValue === "true";
  const { error } = await supabase
    .from("staff_directory")
    .update({ active: nextActive })
    .eq("id", staffId);

  if (!error) {
    await writeOperationAuditLog(supabase, session, {
      eventType: "staff_directory_status_changed",
      entityType: "staff_directory",
      entityId: staffId,
      entityLabel: staffId,
      description: nextActive
        ? "Acesso interno reativado para membro da equipe."
        : "Acesso interno pausado para membro da equipe.",
      metadata: {
        staffRole,
        nextActive,
      },
    });
  }

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

export async function createStaffShiftAction(formData) {
  const session = await requireRole(["manager", "owner"]);

  const staffId = String(formData.get("staffId") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const shiftDate = String(formData.get("shiftDate") ?? "").trim();
  const shiftLabel = String(formData.get("shiftLabel") ?? "").trim();
  const startsAt = String(formData.get("startsAt") ?? "").trim();
  const endsAt = String(formData.get("endsAt") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const status = String(formData.get("status") ?? "planned").trim();

  if (!staffId || !staffRoles.includes(role)) {
    redirect(
      getEscalaRedirect({
        shiftError: "Selecione o membro da equipe e o cargo do turno.",
      }),
    );
  }

  if (!isDateOnly(shiftDate) || !isTimeOnly(startsAt) || !isTimeOnly(endsAt)) {
    redirect(
      getEscalaRedirect({
        shiftError: "Informe data e horarios validos para salvar a escala.",
      }),
    );
  }

  if (startsAt >= endsAt) {
    redirect(
      getEscalaRedirect({
        shiftError: "O horario de inicio precisa ser menor que o horario de fim.",
      }),
    );
  }

  if (!shiftStatuses.includes(status)) {
    redirect(
      getEscalaRedirect({
        shiftError: "Status de turno invalido.",
      }),
    );
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    redirect(
      getEscalaRedirect({
        shiftError: "Nao foi possivel conectar ao banco para salvar a escala.",
      }),
    );
  }

  const { data: staffMember, error: staffError } = await supabase
    .from("staff_directory")
    .select("id, role, full_name, active")
    .eq("id", staffId)
    .maybeSingle();

  if (staffError || !staffMember || !staffMember.active) {
    redirect(
      getEscalaRedirect({
        shiftError: "O membro selecionado nao esta ativo na equipe interna.",
      }),
    );
  }

  if (session.role === "manager" && staffMember.role !== "waiter") {
    redirect(
      getEscalaRedirect({
        shiftError: "Gerente pode organizar apenas turnos dos garcons.",
      }),
    );
  }

  if (role !== staffMember.role) {
    redirect(
      getEscalaRedirect({
        shiftError: "O cargo do turno precisa seguir o cargo real do colaborador.",
      }),
    );
  }

  const { error } = await supabase.from("staff_shifts").upsert(
    {
      staff_id: staffId,
      role,
      shift_date: shiftDate,
      shift_label: shiftLabel || "turno",
      starts_at: startsAt,
      ends_at: endsAt,
      status,
      notes: notes || null,
      created_by_user_id: session.profile.user_id,
    },
    {
      onConflict: "staff_id,shift_date,shift_label",
    },
  );

  if (error) {
    redirect(
      getEscalaRedirect({
        shiftError:
          "Nao foi possivel salvar esse turno. Verifique se a tabela de escala foi criada no banco.",
      }),
    );
  }

  await writeOperationAuditLog(supabase, session, {
    eventType: "staff_shift_saved",
    entityType: "staff_shift",
    entityId: staffId,
    entityLabel: `${staffMember.full_name} - ${shiftDate}`,
    description: "Turno salvo na escala da equipe.",
    metadata: {
      role,
      shiftDate,
      shiftLabel,
      startsAt,
      endsAt,
      status,
    },
  });

  revalidateStaffPaths();

  redirect(
    getEscalaRedirect({
      shiftNotice: "Turno salvo com sucesso.",
    }),
  );
}

export async function updateStaffShiftStatusAction(formData) {
  const session = await requireRole(["manager", "owner"]);

  const shiftId = String(formData.get("shiftId") ?? "").trim();
  const nextStatus = String(formData.get("nextStatus") ?? "").trim();

  if (!shiftId || !shiftStatuses.includes(nextStatus)) {
    redirect(
      getEscalaRedirect({
        shiftError: "Nao foi possivel atualizar o status desse turno.",
      }),
    );
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    redirect(
      getEscalaRedirect({
        shiftError: "Nao foi possivel conectar ao banco para atualizar a escala.",
      }),
    );
  }

  const { error } = await supabase
    .from("staff_shifts")
    .update({ status: nextStatus })
    .eq("id", shiftId);

  if (error) {
    redirect(
      getEscalaRedirect({
        shiftError:
          "Nao foi possivel atualizar o status. Verifique a estrutura da tabela staff_shifts.",
      }),
    );
  }

  await writeOperationAuditLog(supabase, session, {
    eventType: "staff_shift_status_updated",
    entityType: "staff_shift",
    entityId: shiftId,
    entityLabel: shiftId,
    description: "Status de turno atualizado na escala.",
    metadata: {
      nextStatus,
    },
  });

  revalidateStaffPaths();

  redirect(
    getEscalaRedirect({
      shiftNotice: "Status do turno atualizado.",
    }),
  );
}

export async function deleteStaffShiftAction(formData) {
  const session = await requireRole(["manager", "owner"]);

  const shiftId = String(formData.get("shiftId") ?? "").trim();

  if (!shiftId) {
    return;
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("staff_shifts").delete().eq("id", shiftId);

  if (!error) {
    await writeOperationAuditLog(supabase, session, {
      eventType: "staff_shift_deleted",
      entityType: "staff_shift",
      entityId: shiftId,
      entityLabel: shiftId,
      description: "Turno removido da escala.",
      metadata: {},
    });
  }

  revalidateStaffPaths();

  redirect(
    getEscalaRedirect({
      shiftNotice: "Turno removido da escala.",
    }),
  );
}

export async function createCampaignAction(formData) {
  const session = await requireRole(["manager", "owner"]);

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const channel = String(formData.get("channel") ?? "").trim();
  const startsOn = String(formData.get("startsOn") ?? "").trim();
  const endsOn = String(formData.get("endsOn") ?? "").trim();
  const targetAudience = String(formData.get("targetAudience") ?? "").trim();
  const highlightOffer = String(formData.get("highlightOffer") ?? "").trim();
  const status = String(formData.get("status") ?? "draft").trim();

  if (!title || !campaignChannels.includes(channel) || !campaignStatuses.includes(status)) {
    redirect(
      getCampanhasRedirect({
        campaignError: "Preencha titulo, canal e status da campanha.",
      }),
    );
  }

  if (!isDateOnly(startsOn) || !isDateOnly(endsOn) || startsOn > endsOn) {
    redirect(
      getCampanhasRedirect({
        campaignError: "Informe datas validas para inicio e fim da campanha.",
      }),
    );
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    redirect(
      getCampanhasRedirect({
        campaignError: "Nao foi possivel conectar ao banco para salvar a campanha.",
      }),
    );
  }

  const { data, error } = await supabase
    .from("marketing_campaigns")
    .insert({
      title,
      description: description || null,
      channel,
      starts_on: startsOn,
      ends_on: endsOn,
      status,
      target_audience: targetAudience || null,
      highlight_offer: highlightOffer || null,
      created_by_user_id: session.profile.user_id,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    redirect(
      getCampanhasRedirect({
        campaignError:
          "Nao foi possivel salvar a campanha. Verifique se a tabela marketing_campaigns existe no banco.",
      }),
    );
  }

  await writeOperationAuditLog(supabase, session, {
    eventType: "campaign_saved",
    entityType: "marketing_campaign",
    entityId: data?.id || null,
    entityLabel: title,
    description: "Campanha criada na central comercial.",
    metadata: {
      channel,
      startsOn,
      endsOn,
      status,
    },
  });

  revalidateStaffPaths();

  redirect(
    getCampanhasRedirect({
      campaignNotice: "Campanha criada com sucesso.",
    }),
  );
}

export async function setCampaignStatusAction(formData) {
  const session = await requireRole(["manager", "owner"]);

  const campaignId = String(formData.get("campaignId") ?? "").trim();
  const nextStatus = String(formData.get("nextStatus") ?? "").trim();

  if (!campaignId || !campaignStatuses.includes(nextStatus)) {
    return;
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from("marketing_campaigns")
    .update({ status: nextStatus })
    .eq("id", campaignId);

  if (!error) {
    await writeOperationAuditLog(supabase, session, {
      eventType: "campaign_status_updated",
      entityType: "marketing_campaign",
      entityId: campaignId,
      entityLabel: campaignId,
      description: "Status de campanha atualizado.",
      metadata: {
        nextStatus,
      },
    });
  }

  revalidateStaffPaths();

  redirect(
    getCampanhasRedirect({
      campaignNotice: "Status da campanha atualizado.",
    }),
  );
}

export async function createCouponAction(formData) {
  const session = await requireRole(["manager", "owner"]);

  const campaignId = String(formData.get("campaignId") ?? "").trim();
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  const couponType = String(formData.get("couponType") ?? "").trim();
  const amount = parseCurrencyValue(formData.get("amount"));
  const minOrder = parseCurrencyValue(formData.get("minOrder"));
  const usageLimitRaw = String(formData.get("usageLimit") ?? "").trim();
  const startsOn = String(formData.get("startsOn") ?? "").trim();
  const endsOn = String(formData.get("endsOn") ?? "").trim();
  const isActive = formData.has("isActive");

  if (!code || !couponTypes.includes(couponType)) {
    redirect(
      getCampanhasRedirect({
        campaignError: "Informe codigo e tipo do cupom.",
      }),
    );
  }

  if (!/^[A-Z0-9_-]{3,24}$/.test(code)) {
    redirect(
      getCampanhasRedirect({
        campaignError:
          "Codigo invalido. Use de 3 a 24 caracteres com letras, numeros, _ ou -.",
      }),
    );
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    redirect(
      getCampanhasRedirect({
        campaignError: "Informe um valor valido para o cupom.",
      }),
    );
  }

  if (
    couponType === "percentage" &&
    (amount <= 0 || amount > 100)
  ) {
    redirect(
      getCampanhasRedirect({
        campaignError: "Cupom percentual deve estar entre 1 e 100.",
      }),
    );
  }

  if (!Number.isFinite(minOrder) || minOrder < 0) {
    redirect(
      getCampanhasRedirect({
        campaignError: "Pedido minimo do cupom precisa ser um valor valido.",
      }),
    );
  }

  if (!isDateOnly(startsOn) || !isDateOnly(endsOn) || startsOn > endsOn) {
    redirect(
      getCampanhasRedirect({
        campaignError: "Informe datas validas para vigencia do cupom.",
      }),
    );
  }

  const usageLimit =
    usageLimitRaw === "" ? null : Number.parseInt(usageLimitRaw, 10);

  if (usageLimit != null && (!Number.isInteger(usageLimit) || usageLimit <= 0)) {
    redirect(
      getCampanhasRedirect({
        campaignError: "Limite de uso deve ser inteiro positivo ou vazio.",
      }),
    );
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    redirect(
      getCampanhasRedirect({
        campaignError: "Nao foi possivel conectar ao banco para salvar o cupom.",
      }),
    );
  }

  const { data, error } = await supabase
    .from("marketing_coupons")
    .insert({
      campaign_id: campaignId || null,
      code,
      coupon_type: couponType,
      amount,
      min_order: minOrder,
      usage_limit: usageLimit,
      is_active: isActive,
      starts_on: startsOn,
      ends_on: endsOn,
      created_by_user_id: session.profile.user_id,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    redirect(
      getCampanhasRedirect({
        campaignError:
          error.code === "23505"
            ? "Ja existe um cupom com esse codigo."
            : "Nao foi possivel salvar o cupom. Verifique se a tabela marketing_coupons existe no banco.",
      }),
    );
  }

  await writeOperationAuditLog(supabase, session, {
    eventType: "coupon_saved",
    entityType: "marketing_coupon",
    entityId: data?.id || null,
    entityLabel: code,
    description: "Cupom criado na central comercial.",
    metadata: {
      couponType,
      amount,
      minOrder,
      startsOn,
      endsOn,
      isActive,
    },
  });

  revalidateStaffPaths();

  redirect(
    getCampanhasRedirect({
      campaignNotice: "Cupom criado com sucesso.",
    }),
  );
}

export async function toggleCouponActiveAction(formData) {
  const session = await requireRole(["manager", "owner"]);

  const couponId = String(formData.get("couponId") ?? "").trim();
  const nextActiveValue = String(formData.get("nextActive") ?? "")
    .trim()
    .toLowerCase();

  if (
    !couponId ||
    (nextActiveValue !== "true" && nextActiveValue !== "false")
  ) {
    return;
  }

  const nextActive = nextActiveValue === "true";
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from("marketing_coupons")
    .update({ is_active: nextActive })
    .eq("id", couponId);

  if (!error) {
    await writeOperationAuditLog(supabase, session, {
      eventType: "coupon_state_changed",
      entityType: "marketing_coupon",
      entityId: couponId,
      entityLabel: couponId,
      description: nextActive
        ? "Cupom reativado."
        : "Cupom pausado.",
      metadata: {
        nextActive,
      },
    });
  }

  revalidateStaffPaths();

  redirect(
    getCampanhasRedirect({
      campaignNotice: "Estado do cupom atualizado.",
    }),
  );
}

export async function createLowOccupancyCouponAction() {
  const session = await requireRole(["manager", "owner"]);
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    redirect(
      getCampanhasRedirect({
        campaignError:
          "Nao foi possivel conectar ao banco para criar a acao de ocupacao.",
      }),
    );
  }

  const today = getTodayInBrazilDate();
  const [tablesResult, openChecksResult, reservationsResult] = await Promise.all([
    supabase
      .from("restaurant_tables")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("service_checks")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    supabase
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("reservation_date", today)
      .in("status", ["pending", "confirmed", "seated"]),
  ]);

  if (tablesResult.error || openChecksResult.error || reservationsResult.error) {
    redirect(
      getCampanhasRedirect({
        campaignError:
          "Nao foi possivel ler ocupacao atual para montar o cupom automatico.",
      }),
    );
  }

  const activeTables = Number(tablesResult.count ?? 0);
  const openChecks = Number(openChecksResult.count ?? 0);
  const activeReservations = Number(reservationsResult.count ?? 0);

  if (activeTables < 1) {
    redirect(
      getCampanhasRedirect({
        campaignError:
          "Sem mesas ativas para avaliar ocupacao. Ative mesas antes de criar esta acao.",
      }),
    );
  }

  const occupancyScore =
    (openChecks + activeReservations * 0.55) / Math.max(activeTables, 1);

  if (occupancyScore >= 0.78) {
    redirect(
      getCampanhasRedirect({
        campaignError:
          "A ocupacao atual esta alta. O cupom automatico foi bloqueado para evitar sobrecarga.",
      }),
    );
  }

  const discountAmount = occupancyScore <= 0.35 ? 15 : occupancyScore <= 0.5 ? 12 : 8;
  const minOrder = occupancyScore <= 0.35 ? 60 : 80;
  const endsOn = addDaysToDateString(today, 3);
  const campaignTitle = `Impulso de ocupacao ${today}`;
  const couponCode = `CASA${crypto.randomUUID().slice(0, 6).toUpperCase()}`;

  const campaignInsert = await supabase
    .from("marketing_campaigns")
    .insert({
      created_by_user_id: session.profile.user_id,
      title: campaignTitle,
      description:
        "Campanha gerada automaticamente para estimular demanda em janela de ocupacao abaixo do alvo.",
      channel: "site",
      starts_on: today,
      ends_on: endsOn,
      status: "active",
      target_audience: "Clientes de baixa recorrencia e visitantes ocasionais",
      highlight_offer: `${discountAmount}% em pedidos selecionados`,
    })
    .select("id")
    .maybeSingle();

  if (campaignInsert.error || !campaignInsert.data) {
    redirect(
      getCampanhasRedirect({
        campaignError: "Nao foi possivel criar a campanha automatica agora.",
      }),
    );
  }

  const couponInsert = await supabase.from("marketing_coupons").insert({
    campaign_id: campaignInsert.data.id,
    created_by_user_id: session.profile.user_id,
    code: couponCode,
    coupon_type: "percentage",
    amount: discountAmount,
    min_order: minOrder,
    usage_limit: 120,
    is_active: true,
    starts_on: today,
    ends_on: endsOn,
  });

  if (couponInsert.error) {
    redirect(
      getCampanhasRedirect({
        campaignError:
          "Campanha criada, mas o cupom automatico nao foi salvo. Tente novamente.",
      }),
    );
  }

  await writeOperationAuditLog(supabase, session, {
    eventType: "campaign_low_occupancy_coupon_created",
    entityType: "marketing_campaign",
    entityId: campaignInsert.data.id,
    entityLabel: campaignTitle,
    description:
      "Campanha com cupom automatico criada por leitura de ocupacao baixa.",
    metadata: {
      couponCode,
      discountAmount,
      minOrder,
      activeTables,
      openChecks,
      activeReservations,
      occupancyScore,
    },
  });

  revalidateStaffPaths();

  redirect(
    getCampanhasRedirect({
      campaignNotice: `Cupom ${couponCode} criado automaticamente para baixa ocupacao.`,
    }),
  );
}

export async function setOperationalChecklistItemAction(formData) {
  const session = await requireRole(["manager", "owner"]);
  const shift = String(formData.get("shift") ?? "").trim().toLowerCase();
  const itemKey = String(formData.get("itemKey") ?? "").trim();
  const itemLabel = String(formData.get("itemLabel") ?? "").trim();
  const checkedRaw = String(formData.get("checked") ?? "").trim().toLowerCase();
  const note = String(formData.get("note") ?? "").trim();

  if (
    !["opening", "closing"].includes(shift) ||
    !itemKey ||
    !itemLabel ||
    (checkedRaw !== "true" && checkedRaw !== "false")
  ) {
    redirect(
      getChecklistsRedirect({
        checklistError: "Nao foi possivel atualizar esse item do checklist.",
      }),
    );
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    redirect(
      getChecklistsRedirect({
        checklistError:
          "Nao foi possivel conectar ao banco para atualizar o checklist.",
      }),
    );
  }

  const checked = checkedRaw === "true";
  const today = getTodayInBrazilDate();

  await writeOperationAuditLog(supabase, session, {
    eventType: "checklist_item_set",
    entityType: "operation_checklist",
    entityId: `${today}-${shift}-${itemKey}`,
    entityLabel: itemLabel,
    description: checked
      ? "Item de checklist marcado como concluido."
      : "Item de checklist reaberto para revisao.",
    metadata: {
      shift,
      itemKey,
      itemLabel,
      checked,
      note: note || null,
      checklistDate: today,
    },
  });

  revalidateStaffPaths();

  redirect(
    getChecklistsRedirect({
      checklistNotice: checked
        ? "Checklist atualizado: item concluido."
        : "Checklist atualizado: item reaberto.",
    }),
  );
}

export async function reportOperationalIncidentAction(formData) {
  const session = await requireRole(["waiter", "manager", "owner"]);
  const category = String(formData.get("category") ?? "").trim().toLowerCase();
  const severity = String(formData.get("severity") ?? "").trim().toLowerCase();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();

  if (!title || !description || !category || !severity) {
    redirect(
      getIncidentesRedirect({
        incidentError:
          "Informe categoria, severidade, titulo e descricao para registrar o incidente.",
      }),
    );
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    redirect(
      getIncidentesRedirect({
        incidentError:
          "Nao foi possivel conectar ao banco para registrar o incidente.",
      }),
    );
  }

  const incidentId = `INC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

  await writeOperationAuditLog(supabase, session, {
    eventType: "incident_reported",
    entityType: "incident",
    entityId: incidentId,
    entityLabel: title,
    description: "Incidente operacional aberto para acompanhamento da equipe.",
    metadata: {
      category,
      severity,
      title,
      description,
      location: location || null,
      status: "open",
      reportedByRole: session.role,
    },
  });

  revalidateStaffPaths();

  redirect(
    getIncidentesRedirect({
      incidentNotice: `Incidente ${incidentId} registrado com sucesso.`,
    }),
  );
}

export async function resolveOperationalIncidentAction(formData) {
  const session = await requireRole(["manager", "owner"]);
  const incidentId = String(formData.get("incidentId") ?? "").trim();
  const incidentTitle = String(formData.get("incidentTitle") ?? "").trim();
  const resolutionNote = String(formData.get("resolutionNote") ?? "").trim();

  if (!incidentId) {
    redirect(
      getIncidentesRedirect({
        incidentError: "Nao foi possivel identificar o incidente para resolver.",
      }),
    );
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    redirect(
      getIncidentesRedirect({
        incidentError:
          "Nao foi possivel conectar ao banco para concluir o incidente.",
      }),
    );
  }

  await writeOperationAuditLog(supabase, session, {
    eventType: "incident_resolved",
    entityType: "incident",
    entityId: incidentId,
    entityLabel: incidentTitle || incidentId,
    description: "Incidente operacional resolvido e arquivado.",
    metadata: {
      resolutionNote: resolutionNote || null,
      status: "resolved",
      resolvedByRole: session.role,
    },
  });

  revalidateStaffPaths();

  redirect(
    getIncidentesRedirect({
      incidentNotice: `Incidente ${incidentId} resolvido.`,
    }),
  );
}
