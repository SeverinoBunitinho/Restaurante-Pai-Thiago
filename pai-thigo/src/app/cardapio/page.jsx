import Image from "next/image";
import { Clock3, Flame, Sparkles } from "lucide-react";

import { MenuOrderForm } from "@/components/menu-order-form";
import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCurrentSession } from "@/lib/auth";
import { getRestaurantProfile } from "@/lib/restaurant-profile";
import { getMenuCategories } from "@/lib/site-data";
import { formatCurrency } from "@/lib/utils";

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isDrinkItem(item) {
  const name = normalizeText(item?.name);
  const tags = Array.isArray(item?.tags)
    ? item.tags.map((tag) => normalizeText(tag)).join(" ")
    : "";

  return (
    name.includes("suco") ||
    name.includes("fanta") ||
    tags.includes("suco") ||
    tags.includes("bebida") ||
    tags.includes("refrigerante")
  );
}

function extractFlavorOptions(item) {
  if (!isDrinkItem(item)) {
    return [];
  }

  const description = String(item?.description ?? "").replace(/\r?\n/g, " ").trim();

  if (!description) {
    return [];
  }

  const explicitFlavorsMatch = description.match(/sabores?\s*:\s*([^.!?]+)/i);
  const source = explicitFlavorsMatch ? explicitFlavorsMatch[1] : description;

  const options = source
    .replace(/\s+e\s+/gi, ",")
    .replace(/[|/]/g, ",")
    .split(/[;,]/)
    .map((entry) => entry.trim())
    .filter(
      (entry) =>
        entry.length >= 2 &&
        entry.length <= 40 &&
        !/^\d+$/.test(entry) &&
        entry.split(/\s+/).length <= 4,
    );

  return Array.from(new Set(options)).slice(0, 30);
}

export default async function CardapioPage() {
  const session = await getCurrentSession();
  const [categories, restaurantInfo] = await Promise.all([
    getMenuCategories(),
    getRestaurantProfile(),
  ]);
  const canOrder = session?.role === "customer";
  const maxItemsPerCategory = 4;
  const totalItems = categories.reduce(
    (sum, category) => sum + category.items.length,
    0,
  );

  function renderMenuItemCard(item) {
    const hasStockControl =
      Number.isFinite(Number(item.stockQuantity)) &&
      Number(item.stockQuantity) >= 0;
    const stockQuantity = hasStockControl
      ? Number(item.stockQuantity)
      : null;
    const lowStockThreshold =
      Number.isFinite(Number(item.lowStockThreshold)) &&
      Number(item.lowStockThreshold) >= 0
        ? Number(item.lowStockThreshold)
        : 0;
    const isOutOfStock = hasStockControl && stockQuantity <= 0;
    const isLowStock =
      hasStockControl &&
      stockQuantity > 0 &&
      stockQuantity <= Math.max(0, lowStockThreshold);

    const flavorOptions = extractFlavorOptions(item);

    return (
      <article
        key={item.id}
        className="group stat-panel overflow-hidden p-0"
      >
        <div className="media-frame relative h-44 w-full overflow-hidden">
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="media-image object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-2xl font-semibold text-[var(--forest)]">
                  {item.name}
                </h3>
                {item.signature ? (
                  <span className="rounded-full bg-[rgba(182,135,66,0.14)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
                    assinatura da casa
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-sm leading-7 text-[rgba(21,35,29,0.72)]">
                {item.description}
              </p>
            </div>
            <span className="text-lg font-semibold text-[var(--forest)]">
              {formatCurrency(item.price)}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.72)] px-3 py-2 text-xs font-medium text-[var(--forest)]">
              <Clock3 size={14} />
              {item.prepTime}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.72)] px-3 py-2 text-xs font-medium text-[var(--forest)]">
              <Flame size={14} />
              {item.spiceLevel}
            </span>
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[rgba(20,35,29,0.08)] px-3 py-2 text-xs font-medium text-[var(--sage)]"
              >
                {tag}
              </span>
            ))}
            {hasStockControl ? (
              <span
                className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${
                  isOutOfStock
                    ? "border-[rgba(138,93,59,0.2)] bg-[rgba(138,93,59,0.08)] text-[var(--clay)]"
                    : isLowStock
                      ? "border-[rgba(182,135,66,0.24)] bg-[rgba(182,135,66,0.08)] text-[var(--gold)]"
                      : "border-[rgba(95,123,109,0.18)] bg-[rgba(95,123,109,0.08)] text-[var(--sage)]"
                }`}
              >
                {isOutOfStock
                  ? "esgotado"
                  : `${stockQuantity} unidade(s) disponiveis`}
              </span>
            ) : null}
          </div>

          <div className="mt-4 rounded-[1.3rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.5)] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
              Informacao de alergia
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {item.allergens?.length ? (
                item.allergens.map((allergen) => (
                  <span
                    key={allergen}
                    className="rounded-full border border-[rgba(138,93,59,0.16)] bg-[rgba(138,93,59,0.06)] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--clay)]"
                  >
                    {allergen}
                  </span>
                ))
              ) : (
                <span className="rounded-full border border-[rgba(95,123,109,0.16)] bg-[rgba(95,123,109,0.06)] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sage)]">
                  sem alerta informado
                </span>
              )}
            </div>
          </div>

          <MenuOrderForm
            menuItemId={item.id}
            name={item.name}
            price={item.price}
            portionPrices={item.portionPrices}
            flavorOptions={flavorOptions}
            isDrinkItem={isDrinkItem(item)}
            prepTime={item.prepTime}
            signature={item.signature}
            canOrder={canOrder}
            stockQuantity={item.stockQuantity}
            lowStockThreshold={item.lowStockThreshold}
          />
        </div>
      </article>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="pb-16">
        <section className="shell pt-12">
          <div className="hero-stage menu-hero luxury-card-dark rounded-[2.4rem] p-7 text-[var(--cream)] md:p-10">
            <p className="menu-hero-eyebrow text-xs uppercase tracking-[0.28em] text-[rgba(217,185,122,0.92)]">
              Cardapio da casa
            </p>
            <h1 className="display-title page-hero-title menu-hero-title mt-4 text-white">
              Sabores pensados para almoco, jantar e ocasioes especiais
            </h1>
            <p className="menu-hero-description mt-5 max-w-3xl text-base leading-8 text-[rgba(255,247,232,0.74)]">
              Esta pagina mostra somente o menu ativo da casa, com categorias,
              precos, preparo e alergenicos para uma escolha clara.
            </p>

            <div className="menu-hero-pill mt-8 inline-flex max-w-2xl rounded-full border border-[rgba(217,185,122,0.18)] bg-[rgba(255,255,255,0.05)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-[rgba(255,247,232,0.8)]">
              {canOrder
                ? "Escolha os pratos e finalize no carrinho"
                : "Visualizacao oficial do menu com disponibilidade atual"}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <span className="menu-hero-chip info-chip border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.08)] text-[rgba(255,247,232,0.84)]">
                <Clock3 size={14} />
                {restaurantInfo.schedule[0]}
              </span>
              <span className="menu-hero-chip info-chip border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.08)] text-[rgba(255,247,232,0.84)]">
                <Sparkles size={14} />
                categorias organizadas para leitura rapida
              </span>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <span className="menu-hero-chip info-chip border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.08)] text-[rgba(255,247,232,0.84)]">
                {totalItems} itens ativos
              </span>
              <span className="menu-hero-chip info-chip border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.08)] text-[rgba(255,247,232,0.84)]">
                Alergenicos sinalizados
              </span>
              <span className="menu-hero-chip info-chip border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.08)] text-[rgba(255,247,232,0.84)]">
                {restaurantInfo.schedule[1]}
              </span>
            </div>
          </div>
        </section>

        <section className="shell section-frame pt-14">
          <SectionHeading
            eyebrow="Categorias"
            title="Cardapio organizado para uma navegacao clara"
            description="Cada categoria reflete a oferta ativa do restaurante, com pratos disponiveis e informacoes objetivas."
          />

          {categories.length ? (
            <div className="sticky top-[10.9rem] z-30 mt-8 rounded-[1.5rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.72)] p-3 shadow-[0_14px_30px_rgba(39,30,18,0.08)] backdrop-blur md:top-[8.8rem]">
              <p className="px-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sage)]">
                Navegacao rapida
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {categories.map((category) => (
                  <a
                    key={`quick-${category.id}`}
                    href={`#categoria-${category.id}`}
                    className="rounded-full border border-[rgba(20,35,29,0.12)] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--forest)]"
                  >
                    {category.name}
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-10 space-y-6">
            {categories.length ? (
              categories.map((category, index) => (
                <details
                  key={category.id}
                  id={`categoria-${category.id}`}
                  className="luxury-card rounded-[2.2rem] p-0"
                  open={index === 0}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 md:px-8 md:py-6">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.26em] text-[var(--gold)]">
                        Categoria
                      </p>
                      <h2 className="display-title mt-2 text-[2.2rem] leading-[1.02] text-[var(--forest)]">
                        {category.name}
                      </h2>
                    </div>
                    <div className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--sage)]">
                      <Sparkles size={16} />
                      {category.items.length}
                    </div>
                  </summary>

                  <div className="border-t border-[rgba(20,35,29,0.08)] px-6 pb-6 pt-5 md:px-8 md:pb-8">
                    <p className="max-w-2xl text-sm leading-7 text-[rgba(21,35,29,0.72)]">
                      {category.description}
                    </p>

                    <div className="mt-6 grid gap-4 lg:grid-cols-2">
                      {category.items
                        .slice(0, maxItemsPerCategory)
                        .map((item) => renderMenuItemCard(item))}
                    </div>

                    {category.items.length > maxItemsPerCategory ? (
                      <details className="mt-6 rounded-[1.6rem] border border-[rgba(20,35,29,0.1)] bg-[rgba(255,255,255,0.56)] p-4">
                        <summary className="cursor-pointer list-none text-sm font-semibold uppercase tracking-[0.2em] text-[var(--sage)]">
                          Ver mais {category.items.length - maxItemsPerCategory} prato(s) de {category.name}
                        </summary>
                        <div className="mt-4 grid gap-4 lg:grid-cols-2">
                          {category.items
                            .slice(maxItemsPerCategory)
                            .map((item) => renderMenuItemCard(item))}
                        </div>
                      </details>
                    ) : null}
                  </div>
                </details>
              ))
            ) : (
              <section className="luxury-card rounded-[2.2rem] p-6 md:p-8">
                <p className="text-lg font-semibold text-[var(--forest)]">
                  Nenhum item disponivel no cardapio agora
                </p>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[rgba(21,35,29,0.72)]">
                  Quando a cozinha liberar pratos ativos no sistema, eles passam
                  a aparecer aqui automaticamente.
                </p>
              </section>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
