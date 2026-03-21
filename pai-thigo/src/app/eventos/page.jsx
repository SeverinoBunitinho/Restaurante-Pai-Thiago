import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Gift,
  HeartHandshake,
  PartyPopper,
  Sparkles,
  Users,
} from "lucide-react";

import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { requireRole } from "@/lib/auth";
import { experiences } from "@/lib/mock-data";
import { getRestaurantProfile } from "@/lib/restaurant-profile";
import { getCustomerDashboard } from "@/lib/site-data";

const eventJourneys = [
  {
    title: "Aniversario intimista",
    description:
      "Mesa reservada, ritmo de servico mais caloroso e atencao aos detalhes da celebracao.",
    tag: "celebracao",
  },
  {
    title: "Jantar romantico",
    description:
      "Uma experiencia mais reservada, com atmosfera pensada para a ocasiao.",
    tag: "especial",
  },
  {
    title: "Encontro corporativo",
    description:
      "Servico fluido, ambiente elegante e suporte ideal para almocos e jantares de negocios.",
    tag: "executivo",
  },
  {
    title: "Experiencia em grupo",
    description:
      "Formatos para receber pequenos grupos com conforto, previsao e organizacao.",
    tag: "grupo",
  },
];

export default async function EventosPage() {
  const session = await requireRole("customer");
  const [dashboard, restaurantInfo] = await Promise.all([
    getCustomerDashboard(session.user.id),
    getRestaurantProfile(),
  ]);

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="pb-16">
        <section className="shell pt-12">
          <div className="grid gap-5 lg:grid-cols-[1fr_0.95fr]">
            <div className="luxury-card-dark rounded-[2.4rem] p-7 text-[var(--cream)] md:p-10">
              <p className="text-xs uppercase tracking-[0.28em] text-[rgba(217,185,122,0.92)]">
                Eventos e ocasioes
              </p>
              <h1 className="display-title page-hero-title mt-4 text-white">
                Planeje encontros especiais com mais contexto e organizacao
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-[rgba(255,247,232,0.74)]">
                Esta area ajuda o cliente a organizar aniversarios, encontros e
                visitas especiais antes de enviar a reserva, com informacoes que
                facilitam o atendimento da equipe.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.6rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] p-5">
                  <Gift className="text-[var(--gold-soft)]" size={18} />
                  <p className="mt-4 text-sm font-semibold uppercase tracking-[0.22em] text-[rgba(217,185,122,0.9)]">
                    Relacionamento
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-white">
                    {dashboard.profile.loyaltyPoints} pontos
                  </p>
                  <p className="mt-2 text-sm text-[rgba(255,247,232,0.74)]">
                    Sua conta preserva historico e preferencias para agilizar o atendimento.
                  </p>
                </div>

                <div className="rounded-[1.6rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] p-5">
                  <HeartHandshake className="text-[var(--gold-soft)]" size={18} />
                  <p className="mt-4 text-sm font-semibold uppercase tracking-[0.22em] text-[rgba(217,185,122,0.9)]">
                    Ambiente favorito
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-white">
                    {dashboard.profile.preferredRoom}
                  </p>
                  <p className="mt-2 text-sm text-[rgba(255,247,232,0.74)]">
                    A equipe usa isso para sugerir o melhor clima para sua visita.
                  </p>
                </div>

                <div className="rounded-[1.6rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] p-5">
                  <CalendarDays className="text-[var(--gold-soft)]" size={18} />
                  <p className="mt-4 text-sm font-semibold uppercase tracking-[0.22em] text-[rgba(217,185,122,0.9)]">
                    Base da casa
                  </p>
                  <p className="mt-3 text-lg font-semibold text-white">
                    {restaurantInfo.address}
                  </p>
                  <p className="mt-2 text-sm text-[rgba(255,247,232,0.74)]">
                    {restaurantInfo.city}
                  </p>
                </div>
              </div>
            </div>

            <div className="luxury-card rounded-[2.4rem] p-7 md:p-10">
              <SectionHeading
                eyebrow="Como funciona"
                title="Planejamento simples para cada ocasiao"
                description="Aqui voce entende o melhor formato da visita antes mesmo de preencher a reserva."
                compact
              />

              <div className="mt-8 space-y-4">
                {[
                  {
                    icon: Sparkles,
                    title: "Escolha o clima da experiencia",
                    text: "Romantico, executivo, comemorativo ou em grupo.",
                  },
                  {
                    icon: PartyPopper,
                    title: "Leve o contexto para a reserva",
                    text: "A equipe recebe a ocasiao com antecedencia e prepara melhor o atendimento.",
                  },
                  {
                    icon: HeartHandshake,
                    title: "Volte com mais praticidade",
                    text: "Sua conta preserva preferencias de ambiente e historico de visitas.",
                  },
                ].map((item) => (
                  <article
                    key={item.title}
                    className="rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5"
                  >
                    <item.icon className="text-[var(--gold)]" size={20} />
                    <h2 className="mt-4 text-lg font-semibold text-[var(--forest)]">
                      {item.title}
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-[rgba(21,35,29,0.72)]">
                      {item.text}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="shell pt-20">
          <SectionHeading
            eyebrow="Roteiros"
            title="Ocasioes que o cliente pode planejar daqui"
            description="Esses formatos ajudam a transformar interesse em reserva com mais clareza."
          />

          <div className="mt-10 grid gap-5 lg:grid-cols-4">
            {eventJourneys.map((journey) => (
              <article key={journey.title} className="luxury-card rounded-[2rem] p-6">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--gold)]">
                  {journey.tag}
                </p>
                <h2 className="mt-4 text-2xl font-semibold text-[var(--forest)]">
                  {journey.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[rgba(21,35,29,0.72)]">
                  {journey.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="shell pt-20">
          <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
            <div className="luxury-card rounded-[2.2rem] p-6">
              <SectionHeading
                eyebrow="Formatos da casa"
                title="Experiencias que combinam com o seu momento"
                description="O objetivo aqui e ajudar a escolher o formato de visita mais adequado."
                compact
              />

              <div className="mt-8 space-y-4">
                {experiences.map((experience) => (
                  <article
                    key={experience.title}
                    className="rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5"
                  >
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--sage)]">
                      {experience.tag}
                    </p>
                    <h3 className="mt-3 text-xl font-semibold text-[var(--forest)]">
                      {experience.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                      {experience.description}
                    </p>
                    <p className="mt-4 flex items-center gap-2 text-sm font-medium text-[var(--gold)]">
                      <Users size={16} />
                      {experience.capacity}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <div className="luxury-card-dark rounded-[2.2rem] p-6 text-[var(--cream)]">
              <p className="text-xs uppercase tracking-[0.28em] text-[rgba(217,185,122,0.92)]">
                Proximo passo
              </p>
              <h2 className="display-title page-section-title mt-4 text-white">
                Leve as informacoes do evento para a reserva
              </h2>
              <p className="mt-4 max-w-xl text-base leading-8 text-[rgba(255,247,232,0.76)]">
                Depois de definir a ocasiao, basta abrir a reserva e informar o
                contexto da visita para que a equipe organize melhor o atendimento.
              </p>

              <div className="mt-8 grid gap-4">
                <Link
                  href="/reservas"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--gold)] px-6 py-4 text-sm font-semibold text-[var(--forest)] transition hover:-translate-y-0.5 sm:w-auto"
                >
                  Abrir reserva
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/cardapio"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[rgba(217,185,122,0.24)] px-6 py-4 text-sm font-semibold text-[var(--cream)] transition hover:-translate-y-0.5 sm:w-auto"
                >
                  Ver cardapio
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
