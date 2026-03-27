import { BarChart3, Radar, Sparkles, UsersRound } from "lucide-react";

import { SectionHeading } from "@/components/section-heading";
import { requireRole } from "@/lib/auth";
import { getExecutiveBoard } from "@/lib/staff-data";

export default async function OperacaoExecutivoPage() {
  await requireRole("owner");
  const board = await getExecutiveBoard();
  const prioritySteps = [
    {
      id: "01",
      title: "Leitura inicial",
      description:
        "Comece pelas pendencias de reservas e pedidos para decidir a prioridade operacional do turno.",
      icon: Radar,
    },
    {
      id: "02",
      title: "Ajuste de estrutura",
      description:
        "Reorganize equipe, salao e disponibilidade do cardapio para manter atendimento consistente.",
      icon: UsersRound,
    },
    {
      id: "03",
      title: "Revisao final",
      description:
        "Feche o ciclo com relatorios e indicadores para orientar as proximas decisoes da casa.",
      icon: BarChart3,
    },
  ];

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
            <div className="executive-priority-shell">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.28em] text-[rgba(217,185,122,0.92)]">
                  Direcionamento executivo
                </p>
                <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(217,185,122,0.2)] bg-[rgba(255,255,255,0.06)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[rgba(255,247,232,0.84)]">
                  <Sparkles size={12} />
                  fluxo do dono
                </span>
              </div>

              <h2 className="display-title page-section-title mt-4 text-white">
                Prioridades do dono para manter a casa fluindo
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[rgba(255,247,232,0.74)]">
                Sequencia pratica para ler o turno, agir com clareza e encerrar
                com decisao orientada por dados.
              </p>

              <div className="executive-priority-grid mt-7">
                {prioritySteps.map((step) => (
                  <article key={step.id} className="executive-priority-card px-4 py-4">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[rgba(217,185,122,0.24)] bg-[rgba(255,255,255,0.08)] text-[var(--gold-soft)]">
                        <step.icon size={16} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgba(217,185,122,0.92)]">
                          {step.id}. {step.title}
                        </p>
                        <p className="mt-2 text-sm leading-7 text-[rgba(255,247,232,0.76)]">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
