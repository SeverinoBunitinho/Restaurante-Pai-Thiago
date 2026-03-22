import {
  CalendarCheck2,
  Clock3,
  ClipboardList,
  MapPinned,
} from "lucide-react";

import { ReservationForm } from "@/components/reservation-form";
import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { requireAuth } from "@/lib/auth";
import { getRestaurantProfile } from "@/lib/restaurant-profile";
import { getReservationAreaOptions } from "@/lib/site-data";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default async function ReservasPage() {
  const session = await requireAuth();
  const isStaff = session.role !== "customer";
  const [areaOptions, liveMode, restaurantInfo] = await Promise.all([
    getReservationAreaOptions(),
    Promise.resolve(isSupabaseConfigured()),
    getRestaurantProfile(),
  ]);

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="pb-16">
        <section className="shell pt-12">
          <div className="grid gap-5 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="luxury-card-dark rounded-[2.4rem] p-7 text-[var(--cream)] md:p-10">
              <p className="text-xs uppercase tracking-[0.28em] text-[rgba(217,185,122,0.92)]">
                Reservas
              </p>
              <h1 className="display-title page-hero-title mt-4 text-white">
                {isStaff
                  ? "Registro interno de atendimentos e mesas"
                  : "Sua proxima visita com atendimento elegante"}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[rgba(255,247,232,0.74)]">
                {isStaff
                  ? "Garcom, gerente e dono podem registrar pedidos de reserva recebidos por telefone, WhatsApp ou atendimento presencial."
                  : "O formulario usa os dados da sua conta para acelerar o atendimento e organizar a experiencia antes da chegada."}
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.6rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] p-5">
                  <Clock3 className="text-[var(--gold-soft)]" size={18} />
                  <p className="mt-4 text-sm font-semibold uppercase tracking-[0.22em] text-[rgba(217,185,122,0.9)]">
                    Horarios
                  </p>
                  <div className="mt-2 space-y-1 text-sm leading-7 text-[rgba(255,247,232,0.76)]">
                    {restaurantInfo.schedule.map((item) => (
                      <p key={item}>{item}</p>
                    ))}
                  </div>
                </div>
                <div className="rounded-[1.6rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] p-5">
                  <MapPinned className="text-[var(--gold-soft)]" size={18} />
                  <p className="mt-4 text-sm font-semibold uppercase tracking-[0.22em] text-[rgba(217,185,122,0.9)]">
                    Base da casa
                  </p>
                  <p className="mt-2 text-base font-semibold text-white">
                    {restaurantInfo.address}
                  </p>
                  <p className="mt-1 text-sm text-[rgba(255,247,232,0.76)]">
                    {restaurantInfo.city}
                  </p>
                </div>
              </div>
            </div>

            <div className="luxury-card rounded-[2.4rem] p-7 md:p-10">
              <SectionHeading
                eyebrow={isStaff ? "Atendimento interno" : "Minha solicitacao"}
                title={
                  isStaff
                    ? "Registre uma nova reserva para a equipe"
                    : "Escolha a data ideal e envie sua reserva"
                }
                description={
                  isStaff
                    ? "O sistema grava a demanda com origem interna e deixa o historico centralizado para o restaurante."
                    : "A reserva fica vinculada a sua conta e segue para acompanhamento da equipe."
                }
                compact
              />
              <div className="mt-8">
                <ReservationForm
                  role={session.role}
                  areaOptions={areaOptions}
                  liveMode={liveMode}
                  defaults={{
                    guestName: isStaff ? "" : session.profile.full_name,
                    email: isStaff ? "" : session.profile.email,
                    phone: isStaff ? "" : session.profile.phone,
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="shell pt-20">
          <div className="grid gap-5 lg:grid-cols-3">
            {[
              {
                icon: CalendarCheck2,
                title: isStaff ? "Fila centralizada" : "Historico organizado",
                text: isStaff
                  ? "Cada pedido de reserva fica registrado com data, horario, origem e observacoes."
                  : "Sua conta concentra visitas passadas e proximas reservas em uma area propria.",
              },
              {
                icon: ClipboardList,
                title: isStaff ? "Atendimento da equipe" : "Atendimento personalizado",
                text: isStaff
                  ? "Garcom e gerente conseguem registrar rapidamente pedidos vindos de varios canais."
                  : "A equipe recebe o contexto da sua visita e consegue preparar um atendimento melhor.",
              },
              {
                icon: Clock3,
                title: "Confirmacao clara",
                text: isStaff
                  ? "A reserva entra no fluxo operacional com status e prioridade definidos."
                  : "Depois do envio, voce acompanha o status da reserva na sua conta.",
              },
            ].map((item) => (
              <article key={item.title} className="luxury-card rounded-[2rem] p-6">
                <item.icon className="text-[var(--gold)]" size={22} />
                <h2 className="mt-5 text-2xl font-semibold text-[var(--forest)]">
                  {item.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[rgba(21,35,29,0.72)]">
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
