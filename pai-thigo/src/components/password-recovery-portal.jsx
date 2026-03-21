"use client";

import Link from "next/link";
import { useActionState } from "react";
import { LifeBuoy, Mail } from "lucide-react";

import { initialPasswordRecoveryState } from "@/app/recuperar-senha/action-state";
import { requestPasswordResetAction } from "@/app/recuperar-senha/actions";
import { SubmitButton } from "@/components/submit-button";
import { cn } from "@/lib/utils";

export function PasswordRecoveryPortal() {
  const [state, formAction] = useActionState(
    requestPasswordResetAction,
    initialPasswordRecoveryState,
  );

  return (
    <div className="rounded-[2rem] border border-white/55 bg-[rgba(255,255,255,0.72)] p-4 shadow-[0_35px_80px_rgba(34,29,20,0.12)] backdrop-blur-2xl sm:p-6">
      <div className="rounded-[1.7rem] border border-[rgba(20,35,29,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(250,245,238,0.84))] p-6 sm:p-8">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--gold)]">
            Recuperacao de acesso
          </p>
          <h2 className="mt-4 text-3xl font-semibold text-[var(--forest)]">
            Receber link para criar uma nova senha
          </h2>
          <p className="mt-3 text-sm leading-7 text-[rgba(21,35,29,0.68)]">
            Informe o e-mail da conta. O sistema envia um link seguro para
            redefinir a senha.
          </p>
        </div>

        <div className="mt-5 rounded-[1.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(248,244,238,0.94)] p-4 text-sm leading-7 text-[rgba(21,35,29,0.74)]">
          <div className="flex items-start gap-3">
            <LifeBuoy size={16} className="mt-1 text-[var(--gold)]" />
            <p>
              O link de redefinicao expira. Se ele nao chegar, confira spam,
              promocoes e a configuracao de e-mail do projeto no Supabase.
            </p>
          </div>
        </div>

        <form action={formAction} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--forest)]">
              E-mail da conta
            </span>
            <div className="flex items-center gap-3 rounded-2xl border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.85)] px-4 py-3">
              <Mail size={16} className="text-[var(--gold)]" />
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                autoCapitalize="none"
                inputMode="email"
                spellCheck={false}
                maxLength={160}
                placeholder="seunome@email.com"
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </label>

          <SubmitButton
            idleLabel="Enviar link de redefinicao"
            pendingLabel="Enviando link..."
            className="flex w-full rounded-2xl"
          />
        </form>

        {state.status !== "idle" ? (
          <div
            className={cn(
              "mt-4 rounded-[1.4rem] border px-4 py-3 text-sm leading-6",
              state.status === "success"
                ? "border-[rgba(95,123,109,0.18)] bg-[rgba(95,123,109,0.08)] text-[var(--forest)]"
                : "border-[rgba(138,93,59,0.22)] bg-[rgba(138,93,59,0.08)] text-[var(--clay)]",
            )}
          >
            {state.message}
          </div>
        ) : null}

        <div className="mt-5 text-center text-sm text-[rgba(21,35,29,0.64)]">
          <p>
            Lembrou a senha?{" "}
            <Link
              href="/login"
              className="font-semibold text-[var(--forest)] underline-offset-4 hover:underline"
            >
              Voltar ao login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
