import Link from "next/link";

import { createStaffAccountAction, toggleStaffDirectoryStatusAction } from "@/app/operacao/actions";
import { SectionHeading } from "@/components/section-heading";
import { getStaffRoleLabel, requireRole } from "@/lib/auth";
import { getStaffDirectoryBoard } from "@/lib/staff-data";

function getRoleOptions(role) {
  return role === "owner"
    ? [
        { value: "waiter", label: "Garcom" },
        { value: "manager", label: "Gerente" },
      ]
    : [{ value: "waiter", label: "Garcom" }];
}

const staffRoleFilters = [
  { value: "all", label: "Todos" },
  { value: "waiter", label: "Garcons" },
  { value: "manager", label: "Gerentes" },
  { value: "owner", label: "Dono" },
];

function normalizeRoleFilter(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return staffRoleFilters.some((item) => item.value === normalized)
    ? normalized
    : "all";
}

export default async function OperacaoEquipePage({ searchParams }) {
  const session = await requireRole(["manager", "owner"]);
  const board = await getStaffDirectoryBoard();
  const resolvedSearchParams = await searchParams;
  const roleFilter = normalizeRoleFilter(
    Array.isArray(resolvedSearchParams?.cargo)
      ? resolvedSearchParams.cargo[0]
      : resolvedSearchParams?.cargo,
  );
  const staffNotice = Array.isArray(resolvedSearchParams?.staffNotice)
    ? resolvedSearchParams.staffNotice[0]
    : resolvedSearchParams?.staffNotice;
  const staffError = Array.isArray(resolvedSearchParams?.staffError)
    ? resolvedSearchParams.staffError[0]
    : resolvedSearchParams?.staffError;
  const roleOptions = getRoleOptions(session.role);
  const filteredStaff =
    roleFilter === "all"
      ? board.staff
      : board.staff.filter((member) => member.role === roleFilter);
  const waiters = board.staff.filter((member) => member.role === "waiter");

  return (
    <>
      <section className="pt-10">
        <div className="grid gap-5 lg:grid-cols-[0.96fr_1.04fr]">
          <div className="luxury-card rounded-[2.2rem] p-6">
            <SectionHeading
              eyebrow="Cadastro interno"
              title="Registrar equipe com permissoes certas"
              description="O gerente cria contas de garcom. O dono cria garcom e gerente, sempre com acesso interno separado do cliente."
              compact
            />

            {staffError ? (
              <div className="mt-6 rounded-[1.5rem] border border-[rgba(138,93,59,0.2)] bg-[rgba(138,93,59,0.08)] px-4 py-3 text-sm leading-6 text-[var(--clay)]">
                {staffError}
              </div>
            ) : null}

            {staffNotice ? (
              <div className="mt-6 rounded-[1.5rem] border border-[rgba(95,123,109,0.2)] bg-[rgba(95,123,109,0.08)] px-4 py-3 text-sm leading-6 text-[var(--forest)]">
                {staffNotice}
              </div>
            ) : null}

            <form action={createStaffAccountAction} className="mt-8 grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[var(--forest)]">Nome completo</span>
                <input
                  name="fullName"
                  type="text"
                  required
                  maxLength={120}
                  className="rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.78)] px-4 py-3 outline-none"
                  placeholder="Ex.: Marina Gestao"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[var(--forest)]">E-mail interno</span>
                <input
                  name="email"
                  type="email"
                  required
                  maxLength={160}
                  className="rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.78)] px-4 py-3 outline-none"
                  placeholder="nome@paithiago.com.br"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[var(--forest)]">Telefone</span>
                  <input
                    name="phone"
                    type="text"
                    required
                    maxLength={40}
                    className="rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.78)] px-4 py-3 outline-none"
                    placeholder="(11) 99999-9999"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[var(--forest)]">
                    Data de nascimento
                  </span>
                  <input
                    name="birthDate"
                    type="date"
                    required
                    className="rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.78)] px-4 py-3 outline-none"
                  />
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[var(--forest)]">Endereco</span>
                <input
                  name="address"
                  type="text"
                  required
                  maxLength={220}
                  className="rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.78)] px-4 py-3 outline-none"
                  placeholder="Rua, numero, bairro e complemento"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[var(--forest)]">CPF</span>
                  <input
                    name="cpf"
                    type="text"
                    required
                    maxLength={20}
                    className="rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.78)] px-4 py-3 outline-none"
                    placeholder="Somente numeros"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[var(--forest)]">
                    Grau de escolaridade
                  </span>
                  <select
                    name="educationLevel"
                    defaultValue=""
                    required
                    className="rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.78)] px-4 py-3 outline-none"
                  >
                    <option value="" disabled>
                      Selecione
                    </option>
                    <option value="fundamental">Fundamental</option>
                    <option value="medio">Medio</option>
                    <option value="tecnico">Tecnico</option>
                    <option value="superior">Superior</option>
                    <option value="pos_graduacao">Pos-graduacao</option>
                    <option value="mestrado">Mestrado</option>
                    <option value="doutorado">Doutorado</option>
                    <option value="outro">Outro</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[var(--forest)]">Login interno</span>
                  <input
                    name="login"
                    type="text"
                    maxLength={40}
                    className="rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.78)] px-4 py-3 outline-none"
                    placeholder="Ex.: marina.gestao"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[var(--forest)]">Cargo</span>
                  <select
                    name="role"
                    defaultValue={roleOptions[0]?.value}
                    className="rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.78)] px-4 py-3 outline-none"
                  >
                    {roleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[var(--forest)]">Senha provisoria</span>
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    maxLength={72}
                    className="rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.78)] px-4 py-3 outline-none"
                    placeholder="Minimo de 6 caracteres"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[var(--forest)]">
                    Confirmar senha
                  </span>
                  <input
                    name="passwordConfirm"
                    type="password"
                    required
                    minLength={6}
                    maxLength={72}
                    className="rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.78)] px-4 py-3 outline-none"
                    placeholder="Repita a senha informada"
                  />
                </label>
              </div>

              <button type="submit" className="button-primary mt-2 w-full">
                Salvar conta interna
              </button>
            </form>

            <div className="mt-6 rounded-[1.5rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.6)] p-5 text-sm leading-7 text-[rgba(21,35,29,0.72)]">
              {session.role === "owner"
                ? "O dono pode registrar gerente e garcom. Para gerente, preencha login interno e todos os dados cadastrais."
                : "O gerente registra apenas garcons. Isso protege a camada administrativa da casa."}
            </div>
          </div>

          <div className="luxury-card-dark rounded-[2.2rem] p-6 text-[var(--cream)]">
            <p className="text-xs uppercase tracking-[0.28em] text-[rgba(217,185,122,0.92)]">
              Regras do modulo
            </p>
            <h2 className="display-title page-section-title mt-4 text-white">
              Cadastro, acesso e hierarquia da equipe
            </h2>

            <div className="mt-8 grid gap-4">
              <article className="rounded-[1.5rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] px-4 py-4 text-sm leading-7 text-[rgba(255,247,232,0.8)]">
                Lista individual de garcons cadastrados: {waiters.length}.{" "}
                <Link
                  href="/operacao/equipe?cargo=waiter#lista-garcons"
                  className="font-semibold text-[var(--gold-soft)] underline underline-offset-4"
                >
                  Ver lista de garcons
                </Link>
              </article>

              {[
                "Garcom opera comandas, abre conta, associa produtos, cancela e fecha atendimento.",
                "Gerente acompanha toda a equipe, calcula comissao e emite relatorios de ocupacao.",
                "Dono acessa toda a operacao e pode cadastrar gerente para dividir a administracao.",
              ].map((item) => (
                <article
                  key={item}
                  className="rounded-[1.5rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] px-4 py-4 text-sm leading-7 text-[rgba(255,247,232,0.8)]"
                >
                  {item}
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="pt-14">
        <div className="luxury-card rounded-[2.2rem] p-6">
          <SectionHeading
            eyebrow="Equipe interna"
            title="Controle de acessos por funcionario"
            description="A lista abaixo mostra quem esta pronto para operar e quem pode ser pausado pela gestao."
            compact
          />

          <div className="mt-6 flex flex-wrap gap-3">
            {staffRoleFilters.map((filter) => (
              <Link
                key={filter.value}
                href={
                  filter.value === "all"
                    ? "/operacao/equipe"
                    : `/operacao/equipe?cargo=${filter.value}`
                }
                className={`filter-chip ${roleFilter === filter.value ? "filter-chip-active" : ""}`}
              >
                {filter.label}
                <span className="rounded-full bg-[rgba(20,35,29,0.08)] px-2 py-0.5 text-[10px] font-semibold tracking-normal text-current">
                  {filter.value === "all"
                    ? board.staff.length
                    : board.staff.filter((member) => member.role === filter.value).length}
                </span>
              </Link>
            ))}
          </div>

          <div
            id="lista-garcons"
            className="mt-6 rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.6)] p-4"
          >
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--sage)]">
              Lista individual de garcons cadastrados
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {waiters.length ? (
                waiters.map((waiter) => (
                  <span
                    key={waiter.id}
                    className="rounded-full border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.78)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--forest)]"
                  >
                    {waiter.full_name}
                  </span>
                ))
              ) : (
                <span className="text-sm text-[rgba(21,35,29,0.68)]">
                  Nenhum garcom cadastrado no momento.
                </span>
              )}
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {filteredStaff.length ? (
              filteredStaff.map((member) => {
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
                          : "O status da conta reflete imediatamente no acesso interno da equipe."}
                      </p>
                    </div>
                  </article>
                );
              })
            ) : (
              <article className="rounded-[1.8rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.54)] p-6">
                <p className="text-lg font-semibold text-[var(--forest)]">
                  Nenhum perfil encontrado para este filtro
                </p>
                <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                  Ajuste o filtro de cargo para visualizar outro grupo da equipe.
                </p>
              </article>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
