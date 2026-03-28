import { AlertTriangle, ChefHat, Sparkles, Trash2 } from "lucide-react";

import {
  deleteMenuItemAction,
  toggleMenuItemAvailabilityAction,
  updateMenuItemStockAction,
  updateMenuItemAction,
} from "@/app/operacao/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { MenuItemComposer } from "@/components/menu-item-composer";
import { SectionHeading } from "@/components/section-heading";
import { requireRole } from "@/lib/auth";
import { getMenuManagementBoard } from "@/lib/staff-data";
import { formatCurrency } from "@/lib/utils";

function formatPortionLabel(size) {
  if (size === "small") {
    return "P";
  }

  if (size === "large") {
    return "G";
  }

  return "M";
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

function getStockAlertTone(item) {
  const isOutOfStock = Number(item.stockQuantity ?? 0) <= 0;
  const isLowStock =
    !isOutOfStock &&
    Number(item.stockQuantity ?? 0) <= Math.max(0, Number(item.lowStockThreshold ?? 0));

  return {
    isOutOfStock,
    isLowStock,
    badgeClass: isOutOfStock
      ? "bg-[rgba(138,93,59,0.12)] text-[var(--clay)]"
      : isLowStock
        ? "bg-[rgba(182,135,66,0.12)] text-[var(--gold)]"
        : "bg-[rgba(95,123,109,0.12)] text-[var(--sage)]",
    badgeLabel: isOutOfStock ? "Esgotado" : "Reposicao recomendada",
  };
}

function groupStockAlertsByCategory(stockAlerts = []) {
  const groupedMap = new Map();

  stockAlerts.forEach((stockItem) => {
    const categoryName = stockItem.categoryName || "Sem categoria";

    if (!groupedMap.has(categoryName)) {
      groupedMap.set(categoryName, []);
    }

    groupedMap.get(categoryName).push(stockItem);
  });

  return Array.from(groupedMap.entries())
    .map(([categoryName, items]) => {
      const orderedItems = items
        .slice()
        .sort((left, right) => String(left.name ?? "").localeCompare(String(right.name ?? ""), "pt-BR"));
      const outOfStockCount = orderedItems.filter(
        (menuItem) => Number(menuItem.stockQuantity ?? 0) <= 0,
      ).length;
      const lowStockCount = orderedItems.filter((menuItem) => {
        const currentStock = Number(menuItem.stockQuantity ?? 0);
        const alertLimit = Math.max(0, Number(menuItem.lowStockThreshold ?? 0));
        return currentStock > 0 && currentStock <= alertLimit;
      }).length;

      return {
        categoryName,
        items: orderedItems,
        total: orderedItems.length,
        outOfStockCount,
        lowStockCount,
      };
    })
    .sort((left, right) => {
      const leftCritical = left.outOfStockCount + left.lowStockCount;
      const rightCritical = right.outOfStockCount + right.lowStockCount;

      if (rightCritical !== leftCritical) {
        return rightCritical - leftCritical;
      }

      return left.categoryName.localeCompare(right.categoryName, "pt-BR");
    });
}

export default async function OperacaoMenuPage({ searchParams }) {
  await requireRole(["manager", "owner"]);
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
  const stockAlertGroups = groupStockAlertsByCategory(board.stockAlerts ?? []);
  const maxVisibleOperationalItems = 4;

  function renderOperationalItem(item, categoryId) {
    const stockState = getStockState(item);

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
              Porcoes:
            </span>{" "}
            {Object.entries(item.portionPrices ?? {})
              .map(
                ([size, value]) =>
                  `${formatPortionLabel(size)} ${formatCurrency(value)}`,
              )
              .join(" | ")}
          </p>
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
        </div>

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

            <div className="grid gap-3 md:grid-cols-3">
              <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sage)]">
                Preco
                <input
                  name="price"
                  type="number"
                  min="0"
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

              <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sage)]">
                Intensidade
                <input
                  name="spiceLevel"
                  defaultValue={item.spiceLevel ?? ""}
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

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sage)]">
                Estoque
                <input
                  name="stockQuantity"
                  type="number"
                  min="0"
                  defaultValue={item.stockQuantity ?? ""}
                  className="rounded-[1rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.84)] px-3 py-2 text-sm text-[var(--forest)] outline-none"
                />
              </label>

              <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sage)]">
                Alerta
                <input
                  name="lowStockThreshold"
                  type="number"
                  min="0"
                  defaultValue={item.lowStockThreshold ?? 0}
                  className="rounded-[1rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.84)] px-3 py-2 text-sm text-[var(--forest)] outline-none"
                />
              </label>

              <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sage)]">
                P
                <input
                  name="portionSmallPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={item.portionPrices?.small ?? ""}
                  className="rounded-[1rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.84)] px-3 py-2 text-sm text-[var(--forest)] outline-none"
                />
              </label>

              <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sage)]">
                M
                <input
                  name="portionMediumPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={item.portionPrices?.medium ?? item.price}
                  className="rounded-[1rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.84)] px-3 py-2 text-sm text-[var(--forest)] outline-none"
                />
              </label>

              <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sage)]">
                G
                <input
                  name="portionLargePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={item.portionPrices?.large ?? ""}
                  className="rounded-[1rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.84)] px-3 py-2 text-sm text-[var(--forest)] outline-none"
                />
              </label>
            </div>

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
      </article>
    );
  }

  return (
    <>
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

        {menuNotice ? (
          <div className="mt-4 rounded-[1.5rem] border border-[rgba(95,123,109,0.22)] bg-[rgba(95,123,109,0.08)] px-4 py-3 text-sm leading-6 text-[var(--forest)]">
            {menuNotice}
          </div>
        ) : null}

        {menuError ? (
          <div className="mt-4 rounded-[1.5rem] border border-[rgba(138,93,59,0.22)] bg-[rgba(138,93,59,0.08)] px-4 py-3 text-sm leading-6 text-[var(--clay)]">
            {menuError}
          </div>
        ) : null}
      </section>

      <section className="pt-8">
        <div className="luxury-card rounded-[2.2rem] p-6">
          <SectionHeading
            eyebrow="Controle de estoque"
            title="Reposicao orientada por limite de pratos"
            description="Use este painel para ver itens criticos, ajustar quantidade em segundos e evitar falta no turno."
            compact
          />

          {stockAlertGroups.length ? (
            <>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {stockAlertGroups.map((group) => (
                  <article
                    key={`stock-group-resume-${group.categoryName}`}
                    className="rounded-[1.3rem] border border-[rgba(20,35,29,0.1)] bg-[rgba(255,255,255,0.78)] px-4 py-3"
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--sage)]">
                      {group.categoryName}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-[var(--forest)]">
                      {group.total} item(ns)
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[rgba(21,35,29,0.66)]">
                      {group.outOfStockCount} esgotado(s) - {group.lowStockCount} em alerta
                    </p>
                  </article>
                ))}
              </div>

              <div className="mt-6 space-y-4">
                {stockAlertGroups.map((group, index) => (
                  <details
                    key={`stock-group-${group.categoryName}`}
                    open={index === 0}
                    className="rounded-[1.6rem] border border-[rgba(20,35,29,0.1)] bg-[rgba(255,255,255,0.7)] p-4"
                  >
                    <summary className="list-none cursor-pointer [&::-webkit-details-marker]:hidden">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-[var(--sage)]">
                            Categoria
                          </p>
                          <h3 className="mt-1 text-xl font-semibold text-[var(--forest)]">
                            {group.categoryName}
                          </h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-[rgba(138,93,59,0.2)] bg-[rgba(138,93,59,0.08)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--clay)]">
                            {group.outOfStockCount} esgotado(s)
                          </span>
                          <span className="rounded-full border border-[rgba(182,135,66,0.2)] bg-[rgba(182,135,66,0.08)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
                            {group.lowStockCount} em alerta
                          </span>
                          <span className="rounded-full border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--forest)]">
                            {group.total} no total
                          </span>
                        </div>
                      </div>
                    </summary>

                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      {group.items.map((alertItem) => {
                        const stockTone = getStockAlertTone(alertItem);

                        return (
                          <article
                            key={`stock-alert-${alertItem.id}`}
                            className="rounded-[1.4rem] border border-[rgba(20,35,29,0.1)] bg-[rgba(255,255,255,0.78)] p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h4 className="text-lg font-semibold text-[var(--forest)]">
                                  {alertItem.name}
                                </h4>
                                <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.7)]">
                                  Estoque atual:{" "}
                                  <span className="font-semibold text-[var(--forest)]">
                                    {alertItem.stockQuantity}
                                  </span>{" "}
                                  | alerta em{" "}
                                  <span className="font-semibold text-[var(--forest)]">
                                    {alertItem.lowStockThreshold}
                                  </span>
                                  .
                                </p>
                              </div>
                              <span
                                className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${stockTone.badgeClass}`}
                              >
                                <AlertTriangle size={14} />
                                {stockTone.badgeLabel}
                              </span>
                            </div>

                            <form
                              action={updateMenuItemStockAction}
                              className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
                            >
                              <input type="hidden" name="itemId" value={alertItem.id} />

                              <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sage)]">
                                Novo estoque
                                <input
                                  name="stockQuantity"
                                  type="number"
                                  min="0"
                                  required
                                  defaultValue={Math.max(0, Number(alertItem.stockQuantity ?? 0))}
                                  className="rounded-[1rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.86)] px-3 py-2 text-sm text-[var(--forest)] outline-none"
                                />
                              </label>

                              <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sage)]">
                                Limite de alerta
                                <input
                                  name="lowStockThreshold"
                                  type="number"
                                  min="0"
                                  required
                                  defaultValue={Math.max(0, Number(alertItem.lowStockThreshold ?? 0))}
                                  className="rounded-[1rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.86)] px-3 py-2 text-sm text-[var(--forest)] outline-none"
                                />
                              </label>

                              <label className="sm:col-span-2 inline-flex items-center gap-2 rounded-full border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.78)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--forest)]">
                                <input
                                  type="checkbox"
                                  name="reactivateWhenRestocked"
                                  className="accent-[var(--gold)]"
                                />
                                Reativar item ao repor
                              </label>

                              <button
                                type="submit"
                                className="sm:col-span-2 pill-wrap-safe inline-flex w-full items-center justify-center rounded-full border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.88)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--forest)] transition hover:-translate-y-0.5"
                              >
                                Salvar estoque
                              </button>
                            </form>
                          </article>
                        );
                      })}
                    </div>
                  </details>
                ))}
              </div>
            </>
          ) : (
            <article className="mt-8 rounded-[1.6rem] border border-[rgba(95,123,109,0.16)] bg-[rgba(95,123,109,0.08)] p-5 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
              Nenhum item esta em faixa critica de reposicao. O estoque atual esta equilibrado para o turno.
            </article>
          )}
        </div>
      </section>

      <section className="pt-14">
        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="luxury-card-dark rounded-[2.2rem] p-6 text-[var(--cream)]">
            <p className="text-xs uppercase tracking-[0.28em] text-[rgba(217,185,122,0.92)]">
              Edicao do cardapio
            </p>
            <h2 className="display-title page-section-title mt-4 text-white">
              Adicione pratos com padrao de casa e retire itens quando o turno pedir
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[rgba(255,247,232,0.76)]">
              Esta camada foi desenhada para gerente e dono atualizarem o
              catalogo sem sair da operacao. O que entra aqui reflete no
              cardapio do cliente em fluxo real.
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

            <div className="mt-8 grid gap-3">
              {board.categories.length ? (
                board.categories.map((category) => (
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
                ))
              ) : (
                <div className="rounded-[1.4rem] border border-dashed border-[rgba(217,185,122,0.18)] bg-[rgba(255,255,255,0.04)] px-4 py-4 text-sm leading-6 text-[rgba(255,247,232,0.72)]">
                  O cardapio interno fica visivel aqui assim que a leitura do
                  banco for retomada.
                </div>
              )}
            </div>
          </div>

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
        </div>
      </section>

      <section className="pt-14">
        <div className="luxury-card rounded-[2.2rem] p-6">
          <SectionHeading
            eyebrow="Catalogo operacional"
            title="Ativar, pausar ou retirar pratos da casa"
            description="Gerente e dono conseguem manter o menu vivo com mais clareza visual, sem misturar cadastro novo com manutencao do que ja existe."
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
                              renderOperationalItem(item, category.id),
                            )}
                          </div>

                          {hiddenItems.length ? (
                            <details className="mt-4 rounded-[1.4rem] border border-[rgba(20,35,29,0.1)] bg-[rgba(255,255,255,0.6)] px-4 py-3">
                              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.18em] text-[var(--forest)]">
                                Ver mais {hiddenItems.length} item(ns)
                              </summary>
                              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                                {hiddenItems.map((item) =>
                                  renderOperationalItem(item, category.id),
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
