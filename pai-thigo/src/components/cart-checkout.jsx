"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import {
  Banknote,
  Bike,
  CheckCircle2,
  CreditCard,
  MapPin,
  Minus,
  PackageCheck,
  Plus,
  QrCode,
  ShoppingBag,
  Store,
  Trash2,
} from "lucide-react";

import { initialCartCheckoutState } from "@/app/carrinho/action-state";
import { submitCartCheckoutAction } from "@/app/carrinho/actions";
import { useCart } from "@/components/cart-provider";
import { SubmitButton } from "@/components/submit-button";
import {
  cn,
  formatCurrency,
  fulfillmentTypeOptions,
  getFulfillmentTypeLabel,
  getPaymentMethodLabel,
  paymentMethodOptions,
} from "@/lib/utils";

const paymentIcons = {
  pix: QrCode,
  credit_card: CreditCard,
  debit_card: CreditCard,
  cash: Banknote,
};

const fulfillmentIcons = {
  delivery: Bike,
  pickup: Store,
};

export function CartCheckout({ customerName, restaurantInfo }) {
  const router = useRouter();
  const hasDeliveryCoverage = restaurantInfo.delivery.neighborhoods.length > 0;
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    paymentMethodOptions[0].value,
  );
  const [selectedFulfillmentType, setSelectedFulfillmentType] = useState(
    hasDeliveryCoverage ? fulfillmentTypeOptions[0].value : "pickup",
  );
  const [hideRealtimeQuestion, setHideRealtimeQuestion] = useState(false);
  const [selectedDeliveryNeighborhood, setSelectedDeliveryNeighborhood] = useState(
    restaurantInfo.delivery.neighborhoods[0]?.slug ?? "",
  );
  const [state, formAction] = useActionState(
    submitCartCheckoutAction,
    initialCartCheckoutState,
  );
  const {
    items,
    itemCount,
    totalPrice,
    isHydrated,
    clearCart,
    removeItem,
    updateNotes,
    updateQuantity,
    getItemStockInfo,
  } =
    useCart();
  const handledSuccessRef = useRef(false);
  const serializedItems = JSON.stringify(
    items.map((item) => ({
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      notes: item.notes,
      portionSize: item.portionSize,
    })),
  );
  const effectiveFulfillmentType = hasDeliveryCoverage
    ? selectedFulfillmentType
    : "pickup";
  const effectiveDeliveryNeighborhood =
    restaurantInfo.delivery.neighborhoods.some(
      (item) => item.slug === selectedDeliveryNeighborhood,
    )
      ? selectedDeliveryNeighborhood
      : restaurantInfo.delivery.neighborhoods[0]?.slug ?? "";
  const selectedNeighborhoodConfig =
    restaurantInfo.delivery.neighborhoods.find(
      (item) => item.slug === effectiveDeliveryNeighborhood,
    ) ?? restaurantInfo.delivery.neighborhoods[0];
  const checkoutDeliveryFee =
    effectiveFulfillmentType === "delivery"
      ? selectedNeighborhoodConfig?.fee ?? 0
      : 0;
  const checkoutEtaMinutes =
    effectiveFulfillmentType === "delivery"
      ? selectedNeighborhoodConfig?.etaMinutes ?? 0
      : restaurantInfo.delivery.pickupEtaMinutes;
  const checkoutGrandTotal = totalPrice + checkoutDeliveryFee;

  useEffect(() => {
    if (state.status === "success" && !handledSuccessRef.current) {
      handledSuccessRef.current = true;
      clearCart();
      router.refresh();
    }
  }, [clearCart, router, state.status]);

  if (!isHydrated) {
    return (
      <div className="grid gap-5 lg:grid-cols-[1.02fr_0.98fr]">
        <section className="luxury-card rounded-[2.2rem] p-6">
          <div className="h-8 w-40 rounded-full bg-[rgba(20,35,29,0.08)]" />
          <div className="mt-5 h-24 rounded-[1.8rem] bg-[rgba(20,35,29,0.06)]" />
          <div className="mt-4 h-24 rounded-[1.8rem] bg-[rgba(20,35,29,0.06)]" />
        </section>
        <section className="luxury-card rounded-[2.2rem] p-6">
          <div className="h-8 w-48 rounded-full bg-[rgba(20,35,29,0.08)]" />
          <div className="mt-5 h-40 rounded-[1.8rem] bg-[rgba(20,35,29,0.06)]" />
        </section>
      </div>
    );
  }

  if (!items.length && state.status !== "success") {
    return (
      <section className="luxury-card rounded-[2.3rem] p-6 md:p-8">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-[rgba(182,135,66,0.12)] p-3 text-[var(--gold)]">
            <ShoppingBag size={20} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--gold)]">
              Carrinho vazio
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-[var(--forest)]">
              Adicione itens do cardapio para iniciar o pedido
            </h2>
          </div>
        </div>

        <p className="mt-5 max-w-2xl text-sm leading-7 text-[rgba(21,35,29,0.72)]">
          Assim que voce selecionar pratos no cardapio, eles aparecem aqui para
          revisao, escolha de entrega ou retirada, pagamento e envio para a equipe.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/cardapio" className="button-primary w-full justify-center sm:w-auto">
            Voltar ao cardapio
          </Link>
          <Link href="/pedidos" className="button-secondary w-full justify-center sm:w-auto">
            Ver pedidos
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.02fr_0.98fr]">
      <section className="luxury-card rounded-[2.3rem] p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--gold)]">
              Revisao do pedido
            </p>
            <h2 className="page-panel-title mt-3 font-semibold text-[var(--forest)]">
              {state.status === "success"
                ? "Pedido enviado com sucesso"
                : `Carrinho de ${customerName}`}
            </h2>
          </div>
          <div className="rounded-full border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.7)] px-4 py-2 text-sm font-semibold text-[var(--forest)]">
            {itemCount} item(ns)
          </div>
        </div>

        {state.status === "success" ? (
          <div className="mt-8 rounded-[2rem] border border-[rgba(95,123,109,0.18)] bg-[rgba(95,123,109,0.08)] p-6">
            <div className="flex items-center gap-3 text-[var(--forest)]">
              <CheckCircle2 size={22} />
              <p className="text-lg font-semibold">Pedido confirmado no sistema</p>
            </div>
            <p className="mt-4 text-sm leading-7 text-[rgba(21,35,29,0.74)]">
              {state.message}
            </p>
            {state.checkoutReference ? (
              <p className="mt-3 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--sage)]">
                Referencia do pedido: {state.checkoutReference}
              </p>
            ) : null}
            <p className="mt-3 text-sm leading-7 text-[rgba(21,35,29,0.74)]">
              {state.fulfillmentType === "delivery"
                ? `Entrega estimada em ate ${state.deliveryEtaMinutes} minutos.`
                : "A equipe vai preparar o pedido e liberar a retirada assim que tudo estiver pronto."}
            </p>
            {state.grandTotal ? (
              <p className="mt-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--sage)]">
                Total final: {formatCurrency(state.grandTotal)}
              </p>
            ) : null}

            {state.checkoutReference ? (
              <div className="mt-6 rounded-[1.6rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.72)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sage)]">
                  Acompanhamento ao vivo
                </p>
                <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.74)]">
                  Deseja acompanhar este pedido em tempo real e ver cada etapa
                  (recebido, em preparo, pronto e finalizado)?
                </p>
                {!hideRealtimeQuestion ? (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      href={`/pedidos?checkout=${encodeURIComponent(state.checkoutReference)}`}
                      className="button-primary w-full justify-center sm:w-auto"
                    >
                      Sim, acompanhar ao vivo
                    </Link>
                    <button
                      type="button"
                      onClick={() => setHideRealtimeQuestion(true)}
                      className="button-secondary w-full justify-center sm:w-auto"
                    >
                      Agora nao
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <p className="text-sm leading-6 text-[rgba(21,35,29,0.7)]">
                      Quando quiser, voce pode abrir a aba de pedidos e ver o
                      andamento ao vivo.
                    </p>
                    <Link
                      href={`/pedidos?checkout=${encodeURIComponent(state.checkoutReference)}`}
                      className="inline-flex items-center rounded-full border border-[rgba(20,35,29,0.12)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--forest)] transition hover:-translate-y-0.5"
                    >
                      Ver em tempo real
                    </Link>
                  </div>
                )}
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/pedidos" className="button-primary w-full justify-center sm:w-auto">
                Abrir pedidos
              </Link>
              <Link href="/cardapio" className="button-secondary w-full justify-center sm:w-auto">
                Pedir novamente
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {items.map((item) => (
              (() => {
                const stockInfo = getItemStockInfo(item.menuItemId);
                const isStockControlled = stockInfo.hasStockControl;
                const stockLimit = isStockControlled
                  ? Number(stockInfo.stockQuantity ?? 0)
                  : null;
                const totalItemQuantityInCart = Number(stockInfo.totalInCart ?? 0);
                const reachedStockLimit =
                  isStockControlled && totalItemQuantityInCart >= stockLimit;

                return (
              <article
                key={item.lineId}
                className="rounded-[1.9rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.62)] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-semibold text-[var(--forest)] sm:text-2xl">
                        {item.name}
                      </h3>
                      {item.signature ? (
                        <span className="rounded-full bg-[rgba(182,135,66,0.14)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--gold)]">
                          assinatura
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.68)]">
                      Preparo medio: {item.prepTime || "sob consulta"}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[rgba(21,35,29,0.68)]">
                      Porcao:{" "}
                      {item.portionSize === "small"
                        ? "Pequena"
                        : item.portionSize === "large"
                          ? "Grande"
                          : "Media"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm uppercase tracking-[0.18em] text-[var(--sage)]">
                      subtotal
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--forest)]">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center rounded-full border border-[rgba(20,35,29,0.08)] bg-white/70 p-1">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.lineId, item.quantity - 1)}
                      className="rounded-full p-2 text-[var(--forest)] transition hover:bg-[rgba(20,35,29,0.06)]"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="min-w-12 px-3 text-center text-sm font-semibold text-[var(--forest)]">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.lineId, item.quantity + 1)}
                      disabled={reachedStockLimit}
                      className="rounded-full p-2 text-[var(--forest)] transition hover:bg-[rgba(20,35,29,0.06)]"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.lineId)}
                    className="inline-flex items-center gap-2 rounded-full border border-[rgba(138,93,59,0.18)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--clay)] transition hover:-translate-y-0.5"
                  >
                    <Trash2 size={14} />
                    Remover
                  </button>
                </div>

                {isStockControlled ? (
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(21,35,29,0.64)]">
                    Limite atual: {stockLimit} unidade(s). Restante no carrinho:{" "}
                    {Math.max(0, Number(stockInfo.remaining ?? 0))}.
                  </p>
                ) : null}

                {reachedStockLimit ? (
                  <p className="mt-2 text-sm leading-6 text-[var(--clay)]">
                    Limite de estoque atingido para este prato. Reposicao necessaria para aumentar o pedido.
                  </p>
                ) : null}

                <label className="mt-5 grid gap-2 text-sm font-medium text-[var(--forest)]">
                  Observacao para a equipe
                  <input
                    value={item.notes}
                    onChange={(event) =>
                      updateNotes(item.lineId, event.target.value)
                    }
                    maxLength={300}
                    placeholder="Ex.: sem cebola, ponto da carne para menos..."
                    className="rounded-2xl border border-[rgba(20,35,29,0.12)] bg-white px-4 py-3 outline-none transition focus:border-[var(--gold)]"
                  />
                </label>
              </article>
                );
              })()
            ))}
          </div>
        )}
      </section>

      <section className="luxury-card-dark rounded-[2.3rem] p-6 text-[var(--cream)] md:p-8">
        <p className="text-xs uppercase tracking-[0.28em] text-[rgba(217,185,122,0.92)]">
          Checkout
        </p>
        <h2 className="display-title page-section-title mt-4 text-white">
          Fechar pedido e enviar para a equipe
        </h2>
        <p className="mt-4 text-sm leading-7 text-[rgba(255,247,232,0.76)]">
          Revise os itens, escolha a forma de pagamento e finalize. A equipe
          recebe o pedido no painel operacional sem precisar atualizar a pagina.
        </p>

        <div className="mt-8 rounded-[1.9rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] p-5">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm uppercase tracking-[0.2em] text-[rgba(217,185,122,0.84)]">
              Subtotal dos itens
            </span>
            <span className="text-3xl font-semibold text-white">
              {formatCurrency(totalPrice)}
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-[rgba(255,247,232,0.72)]">
            {itemCount} item(ns) selecionado(s) para este fechamento.
          </p>
          <div className="mt-4 grid gap-3 rounded-[1.5rem] border border-[rgba(217,185,122,0.14)] bg-[rgba(255,255,255,0.03)] px-4 py-4 text-sm text-[rgba(255,247,232,0.76)]">
            <div className="flex items-center justify-between gap-4">
              <span>{getFulfillmentTypeLabel(effectiveFulfillmentType)}</span>
              <span>
                {effectiveFulfillmentType === "delivery"
                  ? formatCurrency(checkoutDeliveryFee)
                  : "sem taxa"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 font-semibold text-white">
              <span>Total final</span>
              <span>{formatCurrency(checkoutGrandTotal)}</span>
            </div>
          </div>
        </div>

        {state.status !== "success" ? (
          <form action={formAction} className="mt-8 space-y-5">
            <input type="hidden" name="cartPayload" value={serializedItems} />
            <input type="hidden" name="fulfillmentType" value={effectiveFulfillmentType} />

            <fieldset className="grid gap-3">
              <legend className="text-sm font-semibold uppercase tracking-[0.2em] text-[rgba(217,185,122,0.84)]">
                Tipo de atendimento
              </legend>

              <div className="grid gap-3 sm:grid-cols-2">
                {fulfillmentTypeOptions.map((option) => {
                  const Icon = fulfillmentIcons[option.value] ?? PackageCheck;
                  const isDisabled =
                    option.value === "delivery" && !hasDeliveryCoverage;

                  return (
                    <label
                      key={option.value}
                      className={cn(
                        "flex items-start gap-3 rounded-[1.6rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] px-4 py-4 transition",
                        isDisabled
                          ? "cursor-not-allowed opacity-55"
                          : "cursor-pointer hover:border-[rgba(217,185,122,0.34)]",
                      )}
                    >
                      <input
                        type="radio"
                        name="fulfillmentTypeVisible"
                        value={option.value}
                        checked={effectiveFulfillmentType === option.value}
                        onChange={() => setSelectedFulfillmentType(option.value)}
                        disabled={isDisabled}
                        className="mt-1 h-4 w-4 accent-[var(--gold-soft)]"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-white">
                          <Icon size={16} className="text-[var(--gold-soft)]" />
                          <span className="text-sm font-semibold">{option.label}</span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[rgba(255,247,232,0.68)]">
                          {option.value === "delivery"
                            ? hasDeliveryCoverage
                              ? "Envio para o endereco do cliente com taxa e previsao de chegada."
                              : "Delivery pausado no momento. A equipe ainda pode receber retiradas."
                            : "Pedido pronto para retirada na casa, sem taxa adicional."}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {effectiveFulfillmentType === "delivery" ? (
              <div className="grid gap-4">
                <div className="rounded-[1.7rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] p-5">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-1 text-[var(--gold-soft)]" size={18} />
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[rgba(217,185,122,0.84)]">
                        Entrega profissional
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[rgba(255,247,232,0.72)]">
                        {restaurantInfo.delivery.coverageNote}
                      </p>
                    </div>
                  </div>
                </div>

                <label className="grid gap-2 text-sm font-medium text-white">
                  Bairro atendido
                  <select
                    name="deliveryNeighborhood"
                    value={effectiveDeliveryNeighborhood}
                    onChange={(event) => setSelectedDeliveryNeighborhood(event.target.value)}
                    autoComplete="address-level2"
                    className="rounded-2xl border border-[rgba(217,185,122,0.18)] bg-[rgba(255,255,255,0.08)] px-4 py-3 text-[var(--cream)] outline-none transition focus:border-[var(--gold-soft)]"
                  >
                    {restaurantInfo.delivery.neighborhoods.map((neighborhood) => (
                      <option
                        key={neighborhood.slug}
                        value={neighborhood.slug}
                        className="text-[var(--forest)]"
                      >
                        {neighborhood.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm font-medium text-white">
                  Endereco completo
                  <input
                    name="deliveryAddress"
                    required
                    autoComplete="street-address"
                    maxLength={180}
                    placeholder="Rua, numero, complemento"
                    className="rounded-2xl border border-[rgba(217,185,122,0.18)] bg-[rgba(255,255,255,0.08)] px-4 py-3 text-[var(--cream)] outline-none transition placeholder:text-[rgba(255,247,232,0.44)] focus:border-[var(--gold-soft)]"
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-white">
                  Referencia de entrega
                  <input
                    name="deliveryReference"
                    autoComplete="address-line2"
                    maxLength={180}
                    placeholder="Portaria, bloco, ponto de referencia"
                    className="rounded-2xl border border-[rgba(217,185,122,0.18)] bg-[rgba(255,255,255,0.08)] px-4 py-3 text-[var(--cream)] outline-none transition placeholder:text-[rgba(255,247,232,0.44)] focus:border-[var(--gold-soft)]"
                  />
                </label>

                <div className="rounded-[1.7rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] p-5 text-sm text-[rgba(255,247,232,0.74)]">
                  <div className="flex items-center justify-between gap-4">
                    <span>Taxa de entrega</span>
                    <span className="font-semibold text-white">
                      {formatCurrency(checkoutDeliveryFee)}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-4">
                    <span>Previsao</span>
                    <span className="font-semibold text-white">
                      {checkoutEtaMinutes} min
                    </span>
                  </div>
                  <p className="mt-3 leading-6">{selectedNeighborhoodConfig?.window}</p>
                  <p className="mt-2 leading-6">
                    Pedido minimo para delivery:{" "}
                    <span className="font-semibold text-white">
                      {formatCurrency(restaurantInfo.delivery.minimumOrder)}
                    </span>
                    .
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-[1.7rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] p-5 text-sm text-[rgba(255,247,232,0.74)]">
                <div className="flex items-start gap-3">
                  <PackageCheck className="mt-1 text-[var(--gold-soft)]" size={18} />
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[rgba(217,185,122,0.84)]">
                      Retirada organizada
                    </p>
                    <p className="mt-2 leading-6">
                      O pedido fica disponivel para retirada em aproximadamente{" "}
                      <span className="font-semibold text-white">
                        {restaurantInfo.delivery.pickupEtaMinutes} minutos
                      </span>
                      , no endereco {restaurantInfo.address}, {restaurantInfo.city}.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <fieldset className="grid gap-3">
              <legend className="text-sm font-semibold uppercase tracking-[0.2em] text-[rgba(217,185,122,0.84)]">
                Forma de pagamento
              </legend>

              {paymentMethodOptions.map((option) => {
                const Icon = paymentIcons[option.value] ?? CreditCard;

                return (
                  <label
                    key={option.value}
                    className="flex cursor-pointer flex-col items-start gap-4 rounded-[1.6rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] px-4 py-4 transition hover:border-[rgba(217,185,122,0.34)] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-[rgba(217,185,122,0.12)] p-2 text-[var(--gold-soft)]">
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{option.label}</p>
                        <p className="text-xs uppercase tracking-[0.16em] text-[rgba(255,247,232,0.58)]">
                          {option.value === "pix"
                            ? "confirmacao imediata"
                            : option.value === "cash"
                              ? "pagar na retirada"
                              : "finalizacao no atendimento"}
                        </p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={option.value}
                      checked={selectedPaymentMethod === option.value}
                      onChange={() => setSelectedPaymentMethod(option.value)}
                      className="h-4 w-4 accent-[var(--gold-soft)]"
                    />
                  </label>
                );
              })}
            </fieldset>

            <SubmitButton
              idleLabel="Finalizar pedido"
              pendingLabel="Enviando pedido..."
              className="w-full justify-center"
            />

            {state.status === "error" ? (
              <div
                className={cn(
                  "rounded-[1.4rem] border px-4 py-3 text-sm leading-6",
                  "border-[rgba(138,93,59,0.24)] bg-[rgba(138,93,59,0.08)] text-[rgba(255,228,214,0.9)]",
                )}
              >
                {state.message}
              </div>
            ) : null}

                <p className="text-sm leading-6 text-[rgba(255,247,232,0.68)]">
              O pedido sera finalizado como{" "}
              <span className="font-semibold text-white">
                {getFulfillmentTypeLabel(effectiveFulfillmentType)}
              </span>{" "}
              com pagamento em{" "}
              <span className="font-semibold text-white">
                {getPaymentMethodLabel(selectedPaymentMethod)}
              </span>
              .
            </p>
          </form>
        ) : (
          <div className="mt-8 rounded-[1.8rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] p-5">
            <p className="text-sm leading-7 text-[rgba(255,247,232,0.74)]">
              O carrinho foi encerrado. Agora voce pode acompanhar o andamento
              na sua area de cliente ou voltar ao cardapio para um novo pedido.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
