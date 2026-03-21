import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { NewPasswordPortal } from "@/components/new-password-portal";

export default function RedefinirSenhaPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(214,231,236,0.86),rgba(242,237,227,0.96)_38%,rgba(226,216,196,0.9)_100%)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-10 h-80 w-80 rounded-full bg-[rgba(255,255,255,0.55)] blur-3xl" />
        <div className="absolute right-[-5rem] top-20 h-96 w-96 rounded-full bg-[rgba(132,170,179,0.22)] blur-3xl" />
      </div>

      <div className="relative flex min-h-screen flex-col px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(20,35,29,0.1)] bg-[rgba(255,255,255,0.66)] px-4 py-2 text-sm font-semibold text-[var(--forest)] backdrop-blur-xl"
          >
            <ArrowLeft size={16} />
            Voltar ao login
          </Link>

          <div className="rounded-full border border-[rgba(20,35,29,0.1)] bg-[rgba(255,255,255,0.66)] px-5 py-2 text-sm font-semibold text-[var(--forest)] backdrop-blur-xl">
            Pai Thiago
          </div>
        </div>

        <main className="relative mx-auto flex w-full max-w-6xl flex-1 items-center justify-center py-10">
          <div className="grid w-full items-center gap-10 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="hidden lg:block">
              <span className="section-eyebrow">Acesso protegido</span>
              <h1 className="display-title page-hero-title mt-6 text-[var(--forest)]">
                Uma nova senha para voltar ao sistema com seguranca
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-[rgba(21,35,29,0.72)]">
                Esta etapa conclui a recuperacao do acesso com um fluxo limpo,
                profissional e alinhado com a seguranca da conta.
              </p>

              <div className="mt-8 rounded-[1.8rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.52)] p-5 shadow-[0_20px_40px_rgba(27,25,18,0.06)] backdrop-blur-xl">
                <ShieldCheck size={18} className="text-[var(--gold)]" />
                <h2 className="mt-4 text-xl font-semibold text-[var(--forest)]">
                  Sessao segura de redefinicao
                </h2>
                <p className="mt-2 text-sm leading-7 text-[rgba(21,35,29,0.7)]">
                  O link libera apenas a troca da senha e depois encerra a
                  sessao automaticamente para proteger a conta.
                </p>
              </div>
            </div>

            <div className="mx-auto w-full max-w-xl">
              <NewPasswordPortal />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
