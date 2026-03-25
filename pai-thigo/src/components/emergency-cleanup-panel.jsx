"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { AlertTriangle, LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

import { runEmergencyCleanupAction } from "@/app/operacao/actions";
import { initialEmergencyCleanupState } from "@/app/operacao/comandas/action-state";
import { cn } from "@/lib/utils";

function EmergencyCleanupSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="button-secondary col-span-full w-full justify-center self-end"
    >
      {pending ? <LoaderCircle size={16} className="animate-spin" /> : null}
      {pending ? "Executando limpeza..." : "Executar limpeza"}
    </button>
  );
}

export function EmergencyCleanupPanel() {
  const router = useRouter();
  const [state, formAction] = useActionState(
    runEmergencyCleanupAction,
    initialEmergencyCleanupState,
  );
  const latestRefreshKeyRef = useRef("");

  useEffect(() => {
    if (state.status !== "success" || !state.refreshKey) {
      return;
    }

    if (latestRefreshKeyRef.current === state.refreshKey) {
      return;
    }

    latestRefreshKeyRef.current = state.refreshKey;
    router.refresh();
  }, [router, state.refreshKey, state.status]);

  return (
    <div className="mt-6 rounded-[1.6rem] border border-[rgba(217,185,122,0.24)] bg-[rgba(255,255,255,0.06)] p-4">
      <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[rgba(217,185,122,0.92)]">
        <AlertTriangle size={14} />
        Modo extremo
      </div>
      <p className="mt-3 text-sm leading-6 text-[rgba(255,247,232,0.8)]">
        Remove apenas historico encerrado de pedidos e reservas (notificacoes antigas), sem tocar em fluxo ativo.
      </p>

      {state.status !== "idle" ? (
        <div
          className={cn(
            "mt-4 rounded-[1.3rem] border px-4 py-3 text-sm leading-6",
            state.status === "success"
              ? "border-[rgba(95,123,109,0.28)] bg-[rgba(95,123,109,0.2)] text-[rgba(255,247,232,0.9)]"
              : "border-[rgba(138,93,59,0.28)] bg-[rgba(138,93,59,0.2)] text-[rgba(255,247,232,0.9)]",
          )}
        >
          {state.message}
        </div>
      ) : null}

      <form
        action={formAction}
        className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(8.5rem,1fr))] gap-3"
      >
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgba(217,185,122,0.88)]">
            Dias
          </span>
          <input
            name="retentionDays"
            type="number"
            min="1"
            max="3650"
            defaultValue="30"
            className="w-full min-w-0 rounded-[1.1rem] border border-[rgba(217,185,122,0.2)] bg-[rgba(255,255,255,0.1)] px-3 py-2.5 text-sm text-white outline-none"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgba(217,185,122,0.88)]">
            Confirmacao
          </span>
          <input
            name="confirmationText"
            type="text"
            required
            placeholder="Digite LIMPEZA EXTREMA"
            className="w-full min-w-0 rounded-[1.1rem] border border-[rgba(217,185,122,0.2)] bg-[rgba(255,255,255,0.1)] px-3 py-2.5 text-sm uppercase text-white outline-none placeholder:text-[rgba(255,247,232,0.5)]"
          />
        </label>

        <EmergencyCleanupSubmitButton />
      </form>
    </div>
  );
}
