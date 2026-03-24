"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";

export default function GlobalError({ reset }) {
  return (
    <html lang="pt-BR">
      <body>
        <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
          <div className="loading-shell flex min-h-[80vh] items-center justify-center">
            <section className="luxury-card rounded-[2.6rem] p-8 text-center sm:p-12">
              <span className="section-eyebrow">Erro global</span>
              <h1 className="display-title page-hero-title mt-6 text-[var(--forest)]">
                O aplicativo precisa recarregar esta experiencia
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[var(--ink-soft)]">
                Houve uma falha inesperada na aplicacao. Voce pode tentar
                novamente agora ou retornar para a entrada principal do site.
              </p>

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <button type="button" onClick={reset} className="button-primary">
                  <RefreshCw size={16} />
                  Recarregar
                </button>
                <Link href="/" className="button-secondary">
                  Voltar para a home
                </Link>
              </div>
            </section>
          </div>
        </main>
      </body>
    </html>
  );
}
