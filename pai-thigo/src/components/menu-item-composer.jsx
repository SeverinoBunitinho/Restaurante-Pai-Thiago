"use client";

import { useActionState, useState } from "react";

import { initialMenuItemState } from "@/app/operacao/menu/action-state";
import { createMenuItemAction } from "@/app/operacao/actions";
import { MenuCategoryComposer } from "@/components/menu-category-composer";
import { SubmitButton } from "@/components/submit-button";
import { cn } from "@/lib/utils";

export function MenuItemComposer({ categories = [] }) {
  const [state, formAction] = useActionState(
    createMenuItemAction,
    initialMenuItemState,
  );
  const [isCategoryComposerOpen, setIsCategoryComposerOpen] = useState(false);

  if (!categories.length) {
    return (
      <div className="grid gap-4">
        <div className="rounded-[1.6rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.56)] p-6 text-sm leading-7 text-[rgba(21,35,29,0.7)]">
          Nenhuma categoria foi encontrada no sistema. Cadastre ou recupere as
          categorias do cardapio para liberar o cadastro de novos pratos.
        </div>

        <div className="rounded-[1.6rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.7)] p-4">
          <button
            type="button"
            onClick={() => setIsCategoryComposerOpen((current) => !current)}
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(182,135,66,0.24)] bg-[rgba(182,135,66,0.08)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--gold)] transition hover:-translate-y-0.5"
          >
            {isCategoryComposerOpen ? "Fechar cadastro" : "Adicionar categoria"}
          </button>

          {isCategoryComposerOpen ? (
            <div className="mt-4 rounded-[1.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.66)] p-4">
              <MenuCategoryComposer />
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-[1.6rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.64)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sage)]">
            Categoria do prato
          </p>
          <button
            type="button"
            onClick={() => setIsCategoryComposerOpen((current) => !current)}
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(182,135,66,0.24)] bg-[rgba(182,135,66,0.08)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--gold)] transition hover:-translate-y-0.5"
          >
            {isCategoryComposerOpen ? "Fechar cadastro" : "Adicionar categoria"}
          </button>
        </div>

        {isCategoryComposerOpen ? (
          <div className="mt-4 rounded-[1.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.66)] p-4">
            <MenuCategoryComposer />
          </div>
        ) : null}
      </div>

      <form action={formAction} encType="multipart/form-data" className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid min-w-0 gap-2 text-sm font-medium text-[var(--forest)]">
            Categoria
            <select
              name="categoryId"
              required
              defaultValue={categories[0]?.id ?? ""}
              className="w-full min-w-0 rounded-[1.4rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid min-w-0 gap-2 text-sm font-medium text-[var(--forest)]">
            Nome do prato
            <input
              name="name"
              required
              placeholder="Ex.: Ravioli de cordeiro"
              className="w-full min-w-0 rounded-[1.4rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
            />
          </label>
        </div>

        <label className="grid min-w-0 gap-2 text-sm font-medium text-[var(--forest)]">
          Descricao
          <textarea
            name="description"
            rows={4}
            required
            placeholder="Descreva composicao, tecnica e acabamento do prato."
            className="w-full min-w-0 rounded-[1.6rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
          />
        </label>

        <label className="grid min-w-0 gap-2 text-sm font-medium text-[var(--forest)]">
          Imagem do prato (URL)
          <input
            name="imageUrl"
            placeholder="https://... ou /images/seu-prato.jpg"
            className="w-full min-w-0 rounded-[1.4rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
          />
        </label>

        <label className="grid min-w-0 gap-2 text-sm font-medium text-[var(--forest)]">
          Imagem do prato (arquivo do computador)
          <input
            name="imageFile"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="w-full min-w-0 cursor-pointer rounded-[1.4rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 text-sm text-[var(--forest)] file:mr-3 file:rounded-full file:border-0 file:bg-[rgba(20,35,29,0.9)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:uppercase file:tracking-[0.12em] file:text-[var(--cream)]"
          />
          <span className="text-xs leading-5 text-[rgba(21,35,29,0.66)]">
            Formatos: JPG, PNG, WEBP ou AVIF (maximo de 5 MB). Se enviar arquivo e URL, o arquivo sera usado.
          </span>
        </label>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <label className="grid min-w-0 gap-2 text-[0.82rem] font-medium text-[var(--forest)] sm:text-sm">
          Preco
          <input
            name="price"
            type="number"
            min="0"
            step="0.01"
            required
            placeholder="79.90"
            className="w-full min-w-0 rounded-[1.4rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
          />
        </label>

        <label className="grid min-w-0 gap-2 text-[0.82rem] font-medium text-[var(--forest)] sm:text-sm">
          Tempo de preparo
          <input
            name="prepTime"
            placeholder="18 min"
            className="w-full min-w-0 rounded-[1.4rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
          />
        </label>

        <label className="grid min-w-0 gap-2 text-[0.82rem] font-medium text-[var(--forest)] sm:text-sm">
          Intensidade
          <input
            name="spiceLevel"
            placeholder="suave"
            className="w-full min-w-0 rounded-[1.4rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
          />
        </label>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <label className="grid min-w-0 gap-2 text-[0.82rem] font-medium text-[var(--forest)] sm:text-sm">
          Estoque (opcional)
          <input
            name="stockQuantity"
            type="number"
            min="0"
            placeholder="12"
            className="w-full min-w-0 rounded-[1.4rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
          />
        </label>

        <label className="grid min-w-0 gap-2 text-[0.82rem] font-medium text-[var(--forest)] sm:text-sm">
          Alerta de estoque
          <input
            name="lowStockThreshold"
            type="number"
            min="0"
            defaultValue="0"
            className="w-full min-w-0 rounded-[1.4rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
          />
        </label>

        <label className="grid min-w-0 gap-2 text-[0.82rem] font-medium text-[var(--forest)] sm:text-sm">
          Porcao pequena
          <input
            name="portionSmallPrice"
            type="number"
            min="0"
            step="0.01"
            placeholder="10.90"
            className="w-full min-w-0 rounded-[1.4rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
          />
        </label>

        <label className="grid min-w-0 gap-2 text-[0.82rem] font-medium text-[var(--forest)] sm:text-sm">
          Porcao media
          <input
            name="portionMediumPrice"
            type="number"
            min="0"
            step="0.01"
            placeholder="Preco base"
            className="w-full min-w-0 rounded-[1.4rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
          />
        </label>

        <label className="grid min-w-0 gap-2 text-[0.82rem] font-medium text-[var(--forest)] sm:text-sm">
          Porcao grande
          <input
            name="portionLargePrice"
            type="number"
            min="0"
            step="0.01"
            placeholder="15.90"
            className="w-full min-w-0 rounded-[1.4rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
          />
        </label>
        </div>

        <label className="grid min-w-0 gap-2 text-sm font-medium text-[var(--forest)]">
          Tags
          <input
            name="tags"
            placeholder="brasa, assinatura, compartilhar"
            className="w-full min-w-0 rounded-[1.4rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
          />
        </label>

        <label className="grid min-w-0 gap-2 text-sm font-medium text-[var(--forest)]">
          Alergenicos
          <input
            name="allergens"
            placeholder="gluten, lacteos, crustaceos"
            className="w-full min-w-0 rounded-[1.4rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
          />
        </label>

        <div className="flex flex-wrap gap-3">
        <label className="inline-flex items-center gap-3 rounded-full border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.72)] px-4 py-3 text-sm font-medium text-[var(--forest)]">
          <input type="checkbox" name="isSignature" className="accent-[var(--gold)]" />
          Prato assinatura
        </label>
        <label className="inline-flex items-center gap-3 rounded-full border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.72)] px-4 py-3 text-sm font-medium text-[var(--forest)]">
          <input
            type="checkbox"
            name="isAvailable"
            defaultChecked
            className="accent-[var(--gold)]"
          />
          Entrar ativo no cardapio
        </label>
        </div>

        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <SubmitButton
            idleLabel="Adicionar prato"
            pendingLabel="Salvando prato..."
            className="xl:w-auto"
          />
          <p className="max-w-xl text-sm leading-6 text-[rgba(21,35,29,0.68)]">
            O prato entra no Supabase e aparece no cardapio do cliente sem
            precisar atualizar manualmente a pagina.
          </p>
        </div>

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
    </div>
  );
}
