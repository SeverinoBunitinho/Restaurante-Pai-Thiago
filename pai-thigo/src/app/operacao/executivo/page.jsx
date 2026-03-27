import { SectionHeading } from "@/components/section-heading";
import { requireRole } from "@/lib/auth";
import { getExecutiveBoard } from "@/lib/staff-data";

export default async function OperacaoExecutivoPage() {
  await requireRole("owner");
  const board = await getExecutiveBoard();

  return (
    <>
      <section className="pt-10">
        <div className="grid gap-4 rounded-[2.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.46)] px-5 py-5 shadow-[0_20px_60px_rgba(36,29,15,0.06)] sm:grid-cols-2 xl:grid-cols-3 lg:px-8">
          {board.metrics.length ? (
            board.metrics.map((metric) => (
              <div key={metric.label} className="rounded-[1.5rem] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--sage)]">
                  {metric.label}
                </p>
                <p className="mt-3 text-3xl font-semibold text-[var(--forest)]">
                  {metric.value}
                </p>
                <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.68)]">
                  {metric.description}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-[1.5rem] px-4 py-4 sm:col-span-2 xl:col-span-3">
              <p className="text-sm leading-6 text-[rgba(21,35,29,0.68)]">
                A leitura executiva volta a aparecer aqui assim que a conexao
                com o banco for restabelecida.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="pt-14">
        <div className="grid gap-5 lg:grid-cols-[0.98fr_1.02fr]">
          <div className="luxury-card rounded-[2.2rem] p-6">
            <SectionHeading
              eyebrow="Leitura do dono"
              title="Indicadores e sinais do restaurante"
              description="Essa camada foi pensada para o dono enxergar movimento, estrutura e proximos pontos de decisao."
              compact
            />

            <div className="mt-8 space-y-4">
              {board.insights.length ? (
                board.insights.map((insight) => (
                  <article
                    key={insight}
                    className="rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5 text-sm leading-7 text-[rgba(21,35,29,0.74)]"
                  >
                    {insight}
                  </article>
                ))
              ) : (
                <article className="rounded-[1.6rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.54)] p-5 text-sm leading-7 text-[rgba(21,35,29,0.74)]">
                  Nenhum insight executivo disponivel no momento.
                </article>
              )}
            </div>
          </div>

          <div className="luxury-card-dark rounded-[2.2rem] p-6 text-[var(--cream)]">
            <p className="text-xs uppercase tracking-[0.28em] text-[rgba(217,185,122,0.92)]">
              Direcionamento executivo
            </p>
            <h2 className="display-title page-section-title mt-4 text-white">
              Prioridades do dono para manter a casa fluindo
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[rgba(255,247,232,0.74)]">
              Esta area foi simplificada para reduzir excesso de informacao.
              O foco aqui e orientar a tomada de decisao sem repetir modulos.
            </p>

            <div className="mt-7 space-y-3">
              <article className="rounded-[1.4rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[rgba(217,185,122,0.92)]">
                  1. Leitura inicial
                </p>
                <p className="mt-2 text-sm leading-7 text-[rgba(255,247,232,0.74)]">
                  Comece pelas pendencias de reservas e pedidos para decidir a
                  prioridade operacional do turno.
                </p>
              </article>

              <article className="rounded-[1.4rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[rgba(217,185,122,0.92)]">
                  2. Ajuste de estrutura
                </p>
                <p className="mt-2 text-sm leading-7 text-[rgba(255,247,232,0.74)]">
                  Reorganize equipe, salao e disponibilidade do cardapio para
                  manter atendimento consistente.
                </p>
              </article>

              <article className="rounded-[1.4rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[rgba(217,185,122,0.92)]">
                  3. Revisao final
                </p>
                <p className="mt-2 text-sm leading-7 text-[rgba(255,247,232,0.74)]">
                  Feche o ciclo com relatorios e indicadores para orientar as
                  proximas decisoes da casa.
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
