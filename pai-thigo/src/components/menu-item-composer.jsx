"use client";

import { useActionState, useState } from "react";

import { initialMenuItemState } from "@/app/operacao/menu/action-state";
import { createMenuItemAction } from "@/app/operacao/actions";
import { MenuCategoryComposer } from "@/components/menu-category-composer";
import { SubmitButton } from "@/components/submit-button";
import { cn } from "@/lib/utils";

const flavorPresetOptions = {
  none: {
    label: "Sem sabores adicionais",
    options: [],
    helper: "Use para prato comum ou bebida com sabor unico.",
  },
  juices: {
    label: "Lista completa de sucos",
    options: [
      "Laranja",
      "Limao",
      "Abacaxi",
      "Maracuja",
      "Acerola",
      "Goiaba",
      "Manga",
      "Melancia",
      "Melao",
      "Caju",
      "Uva",
      "Graviola",
      "Mangaba",
      "Seriguela",
      "Cupuacu",
      "Abacaxi com hortela",
      "Abacaxi com gengibre",
      "Abacaxi com limao",
      "Laranja com acerola",
      "Laranja com cenoura",
      "Laranja com lima",
      "Laranja com morango",
      "Maracuja com manga",
      "Manga com limao",
      "Acerola com laranja",
      "Detox (couve e limao)",
      "Acai com banana",
      "Vitamina de banana",
      "Vitamina de mamao",
      "Goiaba com leite",
    ],
    helper: "Aplicacao rapida para sucos com varios sabores.",
  },
  sodas: {
    label: "Refrigerantes (sabores comuns)",
    options: [
      "Cola",
      "Cola Zero",
      "Guarana",
      "Guarana Zero",
      "Laranja",
      "Uva",
      "Limao",
      "Tonica",
    ],
    helper: "Sugestao para itens como Fanta, Guarana e similares.",
  },
  custom: {
    label: "Personalizado",
    options: [],
    helper: "Informe manualmente os sabores separados por virgula.",
  },
};

export function MenuItemComposer({ categories = [] }) {
  const [state, formAction] = useActionState(
    createMenuItemAction,
    initialMenuItemState,
  );
  const [isCategoryComposerOpen, setIsCategoryComposerOpen] = useState(false);
  const [sizePreset, setSizePreset] = useState("default");
  const [flavorPreset, setFlavorPreset] = useState("none");
  const [flavorOptionsText, setFlavorOptionsText] = useState("");

  const sizePresetCopy = {
    default: {
      smallLabel: "Tamanho pequeno (opcional)",
      mediumLabel: "Tamanho medio (opcional)",
      largeLabel: "Tamanho grande (opcional)",
      smallPlaceholder: "Ex.: 10.90",
      mediumPlaceholder: "Ex.: 14.90",
      largePlaceholder: "Ex.: 18.90",
      helper: "Use para prato, lanche e porcoes da casa.",
    },
    drink: {
      smallLabel: "350 ml (opcional)",
      mediumLabel: "1000 ml / 1L (opcional)",
      largeLabel: "2000 ml / 2L (opcional)",
      smallPlaceholder: "Ex.: 6.90",
      mediumPlaceholder: "Ex.: 12.90",
      largePlaceholder: "Ex.: 19.90",
      helper: "Use para bebida em volume (350ml, 1L e 2L).",
    },
  };

  const selectedSizePresetCopy =
    sizePresetCopy[sizePreset] ?? sizePresetCopy.default;
  const isDrinkPreset = sizePreset === "drink";
  const selectedFlavorPreset =
    flavorPresetOptions[flavorPreset] ?? flavorPresetOptions.none;

  function handleFlavorPresetChange(nextPreset) {
    const normalizedPreset = flavorPresetOptions[nextPreset]
      ? nextPreset
      : "none";
    setFlavorPreset(normalizedPreset);

    if (normalizedPreset === "custom") {
      return;
    }

    const presetOptions = flavorPresetOptions[normalizedPreset].options;
    setFlavorOptionsText(presetOptions.join(", "));
  }

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
              <MenuCategoryComposer
                onSuccess={() => setIsCategoryComposerOpen(false)}
              />
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
            Categoria do item
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
            <MenuCategoryComposer
              onSuccess={() => setIsCategoryComposerOpen(false)}
            />
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
            Nome do item
            <input
              name="name"
              required
              placeholder="Ex.: Ravioli de cordeiro ou Soda italiana"
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
            placeholder="Descreva composicao, tecnica e acabamento do item."
            className="w-full min-w-0 rounded-[1.6rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
          />
        </label>

        <label className="grid min-w-0 gap-2 text-sm font-medium text-[var(--forest)]">
          Imagem do item (URL)
          <input
            name="imageUrl"
            placeholder="https://... ou /images/seu-item.jpg"
            className="w-full min-w-0 rounded-[1.4rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
          />
        </label>

        <label className="grid min-w-0 gap-2 text-sm font-medium text-[var(--forest)]">
          Imagem do item (arquivo do computador)
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

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <label className="grid min-w-0 gap-2 text-[0.82rem] font-medium text-[var(--forest)] sm:text-sm">
          {isDrinkPreset ? "Preco base (opcional)" : "Preco"}
          <input
            name="price"
            type="number"
            min="0.01"
            step="0.01"
            required={!isDrinkPreset}
            placeholder="79.90"
            className="w-full min-w-0 rounded-[1.4rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
          />
          {isDrinkPreset ? (
            <span className="text-xs leading-5 text-[rgba(21,35,29,0.66)]">
              Para bebida por ml/L, voce pode deixar o preco base em branco e
              informar apenas os tamanhos.
            </span>
          ) : null}
        </label>

        <label className="grid min-w-0 gap-2 text-[0.82rem] font-medium text-[var(--forest)] sm:text-sm">
          Tempo de preparo
          <input
            name="prepTime"
            placeholder="18 min"
            className="w-full min-w-0 rounded-[1.4rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
          />
        </label>
        </div>

        <label className="grid min-w-0 gap-2 text-sm font-medium text-[var(--forest)]">
          Modelo de tamanho
          <select
            value={sizePreset}
            onChange={(event) => {
              const nextPreset = event.target.value;
              setSizePreset(nextPreset);

              if (nextPreset !== "drink") {
                setFlavorPreset("none");
                setFlavorOptionsText("");
              }
            }}
            className="w-full min-w-0 rounded-[1.4rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
          >
            <option value="default">Padrao (pequeno/medio/grande)</option>
            <option value="drink">Bebida (350ml/1000ml/2000ml)</option>
          </select>
        </label>

        {isDrinkPreset ? (
          <div className="rounded-[1.4rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.62)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sage)]">
              Sabores da bebida
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="grid min-w-0 gap-2 text-sm font-medium text-[var(--forest)]">
                Selecao de sabores (opcional)
                <select
                  name="flavorPreset"
                  value={flavorPreset}
                  onChange={(event) => handleFlavorPresetChange(event.target.value)}
                  className="w-full min-w-0 rounded-[1.4rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
                >
                  <option value="none">{flavorPresetOptions.none.label}</option>
                  <option value="juices">{flavorPresetOptions.juices.label}</option>
                  <option value="sodas">{flavorPresetOptions.sodas.label}</option>
                  <option value="custom">{flavorPresetOptions.custom.label}</option>
                </select>
                <span className="text-xs leading-5 text-[rgba(21,35,29,0.66)]">
                  {selectedFlavorPreset.helper}
                </span>
              </label>

              <label className="grid min-w-0 gap-2 text-sm font-medium text-[var(--forest)]">
                Lista de sabores (opcional)
                <textarea
                  name="flavorOptions"
                  rows={3}
                  value={flavorOptionsText}
                  onChange={(event) => setFlavorOptionsText(event.target.value)}
                  placeholder="Ex.: Laranja, Maracuja, Abacaxi com hortela..."
                  className="w-full min-w-0 rounded-[1.4rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
                />
                <span className="text-xs leading-5 text-[rgba(21,35,29,0.66)]">
                  Quando houver varios sabores, o cliente escolhe no cardapio antes de adicionar ao carrinho.
                </span>
              </label>
            </div>
          </div>
        ) : null}

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
          {selectedSizePresetCopy.smallLabel}
          <input
            name="portionSmallPrice"
            type="number"
            min="0.01"
            step="0.01"
            placeholder={selectedSizePresetCopy.smallPlaceholder}
            className="w-full min-w-0 rounded-[1.4rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
          />
        </label>

        <label className="grid min-w-0 gap-2 text-[0.82rem] font-medium text-[var(--forest)] sm:text-sm">
          {selectedSizePresetCopy.mediumLabel}
          <input
            name="portionMediumPrice"
            type="number"
            min="0.01"
            step="0.01"
            placeholder={selectedSizePresetCopy.mediumPlaceholder}
            className="w-full min-w-0 rounded-[1.4rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
          />
        </label>

        <label className="grid min-w-0 gap-2 text-[0.82rem] font-medium text-[var(--forest)] sm:text-sm">
          {selectedSizePresetCopy.largeLabel}
          <input
            name="portionLargePrice"
            type="number"
            min="0.01"
            step="0.01"
            placeholder={selectedSizePresetCopy.largePlaceholder}
            className="w-full min-w-0 rounded-[1.4rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
          />
        </label>
        </div>

        <p className="text-xs leading-6 text-[rgba(21,35,29,0.66)]">
          {selectedSizePresetCopy.helper} Se for item com preco unico, deixe os
          tres campos de tamanho em branco.
        </p>

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
          Item assinatura
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
            idleLabel="Adicionar item"
            pendingLabel="Salvando item..."
            className="xl:w-auto"
          />
          <p className="max-w-xl text-sm leading-6 text-[rgba(21,35,29,0.68)]">
            O item entra no Supabase e aparece no cardapio do cliente sem
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
