"use client";

import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, LoaderCircle, RefreshCw } from "lucide-react";
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

function normalizeRetentionDays(value) {
  const parsed = Number.parseInt(String(value ?? "").trim(), 10);

  if (!Number.isInteger(parsed)) {
    return 30;
  }

  return Math.min(Math.max(parsed, 1), 3650);
}

function formatPreviewMoment(value) {
  const parsed = new Date(value ?? "");

  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(parsed);
}

export function EmergencyCleanupPanel() {
  const router = useRouter();
  const [state, formAction] = useActionState(
    runEmergencyCleanupAction,
    initialEmergencyCleanupState,
  );
  const [retentionDaysInput, setRetentionDaysInput] = useState("30");
  const [previewState, setPreviewState] = useState({
    status: "idle",
    message: "Carregando previa de limpeza...",
    data: null,
  });
  const latestRefreshKeyRef = useRef("");
  const previewRequestRef = useRef(0);

  const loadPreview = useCallback(
    async ({ silent = false } = {}) => {
      const retentionDays = normalizeRetentionDays(retentionDaysInput);
      const requestId = ++previewRequestRef.current;

      if (!silent) {
        setPreviewState((currentState) => ({
          status: "loading",
          message: "Atualizando previa de limpeza em tempo real...",
          data: currentState.data,
        }));
      }

      try {
        const response = await fetch(
          `/api/operacao/limpeza-previa?dias=${retentionDays}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );
        const payload = await response.json().catch(() => null);

        if (requestId !== previewRequestRef.current) {
          return;
        }

        if (!response.ok || !payload?.ok || !payload?.data) {
          setPreviewState((currentState) => ({
            status: "error",
            message:
              payload?.message ??
              "Falha ao consultar os registros elegiveis para limpeza.",
            data: silent ? currentState.data : null,
          }));
          return;
        }

        setPreviewState({
          status: "success",
          message:
            payload.message ??
            "Previa atualizada com os registros elegiveis para limpeza.",
          data: payload.data,
        });
      } catch {
        if (requestId !== previewRequestRef.current) {
          return;
        }

        setPreviewState((currentState) => ({
          status: "error",
          message: "Falha de conexao ao atualizar a previa em tempo real.",
          data: silent ? currentState.data : null,
        }));
      }
    },
    [retentionDaysInput],
  );

  useEffect(() => {
    const initialLoadTimeoutId = setTimeout(() => {
      void loadPreview({ silent: false });
    }, 0);
    const intervalId = setInterval(() => {
      void loadPreview({ silent: true });
    }, 10000);

    return () => {
      clearTimeout(initialLoadTimeoutId);
      clearInterval(intervalId);
      previewRequestRef.current += 1;
    };
  }, [loadPreview]);

  useEffect(() => {
    if (state.status !== "success" || !state.refreshKey) {
      return;
    }

    if (latestRefreshKeyRef.current === state.refreshKey) {
      return;
    }

    latestRefreshKeyRef.current = state.refreshKey;
    router.refresh();
    const refreshTimeoutId = setTimeout(() => {
      void loadPreview({ silent: false });
    }, 0);

    return () => {
      clearTimeout(refreshTimeoutId);
    };
  }, [loadPreview, router, state.refreshKey, state.status]);

  return (
    <div className="mt-6 rounded-[1.6rem] border border-[rgba(217,185,122,0.24)] bg-[rgba(255,255,255,0.06)] p-4">
      <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[rgba(217,185,122,0.92)]">
        <AlertTriangle size={14} />
        Modo extremo
      </div>
      <p className="mt-3 text-sm leading-6 text-[rgba(255,247,232,0.8)]">
        Remove apenas historico encerrado de pedidos e reservas (notificacoes antigas), sem tocar em fluxo ativo.
      </p>

      <div className="mt-4 rounded-[1.3rem] border border-[rgba(217,185,122,0.2)] bg-[rgba(255,255,255,0.06)] p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgba(217,185,122,0.9)]">
            Previa em tempo real
          </p>
          <button
            type="button"
            onClick={() => {
              void loadPreview({ silent: false });
            }}
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(217,185,122,0.22)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgba(255,247,232,0.9)]"
          >
            <RefreshCw size={12} />
            Atualizar
          </button>
        </div>

        <p className="mt-2 text-sm leading-6 text-[rgba(255,247,232,0.82)]">
          {previewState.message}
        </p>

        {previewState.data ? (
          <>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <div className="rounded-[1rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.08)] px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-[0.16em] text-[rgba(217,185,122,0.88)]">
                  Total elegivel
                </p>
                <p className="mt-1 text-xl font-semibold text-white">
                  {previewState.data.totalCount}
                </p>
              </div>
              <div className="rounded-[1rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.08)] px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-[0.16em] text-[rgba(217,185,122,0.88)]">
                  Pedidos
                </p>
                <p className="mt-1 text-xl font-semibold text-white">
                  {previewState.data.ordersCount}
                </p>
              </div>
              <div className="rounded-[1rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.08)] px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-[0.16em] text-[rgba(217,185,122,0.88)]">
                  Reservas
                </p>
                <p className="mt-1 text-xl font-semibold text-white">
                  {previewState.data.reservationsCount}
                </p>
              </div>
            </div>

            <p className="mt-3 text-[11px] leading-5 text-[rgba(255,247,232,0.72)]">
              Corte em {previewState.data.retentionDays} dia(s):{" "}
              {formatPreviewMoment(previewState.data.cutoffIso)}. Ultima leitura:{" "}
              {formatPreviewMoment(previewState.data.generatedAt)}.
            </p>

            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <div className="rounded-[1rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.06)] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[rgba(217,185,122,0.88)]">
                  Pedidos que entram na limpeza
                </p>
                <div className="mt-2 space-y-2">
                  {previewState.data.ordersPreview.length ? (
                    previewState.data.ordersPreview.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-[0.9rem] border border-[rgba(217,185,122,0.12)] bg-[rgba(255,255,255,0.08)] px-2.5 py-2"
                      >
                        <p className="truncate text-xs font-semibold text-white">
                          {item.label}
                        </p>
                        <p className="mt-1 text-[11px] text-[rgba(255,247,232,0.72)]">
                          {item.status} • {formatPreviewMoment(item.updatedAt)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[rgba(255,247,232,0.72)]">
                      Nenhum pedido elegivel neste corte.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-[1rem] border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.06)] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[rgba(217,185,122,0.88)]">
                  Reservas que entram na limpeza
                </p>
                <div className="mt-2 space-y-2">
                  {previewState.data.reservationsPreview.length ? (
                    previewState.data.reservationsPreview.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-[0.9rem] border border-[rgba(217,185,122,0.12)] bg-[rgba(255,255,255,0.08)] px-2.5 py-2"
                      >
                        <p className="truncate text-xs font-semibold text-white">
                          {item.label}
                        </p>
                        <p className="mt-1 text-[11px] text-[rgba(255,247,232,0.72)]">
                          {item.slot || "Sem horario"} • {item.status}
                        </p>
                        <p className="mt-1 text-[11px] text-[rgba(255,247,232,0.62)]">
                          {formatPreviewMoment(item.updatedAt)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[rgba(255,247,232,0.72)]">
                      Nenhuma reserva elegivel neste corte.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>

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
            value={retentionDaysInput}
            onChange={(event) => {
              const cleanDigits = String(event.target.value ?? "")
                .replace(/\D/g, "")
                .slice(0, 4);
              setRetentionDaysInput(cleanDigits);
            }}
            onBlur={() => {
              setRetentionDaysInput(String(normalizeRetentionDays(retentionDaysInput)));
            }}
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
