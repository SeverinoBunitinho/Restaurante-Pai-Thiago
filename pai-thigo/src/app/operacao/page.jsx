import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";

import { SectionHeading } from "@/components/section-heading";
import { getStaffRoleLabel, requireRole } from "@/lib/auth";
import {
  getModuleByKey,
  getStaffPanel,
  getStaffModules,
} from "@/lib/staff-modules";

const roleFlows = {
  waiter: [
    {
      title: "Preparar salao",
      description:
        "Comece entendendo setores, mesas livres e reservas sem distribuicao.",
      keys: ["mesas", "reservas"],
    },
    {
      title: "Conduzir atendimento",
      description:
        "Use hospitalidade para ganhar contexto e a fila para agir no momento certo.",
      keys: ["comandas", "cozinha", "reservas"],
    },
    {
      title: "Acompanhar o turno",
      description:
        "Abra o painel do turno quando quiser uma leitura mais ampla das prioridades.",
      keys: ["painel"],
    },
  ],
  manager: [
    {
      title: "Montar cobertura",
      description:
        "Verifique equipe, setores e configuracoes operacionais antes da casa encher.",
      keys: ["equipe", "mesas", "configuracoes"],
    },
    {
      title: "Equilibrar operacao",
      description:
        "Coordene reservas sensiveis, hospitalidade do turno e fluxo de acomodacao.",
      keys: ["reservas", "comandas", "mesas"],
    },
    {
      title: "Ajustar oferta",
      description:
        "Ajuste cardapio, previsao e campanhas para alinhar frente, cozinha e demanda digital.",
      keys: ["menu", "previsao", "campanhas", "configuracoes", "painel"],
    },
  ],
  owner: [
    {
      title: "Ler sinais estrategicos",
      description:
        "Comece pela visao executiva e desca para a operacao somente onde houver gargalo.",
      keys: ["executivo", "painel"],
    },
    {
      title: "Corrigir estrutura",
      description:
        "Passe por equipe, escala, acomodacao e configuracoes para remover friccao da casa.",
      keys: ["equipe", "escala", "mesas", "reservas", "configuracoes"],
    },
    {
      title: "Sustentar a experiencia",
      description:
        "Use hospitalidade e cardapio para proteger a qualidade percebida pelo cliente.",
      keys: ["comandas", "menu"],
    },
  ],
};

const roleProtocols = {
  waiter: [
    "Confira primeiro as reservas sem mesa antes do horario de pico.",
    "Use a fila da cozinha para priorizar preparo e entrega sem perder o ritmo do salao.",
    "Volte para o painel do turno sempre que o salao mudar de ritmo.",
  ],
  manager: [
    "Abra a equipe antes do turno para evitar acessos sem cobertura da escala.",
    "Use previsao e campanhas para ajustar demanda antes de mexer na operacao ao vivo.",
    "Trate reservas, cozinha e cobertura de equipe como trilhas separadas para decidir melhor.",
  ],
  owner: [
    "Entre no executivo para medir a casa antes de entrar nos detalhes.",
    "Desca para auditoria e equipe quando houver risco operacional.",
    "Use previsao, campanhas e painel para decidir por frentes sem repetir leitura.",
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
  const flowKeys = new Set(flows.flatMap((flow) => flow.keys));
  const complementaryModules = modules.filter((module) => !flowKeys.has(module.key));
  const modulesForGrid = complementaryModules.length ? complementaryModules : modules;
  const quickItems = panel.quickItems?.length ? panel.quickItems : modules.slice(0, 3);

  return (
    <>
      <section className="pt-10">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.95fr]">
          <div className="luxury-card rounded-[2.2rem] p-6">
            <SectionHeading
              eyebrow="Mapa operacional"
              title={`A central do ${getStaffRoleLabel(session.role).toLowerCase()} agora virou um hub de rotas`}
              description="Esta pagina organiza o trabalho em trilhas claras de acordo com o cargo."
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
              Como este perfil deve navegar pela operacao
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

      <section className="pt-14">
        <div className="grid gap-5 lg:grid-cols-[0.98fr_1.02fr]">
          <div className="luxury-card rounded-[2.2rem] p-6">
            <SectionHeading
              eyebrow="Modulos complementares"
              title="Acessos sem repeticao com as trilhas de cima"
              description="Aqui ficam os modulos que ainda nao apareceram no mapa operacional."
              compact
            />

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {modulesForGrid.map((module) => (
                <Link
                  key={module.key}
                  href={module.href}
                  className="rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5 transition hover:-translate-y-0.5"
                >
                  <module.icon className="text-[var(--gold)]" size={20} />
                  <h3 className="mt-4 text-lg font-semibold text-[var(--forest)]">
                    {module.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                    {module.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          <div className="luxury-card rounded-[2.2rem] p-6">
            <SectionHeading
              eyebrow="Acesso rapido"
              title="Rotas de entrada recomendadas para o seu cargo"
              description="Use estes atalhos para abrir o turno sem ficar navegando entre paginas repetidas."
              compact
            />

            <div className="mt-8 grid gap-4">
              {quickItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className="rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5"
                >
                  <item.icon className="text-[var(--gold)]" size={18} />
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
        </div>
      </section>
    </>
  );
}
