import Link from "next/link";
import {
  CreditCard,
  Printer,
  ReceiptText,
  Search,
  ShoppingBag,
  TableProperties,
} from "lucide-react";

import {
  addServiceCheckItemAction,
  cancelServiceCheckAction,
  closeServiceCheckAction,
  openServiceCheckAction,
  updateOrderCheckoutStatusAction,
} from "@/app/operacao/actions";
import { SectionHeading } from "@/components/section-heading";
import { requireRole } from "@/lib/auth";
import { getServiceChecksBoard, serviceCheckStatusMeta } from "@/lib/checks-data";
import { getOrdersBoard, orderStatusMeta } from "@/lib/staff-data";
import {
  formatCurrency,
  getFulfillmentTypeLabel,
  getPaymentMethodLabel,
  paymentMethodOptions,
} from "@/lib/utils";

const orderFilters = [
  { value: "all", label: "Todos" },
  { value: "received", label: "Recebidos" },
  { value: "preparing", label: "Em preparo" },
  { value: "ready", label: "Prontos" },
  { value: "dispatching", label: "Em rota" },
  { value: "delivered", label: "Entregues" },
  { value: "cancelled", label: "Cancelados" },
];

const orderSections = [
  {
    key: "received",
    title: "Recebidos agora",
    description: "Pedidos que acabaram de chegar pelo carrinho do cliente.",
  },
  {
    key: "preparing",
    title: "Em preparo",
    description: "Pedidos em andamento na cozinha ou no bar.",
  },
  {
    key: "ready",
    title: "Prontos para retirada",
    description: "Fechamentos digitais aguardando retirada ou conferencia.",
  },
  {
    key: "dispatching",
    title: "Saiu para entrega",
    description: "Pedidos de delivery em deslocamento para o cliente.",
  },
  {
    key: "delivered",
    title: "Entregues",
    description: "Pedidos finalizados corretamente pela equipe.",
  },
  {
    key: "cancelled",
    title: "Cancelados",
    description: "Historico de pedidos encerrados antes da entrega.",
  },
];

function formatDateTime(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusView(status) {
  return (
    serviceCheckStatusMeta[status] ?? {
      label: status,
      badge: "bg-[rgba(20,35,29,0.08)] text-[var(--forest)]",
    }
  );
}

function getOrderActions(status, fulfillmentType = "pickup") {
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
      return [{ label: "Saiu para entrega", value: "dispatching", primary: true }];
    }

    return [{ label: "Marcar retirado", value: "delivered", primary: true }];
  }

  if (status === "dispatching") {
    return [{ label: "Confirmar entrega", value: "delivered", primary: true }];
  }

  return [];
}

function buildComandasHref({ mesa, status }) {
  const params = new URLSearchParams();

  if (mesa) {
    params.set("mesa", mesa);
  }

  if (status && status !== "all") {
    params.set("status", status);
  }

  const query = params.toString();

  return query ? `/operacao/comandas?${query}` : "/operacao/comandas";
}

export default async function OperacaoComandasPage({ searchParams }) {
  await requireRole(["waiter", "manager", "owner"]);

  const resolvedSearchParams = await searchParams;
  const statusFilter = Array.isArray(resolvedSearchParams?.status)
    ? resolvedSearchParams.status[0]
    : resolvedSearchParams?.status;
  const tableQuery = Array.isArray(resolvedSearchParams?.mesa)
    ? resolvedSearchParams.mesa[0]
    : resolvedSearchParams?.mesa;
  const commandaNotice = Array.isArray(resolvedSearchParams?.comandaNotice)
    ? resolvedSearchParams.comandaNotice[0]
    : resolvedSearchParams?.comandaNotice;
  const commandaError = Array.isArray(resolvedSearchParams?.comandaError)
    ? resolvedSearchParams.comandaError[0]
    : resolvedSearchParams?.comandaError;

  const [checksBoard, ordersBoard] = await Promise.all([
    getServiceChecksBoard(tableQuery ?? ""),
    getOrdersBoard(),
  ]);

  const activeStatus = orderFilters.some((item) => item.value === statusFilter)
    ? statusFilter
    : "all";
  const groupedOrders = ordersBoard.groupedOrders ?? [];
  const orderGroupsByStatus = orderSections.reduce((accumulator, section) => {
    accumulator[section.key] = groupedOrders.filter(
      (orderGroup) => orderGroup.status === section.key,
    );

    return accumulator;
  }, {});
  const visibleSections =
    activeStatus === "all"
      ? orderSections.filter((section) => (orderGroupsByStatus[section.key] ?? []).length)
      : orderSections.filter((section) => section.key === activeStatus);
  const availableTables = checksBoard.tables.filter(
    (table) =>
      table.isActive &&
      !checksBoard.openChecks.some((check) => check.table?.id === table.id),
  );
  const selectedCheck = checksBoard.selectedCheck;
  const selectedTable = checksBoard.selectedTable;
  const defaultTableId =
    (!selectedCheck && selectedTable?.isActive ? selectedTable.id : "") ||
    availableTables[0]?.id ||
    "";
  const searchMessage =
    commandaError ||
    (checksBoard.searchState === "not-found"
      ? "Nenhuma mesa foi encontrada com essa busca."
      : checksBoard.searchState === "empty"
        ? "A mesa foi localizada, mas ainda nao tem conta aberta."
        : "");

  return (
    <>
      <section className="pt-10">
        <div className="grid gap-5 lg:grid-cols-[0.96fr_1.04fr]">
          <div className="luxury-card-dark rounded-[2.2rem] p-6 text-[var(--cream)]">
            <p className="text-xs uppercase tracking-[0.28em] text-[rgba(217,185,122,0.92)]">
              Comandas do salao
            </p>
            <h1 className="display-title page-section-title mt-4 max-w-[15ch] text-white sm:max-w-[17ch]">
              Buscar mesa, conferir conta e fechar com relatorio para impressao
            </h1>
            <p className="mt-4 text-sm leading-7 text-[rgba(255,247,232,0.74)]">
              O fechamento parte sempre da mesa. O sistema retorna a conta aberta,
              mostra garcom, horario, pedidos e valor total antes de liberar o
              botao de fechamento.
            </p>

            <form
              method="get"
              className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_auto]"
            >
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[rgba(217,185,122,0.88)]">
                  Buscar por mesa
                </span>
                <input
                  name="mesa"
                  defaultValue={tableQuery ?? ""}
                  placeholder="Ex.: 01, Mesa 01 ou Sala reservada"
                  className="w-full min-w-0 rounded-[1.2rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm text-white outline-none placeholder:text-[rgba(255,247,232,0.46)]"
                />
              </label>

              <button
                type="submit"
                className="button-primary w-full justify-center self-end lg:w-auto"
              >
                <Search size={16} />
                Buscar
              </button>

              <Link
                href="/operacao/comandas"
                className="button-ghost w-full justify-center self-end lg:w-auto"
              >
                Limpar busca
              </Link>
            </form>

            {searchMessage ? (
              <div className="mt-5 rounded-[1.5rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(138,93,59,0.16)] px-4 py-3 text-sm leading-6 text-[rgba(255,247,232,0.84)]">
                {searchMessage}
              </div>
            ) : null}

            {commandaNotice ? (
              <div className="mt-5 rounded-[1.5rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(95,123,109,0.18)] px-4 py-3 text-sm leading-6 text-[rgba(255,247,232,0.84)]">
                {commandaNotice}
              </div>
            ) : null}
          </div>

          <div className="luxury-card rounded-[2.2rem] p-6">
            <SectionHeading
              eyebrow="Resumo de comandas"
              title="Leitura rapida da operacao da mesa"
              description="Esses indicadores ajudam a equipe a perceber o salao antes de abrir ou fechar uma conta."
              compact
            />

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {checksBoard.summary.map((item) => {
                const numericValue = Number(item.value);
                const formattedValue = item.label.includes("Faturamento")
                  ? formatCurrency(numericValue)
                  : item.value;

                return (
                  <article
                    key={item.label}
                    className="rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5"
                  >
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--sage)]">
                      {item.label}
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-[var(--forest)]">
                      {formattedValue}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.68)]">
                      {item.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="pt-14">
        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="luxury-card rounded-[2.2rem] p-6">
            <SectionHeading
              eyebrow="Conta encontrada"
              title="Conferencia da mesa antes do fechamento"
              description="Busque a mesa, confira o garcom responsavel, o horario de abertura, os pedidos e o valor total antes de fechar."
              compact
            />

            {selectedCheck ? (
              <div className="mt-8 space-y-5">
                <article className="rounded-[1.8rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--sage)]">
                        {selectedCheck.table?.area}
                      </p>
                      <h2 className="mt-2 text-3xl font-semibold text-[var(--forest)]">
                        {selectedCheck.table?.name}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                        Garcom responsavel: {selectedCheck.openedBy?.fullName ?? "Nao identificado"}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${getStatusView(selectedCheck.status).badge}`}
                    >
                      {getStatusView(selectedCheck.status).label}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <div className="rounded-[1.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.72)] p-4 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                      <p>
                        <span className="font-semibold text-[var(--forest)]">Abertura:</span>{" "}
                        {formatDateTime(selectedCheck.openedAt)}
                      </p>
                      <p>
                        <span className="font-semibold text-[var(--forest)]">Referencia:</span>{" "}
                        {selectedCheck.reportReference}
                      </p>
                      {selectedCheck.guestName ? (
                        <p>
                          <span className="font-semibold text-[var(--forest)]">Cliente:</span>{" "}
                          {selectedCheck.guestName}
                        </p>
                      ) : null}
                    </div>

                    <div className="rounded-[1.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.72)] p-4 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                      <p>
                        <span className="font-semibold text-[var(--forest)]">Pedidos:</span>{" "}
                        {selectedCheck.totalItems} item(ns)
                      </p>
                      <p>
                        <span className="font-semibold text-[var(--forest)]">Subtotal:</span>{" "}
                        {formatCurrency(selectedCheck.subtotal)}
                      </p>
                      <p>
                        <span className="font-semibold text-[var(--forest)]">Total:</span>{" "}
                        {formatCurrency(selectedCheck.total)}
                      </p>
                    </div>
                  </div>

                  {selectedCheck.notes ? (
                    <div className="mt-4 rounded-[1.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.72)] p-4 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                      <span className="font-semibold text-[var(--forest)]">Observacao da conta:</span>{" "}
                      {selectedCheck.notes}
                    </div>
                  ) : null}

                  <div className="mt-5 rounded-[1.5rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.72)] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--sage)]">
                      Lista de pedidos
                    </p>
                    <div className="mt-4 space-y-3">
                      {selectedCheck.items.length ? (
                        selectedCheck.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex flex-wrap items-start justify-between gap-4 rounded-[1.2rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.7)] px-4 py-3"
                          >
                            <div>
                              <p className="text-sm font-semibold text-[var(--forest)]">
                                {item.itemName}
                              </p>
                              <p className="mt-1 text-sm text-[rgba(21,35,29,0.72)]">
                                {item.quantity} x {formatCurrency(item.unitPrice)}
                              </p>
                              {item.notes ? (
                                <p className="mt-2 text-sm text-[rgba(21,35,29,0.72)]">
                                  Observacao: {item.notes}
                                </p>
                              ) : null}
                            </div>
                            <p className="text-sm font-semibold text-[var(--forest)]">
                              {formatCurrency(item.totalPrice)}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-[1.2rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.54)] px-4 py-4 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                          Nenhum item associado ainda. Adicione os produtos abaixo antes de fechar.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto_auto]">
                    <form action={closeServiceCheckAction} className="grid gap-2">
                      <input type="hidden" name="checkId" value={selectedCheck.id} />
                      <input type="hidden" name="tableName" value={selectedCheck.table?.name ?? ""} />
                      <span className="text-sm font-semibold text-[var(--forest)]">
                        Forma de pagamento
                      </span>
                      <select
                        name="paymentMethod"
                        defaultValue="pix"
                        className="rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none"
                      >
                        {paymentMethodOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <button type="submit" className="button-primary mt-2">
                        <Printer size={16} />
                        Fechar conta
                      </button>
                    </form>

                    <form action={cancelServiceCheckAction} className="self-end">
                      <input type="hidden" name="checkId" value={selectedCheck.id} />
                      <input type="hidden" name="tableName" value={selectedCheck.table?.name ?? ""} />
                      <button type="submit" className="button-secondary">
                        Cancelar conta
                      </button>
                    </form>

                    <Link
                      href={`/impressao/conta?check=${selectedCheck.id}`}
                      className="button-ghost self-end"
                    >
                      <ReceiptText size={16} />
                      Reimprimir
                    </Link>
                  </div>
                </article>

                <article className="rounded-[1.8rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5">
                  <div className="flex items-start gap-3">
                    <ShoppingBag className="mt-1 text-[var(--gold)]" size={18} />
                    <div>
                      <h3 className="text-xl font-semibold text-[var(--forest)]">
                        Associar produto a conta
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                        O item entra imediatamente no total da conta aberta da mesa.
                      </p>
                    </div>
                  </div>

                  <form action={addServiceCheckItemAction} className="mt-6 grid gap-4">
                    <input type="hidden" name="checkId" value={selectedCheck.id} />
                    <input type="hidden" name="tableName" value={selectedCheck.table?.name ?? ""} />

                    <label className="grid gap-2">
                      <span className="text-sm font-semibold text-[var(--forest)]">Produto</span>
                      <select
                        name="menuItemId"
                        required
                        className="rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none"
                      >
                        <option value="">Selecione um item</option>
                        {checksBoard.menuCategories.map((category) => (
                          <optgroup key={category.id} label={category.name}>
                            {category.items.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name} - {formatCurrency(item.price)}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </label>

                    <div className="grid gap-4 md:grid-cols-[10rem_1fr]">
                      <label className="grid gap-2">
                        <span className="text-sm font-semibold text-[var(--forest)]">Quantidade</span>
                        <input
                          name="quantity"
                          type="number"
                          min="1"
                          max="20"
                          defaultValue="1"
                          required
                          className="rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none"
                        />
                      </label>

                      <label className="grid gap-2">
                        <span className="text-sm font-semibold text-[var(--forest)]">Observacao do item</span>
                        <input
                          name="notes"
                          type="text"
                          maxLength={180}
                          className="rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none"
                          placeholder="Ex.: sem cebola, ponto da carne, dividir em 2"
                        />
                      </label>
                    </div>

                    <button type="submit" className="button-primary w-full">
                      Associar produto
                    </button>
                  </form>
                </article>
              </div>
            ) : (
              <article className="mt-8 rounded-[1.8rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.52)] p-6">
                <p className="text-lg font-semibold text-[var(--forest)]">
                  Busque uma mesa para localizar a conta
                </p>
                <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                  Quando a mesa tiver conta aberta, o sistema vai mostrar os dados da conta,
                  nome do garcom, horario de abertura, lista de pedidos e valor total.
                </p>
              </article>
            )}
          </div>

          <div className="space-y-5">
            <div className="luxury-card rounded-[2.2rem] p-6">
              <SectionHeading
                eyebrow="Abrir nova conta"
                title="Iniciar atendimento de uma mesa"
                description="Garcom, gerente ou dono podem abrir a conta da mesa e registrar o cliente quando necessario."
                compact
              />

              {selectedTable && !selectedCheck ? (
                <div className="mt-6 rounded-[1.5rem] border border-[rgba(95,123,109,0.18)] bg-[rgba(95,123,109,0.08)] px-4 py-3 text-sm leading-6 text-[rgba(21,35,29,0.74)]">
                  Mesa localizada: <span className="font-semibold text-[var(--forest)]">{selectedTable.name}</span>{" "}
                  em {selectedTable.area}. Ela esta pronta para abrir uma nova conta.
                </div>
              ) : null}

              {!availableTables.length ? (
                <article className="mt-8 rounded-[1.6rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.5)] p-6">
                  <p className="text-lg font-semibold text-[var(--forest)]">
                    Nenhuma mesa livre para abrir conta agora
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                    Todas as mesas ativas ja estao com conta aberta ou foram pausadas pela gestao.
                  </p>
                </article>
              ) : (
                <form action={openServiceCheckAction} className="mt-8 grid gap-4">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-[var(--forest)]">Mesa</span>
                    <select
                      name="tableId"
                      defaultValue={defaultTableId}
                      required
                      className="rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none"
                    >
                      <option value="">Selecione uma mesa</option>
                      {availableTables.map((table) => (
                        <option key={table.id} value={table.id}>
                          {table.name} - {table.area} - {table.capacity} pessoa(s)
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-[var(--forest)]">Nome do cliente</span>
                    <input
                      name="guestName"
                      type="text"
                      maxLength={120}
                      placeholder="Opcional para identificar a mesa"
                      className="rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-[var(--forest)]">Observacao da conta</span>
                    <textarea
                      name="notes"
                      rows={4}
                      maxLength={240}
                      placeholder="Ex.: aniversariante, comanda compartilhada, atendimento corporativo"
                      className="rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none"
                    />
                  </label>

                  <button type="submit" className="button-primary w-full">
                    <TableProperties size={16} />
                    Abrir conta
                  </button>
                </form>
              )}
            </div>

            <div className="luxury-card rounded-[2.2rem] p-6">
              <SectionHeading
                eyebrow="Contas abertas"
                title="Fila viva do salao"
                description="Cada card abaixo leva direto para a conta da mesa, com conferencia e fechamento."
                compact
              />

              <div className="mt-8 space-y-4">
                {checksBoard.openChecks.length ? (
                  checksBoard.openChecks.map((check) => (
                    <Link
                      key={check.id}
                      href={buildComandasHref({ mesa: check.table?.name, status: activeStatus })}
                      className="block rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5 transition hover:-translate-y-0.5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.22em] text-[var(--sage)]">
                            {check.table?.area}
                          </p>
                          <h3 className="mt-2 text-xl font-semibold text-[var(--forest)]">
                            {check.table?.name}
                          </h3>
                          <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                            Aberta por {check.openedBy?.fullName ?? "Nao identificado"} em{" "}
                            {formatDateTime(check.openedAt)}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${getStatusView(check.status).badge}`}
                        >
                          {getStatusView(check.status).label}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-3 md:grid-cols-2">
                        <div className="rounded-[1.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.72)] p-4">
                          <p className="text-xs uppercase tracking-[0.22em] text-[var(--sage)]">
                            Itens e total
                          </p>
                          <p className="mt-3 text-lg font-semibold text-[var(--forest)]">
                            {check.totalItems} item(ns) - {formatCurrency(check.total)}
                          </p>
                        </div>
                        <div className="rounded-[1.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.72)] p-4">
                          <p className="text-xs uppercase tracking-[0.22em] text-[var(--sage)]">
                            Cliente
                          </p>
                          <p className="mt-3 text-lg font-semibold text-[var(--forest)]">
                            {check.guestName || "Mesa sem identificacao nominal"}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <article className="rounded-[1.6rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.5)] p-6">
                    <p className="text-lg font-semibold text-[var(--forest)]">
                      Nenhuma conta aberta neste momento
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                      Assim que a equipe abrir a primeira conta, ela aparece aqui para acompanhamento rapido.
                    </p>
                  </article>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pt-14">
        <div className="luxury-card rounded-[2.2rem] p-6">
          <SectionHeading
            eyebrow="Pedidos do carrinho"
            title="Fila digital recebida pelo site"
            description="Os pedidos feitos pelo cliente chegam aqui para o time acompanhar preparo, retirada ou delivery."
            compact
          />

          <div className="mt-6 flex flex-wrap gap-3">
            {orderFilters.map((filter) => (
              <Link
                key={filter.value}
                href={buildComandasHref({ mesa: tableQuery ?? "", status: filter.value })}
                className={`filter-chip ${activeStatus === filter.value ? "filter-chip-active" : ""}`}
              >
                {filter.label}
              </Link>
            ))}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {ordersBoard.summary.map((item) => (
              <article
                key={item.label}
                className="rounded-[1.5rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5"
              >
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--sage)]">
                  {item.label}
                </p>
                <p className="mt-3 text-3xl font-semibold text-[var(--forest)]">
                  {item.value}
                </p>
                <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.68)]">
                  {item.description}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-8 space-y-6">
            {visibleSections.length ? (
              visibleSections.map((section) => (
                <article
                  key={section.key}
                  className="rounded-[1.8rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.54)] p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--gold)]">
                        {section.title}
                      </p>
                      <h3 className="mt-3 text-2xl font-semibold text-[var(--forest)]">
                        {orderStatusMeta[section.key]?.label ?? section.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                        {section.description}
                      </p>
                    </div>
                    <span className="rounded-full bg-[rgba(95,123,109,0.12)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sage)]">
                      {(orderGroupsByStatus[section.key] ?? []).length} pedido(s)
                    </span>
                  </div>

                  <div className="mt-6 space-y-4">
                    {(orderGroupsByStatus[section.key] ?? []).map((orderGroup) => {
                      const statusView =
                        orderStatusMeta[orderGroup.status] ?? orderStatusMeta.received;
                      const actions = getOrderActions(
                        orderGroup.status,
                        orderGroup.fulfillmentType,
                      );

                      return (
                        <div
                          key={orderGroup.id}
                          className="rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.72)] p-5"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <p className="text-xs uppercase tracking-[0.22em] text-[var(--sage)]">
                                Pedido {orderGroup.checkoutReference}
                              </p>
                              <h4 className="mt-2 text-xl font-semibold text-[var(--forest)]">
                                {orderGroup.guestName || "Cliente identificado no checkout"}
                              </h4>
                              <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                                Recebido em {formatDateTime(orderGroup.createdAt)}
                              </p>
                            </div>
                            <span
                              className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${statusView.badge}`}
                            >
                              {statusView.label}
                            </span>
                          </div>

                          <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                            <div className="rounded-[1.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.76)] p-4">
                              <p className="text-xs uppercase tracking-[0.22em] text-[var(--sage)]">
                                Itens do pedido
                              </p>
                              <div className="mt-4 space-y-3">
                                {orderGroup.items.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex flex-wrap items-start justify-between gap-3 rounded-[1.2rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.78)] px-4 py-3"
                                  >
                                    <div>
                                      <p className="text-sm font-semibold text-[var(--forest)]">
                                        {item.itemName}
                                      </p>
                                      <p className="mt-1 text-sm text-[rgba(21,35,29,0.72)]">
                                        {item.quantity} x {formatCurrency(item.totalPrice / item.quantity)}
                                      </p>
                                      {item.notes ? (
                                        <p className="mt-2 text-sm text-[rgba(21,35,29,0.72)]">
                                          Observacao: {item.notes}
                                        </p>
                                      ) : null}
                                    </div>
                                    <p className="text-sm font-semibold text-[var(--forest)]">
                                      {formatCurrency(item.totalPrice)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div className="rounded-[1.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.76)] p-4">
                                <p className="text-xs uppercase tracking-[0.22em] text-[var(--sage)]">
                                  Atendimento e pagamento
                                </p>
                                <div className="mt-4 space-y-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                                  <p className="inline-flex items-center gap-2">
                                    <ShoppingBag size={16} className="text-[var(--gold)]" />
                                    {getFulfillmentTypeLabel(orderGroup.fulfillmentType)}
                                  </p>
                                  <p className="inline-flex items-center gap-2">
                                    <CreditCard size={16} className="text-[var(--gold)]" />
                                    {getPaymentMethodLabel(orderGroup.paymentMethod)}
                                  </p>
                                  <p>
                                    <span className="font-semibold text-[var(--forest)]">Itens:</span>{" "}
                                    {orderGroup.totalItems}
                                  </p>
                                  <p>
                                    <span className="font-semibold text-[var(--forest)]">Total:</span>{" "}
                                    {formatCurrency(orderGroup.totalPrice)}
                                  </p>
                                </div>
                              </div>

                              {orderGroup.fulfillmentType === "delivery" ? (
                                <div className="rounded-[1.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.76)] p-4 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--sage)]">
                                    Dados da entrega
                                  </p>
                                  <div className="mt-4 space-y-2">
                                    <p>
                                      <span className="font-semibold text-[var(--forest)]">Bairro:</span>{" "}
                                      {orderGroup.deliveryNeighborhood || "Nao informado"}
                                    </p>
                                    <p>
                                      <span className="font-semibold text-[var(--forest)]">Endereco:</span>{" "}
                                      {orderGroup.deliveryAddress || "Nao informado"}
                                    </p>
                                    {orderGroup.deliveryReference ? (
                                      <p>
                                        <span className="font-semibold text-[var(--forest)]">Referencia:</span>{" "}
                                        {orderGroup.deliveryReference}
                                      </p>
                                    ) : null}
                                    <p>
                                      <span className="font-semibold text-[var(--forest)]">Taxa:</span>{" "}
                                      {formatCurrency(orderGroup.deliveryFee)}
                                    </p>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </div>

                          {actions.length ? (
                            <div className="mt-5 flex flex-wrap gap-3">
                              {actions.map((action) => (
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
                                  <input type="hidden" name="nextStatus" value={action.value} />
                                  <button
                                    type="submit"
                                    className={action.primary ? "button-primary" : "button-secondary"}
                                  >
                                    {action.label}
                                  </button>
                                </form>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </article>
              ))
            ) : (
              <article className="rounded-[1.6rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.5)] p-6">
                <p className="text-lg font-semibold text-[var(--forest)]">
                  Nenhum pedido neste filtro
                </p>
                <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                  Assim que o cliente finalizar um novo carrinho, o pedido aparece aqui para a equipe.
                </p>
              </article>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
