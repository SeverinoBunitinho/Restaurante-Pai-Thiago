import Link from "next/link";
import {
  Clock3,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Star,
} from "lucide-react";

import { getCurrentSession, isStaffRole } from "@/lib/auth";
import { getRestaurantProfile } from "@/lib/restaurant-profile";

export async function SiteFooter() {
  const [restaurantInfo, session] = await Promise.all([
    getRestaurantProfile(),
    getCurrentSession(),
  ]);
  const staffSession = session ? isStaffRole(session.role) : false;
  const primaryHighlight = staffSession
    ? {
        icon: ShieldCheck,
        title: "Controle por perfil",
        text: "Equipe interna com acessos separados e operacao conectada em tempo real.",
      }
    : {
        icon: MessageCircle,
        title: "Atendimento da casa",
        text: "Reservas e pedidos alinhados com suporte da equipe em um fluxo unico.",
      };

  return (
    <footer className="mt-auto pt-10 pb-7">
      <div className="shell">
        <div className="hero-stage luxury-card-dark rounded-[2.2rem] px-5 py-6 text-[var(--cream)] md:px-7 md:py-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[rgba(217,185,122,0.92)]">
                {restaurantInfo.name}
              </p>
              <h2 className="mt-3 max-w-xl text-[clamp(1.8rem,3vw,2.9rem)] leading-[1.08] text-white">
                Restaurante com identidade contemporanea, atendimento organizado e sistema integrado
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[rgba(255,247,232,0.76)]">
                {restaurantInfo.name} reune reservas, cardapio e operacao interna em uma base clara e confiavel.
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="info-chip border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.08)] text-[rgba(255,247,232,0.84)]">
                  <Clock3 size={14} />
                  reservas, pedidos e atendimento sincronizados
                </span>
                <span className="info-chip border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.08)] text-[rgba(255,247,232,0.84)]">
                  <MapPin size={14} />
                  {restaurantInfo.city}
                </span>
              </div>

              <div className="mt-4">
                <article className="rounded-[1.2rem] border border-[rgba(217,185,122,0.14)] bg-[rgba(255,255,255,0.04)] px-4 py-3">
                  <primaryHighlight.icon className="text-[var(--gold-soft)]" size={16} />
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(217,185,122,0.9)]">
                    {primaryHighlight.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[rgba(255,247,232,0.74)]">
                    {primaryHighlight.text}
                  </p>
                </article>
              </div>
            </div>

            <div className="grid gap-3">
              <article className="rounded-[1.5rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.05)] p-3.5 backdrop-blur-sm">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <MapPin className="text-[var(--gold-soft)]" size={17} />
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-[rgba(217,185,122,0.88)]">
                      Endereco
                    </p>
                    <a
                      href={restaurantInfo.mapUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block text-base font-semibold text-white"
                    >
                      {restaurantInfo.address}
                    </a>
                    <p className="mt-1 text-sm text-[rgba(255,247,232,0.72)]">{restaurantInfo.city}</p>
                  </div>

                  <div>
                    <Phone className="text-[var(--gold-soft)]" size={17} />
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-[rgba(217,185,122,0.88)]">
                      Contato
                    </p>
                    <a
                      href={restaurantInfo.phoneHref}
                      className="mt-2 block text-base font-semibold text-white"
                    >
                      {restaurantInfo.phone}
                    </a>
                    <a
                      href={restaurantInfo.emailHref}
                      className="mt-1 block text-sm text-[rgba(255,247,232,0.72)]"
                    >
                      {restaurantInfo.email}
                    </a>
                  </div>
                </div>

                <div className="mt-3 border-t border-[rgba(217,185,122,0.14)] pt-3">
                  <Clock3 className="text-[var(--gold-soft)]" size={17} />
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-[rgba(217,185,122,0.88)]">
                    Horarios
                  </p>
                  <div className="mt-2 space-y-1 text-sm leading-6 text-[rgba(255,247,232,0.74)]">
                    {restaurantInfo.schedule.map((item) => (
                      <p key={item}>{item}</p>
                    ))}
                  </div>
                  <p className="mt-2 hidden text-xs leading-5 text-[rgba(255,247,232,0.6)] sm:block">
                    {restaurantInfo.holidayPolicy}
                  </p>
                </div>
              </article>

              <article className="rounded-[1.5rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.05)] p-3.5 backdrop-blur-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[rgba(217,185,122,0.88)]">
                  Integracoes
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={restaurantInfo.whatsappHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-[rgba(217,185,122,0.16)] px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    <MessageCircle size={16} />
                    WhatsApp
                  </a>
                  <a
                    href={restaurantInfo.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-[rgba(217,185,122,0.16)] px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    <Instagram size={16} />
                    Instagram
                  </a>
                  <a
                    href={restaurantInfo.facebookUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-[rgba(217,185,122,0.16)] px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    <Facebook size={16} />
                    Facebook
                  </a>
                  <a
                    href={restaurantInfo.googleBusinessUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-[rgba(217,185,122,0.16)] px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    <Star size={16} />
                    Google Business
                  </a>
                </div>
              </article>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2 border-t border-[rgba(217,185,122,0.12)] pt-4 text-xs text-[rgba(255,247,232,0.68)] md:flex-row md:items-center md:justify-between">
            <p className="leading-6">
              {restaurantInfo.name}. Reservas, cardapio e atendimento reunidos em um unico ambiente digital.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-[rgba(217,185,122,0.92)]">
              <Link href="/privacidade" className="inline-flex items-center gap-2">
                Privacidade
              </Link>
              <Link href="/termos" className="inline-flex items-center gap-2">
                Termos
              </Link>
              <Link href="/cancelamentos" className="hidden items-center gap-2 sm:inline-flex">
                Cancelamentos
              </Link>
              <a
                href={restaurantInfo.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2"
              >
                <Instagram size={16} />
                {restaurantInfo.instagramHandle}
              </a>
              <a
                href={restaurantInfo.emailHref}
                className="inline-flex items-center gap-2"
              >
                <Mail size={16} />
                {restaurantInfo.email}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
