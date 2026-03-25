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

  board.financialTimeline.forEach((entry) => {
    lines.push(
      `financeiro,${escapeCsv(entry.date)},${escapeCsv(entry.revenue)},${escapeCsv(`contas fechadas ${entry.closedChecks}`)}`,
    );
  });

  return `${lines.join("\n")}\n`;
}

function createJson(board) {
  return JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      period: board.period,
      periodLabel: board.periodLabel,
      commissionRate: board.commissionRate,
      summary: board.summary,
      waiterCommissions: board.waiterCommissions,
      tableOccupancy: board.tableOccupancy,
      financialTimeline: board.financialTimeline,
    },
    null,
    2,
  );
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
  const format = searchParams.get("format") === "json" ? "json" : "csv";

  const board = await getServiceReportsBoard(period, {
    startDate,
    endDate,
  });
  const safePeriodLabel = board.periodLabel.replace(/\s+/g, "-").replace(/[^\w-]/g, "");
  const filename = `relatorio-operacao-${safePeriodLabel || "periodo"}.${format}`;
  const payload = format === "json" ? createJson(board) : createCsv(board);
  const contentType =
    format === "json" ? "application/json; charset=utf-8" : "text/csv; charset=utf-8";

  return new NextResponse(payload, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
