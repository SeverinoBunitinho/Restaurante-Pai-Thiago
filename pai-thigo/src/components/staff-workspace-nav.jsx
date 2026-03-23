import { ArrowRight, Compass, Route, ShieldCheck } from "lucide-react";

import { ActiveLink } from "@/components/active-link";
import { getStaffRoleLabel } from "@/lib/auth";
import { getStaffModules, getStaffPanel } from "@/lib/staff-modules";

export function StaffWorkspaceNav({ role }) {
  const panel = getStaffPanel(role);
  const modules = getStaffModules(role);
  const navigationItems = [
    {
      href: "/operacao",
      title: "Visao geral",
      description: "Mapa da operacao com os caminhos mais importantes do turno.",
      icon: Compass,
      exact: true,
    },
    ...modules.map((module) => ({
      href: module.href,
      title: module.title,
      description: module.description,
      icon: module.icon,
      exact: module.href === "/painel",
    })),
    {
      href: "/area-funcionario",
      title: "Portal do cargo",
      description: "Resumo do perfil com permissoes e atalhos principais.",
      icon: ShieldCheck,
      exact: true,
    },
  ];

  return (
    <aside className="staff-side-stack">
      <div className="staff-side-card luxury-card rounded-[2rem] p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--gold)]">
          Navegacao da equipe
        </p>
        <h2 className="staff-side-title mt-4 font-semibold text-[var(--forest)]">
          Fluxo do {getStaffRoleLabel(role).toLowerCase()}
        </h2>
        <p className="mt-4 text-sm leading-7 text-[rgba(21,35,29,0.72)]">
          {panel.description}
        </p>

        <div className="soft-line mt-6" />

        <nav className="mt-6 space-y-3">
          {navigationItems.map((item) => (
            <ActiveLink
              key={`${item.href}-${item.title}`}
              href={item.href}
              exact={item.exact}
              className="staff-side-link"
              activeClassName="staff-side-link-active"
            >
              <div className="staff-side-link-copy flex items-start gap-3">
                <div className="staff-side-link-icon mt-0.5 rounded-full border border-[rgba(182,135,66,0.16)] bg-[rgba(255,255,255,0.62)] p-2 text-[var(--gold)]">
                  <item.icon size={16} />
                </div>
                <div>
                  <p className="staff-side-link-title text-sm font-semibold text-[var(--forest)]">
                    {item.title}
                  </p>
                  <p className="staff-side-link-description mt-1 text-sm leading-6 text-[rgba(21,35,29,0.68)]">
                    {item.description}
                  </p>
                </div>
              </div>
              <ArrowRight className="staff-side-arrow shrink-0 text-[var(--gold)]" size={16} />
            </ActiveLink>
          ))}
        </nav>
      </div>

      <div className="staff-side-card luxury-card rounded-[2rem] p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--gold)]">
          Acesso rapido
        </p>
        <div className="staff-quick-grid mt-5">
          {panel.quickItems.map((item) => (
            <ActiveLink
              key={item.key}
              href={item.href}
              exact={item.href === "/painel"}
              className="filter-chip"
              activeClassName="filter-chip-active"
            >
              <item.icon size={14} />
              {item.title}
            </ActiveLink>
          ))}
        </div>

        <div className="staff-side-note mt-6 rounded-[1.5rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.56)] px-4 py-4">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sage)]">
            <Route size={14} />
            leitura organizada
          </div>
          <p className="mt-3 text-sm leading-7 text-[rgba(21,35,29,0.72)]">
            A operacao agora fica distribuida por frente de trabalho, com a rota
            atual destacada para a equipe nao se perder entre telas parecidas.
          </p>
        </div>
      </div>
    </aside>
  );
}
