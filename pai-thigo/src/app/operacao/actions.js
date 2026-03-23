"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth";
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

const orderStatuses = [
  "received",
  "preparing",
  "ready",
  "dispatching",
  "delivered",
  "cancelled",
];

const staffRoles = ["waiter", "manager"];
const shiftStatuses = ["planned", "confirmed", "completed", "absent"];
const campaignStatuses = ["draft", "active", "paused", "finished"];
const campaignChannels = ["site", "whatsapp", "instagram", "email", "interno"];
const couponTypes = ["percentage", "fixed_amount"];
const paymentMethods = new Set(paymentMethodOptions.map((option) => option.value));

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

function isDateOnly(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ""));
}

function isTimeOnly(value) {
  return /^\d{2}:\d{2}$/.test(String(value ?? ""));
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
  revalidatePath("/operacao/auditoria");
  revalidatePath("/operacao/previsao");
  revalidatePath("/impressao/conta");
  revalidatePath("/cardapio");
  revalidatePath("/carrinho");
  revalidatePath("/reservas");
}

export async function createStaffAccountAction(formData) {
  const session = await requireRole(["manager", "owner"]);

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();

  if (!fullName || !email || !password || !staffRoles.includes(role)) {
    redirect(
      buildRouteWithParams("/operacao/equipe", {
        staffError: "Preencha nome, e-mail, senha e cargo para salvar a conta interna.",
      }),
    );
  }

  if (password.length < 6) {
    redirect(
      buildRouteWithParams("/operacao/equipe", {
        staffError: "A senha da equipe precisa ter no minimo 6 caracteres.",
      }),
    );
  }

  if (session.role === "manager" && role !== "waiter") {
    redirect(
      buildRouteWithParams("/operacao/equipe", {
        staffError: "O gerente pode cadastrar apenas garcons.",
      }),
    );
  }

  const supabase = await getSupabaseServerClient();
  const adminClient = getSupabaseAdminClient();

  if (!supabase || !adminClient) {
    redirect(
      buildRouteWithParams("/operacao/equipe", {
        staffError:
          "Nao foi possivel conectar ao Supabase administrativo para criar a conta.",
      }),
    );
  }

  const { error: directoryError } = await supabase.from("staff_directory").upsert(
    {
      email,
      full_name: fullName,
      role,
      active: true,
    },
    { onConflict: "email" },
  );

  if (directoryError) {
    redirect(
      buildRouteWithParams("/operacao/equipe", {
        staffError: "Nao foi possivel atualizar a base interna da equipe agora.",
      }),
    );
  }

  const {
    data: { users },
    error: listUsersError,
  } = await adminClient.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (listUsersError) {
    redirect(
      buildRouteWithParams("/operacao/equipe", {
        staffError: "Nao foi possivel verificar as contas internas existentes.",
      }),
    );
  }

  const existingUser = users.find(
    (user) => user.email?.toLowerCase() === email,
  );

  if (existingUser) {
    const { error } = await adminClient.auth.admin.updateUserById(existingUser.id, {
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (error) {
      redirect(
        buildRouteWithParams("/operacao/equipe", {
          staffError: "A conta interna existe, mas nao foi possivel atualizar a senha.",
        }),
      );
    }
  } else {
    const { error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (error) {
      redirect(
        buildRouteWithParams("/operacao/equipe", {
          staffError: "Nao foi possivel criar a conta interna no Auth agora.",
        }),
      );
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

  const [checkResult, menuItemResult] = await Promise.all([
    supabase
      .from("service_checks")
      .select("id, status")
      .eq("id", checkId)
      .maybeSingle(),
    supabase
      .from("menu_items")
      .select("id, name, price, is_available")
      .eq("id", menuItemId)
      .maybeSingle(),
  ]);

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

  const unitPrice = Number(menuItemResult.data.price);
  const totalPrice = unitPrice * quantity;
  const insertResult = await supabase.from("service_check_items").insert({
    check_id: checkId,
    menu_item_id: menuItemResult.data.id,
    created_by_user_id: session.profile.user_id,
    item_name: menuItemResult.data.name,
    quantity,
    unit_price: unitPrice,
    total_price: totalPrice,
    notes: notes || null,
  });

  if (insertResult.error) {
    redirect(
      getComandasRedirect(tableName, {
        comandaError: "Nao foi possivel associar o produto a conta agora.",
      }),
    );
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
    },
  });

  revalidateStaffPaths();

  redirect(
    getComandasRedirect(tableName, {
      comandaNotice: "Produto associado a conta com sucesso.",
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

  const supabase = await getSupabaseServerClient();

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

export async function updateReservationStatusAction(formData) {
  const session = await requireRole(["waiter", "manager", "owner"]);

  const reservationId = String(formData.get("reservationId") ?? "").trim();
  const nextStatus = String(formData.get("nextStatus") ?? "").trim();

  if (!reservationId || !reservationStatuses.includes(nextStatus)) {
    return;
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from("reservations")
    .update({ status: nextStatus })
    .eq("id", reservationId);

  if (!error) {
    await writeOperationAuditLog(supabase, session, {
      eventType: "reservation_status_updated",
      entityType: "reservation",
      entityId: reservationId,
      entityLabel: reservationId,
      description: "Status da reserva atualizado na fila operacional.",
      metadata: {
        nextStatus,
      },
    });
  }

  revalidateStaffPaths();
}

export async function assignReservationTableAction(formData) {
  const session = await requireRole(["waiter", "manager", "owner"]);

  const reservationId = String(formData.get("reservationId") ?? "").trim();
  const tableId = String(formData.get("tableId") ?? "").trim();

  if (!reservationId) {
    return;
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from("reservations")
    .update({ assigned_table_id: tableId || null })
    .eq("id", reservationId);

  if (!error) {
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
      },
    });
  }

  revalidateStaffPaths();
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
