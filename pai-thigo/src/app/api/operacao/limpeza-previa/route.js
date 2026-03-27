import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth";
import {
  buildEmergencyCleanupCutoffIso,
  closedOrderStatuses,
  closedReservationStatuses,
  normalizeEmergencyCleanupRetentionDays,
} from "@/lib/emergency-cleanup";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function formatReservationSlot(item) {
  const dateValue = String(item?.reservation_date ?? "").trim();
  const timeValue = String(item?.reservation_time ?? "").slice(0, 5);

  if (!dateValue && !timeValue) {
    return "";
  }

  return `${dateValue}${timeValue ? ` ${timeValue}` : ""}`.trim();
}

export async function GET(request) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        message: "Nao autenticado.",
      },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  if (session.role !== "owner") {
    return NextResponse.json(
      {
        ok: false,
        message: "Apenas o dono pode visualizar a previa de limpeza extrema.",
      },
      {
        status: 403,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const supabaseAdmin = getSupabaseAdminClient();
  const supabaseServer = await getSupabaseServerClient();
  const supabase = supabaseAdmin ?? supabaseServer;

  if (!supabase) {
    return NextResponse.json(
      {
        ok: false,
        message: "Nao foi possivel conectar ao Supabase.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const { searchParams } = new URL(request.url);
  const retentionDays = normalizeEmergencyCleanupRetentionDays(
    searchParams.get("dias") ?? searchParams.get("retentionDays"),
  );
  const cutoffIso = buildEmergencyCleanupCutoffIso(retentionDays);

  const [
    ordersCountResult,
    reservationsCountResult,
    ordersPreviewResult,
    reservationsPreviewResult,
  ] = await Promise.all([
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
    supabase
      .from("orders")
      .select("id, checkout_reference, guest_name, status, updated_at")
      .in("status", closedOrderStatuses)
      .lt("updated_at", cutoffIso)
      .order("updated_at", { ascending: true })
      .limit(5),
    supabase
      .from("reservations")
      .select(
        "id, guest_name, reservation_date, reservation_time, status, updated_at",
      )
      .in("status", closedReservationStatuses)
      .lt("updated_at", cutoffIso)
      .order("updated_at", { ascending: true })
      .limit(5),
  ]);

  if (
    ordersCountResult.error ||
    reservationsCountResult.error ||
    ordersPreviewResult.error ||
    reservationsPreviewResult.error
  ) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Nao foi possivel consultar os registros elegiveis para limpeza agora.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const ordersCount = Number(ordersCountResult.count ?? 0);
  const reservationsCount = Number(reservationsCountResult.count ?? 0);
  const totalCount = ordersCount + reservationsCount;
  const ordersPreview = (ordersPreviewResult.data ?? []).map((item) => ({
    id: item.id,
    label:
      item.checkout_reference ||
      item.guest_name ||
      `Pedido ${String(item.id).slice(0, 8)}`,
    status: item.status,
    updatedAt: item.updated_at,
  }));
  const reservationsPreview = (reservationsPreviewResult.data ?? []).map((item) => ({
    id: item.id,
    label: item.guest_name || `Reserva ${String(item.id).slice(0, 8)}`,
    slot: formatReservationSlot(item),
    status: item.status,
    updatedAt: item.updated_at,
  }));

  return NextResponse.json(
    {
      ok: true,
      message: totalCount
        ? `Foram encontrados ${totalCount} registro(s) elegiveis para limpeza.`
        : `Nenhum registro encerrado com mais de ${retentionDays} dia(s) foi encontrado para limpeza.`,
      data: {
        generatedAt: new Date().toISOString(),
        retentionDays,
        cutoffIso,
        ordersCount,
        reservationsCount,
        totalCount,
        hasRecords: totalCount > 0,
        ordersPreview,
        reservationsPreview,
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
