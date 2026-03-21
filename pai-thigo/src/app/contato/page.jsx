import {
  Clock3,
  ExternalLink,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Star,
} from "lucide-react";

import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { requireAuth } from "@/lib/auth";
import { getRestaurantProfile } from "@/lib/restaurant-profile";

export default async function ContatoPage() {
  await requireAuth();
  const restaurantInfo = await getRestaurantProfile();

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="pb-16">
        <section className="shell pt-12">
          <div className="grid gap-5 lg:grid-cols-[1fr_0.95fr]">
            <div className="hero-stage luxury-card-dark rounded-[2.4rem] p-7 text-[var(--cream)] md:p-10">
              <p className="text-xs uppercase tracking-[0.28em] text-[rgba(217,185,122,0.92)]">
                Contato e localizacao
              </p>
              <h1 className="display-title page-hero-title mt-4 text-white">
                Informacoes claras para reservar, chegar e falar com a casa
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-[rgba(255,247,232,0.74)]">
                Um restaurante profissional precisa deixar endereco, canais de
                contato, horarios e integracoes sempre a um clique do cliente.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <span className="info-chip border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.08)] text-[rgba(255,247,232,0.84)]">
                  <MapPin size={14} />
                  {restaurantInfo.city}
                </span>
                <span className="info-chip border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.08)] text-[rgba(255,247,232,0.84)]">
                  <Clock3 size={14} />
                  reservas, eventos e atendimento direto
                </span>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <article className="rounded-[1.6rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] p-5">
                  <MapPin className="text-[var(--gold-soft)]" size={18} />
                  <p className="mt-4 text-sm font-semibold uppercase tracking-[0.22em] text-[rgba(217,185,122,0.9)]">
                    Endereco
                  </p>
                  <p className="mt-3 text-lg font-semibold text-white">
                    {restaurantInfo.address}
                  </p>
                  <p className="mt-1 text-sm text-[rgba(255,247,232,0.72)]">
                    {restaurantInfo.city}
                  </p>
                </article>

                <article className="rounded-[1.6rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] p-5">
                  <Clock3 className="text-[var(--gold-soft)]" size={18} />
                  <p className="mt-4 text-sm font-semibold uppercase tracking-[0.22em] text-[rgba(217,185,122,0.9)]">
                    Horarios
                  </p>
                  <div className="mt-3 space-y-1 text-sm leading-7 text-[rgba(255,247,232,0.72)]">
                    {restaurantInfo.schedule.map((item) => (
                      <p key={item}>{item}</p>
                    ))}
                  </div>
                </article>
              </div>
            </div>

            <div className="luxury-card rounded-[2.4rem] p-7 md:p-10">
              <SectionHeading
                eyebrow="Canais diretos"
                title="Fale com o Pai Thiago do jeito mais conveniente"
                description="Telefone, e-mail, WhatsApp, redes sociais, mapa e Google Business organizados de forma simples e profissional."
                compact
              />

              <div className="mt-8 grid gap-4">
                {[
                  {
                    icon: Phone,
                    title: "Telefone",
                    value: restaurantInfo.phone,
                    href: restaurantInfo.phoneHref,
                  },
                  {
                    icon: Mail,
                    title: "E-mail",
                    value: restaurantInfo.email,
                    href: restaurantInfo.emailHref,
                  },
                  {
                    icon: MessageCircle,
                    title: "WhatsApp",
                    value: restaurantInfo.whatsapp,
                    href: restaurantInfo.whatsappHref,
                  },
                ].map((item) => (
                  <a
                    key={item.title}
                    href={item.href}
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                    className="contact-chip transition hover:-translate-y-0.5"
                  >
                    <item.icon className="text-[var(--gold)]" size={18} />
                    <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--sage)]">
                      {item.title}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-[var(--forest)]">
                      {item.value}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="shell section-frame pt-20">
          <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="luxury-card rounded-[2.2rem] p-6">
              <SectionHeading
                eyebrow="Local"
                title="Como chegar e o que considerar antes da visita"
                description="Endereco com link direto para mapa, horarios com destaque para fim de semana e observacoes para feriados."
                compact
              />

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <a
                  href={restaurantInfo.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="contact-chip transition hover:-translate-y-0.5"
                >
                  <MapPin className="text-[var(--gold)]" size={18} />
                  <h2 className="mt-4 text-xl font-semibold text-[var(--forest)]">
                    Abrir no Google Maps
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                    Rota imediata para chegar ao restaurante com um clique.
                  </p>
                </a>

                <a
                  href={restaurantInfo.googleBusinessUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="contact-chip transition hover:-translate-y-0.5"
                >
                  <Star className="text-[var(--gold)]" size={18} />
                  <h2 className="mt-4 text-xl font-semibold text-[var(--forest)]">
                    Ver perfil no Google
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                    Consulta rapida para SEO local, reputacao e descoberta da casa.
                  </p>
                </a>
              </div>

              <div className="contact-chip mt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
                  Fins de semana e feriados
                </p>
                <p className="mt-3 text-sm leading-7 text-[rgba(21,35,29,0.72)]">
                  {restaurantInfo.holidayPolicy}
                </p>
              </div>
            </div>

            <div className="hero-stage luxury-card-dark rounded-[2.2rem] p-6 text-[var(--cream)]">
              <p className="text-xs uppercase tracking-[0.28em] text-[rgba(217,185,122,0.92)]">
                Redes e integracoes
              </p>
              <h2 className="display-title page-section-title mt-4 text-white">
                Presenca digital alinhada com a experiencia da casa
              </h2>

              <div className="mt-8 grid gap-4">
                {[
                  {
                    icon: Instagram,
                    title: "Instagram",
                    value: restaurantInfo.instagramHandle,
                    href: restaurantInfo.instagramUrl,
                  },
                  {
                    icon: Facebook,
                    title: "Facebook",
                    value: restaurantInfo.facebookHandle,
                    href: restaurantInfo.facebookUrl,
                  },
                  {
                    icon: ExternalLink,
                    title: "Google Business Profile",
                    value: "Avaliacao, descoberta local e reputacao",
                    href: restaurantInfo.googleBusinessUrl,
                  },
                ].map((item) => (
                  <a
                    key={item.title}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-[1.6rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] p-5 transition hover:-translate-y-0.5"
                  >
                    <item.icon className="text-[var(--gold-soft)]" size={18} />
                    <h3 className="mt-4 text-lg font-semibold text-white">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[rgba(255,247,232,0.72)]">
                      {item.value}
                    </p>
                  </a>
                ))}
              </div>

              <div className="mt-8 rounded-[1.8rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[rgba(217,185,122,0.92)]">
                  O que este canal resolve
                </p>
                <div className="mt-4 space-y-3 text-sm leading-7 text-[rgba(255,247,232,0.72)]">
                  {restaurantInfo.serviceNotes.map((note) => (
                    <p key={note}>{note}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
