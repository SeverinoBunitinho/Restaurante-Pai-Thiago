"use client";

import Link from "next/link";
import { useActionState } from "react";
import { LockKeyhole, Mail, UserRound } from "lucide-react";

import { initialSignupState } from "@/app/cadastro/action-state";
import { SubmitButton } from "@/components/submit-button";
import {
  resendSignupConfirmationAction,
  submitSignupAction,
} from "@/app/cadastro/actions";
import { cn } from "@/lib/utils";

const initialResendState = {
  status: "idle",
  message: "",
};

export function SignupPortal() {
  const [state, formAction] = useActionState(
    submitSignupAction,
    initialSignupState,
  );
  const [resendState, resendAction] = useActionState(
    resendSignupConfirmationAction,
    initialResendState,
  );

  return (
    <div className="rounded-[2rem] border border-white/55 bg-[rgba(255,255,255,0.72)] p-4 shadow-[0_35px_80px_rgba(34,29,20,0.12)] backdrop-blur-2xl sm:p-6">
      <div className="rounded-[1.7rem] border border-[rgba(20,35,29,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(250,245,238,0.84))] p-6 sm:p-8">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--gold)]">
            Cadastro de cliente
          </p>
          <h2 className="mt-4 text-3xl font-semibold text-[var(--forest)]">
            Criar conta no Pai Thiago
          </h2>
          <p className="mt-3 text-sm leading-7 text-[rgba(21,35,29,0.68)]">
            Funcionarios nao se cadastram aqui. Este formulario e exclusivo para
            clientes.
          </p>
        </div>

        <form action={formAction} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--forest)]">
              Nome completo
            </span>
            <div className="flex items-center gap-3 rounded-2xl border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.85)] px-4 py-3">
              <UserRound size={16} className="text-[var(--gold)]" />
              <input
                name="fullName"
                required
                autoComplete="name"
                maxLength={100}
                placeholder="Seu nome"
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--forest)]">
              Telefone
            </span>
            <div className="rounded-2xl border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.85)] px-4 py-3">
              <input
                name="phone"
                required
                autoComplete="tel"
                inputMode="tel"
                maxLength={40}
                placeholder="(11) 99999-9999"
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--forest)]">
              E-mail
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

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--forest)]">
              Senha
            </span>
            <div className="flex items-center gap-3 rounded-2xl border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.85)] px-4 py-3">
              <LockKeyhole size={16} className="text-[var(--gold)]" />
              <input
                name="password"
                type="password"
                required
                autoComplete="new-password"
                minLength={6}
                maxLength={72}
                placeholder="Crie uma senha"
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--forest)]">
              Confirmar senha
            </span>
            <div className="flex items-center gap-3 rounded-2xl border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.85)] px-4 py-3">
              <LockKeyhole size={16} className="text-[var(--gold)]" />
              <input
                name="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
                minLength={6}
                maxLength={72}
                placeholder="Repita a senha"
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </label>

          <SubmitButton
            idleLabel="Criar conta"
            pendingLabel="Criando conta..."
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

        {state.canResend && state.pendingEmail ? (
          <div className="mt-4 rounded-[1.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.72)] px-4 py-4">
            <p className="text-sm leading-6 text-[rgba(21,35,29,0.7)]">
              Se o e-mail nao chegou, voce pode reenviar a confirmacao para{" "}
              <span className="font-semibold text-[var(--forest)]">
                {state.pendingEmail}
              </span>
              .
            </p>

            <form
              action={resendAction}
              className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <input type="hidden" name="email" value={state.pendingEmail} />
              <SubmitButton
                idleLabel="Reenviar confirmacao"
                pendingLabel="Reenviando..."
                className="sm:w-auto"
              />
              <Link
                href="/login"
                className="text-sm font-semibold text-[var(--forest)] underline-offset-4 hover:underline"
              >
                Ir para o login
              </Link>
            </form>

            {resendState.status !== "idle" ? (
              <p
                className={cn(
                  "mt-3 text-sm leading-6",
                  resendState.status === "success"
                    ? "text-[var(--forest)]"
                    : "text-[var(--clay)]",
                )}
              >
                {resendState.message}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5 text-center text-sm text-[rgba(21,35,29,0.64)]">
          <p>
            Ja tem conta?{" "}
            <Link
              href="/login"
              className="font-semibold text-[var(--forest)] underline-offset-4 hover:underline"
            >
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
