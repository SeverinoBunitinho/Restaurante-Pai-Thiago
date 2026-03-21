import {
  assignReservationTableAction,
  toggleRestaurantTableActiveAction,
} from "@/app/operacao/actions";
import { SectionHeading } from "@/components/section-heading";
import { requireRole } from "@/lib/auth";
import {
  getSeatingBoard,
  reservationStatusMeta,
} from "@/lib/staff-data";
import { formatReservationMoment } from "@/lib/utils";

const tableStateStyles = {
  livre: "bg-[rgba(95,123,109,0.1)] text-[var(--sage)]",
  reservada: "bg-[rgba(182,135,66,0.12)] text-[var(--gold)]",
  ocupada: "bg-[rgba(20,35,29,0.12)] text-[var(--forest)]",
  pausada: "bg-[rgba(138,93,59,0.12)] text-[var(--clay)]",
};

function getStatusView(status) {
  return (
    reservationStatusMeta[status] ?? {
      label: status,
      badge: "bg-[rgba(20,35,29,0.08)] text-[var(--forest)]",
    }
  );
}

export default async function OperacaoMesasPage() {
  const session = await requireRole(["waiter", "manager", "owner"]);
  const board = await getSeatingBoard();
  const canManageTables = session.role === "manager" || session.role === "owner";

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
        <div className="grid gap-5 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="luxury-card rounded-[2.2rem] p-6">
            <SectionHeading
              eyebrow="Acomodacao"
              title="Reservas que ainda precisam de mesa"
              description="Agora esta pagina cuida da distribuicao do salao. A equipe pode escolher a mesa ideal direto daqui."
              compact
            />

            <div className="mt-8 space-y-4">
              {board.opportunities.length ? (
                board.opportunities.map((reservation) => {
                  const statusView = getStatusView(reservation.status);

                  return (
                    <article
                      key={reservation.id}
                      className="rounded-[1.8rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="text-xl font-semibold text-[var(--forest)]">
                            {reservation.guestName}
                          </h3>
                          <p className="content-copy-safe mt-1 text-sm text-[rgba(21,35,29,0.72)]">
                            {formatReservationMoment(
                              reservation.date,
                              reservation.time,
                            )}{" "}
                            - {reservation.guests} pessoas
                          </p>
                        </div>
                        <span
                          className={`pill-wrap-safe rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${statusView.badge}`}
                        >
                          {statusView.label}
                        </span>
                      </div>

                      <div className="mt-4 space-y-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                        <p className="content-copy-safe">
                          <span className="font-semibold text-[var(--forest)]">
                            Ocasiao:
                          </span>{" "}
                          {reservation.occasion}
                        </p>
                        <p className="content-copy-safe">
                          <span className="font-semibold text-[var(--forest)]">
                            Area desejada:
                          </span>{" "}
                          {reservation.areaPreference}
                        </p>
                        <p className="content-copy-safe">
                          <span className="font-semibold text-[var(--forest)]">
                            Observacoes:
                          </span>{" "}
                          {reservation.notes || "Sem observacoes adicionais."}
                        </p>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        {reservation.suggestedTables.length ? (
                          reservation.suggestedTables.map((table) => (
                            <form
                              key={table.id}
                              action={assignReservationTableAction}
                              className="max-w-full"
                            >
                              <input
                                type="hidden"
                                name="reservationId"
                                value={reservation.id}
                              />
                              <input type="hidden" name="tableId" value={table.id} />
                              <button
                                type="submit"
                                className="pill-wrap-safe rounded-full border border-[rgba(20,35,29,0.12)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--forest)] transition hover:-translate-y-0.5"
                              >
                                {table.name} - {table.area}
                              </button>
                            </form>
                          ))
                        ) : (
                          <span className="pill-wrap-safe rounded-full border border-dashed border-[rgba(20,35,29,0.18)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(21,35,29,0.56)]">
                            Nenhuma mesa livre compativel agora
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })
              ) : (
                <article className="rounded-[1.6rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.5)] p-6">
                  <p className="text-lg font-semibold text-[var(--forest)]">
                    Todas as reservas ja possuem mesa
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.7)]">
                    O salao esta distribuido no momento. Quando surgir uma nova
                    chegada sem mesa, ela aparece aqui.
                  </p>
                </article>
              )}
            </div>
          </div>

          <div className="luxury-card rounded-[2.2rem] p-6">
            <SectionHeading
              eyebrow="Distribuicao atual"
              title="Reservas que ja estao ligadas a uma mesa"
              description="Assim a equipe consegue revisar rapidamente quem vai para onde e liberar ajustes sem voltar para outra tela."
              compact
            />

            <div className="mt-8 space-y-4">
              {board.assignments.length ? (
                board.assignments.map((assignment) => {
                  const statusView = getStatusView(assignment.status);

                  return (
                    <article
                      key={assignment.id}
                      className="rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="text-lg font-semibold text-[var(--forest)]">
                            {assignment.guestName}
                          </h3>
                          <p className="content-copy-safe mt-1 text-sm text-[rgba(21,35,29,0.72)]">
                            {assignment.assignedTable.name} - {assignment.assignedTable.area}
                          </p>
                        </div>
                        <span
                          className={`pill-wrap-safe rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${statusView.badge}`}
                        >
                          {statusView.label}
                        </span>
                      </div>

                      <p className="content-copy-safe mt-3 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                        {formatReservationMoment(assignment.date, assignment.time)} -{" "}
                        {assignment.guests} pessoas - {assignment.occasion}
                      </p>

                      <form
                        action={assignReservationTableAction}
                        className="mt-5 max-w-full"
                      >
                        <input
                          type="hidden"
                          name="reservationId"
                          value={assignment.id}
                        />
                        <input type="hidden" name="tableId" value="" />
                        <button
                          type="submit"
                          className="pill-wrap-safe rounded-full border border-[rgba(20,35,29,0.12)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--forest)] transition hover:-translate-y-0.5"
                        >
                          Remover mesa vinculada
                        </button>
                      </form>
                    </article>
                  );
                })
              ) : (
                <article className="rounded-[1.6rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.5)] p-6">
                  <p className="text-lg font-semibold text-[var(--forest)]">
                    Nenhuma vinculacao realizada ainda
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.7)]">
                    Assim que a equipe distribuir as mesas, os vinculos aparecem
                    aqui para revisao rapida.
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
            eyebrow="Setores e mesas"
            title="Controle visual do salao"
            description="Gerente e dono tambem podem pausar ou reativar mesas para reorganizar a casa em dias de pico."
            compact
          />

          <div className="mt-8 grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {board.tables.length ? (
              board.tables.map((table) => (
                <article
                  key={table.id}
                  className="rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--sage)]">
                        {table.area}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-[var(--forest)]">
                        {table.name}
                      </h3>
                    </div>
                    <span
                      className={`pill-wrap-safe rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${tableStateStyles[table.state] ?? tableStateStyles.livre}`}
                    >
                      {table.state}
                    </span>
                  </div>

                  <p className="content-copy-safe mt-4 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                    Capacidade para {table.capacity} pessoa(s).
                  </p>
                  <p className="content-copy-safe mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                    {table.detail}
                  </p>

                  <div className="mt-5">
                    {canManageTables ? (
                      <form action={toggleRestaurantTableActiveAction} className="max-w-full">
                        <input type="hidden" name="tableId" value={table.id} />
                        <input
                          type="hidden"
                          name="currentActive"
                          value={String(table.isActive)}
                        />
                        <button
                          type="submit"
                          className="pill-wrap-safe rounded-full border border-[rgba(20,35,29,0.12)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--forest)] transition hover:-translate-y-0.5"
                        >
                          {table.isActive ? "Pausar mesa" : "Reativar mesa"}
                        </button>
                      </form>
                    ) : (
                      <span className="pill-wrap-safe rounded-full border border-[rgba(20,35,29,0.12)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(21,35,29,0.56)]">
                        Controle do gerente ou dono
                      </span>
                    )}
                  </div>
                </article>
              ))
            ) : (
              <article className="rounded-[1.6rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.54)] p-6 sm:col-span-2 2xl:col-span-3">
                <p className="text-lg font-semibold text-[var(--forest)]">
                  Nenhuma mesa disponivel para leitura agora
                </p>
                <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                  O mapa do salao reaparece aqui assim que a estrutura voltar a
                  ser sincronizada pelo sistema.
                </p>
              </article>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
