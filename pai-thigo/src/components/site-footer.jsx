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
  const leftHighlights = staffSession
    ? [
        {
          icon: Clock3,
          title: "Operacao continua",
          text: "Reservas, pedidos e atendimento interno seguem conectados na mesma base.",
        },
        {
          icon: ShieldCheck,
          title: "Controle por perfil",
          text: "Garcom, gerente e dono com acessos organizados por responsabilidade.",
        },
      ]
    : [
        {
          icon: Clock3,
          title: "Fluxo sincronizado",
          text: "Reservas e pedidos ficam alinhados com a equipe em tempo real.",
        },
        {
          icon: MessageCircle,
          title: "Atendimento da casa",
          text: "Canais oficiais reunidos para contato rapido e suporte da experiencia.",
        },
      ];

  return (
    <footer className="mt-auto pt-14 pb-8">
      <div className="shell">
        <div className="hero-stage luxury-card-dark rounded-[2.4rem] px-6 py-7 text-[var(--cream)] md:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[rgba(217,185,122,0.92)]">
                {restaurantInfo.name}
              </p>
              <h2 className="mt-3 max-w-2xl text-[clamp(2rem,3.6vw,3.25rem)] leading-[1.06] text-white">
                Restaurante com identidade contemporanea, atendimento organizado e sistema integrado
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[rgba(255,247,232,0.76)]">
                {restaurantInfo.name} reune reservas, cardapio, area do cliente e rotinas
                internas em uma estrutura clara, confiavel e preparada para a
                operacao do restaurante.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="info-chip border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.08)] text-[rgba(255,247,232,0.84)]">
                  <Clock3 size={14} />
                  reservas, pedidos e atendimento sincronizados
                </span>
                <span className="info-chip border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.08)] text-[rgba(255,247,232,0.84)]">
                  <MapPin size={14} />
                  {restaurantInfo.city}
                </span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {leftHighlights.map((item) => (
                  <article
                    key={item.title}
                    className="rounded-[1.35rem] border border-[rgba(217,185,122,0.14)] bg-[rgba(255,255,255,0.04)] px-4 py-3"
                  >
                    <item.icon className="text-[var(--gold-soft)]" size={16} />
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(217,185,122,0.9)]">
                      {item.title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[rgba(255,247,232,0.74)]">
                      {item.text}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <div className="grid gap-3">
              <article className="rounded-[1.7rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.05)] p-4 backdrop-blur-sm">
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

                <div className="mt-4 border-t border-[rgba(217,185,122,0.14)] pt-3">
                  <Clock3 className="text-[var(--gold-soft)]" size={17} />
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-[rgba(217,185,122,0.88)]">
                    Horarios
                  </p>
                  <div className="mt-2 space-y-1 text-sm leading-6 text-[rgba(255,247,232,0.74)]">
                    {restaurantInfo.schedule.map((item) => (
                      <p key={item}>{item}</p>
                    ))}
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[rgba(255,247,232,0.6)]">
                    {restaurantInfo.holidayPolicy}
                  </p>
                </div>
              </article>

              <article className="rounded-[1.7rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.05)] p-4 backdrop-blur-sm">
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

          <div className="mt-8 flex flex-col gap-3 border-t border-[rgba(217,185,122,0.12)] pt-5 text-xs text-[rgba(255,247,232,0.68)] md:flex-row md:items-center md:justify-between">
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
              <Link href="/cancelamentos" className="inline-flex items-center gap-2">
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
