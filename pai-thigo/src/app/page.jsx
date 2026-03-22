import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CalendarRange,
  ChefHat,
  Clock3,
  ConciergeBell,
  Instagram,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  getStaffRoleLabel,
  isStaffRole,
  requireAuth,
} from "@/lib/auth";
import { experiences } from "@/lib/mock-data";
import { getRestaurantProfile } from "@/lib/restaurant-profile";
import {
  getCustomerDashboard,
  getMenuCategories,
  getPublicTestimonials,
  getStaffDashboard,
} from "@/lib/site-data";
import { getStaffModules } from "@/lib/staff-modules";
import { formatCurrency, formatReservationMoment } from "@/lib/utils";

function getHomeVoice(session, firstName) {
  if (isStaffRole(session.role)) {
    return {
      eyebrow: "acesso interno",
      title: `${getStaffRoleLabel(session.role)} ${firstName}, acompanhe o restaurante com clareza e prioridade.`,
      description:
        "O sistema do Pai Thiago organiza reservas, atendimento, salao e gestao interna em uma interface clara, consistente e conectada ao dia a dia do restaurante.",
      primaryHref: "/area-funcionario",
      primaryLabel: "Abrir minha area",
      secondaryHref: "/operacao",
      secondaryLabel: "Entrar na central",
    };
  }

  return {
    eyebrow: "area do cliente",
    title: `${firstName}, acompanhe reservas, pedidos e historico em um unico lugar.`,
    description:
      "Sua conta centraliza reservas, pedidos e dados de atendimento em uma jornada simples, elegante e preparada para facilitar cada visita ao Pai Thiago.",
    primaryHref: "/area-cliente",
    primaryLabel: "Abrir perfil",
    secondaryHref: "/reservas",
    secondaryLabel: "Reservar mesa",
  };
}

function getGalleryToneClass(tone) {
  if (tone === "warm") {
    return "bg-[linear-gradient(180deg,rgba(188,141,79,0.18),rgba(255,255,255,0.78)),radial-gradient(circle_at_top,rgba(255,230,196,0.72),transparent_42%)]";
  }

  if (tone === "ember") {
    return "bg-[linear-gradient(180deg,rgba(138,93,59,0.18),rgba(255,255,255,0.78)),radial-gradient(circle_at_top,rgba(255,214,168,0.8),transparent_42%)]";
  }

  if (tone === "sage") {
    return "bg-[linear-gradient(180deg,rgba(95,123,109,0.16),rgba(255,255,255,0.78)),radial-gradient(circle_at_top,rgba(207,231,221,0.84),transparent_42%)]";
  }

  return "bg-[linear-gradient(180deg,rgba(20,35,29,0.18),rgba(255,255,255,0.78)),radial-gradient(circle_at_top,rgba(212,218,231,0.72),transparent_42%)]";
}

export default async function Home() {
  const session = await requireAuth();
  const [categories, dashboard, restaurantInfo, testimonials] = await Promise.all([
    getMenuCategories(),
    isStaffRole(session.role)
      ? getStaffDashboard(session.role)
      : getCustomerDashboard(session.user.id),
    getRestaurantProfile(),
    getPublicTestimonials(),
  ]);

  const firstName = session.profile.full_name.split(" ")[0];
  const voice = getHomeVoice(session, firstName);
  const spotlightItem = categories[0]?.items?.[0];
  const upcomingReservation = dashboard.reservations?.[0] ?? null;
  const staffModules = isStaffRole(session.role)
    ? getStaffModules(session.role)
    : [];
  const headlineMetrics = dashboard.metrics ?? dashboard.stats.slice(0, 3);
  const featureCards = isStaffRole(session.role)
    ? staffModules.slice(0, 4).map((item) => ({
        key: item.key,
        eyebrow: "modulo interno",
        title: item.title,
        text: item.description,
        href: item.href,
        icon: item.icon,
      }))
    : experiences.slice(0, 4).map((item) => ({
        key: item.title,
        eyebrow: item.tag,
        title: item.title,
        text: item.description,
        meta: item.capacity,
      }));

  const standards = isStaffRole(session.role)
    ? [
        {
          title: "Operacao por camadas",
          text: "Cada area da equipe foi organizada por responsabilidade para dar mais clareza ao turno.",
        },
        {
          title: "Interface por papel",
          text: "Garcom, gerente e dono enxergam caminhos adequados ao seu nivel de acesso.",
        },
        {
          title: "Dados centralizados",
          text: "Reservas, perfis e permissoes permanecem conectados ao banco de dados do sistema.",
        },
      ]
    : [
        {
          title: "Reserva organizada",
          text: "A jornada do cliente ficou mais clara para facilitar o envio e o acompanhamento da visita.",
        },
        {
          title: "Historico centralizado",
          text: "Reservas, preferencias e dados da conta ficam reunidos em um unico ambiente.",
        },
        {
          title: "Comunicacao consistente",
          text: "O site apresenta o restaurante com mais clareza e mais alinhamento com o atendimento da casa.",
        },
      ];

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <SiteHeader />

      <main className="pb-16">
        <section className="relative pt-10 pb-24">
          <div className="hero-orb left-[-1.5rem] top-12 h-40 w-40 bg-[rgba(182,135,66,0.18)]" />
          <div className="hero-orb right-[-1rem] top-32 h-52 w-52 bg-[rgba(95,123,109,0.18)] [animation-delay:2s]" />

          <div className="shell grid gap-8 lg:grid-cols-[1.04fr_0.96fr] lg:items-center">
            <div className="hero-stage luxury-card space-y-8 rounded-[2.8rem] p-7 md:p-8">
              <span className="section-eyebrow">
                <Sparkles size={14} />
                {voice.eyebrow}
              </span>

              <div className="space-y-5">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--sage)]">
                  Restaurante Pai Thiago
                </p>
                <h1 className="display-title page-hero-title text-balance text-[var(--forest)]">
                  {voice.title}
                </h1>
                <p className="page-lead max-w-2xl text-[var(--ink-soft)] sm:text-xl">
                  {voice.description}
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Link href={voice.primaryHref} className="button-primary w-full justify-center sm:w-auto">
                  {voice.primaryLabel}
                  <ArrowRight size={16} />
                </Link>
                <Link href={voice.secondaryHref} className="button-secondary w-full justify-center sm:w-auto">
                  {voice.secondaryLabel}
                </Link>
              </div>

              <div className="flex flex-wrap gap-3">
                <span className="info-chip">
                  <MapPin size={14} />
                  {restaurantInfo.city}
                </span>
                <span className="info-chip">
                  <Clock3 size={14} />
                  {restaurantInfo.schedule[0]}
                </span>
                <span className="info-chip">
                  <ChefHat size={14} />
                  cozinha autoral e operacao integrada
                </span>
              </div>

              <div className="metric-rail sm:grid-cols-3">
                {headlineMetrics.map((metric) => (
                  <article key={metric.label} className="stat-panel p-5">
                    <p className="text-xs uppercase tracking-[0.28em] text-[var(--gold)]">
                      {metric.label}
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-[var(--forest)]">
                      {metric.value}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                      {metric.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="hero-stage luxury-card-dark rounded-[2.8rem] p-6 text-[var(--cream)] md:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-[rgba(217,185,122,0.9)]">
                      Visao geral
                    </p>
                    <h2 className="display-title page-section-title mt-3 text-white">
                      Informacoes principais do restaurante em um unico painel
                    </h2>
                  </div>
                  <span className="rounded-full border border-[rgba(217,185,122,0.24)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgba(255,247,232,0.74)]">
                    sistema ao vivo
                  </span>
                </div>

                <div className="mt-8 grid gap-4">
                  <article className="rounded-[1.8rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.05)] p-5">
                    <div className="flex items-center gap-2 text-[rgba(217,185,122,0.86)]">
                      <ChefHat size={16} />
                      <span className="text-xs font-semibold uppercase tracking-[0.22em]">
                        Assinatura da casa
                      </span>
                    </div>
                    <p className="mt-4 text-2xl font-semibold text-white">
                      {spotlightItem?.name ?? "Cardapio principal"}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[rgba(255,247,232,0.72)]">
                      {spotlightItem?.description ??
                        "Cardapio autoral, atendimento atento e estrutura digital preparada para apoiar a operacao do restaurante."}
                    </p>
                    {spotlightItem ? (
                      <p className="mt-4 text-lg font-semibold text-[var(--gold-soft)]">
                        {formatCurrency(spotlightItem.price)}
                      </p>
                    ) : null}
                  </article>

                  <div className="grid gap-4 md:grid-cols-2">
                    <article className="rounded-[1.8rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.05)] p-5">
                      <div className="flex items-center gap-2 text-[rgba(217,185,122,0.86)]">
                        <MapPin size={16} />
                        <span className="text-xs font-semibold uppercase tracking-[0.22em]">
                          Endereco
                        </span>
                      </div>
                      <p className="mt-4 text-lg font-semibold text-white">
                        {restaurantInfo.address}
                      </p>
                      <p className="mt-2 text-sm text-[rgba(255,247,232,0.72)]">
                        {restaurantInfo.city}
                      </p>
                    </article>

                    <article className="rounded-[1.8rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.05)] p-5">
                      <div className="flex items-center gap-2 text-[rgba(217,185,122,0.86)]">
                        <Clock3 size={16} />
                        <span className="text-xs font-semibold uppercase tracking-[0.22em]">
                          Servico
                        </span>
                      </div>
                      <p className="mt-4 text-lg font-semibold text-white">
                        {restaurantInfo.schedule[0]}
                      </p>
                      <p className="mt-2 text-sm text-[rgba(255,247,232,0.72)]">
                        Ritmo da casa pensado para almoco, jantar e ocasioes especiais.
                      </p>
                    </article>
                  </div>

                  <article className="rounded-[1.8rem] border border-[rgba(217,185,122,0.16)] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5">
                    <div className="flex items-center gap-2 text-[rgba(217,185,122,0.86)]">
                      <CalendarRange size={16} />
                      <span className="text-xs font-semibold uppercase tracking-[0.22em]">
                        {isStaffRole(session.role) ? "Proximo atendimento" : "Sua proxima reserva"}
                      </span>
                    </div>

                    {upcomingReservation ? (
                      <>
                        <p className="mt-4 text-2xl font-semibold text-white">
                          {isStaffRole(session.role)
                            ? upcomingReservation.guestName
                            : upcomingReservation.occasion}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[rgba(255,247,232,0.72)]">
                          {formatReservationMoment(
                            upcomingReservation.date,
                            upcomingReservation.time,
                          )}{" "}
                          - {upcomingReservation.guests} pessoas
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[rgba(255,247,232,0.72)]">
                          {upcomingReservation.area}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="mt-4 text-2xl font-semibold text-white">
                          Agenda pronta para receber novas experiencias
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[rgba(255,247,232,0.72)]">
                          Assim que houver uma nova reserva relevante, ela ganha destaque aqui.
                        </p>
                      </>
                    )}
                  </article>
                </div>
              </div>

              <div className="floating-badge absolute -bottom-5 -left-2 hidden rounded-[1.7rem] p-4 md:block">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={18} className="text-[var(--gold)]" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--forest)]">
                      Estrutura por perfil
                    </p>
                    <p className="text-xs text-[rgba(21,35,29,0.66)]">
                      cliente, garcom, gerente e dono
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="shell section-frame pt-4">
          <div className="grid gap-5 lg:grid-cols-[1.06fr_0.94fr]">
            <div className="luxury-card rounded-[2.3rem] p-6">
              <SectionHeading
                eyebrow={isStaffRole(session.role) ? "Frentes ativas" : "Experiencias da casa"}
                title={
                  isStaffRole(session.role)
                    ? "Modulos internos organizados para a rotina da equipe"
                    : "Formatos de visita pensados para diferentes ocasioes"
                }
                description={
                  isStaffRole(session.role)
                    ? "A equipe acessa reservas, salao, atendimento, cardapio e gestao por frentes bem definidas."
                    : "Cardapio, reservas e eventos conversam entre si em uma linguagem clara e bem organizada."
                }
                compact
              />

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {featureCards.map((item) => {
                  if (item.href) {
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.key}
                        href={item.href}
                        className="stat-panel p-5 transition hover:-translate-y-0.5"
                      >
                        <p className="text-xs uppercase tracking-[0.24em] text-[var(--sage)]">
                          {item.eyebrow}
                        </p>
                        <div className="mt-4 flex items-start justify-between gap-4">
                          <h3 className="text-2xl font-semibold text-[var(--forest)]">
                            {item.title}
                          </h3>
                          {Icon ? <Icon className="text-[var(--gold)]" size={18} /> : null}
                        </div>
                        <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
                          {item.text}
                        </p>
                      </Link>
                    );
                  }

                  return (
                    <article
                      key={item.key}
                      className="stat-panel p-5"
                    >
                      <p className="text-xs uppercase tracking-[0.24em] text-[var(--sage)]">
                        {item.eyebrow}
                      </p>
                      <h3 className="mt-4 text-2xl font-semibold text-[var(--forest)]">
                        {item.title}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
                        {item.text}
                      </p>
                      <p className="mt-5 flex items-center gap-2 text-sm font-semibold text-[var(--gold)]">
                        <Users size={16} />
                        {item.meta}
                      </p>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="luxury-card rounded-[2.3rem] p-6">
              <SectionHeading
                eyebrow="Padrao da casa"
                title="O que sustenta a experiencia digital"
                description="Recursos que ajudam o site a comunicar o restaurante com mais clareza, confianca e consistencia."
                compact
              />

              <div className="mt-8 space-y-4">
                {standards.map((item) => (
                  <article
                    key={item.title}
                    className="stat-panel p-5"
                  >
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--gold)]">
                      padrao
                    </p>
                    <h3 className="mt-3 text-xl font-semibold text-[var(--forest)]">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
                      {item.text}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="shell section-frame pt-20">
          <div className="grid gap-5 lg:grid-cols-[0.96fr_1.04fr]">
            <div className="hero-stage luxury-card-dark rounded-[2.4rem] p-6 text-[var(--cream)]">
              <p className="text-xs uppercase tracking-[0.28em] text-[rgba(217,185,122,0.9)]">
                Rotas mais importantes
              </p>
              <h2 className="display-title page-section-title mt-4 text-white">
                Acesso rapido para continuar a experiencia
              </h2>

              <div className="mt-8 grid gap-4">
                {[
                  {
                    icon: ConciergeBell,
                    title: isStaffRole(session.role)
                      ? "Registrar nova reserva"
                      : "Solicitar reserva",
                    text: "Formulario integrado ao fluxo de atendimento do restaurante.",
                    href: "/reservas",
                  },
                  {
                    icon: Sparkles,
                    title: isStaffRole(session.role)
                      ? "Entrar na central interna"
                      : "Ver eventos e ocasioes",
                    text: isStaffRole(session.role)
                      ? "Acesso a operacao, equipe, salao e rotinas de acompanhamento."
                      : "Organize aniversarios, encontros e formatos de visita antes de reservar.",
                    href: isStaffRole(session.role) ? "/operacao" : "/eventos",
                  },
                  {
                    icon: ShieldCheck,
                    title: isStaffRole(session.role)
                      ? "Abrir painel do turno"
                      : "Ver cardapio completo",
                    text: isStaffRole(session.role)
                      ? "Visao consolidada das prioridades operacionais e indicadores do dia."
                      : "Pratos assinatura, categorias e informacoes essenciais do menu.",
                    href: isStaffRole(session.role) ? "/painel" : "/cardapio",
                  },
                ].map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="rounded-[1.7rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] p-5 transition hover:-translate-y-0.5"
                  >
                    <item.icon className="text-[var(--gold-soft)]" size={18} />
                    <h3 className="mt-4 text-xl font-semibold text-white">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-[rgba(255,247,232,0.72)]">
                      {item.text}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="luxury-card rounded-[2.4rem] p-6">
              <SectionHeading
                eyebrow="Hoje na casa"
                title="Leitura curta do que sustenta a experiencia"
                description="Um fechamento visual para reunir informacoes importantes do restaurante em uma apresentacao objetiva."
                compact
              />

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {categories.slice(0, 3).map((category) => (
                  <article
                    key={category.id}
                    className="stat-panel p-5"
                  >
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--sage)]">
                      categoria
                    </p>
                    <h3 className="mt-3 text-xl font-semibold text-[var(--forest)]">
                      {category.name}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
                      {category.description}
                    </p>
                    <p className="mt-5 text-sm font-semibold text-[var(--gold)]">
                      {category.items.length} item(ns)
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {!isStaffRole(session.role) ? (
          <>
            <section className="shell section-frame pt-20">
              <div className="grid gap-5 lg:grid-cols-[1.02fr_0.98fr]">
                <div className="luxury-card rounded-[2.3rem] p-6">
                  <SectionHeading
                    eyebrow="Sobre o restaurante"
                    title="Uma casa desenhada para unir cozinha, atendimento e memoria"
                    description="Historia, missao e valores apresentados como parte importante da identidade do restaurante."
                    compact
                  />

                  <p className="mt-8 max-w-3xl text-base leading-8 text-[var(--ink-soft)]">
                    {restaurantInfo.about.story}
                  </p>

                  <div className="mt-8 grid gap-4 md:grid-cols-3">
                    {restaurantInfo.about.values.map((value) => (
                      <article
                        key={value.title}
                        className="stat-panel p-5"
                      >
                        <p className="text-xs uppercase tracking-[0.24em] text-[var(--gold)]">
                          valor
                        </p>
                        <h3 className="mt-3 text-xl font-semibold text-[var(--forest)]">
                          {value.title}
                        </h3>
                        <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
                          {value.text}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="hero-stage luxury-card-dark rounded-[2.3rem] p-6 text-[var(--cream)]">
                  <p className="text-xs uppercase tracking-[0.28em] text-[rgba(217,185,122,0.9)]">
                    Missao da casa
                  </p>
                  <h2 className="display-title page-section-title mt-4 max-w-4xl text-white">
                    Um restaurante profissional precisa contar bem quem ele e
                  </h2>
                  <p className="mt-4 text-base leading-8 text-[rgba(255,247,232,0.76)]">
                    {restaurantInfo.about.mission}
                  </p>

                  <div className="mt-8 space-y-3">
                    {restaurantInfo.serviceNotes.map((note) => (
                      <div
                        key={note}
                        className="rounded-[1.5rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm leading-7 text-[rgba(255,247,232,0.74)]"
                      >
                        {note}
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link href="/reservas" className="button-primary w-full justify-center sm:w-auto">
                      Reservar mesa
                    </Link>
                    <Link href="/contato" className="button-ghost w-full justify-center sm:w-auto">
                      Ver contato
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            <section className="shell section-frame pt-20">
              <SectionHeading
                eyebrow="Galeria da casa"
                title="Recortes que ajudam o cliente a sentir o restaurante antes da visita"
                description="Ambiente, cozinha, assinatura e espacos especiais organizados como uma galeria editorial."
              />

              <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {restaurantInfo.gallery.map((scene) => (
                  <article
                    key={scene.key}
                    className={`scene-card luxury-card rounded-[2.1rem] p-5 ${getGalleryToneClass(scene.tone)}`}
                  >
                    <div className={`scene-visual ${getGalleryToneClass(scene.tone)}`}>
                      {scene.imageUrl ? (
                        <Image
                          src={scene.imageUrl}
                          alt={scene.title}
                          className="h-full w-full rounded-[1.4rem] object-cover"
                          width={1400}
                          height={900}
                          loading="lazy"
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                          referrerPolicy="no-referrer"
                        />
                      ) : null}
                    </div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--gold)]">
                      Galeria
                    </p>
                    <h3 className="mt-6 text-3xl font-semibold text-[var(--forest)]">
                      {scene.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
                      {scene.description}
                    </p>
                    <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sage)]">
                      {scene.caption}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section className="shell section-frame pt-20">
              <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
                <div className="luxury-card rounded-[2.3rem] p-6">
                  <SectionHeading
                    eyebrow="Depoimentos"
                    title="Sinais de confianca para quem esta conhecendo a casa"
                    description="Avaliacoes e relatos ajudam a transformar interesse em reserva."
                    compact
                  />

                  <div className="mt-8 space-y-4">
                    {testimonials.map((testimonial) => (
                      <article
                        key={testimonial.name}
                        className="quote-panel stat-panel p-5"
                      >
                        <p className="text-xs uppercase tracking-[0.24em] text-[var(--gold)]">
                          depoimento
                        </p>
                        <p className="mt-4 text-base leading-8 text-[var(--ink-soft)]">
                          &ldquo;{testimonial.quote}&rdquo;
                        </p>
                        <p className="mt-4 text-lg font-semibold text-[var(--forest)]">
                          {testimonial.name}
                        </p>
                        <p className="text-sm text-[rgba(21,35,29,0.64)]">
                          {testimonial.role}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="luxury-card rounded-[2.3rem] p-6">
                  <SectionHeading
                    eyebrow="Contato e integracoes"
                    title="Tudo que um cliente espera encontrar sem procurar demais"
                    description="Mapa, telefone, redes sociais, Google Business e contato direto em uma unica area."
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
                      <h3 className="mt-4 text-lg font-semibold text-[var(--forest)]">
                        Google Maps
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                        {restaurantInfo.address}, {restaurantInfo.city}
                      </p>
                    </a>

                    <a
                      href={restaurantInfo.whatsappHref}
                      target="_blank"
                      rel="noreferrer"
                      className="contact-chip transition hover:-translate-y-0.5"
                    >
                      <MessageCircle className="text-[var(--gold)]" size={18} />
                      <h3 className="mt-4 text-lg font-semibold text-[var(--forest)]">
                        WhatsApp
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                        {restaurantInfo.whatsapp}
                      </p>
                    </a>

                    <a
                      href={restaurantInfo.instagramUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="contact-chip transition hover:-translate-y-0.5"
                    >
                      <Instagram className="text-[var(--gold)]" size={18} />
                      <h3 className="mt-4 text-lg font-semibold text-[var(--forest)]">
                        Instagram
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                        {restaurantInfo.instagramHandle}
                      </p>
                    </a>

                    <a
                      href={restaurantInfo.googleBusinessUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="contact-chip transition hover:-translate-y-0.5"
                    >
                      <Star className="text-[var(--gold)]" size={18} />
                      <h3 className="mt-4 text-lg font-semibold text-[var(--forest)]">
                        Google Business
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                        SEO local, descoberta e reputacao da casa.
                      </p>
                    </a>
                  </div>

                  <div className="contact-chip mt-6">
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--gold)]">
                      Horarios e feriados
                    </p>
                    <div className="mt-3 space-y-1 text-sm leading-7 text-[var(--ink-soft)]">
                      {restaurantInfo.schedule.map((item) => (
                        <p key={item}>{item}</p>
                      ))}
                    </div>
                    <p className="mt-4 text-sm leading-6 text-[rgba(21,35,29,0.66)]">
                      {restaurantInfo.holidayPolicy}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  );
}
