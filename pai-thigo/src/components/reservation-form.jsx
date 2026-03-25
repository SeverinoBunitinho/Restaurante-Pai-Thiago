"use client";

import { useActionState, useEffect, useState } from "react";

import { initialReservationState } from "@/app/reservas/action-state";
import { submitReservationAction } from "@/app/reservas/actions";
import { SubmitButton } from "@/components/submit-button";
import { cn } from "@/lib/utils";

function getTodayInBrazil() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getNextReservationTimeInBrazil() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const hoursPart = Number(
    parts.find((part) => part.type === "hour")?.value ?? "19",
  );
  const minutesPart = Number(
    parts.find((part) => part.type === "minute")?.value ?? "00",
  );

  if (!Number.isFinite(hoursPart) || !Number.isFinite(minutesPart)) {
    return "19:00";
  }

  let totalMinutes = hoursPart * 60 + minutesPart + 60;
  totalMinutes = Math.ceil(totalMinutes / 30) * 30;
  totalMinutes = Math.min(Math.max(totalMinutes, 0), 23 * 60 + 30);

  const normalizedHours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const normalizedMinutes = String(totalMinutes % 60).padStart(2, "0");

  return `${normalizedHours}:${normalizedMinutes}`;
}

function formatRealtimeMoment(value) {
  if (!value) {
    return "";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(parsedDate);
}

export function ReservationForm({
  defaults = {},
  role = "customer",
  areaOptions = [],
  liveMode = true,
}) {
  const [state, formAction] = useActionState(
    submitReservationAction,
    initialReservationState,
  );

  const isStaff = role !== "customer";
  const resolvedAreas = areaOptions.length
    ? areaOptions
    : ["Salao principal", "Lounge", "Sala reservada", "Varanda"];
  const areaSelectOptions = [
    { value: "__ANY__", label: "Sem preferencia" },
    ...resolvedAreas.map((option) => ({
      value: option,
      label: option,
    })),
  ];
  const defaultAreaValue = defaults.areaPreference
    ? defaults.areaPreference
    : "__ANY__";
  const [reservationDate, setReservationDate] = useState(
    defaults.date ?? getTodayInBrazil(),
  );
  const [reservationTime, setReservationTime] = useState(
    defaults.time ?? getNextReservationTimeInBrazil(),
  );
  const [reservationGuests, setReservationGuests] = useState(
    String(defaults.guests ?? 2),
  );
  const [guestName, setGuestName] = useState(defaults.guestName ?? "");
  const [guestPhone, setGuestPhone] = useState(defaults.phone ?? "");
  const [reservationArea, setReservationArea] = useState(defaultAreaValue);
  const [selectedTableId, setSelectedTableId] = useState("");
  const [availabilityRequested, setAvailabilityRequested] = useState(false);
  const [availability, setAvailability] = useState({
    status: "idle",
    message:
      "Preencha os dados e clique em Ver disponibilidade para consultar as mesas em tempo real.",
    data: null,
  });
  const guestsNumber = Number(reservationGuests);
  const hasCoreCredentials =
    guestName.trim().length >= 3 && guestPhone.trim().length >= 8;
  const hasAreaSelected = Boolean(reservationArea) && reservationArea !== "__ANY__";
  const hasValidAvailabilityFilters =
    liveMode &&
    Boolean(reservationDate) &&
    Boolean(reservationTime) &&
    Number.isFinite(guestsNumber) &&
    guestsNumber >= 1 &&
    guestsNumber <= 20 &&
    hasAreaSelected;
  const canRequestAvailability = hasCoreCredentials && hasValidAvailabilityFilters;
  const isAvailabilityUnlocked = availabilityRequested && canRequestAvailability;
  const availabilityView = isAvailabilityUnlocked
    ? availability
    : {
        status: liveMode ? "idle" : "unavailable",
        message: liveMode
          ? "Preencha os campos obrigatorios, selecione a area e clique em Ver disponibilidade."
          : "Conecte o Supabase para liberar a leitura real de ocupacao de mesas.",
        data: null,
      };
  const tablesInCurrentView = availabilityView.data?.tablesOverviewInView ?? [];
  const freeTablesInCurrentView = tablesInCurrentView.filter((table) => !table.occupied);
  const occupiedTablesInCurrentView = tablesInCurrentView.filter(
    (table) => table.occupied,
  );
  const compatibleFreeTablesInCurrentView = freeTablesInCurrentView.filter(
    (table) => table.compatible,
  );
  const selectedTableSnapshot =
    tablesInCurrentView.find((table) => table.id === selectedTableId) ?? null;
  const isSelectedTableStillAvailable = compatibleFreeTablesInCurrentView.some(
    (table) => table.id === selectedTableId,
  );
  const effectiveSelectedTableId = isSelectedTableStillAvailable ? selectedTableId : "";

  useEffect(() => {
    if (!isAvailabilityUnlocked) {
      return undefined;
    }

    let active = true;
    let latestController = null;
    let hasLoadedOnce = false;

    const runAvailabilityRefresh = async ({ silent }) => {
      if (!active) {
        return;
      }

      const controller = new AbortController();
      latestController = controller;

      if (!silent) {
        setAvailability({
          status: "loading",
          message: "Atualizando disponibilidade...",
          data: null,
        });
      }

      try {
        const params = new URLSearchParams({
          date: reservationDate,
          time: reservationTime,
          guests: String(guestsNumber),
        });

        if (reservationArea && reservationArea !== "__ANY__") {
          params.set("area", reservationArea);
        }

        const response = await fetch(
          `/api/reservas/disponibilidade?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          },
        );
        const payload = await response.json().catch(() => null);

        if (!active) {
          return;
        }

        if (!response.ok || !payload?.ok || !payload.data) {
          if (silent) {
            setAvailability((currentState) => ({
              ...currentState,
              status: currentState.data ? "success" : "error",
              message:
                payload?.message ??
                "A leitura em tempo real falhou agora. Mantendo o ultimo estado disponivel.",
            }));
          } else {
            setAvailability({
              status: "error",
              message:
                payload?.message ??
                "Nao foi possivel consultar as mesas agora. Tente novamente.",
              data: null,
            });
          }
          return;
        }

        setAvailability({
          status: "success",
          message: payload.data.guidance ?? "Disponibilidade atualizada.",
          data: payload.data,
        });
      } catch (error) {
        if (error?.name === "AbortError" || !active) {
          return;
        }

        if (silent) {
          setAvailability((currentState) => ({
            ...currentState,
            status: currentState.data ? "success" : "error",
            message:
              "A leitura em tempo real falhou agora. Mantendo o ultimo estado disponivel.",
          }));
        } else {
          setAvailability({
            status: "error",
            message:
              "Falha ao consultar disponibilidade no momento. Tente novamente.",
            data: null,
          });
        }
      }
    };

    const initialTimeout = setTimeout(() => {
      hasLoadedOnce = true;
      void runAvailabilityRefresh({ silent: false });
    }, 200);
    const realtimeInterval = setInterval(() => {
      void runAvailabilityRefresh({ silent: hasLoadedOnce });
      hasLoadedOnce = true;
    }, 10000);

    return () => {
      active = false;
      clearTimeout(initialTimeout);
      clearInterval(realtimeInterval);
      latestController?.abort();
    };
  }, [
    isAvailabilityUnlocked,
    reservationArea,
    reservationDate,
    reservationTime,
    guestsNumber,
  ]);

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="selectedTableId" value={effectiveSelectedTableId} />

      <div className="rounded-[1.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.72)] px-4 py-3 text-sm leading-6 text-[rgba(21,35,29,0.68)]">
        {isStaff
          ? "Use este formulario para registrar reservas por telefone, WhatsApp ou atendimento da equipe. O sistema valida disponibilidade real por horario e capacidade."
          : "Seus dados da conta ajudam a acelerar a reserva. Antes de salvar, o sistema valida disponibilidade real de mesa no horario escolhido."}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-[var(--forest)]">
          {isStaff ? "Nome do cliente" : "Nome completo"}
          <input
            name="guestName"
            required
            autoComplete="name"
            value={guestName}
            onChange={(event) => {
              setGuestName(event.target.value);
              setAvailabilityRequested(false);
              setSelectedTableId("");
            }}
            maxLength={100}
            placeholder="Ex.: Juliana Araujo"
            className="rounded-2xl border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.72)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[var(--forest)]">
          Telefone
          <input
            name="phone"
            required
            autoComplete="tel"
            inputMode="tel"
            value={guestPhone}
            onChange={(event) => {
              setGuestPhone(event.target.value);
              setAvailabilityRequested(false);
              setSelectedTableId("");
            }}
            maxLength={40}
            placeholder="(11) 99999-9999"
            className="rounded-2xl border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.72)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-[var(--forest)]">
          E-mail
          <input
            name="email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            inputMode="email"
            spellCheck={false}
            defaultValue={defaults.email ?? ""}
            maxLength={160}
            placeholder="voce@email.com"
            className="rounded-2xl border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.72)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[var(--forest)]">
          Ocasiao
          <input
            name="occasion"
            maxLength={120}
            placeholder="Aniversario, jantar de negocios..."
            className="rounded-2xl border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.72)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="grid min-w-0 gap-2 text-sm font-medium text-[var(--forest)]">
          Data
          <input
            name="date"
            type="date"
            min={getTodayInBrazil()}
            value={reservationDate}
            onChange={(event) => {
              setReservationDate(event.target.value);
              setAvailabilityRequested(false);
              setSelectedTableId("");
            }}
            required
            className="min-w-0 rounded-2xl border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.72)] px-4 py-3 pr-12 outline-none transition focus:border-[var(--gold)]"
          />
        </label>
        <label className="grid min-w-0 gap-2 text-sm font-medium text-[var(--forest)]">
          Horario
          <input
            name="time"
            type="time"
            value={reservationTime}
            onChange={(event) => {
              setReservationTime(event.target.value);
              setAvailabilityRequested(false);
              setSelectedTableId("");
            }}
            required
            className="min-w-0 rounded-2xl border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.72)] px-4 py-3 pr-12 outline-none transition focus:border-[var(--gold)]"
          />
        </label>
        <label className="grid min-w-0 gap-2 text-sm font-medium text-[var(--forest)]">
          Pessoas
          <input
            name="guests"
            type="number"
            min={1}
            max={20}
            value={reservationGuests}
            onChange={(event) => {
              setReservationGuests(event.target.value);
              setAvailabilityRequested(false);
              setSelectedTableId("");
            }}
            required
            className="min-w-0 rounded-2xl border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.72)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
          />
        </label>
        <label className="grid min-w-0 gap-2 text-sm font-medium text-[var(--forest)]">
          Area
          <select
            name="areaPreference"
            value={reservationArea}
            onChange={(event) => {
              setReservationArea(event.target.value);
              setAvailabilityRequested(false);
              setSelectedTableId("");
            }}
            className="min-w-0 rounded-2xl border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.72)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
          >
            {areaSelectOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            if (!canRequestAvailability) {
              setAvailability({
                status: "idle",
                message:
                  "Preencha nome, telefone, data, horario, pessoas e escolha uma area especifica para liberar as mesas.",
                data: null,
              });
              return;
            }

            setAvailabilityRequested(true);
          }}
          className={cn(
            "inline-flex items-center rounded-full border px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] transition",
            canRequestAvailability
              ? "border-[rgba(20,35,29,0.2)] bg-[rgba(20,35,29,0.9)] text-white hover:-translate-y-0.5"
              : "cursor-not-allowed border-[rgba(20,35,29,0.1)] bg-[rgba(255,255,255,0.7)] text-[rgba(21,35,29,0.48)]",
          )}
        >
          Ver disponibilidade
        </button>
        <p className="text-xs leading-5 text-[rgba(21,35,29,0.62)]">
          O mapa de mesas libera depois dos dados principais e atualiza em tempo real.
        </p>
      </div>

      <div className="rounded-[1.6rem] border border-[rgba(20,35,29,0.1)] bg-[rgba(255,255,255,0.72)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--sage)]">
            Disponibilidade em tempo real
          </p>
          <div className="flex items-center gap-2">
            {availabilityView.data?.generatedAt ? (
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgba(21,35,29,0.58)]">
                Atualizado {formatRealtimeMoment(availabilityView.data.generatedAt)}
              </span>
            ) : null}
            {availabilityView.status === "loading" ? (
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--gold)]">
                Atualizando
              </span>
            ) : null}
          </div>
        </div>

        {availabilityView.data ? (
          <>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Mesas ativas",
                  value: availabilityView.data.totalTables,
                },
                {
                  label: "Reservadas no horario",
                  value: availabilityView.data.occupiedTables,
                },
                {
                  label: "Livres no horario",
                  value: availabilityView.data.freeTables,
                },
                {
                  label: `Livres para ${availabilityView.data.guests} pessoa(s)`,
                  value: availabilityView.data.compatibleFreeTables,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-[rgba(20,35,29,0.1)] bg-white/80 px-3 py-3"
                >
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[rgba(21,35,29,0.62)]">
                    {item.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--forest)]">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div
              className={cn(
                "mt-4 rounded-2xl border px-4 py-3 text-sm leading-6",
                availabilityView.data.hasAvailability
                  ? "border-[rgba(95,123,109,0.2)] bg-[rgba(95,123,109,0.08)] text-[var(--forest)]"
                  : "border-[rgba(138,93,59,0.22)] bg-[rgba(138,93,59,0.08)] text-[var(--clay)]",
              )}
            >
              <p>{availabilityView.message}</p>
              {availabilityView.data.suggestedTable ? (
                <p className="mt-1">
                  Sugestao atual: {availabilityView.data.suggestedTable.name} (
                  {availabilityView.data.suggestedTable.area}).
                </p>
              ) : null}
            </div>

            <div className="mt-4 rounded-2xl border border-[rgba(20,35,29,0.1)] bg-white/80 p-3">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[rgba(21,35,29,0.64)]">
                Setores da casa
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {(availabilityView.data.areaSummaries ?? []).map((areaSummary) => (
                  <div
                    key={areaSummary.area}
                    className="rounded-xl border border-[rgba(20,35,29,0.1)] bg-[rgba(255,255,255,0.72)] px-3 py-2"
                  >
                    <p className="text-sm font-semibold text-[var(--forest)]">
                      {areaSummary.area}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[rgba(21,35,29,0.66)]">
                      {areaSummary.free} livre(s) - {areaSummary.occupied} ocupada(s)
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-[rgba(95,123,109,0.22)] bg-[rgba(95,123,109,0.08)] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--sage)]">
                  Mesas livres{" "}
                  {reservationArea === "__ANY__"
                    ? "na casa"
                    : `em ${availabilityView.data.selectedAreaSummary?.area ?? "area selecionada"}`}
                </p>
                <p className="mt-2 text-3xl font-semibold text-[var(--forest)]">
                  {freeTablesInCurrentView.length}
                </p>
                <p className="mt-1 text-xs leading-5 text-[rgba(21,35,29,0.66)]">
                  {freeTablesInCurrentView.length
                    ? `${freeTablesInCurrentView.length} mesa(s) livre(s) neste setor para o horario escolhido.`
                    : "Nenhuma mesa livre nesta selecao."}
                </p>
              </div>

              <div className="rounded-2xl border border-[rgba(138,93,59,0.2)] bg-[rgba(138,93,59,0.08)] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--clay)]">
                  Mesas ocupadas{" "}
                  {reservationArea === "__ANY__"
                    ? "na casa"
                    : `em ${availabilityView.data.selectedAreaSummary?.area ?? "area selecionada"}`}
                </p>
                <p className="mt-2 text-3xl font-semibold text-[rgba(96,65,42,1)]">
                  {occupiedTablesInCurrentView.length}
                </p>
                <p className="mt-1 text-xs leading-5 text-[rgba(96,65,42,0.76)]">
                  {occupiedTablesInCurrentView.length
                    ? `${occupiedTablesInCurrentView.length} mesa(s) ocupada(s) neste setor para o horario escolhido.`
                    : "Nenhuma mesa ocupada nesta selecao."}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[rgba(20,35,29,0.1)] bg-[rgba(255,255,255,0.85)] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--sage)]">
                  Escolha da mesa (opcional)
                </p>
                {effectiveSelectedTableId ? (
                  <button
                    type="button"
                    onClick={() => setSelectedTableId("")}
                    className="rounded-full border border-[rgba(20,35,29,0.16)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--forest)]"
                  >
                    Limpar escolha
                  </button>
                ) : null}
              </div>

              <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.7)]">
                Voce pode selecionar uma mesa livre agora. Se nao selecionar, o sistema escolhe automaticamente a melhor opcao.
              </p>

              {selectedTableId && !isSelectedTableStillAvailable ? (
                <p className="mt-2 rounded-xl border border-[rgba(138,93,59,0.22)] bg-[rgba(138,93,59,0.08)] px-3 py-2 text-xs font-semibold text-[var(--clay)]">
                  A mesa escolhida saiu da disponibilidade neste instante. Escolha outra mesa livre.
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2">
                {compatibleFreeTablesInCurrentView.map((table) => {
                  const active = table.id === effectiveSelectedTableId;

                  return (
                    <button
                      key={table.id}
                      type="button"
                      onClick={() => setSelectedTableId(table.id)}
                      className={cn(
                        "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold",
                        active
                          ? "border-[rgba(57,111,91,0.45)] bg-[rgba(95,123,109,0.16)] text-[var(--forest)]"
                          : "border-[rgba(20,35,29,0.18)] bg-white/90 text-[rgba(21,35,29,0.84)]",
                      )}
                    >
                      {table.name} - {table.capacity}p
                    </button>
                  );
                })}
                {!compatibleFreeTablesInCurrentView.length ? (
                  <span className="text-xs text-[rgba(21,35,29,0.66)]">
                    Nenhuma mesa livre compativel para essa configuracao agora.
                  </span>
                ) : null}
              </div>

              {selectedTableSnapshot ? (
                <p className="mt-2 text-xs leading-5 text-[rgba(21,35,29,0.72)]">
                  Selecionada: {selectedTableSnapshot.name} ({selectedTableSnapshot.area}) -{" "}
                  {selectedTableSnapshot.capacity} lugares.
                </p>
              ) : null}
            </div>
          </>
        ) : (
          <>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                "Mesas ativas",
                "Reservadas no horario",
                "Livres no horario",
                `Livres para ${Number.isFinite(guestsNumber) ? guestsNumber : "--"} pessoa(s)`,
              ].map((label) => (
                <div
                  key={label}
                  className="rounded-2xl border border-[rgba(20,35,29,0.1)] bg-white/70 px-3 py-3"
                >
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[rgba(21,35,29,0.62)]">
                    {label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-[rgba(21,35,29,0.34)]">
                    --
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm leading-6 text-[rgba(21,35,29,0.66)]">
              {availabilityView.message}
            </p>
          </>
        )}
      </div>

      <label className="grid gap-2 text-sm font-medium text-[var(--forest)]">
        Observacoes
        <textarea
          name="notes"
          rows={5}
          maxLength={500}
          placeholder="Preferencia de mesa, alergias, restricoes ou pedidos especiais."
          className="rounded-[1.6rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.72)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
        />
      </label>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SubmitButton />
        <p className="max-w-md text-sm leading-6 text-[rgba(21,35,29,0.66)]">
          {liveMode
            ? "Reserva salva com validacao de disponibilidade em tempo real no Supabase."
            : "As credenciais do Supabase precisam estar ativas para registrar reservas reais."}
        </p>
      </div>

      {state.status !== "idle" ? (
        <div
          className={cn(
            "rounded-[1.4rem] border px-4 py-3 text-sm leading-6",
            state.status === "success"
              ? "border-[rgba(95,123,109,0.22)] bg-[rgba(95,123,109,0.08)] text-[var(--forest)]"
              : "border-[rgba(138,93,59,0.22)] bg-[rgba(138,93,59,0.08)] text-[var(--clay)]",
          )}
        >
          {state.message}
        </div>
      ) : null}

      {state.status === "success" && state.receipt ? (
        <div className="rounded-[1.6rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.86)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--sage)]">
            Comprovante da reserva
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[rgba(20,35,29,0.08)] bg-white/90 px-3 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[rgba(21,35,29,0.62)]">
                Codigo
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--forest)]">
                {state.receipt.confirmationCode}
              </p>
            </div>
            <div className="rounded-2xl border border-[rgba(20,35,29,0.08)] bg-white/90 px-3 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[rgba(21,35,29,0.62)]">
                Data e horario
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--forest)]">
                {state.receipt.reservationDate} as {state.receipt.reservationTime}
              </p>
            </div>
            <div className="rounded-2xl border border-[rgba(20,35,29,0.08)] bg-white/90 px-3 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[rgba(21,35,29,0.62)]">
                Mesa
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--forest)]">
                {state.receipt.tableName} ({state.receipt.areaName})
              </p>
            </div>
            <div className="rounded-2xl border border-[rgba(20,35,29,0.08)] bg-white/90 px-3 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[rgba(21,35,29,0.62)]">
                Cliente
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--forest)]">
                {state.receipt.guestName} - {state.receipt.guests} pessoa(s)
              </p>
            </div>
          </div>

          {state.receipt.whatsappUrl ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={state.receipt.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="button-primary"
              >
                Enviar comprovante no WhatsApp
              </a>
            </div>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
