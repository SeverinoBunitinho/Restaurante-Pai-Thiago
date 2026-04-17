import { AlertTriangle, ChefHat, Sparkles, Trash2 } from "lucide-react";

import {
  deleteMenuItemAction,
  toggleMenuItemAvailabilityAction,
  updateMenuItemAction,
} from "@/app/operacao/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { MenuFeedbackBanner } from "@/components/menu-feedback-banner";
import { MenuStockLiveSync } from "@/components/menu-stock-live-sync";
import { MenuItemComposer } from "@/components/menu-item-composer";
import { SectionHeading } from "@/components/section-heading";
import { requireRole } from "@/lib/auth";
import { getMenuManagementBoard } from "@/lib/staff-data";
import { formatCurrency } from "@/lib/utils";

const flavorPresetOptions = {
  none: "Sem sabores adicionais",
  juices: "Lista completa de sucos",
  sodas: "Refrigerantes (sabores comuns)",
  custom: "Personalizado",
};

function formatPortionLabel(size) {
  if (size === "small") {
    return "P";
  }

  if (size === "large") {
    return "G";
  }

  return "M";
}

function normalizePortionLabelSource(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function resolveFlavorPresetForItem(item, categoryName) {
  const flavorOptions = Array.isArray(item?.flavorOptions) ? item.flavorOptions : [];

  if (!flavorOptions.length) {
    return "none";
  }

  const source = [
    normalizePortionLabelSource(categoryName),
    normalizePortionLabelSource(item?.name),
    ...(Array.isArray(item?.tags) ? item.tags : []).map((tag) =>
      normalizePortionLabelSource(tag),
    ),
  ].join(" ");

  if (source.includes("suco")) {
    return "juices";
  }

  if (
    source.includes("refrigerante") ||
    source.includes("fanta") ||
    source.includes("coca") ||
    source.includes("guarana") ||
    source.includes("soda")
  ) {
    return "sodas";
  }

  return "custom";
}

function isDrinkContext({ categoryName, tags = [] }) {
  const source = [
    normalizePortionLabelSource(categoryName),
    ...tags.map((tag) => normalizePortionLabelSource(tag)),
  ].join(" ");

  return (
    source.includes("bebida") ||
    source.includes("refrigerante") ||
    source.includes("suco") ||
    source.includes("drink")
  );
}

function formatPortionLabelForItem(size, item, categoryName) {
  const drinkContext = isDrinkContext({
    categoryName,
    tags: item?.tags ?? [],
  });

  if (!drinkContext) {
    return formatPortionLabel(size);
  }

  if (size === "small") {
    return "350ml";
  }

  if (size === "medium") {
    return "1L";
  }

  if (size === "large") {
    return "2L";
  }

  return formatPortionLabel(size);
}

function getStockState(item) {
  const hasStockControl =
    Number.isFinite(Number(item.stockQuantity)) && Number(item.stockQuantity) >= 0;

  if (!hasStockControl) {
    return {
      hasStockControl: false,
      stockQuantity: null,
      lowStockThreshold: 0,
      isOutOfStock: false,
      isLowStock: false,
    };
  }

  const stockQuantity = Number(item.stockQuantity);
  const lowStockThreshold =
    Number.isFinite(Number(item.lowStockThreshold)) &&
    Number(item.lowStockThreshold) >= 0
      ? Number(item.lowStockThreshold)
      : 0;

  return {
    hasStockControl: true,
    stockQuantity,
    lowStockThreshold,
    isOutOfStock: stockQuantity <= 0,
    isLowStock:
      stockQuantity > 0 && stockQuantity <= Math.max(0, lowStockThreshold),
  };
}

export default async function OperacaoMenuPage({ searchParams }) {
  const session = await requireRole(["waiter", "manager", "owner"]);
  const canManageCatalog = ["manager", "owner"].includes(session.role);
  const board = await getMenuManagementBoard();
  const resolvedSearchParams = await searchParams;
  const menuNotice = Array.isArray(resolvedSearchParams?.menuNotice)
    ? resolvedSearchParams.menuNotice[0]
    : resolvedSearchParams?.menuNotice;
  const menuError = Array.isArray(resolvedSearchParams?.menuError)
    ? resolvedSearchParams.menuError[0]
    : resolvedSearchParams?.menuError;
  const totalItems = board.categories.reduce(
    (sum, category) => sum + category.items.length,
    0,
  );
  const stockAlerts = [...(board.stockAlerts ?? [])].sort((left, right) => {
    const leftStock = Math.max(0, Number(left.stockQuantity ?? 0));
    const rightStock = Math.max(0, Number(right.stockQuantity ?? 0));
    const leftOut = leftStock <= 0;
    const rightOut = rightStock <= 0;

    if (leftOut !== rightOut) {
      return leftOut ? -1 : 1;
    }

    if (leftStock !== rightStock) {
      return leftStock - rightStock;
    }

    return String(left.name ?? "").localeCompare(String(right.name ?? ""), "pt-BR");
  });
  const outOfStockCount = stockAlerts.filter(
    (item) => Number(item.stockQuantity ?? 0) <= 0,
  ).length;
  const lowStockCount = stockAlerts.length - outOfStockCount;
  const visibleStockAlerts = stockAlerts.slice(0, 8);
  const maxVisibleOperationalItems = 4;

  function renderOperationalItem(item, categoryId, categoryName, canManageItem) {
    const stockState = getStockState(item);
    const flavorOptions = Array.isArray(item.flavorOptions)
      ? item.flavorOptions
          .map((entry) => String(entry ?? "").trim())
          .filter(Boolean)
      : [];
    const showFlavorControls = isDrinkContext({
      categoryName,
      tags: item?.tags ?? [],
    });
    const flavorPreview = flavorOptions.slice(0, 6).join(" | ");
    const hiddenFlavorCount = Math.max(0, flavorOptions.length - 6);
    const flavorPresetDefault = resolveFlavorPresetForItem(item, categoryName);

    return (
      <article
        key={item.id}
        className="rounded-[1.5rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.72)] p-4"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-[var(--forest)]">
              {item.name}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
              {item.description}
            </p>
          </div>
          <span className="text-sm font-semibold text-[var(--forest)]">
            {formatCurrency(item.price)}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-[var(--sage)]">
          {item.prepTime ? (
            <span className="rounded-full border border-[rgba(20,35,29,0.08)] px-3 py-2">
              {item.prepTime}
            </span>
          ) : null}
          {item.spiceLevel ? (
            <span className="rounded-full border border-[rgba(20,35,29,0.08)] px-3 py-2">
              {item.spiceLevel}
            </span>
          ) : null}
          {item.signature ? (
            <span className="rounded-full border border-[rgba(182,135,66,0.18)] bg-[rgba(182,135,66,0.08)] px-3 py-2 text-[var(--gold)]">
              assinatura
            </span>
          ) : null}
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[rgba(20,35,29,0.08)] px-3 py-2"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-4 grid gap-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
          <p>
            <span className="font-semibold text-[var(--forest)]">
              Estoque:
            </span>{" "}
            {stockState.stockQuantity == null
              ? "sem controle ativo"
              : `${stockState.stockQuantity} unidade(s)`}
          </p>
          {stockState.stockQuantity != null ? (
            <p>
              <span className="font-semibold text-[var(--forest)]">
                Alerta:
              </span>{" "}
              {stockState.lowStockThreshold} unidade(s)
            </p>
          ) : null}
          {stockState.stockQuantity != null ? (
            <p>
              <span className="font-semibold text-[var(--forest)]">
                Limite de pratos possiveis:
              </span>{" "}
              {stockState.stockQuantity}
            </p>
          ) : null}
          <p>
            <span className="font-semibold text-[var(--forest)]">
              Tamanhos:
            </span>{" "}
            {Object.entries(item.portionPrices ?? {}).filter(([, value]) => {
              const parsed = Number(value ?? NaN);
              return Number.isFinite(parsed) && parsed > 0;
            }).length
              ? Object.entries(item.portionPrices ?? {})
                  .filter(([, value]) => {
                    const parsed = Number(value ?? NaN);
                    return Number.isFinite(parsed) && parsed > 0;
                  })
                  .map(
                    ([size, value]) =>
                      `${formatPortionLabelForItem(size, item, categoryName)} ${formatCurrency(value)}`,
                  )
                  .join(" | ")
              : "Preco unico (sem tamanhos)"}
          </p>
          {showFlavorControls ? (
            <p>
              <span className="font-semibold text-[var(--forest)]">
                Sabores:
              </span>{" "}
              {flavorOptions.length
                ? `${flavorPreview}${hiddenFlavorCount ? ` | +${hiddenFlavorCount}` : ""}`
                : "sem variacoes cadastradas"}
            </p>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span
            className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
              stockState.isOutOfStock
                ? "bg-[rgba(138,93,59,0.12)] text-[var(--clay)]"
                : stockState.isLowStock
                  ? "bg-[rgba(182,135,66,0.12)] text-[var(--gold)]"
                  : item.available
                    ? "bg-[rgba(95,123,109,0.12)] text-[var(--sage)]"
                    : "bg-[rgba(138,93,59,0.12)] text-[var(--clay)]"
            }`}
          >
            {stockState.isOutOfStock
              ? "esgotado"
              : stockState.isLowStock
                ? "estoque baixo"
                : item.available
                  ? "ativo"
                  : "pausado"}
          </span>
          {canManageItem ? (
            <>
              <form action={toggleMenuItemAvailabilityAction}>
                <input type="hidden" name="itemId" value={item.id} />
                <input
                  type="hidden"
                  name="currentAvailability"
                  value={String(item.available)}
                />
                <button
                  type="submit"
                  className="pill-wrap-safe rounded-full border border-[rgba(20,35,29,0.12)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--forest)] transition hover:-translate-y-0.5"
                >
                  {item.available ? "Pausar item" : "Reativar item"}
                </button>
              </form>
              <form action={deleteMenuItemAction}>
                <input type="hidden" name="itemId" value={item.id} />
                <ConfirmSubmitButton
                  message={`Tem certeza que deseja retirar o prato ${item.name} do cardapio?`}
                  className="pill-wrap-safe inline-flex items-center gap-2 rounded-full border border-[rgba(138,93,59,0.16)] bg-[rgba(138,93,59,0.06)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--clay)] transition hover:-translate-y-0.5"
                >
                  <Trash2 size={14} />
                  Retirar prato
                </ConfirmSubmitButton>
              </form>
            </>
          ) : (
            <span className="rounded-full border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.78)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--sage)]">
              Somente leitura
            </span>
          )}
        </div>

        {canManageItem ? (
          <details className="mt-4 rounded-[1.3rem] border border-[rgba(20,35,29,0.1)] bg-[rgba(255,255,255,0.62)] px-4 py-3">
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.18em] text-[var(--forest)]">
              Editar item e estoque
            </summary>

            <form action={updateMenuItemAction} className="mt-4 grid gap-3">
              <input type="hidden" name="itemId" value={item.id} />

              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sage)]">
                  Categoria
                  <select
                    name="categoryId"
                    defaultValue={categoryId}
                    className="rounded-[1rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.84)] px-3 py-2 text-sm font-medium text-[var(--forest)] outline-none"
                  >
                    {board.categories.map((categoryOption) => (
                      <option key={categoryOption.id} value={categoryOption.id}>
                        {categoryOption.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sage)]">
                  Nome
                  <input
                    name="name"
                    required
                    defaultValue={item.name}
                    className="rounded-[1rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.84)] px-3 py-2 text-sm text-[var(--forest)] outline-none"
                  />
                </label>
              </div>

              <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sage)]">
                Descricao
                <textarea
                  name="description"
                  rows={3}
                  required
                  defaultValue={item.description}
                  className="rounded-[1rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.84)] px-3 py-2 text-sm text-[var(--forest)] outline-none"
                />
              </label>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sage)]">
                  Preco
                  <input
                    name="price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    defaultValue={item.price}
                    className="rounded-[1rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.84)] px-3 py-2 text-sm text-[var(--forest)] outline-none"
                  />
                </label>

                <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sage)]">
                  Preparo
                  <input
                    name="prepTime"
                    defaultValue={item.prepTime ?? ""}
                    className="rounded-[1rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.84)] px-3 py-2 text-sm text-[var(--forest)] outline-none"
                  />
                </label>
              </div>

              <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sage)]">
                Imagem (URL)
                <input
                  name="imageUrl"
                  defaultValue={item.imageUrl ?? ""}
                  placeholder="https://... ou /images/prato.jpg"
                  className="rounded-[1rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.84)] px-3 py-2 text-sm text-[var(--forest)] outline-none"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <label className="grid min-w-0 gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sage)]">
                  Estoque
                  <input
                    name="stockQuantity"
                    type="number"
                    min="0"
                    defaultValue={item.stockQuantity ?? ""}
                    className="w-full min-w-0 rounded-[1rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.84)] px-3 py-2 text-sm text-[var(--forest)] outline-none"
                  />
                </label>

                <label className="grid min-w-0 gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sage)]">
                  Alerta
                  <input
                    name="lowStockThreshold"
                    type="number"
                    min="0"
                    defaultValue={item.lowStockThreshold ?? 0}
                    className="w-full min-w-0 rounded-[1rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.84)] px-3 py-2 text-sm text-[var(--forest)] outline-none"
                  />
                </label>

                <label className="grid min-w-0 gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sage)]">
                  Pequeno / 350ml (opcional)
                  <input
                    name="portionSmallPrice"
                    type="number"
                    min="0.01"
                    step="0.01"
                    defaultValue={item.portionPrices?.small ?? ""}
                    className="w-full min-w-0 rounded-[1rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.84)] px-3 py-2 text-sm text-[var(--forest)] outline-none"
                  />
                </label>

                <label className="grid min-w-0 gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sage)]">
                  Medio / 1000ml (opcional)
                  <input
                    name="portionMediumPrice"
                    type="number"
                    min="0.01"
                    step="0.01"
                    defaultValue={item.portionPrices?.medium ?? ""}
                    className="w-full min-w-0 rounded-[1rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.84)] px-3 py-2 text-sm text-[var(--forest)] outline-none"
                  />
                </label>

                <label className="grid min-w-0 gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sage)]">
                  Grande / 2000ml (opcional)
                  <input
                    name="portionLargePrice"
                    type="number"
                    min="0.01"
                    step="0.01"
                    defaultValue={item.portionPrices?.large ?? ""}
                    className="w-full min-w-0 rounded-[1rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.84)] px-3 py-2 text-sm text-[var(--forest)] outline-none"
                  />
                </label>
              </div>

              <p className="text-xs leading-5 text-[rgba(21,35,29,0.66)]">
                Para bebida ou item com preco unico, deixe os campos de tamanho em branco.
              </p>

              {showFlavorControls ? (
                <div className="grid gap-3 rounded-[1.2rem] border border-[rgba(95,123,109,0.16)] bg-[rgba(95,123,109,0.06)] p-3 md:grid-cols-2">
                  <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sage)]">
                    Selecao de sabores (opcional)
                    <select
                      name="flavorPreset"
                      defaultValue={flavorPresetDefault}
                      className="rounded-[1rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.84)] px-3 py-2 text-sm text-[var(--forest)] outline-none"
                    >
                      <option value="none">{flavorPresetOptions.none}</option>
                      <option value="juices">{flavorPresetOptions.juices}</option>
                      <option value="sodas">{flavorPresetOptions.sodas}</option>
                      <option value="custom">{flavorPresetOptions.custom}</option>
                    </select>
                  </label>

                  <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sage)]">
                    Sabores (opcional)
                    <input
                      name="flavorOptions"
                      defaultValue={flavorOptions.join(", ")}
                      placeholder="Ex.: Laranja, Maracuja, Uva..."
                      className="rounded-[1rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.84)] px-3 py-2 text-sm text-[var(--forest)] outline-none"
                    />
                  </label>
                </div>
              ) : null}

              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sage)]">
                  Tags
                  <input
                    name="tags"
                    defaultValue={item.tags.join(", ")}
                    className="rounded-[1rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.84)] px-3 py-2 text-sm text-[var(--forest)] outline-none"
                  />
                </label>

                <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sage)]">
                  Alergenicos
                  <input
                    name="allergens"
                    defaultValue={item.allergens.join(", ")}
                    className="rounded-[1rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.84)] px-3 py-2 text-sm text-[var(--forest)] outline-none"
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-3">
                <label className="inline-flex items-center gap-2 rounded-full border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.78)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--forest)]">
                  <input
                    type="checkbox"
                    name="isSignature"
                    defaultChecked={item.signature}
                    className="accent-[var(--gold)]"
                  />
                  Assinatura
                </label>
                <label className="inline-flex items-center gap-2 rounded-full border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.78)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--forest)]">
                  <input
                    type="checkbox"
                    name="isAvailable"
                    defaultChecked={item.available}
                    className="accent-[var(--gold)]"
                  />
                  Ativo
                </label>
              </div>

              <button
                type="submit"
                className="pill-wrap-safe inline-flex w-full items-center justify-center rounded-full border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.88)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--forest)] transition hover:-translate-y-0.5 md:w-auto"
              >
                Salvar edicao
              </button>
            </form>
          </details>
        ) : null}
      </article>
    );
  }

  return (
    <>
      <MenuStockLiveSync />

      <section className="pt-10">
        <div className="grid gap-4 rounded-[2.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.46)] px-5 py-5 shadow-[0_20px_60px_rgba(36,29,15,0.06)] sm:grid-cols-2 xl:grid-cols-4 lg:px-8">
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

        <MenuFeedbackBanner notice={menuNotice} error={menuError} />
      </section>

      <section className="pt-14">
        <div
          className={`grid auto-rows-min items-start gap-5 ${
            canManageCatalog ? "lg:grid-cols-[0.95fr_1.05fr]" : ""
          }`}
        >
          <div className="grid auto-rows-min gap-5">
            <div className="luxury-card-dark h-fit self-start rounded-[2.2rem] p-6 text-[var(--cream)]">
              <p className="text-xs uppercase tracking-[0.28em] text-[rgba(217,185,122,0.92)]">
                {canManageCatalog ? "Edicao do cardapio" : "Leitura do cardapio"}
              </p>
              <h2 className="display-title page-section-title mt-4 text-white">
                {canManageCatalog
                  ? "Adicione pratos com padrao de casa e retire itens quando o turno pedir"
                  : "Visualize cardapio, estoque e disponibilidade sem alterar dados"}
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[rgba(255,247,232,0.76)]">
                {canManageCatalog
                  ? "Esta camada foi desenhada para gerente e dono atualizarem o catalogo sem sair da operacao. O que entra aqui reflete no cardapio do cliente em fluxo real."
                  : "O garcom acompanha o catalogo interno em tempo real para orientar atendimento, sem acesso para cadastrar, pausar, retirar ou editar itens."}
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <article className="rounded-[1.6rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-[rgba(217,185,122,0.92)]">
                    Estrutura viva
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-white">
                    {totalItems}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[rgba(255,247,232,0.72)]">
                    Itens monitorados nesta central de cardapio.
                  </p>
                </article>

                <article className="rounded-[1.6rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-[rgba(217,185,122,0.92)]">
                    Controle fino
                  </p>
                  <p className="mt-3 text-lg font-semibold text-white">
                    Ativar, pausar e remover
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[rgba(255,247,232,0.72)]">
                    O catalogo fica mais coerente com a cozinha, estoque e ritmo
                    da casa.
                  </p>
                </article>
              </div>

              <div className="mt-8 grid content-start gap-3">
                {board.categories.length ? (
                  <div className="max-h-[26rem] space-y-3 overflow-y-auto pr-1">
                    {board.categories.map((category) => (
                      <div
                        key={category.id}
                        className="rounded-[1.4rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {category.name}
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[rgba(255,247,232,0.64)]">
                              {category.items.length} item(ns)
                            </p>
                          </div>
                          <Sparkles className="text-[var(--gold-soft)]" size={16} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[1.4rem] border border-dashed border-[rgba(217,185,122,0.18)] bg-[rgba(255,255,255,0.04)] px-4 py-4 text-sm leading-6 text-[rgba(255,247,232,0.72)]">
                    O cardapio interno fica visivel aqui assim que a leitura do
                    banco for retomada.
                  </div>
                )}
              </div>
            </div>

            <div className="luxury-card rounded-[2.2rem] p-6">
              <SectionHeading
                eyebrow="Controle de estoque"
                  title="Alertas rapidos da reposicao"
                  description={
                    canManageCatalog
                      ? "Painel compacto para ver itens em alerta e ajustar estoque na edicao de cada prato."
                      : "Painel compacto para leitura rapida dos itens em alerta durante o atendimento."
                  }
                  compact
                />

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[rgba(138,93,59,0.2)] bg-[rgba(138,93,59,0.08)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--clay)]">
                  {outOfStockCount} esgotado(s)
                </span>
                <span className="rounded-full border border-[rgba(182,135,66,0.2)] bg-[rgba(182,135,66,0.08)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
                  {lowStockCount} em alerta
                </span>
                <span className="rounded-full border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--forest)]">
                  {stockAlerts.length} no total
                </span>
              </div>

              {stockAlerts.length ? (
                <>
                  <div className="mt-5 max-h-[18rem] space-y-3 overflow-y-auto pr-1">
                    {visibleStockAlerts.map((alertItem) => {
                      const currentStock = Math.max(0, Number(alertItem.stockQuantity ?? 0));
                      const alertLimit = Math.max(0, Number(alertItem.lowStockThreshold ?? 0));
                      const isOutOfStock = currentStock <= 0;

                      return (
                        <article
                          key={`stock-alert-inline-${alertItem.id}`}
                          className="rounded-[1.2rem] border border-[rgba(20,35,29,0.1)] bg-[rgba(255,255,255,0.78)] px-4 py-3"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--sage)]">
                                {alertItem.categoryName || "Sem categoria"}
                              </p>
                              <h4 className="mt-1 text-sm font-semibold text-[var(--forest)] break-words">
                                {alertItem.name}
                              </h4>
                              <p className="mt-1 text-xs leading-5 text-[rgba(21,35,29,0.72)]">
                                Estoque:{" "}
                                <span className="font-semibold text-[var(--forest)]">
                                  {currentStock}
                                </span>
                                {isOutOfStock ? " | reposicao urgente." : ` | alerta em ${alertLimit}.`}
                              </p>
                            </div>
                            <span
                              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                                isOutOfStock
                                  ? "bg-[rgba(138,93,59,0.12)] text-[var(--clay)]"
                                  : "bg-[rgba(182,135,66,0.12)] text-[var(--gold)]"
                              }`}
                            >
                              <AlertTriangle size={12} />
                              {isOutOfStock ? "Esgotado" : "Baixo"}
                            </span>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {stockAlerts.length > visibleStockAlerts.length ? (
                    <p className="mt-4 text-xs text-[rgba(21,35,29,0.68)]">
                      +{stockAlerts.length - visibleStockAlerts.length} alerta(s) adicional(is) na fila.
                    </p>
                  ) : null}
                </>
              ) : (
                <div className="mt-5 rounded-[1.2rem] border border-[rgba(20,35,29,0.1)] bg-[rgba(255,255,255,0.78)] px-4 py-4 text-sm text-[rgba(21,35,29,0.72)]">
                  Sem alerta de estoque no momento. Assim que algum item entrar em risco, ele aparece aqui automaticamente.
                </div>
              )}
            </div>
          </div>

          {canManageCatalog ? (
            <div className="grid gap-5">
              <div className="luxury-card rounded-[2.2rem] p-6">
                <SectionHeading
                  eyebrow="Novo prato"
                  title="Cadastrar item com acabamento profissional"
                  description="Preencha os campos para incluir um prato novo no cardapio da casa com categoria, descricao, preco e leitura operacional."
                  compact
                />

                <div className="mt-8">
                  <MenuItemComposer categories={board.categories} />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="pt-14">
        <div className="luxury-card rounded-[2.2rem] p-6">
          <SectionHeading
            eyebrow="Catalogo operacional"
            title={
              canManageCatalog
                ? "Ativar, pausar ou retirar pratos da casa"
                : "Cardapio interno em tempo real para atendimento"
            }
            description={
              canManageCatalog
                ? "Gerente e dono conseguem manter o menu vivo com mais clareza visual, sem misturar cadastro novo com manutencao do que ja existe."
                : "Garcom tem leitura completa de itens, preco, estoque e disponibilidade para orientar o cliente."
            }
            compact
          />

          <div className="mt-8 space-y-4">
            {board.categories.length ? (
              board.categories.map((category, categoryIndex) => {
                const visibleItems = category.items.slice(0, maxVisibleOperationalItems);
                const hiddenItems = category.items.slice(maxVisibleOperationalItems);

                return (
                  <details
                    key={category.id}
                    open={categoryIndex === 0}
                    className="rounded-[1.8rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5"
                  >
                    <summary className="list-none cursor-pointer [&::-webkit-details-marker]:hidden">
                      <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.22em] text-[var(--sage)]">
                            Categoria
                          </p>
                          <h2 className="mt-2 text-3xl font-semibold text-[var(--forest)]">
                            {category.name}
                          </h2>
                          <p className="mt-3 max-w-2xl text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                            {category.description}
                          </p>
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(182,135,66,0.18)] bg-[rgba(255,255,255,0.62)] px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--gold)]">
                          <ChefHat size={15} />
                          {category.items.length} itens
                        </div>
                      </div>
                    </summary>

                    <div className="mt-6">
                      {category.items.length ? (
                        <>
                          <div className="grid gap-4 lg:grid-cols-2">
                          {visibleItems.map((item) =>
                            renderOperationalItem(item, category.id, category.name, canManageCatalog),
                          )}
                          </div>

                          {hiddenItems.length ? (
                            <details className="mt-4 rounded-[1.4rem] border border-[rgba(20,35,29,0.1)] bg-[rgba(255,255,255,0.6)] px-4 py-3">
                              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.18em] text-[var(--forest)]">
                                Ver mais {hiddenItems.length} item(ns)
                              </summary>
                              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                                  {hiddenItems.map((item) =>
                                    renderOperationalItem(item, category.id, category.name, canManageCatalog),
                                  )}
                              </div>
                            </details>
                          ) : null}
                        </>
                      ) : (
                        <article className="rounded-[1.5rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.52)] p-5">
                          <p className="text-lg font-semibold text-[var(--forest)]">
                            Nenhum prato cadastrado nesta categoria
                          </p>
                          <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.7)]">
                            Use o painel de cadastro acima para inserir o primeiro
                            item desta sessao do cardapio.
                          </p>
                        </article>
                      )}
                    </div>
                  </details>
                );
              })
            ) : (
              <article className="rounded-[1.8rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.54)] p-6">
                <p className="text-lg font-semibold text-[var(--forest)]">
                  Nenhuma categoria de cardapio disponivel agora
                </p>
                <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                  Assim que o banco voltar a responder, a manutencao completa do
                  cardapio reaparece nesta tela.
                </p>
              </article>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
