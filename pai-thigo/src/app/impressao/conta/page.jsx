import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireRole } from "@/lib/auth";
import { getServiceCheckPrintReport, serviceCheckStatusMeta } from "@/lib/checks-data";
import { getOrderCheckoutPrintReport, orderStatusMeta } from "@/lib/staff-data";
import { PrintOnLoad } from "@/components/print-on-load";
import { PrintTriggerButton } from "@/components/print-trigger-button";
import {
  formatCurrency,
  getFulfillmentTypeLabel,
  getPaymentMethodLabel,
} from "@/lib/utils";

function formatDateTime(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function ImpressaoContaPage({ searchParams }) {
  await requireRole(["waiter", "manager", "owner"]);

  const resolvedSearchParams = await searchParams;
  const checkId = Array.isArray(resolvedSearchParams?.check)
    ? resolvedSearchParams.check[0]
    : resolvedSearchParams?.check;
  const orderCheckoutReference = Array.isArray(resolvedSearchParams?.pedido)
    ? resolvedSearchParams.pedido[0]
    : resolvedSearchParams?.pedido;
  const copyType = Array.isArray(resolvedSearchParams?.via)
    ? resolvedSearchParams.via[0]
    : resolvedSearchParams?.via;
  const resolvedCopyType = copyType === "house" ? "house" : "customer";

  const reportType = checkId
    ? "service-check"
    : orderCheckoutReference
      ? "order-checkout"
      : "";

  const [serviceCheckReport, orderCheckoutReport] = await Promise.all([
    reportType === "service-check" ? getServiceCheckPrintReport(checkId) : null,
    reportType === "order-checkout"
      ? getOrderCheckoutPrintReport(orderCheckoutReference)
      : null,
  ]);

  const report = serviceCheckReport ?? orderCheckoutReport;

  if (!report) {
    return (
      <main className="shell py-16">
        <div className="luxury-card rounded-[2.2rem] p-8">
          <h1 className="text-3xl font-semibold text-[var(--forest)]">
            Relatorio da conta indisponivel
          </h1>
          <p className="mt-3 text-sm leading-7 text-[rgba(21,35,29,0.72)]">
            A conta procurada nao foi encontrada ou ainda nao ficou pronta para
            impressao.
          </p>
          <Link href="/operacao/comandas" className="button-primary mt-6 w-fit">
            <ArrowLeft size={16} />
            Voltar para comandas
          </Link>
        </div>
      </main>
    );
  }

  const statusView =
    reportType === "service-check"
      ? serviceCheckStatusMeta[report.status] ?? serviceCheckStatusMeta.closed
      : orderStatusMeta[report.status] ?? orderStatusMeta.delivered;

  const pageTitle =
    reportType === "service-check"
      ? `Impressao da ${report.reportReference}`
      : `Impressao da comanda ${report.checkoutReference}`;
  const sectionTitle =
    reportType === "service-check" ? "Fechamento da conta" : "Comprovante de pedido";
  const sectionDescription =
    reportType === "service-check"
      ? "Documento interno para conferencia e impressao do atendimento."
      : "Comprovante nao fiscal emitido no fechamento do pedido sem mesa.";
  const sectionLabel =
    resolvedCopyType === "house" ? "Via da casa" : "Via do cliente";
  const backHref =
    reportType === "service-check"
      ? `/operacao/comandas?mesa=${encodeURIComponent(report.table?.name ?? "")}`
      : `/operacao/comandas?comanda=${encodeURIComponent(report.checkoutReference ?? "")}`;
  const totalAmount =
    reportType === "service-check" ? report.total : report.totalPrice;
  const subtotalAmount = report.subtotal ?? totalAmount;

  return (
    <main className="shell py-10 print:py-0">
      <PrintOnLoad />

      <section className="luxury-card rounded-[2.4rem] p-8 print:rounded-none print:border-0 print:bg-white print:p-0 print:shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--gold)]">
              Relatorio da conta
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-[var(--forest)]">
              {pageTitle}
            </h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <PrintTriggerButton />
            <Link href={backHref} className="button-secondary">
              <ArrowLeft size={16} />
              Voltar
            </Link>
          </div>
        </div>

        <div className="mt-8 print:mt-0">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[rgba(20,35,29,0.12)] pb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--gold)]">
                Pai Thiago
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-[var(--forest)]">
                {sectionTitle}
              </h2>
              <p className="mt-2 text-sm leading-7 text-[rgba(21,35,29,0.72)]">
                {sectionDescription}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.84)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--forest)]">
                {sectionLabel}
              </span>
              <span
                className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${statusView.badge}`}
              >
                {statusView.label}
              </span>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {reportType === "service-check" ? (
              <article className="rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--sage)]">
                  Mesa e atendimento
                </p>
                <div className="mt-4 space-y-2 text-sm leading-7 text-[rgba(21,35,29,0.72)]">
                  <p>
                    <span className="font-semibold text-[var(--forest)]">Mesa:</span>{" "}
                    {report.table?.name} - {report.table?.area}
                  </p>
                  <p>
                    <span className="font-semibold text-[var(--forest)]">Garcom:</span>{" "}
                    {report.openedBy?.fullName ?? "Nao identificado"}
                  </p>
                  <p>
                    <span className="font-semibold text-[var(--forest)]">Abertura:</span>{" "}
                    {formatDateTime(report.openedAt)}
                  </p>
                  {report.closedAt ? (
                    <p>
                      <span className="font-semibold text-[var(--forest)]">
                        Fechamento:
                      </span>{" "}
                      {formatDateTime(report.closedAt)}
                    </p>
                  ) : null}
                  {report.guestName ? (
                    <p>
                      <span className="font-semibold text-[var(--forest)]">
                        Cliente:
                      </span>{" "}
                      {report.guestName}
                    </p>
                  ) : null}
                </div>
              </article>
            ) : (
              <article className="rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--sage)]">
                  Pedido e atendimento
                </p>
                <div className="mt-4 space-y-2 text-sm leading-7 text-[rgba(21,35,29,0.72)]">
                  <p>
                    <span className="font-semibold text-[var(--forest)]">
                      Comanda:
                    </span>{" "}
                    {report.checkoutReference}
                  </p>
                  <p>
                    <span className="font-semibold text-[var(--forest)]">Canal:</span>{" "}
                    {getFulfillmentTypeLabel(report.fulfillmentType)}
                  </p>
                  <p>
                    <span className="font-semibold text-[var(--forest)]">Cliente:</span>{" "}
                    {report.guestName || "Cliente identificado no checkout"}
                  </p>
                  {report.guestEmail ? (
                    <p>
                      <span className="font-semibold text-[var(--forest)]">E-mail:</span>{" "}
                      {report.guestEmail}
                    </p>
                  ) : null}
                  <p>
                    <span className="font-semibold text-[var(--forest)]">Recebido em:</span>{" "}
                    {formatDateTime(report.createdAt)}
                  </p>
                </div>
              </article>
            )}

            <article className="rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--sage)]">
                Fechamento financeiro
              </p>
              <div className="mt-4 space-y-2 text-sm leading-7 text-[rgba(21,35,29,0.72)]">
                <p>
                  <span className="font-semibold text-[var(--forest)]">
                    Referencia:
                  </span>{" "}
                  {reportType === "service-check"
                    ? report.reportReference
                    : report.checkoutReference}
                </p>
                <p>
                  <span className="font-semibold text-[var(--forest)]">
                    Forma de pagamento:
                  </span>{" "}
                  {getPaymentMethodLabel(report.paymentMethod)}
                </p>
                <p>
                  <span className="font-semibold text-[var(--forest)]">Subtotal:</span>{" "}
                  {formatCurrency(subtotalAmount)}
                </p>
                {reportType === "order-checkout" ? (
                  <p>
                    <span className="font-semibold text-[var(--forest)]">
                      Taxa de entrega:
                    </span>{" "}
                    {formatCurrency(report.deliveryFee ?? 0)}
                  </p>
                ) : null}
                <p>
                  <span className="font-semibold text-[var(--forest)]">Total:</span>{" "}
                  {formatCurrency(totalAmount)}
                </p>
              </div>
            </article>
          </div>

          <div className="mt-8 rounded-[1.8rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--sage)]">
              {reportType === "service-check" ? "Itens da conta" : "Itens do pedido"}
            </p>

            <div className="mt-5 overflow-hidden rounded-[1.4rem] border border-[rgba(20,35,29,0.08)]">
              <table className="w-full border-collapse">
                <thead className="bg-[rgba(20,35,29,0.05)]">
                  <tr className="text-left text-xs uppercase tracking-[0.18em] text-[var(--sage)]">
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3">Qtd.</th>
                    <th className="px-4 py-3">Valor un.</th>
                    <th className="px-4 py-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {report.items.map((item) => (
                    <tr key={item.id} className="border-t border-[rgba(20,35,29,0.08)]">
                      <td className="px-4 py-3 text-sm text-[var(--forest)]">
                        <div className="font-semibold">{item.itemName}</div>
                        {item.notes ? (
                          <div className="mt-1 text-xs text-[rgba(21,35,29,0.64)]">
                            Observacao: {item.notes}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-sm text-[rgba(21,35,29,0.72)]">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-[rgba(21,35,29,0.72)]">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-[var(--forest)]">
                        {formatCurrency(item.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <div className="rounded-[1.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.76)] px-5 py-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--sage)]">
                  Total final
                </p>
                <p className="mt-2 text-2xl font-semibold text-[var(--forest)]">
                  {formatCurrency(totalAmount)}
                </p>
              </div>
            </div>
          </div>

          <p className="mt-8 text-xs uppercase tracking-[0.22em] text-[rgba(21,35,29,0.54)]">
            {reportType === "service-check"
              ? "Documento interno emitido pelo sistema do Pai Thiago."
              : "Comprovante nao fiscal emitido pelo sistema do Pai Thiago."}
          </p>
        </div>
      </section>
    </main>
  );
}
