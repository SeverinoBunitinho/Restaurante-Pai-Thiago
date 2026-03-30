"use client";

import { useActionState } from "react";
import {
  Globe,
  MapPin,
  MessageCircle,
  Route,
  ShieldCheck,
  Store,
} from "lucide-react";

import {
  initialDeliveryZoneState,
  initialRestaurantSettingsState,
} from "@/app/operacao/configuracoes/action-state";
import {
  createDeliveryZoneAction,
  toggleDeliveryZoneActiveAction,
  updateRestaurantSettingsAction,
} from "@/app/operacao/actions";
import { SubmitButton } from "@/components/submit-button";
import { cn, formatCurrency } from "@/lib/utils";

export function RestaurantSettingsPanel({ settings, preview, deliveryZones }) {
  const [settingsState, settingsAction] = useActionState(
    updateRestaurantSettingsAction,
    initialRestaurantSettingsState,
  );
  const [zoneState, zoneAction] = useActionState(
    createDeliveryZoneAction,
    initialDeliveryZoneState,
  );

  return (
    <div className="grid gap-5">
      <section className="luxury-card rounded-[2.2rem] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--gold)]">
              Configuracoes gerais
            </p>
            <h2 className="page-panel-title mt-3 font-semibold text-[var(--forest)]">
              Dados que alimentam o site, o checkout e a presenca da casa
            </h2>
          </div>
          <div className="rounded-full border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.7)] px-4 py-2 text-sm font-semibold text-[var(--forest)]">
            sincronizacao em tempo real
          </div>
        </div>

        <form action={settingsAction} className="mt-8 grid gap-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-[var(--forest)]">
              Nome do restaurante
              <input
                name="name"
                defaultValue={settings.name}
                required
                className="rounded-[1.4rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-[var(--forest)]">
              Assinatura da marca
              <input
                name="tagline"
                defaultValue={settings.tagline}
                required
                className="rounded-[1.4rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
              />
            </label>
          </div>

          <label className="grid gap-2 text-sm font-medium text-[var(--forest)]">
            Descricao institucional
            <textarea
              name="description"
              rows={4}
              defaultValue={settings.description}
              required
              className="rounded-[1.6rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
            />
          </label>

          <div className="grid gap-4 lg:grid-cols-3">
            <label className="grid gap-2 text-sm font-medium text-[var(--forest)]">
              Endereco
              <input
                name="address"
                defaultValue={settings.address}
                required
                className="rounded-[1.4rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-[var(--forest)]">
              Cidade e regiao
              <input
                name="city"
                defaultValue={settings.city}
                required
                className="rounded-[1.4rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-[var(--forest)]">
              Link do Google Maps
              <input
                name="mapUrl"
                defaultValue={settings.mapUrl}
                className="rounded-[1.4rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
              />
            </label>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <label className="grid gap-2 text-sm font-medium text-[var(--forest)]">
              Telefone
              <input
                name="phone"
                defaultValue={settings.phone}
                required
                className="rounded-[1.4rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-[var(--forest)]">
              WhatsApp
              <input
                name="whatsapp"
                defaultValue={settings.whatsapp}
                required
                className="rounded-[1.4rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-[var(--forest)]">
              E-mail principal
              <input
                name="email"
                type="email"
                defaultValue={settings.email}
                required
                className="rounded-[1.4rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
              />
            </label>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-[var(--forest)]">
              Google Business
              <input
                name="googleBusinessUrl"
                defaultValue={settings.googleBusinessUrl}
                className="rounded-[1.4rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-[var(--forest)]">
              Instagram
              <input
                name="instagramUrl"
                defaultValue={settings.instagramUrl}
                className="rounded-[1.4rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
              />
            </label>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <label className="grid gap-2 text-sm font-medium text-[var(--forest)]">
              Facebook
              <input
                name="facebookUrl"
                defaultValue={settings.facebookUrl}
                className="rounded-[1.4rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-[var(--forest)]">
              Handle do Instagram
              <input
                name="instagramHandle"
                defaultValue={settings.instagramHandle}
                className="rounded-[1.4rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-[var(--forest)]">
              Handle do Facebook
              <input
                name="facebookHandle"
                defaultValue={settings.facebookHandle}
                className="rounded-[1.4rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
              />
            </label>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-[var(--forest)]">
              Horarios da casa
              <textarea
                name="scheduleText"
                rows={4}
                defaultValue={settings.scheduleText}
                required
                className="rounded-[1.6rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-[var(--forest)]">
              Notas de servico
              <textarea
                name="serviceNotesText"
                rows={4}
                defaultValue={settings.serviceNotesText}
                required
                className="rounded-[1.6rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
              />
            </label>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_0.8fr_0.8fr]">
            <label className="grid gap-2 text-sm font-medium text-[var(--forest)]">
              Politica para feriados
              <textarea
                name="holidayPolicy"
                rows={4}
                defaultValue={settings.holidayPolicy}
                className="rounded-[1.6rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-[var(--forest)]">
              Cobertura do delivery
              <textarea
                name="deliveryCoverageNote"
                rows={4}
                defaultValue={settings.deliveryCoverageNote}
                className="rounded-[1.6rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-[var(--forest)]">
              Pedido minimo
              <input
                name="deliveryMinimumOrder"
                type="number"
                step="0.01"
                min="0"
                defaultValue={settings.deliveryMinimumOrder}
                required
                className="rounded-[1.4rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-[var(--forest)]">
              Retirada em ate
              <input
                name="pickupEtaMinutes"
                type="number"
                min="0"
                defaultValue={settings.pickupEtaMinutes}
                required
                className="rounded-[1.4rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
              />
            </label>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-[var(--forest)]">
              WhatsApp do delivery
              <input
                name="deliveryHotline"
                defaultValue={settings.deliveryHotline}
                className="rounded-[1.4rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-3">
              <article className="rounded-[1.5rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-4">
                <MapPin className="text-[var(--gold)]" size={16} />
                <p className="mt-3 text-xs uppercase tracking-[0.2em] text-[var(--sage)]">
                  Endereco
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--forest)]">
                  {preview.address}
                </p>
              </article>

              <article className="rounded-[1.5rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-4">
                <MessageCircle className="text-[var(--gold)]" size={16} />
                <p className="mt-3 text-xs uppercase tracking-[0.2em] text-[var(--sage)]">
                  Delivery
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--forest)]">
                  {preview.delivery.neighborhoods.length} zonas ativas
                </p>
              </article>

              <article className="rounded-[1.5rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-4">
                <Globe className="text-[var(--gold)]" size={16} />
                <p className="mt-3 text-xs uppercase tracking-[0.2em] text-[var(--sage)]">
                  Canais
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--forest)]">
                  site, maps e redes
                </p>
              </article>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-[var(--forest)]">
              Historia da casa
              <textarea
                name="aboutStory"
                rows={5}
                defaultValue={settings.aboutStory}
                className="rounded-[1.6rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-[var(--forest)]">
              Missao institucional
              <textarea
                name="aboutMission"
                rows={5}
                defaultValue={settings.aboutMission}
                className="rounded-[1.6rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
              />
            </label>
          </div>

          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <SubmitButton
              idleLabel="Salvar configuracoes"
              pendingLabel="Salvando configuracoes..."
              className="xl:w-auto"
            />
            <p className="max-w-2xl text-sm leading-6 text-[rgba(21,35,29,0.68)]">
              Essas informacoes alimentam home, contato, reservas, delivery,
              carrinho, footer e identidade principal do restaurante.
            </p>
          </div>

          {settingsState.status !== "idle" ? (
            <div
              className={cn(
                "rounded-[1.4rem] border px-4 py-3 text-sm leading-6",
                settingsState.status === "success"
                  ? "border-[rgba(95,123,109,0.22)] bg-[rgba(95,123,109,0.08)] text-[var(--forest)]"
                  : "border-[rgba(138,93,59,0.22)] bg-[rgba(138,93,59,0.08)] text-[var(--clay)]",
              )}
            >
              {settingsState.message}
            </div>
          ) : null}
        </form>
      </section>

      <section className="grid items-start gap-5 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="luxury-card rounded-[2.2rem] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--gold)]">
            Zonas de delivery
          </p>
          <h2 className="page-panel-title mt-3 font-semibold text-[var(--forest)]">
            Cobertura ativa para o checkout profissional
          </h2>

          <div className="mt-8 space-y-4">
            {deliveryZones.length ? (
              deliveryZones.map((zone) => (
                <article
                  key={zone.id}
                  className="rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--sage)]">
                        slug {zone.slug}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-[var(--forest)]">
                        {zone.name}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.7)]">
                        {zone.window || "Sem faixa de entrega informada."}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`pill-wrap-safe rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
                          zone.active
                            ? "bg-[rgba(95,123,109,0.12)] text-[var(--sage)]"
                            : "bg-[rgba(138,93,59,0.12)] text-[var(--clay)]"
                        }`}
                      >
                        {zone.active ? "ativa" : "pausada"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[1.3rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.52)] px-4 py-3 text-sm">
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--sage)]">
                        Taxa
                      </p>
                      <p className="mt-2 font-semibold text-[var(--forest)]">
                        {formatCurrency(zone.fee)}
                      </p>
                    </div>
                    <div className="rounded-[1.3rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.52)] px-4 py-3 text-sm">
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--sage)]">
                        Prazo
                      </p>
                      <p className="mt-2 font-semibold text-[var(--forest)]">
                        {zone.etaMinutes} min
                      </p>
                    </div>
                    <div className="rounded-[1.3rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.52)] px-4 py-3 text-sm">
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--sage)]">
                        Ordem
                      </p>
                      <p className="mt-2 font-semibold text-[var(--forest)]">
                        {zone.sortOrder}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <form action={toggleDeliveryZoneActiveAction} className="max-w-full">
                      <input type="hidden" name="zoneId" value={zone.id} />
                      <input
                        type="hidden"
                        name="nextActive"
                        value={String(!zone.active)}
                      />
                      <button
                        type="submit"
                        className="pill-wrap-safe rounded-full border border-[rgba(20,35,29,0.12)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--forest)] transition hover:-translate-y-0.5"
                      >
                        {zone.active ? "Pausar cobertura" : "Reativar cobertura"}
                      </button>
                    </form>

                    <p className="text-sm leading-6 text-[rgba(21,35,29,0.68)]">
                      Quando a zona fica pausada, ela sai do checkout e deixa de
                      receber pedidos novos.
                    </p>
                  </div>
                </article>
              ))
            ) : (
              <article className="rounded-[1.6rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.5)] p-6">
                <p className="text-lg font-semibold text-[var(--forest)]">
                  Nenhuma zona cadastrada
                </p>
                <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.7)]">
                  Cadastre a primeira cobertura de delivery para liberar a
                  entrega real no checkout.
                </p>
              </article>
            )}
          </div>
        </div>

        <div className="luxury-card-dark h-fit self-start rounded-[2.2rem] p-6 text-[var(--cream)]">
          <p className="text-xs uppercase tracking-[0.28em] text-[rgba(217,185,122,0.92)]">
            Nova cobertura
          </p>
          <h2 className="display-title page-section-title mt-4 text-white">
            Adicione bairros e janelas de entrega
          </h2>
          <p className="mt-4 text-sm leading-7 text-[rgba(255,247,232,0.76)]">
            Cada zona criada aqui entra no fluxo do carrinho e passa a ser
            considerada na taxa e no prazo do delivery.
          </p>

          <form action={zoneAction} className="mt-8 grid gap-4">
            <label className="grid gap-2 text-sm font-medium text-white">
              Nome do bairro ou cobertura
              <input
                name="name"
                required
                placeholder="Ex.: Jardim Paulista"
                className="rounded-[1.4rem] border border-[rgba(217,185,122,0.18)] bg-[rgba(255,255,255,0.08)] px-4 py-3 text-[var(--cream)] outline-none transition placeholder:text-[rgba(255,247,232,0.44)] focus:border-[var(--gold-soft)]"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="grid gap-2 text-sm font-medium text-white">
                Taxa
                <input
                  name="fee"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="8.00"
                  className="rounded-[1.4rem] border border-[rgba(217,185,122,0.18)] bg-[rgba(255,255,255,0.08)] px-4 py-3 text-[var(--cream)] outline-none transition placeholder:text-[rgba(255,247,232,0.44)] focus:border-[var(--gold-soft)]"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-white">
                ETA em minutos
                <input
                  name="etaMinutes"
                  type="number"
                  min="0"
                  required
                  placeholder="40"
                  className="rounded-[1.4rem] border border-[rgba(217,185,122,0.18)] bg-[rgba(255,255,255,0.08)] px-4 py-3 text-[var(--cream)] outline-none transition placeholder:text-[rgba(255,247,232,0.44)] focus:border-[var(--gold-soft)]"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-white">
                Ordem
                <input
                  name="sortOrder"
                  type="number"
                  min="0"
                  defaultValue="0"
                  className="rounded-[1.4rem] border border-[rgba(217,185,122,0.18)] bg-[rgba(255,255,255,0.08)] px-4 py-3 text-[var(--cream)] outline-none transition placeholder:text-[rgba(255,247,232,0.44)] focus:border-[var(--gold-soft)]"
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm font-medium text-white">
              Janela de entrega
              <input
                name="serviceWindow"
                placeholder="Entrega estimada em 35 a 45 minutos."
                className="rounded-[1.4rem] border border-[rgba(217,185,122,0.18)] bg-[rgba(255,255,255,0.08)] px-4 py-3 text-[var(--cream)] outline-none transition placeholder:text-[rgba(255,247,232,0.44)] focus:border-[var(--gold-soft)]"
              />
            </label>

            <label className="inline-flex items-center gap-3 rounded-full border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm font-medium text-[rgba(255,247,232,0.82)]">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked
                className="accent-[var(--gold-soft)]"
              />
              Entrar ativa no checkout
            </label>

            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <SubmitButton
                idleLabel="Cadastrar zona"
                pendingLabel="Salvando zona..."
                className="xl:w-auto"
              />
              <div className="inline-flex items-center gap-2 text-sm leading-6 text-[rgba(255,247,232,0.72)]">
                <ShieldCheck size={16} className="text-[var(--gold-soft)]" />
                gerente e dono controlam a cobertura real do delivery
              </div>
            </div>

            {zoneState.status !== "idle" ? (
              <div
                className={cn(
                  "rounded-[1.4rem] border px-4 py-3 text-sm leading-6",
                  zoneState.status === "success"
                    ? "border-[rgba(95,123,109,0.28)] bg-[rgba(95,123,109,0.12)] text-white"
                    : "border-[rgba(255,167,132,0.28)] bg-[rgba(138,93,59,0.16)] text-[rgba(255,228,214,0.92)]",
                )}
              >
                {zoneState.message}
              </div>
            ) : null}
          </form>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <article className="rounded-[1.6rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] p-5">
              <Store className="text-[var(--gold-soft)]" size={18} />
              <p className="mt-4 text-sm font-semibold uppercase tracking-[0.22em] text-[rgba(217,185,122,0.9)]">
                Retirada
              </p>
              <p className="mt-2 text-sm leading-6 text-[rgba(255,247,232,0.72)]">
                ETA atual da casa: {preview.delivery.pickupEtaMinutes} minutos.
              </p>
            </article>

            <article className="rounded-[1.6rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] p-5">
              <Route className="text-[var(--gold-soft)]" size={18} />
              <p className="mt-4 text-sm font-semibold uppercase tracking-[0.22em] text-[rgba(217,185,122,0.9)]">
                Pedido minimo
              </p>
              <p className="mt-2 text-sm leading-6 text-[rgba(255,247,232,0.72)]">
                {formatCurrency(preview.delivery.minimumOrder)} em itens para
                liberar o delivery.
              </p>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}
