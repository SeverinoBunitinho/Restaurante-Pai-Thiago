import Link from "next/link";
import { Compass, Home } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="loading-shell flex min-h-[80vh] items-center justify-center">
        <section className="luxury-card rounded-[2.6rem] p-8 text-center sm:p-12">
          <span className="section-eyebrow">Pagina nao encontrada</span>
          <h1 className="display-title page-hero-title mt-6 text-[var(--forest)]">
            Este caminho nao faz parte da experiencia da casa
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[var(--ink-soft)]">
            O endereco pode ter mudado ou nao estar mais disponivel. Use os
            atalhos abaixo para voltar para uma area valida do Pai Thiago.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/" className="button-primary">
              <Home size={16} />
              Ir para a home
            </Link>
            <Link href="/login" className="button-secondary">
              <Compass size={16} />
              Abrir login
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
