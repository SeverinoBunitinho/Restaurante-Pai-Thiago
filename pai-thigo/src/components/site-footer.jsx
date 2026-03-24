import Link from "next/link";
import {
  Clock3,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Star,
} from "lucide-react";

import { getCurrentSession, isStaffRole } from "@/lib/auth";
import { restaurantInfo as fallbackRestaurantInfo } from "@/lib/mock-data";
import { getRestaurantProfile } from "@/lib/restaurant-profile";

export async function SiteFooter() {
  let restaurantInfo = fallbackRestaurantInfo;
  let session = null;

  try {
    const [resolvedRestaurantInfo, resolvedSession] = await Promise.all([
      getRestaurantProfile(),
      getCurrentSession(),
    ]);

    restaurantInfo = {
      ...fallbackRestaurantInfo,
      ...(resolvedRestaurantInfo ?? {}),
    };
    session = resolvedSession ?? null;
  } catch {}

  const scheduleLines = Array.isArray(restaurantInfo.schedule)
    ? restaurantInfo.schedule
    : fallbackRestaurantInfo.schedule;
  const showMenuShortcut = session ? isStaffRole(session.role) : true;

  return (
    <footer className="mt-auto pt-20 pb-10">
      <div className="shell">
        <div className="hero-stage luxury-card-dark rounded-[2.6rem] px-6 py-8 text-[var(--cream)] md:px-8 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[rgba(217,185,122,0.92)]">
                {restaurantInfo.name}
              </p>
              <h2 className="display-title page-section-title mt-4 max-w-3xl text-white">
                Restaurante com identidade contemporanea, atendimento organizado e sistema integrado
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[rgba(255,247,232,0.76)]">
                {restaurantInfo.name} reune reservas, cardapio, area do cliente e rotinas
                internas em uma estrutura clara, confiavel e preparada para a
                operacao do restaurante.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <span className="info-chip border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.08)] text-[rgba(255,247,232,0.84)]">
                  <Clock3 size={14} />
                  reservas, pedidos e atendimento sincronizados
                </span>
                <span className="info-chip border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.08)] text-[rgba(255,247,232,0.84)]">
                  <MapPin size={14} />
                  {restaurantInfo.city}
                </span>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/contato" className="button-primary w-full justify-center sm:w-auto">
                  Falar com a casa
                </Link>
                {showMenuShortcut ? (
                  <Link href="/cardapio" className="button-ghost w-full justify-center sm:w-auto">
                    Ver cardapio
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <article className="rounded-[1.9rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.05)] p-5 backdrop-blur-sm">
                <MapPin className="text-[var(--gold-soft)]" size={18} />
                <p className="mt-4 text-sm font-semibold uppercase tracking-[0.22em] text-[rgba(217,185,122,0.88)]">
                  Endereco
                </p>
                <a
                  href={restaurantInfo.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block text-lg font-semibold text-white"
                >
                  {restaurantInfo.address}
                </a>
                <p className="mt-1 text-sm text-[rgba(255,247,232,0.72)]">{restaurantInfo.city}</p>
              </article>

              <article className="rounded-[1.9rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.05)] p-5 backdrop-blur-sm">
                <Phone className="text-[var(--gold-soft)]" size={18} />
                <p className="mt-4 text-sm font-semibold uppercase tracking-[0.22em] text-[rgba(217,185,122,0.88)]">
                  Contato
                </p>
                <a
                  href={restaurantInfo.phoneHref}
                  className="mt-2 block text-lg font-semibold text-white"
                >
                  {restaurantInfo.phone}
                </a>
                <a
                  href={restaurantInfo.emailHref}
                  className="mt-1 block text-sm text-[rgba(255,247,232,0.72)]"
                >
                  {restaurantInfo.email}
                </a>
              </article>

              <article className="rounded-[1.9rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.05)] p-5 backdrop-blur-sm sm:col-span-2">
                <Clock3 className="text-[var(--gold-soft)]" size={18} />
                <p className="mt-4 text-sm font-semibold uppercase tracking-[0.22em] text-[rgba(217,185,122,0.88)]">
                  Horarios
                </p>
                <div className="mt-2 space-y-1 text-sm leading-7 text-[rgba(255,247,232,0.74)]">
                  {scheduleLines.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
                <p className="mt-3 text-sm leading-6 text-[rgba(255,247,232,0.6)]">
                  {restaurantInfo.holidayPolicy}
                </p>
              </article>

              <article className="rounded-[1.9rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.05)] p-5 backdrop-blur-sm sm:col-span-2">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[rgba(217,185,122,0.88)]">
                  Integracoes
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href={restaurantInfo.whatsappHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-[rgba(217,185,122,0.16)] px-4 py-2 text-sm font-semibold text-white"
                  >
                    <MessageCircle size={16} />
                    WhatsApp
                  </a>
                  <a
                    href={restaurantInfo.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-[rgba(217,185,122,0.16)] px-4 py-2 text-sm font-semibold text-white"
                  >
                    <Instagram size={16} />
                    Instagram
                  </a>
                  <a
                    href={restaurantInfo.facebookUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-[rgba(217,185,122,0.16)] px-4 py-2 text-sm font-semibold text-white"
                  >
                    <Facebook size={16} />
                    Facebook
                  </a>
                  <a
                    href={restaurantInfo.googleBusinessUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-[rgba(217,185,122,0.16)] px-4 py-2 text-sm font-semibold text-white"
                  >
                    <Star size={16} />
                    Google Business
                  </a>
                </div>
              </article>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-4 border-t border-[rgba(217,185,122,0.12)] pt-6 text-sm text-[rgba(255,247,232,0.68)] md:flex-row md:items-center md:justify-between">
            <p>
              {restaurantInfo.name}. Reservas, cardapio e atendimento reunidos em um unico ambiente digital.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-[rgba(217,185,122,0.92)]">
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
