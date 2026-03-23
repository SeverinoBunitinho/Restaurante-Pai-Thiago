import { ChefHat, Timer } from "lucide-react";

import { updateOrderCheckoutStatusAction } from "@/app/operacao/actions";
import { SectionHeading } from "@/components/section-heading";
import { requireRole } from "@/lib/auth";
import { getKitchenBoard } from "@/lib/operations-advanced-data";
import { getFulfillmentTypeLabel } from "@/lib/utils";

function getKitchenActions(status, fulfillmentType = "pickup") {
  if (status === "received") {
    return [
      { label: "Iniciar preparo", value: "preparing", primary: true },
      { label: "Cancelar", value: "cancelled", primary: false },
    ];
  }

  if (status === "preparing") {
    return [{ label: "Marcar pronto", value: "ready", primary: true }];
  }

  if (status === "ready") {
    if (fulfillmentType === "delivery") {
      return [{ label: "Enviar para rota", value: "dispatching", primary: true }];
    }

    return [{ label: "Marcar entregue", value: "delivered", primary: true }];
  }

  if (status === "dispatching") {
    return [{ label: "Confirmar entrega", value: "delivered", primary: true }];
  }

  return [];
}

export default async function OperacaoCozinhaPage() {
  await requireRole(["waiter", "manager", "owner"]);
  const board = await getKitchenBoard();

  return (
    <>
      <section className="pt-10">
        <div className="grid gap-4 rounded-[2.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.46)] px-5 py-5 shadow-[0_20px_60px_rgba(36,29,15,0.06)] sm:grid-cols-3 lg:px-8">
          {board.summary.map((item) => (
            <div key={item.label} className="rounded-[1.5rem] px-4 py-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--sage)]">
                {item.label}
              </p>
              <p className="mt-3 text-3xl font-semibold text-[var(--forest)]">
                {item.value}
              </p>
              <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.68)]">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="pt-14">
        <div className="luxury-card rounded-[2.2rem] p-6">
          <SectionHeading
            eyebrow="KDS da casa"
            title="Fila de producao organizada por etapa"
            description="Aqui a equipe acompanha o que entrou, o que esta em preparo e o que precisa ser expedido."
            compact
          />

          <div className="mt-8 grid gap-4 xl:grid-cols-4">
            {board.columns.map((column) => (
              <article
                key={column.key}
                className="rounded-[1.8rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--gold)]">
                      {column.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                      {column.description}
                    </p>
                  </div>
                  <span className="rounded-full bg-[rgba(20,35,29,0.1)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--forest)]">
                    {column.orders.length}
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {column.orders.length ? (
                    column.orders.map((orderGroup) => (
                      <div
                        key={orderGroup.id}
                        className="rounded-[1.3rem] border border-[rgba(20,35,29,0.1)] bg-[rgba(255,255,255,0.74)] p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs uppercase tracking-[0.2em] text-[var(--sage)]">
                              {orderGroup.checkoutReference}
                            </p>
                            <h3 className="mt-2 text-lg font-semibold text-[var(--forest)]">
                              {orderGroup.guestName}
                            </h3>
                            <p className="mt-1 text-sm text-[rgba(21,35,29,0.72)]">
                              {getFulfillmentTypeLabel(orderGroup.fulfillmentType)}
                            </p>
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(20,35,29,0.12)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--forest)]">
                            <Timer size={13} />
                            {orderGroup.ageMinutes} min
                          </span>
                        </div>

                        <div className="mt-3 space-y-2">
                          {orderGroup.items.map((item) => (
                            <p
                              key={item.id}
                              className="text-sm leading-6 text-[rgba(21,35,29,0.72)]"
                            >
                              {item.quantity}x {item.itemName}
                            </p>
                          ))}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {getKitchenActions(
                            orderGroup.status,
                            orderGroup.fulfillmentType,
                          ).map((action) => (
                            <form key={action.value} action={updateOrderCheckoutStatusAction}>
                              <input
                                type="hidden"
                                name="checkoutReference"
                                value={orderGroup.checkoutReference}
                              />
                              <input
                                type="hidden"
                                name="orderIds"
                                value={JSON.stringify(orderGroup.orderIds)}
                              />
                              <input
                                type="hidden"
                                name="nextStatus"
                                value={action.value}
                              />
                              <button
                                type="submit"
                                className={action.primary ? "button-primary" : "button-secondary"}
                              >
                                {action.label}
                              </button>
                            </form>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[1.3rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.52)] px-4 py-4 text-sm leading-6 text-[rgba(21,35,29,0.7)]">
                      Nenhum pedido nesta etapa.
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="pt-14">
        <div className="luxury-card-dark rounded-[2.2rem] p-6 text-[var(--cream)]">
          <div className="flex items-center gap-3">
            <ChefHat className="text-[var(--gold-soft)]" size={18} />
            <p className="text-xs uppercase tracking-[0.24em] text-[rgba(217,185,122,0.92)]">
              Operacao real
            </p>
          </div>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-[rgba(255,247,232,0.76)]">
            A tela da cozinha fica separada de comandas, reservas e equipe para nao misturar fluxo.
            Cada mudanca de status aqui segue direto para o restante da operacao sem precisar atualizar manualmente.
          </p>
        </div>
      </section>
    </>
  );
}
