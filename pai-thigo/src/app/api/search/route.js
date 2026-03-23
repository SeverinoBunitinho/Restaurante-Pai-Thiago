import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

const PUBLIC_ENTRY_CATALOG = [
  {
    id: "page:cardapio",
    title: "Cardapio",
    description: "Pratos ativos, detalhes, preco e adicao ao carrinho.",
    href: "/cardapio",
    group: "Paginas",
    profile: "all",
  },
  {
    id: "page:pedidos",
    title: "Pedidos",
    description: "Acompanhar status e historico dos pedidos.",
    href: "/pedidos",
    group: "Paginas",
    profile: "authenticated",
  },
  {
    id: "page:reservas",
    title: "Reservas",
    description: "Criar, acompanhar e gerenciar reservas da casa.",
    href: "/reservas",
    group: "Paginas",
    profile: "all",
  },
  {
    id: "page:eventos",
    title: "Eventos",
    description: "Agenda de experiencias e encontros especiais da casa.",
    href: "/eventos",
    group: "Paginas",
    profile: "all",
  },
  {
    id: "page:contato",
    title: "Contato",
    description: "Canais oficiais de atendimento do Pai Thiago.",
    href: "/contato",
    group: "Paginas",
    profile: "all",
  },
];

const CUSTOMER_ENTRY_CATALOG = [
  {
    id: "customer:perfil",
    title: "Perfil do cliente",
    description: "Dados da conta, preferencias e atalhos da jornada.",
    href: "/area-cliente",
    group: "Area do cliente",
  },
  {
    id: "customer:carrinho",
    title: "Meu carrinho",
    description: "Itens escolhidos, pagamento e finalizacao do pedido.",
    href: "/carrinho",
    group: "Area do cliente",
  },
];

const STAFF_ENTRY_CATALOG = [
  {
    id: "staff:painel",
    title: "Painel do turno",
    description: "Visao rapida da operacao da equipe.",
    href: "/painel",
    group: "Operacao",
    roles: ["waiter", "manager", "owner"],
  },
  {
    id: "staff:central",
    title: "Central da operacao",
    description: "Mapa dos modulos internos da equipe.",
    href: "/operacao",
    group: "Operacao",
    roles: ["waiter", "manager", "owner"],
  },
  {
    id: "staff:comandas",
    title: "Comandas",
    description: "Abrir conta, buscar mesa e fechar com relatorio.",
    href: "/operacao/comandas",
    group: "Operacao",
    roles: ["waiter", "manager", "owner"],
  },
  {
    id: "staff:reservas",
    title: "Reservas internas",
    description: "Confirmar chegada, acomodar e finalizar reservas.",
    href: "/operacao/reservas",
    group: "Operacao",
    roles: ["waiter", "manager", "owner"],
  },
  {
    id: "staff:mesas",
    title: "Mesas",
    description: "Controle da ocupacao e distribuicao do salao.",
    href: "/operacao/mesas",
    group: "Operacao",
    roles: ["waiter", "manager", "owner"],
  },
  {
    id: "staff:cozinha",
    title: "Cozinha",
    description: "Fila de preparo e expedicao de pedidos.",
    href: "/operacao/cozinha",
    group: "Operacao",
    roles: ["waiter", "manager", "owner"],
  },
  {
    id: "staff:menu",
    title: "Cardapio interno",
    description: "Ativar, pausar e ajustar pratos no sistema.",
    href: "/operacao/menu",
    group: "Gestao interna",
    roles: ["manager", "owner"],
  },
  {
    id: "staff:equipe",
    title: "Equipe",
    description: "Cadastro de equipe interna e controle de acesso.",
    href: "/operacao/equipe",
    group: "Gestao interna",
    roles: ["manager", "owner"],
  },
  {
    id: "staff:relatorios",
    title: "Relatorios",
    description: "Comissoes, ocupacao de mesas e indicadores.",
    href: "/operacao/relatorios",
    group: "Gestao interna",
    roles: ["manager", "owner"],
  },
  {
    id: "staff:executivo",
    title: "Visao executiva",
    description: "Camada estrategica para o dono do restaurante.",
    href: "/operacao/executivo",
    group: "Gestao interna",
    roles: ["owner"],
  },
];

function normalizeValue(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function rankByQuery(entries, query, limit) {
  const normalizedQuery = normalizeValue(query);
  const maxItems = Number.isFinite(limit) ? limit : 12;
  const ranked = [];

  for (const entry of entries) {
    const title = normalizeValue(entry.title);
    const description = normalizeValue(entry.description);
    const searchableText = `${title} ${description}`;

    if (!normalizedQuery) {
      ranked.push({
        ...entry,
        score: 0,
      });
      continue;
    }

    if (!searchableText.includes(normalizedQuery)) {
      continue;
    }

    let score = 1;

    if (title.startsWith(normalizedQuery)) {
      score = 4;
    } else if (title.includes(` ${normalizedQuery}`)) {
      score = 3;
    } else if (description.includes(normalizedQuery)) {
      score = 2;
    }

    ranked.push({
      ...entry,
      score,
    });
  }

  return ranked
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.title.localeCompare(right.title, "pt-BR");
    })
    .slice(0, Math.max(4, maxItems))
    .map((entry) => {
      const { score, ...normalizedEntry } = entry;
      void score;
      return normalizedEntry;
    });
}

function isStaffRole(role) {
  return ["waiter", "manager", "owner"].includes(role);
}

function resolveRoleCatalog(role) {
  if (isStaffRole(role)) {
    return STAFF_ENTRY_CATALOG.filter((item) => item.roles.includes(role));
  }

  if (role === "customer") {
    return CUSTOMER_ENTRY_CATALOG;
  }

  return [];
}

function toLikeQuery(query) {
  return `%${String(query ?? "").replace(/[%_,]/g, "").trim()}%`;
}

function mapMenuResult(item, staffSession) {
  return {
    id: `menu:${item.id}`,
    title: item.name,
    description: item.is_available
      ? "Prato disponivel no cardapio."
      : "Prato pausado no cardapio.",
    href: staffSession ? "/operacao/menu" : "/cardapio",
    group: "Cardapio",
  };
}

function mapOrderResult(order, staffSession) {
  return {
    id: `order:${order.id}`,
    title: order.checkout_reference || order.item_name || "Pedido",
    description: `Status: ${order.status || "em andamento"}`,
    href: staffSession ? "/operacao/comandas" : "/pedidos",
    group: "Pedidos",
  };
}

function mapReservationResult(reservation, staffSession) {
  const hourLabel = String(reservation.reservation_time ?? "").slice(0, 5);
  const dateLabel = reservation.reservation_date || "";

  return {
    id: `reservation:${reservation.id}`,
    title: reservation.guest_name || "Reserva",
    description: `${dateLabel}${hourLabel ? ` | ${hourLabel}` : ""}`,
    href: staffSession ? "/operacao/reservas" : "/reservas",
    group: "Reservas",
  };
}

function mapTableResult(table) {
  return {
    id: `table:${table.id}`,
    title: table.name || "Mesa",
    description: table.area ? `Area: ${table.area}` : "Mesa ativa",
    href: "/operacao/mesas",
    group: "Mesas",
  };
}

async function resolveSessionContext() {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return {
      supabase: null,
      role: null,
      userId: null,
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      supabase,
      role: null,
      userId: null,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    supabase,
    role: profile?.role ?? "customer",
    userId: user.id,
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = String(searchParams.get("q") ?? "").trim();
  const limit = Number(searchParams.get("limit") ?? "12");
  const normalizedLimit = Number.isFinite(limit)
    ? Math.min(Math.max(limit, 6), 24)
    : 12;

  try {
    const { supabase, role, userId } = await resolveSessionContext();
    const staffSession = isStaffRole(role);

    const baseEntries = [
      ...PUBLIC_ENTRY_CATALOG.filter((item) => {
        if (item.profile === "all") {
          return true;
        }

        return Boolean(role);
      }),
      ...resolveRoleCatalog(role),
    ];

    const dynamicEntries = [];

    if (supabase && q.length >= 2) {
      const likeValue = toLikeQuery(q);
      const orderBaseQuery = supabase
        .from("orders")
        .select("id, checkout_reference, item_name, status, created_at")
        .or(
          `checkout_reference.ilike.${likeValue},item_name.ilike.${likeValue}`,
        )
        .order("created_at", { ascending: false })
        .limit(6);
      const reservationBaseQuery = supabase
        .from("reservations")
        .select("id, guest_name, reservation_date, reservation_time, status")
        .or(`guest_name.ilike.${likeValue}`)
        .order("reservation_date", { ascending: false })
        .limit(6);
      const menuPromise = supabase
        .from("menu_items")
        .select("id, name, is_available")
        .ilike("name", likeValue)
        .order("name", { ascending: true })
        .limit(8);

      const orderPromise = role
        ? staffSession
          ? orderBaseQuery
          : orderBaseQuery.eq("user_id", userId)
        : Promise.resolve({ data: [], error: null });

      const reservationPromise = role
        ? staffSession
          ? reservationBaseQuery
          : reservationBaseQuery.eq("user_id", userId)
        : Promise.resolve({ data: [], error: null });

      const tablesPromise = staffSession
        ? supabase
            .from("restaurant_tables")
            .select("id, name, area")
            .eq("is_active", true)
            .or(`name.ilike.${likeValue},area.ilike.${likeValue}`)
            .order("name", { ascending: true })
            .limit(6)
        : Promise.resolve({ data: [], error: null });

      const [
        menuResult,
        orderResult,
        reservationResult,
        tablesResult,
      ] = await Promise.all([menuPromise, orderPromise, reservationPromise, tablesPromise]);

      if (!menuResult.error) {
        dynamicEntries.push(
          ...(menuResult.data ?? []).map((item) => mapMenuResult(item, staffSession)),
        );
      }

      if (!orderResult.error) {
        dynamicEntries.push(
          ...(orderResult.data ?? []).map((order) => mapOrderResult(order, staffSession)),
        );
      }

      if (!reservationResult.error) {
        dynamicEntries.push(
          ...(reservationResult.data ?? []).map((reservation) =>
            mapReservationResult(reservation, staffSession),
          ),
        );
      }

      if (!tablesResult.error) {
        dynamicEntries.push(
          ...(tablesResult.data ?? []).map((table) => mapTableResult(table)),
        );
      }
    }

    const combinedEntries = [...baseEntries, ...dynamicEntries];
    const uniqueEntries = Array.from(
      new Map(combinedEntries.map((entry) => [entry.id, entry])).values(),
    );

    const items = rankByQuery(uniqueEntries, q, normalizedLimit);

    return NextResponse.json(
      {
        ok: true,
        items,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        items: [],
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
