import Link from "next/link";

import { updateReservationStatusAction } from "@/app/operacao/actions";
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
                            <button
                              type="submit"
                              disabled={reservation.status === status.value}
                              className="pill-wrap-safe rounded-full border border-[rgba(20,35,29,0.12)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--forest)] transition enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
                            >
                              {status.label}
                            </button>
                          </form>
                        ))}
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
