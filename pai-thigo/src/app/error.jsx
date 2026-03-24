"use client";

import Link from "next/link";
import { RefreshCw, ShieldAlert } from "lucide-react";

export default function Error({ reset }) {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="loading-shell flex min-h-[80vh] items-center justify-center">
        <section className="luxury-card rounded-[2.6rem] p-8 text-center sm:p-12">
          <span className="section-eyebrow">Falha temporaria</span>
          <h1 className="display-title page-hero-title mt-6 text-[var(--forest)]">
            O sistema encontrou uma interrupcao nesta rota
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[var(--ink-soft)]">
            A operacao nao foi perdida. Tente carregar novamente ou volte para
            a tela de acesso para seguir com o fluxo.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button type="button" onClick={reset} className="button-primary">
              <RefreshCw size={16} />
              Tentar novamente
            </button>
            <Link href="/login?forcePublic=1" className="button-secondary">
              <ShieldAlert size={16} />
              Voltar ao login
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
