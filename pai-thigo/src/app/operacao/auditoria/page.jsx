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
            description="A trilha ajuda o dono a auditar mudancas em equipe, comandas, reservas, cardapio e campanhas."
            compact
          />

          <div className="mt-8 space-y-4">
            {board.events.length ? (
              board.events.map((event) => (
                <article
                  key={event.id}
                  className="rounded-[1.8rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--sage)]">
                        {event.eventType}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-[var(--forest)]">
                        {event.description || "Evento registrado"}
                      </h3>
                      <p className="mt-2 text-sm text-[rgba(21,35,29,0.72)]">
                        {event.entityType} {event.entityLabel ? `| ${event.entityLabel}` : ""}
                      </p>
                    </div>
                    <span className="rounded-full border border-[rgba(20,35,29,0.12)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--forest)]">
                      {formatAuditMoment(event.createdAt)}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-[1.3rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.72)] px-4 py-3 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                      <p>
                        <span className="font-semibold text-[var(--forest)]">Ator:</span>{" "}
                        {event.actorName}
                      </p>
                      <p>
                        <span className="font-semibold text-[var(--forest)]">Perfil:</span>{" "}
                        {event.actorRole}
                      </p>
                    </div>
                    <div className="rounded-[1.3rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.72)] px-4 py-3 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                      <p>
                        <span className="font-semibold text-[var(--forest)]">Registro:</span>{" "}
                        {event.entityId || "-"}
                      </p>
                    </div>
                  </div>

                  {event.metadata && Object.keys(event.metadata).length ? (
                    <details className="mt-4 rounded-[1.3rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.66)] px-4 py-3">
                      <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gold)]">
                        Ver metadados
                      </summary>
                      <pre className="mt-3 overflow-auto text-xs leading-6 text-[rgba(21,35,29,0.72)]">
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
          </div>
        </div>
      </section>
    </>
  );
}
