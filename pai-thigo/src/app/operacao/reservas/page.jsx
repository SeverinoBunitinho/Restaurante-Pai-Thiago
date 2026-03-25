import Link from "next/link";

import {
  markReservationNoShowAction,
  updateReservationStatusAction,
} from "@/app/operacao/actions";
import { SectionHeading } from "@/components/section-heading";
import { requireRole } from "@/lib/auth";
import { getReservationsBoard, reservationStatusMeta } from "@/lib/staff-data";
import { formatReservationMoment } from "@/lib/utils";

const reservationFilters = [
  { value: "all", label: "Todas" },
  { value: "pending", label: "Pendentes" },
  { value: "confirmed", label: "Confirmadas" },
  { value: "seated", label: "No salao" },
  { value: "completed", label: "Finalizadas" },
  { value: "cancelled", label: "Canceladas" },
];

const statusFlow = [
  { value: "pending", label: "Pendente" },
  { value: "confirmed", label: "Confirmar" },
  { value: "seated", label: "Acomodar" },
  { value: "completed", label: "Finalizar" },
  { value: "cancelled", label: "Cancelar" },
];

function getStatusView(status) {
  return (
    reservationStatusMeta[status] ?? {
      label: status,
      badge: "bg-[rgba(20,35,29,0.08)] text-[var(--forest)]",
    }
  );
}

export default async function OperacaoReservasPage({ searchParams }) {
  await requireRole(["waiter", "manager", "owner"]);
  const board = await getReservationsBoard();
  const resolvedSearchParams = await searchParams;
  const statusFilter = Array.isArray(resolvedSearchParams?.status)
    ? resolvedSearchParams.status[0]
    : resolvedSearchParams?.status;
  const activeStatus = reservationFilters.some(
    (item) => item.value === statusFilter,
  )
    ? statusFilter
    : "all";
  const reservationNotice = Array.isArray(resolvedSearchParams?.reservationNotice)
    ? resolvedSearchParams.reservationNotice[0]
    : resolvedSearchParams?.reservationNotice;
  const reservationError = Array.isArray(resolvedSearchParams?.reservationError)
    ? resolvedSearchParams.reservationError[0]
    : resolvedSearchParams?.reservationError;
  const filteredReservations =
    activeStatus === "all"
      ? board.reservations
      : board.reservations.filter(
          (reservation) => reservation.status === activeStatus,
        );
  const statusCounters = reservationFilters
    .filter((item) => item.value !== "all")
    .reduce((accumulator, item) => {
      accumulator[item.value] = board.reservations.filter(
        (reservation) => reservation.status === item.value,
      ).length;

      return accumulator;
    }, {});

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
            eyebrow="Fila operacional"
            title="Reservas com acoes reais para a equipe"
            description="Cada bloco abaixo permite mudar o status do atendimento. Garcom, gerente e dono conseguem agir diretamente daqui."
            compact
          />

          <div className="module-switch mt-6">
            <Link
              href="/operacao/reservas"
              className="module-tab module-tab-active"
            >
              Fila de reservas
            </Link>
            <Link
              href="/operacao/mesas"
              className="module-tab"
            >
              Mapa de mesas
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {reservationFilters.map((filter) => {
              const href =
                filter.value === "all"
                  ? "/operacao/reservas"
                  : `/operacao/reservas?status=${filter.value}`;
              const counter =
                filter.value === "all"
                  ? board.reservations.length
                  : statusCounters[filter.value];

              return (
                <Link
                  key={filter.value}
                  href={href}
                  className={`filter-chip ${
                    activeStatus === filter.value ? "filter-chip-active" : ""
                  }`}
                >
                  {filter.label}
                  <span className="rounded-full bg-[rgba(20,35,29,0.08)] px-2 py-0.5 text-[10px] font-semibold tracking-normal text-current">
                    {counter}
                  </span>
                </Link>
              );
            })}
          </div>

          {reservationNotice ? (
            <div className="mt-5 rounded-[1.4rem] border border-[rgba(95,123,109,0.22)] bg-[rgba(95,123,109,0.08)] px-4 py-3 text-sm leading-6 text-[var(--forest)]">
              {reservationNotice}
            </div>
          ) : null}

          {reservationError ? (
            <div className="mt-5 rounded-[1.4rem] border border-[rgba(138,93,59,0.22)] bg-[rgba(138,93,59,0.08)] px-4 py-3 text-sm leading-6 text-[var(--clay)]">
              {reservationError}
            </div>
          ) : null}

          <div className="mt-6 rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.62)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--sage)]">
                Fila inteligente de espera
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[rgba(20,35,29,0.12)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgba(21,35,29,0.66)]">
                  {board.waitlistSummary?.total ?? 0} na fila
                </span>
                <span className="rounded-full border border-[rgba(138,93,59,0.2)] bg-[rgba(138,93,59,0.08)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--clay)]">
                  {board.waitlistSummary?.urgent ?? 0} urgente(s)
                </span>
              </div>
            </div>

            {board.waitlist?.length ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {board.waitlist.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-[1.2rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.82)] px-4 py-3"
                  >
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--sage)]">
                      Posicao {item.position}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[var(--forest)]">
                      {item.guestName}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[rgba(21,35,29,0.68)]">
                      {item.time} | {item.guests} pessoas | {item.areaPreference}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[rgba(20,35,29,0.12)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[rgba(21,35,29,0.66)]">
                        ETA {item.etaMinutes} min
                      </span>
                      <span className="rounded-full border border-[rgba(182,135,66,0.2)] bg-[rgba(182,135,66,0.1)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--gold)]">
                        Prioridade {item.priority}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-[rgba(21,35,29,0.68)]">
                Sem fila de espera no momento. As acomodacoes estao fluindo com mesas disponiveis.
              </p>
            )}
          </div>

          <div className="mt-6 grid gap-3 rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-4 md:grid-cols-3">
            <article className="rounded-[1.2rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.72)] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--sage)]">
                No-show hoje
              </p>
              <p className="mt-2 text-2xl font-semibold text-[var(--forest)]">
                {board.noShow?.today ?? 0}
              </p>
            </article>
            <article className="rounded-[1.2rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.72)] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--sage)]">
                No-show (7 dias)
              </p>
              <p className="mt-2 text-2xl font-semibold text-[var(--forest)]">
                {board.noShow?.total7d ?? 0}
              </p>
            </article>
            <article className="rounded-[1.2rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.72)] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--sage)]">
                No-show (30 dias)
              </p>
              <p className="mt-2 text-2xl font-semibold text-[var(--forest)]">
                {board.noShow?.total30d ?? 0}
              </p>
            </article>
          </div>

          <div className="mt-8 space-y-4">
            {filteredReservations.length ? (
              filteredReservations.map((reservation) => {
                const statusView = getStatusView(reservation.status);

                return (
                  <article
                    key={reservation.id}
                    className="rounded-[1.8rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold text-[var(--forest)]">
                          {reservation.guestName}
                        </h3>
                        <p className="mt-1 text-sm text-[rgba(21,35,29,0.72)]">
                          {formatReservationMoment(
                            reservation.date,
                            reservation.time,
                          )}{" "}
                          - {reservation.guests} pessoas
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${statusView.badge}`}
                      >
                        {statusView.label}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
                      <div className="space-y-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                        <p>
                          <span className="font-semibold text-[var(--forest)]">
                            Ocasiao:
                          </span>{" "}
                          {reservation.occasion}
                        </p>
                        <p>
                          <span className="font-semibold text-[var(--forest)]">
                            Area:
                          </span>{" "}
                          {reservation.area}
                        </p>
                        <p>
                          <span className="font-semibold text-[var(--forest)]">
                            Observacoes:
                          </span>{" "}
                          {reservation.notes || "Sem observacoes adicionais."}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 md:max-w-[19rem] md:justify-end">
                        {statusFlow.map((status) => (
                          <form
                            key={status.value}
                            action={updateReservationStatusAction}
                            className="max-w-full"
                          >
                            <input
                              type="hidden"
                              name="reservationId"
                              value={reservation.id}
                            />
                            <input
                              type="hidden"
                              name="nextStatus"
                              value={status.value}
                            />
                            <input
                              type="hidden"
                              name="statusFilter"
                              value={activeStatus === "all" ? "" : activeStatus}
                            />
                            <button
                              type="submit"
                              disabled={reservation.status === status.value}
                              className="pill-wrap-safe rounded-full border border-[rgba(20,35,29,0.12)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--forest)] transition enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
                            >
                              {status.label}
                            </button>
                          </form>
                        ))}
                        {["pending", "confirmed", "seated"].includes(
                          reservation.status,
                        ) ? (
                          <form action={markReservationNoShowAction} className="max-w-full">
                            <input
                              type="hidden"
                              name="reservationId"
                              value={reservation.id}
                            />
                            <input
                              type="hidden"
                              name="statusFilter"
                              value={activeStatus === "all" ? "" : activeStatus}
                            />
                            <button
                              type="submit"
                              className="pill-wrap-safe rounded-full border border-[rgba(138,93,59,0.24)] bg-[rgba(138,93,59,0.08)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--clay)] transition hover:-translate-y-0.5"
                            >
                              No-show
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-[1.6rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.5)] p-6">
                <p className="text-lg font-semibold text-[var(--forest)]">
                  Nenhuma reserva encontrada nesta etapa
                </p>
                <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.7)]">
                  Ajuste o filtro acima para navegar por outra fase do atendimento
                  ou aguarde novas reservas entrarem no sistema.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
