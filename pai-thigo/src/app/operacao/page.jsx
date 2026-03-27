import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";

import { SectionHeading } from "@/components/section-heading";
import { getStaffRoleLabel, requireRole } from "@/lib/auth";
import {
  getStaffPanel,
  getModuleByKey,
  getStaffModules,
} from "@/lib/staff-modules";

const roleFlows = {
  waiter: [
    {
      title: "Preparar salao",
      description:
        "Revise setores, mesas livres e reservas sem mesa.",
      keys: ["mesas", "reservas"],
    },
    {
      title: "Conduzir atendimento",
      description:
        "Conduza o atendimento e acompanhe a fila da cozinha.",
      keys: ["comandas", "cozinha", "reservas"],
    },
    {
      title: "Acompanhar o turno",
      description:
        "Use o painel para checar prioridades do turno.",
      keys: ["painel"],
    },
  ],
  manager: [
    {
      title: "Montar cobertura",
      description:
        "Confirme equipe, setores e configuracoes antes do pico.",
      keys: ["equipe", "mesas", "configuracoes"],
    },
    {
      title: "Equilibrar operacao",
      description:
        "Coordene reservas, acomodacao e ritmo do salao.",
      keys: ["reservas", "comandas", "mesas"],
    },
    {
      title: "Ajustar oferta",
      description:
        "Ajuste cardapio, previsao e campanhas conforme a demanda.",
      keys: ["menu", "previsao", "campanhas", "configuracoes", "painel"],
    },
  ],
  owner: [
    {
      title: "Ler sinais estrategicos",
      description:
        "Comece na visao executiva e desca apenas onde houver gargalo.",
      keys: ["executivo", "painel"],
    },
    {
      title: "Corrigir estrutura",
      description:
        "Ajuste equipe, escala e configuracoes para manter fluidez.",
      keys: ["equipe", "escala", "mesas", "reservas", "configuracoes"],
    },
    {
      title: "Sustentar a experiencia",
      description:
        "Garanta qualidade de servico e consistencia do cardapio.",
      keys: ["comandas", "menu"],
    },
  ],
};

const roleProtocols = {
  waiter: [
    "Comece por reservas sem mesa antes do pico.",
    "Priorize a fila da cozinha para manter o ritmo do salao.",
    "Volte ao painel sempre que o fluxo mudar.",
  ],
  manager: [
    "Revise equipe e escala no inicio do turno.",
    "Ajuste previsao e campanhas antes do pico.",
    "Decida por frente: reservas, salao, cozinha e equipe.",
  ],
  owner: [
    "Leia a visao executiva antes de entrar nos detalhes.",
    "Use auditoria e equipe quando houver risco operacional.",
    "Combine previsao, campanhas e painel para decidir com clareza.",
  ],
};

function resolveModules(role, keys) {
  return keys
    .map((key) => getModuleByKey(key))
    .filter((module) => module && module.roles.includes(role));
}

export default async function OperacaoOverviewPage() {
  const session = await requireRole(["waiter", "manager", "owner"]);
  const panel = getStaffPanel(session.role);
  const modules = getStaffModules(session.role);
  const flows = roleFlows[session.role] ?? roleFlows.waiter;
  const protocols = roleProtocols[session.role] ?? roleProtocols.waiter;

  return (
    <>
      <section className="pt-2">
        <div className="operations-hero-shell luxury-card-dark rounded-[2.4rem] p-7 text-[var(--cream)] md:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.28em] text-[rgba(217,185,122,0.92)]">
                Central interna
              </p>
              <h1 className="display-title page-hero-title mt-4 text-white">
                Operacao do {getStaffRoleLabel(session.role).toLowerCase()} no
                Pai Thiago
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-[rgba(255,247,232,0.74)]">
                A equipe agora entra em uma base mais organizada, com rotas
                separadas por frente de trabalho e fluxo mais claro entre modulos.
              </p>
            </div>

            <Link
              href="/area-funcionario"
              className="operations-return-link inline-flex items-center justify-center rounded-full border border-[rgba(217,185,122,0.24)] px-5 py-3 text-sm font-semibold text-[var(--cream)] transition hover:-translate-y-0.5"
            >
              Voltar ao painel da equipe
            </Link>
          </div>

          <div className="operations-module-grid mt-8 md:grid-cols-2 xl:grid-cols-4">
            {modules.map((module) => (
              <Link
                key={module.key}
                href={module.href}
                className="operations-module-tile"
              >
                <module.icon className="text-[var(--gold-soft)]" size={20} />
                <h2 className="mt-4 text-lg font-semibold text-white">
                  {module.title}
                </h2>
                <p className="operations-module-copy mt-2 text-sm leading-6 text-[rgba(255,247,232,0.72)]">
                  {module.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="pt-10">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.95fr]">
          <div className="luxury-card rounded-[2.2rem] p-6">
            <SectionHeading
              eyebrow="Mapa operacional"
              title={`Central do ${getStaffRoleLabel(session.role).toLowerCase()} com rotas do turno`}
              description="Trilhas diretas para executar o turno com menos cliques."
              compact
            />

            <div className="mt-8 space-y-4">
              {flows.map((flow) => (
                <article
                  key={flow.title}
                  className="rounded-[1.8rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-semibold text-[var(--forest)]">
                        {flow.title}
                      </h2>
                      <p className="mt-3 max-w-2xl text-sm leading-7 text-[rgba(21,35,29,0.72)]">
                        {flow.description}
                      </p>
                    </div>
                    <Compass className="text-[var(--gold)]" size={18} />
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    {resolveModules(session.role, flow.keys).map((module) => (
                      <Link
                        key={module.key}
                        href={module.href}
                        className="pill-wrap-safe inline-flex items-center gap-2 rounded-full border border-[rgba(20,35,29,0.12)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--forest)] transition hover:-translate-y-0.5"
                      >
                        {module.title}
                        <ArrowRight size={14} />
                      </Link>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="luxury-card-dark rounded-[2.2rem] p-6 text-[var(--cream)]">
            <p className="text-xs uppercase tracking-[0.28em] text-[rgba(217,185,122,0.92)]">
              Protocolo do cargo
            </p>
            <h2 className="display-title page-section-title mt-4 text-white">
              Como este perfil conduz a operacao
            </h2>

            <div className="mt-8 space-y-3">
              {protocols.map((protocol) => (
                <div
                  key={protocol}
                  className="rounded-[1.4rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm leading-7 text-[rgba(255,247,232,0.8)]"
                >
                  {protocol}
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-4">
              {panel.highlights.map((highlight) => (
                <article
                  key={highlight.title}
                  className="rounded-[1.6rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] p-5"
                >
                  <highlight.icon className="text-[var(--gold-soft)]" size={18} />
                  <h3 className="mt-4 text-lg font-semibold text-white">
                    {highlight.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[rgba(255,247,232,0.72)]">
                    {highlight.text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
