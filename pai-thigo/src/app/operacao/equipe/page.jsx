import { toggleStaffDirectoryStatusAction } from "@/app/operacao/actions";
import { SectionHeading } from "@/components/section-heading";
import { getStaffRoleLabel, requireRole } from "@/lib/auth";
import { getStaffDirectoryBoard } from "@/lib/staff-data";

export default async function OperacaoEquipePage() {
  const session = await requireRole(["manager", "owner"]);
  const board = await getStaffDirectoryBoard();

  return (
    <>
      <section className="pt-10">
        <div className="luxury-card rounded-[2.2rem] p-6">
          <SectionHeading
            eyebrow="Equipe interna"
            title="Controle de acessos por funcionario"
            description="Gerente e dono podem acompanhar quem esta ativo no sistema. O gerente atua sobre garcons; o dono enxerga toda a equipe."
            compact
          />

          <div className="mt-8 space-y-4">
            {board.staff.length ? (
              board.staff.map((member) => {
                const canToggle =
                  member.role !== "owner" &&
                  (session.role === "owner" || member.role === "waiter");

                return (
                  <article
                    key={member.id}
                    className="rounded-[1.8rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-[var(--sage)]">
                          {getStaffRoleLabel(member.role)}
                        </p>
                        <h3 className="mt-2 text-xl font-semibold text-[var(--forest)]">
                          {member.full_name}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                          {member.email}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
                            member.active
                              ? "bg-[rgba(95,123,109,0.12)] text-[var(--sage)]"
                              : "bg-[rgba(138,93,59,0.12)] text-[var(--clay)]"
                          }`}
                        >
                          {member.active ? "ativo" : "pausado"}
                        </span>
                        <span
                          className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
                            member.hasAccount
                              ? "bg-[rgba(20,35,29,0.12)] text-[var(--forest)]"
                              : "bg-[rgba(182,135,66,0.12)] text-[var(--gold)]"
                          }`}
                        >
                          {member.hasAccount ? "conta pronta" : "sem conta"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      {canToggle ? (
                        <form action={toggleStaffDirectoryStatusAction}>
                          <input type="hidden" name="staffId" value={member.id} />
                          <input type="hidden" name="staffRole" value={member.role} />
                          <input
                            type="hidden"
                            name="nextActive"
                            value={String(!member.active)}
                          />
                          <button
                            type="submit"
                            className="rounded-full border border-[rgba(20,35,29,0.12)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--forest)] transition hover:-translate-y-0.5"
                          >
                            {member.active ? "Pausar acesso" : "Reativar acesso"}
                          </button>
                        </form>
                      ) : (
                        <span className="rounded-full border border-[rgba(20,35,29,0.12)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(21,35,29,0.54)]">
                          Controle reservado
                        </span>
                      )}

                      <p className="text-sm leading-6 text-[rgba(21,35,29,0.68)]">
                        {member.role === "owner"
                          ? "O perfil do dono permanece protegido dentro da operacao."
                          : "O status da conta reflete imediatamente na area interna da equipe."}
                      </p>
                    </div>
                  </article>
                );
              })
            ) : (
              <article className="rounded-[1.8rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.54)] p-6">
                <p className="text-lg font-semibold text-[var(--forest)]">
                  Nenhum perfil interno disponivel agora
                </p>
                <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                  A lista da equipe reaparece assim que o painel recuperar a
                  leitura do banco.
                </p>
              </article>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
