"use client";

import { useActionState } from "react";

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

  return (
    <form action={formAction} className="grid gap-4">
      <div className="rounded-[1.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.72)] px-4 py-3 text-sm leading-6 text-[rgba(21,35,29,0.68)]">
        {isStaff
          ? "Use este formulario para registrar reservas por telefone, WhatsApp ou atendimento da equipe."
          : "Seus dados da conta ajudam a acelerar a reserva e deixam o atendimento mais preciso."}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-[var(--forest)]">
          {isStaff ? "Nome do cliente" : "Nome completo"}
          <input
            name="guestName"
            required
            autoComplete="name"
            defaultValue={defaults.guestName ?? ""}
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
            defaultValue={defaults.phone ?? ""}
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

      <div className="grid gap-4 md:grid-cols-4">
        <label className="grid gap-2 text-sm font-medium text-[var(--forest)]">
          Data
          <input
            name="date"
            type="date"
            min={getTodayInBrazil()}
            required
            className="rounded-2xl border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.72)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[var(--forest)]">
          Horario
          <input
            name="time"
            type="time"
            required
            className="rounded-2xl border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.72)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[var(--forest)]">
          Pessoas
          <input
            name="guests"
            type="number"
            min={1}
            max={20}
            defaultValue={2}
            required
            className="rounded-2xl border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.72)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[var(--forest)]">
          Area
          <select
            name="areaPreference"
            defaultValue={resolvedAreas[0] ?? "Salao principal"}
            className="rounded-2xl border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.72)] px-4 py-3 outline-none transition focus:border-[var(--gold)]"
          >
            {resolvedAreas.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
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
            ? "Reserva salva no Supabase e liberada para acompanhamento da equipe."
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
    </form>
  );
}
