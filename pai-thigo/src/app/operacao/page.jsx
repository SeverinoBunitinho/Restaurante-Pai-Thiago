import Link from "next/link";
import { ArrowRight, Compass, Layers3, Route, Sparkles } from "lucide-react";

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
      keys: ["comandas", "reservas"],
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
        "Entre no cardapio interno e na configuracao da casa para alinhar frente, cozinha e canais digitais.",
      keys: ["menu", "configuracoes", "painel"],
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
        "Passe por equipe, acomodacao, reservas e configuracoes para remover friccao da casa.",
      keys: ["equipe", "mesas", "reservas", "configuracoes"],
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
    "Use hospitalidade para saber quem chega com celebracao ou observacao especial.",
    "Volte para o painel do turno sempre que o salao mudar de ritmo.",
  ],
  manager: [
    "Abra a equipe antes do turno para evitar acessos sem cobertura da escala.",
    "Use acomodacao para redistribuir o salao e menu para alinhar a cozinha.",
    "Trate reservas, hospitalidade e setores como trilhas separadas para decidir melhor.",
  ],
  owner: [
    "Entre no executivo para medir a casa antes de entrar nos detalhes.",
    "Desca para equipe e acomodacao quando houver risco operacional.",
    "Use o painel do turno para leituras rapidas e a central para decidir por frentes.",
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
              eyebrow="Camadas liberadas"
              title="Os modulos foram separados por funcao"
              description="Cada acesso abaixo agora representa uma frente diferente da operacao."
              compact
            />

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {modules.map((module) => (
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
              eyebrow="Leitura da central"
              title="Como a central foi organizada"
              description="A central funciona como mapa de rotas, com modulos separados por frente de trabalho."
              compact
            />

            <div className="mt-8 grid gap-4">
              {[
                {
                  icon: Layers3,
                  title: "Modulos especializados",
                  text: "Reservas, acomodacao, atendimento, equipe e executivo agora cumprem papeis diferentes.",
                },
                {
                  icon: Route,
                  title: "Fluxos mais claros",
                  text: "Cada cargo entende por onde deve comecar sem abrir varias telas parecidas.",
                },
                {
                  icon: Sparkles,
                  title: "Rotina mais objetiva",
                  text: "Acomodacao ganhou distribuicao de mesas e atendimento passou a concentrar o contexto do cliente.",
                },
              ].map((item) => (
                <article
                  key={item.title}
                  className="rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5"
                >
                  <item.icon className="text-[var(--gold)]" size={18} />
                  <h3 className="mt-4 text-lg font-semibold text-[var(--forest)]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                    {item.text}
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
