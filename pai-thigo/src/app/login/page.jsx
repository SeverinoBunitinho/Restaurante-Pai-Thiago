import Link from "next/link";
import { LockKeyhole, ShieldCheck, UserPlus } from "lucide-react";

import { PublicAuthGate } from "@/components/public-auth-gate";
import { LoginPortal } from "@/components/login-portal";

export default async function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(214,231,236,0.86),rgba(242,237,227,0.96)_38%,rgba(226,216,196,0.9)_100%)]">
      <PublicAuthGate />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-10 h-80 w-80 rounded-full bg-[rgba(255,255,255,0.55)] blur-3xl" />
        <div className="absolute right-[-5rem] top-20 h-96 w-96 rounded-full bg-[rgba(132,170,179,0.22)] blur-3xl" />
        <div className="absolute bottom-[-8rem] left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-[rgba(20,35,29,0.08)] blur-3xl" />
      </div>

      <div className="relative flex min-h-screen flex-col px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 sm:flex-nowrap">
          <Link
            href="/cadastro"
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(20,35,29,0.1)] bg-[rgba(255,255,255,0.66)] px-4 py-2 text-xs font-semibold text-[var(--forest)] backdrop-blur-xl sm:text-sm"
          >
            <UserPlus size={16} />
            Criar conta
          </Link>

          <div className="rounded-full border border-[rgba(20,35,29,0.1)] bg-[rgba(255,255,255,0.66)] px-4 py-2 text-xs font-semibold text-[var(--forest)] backdrop-blur-xl sm:px-5 sm:text-sm">
            Pai Thiago
          </div>
        </div>

        <main className="relative mx-auto flex w-full max-w-6xl flex-1 items-center justify-center py-10">
          <div className="grid w-full items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="hidden lg:block">
              <div className="max-w-xl">
                <span className="section-eyebrow">Acesso reservado</span>
                <h1 className="display-title page-hero-title mt-6 text-[var(--forest)]">
                  Um login a altura da experiencia do Pai Thiago
                </h1>
                <p className="mt-6 max-w-lg text-lg leading-8 text-[rgba(21,35,29,0.72)]">
                  Do primeiro acesso ao atendimento da casa, cada detalhe foi
                  pensado para transmitir cuidado, organizacao e a elegancia de
                  um restaurante verdadeiramente profissional.
                </p>

                <div className="mt-8 grid gap-4">
                  {[
                    {
                      icon: LockKeyhole,
                      title: "Entrada segura e refinada",
                      text: "Um acesso discreto, claro e elegante para iniciar a jornada com confianca.",
                    },
                    {
                      icon: ShieldCheck,
                      title: "Cada perfil em seu lugar",
                      text: "Cliente vive a experiencia da casa, enquanto a equipe entra em ambientes proprios para conduzir a operacao.",
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
            </div>

            <div className="mx-auto w-full max-w-xl">
              <LoginPortal />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
