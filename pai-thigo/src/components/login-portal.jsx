"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { LockKeyhole, Mail, Shield, UserRound } from "lucide-react";

import { initialLoginState } from "@/app/login/action-state";
import { SubmitButton } from "@/components/submit-button";
import {
  resendLoginConfirmationAction,
  submitLoginAction,
} from "@/app/login/actions";
import { cn } from "@/lib/utils";

const initialResendState = {
  status: "idle",
  message: "",
};

export function LoginPortal() {
  const [role, setRole] = useState("customer");
  const [state, formAction] = useActionState(
    submitLoginAction,
    initialLoginState,
  );
  const [resendState, resendAction] = useActionState(
    resendLoginConfirmationAction,
    initialResendState,
  );

  return (
    <div className="rounded-[2rem] border border-white/55 bg-[rgba(255,255,255,0.72)] p-4 shadow-[0_35px_80px_rgba(34,29,20,0.12)] backdrop-blur-2xl sm:p-6">
      <div className="rounded-[1.7rem] border border-[rgba(20,35,29,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(250,245,238,0.84))] p-6 sm:p-8">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--gold)]">
            Login do sistema
          </p>
          <h2 className="mt-4 text-2xl font-semibold text-[var(--forest)] sm:text-3xl">
            Entrar com e-mail e senha
          </h2>
          <p className="mt-3 text-sm leading-7 text-[rgba(21,35,29,0.68)]">
            Cliente entra pela conta pessoal. Funcionario usa a conta interna
            criada pela administracao.
          </p>
        </div>

        <div className="mt-6 flex justify-center">
          <div className="inline-flex w-full max-w-[22rem] rounded-full border border-[rgba(20,35,29,0.08)] bg-[rgba(244,239,230,0.84)] p-1">
            <button
              type="button"
              onClick={() => setRole("customer")}
              className={cn(
                "flex-1 rounded-full px-5 py-2.5 text-sm font-semibold transition",
                role === "customer"
                  ? "bg-[var(--forest)] text-[var(--cream)]"
                  : "text-[var(--forest)]",
              )}
            >
              Cliente
            </button>
            <button
              type="button"
              onClick={() => setRole("staff")}
              className={cn(
                "flex-1 rounded-full px-5 py-2.5 text-sm font-semibold transition",
                role === "staff"
                  ? "bg-[var(--forest)] text-[var(--cream)]"
                  : "text-[var(--forest)]",
              )}
            >
              Funcionario
            </button>
          </div>
        </div>

        <div className="mt-5 rounded-[1.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(248,244,238,0.94)] p-4 text-sm leading-7 text-[rgba(21,35,29,0.74)]">
          {role === "customer" ? (
            <div className="flex items-start gap-3">
              <UserRound size={16} className="mt-1 text-[var(--gold)]" />
              <p>
                Ainda nao tem conta? O cadastro de cliente fica liberado logo
                abaixo.
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <Shield size={16} className="mt-1 text-[var(--gold)]" />
              <p>
                Contas de funcionario sao criadas previamente pela administracao
                no Supabase para evitar acessos indevidos.
              </p>
            </div>
          )}
        </div>

        <form action={formAction} className="mt-6 space-y-4">
          <input type="hidden" name="role" value={role} />

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
                autoComplete="username"
                autoCapitalize="none"
                inputMode="email"
                spellCheck={false}
                maxLength={160}
                placeholder={
                  role === "customer"
                    ? "seunome@email.com"
                    : "nome@paithiago.com.br"
                }
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
                autoComplete="current-password"
                minLength={6}
                maxLength={72}
                placeholder="Digite sua senha"
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </label>

          <div className="flex justify-end">
            <Link
              href="/recuperar-senha"
              className="text-sm font-semibold text-[var(--forest)] underline-offset-4 hover:underline"
            >
              Esqueci minha senha
            </Link>
          </div>

          <SubmitButton
            idleLabel="Entrar"
            pendingLabel="Entrando..."
            className="flex w-full rounded-2xl"
          />
        </form>

        {state.status === "error" ? (
          <div className="mt-4 rounded-[1.4rem] border border-[rgba(138,93,59,0.22)] bg-[rgba(138,93,59,0.08)] px-4 py-3 text-sm leading-6 text-[var(--clay)]">
            {state.message}
          </div>
        ) : null}

        {state.canResend && state.pendingEmail ? (
          <div className="mt-4 rounded-[1.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.72)] px-4 py-4">
            <p className="text-sm leading-6 text-[rgba(21,35,29,0.7)]">
              A conta ainda precisa ser confirmada. Reenvie o e-mail para{" "}
              <span className="font-semibold text-[var(--forest)]">
                {state.pendingEmail}
              </span>
              .
            </p>

            <form action={resendAction} className="mt-4">
              <input type="hidden" name="email" value={state.pendingEmail} />
              <SubmitButton
                idleLabel="Reenviar confirmacao"
                pendingLabel="Reenviando..."
                className="w-full rounded-2xl"
              />
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
          {role === "customer" ? (
            <p>
              Ainda nao tem cadastro?{" "}
              <Link
                href="/cadastro"
                className="font-semibold text-[var(--forest)] underline-offset-4 hover:underline"
              >
                Criar conta de cliente
              </Link>
            </p>
          ) : (
            <p>Para contas internas, fale com o dono ou gerente da casa.</p>
          )}
        </div>
      </div>
    </div>
  );
}
