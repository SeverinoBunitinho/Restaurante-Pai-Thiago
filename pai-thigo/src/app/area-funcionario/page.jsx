import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  KeyRound,
  Route,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getStaffRoleLabel, requireRole } from "@/lib/auth";
import { getStaffPanel, getStaffModules } from "@/lib/staff-modules";
import { getStaffDashboard } from "@/lib/site-data";

const roleBlueprints = {
  waiter: {
    eyebrow: "Jornada do garcom",
    title: "seu portal com foco em comandas e ritmo de atendimento",
    description:
      "Use esta area como ponto de partida do turno: abrir conta de mesa, lancar itens, acompanhar reservas e fechar com conferencia.",
    nextKey: "comandas",
    workflow: [
      {
        title: "Abrir conta da mesa",
        text: "Entre em comandas para localizar a mesa, abrir a conta e associar os primeiros produtos do atendimento.",
        key: "comandas",
      },
      {
        title: "Conduzir chegadas",
        text: "Passe por reservas e acomodacao para alinhar chegada, setor e mesa certa no salao.",
        key: "reservas",
      },
      {
        title: "Fechar com conferencia",
        text: "Busque a mesa, confira pedidos, total e forma de pagamento antes de emitir o relatorio para impressao.",
        key: "comandas",
      },
    ],
    permissions: [
      "Pode abrir conta, associar produtos, cancelar conta aberta e fechar conta por mesa.",
      "Pode acomodar reservas em mesas e conduzir o fluxo do salao durante o atendimento.",
      "Nao altera equipe, cardapio estrategico, comissoes ou visao executiva.",
    ],
  },
  manager: {
    eyebrow: "Jornada do gerente",
    title: "seu portal para coordenar equipe, comandas e resultados",
    description:
      "Aqui ficam os acessos essenciais para distribuir a equipe, acompanhar comandas, revisar comissoes e manter o salao organizado.",
    nextKey: "equipe",
    workflow: [
      {
        title: "Cadastrar e cobrir o turno",
        text: "Verifique equipe e acessos antes do pico, cadastre garcons internos e ajuste quem esta liberado no sistema.",
        key: "equipe",
      },
      {
        title: "Ler comandas e fechamento",
        text: "Acompanhe contas abertas, fechamento por mesa e fluxo dos pedidos do site para evitar gargalos.",
        key: "comandas",
      },
      {
        title: "Calcular comissoes e ocupacao",
        text: "Abra relatorios para acompanhar comissao dos garcons, ocupacao das mesas e giro do salao.",
        key: "relatorios",
      },
    ],
    permissions: [
      "Pode cadastrar garcons internos e gerenciar acessos do time operacional.",
      "Pode pausar mesas, distribuir salao, controlar itens do cardapio e acompanhar comandas do turno.",
      "Pode calcular comissoes e ler ocupacao, mas nao mexe na camada reservada do dono.",
    ],
  },
  owner: {
    eyebrow: "Jornada do dono",
    title: "seu portal para liderar estrategia e operacao da casa",
    description:
      "Esta area centraliza indicadores, equipe e decisoes executivas antes da entrada nos modulos operacionais.",
    nextKey: "executivo",
    workflow: [
      {
        title: "Ler os sinais da casa",
        text: "Abra a visao executiva para entender reservas, base de clientes, equipe, capacidade ativa e ritmo geral da casa.",
        key: "executivo",
      },
      {
        title: "Estruturar lideranca e equipe",
        text: "Passe por equipe para cadastrar gerentes, liberar acessos e manter a camada interna sob controle.",
        key: "equipe",
      },
      {
        title: "Ler comissao e ocupacao",
        text: "Use os relatorios para acompanhar giro das mesas, desempenho do salao e comissao prevista do time.",
        key: "relatorios",
      },
    ],
    permissions: [
      "Pode acessar e alterar toda a camada operacional interna, inclusive comandas e fechamentos.",
      "Pode cadastrar gerente e garcom, controlar equipe, salao, cardapio, configuracoes da casa e modulos executivos.",
      "Recebe a leitura mais ampla do negocio, da ocupacao e da experiencia.",
    ],
  },
};

function getModuleLink(modules, key, fallback = "/operacao") {
  return modules.find((item) => item.key === key)?.href ?? fallback;
}

export default async function AreaFuncionarioPage() {
  const session = await requireRole(["waiter", "manager", "owner"]);
  const panel = getStaffPanel(session.role);
  const modules = getStaffModules(session.role);
  const dashboard = await getStaffDashboard(session.role);
  const blueprint = roleBlueprints[session.role] ?? roleBlueprints.waiter;
  const firstName = session.profile.full_name.split(" ")[0];
  const nextHref = getModuleLink(modules, blueprint.nextKey, "/operacao");

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="pb-16">
        <section className="shell pt-12">
          <div className="grid gap-5 lg:grid-cols-[1fr_0.94fr]">
            <div className="luxury-card-dark rounded-[2.4rem] p-7 text-[var(--cream)] md:p-10">
              <p className="text-xs uppercase tracking-[0.28em] text-[rgba(217,185,122,0.92)]">
                {blueprint.eyebrow}
              </p>
              <h1 className="display-title page-hero-title mt-4 text-white">
                {firstName}, {blueprint.title}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-[rgba(255,247,232,0.74)]">
                {blueprint.description}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <span className="staff-status-chip inline-flex items-center gap-2 rounded-full border border-[rgba(217,185,122,0.2)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[rgba(255,247,232,0.82)]">
                  <BadgeCheck size={14} />
                  acesso validado
                </span>
                <span className="staff-status-chip inline-flex items-center gap-2 rounded-full border border-[rgba(217,185,122,0.2)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[rgba(255,247,232,0.82)]">
                  <ShieldCheck size={14} />
                  perfil {getStaffRoleLabel(session.role).toLowerCase()}
                </span>
              </div>

              <div className="mt-8 space-y-3">
                {dashboard.alerts.map((alert) => (
                  <div
                    key={alert}
                    className="staff-inline-note rounded-[1.4rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm leading-6 text-[rgba(255,247,232,0.8)]"
                  >
                    {alert}
                  </div>
                ))}
              </div>
            </div>

            <div className="luxury-card rounded-[2.4rem] p-7 md:p-10">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--gold)]">
                Credencial interna
              </p>
              <h2 className="mt-4 text-3xl font-semibold text-[var(--forest)]">
                Sua base de acesso no Pai Thiago
              </h2>

              <div className="mt-6 grid gap-4">
                <article className="staff-surface-card rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.62)] p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--sage)]">
                    Conta interna
                  </p>
                  <p className="mt-3 text-lg font-semibold text-[var(--forest)]">
                    {session.profile.email}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.7)]">
                    Este e o email autorizado para entrar na camada da equipe.
                  </p>
                </article>

                <article className="staff-surface-card rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.62)] p-5">
                  <div className="flex items-start gap-3">
                    <KeyRound className="mt-1 text-[var(--gold)]" size={18} />
                    <div>
                      <p className="text-lg font-semibold text-[var(--forest)]">
                        {getStaffRoleLabel(session.role)}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.7)]">
                        Suas permissoes aparecem organizadas por responsabilidade
                        para facilitar a leitura da rotina.
                      </p>
                    </div>
                  </div>
                </article>

                <Link
                  href={nextHref}
                  className="button-primary w-full"
                >
                  Abrir rota inicial recomendada
                  <ArrowRight size={16} />
                </Link>

                <Link
                  href="/operacao/comandas"
                  className="button-secondary w-full justify-center"
                >
                  Ver pedidos dos clientes
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="shell pt-20">
          <div className="grid gap-5 lg:grid-cols-[1.04fr_0.96fr]">
            <div className="luxury-card rounded-[2.2rem] p-6">
              <SectionHeading
                eyebrow="Roteiro do turno"
                title="Fluxo recomendado para iniciar o turno"
                description="Esta pagina mostra a sequencia inicial de trabalho para cada perfil."
                compact
              />

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {blueprint.workflow.map((step, index) => (
                  <Link
                    key={step.title}
                    href={getModuleLink(modules, step.key)}
                    className="staff-feature-link rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5"
                  >
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--gold)]">
                      Etapa {index + 1}
                    </p>
                    <h3 className="mt-4 text-xl font-semibold text-[var(--forest)]">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-[rgba(21,35,29,0.72)]">
                      {step.text}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="luxury-card rounded-[2.2rem] p-6">
              <SectionHeading
                eyebrow="Permissoes"
                title="O que este perfil pode fazer"
                description="Cada nivel de acesso foi separado para manter responsabilidades claras."
                compact
              />

              <div className="mt-8 space-y-4">
                {blueprint.permissions.map((permission) => (
                  <article
                    key={permission}
                    className="staff-surface-card rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5"
                  >
                    <div className="flex items-start gap-3">
                      <Sparkles className="mt-1 text-[var(--gold)]" size={18} />
                      <p className="text-sm leading-7 text-[rgba(21,35,29,0.72)]">
                        {permission}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="shell pt-20">
          <div className="luxury-card rounded-[2.2rem] p-6">
            <SectionHeading
              eyebrow="Modulos operacionais"
              title={panel.title}
              description="Abaixo estao os modulos disponiveis para o seu perfil, cada um com objetivo claro."
              compact
            />

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {panel.focusItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className="staff-feature-link rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5"
                >
                  <item.icon className="text-[var(--gold)]" size={20} />
                  <h3 className="mt-4 text-lg font-semibold text-[var(--forest)]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                    {item.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="shell pt-20">
          <div className="staff-cta-panel luxury-card-dark rounded-[2.2rem] p-6 text-[var(--cream)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-[rgba(217,185,122,0.92)]">
                  Proximo passo
                </p>
                <h2 className="display-title page-section-title mt-4 text-white">
                  Acesse a central interna pela rota recomendada para o seu cargo
                </h2>
              </div>
              <Route className="text-[var(--gold-soft)]" size={22} />
            </div>

            <Link
              href="/operacao"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--gold)] px-6 py-4 text-sm font-semibold text-[var(--forest)] transition hover:-translate-y-0.5"
            >
              Entrar na central da operacao
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
