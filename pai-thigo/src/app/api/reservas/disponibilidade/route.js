import { NextResponse } from "next/server";

import { getReservationAvailabilitySnapshot } from "@/lib/site-data";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const date = String(searchParams.get("date") ?? "").trim();
  const time = String(searchParams.get("time") ?? "").trim();
  const guests = Number(searchParams.get("guests") ?? "0");
  const areaPreference = String(searchParams.get("area") ?? "").trim();

  try {
    const result = await getReservationAvailabilitySnapshot({
      date,
      time,
      guests,
      areaPreference,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: result.message,
        },
        {
          status: result.status ?? 400,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        data: {
          reservationDate: result.reservationDate,
          reservationTime: result.reservationTime,
          guests: result.guests,
          areaPreference: result.areaPreference,
          hasAvailability: result.hasAvailability,
          totalTables: result.totalTables,
          occupiedTables: result.occupiedTables,
          freeTables: result.freeTables,
          compatibleTables: result.compatibleTables,
          compatibleFreeTables: result.compatibleFreeTables,
          preferredAreaCompatibleTables: result.preferredAreaCompatibleTables,
          preferredAreaFreeTables: result.preferredAreaFreeTables,
          areaAdjusted: result.areaAdjusted,
          suggestedTable: result.suggestedTable,
          guidance: result.guidance,
        },
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
        message:
          "Nao foi possivel consultar disponibilidade neste momento. Tente novamente.",
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
