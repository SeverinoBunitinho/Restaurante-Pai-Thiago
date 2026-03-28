import { setOperationalChecklistItemAction } from "@/app/operacao/actions";
import { SectionHeading } from "@/components/section-heading";
import { requireRole } from "@/lib/auth";
import { getOperationalChecklistBoard } from "@/lib/operations-advanced-data";

function formatMoment(value) {
  const parsed = new Date(value ?? "");

  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(parsed);
}

function ChecklistColumn({ title, shift, items }) {
  return (
    <article className="luxury-card rounded-[2rem] p-6">
      <p className="text-xs uppercase tracking-[0.24em] text-[var(--gold)]">{title}</p>
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div
            key={`${shift}-${item.key}`}
            className="rounded-[1.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--forest)]">{item.label}</p>
                <p className="mt-1 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                  {item.description}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                  item.checked
                    ? "bg-[rgba(95,123,109,0.12)] text-[var(--sage)]"
                    : "bg-[rgba(182,135,66,0.12)] text-[var(--gold)]"
                }`}
              >
                {item.checked ? "Concluido" : "Pendente"}
              </span>
            </div>

            <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[rgba(21,35,29,0.58)]">
              {item.updatedAt
                ? `Atualizado por ${item.actorName} em ${formatMoment(item.updatedAt)}`
                : "Sem registro hoje"}
            </p>

            <form action={setOperationalChecklistItemAction} className="mt-3">
              <input type="hidden" name="shift" value={shift} />
              <input type="hidden" name="itemKey" value={item.key} />
              <input type="hidden" name="itemLabel" value={item.label} />
              <input type="hidden" name="checked" value={String(!item.checked)} />
              <button type="submit" className="button-secondary w-full">
                {item.checked ? "Reabrir item" : "Marcar como concluido"}
              </button>
            </form>
          </div>
        ))}
      </div>
    </article>
  );
}

export default async function OperacaoChecklistsPage({ searchParams }) {
  await requireRole(["manager", "owner"]);
  const board = await getOperationalChecklistBoard();
  const resolvedSearchParams = await searchParams;
  const checklistNotice = Array.isArray(resolvedSearchParams?.checklistNotice)
    ? resolvedSearchParams.checklistNotice[0]
    : resolvedSearchParams?.checklistNotice;
  const checklistError = Array.isArray(resolvedSearchParams?.checklistError)
    ? resolvedSearchParams.checklistError[0]
    : resolvedSearchParams?.checklistError;

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
            eyebrow="Checklist operacional"
            title="Abertura e fechamento com rastreio real"
            description={`Controle diario em ${board.date}, com historico de quem marcou cada etapa.`}
            compact
          />

          <article className="mt-6 rounded-[1.4rem] border border-[rgba(20,35,29,0.1)] bg-[rgba(255,255,255,0.62)] px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--sage)]">
              Como funciona
            </p>
            <div className="mt-3 grid gap-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
              <p>1. Marque cada item da abertura quando a tarefa for concluida.</p>
              <p>2. No fim do turno, marque os itens de fechamento.</p>
              <p>3. Se clicar por engano, use Reabrir item para voltar.</p>
            </div>
          </article>

          {checklistError ? (
            <div className="mt-6 rounded-[1.3rem] border border-[rgba(138,93,59,0.2)] bg-[rgba(138,93,59,0.08)] px-4 py-3 text-sm leading-6 text-[var(--clay)]">
              {checklistError}
            </div>
          ) : null}
          {checklistNotice ? (
            <div className="mt-6 rounded-[1.3rem] border border-[rgba(95,123,109,0.2)] bg-[rgba(95,123,109,0.08)] px-4 py-3 text-sm leading-6 text-[var(--forest)]">
              {checklistNotice}
            </div>
          ) : null}

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <ChecklistColumn
              title="Abertura do turno"
              shift="opening"
              items={board.openingItems}
            />
            <ChecklistColumn
              title="Fechamento do turno"
              shift="closing"
              items={board.closingItems}
            />
          </div>
        </div>
      </section>

      <section className="pt-14">
        <div className="luxury-card rounded-[2.2rem] p-6">
          <SectionHeading
            eyebrow="Ultimos registros"
            title="Ultima atualizacao por item do checklist"
            description="Mostra somente a ultima mudanca de cada item para evitar repeticao."
            compact
          />

          <div className="mt-8 space-y-3">
            {board.latestEvents.length ? (
              board.latestEvents.map((event) => (
                <article
                  key={event.id}
                  className="rounded-[1.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] px-4 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--sage)]">
                        {event.shift === "opening" ? "Abertura" : "Fechamento"}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[var(--forest)]">
                        {event.itemLabel}
                      </p>
                      <p className="mt-1 text-sm text-[rgba(21,35,29,0.68)]">
                        {event.actorName} ({event.actorRole}) - {formatMoment(event.createdAt)}
                      </p>
                    </div>
                    <span className="rounded-full border border-[rgba(20,35,29,0.12)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--forest)]">
                      {event.checked ? "Concluido" : "Reaberto"}
                    </span>
                  </div>
                </article>
              ))
            ) : (
              <article className="rounded-[1.4rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.52)] px-4 py-4 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                Sem registros ainda hoje. Assim que a equipe iniciar o checklist, os eventos aparecem aqui.
              </article>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
