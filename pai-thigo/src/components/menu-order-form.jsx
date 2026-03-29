"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ShoppingBag } from "lucide-react";

import { useCart } from "@/components/cart-provider";
import { cn } from "@/lib/utils";

export function MenuOrderForm({
  menuItemId,
  name,
  price,
  portionPrices,
  flavorOptions = [],
  isDrinkItem = false,
  prepTime,
  signature = false,
  canOrder = true,
  isPriceAvailable = true,
  stockQuantity = null,
  lowStockThreshold = 0,
}) {
  const [quantity, setQuantity] = useState("1");
  const [portionSize, setPortionSize] = useState("medium");
  const [selectedFlavor, setSelectedFlavor] = useState(
    flavorOptions[0] ? String(flavorOptions[0]) : "",
  );
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("idle");
  const { addItem, getItemQuantity } = useCart();
  const currentQuantity = getItemQuantity(menuItemId);
  const normalizedPortionEntries = useMemo(
    () =>
      portionPrices && typeof portionPrices === "object"
        ? ["small", "medium", "large"]
            .map((size) => [size, Number(portionPrices[size] ?? NaN)])
            .filter(([, value]) => Number.isFinite(value) && value > 0)
        : [],
    [portionPrices],
  );
  const hasPortionOptions = normalizedPortionEntries.length > 0;
  const basePrice = Number(price ?? NaN);
  const hasBasePrice = Number.isFinite(basePrice) && basePrice > 0;
  const pricing = useMemo(
    () =>
      hasPortionOptions
        ? Object.fromEntries(normalizedPortionEntries)
        : hasBasePrice
          ? { medium: Number(basePrice.toFixed(2)) }
          : {},
    [basePrice, hasBasePrice, hasPortionOptions, normalizedPortionEntries],
  );
  const availablePortionSizes = useMemo(
    () =>
      hasPortionOptions
        ? ["small", "medium", "large"].filter((size) =>
            Number.isFinite(Number(pricing[size] ?? NaN)),
          )
        : ["medium"],
    [hasPortionOptions, pricing],
  );
  const selectedSize = availablePortionSizes.includes(portionSize)
    ? portionSize
    : availablePortionSizes[0] ?? "medium";
  const selectedUnitPrice = Number(pricing[selectedSize] ?? NaN);
  const hasValidPricing =
    Number.isFinite(selectedUnitPrice) && selectedUnitPrice > 0;
  const hasFlavorOptions = flavorOptions.length > 1;
  const portionLabels = {
    small: isDrinkItem ? "350ml" : "Pequena",
    medium: isDrinkItem ? "1L" : "Media",
    large: isDrinkItem ? "2L" : "Grande",
  };
  const hasStockControl =
    Number.isFinite(Number(stockQuantity)) && Number(stockQuantity) >= 0;
  const safeStockQuantity = hasStockControl ? Number(stockQuantity) : null;
  const safeLowStockThreshold =
    Number.isFinite(Number(lowStockThreshold)) && Number(lowStockThreshold) >= 0
      ? Number(lowStockThreshold)
      : 0;
  const remainingStockForAdd = hasStockControl
    ? Math.max(0, safeStockQuantity - currentQuantity)
    : null;
  const maxSelectableQuantity = hasStockControl
    ? Math.min(20, remainingStockForAdd)
    : 20;
  const isOutOfStock = hasStockControl && safeStockQuantity <= 0;
  const isLowStock =
    hasStockControl &&
    safeStockQuantity > 0 &&
    safeStockQuantity <= Math.max(0, safeLowStockThreshold);

  useEffect(() => {
    setSelectedFlavor(flavorOptions[0] ? String(flavorOptions[0]) : "");
  }, [flavorOptions]);

  useEffect(() => {
    if (!availablePortionSizes.length) {
      return;
    }

    if (!availablePortionSizes.includes(portionSize)) {
      setPortionSize(availablePortionSizes[0]);
    }
  }, [availablePortionSizes, portionSize]);

  useEffect(() => {
    if (maxSelectableQuantity <= 0) {
      return;
    }

    const numericQuantity = Number(quantity);

    if (!Number.isFinite(numericQuantity) || numericQuantity < 1) {
      setQuantity("1");
      return;
    }

    if (numericQuantity > maxSelectableQuantity) {
      setQuantity(String(maxSelectableQuantity));
    }
  }, [maxSelectableQuantity, quantity]);

  if (!isPriceAvailable) {
    return (
      <div className="mt-5 rounded-[1.4rem] border border-[rgba(138,93,59,0.2)] bg-[rgba(138,93,59,0.08)] px-4 py-3 text-sm leading-6 text-[var(--clay)]">
        Este item esta sem preco valido no momento. A equipe ja pode ajustar no
        cardapio interno.
      </div>
    );
  }

  if (!canOrder) {
    return (
      <div className="mt-5 rounded-[1.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.72)] px-4 py-3 text-sm leading-6 text-[rgba(21,35,29,0.66)]">
        O envio de pedidos pelo cardapio fica disponivel apenas para contas de
        cliente autenticadas.
      </div>
    );
  }

  function handleAddToCart() {
    if (!hasValidPricing) {
      setStatus("invalid-price");
      return;
    }

    if (hasStockControl && maxSelectableQuantity <= 0) {
      setStatus("stock-limit");
      return;
    }

    if (hasFlavorOptions && !selectedFlavor) {
      setStatus("missing-flavor");
      return;
    }

    const requestedQuantity = Number(quantity);
    const safeRequestedQuantity = Number.isFinite(requestedQuantity)
      ? Math.max(1, Math.floor(requestedQuantity))
      : 1;
    const quantityToAdd = hasStockControl
      ? Math.min(safeRequestedQuantity, maxSelectableQuantity)
      : safeRequestedQuantity;
    const normalizedNotes = String(notes ?? "").trim();
    const flavorNote = hasFlavorOptions ? `Sabor: ${selectedFlavor}` : "";
    const finalNotes = [flavorNote, normalizedNotes].filter(Boolean).join(" | ");

    const addResult = addItem({
      menuItemId,
      name,
      price: selectedUnitPrice,
      portionSize: hasPortionOptions ? selectedSize : "medium",
      variantKey: hasFlavorOptions ? selectedFlavor : "",
      hasPortionOptions,
      prepTime,
      signature,
      quantity: quantityToAdd,
      notes: finalNotes,
      stockQuantity: safeStockQuantity,
      lowStockThreshold: safeLowStockThreshold,
    });

    if (!addResult?.ok) {
      setStatus("stock-limit");
      return;
    }

    setQuantity("1");
    setNotes("");
    setStatus("success");
  }

  const quantityOptions = Array.from(
    { length: Math.max(0, maxSelectableQuantity) },
    (_, index) => index + 1,
  );

  return (
    <div
      className="mt-5 grid gap-4 rounded-[1.5rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.72)] p-4"
    >
      {hasStockControl ? (
        <div
          className={cn(
            "rounded-[1.3rem] border px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]",
            isOutOfStock
              ? "border-[rgba(138,93,59,0.22)] bg-[rgba(138,93,59,0.08)] text-[var(--clay)]"
              : isLowStock
                ? "border-[rgba(182,135,66,0.28)] bg-[rgba(182,135,66,0.08)] text-[var(--gold)]"
                : "border-[rgba(95,123,109,0.22)] bg-[rgba(95,123,109,0.08)] text-[var(--sage)]",
          )}
        >
          {isOutOfStock
            ? "Esgotado no momento. Reposicao em andamento."
            : `Disponivel agora: ${safeStockQuantity} prato(s). Limite para adicionar: ${remainingStockForAdd}.`}
        </div>
      ) : null}

      <div
        className={cn(
          "grid gap-4",
          hasPortionOptions && hasFlavorOptions
            ? "md:grid-cols-2 xl:grid-cols-[120px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,210px)]"
            : hasPortionOptions || hasFlavorOptions
              ? "md:grid-cols-[120px_minmax(0,1fr)_minmax(0,210px)]"
            : "md:grid-cols-[120px_minmax(0,1fr)]",
        )}
      >
        <label className="grid min-w-0 gap-2 text-sm font-medium text-[var(--forest)]">
          Quantidade
          <select
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            disabled={maxSelectableQuantity <= 0}
            className="w-full min-w-0 rounded-2xl border border-[rgba(20,35,29,0.12)] bg-white px-4 py-3 outline-none transition focus:border-[var(--gold)]"
          >
            {quantityOptions.length ? (
              quantityOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))
            ) : (
              <option value="0">0</option>
            )}
          </select>
        </label>

        {hasPortionOptions ? (
          <label className="grid min-w-0 gap-2 text-sm font-medium text-[var(--forest)]">
            Tamanho
            <select
              value={selectedSize}
              onChange={(event) => setPortionSize(event.target.value)}
              className="w-full min-w-0 rounded-2xl border border-[rgba(20,35,29,0.12)] bg-white px-4 py-3 outline-none transition focus:border-[var(--gold)]"
            >
              {availablePortionSizes.map((size) => (
                <option key={size} value={size}>
                  {portionLabels[size]} - {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(pricing[size])}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {hasFlavorOptions ? (
          <label className="grid min-w-0 gap-2 text-sm font-medium text-[var(--forest)]">
            Sabor da bebida
            <select
              value={selectedFlavor}
              onChange={(event) => setSelectedFlavor(event.target.value)}
              className="w-full min-w-0 rounded-2xl border border-[rgba(20,35,29,0.12)] bg-white px-4 py-3 outline-none transition focus:border-[var(--gold)]"
            >
              {flavorOptions.map((flavor) => (
                <option key={flavor} value={flavor}>
                  {flavor}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="grid min-w-0 gap-2 text-sm font-medium text-[var(--forest)]">
          Observacao para a equipe
          <input
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Ex.: sem pimenta, ponto da carne para menos..."
            className="w-full min-w-0 rounded-2xl border border-[rgba(20,35,29,0.12)] bg-white px-4 py-3 outline-none transition focus:border-[var(--gold)]"
          />
        </label>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={maxSelectableQuantity <= 0 || !hasValidPricing}
            className="button-primary justify-center sm:w-auto"
          >
            <ShoppingBag size={16} />
            Adicionar ao carrinho
          </button>
          <Link href="/carrinho" className="button-secondary justify-center sm:w-auto">
            Ir para o carrinho
          </Link>
        </div>
        <p className="max-w-md text-sm leading-6 text-[rgba(21,35,29,0.66)]">
          {hasPortionOptions
            ? `${portionLabels[selectedSize]} selecionada por ${Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(selectedUnitPrice)}${hasFlavorOptions && selectedFlavor ? ` | sabor: ${selectedFlavor}` : ""}.`
            : hasValidPricing
              ? `Preco unitario: ${Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(selectedUnitPrice)}.`
              : "Preco em ajuste. Este item fica indisponivel ate a equipe configurar um valor valido."}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sage)]">
          {currentQuantity
            ? `${currentQuantity} item(ns) deste prato no carrinho`
            : "Nenhum item deste prato no carrinho"}
        </p>
        {hasStockControl ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(21,35,29,0.62)]">
            {remainingStockForAdd > 0
              ? `${remainingStockForAdd} unidade(s) ainda disponivel(is)`
              : "Limite de estoque atingido no carrinho"}
          </p>
        ) : null}
      </div>

      {status !== "idle" ? (
        <div
          className={cn(
            "rounded-[1.4rem] border px-4 py-3 text-sm leading-6",
            status === "success"
              ? "border-[rgba(95,123,109,0.22)] bg-[rgba(95,123,109,0.08)] text-[var(--forest)]"
              : "border-[rgba(138,93,59,0.22)] bg-[rgba(138,93,59,0.08)] text-[var(--clay)]",
          )}
        >
          {status === "success" ? (
            <span className="inline-flex items-center gap-2 font-semibold">
              <CheckCircle2 size={16} />
              Item adicionado ao carrinho com sucesso.
            </span>
          ) : status === "missing-flavor" ? (
            <span className="font-semibold">
              Selecione um sabor para adicionar esta bebida ao carrinho.
            </span>
          ) : status === "invalid-price" ? (
            <span className="font-semibold">
              Este item esta sem preco valido. Aguarde a equipe atualizar o cardapio.
            </span>
          ) : (
            <span className="font-semibold">
              Limite de estoque atingido para este prato. Ajuste a quantidade ou aguarde reposicao.
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
}
