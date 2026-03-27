import { ChefHat, Sparkles, Trash2 } from "lucide-react";

import {
  deleteMenuItemAction,
  toggleMenuItemAvailabilityAction,
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

          <div className="mt-8 space-y-6">
            {board.categories.length ? (
              board.categories.map((category) => (
                <section
                  key={category.id}
                  className="rounded-[1.8rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5"
                >
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

                  <div className="mt-6 grid gap-4 lg:grid-cols-2">
                    {category.items.length ? (
                      category.items.map((item) => (
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
                              {item.stockQuantity == null
                                ? "sem controle ativo"
                                : `${item.stockQuantity} unidade(s)`}
                            </p>
                            {item.stockQuantity != null ? (
                              <p>
                                <span className="font-semibold text-[var(--forest)]">
                                  Alerta:
                                </span>{" "}
                                {item.lowStockThreshold} unidade(s)
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
                                item.available
                                  ? "bg-[rgba(95,123,109,0.12)] text-[var(--sage)]"
                                  : "bg-[rgba(138,93,59,0.12)] text-[var(--clay)]"
                              }`}
                            >
                              {item.available ? "ativo" : "pausado"}
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
                        </article>
                      ))
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
                </section>
              ))
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
