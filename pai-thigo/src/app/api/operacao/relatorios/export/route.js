import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth";
import { getServiceReportsBoard } from "@/lib/checks-data";

function escapeCsv(value) {
  const raw = String(value ?? "");

  if (raw.includes(",") || raw.includes('"') || raw.includes("\n")) {
    return `"${raw.replace(/"/g, '""')}"`;
  }

  return raw;
}

function createCsv(board) {
  const lines = [];
  lines.push("secao,campo,valor,detalhe");

  lines.push(`resumo,periodo,${escapeCsv(board.periodLabel)},`);
  lines.push(`resumo,comissao_regra,${escapeCsv(`${board.commissionRate}%`)},`);

  board.summary.forEach((item) => {
    lines.push(
      `resumo,${escapeCsv(item.label)},${escapeCsv(item.value)},${escapeCsv(item.description)}`,
    );
  });

  board.waiterCommissions.forEach((waiter) => {
    lines.push(
      `comissao,${escapeCsv(waiter.fullName)},${escapeCsv(waiter.commissionAmount)},${escapeCsv(`vendas ${waiter.grossSales} | contas ${waiter.closedChecks}`)}`,
    );
  });

  board.tableOccupancy.forEach((table) => {
    lines.push(
      `ocupacao,${escapeCsv(table.name)},${escapeCsv(table.totalAccounts)},${escapeCsv(`area ${table.area} | fechadas ${table.closedAccounts} | canceladas ${table.cancelledAccounts} | vendas ${table.grossSales}`)}`,
    );
  });

  return `${lines.join("\n")}\n`;
}

export async function GET(request) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  if (!["manager", "owner"].includes(session.role)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "30d";
  const startDate = searchParams.get("start") || "";
  const endDate = searchParams.get("end") || "";

  const board = await getServiceReportsBoard(period, {
    startDate,
    endDate,
  });
  const csv = createCsv(board);
  const safePeriodLabel = board.periodLabel.replace(/\s+/g, "-").replace(/[^\w-]/g, "");
  const filename = `relatorio-operacao-${safePeriodLabel || "periodo"}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
