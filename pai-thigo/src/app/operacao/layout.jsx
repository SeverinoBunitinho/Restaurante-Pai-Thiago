import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StaffWorkspaceNav } from "@/components/staff-workspace-nav";
import { getStaffRoleLabel, requireRole } from "@/lib/auth";
import { getStaffModules } from "@/lib/staff-modules";

export default async function OperacaoLayout({ children }) {
  const session = await requireRole(["waiter", "manager", "owner"]);
  const modules = getStaffModules(session.role);

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="pb-16">
        <section className="shell pt-12">
          <div className="operations-layout">
            <StaffWorkspaceNav role={session.role} />

            <div className="operations-main-stack">
              <div className="operations-hero-shell luxury-card-dark rounded-[2.4rem] p-7 text-[var(--cream)] md:p-10">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-3xl">
                    <p className="text-xs uppercase tracking-[0.28em] text-[rgba(217,185,122,0.92)]">
                      Central interna
                    </p>
                    <h1 className="display-title page-hero-title mt-4 text-white">
                      Operacao do {getStaffRoleLabel(session.role).toLowerCase()} no
                      Pai Thiago
                    </h1>
                    <p className="mt-5 max-w-3xl text-base leading-8 text-[rgba(255,247,232,0.74)]">
                      A equipe agora entra em uma base mais organizada, com rotas
                      separadas por frente de trabalho e menos repeticao entre telas.
                    </p>
                  </div>

                  <Link
                    href="/area-funcionario"
                    className="operations-return-link inline-flex items-center justify-center rounded-full border border-[rgba(217,185,122,0.24)] px-5 py-3 text-sm font-semibold text-[var(--cream)] transition hover:-translate-y-0.5"
                  >
                    Voltar ao painel da equipe
                  </Link>
                </div>

                <div className="operations-module-grid mt-8 md:grid-cols-2 xl:grid-cols-4">
                  {modules.map((module) => (
                    <Link
                      key={module.key}
                      href={module.href}
                      className="operations-module-tile"
                    >
                      <module.icon className="text-[var(--gold-soft)]" size={20} />
                      <h2 className="mt-4 text-lg font-semibold text-white">
                        {module.title}
                      </h2>
                      <p className="operations-module-copy mt-2 text-sm leading-6 text-[rgba(255,247,232,0.72)]">
                        {module.description}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>

              {children}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
