import { SectionHeading } from "@/components/section-heading";
import { requireRole } from "@/lib/auth";
import { getForecastBoard } from "@/lib/operations-advanced-data";
import { formatCurrency } from "@/lib/utils";

function isCurrencyMetric(label) {
  return label.toLowerCase().includes("faturamento");
}

export default async function OperacaoPrevisaoPage() {
  await requireRole(["manager", "owner"]);
  const board = await getForecastBoard();

  return (
    <>
      <section className="pt-10">
        <div className="grid gap-4 rounded-[2.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.46)] px-5 py-5 shadow-[0_20px_60px_rgba(36,29,15,0.06)] sm:grid-cols-3 lg:px-8">
          {board.metrics.map((metric) => (
            <div key={metric.label} className="rounded-[1.5rem] px-4 py-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--sage)]">
                {metric.label}
              </p>
              <p className="mt-3 text-3xl font-semibold text-[var(--forest)]">
                {isCurrencyMetric(metric.label)
                  ? formatCurrency(Number(metric.value ?? 0))
                  : metric.value}
              </p>
              <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.68)]">
                {metric.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="pt-14">
        <div className="grid gap-5 lg:grid-cols-[0.96fr_1.04fr]">
          <div className="luxury-card rounded-[2.2rem] p-6">
            <SectionHeading
              eyebrow="Cardapio e demanda"
              title="Itens com maior tracao recente"
              description="Leitura dos ultimos 30 dias para ajustar producao e compras da cozinha."
              compact
            />

            <div className="mt-8 space-y-3">
              {board.topItems.length ? (
                board.topItems.map((item, index) => (
                  <article
                    key={item.name}
                    className="rounded-[1.5rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] px-4 py-4"
                  >
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--sage)]">
                      #{index + 1} item
                    </p>
                    <p className="mt-2 text-lg font-semibold text-[var(--forest)]">
                      {item.name}
                    </p>
                    <p className="mt-1 text-sm text-[rgba(21,35,29,0.72)]">
                      {item.quantity} unidade(s) no periodo
                    </p>
                  </article>
                ))
              ) : (
                <article className="rounded-[1.5rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.52)] px-4 py-4 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                  Ainda nao ha historico suficiente para indicar itens de maior tracao.
                </article>
              )}
            </div>
          </div>

          <div className="luxury-card-dark rounded-[2.2rem] p-6 text-[var(--cream)]">
            <p className="text-xs uppercase tracking-[0.28em] text-[rgba(217,185,122,0.92)]">
              Janela analisada
            </p>
            <h2 className="display-title page-section-title mt-4 text-white">
              Previsao baseada nos ultimos {board.coverageWindow}
            </h2>
            <p className="mt-4 text-sm leading-7 text-[rgba(255,247,232,0.76)]">
              Esta leitura consolida reservas, pedidos e comandas fechadas para apoiar decisao
              do gerente e do dono antes dos horarios de pico.
            </p>

            <div className="mt-8 space-y-3">
              {board.insights.map((insight) => (
                <article
                  key={insight}
                  className="rounded-[1.4rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm leading-7 text-[rgba(255,247,232,0.8)]"
                >
                  {insight}
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="pt-14">
        <div className="luxury-card rounded-[2.2rem] p-6">
          <SectionHeading
            eyebrow="Demanda por dia"
            title="Dias da semana com maior pressao de pedidos"
            description="Use este ranking para ajustar equipe, estoque e cobertura de atendimento."
            compact
          />

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {board.demandByWeekday.length ? (
              board.demandByWeekday.map((day) => (
                <article
                  key={day.weekday}
                  className="rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5"
                >
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--sage)]">
                    {day.weekday}
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-[var(--forest)]">
                    {day.count}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                    Pedido(s) registrados no periodo analisado.
                  </p>
                </article>
              ))
            ) : (
              <article className="rounded-[1.6rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.52)] p-5 md:col-span-2 xl:col-span-3">
                <p className="text-lg font-semibold text-[var(--forest)]">
                  Sem base suficiente para leitura por dia da semana
                </p>
                <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                  Assim que o historico aumentar, o ranking por dia aparece automaticamente.
                </p>
              </article>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
