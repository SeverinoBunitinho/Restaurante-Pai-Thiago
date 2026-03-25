import {
  reportOperationalIncidentAction,
  resolveOperationalIncidentAction,
} from "@/app/operacao/actions";
import { SectionHeading } from "@/components/section-heading";
import { requireRole } from "@/lib/auth";
import { getIncidentsBoard } from "@/lib/operations-advanced-data";

const severityOptions = [
  { value: "low", label: "Baixa" },
  { value: "medium", label: "Media" },
  { value: "high", label: "Alta" },
  { value: "critical", label: "Critica" },
];

const categoryOptions = [
  { value: "atendimento", label: "Atendimento" },
  { value: "cozinha", label: "Cozinha" },
  { value: "salao", label: "Salao" },
  { value: "sistema", label: "Sistema" },
  { value: "financeiro", label: "Financeiro" },
  { value: "outro", label: "Outro" },
];

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

function getSeverityBadge(severity) {
  if (severity === "critical") {
    return "bg-[rgba(138,93,59,0.16)] text-[var(--clay)]";
  }

  if (severity === "high") {
    return "bg-[rgba(182,135,66,0.16)] text-[var(--gold)]";
  }

  if (severity === "medium") {
    return "bg-[rgba(20,35,29,0.12)] text-[var(--forest)]";
  }

  return "bg-[rgba(95,123,109,0.12)] text-[var(--sage)]";
}

export default async function OperacaoIncidentesPage({ searchParams }) {
  const session = await requireRole(["waiter", "manager", "owner"]);
  const board = await getIncidentsBoard();
  const resolvedSearchParams = await searchParams;
  const incidentNotice = Array.isArray(resolvedSearchParams?.incidentNotice)
    ? resolvedSearchParams.incidentNotice[0]
    : resolvedSearchParams?.incidentNotice;
  const incidentError = Array.isArray(resolvedSearchParams?.incidentError)
    ? resolvedSearchParams.incidentError[0]
    : resolvedSearchParams?.incidentError;
  const canResolve = ["manager", "owner"].includes(session.role);

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
        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="luxury-card rounded-[2.2rem] p-6">
            <SectionHeading
              eyebrow="Novo incidente"
              title="Registrar ocorrencia operacional"
              description="Cada incidente fica rastreado com categoria, severidade e responsavel."
              compact
            />

            {incidentError ? (
              <div className="mt-6 rounded-[1.3rem] border border-[rgba(138,93,59,0.2)] bg-[rgba(138,93,59,0.08)] px-4 py-3 text-sm leading-6 text-[var(--clay)]">
                {incidentError}
              </div>
            ) : null}
            {incidentNotice ? (
              <div className="mt-6 rounded-[1.3rem] border border-[rgba(95,123,109,0.2)] bg-[rgba(95,123,109,0.08)] px-4 py-3 text-sm leading-6 text-[var(--forest)]">
                {incidentNotice}
              </div>
            ) : null}

            <form action={reportOperationalIncidentAction} className="mt-8 grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[var(--forest)]">Categoria</span>
                  <select
                    name="category"
                    defaultValue="atendimento"
                    className="rounded-[1.1rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none"
                  >
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[var(--forest)]">Severidade</span>
                  <select
                    name="severity"
                    defaultValue="medium"
                    className="rounded-[1.1rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none"
                  >
                    {severityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[var(--forest)]">Titulo</span>
                <input
                  name="title"
                  required
                  maxLength={120}
                  className="rounded-[1.1rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none"
                  placeholder="Ex.: Atraso no passe da cozinha"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[var(--forest)]">Local</span>
                <input
                  name="location"
                  maxLength={80}
                  className="rounded-[1.1rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none"
                  placeholder="Ex.: Salao principal / Setor B"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[var(--forest)]">Descricao</span>
                <textarea
                  name="description"
                  rows={4}
                  required
                  maxLength={480}
                  className="rounded-[1.1rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none"
                  placeholder="Descreva o ocorrido e impacto no atendimento."
                />
              </label>

              <button type="submit" className="button-primary">
                Registrar incidente
              </button>
            </form>
          </div>

          <div className="luxury-card rounded-[2.2rem] p-6">
            <SectionHeading
              eyebrow="Abertos"
              title="Fila de incidentes em acompanhamento"
              description="Ocorrencias abertas por ordem de criticidade para acao rapida."
              compact
            />

            <div className="mt-8 space-y-4">
              {board.openIncidents.length ? (
                board.openIncidents.map((incident) => (
                  <article
                    key={incident.id}
                    className="rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--sage)]">
                          {incident.category}
                        </p>
                        <h3 className="mt-2 text-lg font-semibold text-[var(--forest)]">
                          {incident.title}
                        </h3>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getSeverityBadge(incident.severity)}`}
                      >
                        {incident.severity}
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                      {incident.description}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[rgba(21,35,29,0.58)]">
                      {incident.location ? `${incident.location} | ` : ""}
                      Aberto por {incident.reportedBy} em {formatMoment(incident.createdAt)}
                    </p>

                    {canResolve ? (
                      <form action={resolveOperationalIncidentAction} className="mt-4 grid gap-3">
                        <input type="hidden" name="incidentId" value={incident.id} />
                        <input type="hidden" name="incidentTitle" value={incident.title} />
                        <textarea
                          name="resolutionNote"
                          rows={2}
                          maxLength={280}
                          className="rounded-[1rem] border border-[rgba(20,35,29,0.12)] bg-white px-3 py-2 text-sm outline-none"
                          placeholder="Resumo da resolucao (opcional)"
                        />
                        <button type="submit" className="button-secondary w-full">
                          Marcar como resolvido
                        </button>
                      </form>
                    ) : (
                      <p className="mt-4 text-sm leading-6 text-[rgba(21,35,29,0.7)]">
                        Resolucao disponivel para gerente e dono.
                      </p>
                    )}
                  </article>
                ))
              ) : (
                <article className="rounded-[1.6rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.52)] p-5">
                  <p className="text-lg font-semibold text-[var(--forest)]">
                    Nenhum incidente aberto
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                    Fluxo operacional sob controle no momento.
                  </p>
                </article>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="pt-14">
        <div className="luxury-card rounded-[2.2rem] p-6">
            <SectionHeading
              eyebrow="Resolvidos"
              title="Historico recente de resolucoes"
              description="Ultimos incidentes concluidos para leitura de recorrencia."
              compact
            />

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {board.resolvedIncidents.length ? (
              board.resolvedIncidents.slice(0, 8).map((incident) => (
                <article
                  key={incident.id}
                  className="rounded-[1.5rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-4"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--sage)]">
                    {incident.category}
                  </p>
                  <p className="mt-2 text-base font-semibold text-[var(--forest)]">
                    {incident.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                    {incident.resolutionNote || "Resolucao registrada sem observacao adicional."}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[rgba(21,35,29,0.58)]">
                    Resolvido por {incident.resolvedBy || "Equipe"} em{" "}
                    {formatMoment(incident.resolvedAt)}
                  </p>
                </article>
              ))
            ) : (
              <article className="rounded-[1.6rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.52)] p-5 md:col-span-2">
                <p className="text-lg font-semibold text-[var(--forest)]">
                  Sem incidentes resolvidos ainda
                </p>
                <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                  Assim que houver resolucao, o historico aparece automaticamente.
                </p>
              </article>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
