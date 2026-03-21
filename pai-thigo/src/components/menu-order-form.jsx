"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, ShoppingBag } from "lucide-react";

import { useCart } from "@/components/cart-provider";
import { cn } from "@/lib/utils";

export function MenuOrderForm({
  menuItemId,
  name,
  price,
  prepTime,
  signature = false,
  canOrder = true,
}) {
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("idle");
  const { addItem, getItemQuantity } = useCart();
  const currentQuantity = getItemQuantity(menuItemId);

  if (!canOrder) {
    return (
      <div className="mt-5 rounded-[1.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.72)] px-4 py-3 text-sm leading-6 text-[rgba(21,35,29,0.66)]">
        O envio de pedidos pelo cardapio fica disponivel apenas para contas de
        cliente autenticadas.
      </div>
    );
  }

  function handleAddToCart() {
    addItem({
      menuItemId,
      name,
      price,
      prepTime,
      signature,
      quantity: Number(quantity),
      notes,
    });

    setQuantity("1");
    setNotes("");
    setStatus("success");
  }

  return (
    <div
      className="mt-5 grid gap-4 rounded-[1.5rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.72)] p-4"
    >
      <div className="grid gap-4 md:grid-cols-[132px_1fr]">
        <label className="grid gap-2 text-sm font-medium text-[var(--forest)]">
          Quantidade
          <select
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className="rounded-2xl border border-[rgba(20,35,29,0.12)] bg-white px-4 py-3 outline-none transition focus:border-[var(--gold)]"
          >
            {[1, 2, 3, 4, 5, 6].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium text-[var(--forest)]">
          Observacao para a equipe
          <input
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Ex.: sem pimenta, ponto da carne para menos..."
            className="rounded-2xl border border-[rgba(20,35,29,0.12)] bg-white px-4 py-3 outline-none transition focus:border-[var(--gold)]"
          />
        </label>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleAddToCart}
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
          Monte o pedido no carrinho e finalize o pagamento em um unico checkout.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sage)]">
          {currentQuantity
            ? `${currentQuantity} item(ns) deste prato no carrinho`
            : "Nenhum item deste prato no carrinho"}
        </p>
      </div>

      {status !== "idle" ? (
        <div
          className={cn(
            "rounded-[1.4rem] border px-4 py-3 text-sm leading-6",
            "border-[rgba(95,123,109,0.22)] bg-[rgba(95,123,109,0.08)] text-[var(--forest)]",
          )}
        >
          <span className="inline-flex items-center gap-2 font-semibold">
            <CheckCircle2 size={16} />
            Item adicionado ao carrinho com sucesso.
          </span>
        </div>
      ) : null}
    </div>
  );
}
