"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, ShoppingBag } from "lucide-react";

import { useCart } from "@/components/cart-provider";
import { cn } from "@/lib/utils";

export function MenuOrderForm({
  menuItemId,
  name,
  price,
  portionPrices,
  prepTime,
  signature = false,
  canOrder = true,
  stockQuantity = null,
  lowStockThreshold = 0,
}) {
  const [quantity, setQuantity] = useState("1");
  const [portionSize, setPortionSize] = useState("medium");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("idle");
  const { addItem, getItemQuantity } = useCart();
  const currentQuantity = getItemQuantity(menuItemId);
  const hasPortionOptions = Boolean(
    portionPrices &&
      typeof portionPrices === "object" &&
      ["small", "medium", "large"].some((size) =>
        Number.isFinite(Number(portionPrices[size] ?? NaN)),
      ),
  );
  const pricing = hasPortionOptions
    ? {
        small: Number(portionPrices?.small ?? price * 0.8),
        medium: Number(portionPrices?.medium ?? price),
        large: Number(portionPrices?.large ?? price * 1.35),
      }
    : {
        medium: Number(price),
      };
  const selectedUnitPrice = hasPortionOptions
    ? pricing[portionSize] ?? pricing.medium
    : pricing.medium;
  const portionLabels = {
    small: "Pequena",
    medium: "Media",
    large: "Grande",
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

  if (!canOrder) {
    return (
      <div className="mt-5 rounded-[1.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.72)] px-4 py-3 text-sm leading-6 text-[rgba(21,35,29,0.66)]">
        O envio de pedidos pelo cardapio fica disponivel apenas para contas de
        cliente autenticadas.
      </div>
    );
  }

  function handleAddToCart() {
    if (hasStockControl && maxSelectableQuantity <= 0) {
      setStatus("stock-limit");
      return;
    }

    const requestedQuantity = Number(quantity);
    const safeRequestedQuantity = Number.isFinite(requestedQuantity)
      ? Math.max(1, Math.floor(requestedQuantity))
      : 1;
    const quantityToAdd = hasStockControl
      ? Math.min(safeRequestedQuantity, maxSelectableQuantity)
      : safeRequestedQuantity;
    const addResult = addItem({
      menuItemId,
      name,
      price: selectedUnitPrice,
      portionSize: hasPortionOptions ? portionSize : "medium",
      hasPortionOptions,
      prepTime,
      signature,
      quantity: quantityToAdd,
      notes,
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
          hasPortionOptions
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
              value={portionSize}
              onChange={(event) => setPortionSize(event.target.value)}
              className="w-full min-w-0 rounded-2xl border border-[rgba(20,35,29,0.12)] bg-white px-4 py-3 outline-none transition focus:border-[var(--gold)]"
            >
              <option value="small">
                Pequeno - {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(pricing.small)}
              </option>
              <option value="medium">
                Medio - {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(pricing.medium)}
              </option>
              <option value="large">
                Grande - {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(pricing.large)}
              </option>
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
            disabled={maxSelectableQuantity <= 0}
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
            ? `${portionLabels[portionSize]} selecionada por ${Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(selectedUnitPrice)}.`
            : `Preco unitario: ${Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(selectedUnitPrice)}.`}
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
