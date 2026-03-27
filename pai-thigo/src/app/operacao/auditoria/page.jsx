import { SectionHeading } from "@/components/section-heading";
import { requireRole } from "@/lib/auth";
import { getAuditBoard } from "@/lib/operations-advanced-data";

function formatAuditMoment(value) {
  const parsed = new Date(value ?? "");

  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(parsed);
}

export default async function OperacaoAuditoriaPage() {
  await requireRole("owner");
  const board = await getAuditBoard();
  const visibleEvents = board.events.slice(0, 10);
  const hiddenEvents = board.events.slice(10);
  const eventTypeSummary = Object.entries(
    board.events.reduce((accumulator, event) => {
      const key = event.eventType || "evento";
      accumulator[key] = (accumulator[key] ?? 0) + 1;
      return accumulator;
    }, {}),
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4);

  return (
    <>
      <section className="pt-10">
        <div className="grid gap-4 rounded-[2.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.46)] px-5 py-5 shadow-[0_20px_60px_rgba(36,29,15,0.06)] sm:grid-cols-3 lg:px-8">
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
      </section>

      <section className="pt-14">
        <div className="luxury-card rounded-[2.2rem] p-6">
          <SectionHeading
            eyebrow="Trilha de seguranca"
            title="Eventos criticos da operacao"
            description="Painel compacto para conferir alteracoes da equipe sem gerar scroll excessivo."
            compact
          />

          {eventTypeSummary.length ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {eventTypeSummary.map(([eventType, count]) => (
                <span
                  key={eventType}
                  className="inline-flex items-center gap-2 rounded-full border border-[rgba(20,35,29,0.1)] bg-[rgba(255,255,255,0.72)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--forest)]"
                >
                  {eventType}
                  <strong className="rounded-full bg-[rgba(20,35,29,0.1)] px-2 py-0.5 text-[10px]">
                    {count}
                  </strong>
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-6 space-y-3">
            {board.events.length ? (
              visibleEvents.map((event) => (
                <article
                  key={event.id}
                  className="rounded-[1.3rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.66)] px-4 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--sage)]">
                        {event.eventType}
                      </p>
                      <h3 className="mt-1 text-base font-semibold text-[var(--forest)]">
                        {event.description || "Evento registrado"}
                      </h3>
                      <p className="mt-1 text-xs text-[rgba(21,35,29,0.72)]">
                        {event.entityType} {event.entityLabel ? `| ${event.entityLabel}` : ""}
                      </p>
                    </div>
                    <span className="rounded-full border border-[rgba(20,35,29,0.12)] px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--forest)]">
                      {formatAuditMoment(event.createdAt)}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-[rgba(21,35,29,0.72)]">
                    <span className="rounded-full border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.72)] px-2.5 py-1">
                      <strong className="text-[var(--forest)]">Ator:</strong> {event.actorName}
                    </span>
                    <span className="rounded-full border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.72)] px-2.5 py-1">
                      <strong className="text-[var(--forest)]">Perfil:</strong> {event.actorRole}
                    </span>
                    <span className="rounded-full border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.72)] px-2.5 py-1">
                      <strong className="text-[var(--forest)]">Registro:</strong> {event.entityId || "-"}
                    </span>
                  </div>

                  {event.metadata && Object.keys(event.metadata).length ? (
                    <details className="mt-3 rounded-[1rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.7)] px-3 py-2">
                      <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-[0.17em] text-[var(--gold)]">
                        Ver detalhes tecnicos
                      </summary>
                      <pre className="mt-2 overflow-auto text-[11px] leading-5 text-[rgba(21,35,29,0.72)]">
                        {JSON.stringify(event.metadata, null, 2)}
                      </pre>
                    </details>
                  ) : null}
                </article>
              ))
            ) : (
              <article className="rounded-[1.6rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.5)] p-6">
                <p className="text-lg font-semibold text-[var(--forest)]">
                  Nenhum evento de auditoria disponivel
                </p>
                <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                  Assim que a equipe realizar alteracoes operacionais, os eventos aparecem aqui.
                </p>
              </article>
            )}

            {hiddenEvents.length ? (
              <details className="rounded-[1.3rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.62)] px-4 py-3">
                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.18em] text-[var(--gold)]">
                  Ver historico completo ({hiddenEvents.length} evento(s))
                </summary>
                <div className="mt-3 space-y-2">
                  {hiddenEvents.map((event) => (
                    <article
                      key={event.id}
                      className="rounded-[1rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.72)] px-3 py-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-[var(--forest)]">
                          {event.description || "Evento registrado"}
                        </p>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[rgba(21,35,29,0.62)]">
                          {formatAuditMoment(event.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-[rgba(21,35,29,0.68)]">
                        {event.eventType} | {event.actorName}
                      </p>
                    </article>
                  ))}
                </div>
              </details>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
