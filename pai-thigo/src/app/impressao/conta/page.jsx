import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PrintOnLoad } from "@/components/print-on-load";
import { PrintTriggerButton } from "@/components/print-trigger-button";
import { getServiceCheckPrintReport, serviceCheckStatusMeta } from "@/lib/checks-data";
import { requireRole } from "@/lib/auth";
import { formatCurrency, getPaymentMethodLabel } from "@/lib/utils";

export default async function ImpressaoContaPage({ searchParams }) {
  await requireRole(["waiter", "manager", "owner"]);

  const resolvedSearchParams = await searchParams;
  const checkId = Array.isArray(resolvedSearchParams?.check)
    ? resolvedSearchParams.check[0]
    : resolvedSearchParams?.check;
  const report = await getServiceCheckPrintReport(checkId ?? "");

  if (!report) {
    return (
      <main className="shell py-16">
        <div className="luxury-card rounded-[2.2rem] p-8">
          <h1 className="text-3xl font-semibold text-[var(--forest)]">
            Relatorio da conta indisponivel
          </h1>
          <p className="mt-3 text-sm leading-7 text-[rgba(21,35,29,0.72)]">
            A conta procurada nao foi encontrada ou ainda nao ficou pronta para impressao.
          </p>
          <Link href="/operacao/comandas" className="button-primary mt-6 w-fit">
            <ArrowLeft size={16} />
            Voltar para comandas
          </Link>
        </div>
      </main>
    );
  }

  const statusView = serviceCheckStatusMeta[report.status] ?? serviceCheckStatusMeta.closed;

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
              Impressao da {report.reportReference}
            </h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <PrintTriggerButton />
            <Link
              href={`/operacao/comandas?mesa=${encodeURIComponent(report.table?.name ?? "")}`}
              className="button-secondary"
            >
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
                Fechamento da conta
              </h2>
              <p className="mt-2 text-sm leading-7 text-[rgba(21,35,29,0.72)]">
                Documento interno para conferencia e impressao do atendimento.
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${statusView.badge}`}
            >
              {statusView.label}
            </span>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
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
                  {new Intl.DateTimeFormat("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  }).format(new Date(report.openedAt))}
                </p>
                {report.closedAt ? (
                  <p>
                    <span className="font-semibold text-[var(--forest)]">Fechamento:</span>{" "}
                    {new Intl.DateTimeFormat("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(new Date(report.closedAt))}
                  </p>
                ) : null}
                {report.guestName ? (
                  <p>
                    <span className="font-semibold text-[var(--forest)]">Cliente:</span>{" "}
                    {report.guestName}
                  </p>
                ) : null}
              </div>
            </article>

            <article className="rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--sage)]">
                Fechamento financeiro
              </p>
              <div className="mt-4 space-y-2 text-sm leading-7 text-[rgba(21,35,29,0.72)]">
                <p>
                  <span className="font-semibold text-[var(--forest)]">Referencia:</span>{" "}
                  {report.reportReference}
                </p>
                <p>
                  <span className="font-semibold text-[var(--forest)]">Forma de pagamento:</span>{" "}
                  {getPaymentMethodLabel(report.paymentMethod)}
                </p>
                <p>
                  <span className="font-semibold text-[var(--forest)]">Subtotal:</span>{" "}
                  {formatCurrency(report.subtotal)}
                </p>
                <p>
                  <span className="font-semibold text-[var(--forest)]">Total:</span>{" "}
                  {formatCurrency(report.total)}
                </p>
              </div>
            </article>
          </div>

          <div className="mt-8 rounded-[1.8rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--sage)]">
              Itens da conta
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
                  {formatCurrency(report.total)}
                </p>
              </div>
            </div>
          </div>

          <p className="mt-8 text-xs uppercase tracking-[0.22em] text-[rgba(21,35,29,0.54)]">
            Documento interno emitido pelo sistema do Pai Thiago.
          </p>
        </div>
      </section>
    </main>
  );
}
