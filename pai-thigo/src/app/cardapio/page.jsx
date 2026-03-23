import Link from "next/link";
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

export default async function CardapioPage() {
  const session = await getCurrentSession();
  const [categories, restaurantInfo] = await Promise.all([
    getMenuCategories(),
    getRestaurantProfile(),
  ]);
  const canOrder = session?.role === "customer";
  const totalItems = categories.reduce(
    (sum, category) => sum + category.items.length,
    0,
  );

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="pb-16">
        <section className="shell pt-12">
          <div className="hero-stage luxury-card-dark rounded-[2.4rem] p-7 text-[var(--cream)] md:p-10">
            <p className="text-xs uppercase tracking-[0.28em] text-[rgba(217,185,122,0.92)]">
              Cardapio da casa
            </p>
            <h1 className="display-title page-hero-title mt-4 text-white">
              Sabores pensados para almoco, jantar e ocasioes especiais
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[rgba(255,247,232,0.74)]">
              Esta pagina mostra somente o menu ativo da casa, com categorias,
              precos, preparo e alergenicos para uma escolha clara.
            </p>

            <div className="mt-8 inline-flex max-w-2xl rounded-full border border-[rgba(217,185,122,0.18)] bg-[rgba(255,255,255,0.05)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-[rgba(255,247,232,0.8)]">
              {canOrder
                ? "Escolha os pratos e finalize no carrinho"
                : "Visualizacao oficial do menu com disponibilidade atual"}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <span className="info-chip border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.08)] text-[rgba(255,247,232,0.84)]">
                <Clock3 size={14} />
                {restaurantInfo.schedule[0]}
              </span>
              <span className="info-chip border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.08)] text-[rgba(255,247,232,0.84)]">
                <Sparkles size={14} />
                categorias organizadas para leitura rapida
              </span>
            </div>

            {canOrder ? (
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/carrinho" className="button-primary w-full justify-center sm:w-auto">
                  Abrir carrinho
                </Link>
                <Link href="/area-cliente" className="button-secondary w-full justify-center sm:w-auto">
                  Abrir perfil
                </Link>
              </div>
            ) : null}

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <article className="rounded-[1.6rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-[rgba(217,185,122,0.92)]">
                  Itens no menu
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {totalItems}
                </p>
                <p className="mt-2 text-sm leading-6 text-[rgba(255,247,232,0.72)]">
                  Catalogo vivo e sincronizado com a disponibilidade da casa.
                </p>
              </article>

              <article className="rounded-[1.6rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-[rgba(217,185,122,0.92)]">
                  Alergenicos
                </p>
                <p className="mt-3 text-2xl font-semibold text-white">
                  Sinalizados item a item
                </p>
                <p className="mt-2 text-sm leading-6 text-[rgba(255,247,232,0.72)]">
                  Leitura mais segura e mais profissional para o cliente.
                </p>
              </article>

              <article className="rounded-[1.6rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-[rgba(217,185,122,0.92)]">
                  Janela da casa
                </p>
                <p className="mt-3 text-2xl font-semibold text-white">
                  {restaurantInfo.schedule[1]}
                </p>
                <p className="mt-2 text-sm leading-6 text-[rgba(255,247,232,0.72)]">
                  Janela importante do servico e do atendimento da casa.
                </p>
              </article>
            </div>

            {categories.length ? (
              <p className="mt-8 text-sm leading-7 text-[rgba(255,247,232,0.74)]">
                As categorias ficam no bloco de navegacao rapida logo abaixo, evitando repeticao visual nesta etapa.
              </p>
            ) : null}
          </div>
        </section>

        <section className="shell section-frame pt-20">
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
              categories.map((category) => (
                <section
                  key={category.id}
                  id={`categoria-${category.id}`}
                  className="luxury-card rounded-[2.2rem] p-6 md:p-8"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.26em] text-[var(--gold)]">
                        Categoria
                      </p>
                      <h2 className="display-title page-section-title mt-3 text-[var(--forest)]">
                        {category.name}
                      </h2>
                      <p className="mt-4 max-w-2xl text-sm leading-7 text-[rgba(21,35,29,0.72)]">
                        {category.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--sage)]">
                      <Sparkles size={16} />
                      {category.items.length} itens ativos
                    </div>
                  </div>

                  <div className="mt-8 grid gap-4 lg:grid-cols-2">
                    {category.items.map((item) => (
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
                            prepTime={item.prepTime}
                            signature={item.signature}
                            canOrder={canOrder}
                          />
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
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
