"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { useCart } from "@/components/cart-provider";
import { cn, formatCurrency } from "@/lib/utils";

export function CartHeaderLink({ className, compact = false }) {
  const { itemCount, totalPrice } = useCart();

  return (
    <Link
      href="/carrinho"
      className={cn(
        compact
          ? "inline-flex items-center gap-2 rounded-full border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.46)] px-4 py-2.5 text-sm font-semibold text-[rgba(21,35,29,0.78)] shadow-[0_10px_18px_rgba(39,30,18,0.05)]"
          : "floating-badge inline-flex items-center gap-3 rounded-full px-4 py-2 text-sm font-semibold text-[var(--forest)]",
        className,
      )}
    >
      <ShoppingBag size={16} />
      <span>{compact ? "Carrinho" : "Meu carrinho"}</span>
      <span className="rounded-full bg-[var(--forest)] px-2.5 py-1 text-[11px] font-semibold text-[var(--cream)]">
        {itemCount}
      </span>
      {!compact ? (
        <span className="hidden text-xs text-[rgba(21,35,29,0.68)] md:inline">
          {formatCurrency(totalPrice)}
        </span>
      ) : null}
    </Link>
  );
}
