import Link from "next/link";
import { ArrowLeft, LockKeyhole, UserPlus } from "lucide-react";

import { PublicAuthGate } from "@/components/public-auth-gate";
import { SignupPortal } from "@/components/signup-portal";

export default async function CadastroPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(214,231,236,0.86),rgba(242,237,227,0.96)_38%,rgba(226,216,196,0.9)_100%)]">
      <PublicAuthGate />
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
              <span className="section-eyebrow">Novo cliente</span>
              <h1 className="display-title page-hero-title mt-6 text-[var(--forest)]">
                Cadastro seguro para entrar no sistema
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-[rgba(21,35,29,0.72)]">
                O cliente cria sua propria conta. Funcionario nao se cadastra
                aqui: as contas internas sao liberadas pela administracao.
              </p>

              <div className="mt-8 grid gap-4">
                {[
                  {
                    icon: UserPlus,
                    title: "Cadastro do cliente",
                    text: "Conta propria para reservas, historico e acesso ao portal.",
                  },
                  {
                    icon: LockKeyhole,
                    title: "Equipe protegida",
                    text: "Emails internos nao passam pelo cadastro publico do site.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[1.8rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.52)] p-5 shadow-[0_20px_40px_rgba(27,25,18,0.06)] backdrop-blur-xl"
                  >
                    <item.icon size={18} className="text-[var(--gold)]" />
                    <h2 className="mt-4 text-xl font-semibold text-[var(--forest)]">
                      {item.title}
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-[rgba(21,35,29,0.7)]">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mx-auto w-full max-w-xl">
              <SignupPortal />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
