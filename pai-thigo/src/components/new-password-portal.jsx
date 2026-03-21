"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

export function NewPasswordPortal() {
  const [supabase] = useState(() => getSupabaseBrowserClient());
  const hasSupabaseClient = Boolean(supabase);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [canReset, setCanReset] = useState(false);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!hasSupabaseClient) {
      return undefined;
    }

    let active = true;

    const syncSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) {
        return;
      }

      setCanReset(Boolean(session));
      setIsCheckingSession(false);
    };

    syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) {
        return;
      }

      setCanReset(Boolean(session));
      setIsCheckingSession(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [hasSupabaseClient, supabase]);

  if (!hasSupabaseClient) {
    return (
      <div className="rounded-[2rem] border border-white/55 bg-[rgba(255,255,255,0.72)] p-4 shadow-[0_35px_80px_rgba(34,29,20,0.12)] backdrop-blur-2xl sm:p-6">
        <div className="rounded-[1.7rem] border border-[rgba(20,35,29,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(250,245,238,0.84))] p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--gold)]">
            Redefinicao indisponivel
          </p>
          <h2 className="mt-4 text-3xl font-semibold text-[var(--forest)]">
            O cliente do Supabase nao iniciou corretamente
          </h2>
          <p className="mt-3 text-sm leading-7 text-[rgba(21,35,29,0.68)]">
            Atualize a pagina e tente novamente para concluir a redefinicao da senha.
          </p>
        </div>
      </div>
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!supabase) {
      setStatus("error");
      setMessage("O cliente do Supabase nao esta disponivel agora.");
      return;
    }

    if (password.length < 6) {
      setStatus("error");
      setMessage("A nova senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("A confirmacao da nova senha nao confere.");
      return;
    }

    setStatus("submitting");
    setMessage("");

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus("error");
      setMessage(error.message || "Nao foi possivel redefinir a senha agora.");
      return;
    }

    await supabase.auth.signOut();
    setStatus("success");
    setMessage("Senha atualizada com sucesso. Agora voce ja pode voltar ao login.");
    setCanReset(false);
    setPassword("");
    setConfirmPassword("");
  }

  if (isCheckingSession) {
    return (
      <div className="rounded-[2rem] border border-white/55 bg-[rgba(255,255,255,0.72)] p-4 shadow-[0_35px_80px_rgba(34,29,20,0.12)] backdrop-blur-2xl sm:p-6">
        <div className="rounded-[1.7rem] border border-[rgba(20,35,29,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(250,245,238,0.84))] p-6 sm:p-8">
          <p className="text-sm leading-7 text-[rgba(21,35,29,0.72)]">
            Validando o link de redefinicao e preparando a troca de senha...
          </p>
        </div>
      </div>
    );
  }

  if (!canReset && status !== "success") {
    return (
      <div className="rounded-[2rem] border border-white/55 bg-[rgba(255,255,255,0.72)] p-4 shadow-[0_35px_80px_rgba(34,29,20,0.12)] backdrop-blur-2xl sm:p-6">
        <div className="rounded-[1.7rem] border border-[rgba(20,35,29,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(250,245,238,0.84))] p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--gold)]">
            Link invalido ou expirado
          </p>
          <h2 className="mt-4 text-3xl font-semibold text-[var(--forest)]">
            Solicite um novo link
          </h2>
          <p className="mt-3 text-sm leading-7 text-[rgba(21,35,29,0.68)]">
            Para criar uma nova senha, voce precisa abrir a tela a partir do
            link enviado por e-mail.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/recuperar-senha"
              className="button-primary w-full justify-center sm:w-auto"
            >
              Pedir novo link
            </Link>
            <Link
              href="/login"
              className="button-secondary w-full justify-center sm:w-auto"
            >
              Voltar ao login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] border border-white/55 bg-[rgba(255,255,255,0.72)] p-4 shadow-[0_35px_80px_rgba(34,29,20,0.12)] backdrop-blur-2xl sm:p-6">
      <div className="rounded-[1.7rem] border border-[rgba(20,35,29,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(250,245,238,0.84))] p-6 sm:p-8">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--gold)]">
            Nova senha
          </p>
          <h2 className="mt-4 text-3xl font-semibold text-[var(--forest)]">
            Defina uma nova senha para a conta
          </h2>
          <p className="mt-3 text-sm leading-7 text-[rgba(21,35,29,0.68)]">
            Escolha uma senha forte e conclua o acesso de recuperacao com
            seguranca.
          </p>
        </div>

        {status === "success" ? (
          <div className="mt-6 rounded-[1.5rem] border border-[rgba(95,123,109,0.18)] bg-[rgba(95,123,109,0.08)] p-5">
            <div className="flex items-center gap-3 text-[var(--forest)]">
              <CheckCircle2 size={20} />
              <p className="text-lg font-semibold">Senha redefinida</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
              {message}
            </p>
            <div className="mt-5">
              <Link href="/login" className="button-primary w-full justify-center sm:w-auto">
                Ir para o login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="rounded-[1.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(248,244,238,0.94)] p-4 text-sm leading-7 text-[rgba(21,35,29,0.74)]">
              <div className="flex items-start gap-3">
                <ShieldCheck size={16} className="mt-1 text-[var(--gold)]" />
                <p>
                  Depois de salvar a nova senha, o sistema encerra a sessao de
                  redefinicao e voce volta ao login normalmente.
                </p>
              </div>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[var(--forest)]">
                Nova senha
              </span>
              <div className="flex items-center gap-3 rounded-2xl border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.85)] px-4 py-3">
                <LockKeyhole size={16} className="text-[var(--gold)]" />
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  required
                  autoComplete="new-password"
                  minLength={6}
                  maxLength={72}
                  placeholder="Crie uma nova senha"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[var(--forest)]">
                Confirmar nova senha
              </span>
              <div className="flex items-center gap-3 rounded-2xl border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.85)] px-4 py-3">
                <LockKeyhole size={16} className="text-[var(--gold)]" />
                <input
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  type="password"
                  required
                  autoComplete="new-password"
                  minLength={6}
                  maxLength={72}
                  placeholder="Repita a nova senha"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={status === "submitting"}
              className="button-primary flex w-full rounded-2xl disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === "submitting" ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : null}
              {status === "submitting" ? "Salvando senha..." : "Salvar nova senha"}
            </button>

            {status === "error" ? (
              <div
                className={cn(
                  "rounded-[1.4rem] border px-4 py-3 text-sm leading-6",
                  "border-[rgba(138,93,59,0.22)] bg-[rgba(138,93,59,0.08)] text-[var(--clay)]",
                )}
              >
                {message}
              </div>
            ) : null}
          </form>
        )}
      </div>
    </div>
  );
}
