import {
  BellDot,
  BookUser,
  ClipboardCheck,
  LayoutGrid,
  Megaphone,
  ShieldCheck,
  Table2,
  UtensilsCrossed,
} from "lucide-react";

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

function formatSlugLabel(value) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");

  if (!normalized) {
    return "Evento";
  }

  return normalized.replace(/\b\w/g, (character) => character.toUpperCase());
}

function getAuditEventVisual(eventType) {
  const normalized = String(eventType ?? "").toLowerCase();

  if (normalized.includes("reservation")) {
    return {
      Icon: Table2,
      label: "Reservas e mesas",
    };
  }

  if (normalized.includes("order") || normalized.includes("service_check")) {
    return {
      Icon: ClipboardCheck,
      label: "Pedidos e contas",
    };
  }

  if (normalized.includes("menu")) {
    return {
      Icon: UtensilsCrossed,
      label: "Cardapio",
    };
  }

  if (normalized.includes("campaign") || normalized.includes("coupon")) {
    return {
      Icon: Megaphone,
      label: "Campanhas",
    };
  }

  if (normalized.includes("staff") || normalized.includes("shift")) {
    return {
      Icon: BookUser,
      label: "Equipe",
    };
  }

  if (normalized.includes("table")) {
    return {
      Icon: LayoutGrid,
      label: "Salao",
    };
  }

  if (normalized.includes("checklist")) {
    return {
      Icon: Ticket,
      label: "Checklist",
    };
  }

  return {
    Icon: ShieldCheck,
    label: "Operacao",
  };
}

export default async function OperacaoAuditoriaPage() {
  await requireRole("owner");
  const board = await getAuditBoard();
  const visibleEvents = board.events.slice(0, 8);
  const hiddenEvents = board.events.slice(8);
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
            description="Leitura executiva da trilha operacional com foco no que mudou, quem executou e quando aconteceu."
            compact
          />

          <div className="mt-6 grid gap-4 xl:grid-cols-[0.34fr_0.66fr]">
            <aside className="rounded-[1.5rem] border border-[rgba(20,35,29,0.1)] bg-[rgba(255,255,255,0.62)] px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold)]">
                Como ler esta tela
              </p>
              <div className="mt-3 space-y-2 text-sm leading-6 text-[rgba(21,35,29,0.74)]">
                <p>1. Veja o tipo e o horario do evento.</p>
                <p>2. Confira quem executou e qual perfil.</p>
                <p>3. Abra detalhes tecnicos apenas quando necessario.</p>
              </div>

              {eventTypeSummary.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {eventTypeSummary.map(([eventType, count]) => (
                    <span
                      key={eventType}
                      className="inline-flex items-center gap-2 rounded-full border border-[rgba(20,35,29,0.1)] bg-[rgba(255,255,255,0.8)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--forest)]"
                    >
                      {formatSlugLabel(eventType)}
                      <strong className="rounded-full bg-[rgba(20,35,29,0.1)] px-1.5 py-0.5 text-[10px]">
                        {count}
                      </strong>
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="mt-4 rounded-[1rem] border border-[rgba(20,35,29,0.1)] bg-[rgba(255,255,255,0.78)] px-3 py-2 text-xs text-[rgba(21,35,29,0.7)]">
                <span className="inline-flex items-center gap-2 font-semibold uppercase tracking-[0.12em] text-[var(--sage)]">
                  <BellDot size={13} />
                  Atualizacao ao vivo
                </span>
                <p className="mt-1">
                  Esta trilha recebe novas alteracoes automaticamente.
                </p>
              </div>
            </aside>

            <div className="space-y-3">
              {board.events.length ? (
                visibleEvents.map((event) => {
                  const visual = getAuditEventVisual(event.eventType);

                  return (
                    <article
                      key={event.id}
                      className="rounded-[1.4rem] border border-[rgba(20,35,29,0.09)] bg-[rgba(255,255,255,0.68)] px-4 py-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[rgba(182,135,66,0.26)] bg-[rgba(255,255,255,0.74)] text-[var(--gold)]">
                              <visual.Icon size={14} />
                            </span>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--sage)]">
                              {visual.label}
                            </p>
                          </div>
                          <h3 className="mt-2 text-base font-semibold text-[var(--forest)]">
                            {event.description || "Evento registrado"}
                          </h3>
                          <p className="mt-1 text-xs text-[rgba(21,35,29,0.72)]">
                            {formatSlugLabel(event.eventType)} | {event.entityType}{" "}
                            {event.entityLabel ? `| ${event.entityLabel}` : ""}
                          </p>
                        </div>
                        <span className="rounded-full border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.78)] px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--forest)]">
                          {formatAuditMoment(event.createdAt)}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-[rgba(21,35,29,0.72)]">
                        <span className="rounded-full border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.78)] px-2.5 py-1">
                          <strong className="text-[var(--forest)]">Ator:</strong> {event.actorName}
                        </span>
                        <span className="rounded-full border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.78)] px-2.5 py-1">
                          <strong className="text-[var(--forest)]">Perfil:</strong> {formatSlugLabel(event.actorRole)}
                        </span>
                        <span className="rounded-full border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.78)] px-2.5 py-1">
                          <strong className="text-[var(--forest)]">Registro:</strong> {event.entityId || "-"}
                        </span>
                      </div>

                      {event.metadata && Object.keys(event.metadata).length ? (
                        <details className="mt-3 rounded-[1rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.74)] px-3 py-2">
                          <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-[0.17em] text-[var(--gold)]">
                            Ver detalhes tecnicos
                          </summary>
                          <pre className="mt-2 overflow-auto text-[11px] leading-5 text-[rgba(21,35,29,0.72)]">
                            {JSON.stringify(event.metadata, null, 2)}
                          </pre>
                        </details>
                      ) : null}
                    </article>
                  );
                })
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
                          {formatSlugLabel(event.eventType)} | {event.actorName}
                        </p>
                      </article>
                    ))}
                  </div>
                </details>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
