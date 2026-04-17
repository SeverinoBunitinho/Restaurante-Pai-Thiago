import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import crypto from "node:crypto";

import { createClient } from "@supabase/supabase-js";

const projectRoot = process.cwd();
const envPath = path.join(projectRoot, ".env.local");
const defaultBackupDir = path.resolve(
  projectRoot,
  "..",
  "backups",
  "pai-thiago-tecnico-2026-03-21_14-40-58",
  "supabase-export",
);

function loadLocalEnv() {
  if (!existsSync(envPath)) {
    return;
  }

  const envContent = readFileSync(envPath, "utf8");

  for (const rawLine of envContent.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function getFlagValue(flagName) {
  const index = process.argv.findIndex((arg) => arg === flagName);

  if (index === -1) {
    return null;
  }

  return process.argv[index + 1] || null;
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizePaymentMethod(value) {
  const allowed = new Set(["pix", "credit_card", "debit_card", "cash"]);
  const payment = String(value || "").trim().toLowerCase();
  return allowed.has(payment) ? payment : "pix";
}

function normalizeOrderStatus(value) {
  const allowed = new Set([
    "received",
    "preparing",
    "ready",
    "dispatching",
    "delivered",
    "cancelled",
  ]);
  const status = String(value || "").trim().toLowerCase();
  return allowed.has(status) ? status : "received";
}

function normalizeOrderSource(value) {
  const allowed = new Set(["website", "customer", "staff"]);
  const source = String(value || "").trim().toLowerCase();
  return allowed.has(source) ? source : "customer";
}

function normalizeFulfillmentType(value) {
  const allowed = new Set(["delivery", "pickup"]);
  const type = String(value || "").trim().toLowerCase();
  return allowed.has(type) ? type : "pickup";
}

function numericValue(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readJsonArray(backupDir, fileName) {
  const filePath = path.join(backupDir, fileName);

  if (!existsSync(filePath)) {
    return [];
  }

  const raw = readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

async function listAllAuthUsers(adminClient) {
  const users = [];
  let page = 1;

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error) {
      throw new Error(`Falha ao listar usuarios do Auth: ${error.message}`);
    }

    const batch = data?.users ?? [];
    users.push(...batch);

    if (batch.length < 1000) {
      break;
    }

    page += 1;
  }

  return users;
}

async function ensureAuthUser(adminClient, authUserMap, email, fullName) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return null;
  }

  const existing = authUserMap.get(normalizedEmail);
  if (existing?.id) {
    return existing.id;
  }

  const temporaryPassword = crypto.randomBytes(12).toString("base64url");

  const { data, error } = await adminClient.auth.admin.createUser({
    email: normalizedEmail,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: {
      full_name: fullName || "Cliente restaurado",
      restored_from_backup: true,
    },
  });

  if (error) {
    throw new Error(`Falha ao criar usuario "${normalizedEmail}": ${error.message}`);
  }

  const createdUser = data?.user;
  if (!createdUser?.id) {
    throw new Error(`Usuario "${normalizedEmail}" criado sem id retornado.`);
  }

  authUserMap.set(normalizedEmail, createdUser);
  return createdUser.id;
}

async function restoreProfiles(adminClient, backupProfiles) {
  const authUsers = await listAllAuthUsers(adminClient);
  const authUserMap = new Map(
    authUsers.map((user) => [normalizeEmail(user.email), user]),
  );

  const customerProfiles = backupProfiles.filter(
    (profile) => String(profile?.role || "").toLowerCase() === "customer",
  );

  let restoredProfiles = 0;

  for (const profile of customerProfiles) {
    const email = normalizeEmail(profile.email);
    if (!email) {
      continue;
    }

    const resolvedUserId = await ensureAuthUser(
      adminClient,
      authUserMap,
      email,
      profile.full_name,
    );

    const { error } = await adminClient.from("profiles").upsert(
      {
        user_id: resolvedUserId,
        email,
        full_name: profile.full_name || "Cliente restaurado",
        phone: profile.phone || null,
        role: "customer",
        loyalty_points: numericValue(profile.loyalty_points, 0),
        preferred_room: profile.preferred_room || "Salao principal",
      },
      {
        onConflict: "user_id",
      },
    );

    if (error) {
      throw new Error(`Falha ao restaurar perfil "${email}": ${error.message}`);
    }

    restoredProfiles += 1;
  }

  return restoredProfiles;
}

async function restoreOrders(adminClient, backupOrders) {
  if (!backupOrders.length) {
    return 0;
  }

  const [{ data: profileRows, error: profileError }, { data: menuRows, error: menuError }] =
    await Promise.all([
      adminClient.from("profiles").select("user_id, email"),
      adminClient.from("menu_items").select("id, name"),
    ]);

  if (profileError) {
    throw new Error(`Falha ao mapear perfis atuais: ${profileError.message}`);
  }

  if (menuError) {
    throw new Error(`Falha ao mapear itens do cardapio: ${menuError.message}`);
  }

  const userIdByEmail = new Map(
    (profileRows || []).map((profile) => [normalizeEmail(profile.email), profile.user_id]),
  );
  const menuIdByName = new Map(
    (menuRows || []).map((menu) => [String(menu.name || "").trim().toLowerCase(), menu.id]),
  );

  const payload = [];

  for (const order of backupOrders) {
    const guestEmail = normalizeEmail(order.guest_email);
    const userId = userIdByEmail.get(guestEmail);

    if (!userId) {
      continue;
    }

    const normalizedItemName = String(order.item_name || "")
      .trim()
      .toLowerCase();
    const menuItemId = menuIdByName.get(normalizedItemName) || null;

    payload.push({
      id: order.id,
      user_id: userId,
      reservation_id: null,
      menu_item_id: menuItemId,
      guest_name: order.guest_name || "Cliente",
      guest_email: guestEmail || null,
      checkout_reference: order.checkout_reference || null,
      item_name: order.item_name || "Item restaurado",
      quantity: Math.max(1, numericValue(order.quantity, 1)),
      unit_price: numericValue(order.unit_price, 0),
      total_price: numericValue(order.total_price, 0),
      notes: order.notes || null,
      fulfillment_type: normalizeFulfillmentType(order.fulfillment_type),
      delivery_neighborhood: order.delivery_neighborhood || null,
      delivery_address: order.delivery_address || null,
      delivery_reference: order.delivery_reference || null,
      delivery_fee: Math.max(0, numericValue(order.delivery_fee, 0)),
      delivery_eta_minutes:
        order.delivery_eta_minutes == null
          ? null
          : Math.max(0, numericValue(order.delivery_eta_minutes, 0)),
      payment_method: normalizePaymentMethod(order.payment_method),
      status: normalizeOrderStatus(order.status),
      source: normalizeOrderSource(order.source),
      created_at: order.created_at || new Date().toISOString(),
      updated_at: order.updated_at || new Date().toISOString(),
    });
  }

  if (!payload.length) {
    return 0;
  }

  const { error } = await adminClient.from("orders").upsert(payload, {
    onConflict: "id",
    ignoreDuplicates: true,
  });

  if (error) {
    throw new Error(`Falha ao restaurar pedidos historicos: ${error.message}`);
  }

  return payload.length;
}

async function restoreRestaurantSettings(adminClient, backupSettings) {
  if (!backupSettings.length) {
    return 0;
  }

  const latest = backupSettings[0];
  const payload = {
    id: "main",
    restaurant_name: latest.restaurant_name || "Pai Thiago",
    tagline: latest.tagline || "",
    description: latest.description || "",
    address: latest.address || "",
    city: latest.city || "",
    phone: latest.phone || "",
    whatsapp: latest.whatsapp || "",
    email: normalizeEmail(latest.email) || "reservas@paithiago.com.br",
    map_url: latest.map_url || null,
    google_business_url: latest.google_business_url || null,
    instagram_url: latest.instagram_url || null,
    facebook_url: latest.facebook_url || null,
    instagram_handle: latest.instagram_handle || null,
    facebook_handle: latest.facebook_handle || null,
    schedule_lines: Array.isArray(latest.schedule_lines) ? latest.schedule_lines : [],
    holiday_policy: latest.holiday_policy || "",
    service_notes: Array.isArray(latest.service_notes) ? latest.service_notes : [],
    delivery_minimum_order: Math.max(0, numericValue(latest.delivery_minimum_order, 45)),
    pickup_eta_minutes: Math.max(0, numericValue(latest.pickup_eta_minutes, 20)),
    delivery_hotline: latest.delivery_hotline || latest.whatsapp || "",
    delivery_coverage_note: latest.delivery_coverage_note || "",
    about_story: latest.about_story || null,
    about_mission: latest.about_mission || null,
  };

  const { error } = await adminClient.from("restaurant_settings").upsert(payload, {
    onConflict: "id",
  });

  if (error) {
    throw new Error(`Falha ao restaurar configuracoes da casa: ${error.message}`);
  }

  return 1;
}

async function restoreDeliveryZones(adminClient, backupZones) {
  if (!backupZones.length) {
    return 0;
  }

  const payload = backupZones.map((zone, index) => ({
    slug: zone.slug || `zona-${index + 1}`,
    name: zone.name || `Zona ${index + 1}`,
    fee: Math.max(0, numericValue(zone.fee, 0)),
    eta_minutes: Math.max(0, numericValue(zone.eta_minutes, 30)),
    service_window: zone.service_window || null,
    is_active: zone.is_active !== false,
    sort_order: numericValue(zone.sort_order, index + 1),
  }));

  const { error } = await adminClient.from("delivery_zones").upsert(payload, {
    onConflict: "slug",
  });

  if (error) {
    throw new Error(`Falha ao restaurar zonas de delivery: ${error.message}`);
  }

  return payload.length;
}

async function main() {
  loadLocalEnv();

  const backupDir = getFlagValue("--backup-dir") || defaultBackupDir;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Faltam variaveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local.",
    );
  }

  if (!existsSync(backupDir)) {
    throw new Error(
      `Diretorio de backup nao encontrado: ${backupDir}\nUse --backup-dir \"CAMINHO\" para apontar o export.`,
    );
  }

  const backupProfiles = readJsonArray(backupDir, "profiles.json");
  const backupOrders = readJsonArray(backupDir, "orders.json");
  const backupSettings = readJsonArray(backupDir, "restaurant_settings.json");
  const backupZones = readJsonArray(backupDir, "delivery_zones.json");

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log("Iniciando restauracao de historico do backup...");
  console.log(`Backup utilizado: ${backupDir}`);

  const restoredProfiles = await restoreProfiles(adminClient, backupProfiles);
  console.log(`Perfis de clientes restaurados: ${restoredProfiles}`);

  const restoredOrders = await restoreOrders(adminClient, backupOrders);
  console.log(`Pedidos historicos restaurados: ${restoredOrders}`);

  const restoredSettings = await restoreRestaurantSettings(adminClient, backupSettings);
  console.log(`Configuracoes da casa restauradas: ${restoredSettings}`);

  const restoredZones = await restoreDeliveryZones(adminClient, backupZones);
  console.log(`Zonas de delivery restauradas: ${restoredZones}`);

  console.log("Restauracao de historico concluida.");
}

main().catch((error) => {
  console.error(`Erro na restauracao de historico: ${error.message || error}`);
  process.exit(1);
});
