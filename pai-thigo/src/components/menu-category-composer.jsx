"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { createMenuCategoryAction } from "@/app/operacao/actions";
import { SubmitButton } from "@/components/submit-button";
import { cn } from "@/lib/utils";

const initialCategoryState = {
  status: "idle",
  message: "",
};

const accentOptions = [
  { value: "gold", label: "Dourado" },
  { value: "sage", label: "Verde" },
  { value: "clay", label: "Terracota" },
  { value: "cream", label: "Creme" },
];

export function MenuCategoryComposer({ onSuccess }) {
  const [state, formAction] = useActionState(
    createMenuCategoryAction,
    initialCategoryState,
  );
  const router = useRouter();

  useEffect(() => {
    if (state.status !== "success") {
      return undefined;
    }

    const timer = setTimeout(() => {
      if (typeof onSuccess === "function") {
        onSuccess();
      }
      router.refresh();
    }, 280);

    return () => clearTimeout(timer);
  }, [onSuccess, router, state.status]);

  return (
    <form action={formAction} className="grid gap-4">
      <label className="grid gap-2">
        <span className="text-sm font-semibold text-[var(--forest)]">
          Nome da categoria
        </span>
        <input
          name="name"
          type="text"
          required
          maxLength={80}
          placeholder="Ex.: Massas artesanais"
          className="rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-[var(--forest)]">
          Descricao
        </span>
        <textarea
          name="description"
          rows={3}
          maxLength={220}
          placeholder="Resumo rapido da proposta desta categoria."
          className="rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-[var(--forest)]">
          Tom visual
        </span>
        <select
          name="accent"
          defaultValue="gold"
          className="rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none"
        >
          {accentOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <SubmitButton
        idleLabel="Adicionar categoria"
        pendingLabel="Salvando categoria..."
        className="mt-1 w-full justify-center"
      />

      {state.status !== "idle" ? (
        <div
          className={cn(
            "rounded-[1.4rem] border px-4 py-3 text-sm leading-6",
            state.status === "success"
              ? "border-[rgba(95,123,109,0.22)] bg-[rgba(95,123,109,0.08)] text-[var(--forest)]"
              : "border-[rgba(138,93,59,0.22)] bg-[rgba(138,93,59,0.08)] text-[var(--clay)]",
          )}
        >
          {state.message}
        </div>
      ) : null}
    </form>
  );
}
