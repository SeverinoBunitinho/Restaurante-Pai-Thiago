import {
  createStaffShiftAction,
  deleteStaffShiftAction,
  updateStaffShiftStatusAction,
} from "@/app/operacao/actions";
import { SectionHeading } from "@/components/section-heading";
import { requireRole } from "@/lib/auth";
import { getShiftBoard } from "@/lib/operations-advanced-data";

const shiftStatusFlow = [
  { value: "planned", label: "Planejado" },
  { value: "confirmed", label: "Confirmar" },
  { value: "completed", label: "Concluir" },
  { value: "absent", label: "Ausencia" },
];

export default async function OperacaoEscalaPage({ searchParams }) {
  await requireRole(["manager", "owner"]);
  const resolvedSearchParams = await searchParams;
  const shiftNotice = Array.isArray(resolvedSearchParams?.shiftNotice)
    ? resolvedSearchParams.shiftNotice[0]
    : resolvedSearchParams?.shiftNotice;
  const shiftError = Array.isArray(resolvedSearchParams?.shiftError)
    ? resolvedSearchParams.shiftError[0]
    : resolvedSearchParams?.shiftError;
  const board = await getShiftBoard();

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
        <div className="grid gap-5 lg:grid-cols-[0.96fr_1.04fr]">
          <div className="luxury-card rounded-[2.2rem] p-6">
            <SectionHeading
              eyebrow="Nova escala"
              title="Registrar turnos por data com cobertura clara"
              description="A escala fica separada da tela de equipe para organizar planejamento e execucao no mesmo modulo."
              compact
            />

            {shiftError ? (
              <div className="mt-6 rounded-[1.4rem] border border-[rgba(138,93,59,0.2)] bg-[rgba(138,93,59,0.08)] px-4 py-3 text-sm leading-6 text-[var(--clay)]">
                {shiftError}
              </div>
            ) : null}

            {shiftNotice ? (
              <div className="mt-6 rounded-[1.4rem] border border-[rgba(95,123,109,0.2)] bg-[rgba(95,123,109,0.08)] px-4 py-3 text-sm leading-6 text-[var(--forest)]">
                {shiftNotice}
              </div>
            ) : null}

            <form action={createStaffShiftAction} className="mt-8 grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[var(--forest)]">Membro da equipe</span>
                <select
                  name="staffId"
                  defaultValue=""
                  className="rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none"
                  required
                >
                  <option value="" disabled>
                    Selecione
                  </option>
                  {board.roster.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.fullName} - {member.role === "manager" ? "Gerente" : "Garcom"}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[var(--forest)]">Cargo no turno</span>
                  <select
                    name="role"
                    defaultValue="waiter"
                    className="rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none"
                  >
                    <option value="waiter">Garcom</option>
                    <option value="manager">Gerente</option>
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[var(--forest)]">Tipo de turno</span>
                  <select
                    name="shiftLabel"
                    defaultValue="almoco"
                    className="rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none"
                  >
                    <option value="almoco">Almoco</option>
                    <option value="jantar">Jantar</option>
                    <option value="evento">Evento</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[var(--forest)]">Data</span>
                  <input
                    type="date"
                    name="shiftDate"
                    defaultValue={board.today}
                    className="rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none"
                    required
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[var(--forest)]">Inicio</span>
                  <input
                    type="time"
                    name="startsAt"
                    defaultValue="18:00"
                    className="rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none"
                    required
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[var(--forest)]">Fim</span>
                  <input
                    type="time"
                    name="endsAt"
                    defaultValue="23:00"
                    className="rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none"
                    required
                  />
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[var(--forest)]">Status inicial</span>
                <select
                  name="status"
                  defaultValue="planned"
                  className="rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none"
                >
                  {shiftStatusFlow.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[var(--forest)]">Observacoes</span>
                <textarea
                  name="notes"
                  rows={3}
                  maxLength={300}
                  className="rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none"
                  placeholder="Ajustes de cobertura, setor ou observacao operacional."
                />
              </label>

              <button type="submit" className="button-primary mt-1">
                Salvar turno
              </button>
            </form>
          </div>

          <div className="luxury-card-dark rounded-[2.2rem] p-6 text-[var(--cream)]">
            <p className="text-xs uppercase tracking-[0.28em] text-[rgba(217,185,122,0.92)]">
              Diretriz operacional
            </p>
            <h2 className="display-title page-section-title mt-4 text-white">
              Escala separada de acessos para reduzir confusao
            </h2>
            <p className="mt-4 text-sm leading-7 text-[rgba(255,247,232,0.76)]">
              O cadastro de usuarios continua em Equipe e a distribuicao de turnos acontece aqui.
              Assim voce evita telas repetidas e ganha fluxo mais profissional.
            </p>
          </div>
        </div>
      </section>

      <section className="pt-14">
        <div className="luxury-card rounded-[2.2rem] p-6">
          <SectionHeading
            eyebrow="Turnos futuros"
            title="Cobertura da equipe por data"
            description="Atualize status, confira horario e mantenha o turno organizado sem misturar com outros modulos."
            compact
          />

          <div className="mt-8 space-y-4">
            {board.shifts.length ? (
              board.shifts.map((shift) => {
                const statusView = board.statusMeta[shift.status] ?? board.statusMeta.planned;

                return (
                  <article
                    key={shift.id}
                    className="rounded-[1.8rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-[var(--sage)]">
                          {shift.shiftDate} - {shift.shiftLabel}
                        </p>
                        <h3 className="mt-2 text-xl font-semibold text-[var(--forest)]">
                          {shift.staffName}
                        </h3>
                        <p className="mt-1 text-sm text-[rgba(21,35,29,0.72)]">
                          {shift.role === "manager" ? "Gerente" : "Garcom"} | {shift.startsAt} - {shift.endsAt}
                        </p>
                        {shift.notes ? (
                          <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                            {shift.notes}
                          </p>
                        ) : null}
                      </div>
                      <span
                        className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${statusView.badge}`}
                      >
                        {statusView.label}
                      </span>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {shiftStatusFlow.map((status) => (
                        <form key={status.value} action={updateStaffShiftStatusAction}>
                          <input type="hidden" name="shiftId" value={shift.id} />
                          <input type="hidden" name="nextStatus" value={status.value} />
                          <button
                            type="submit"
                            disabled={shift.status === status.value}
                            className="pill-wrap-safe rounded-full border border-[rgba(20,35,29,0.12)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--forest)] transition enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            {status.label}
                          </button>
                        </form>
                      ))}

                      <form action={deleteStaffShiftAction}>
                        <input type="hidden" name="shiftId" value={shift.id} />
                        <button
                          type="submit"
                          className="pill-wrap-safe rounded-full border border-[rgba(138,93,59,0.18)] bg-[rgba(138,93,59,0.06)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--clay)] transition hover:-translate-y-0.5"
                        >
                          Remover
                        </button>
                      </form>
                    </div>
                  </article>
                );
              })
            ) : (
              <article className="rounded-[1.6rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.5)] p-6">
                <p className="text-lg font-semibold text-[var(--forest)]">
                  Nenhum turno registrado
                </p>
                <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                  Cadastre o primeiro turno acima para iniciar a cobertura da equipe.
                </p>
              </article>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
