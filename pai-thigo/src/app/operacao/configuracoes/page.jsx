import { Globe2, MapPinned, MessageCircle, Settings2 } from "lucide-react";

import { ProductionReadinessPanel } from "@/components/production-readiness-panel";
import { RestaurantSettingsPanel } from "@/components/restaurant-settings-panel";
import { SectionHeading } from "@/components/section-heading";
import { requireRole } from "@/lib/auth";
import { getProductionReadinessReport } from "@/lib/production-readiness";
import { getRestaurantConfigurationBoard } from "@/lib/restaurant-profile";

export default async function OperacaoConfiguracoesPage() {
  await requireRole(["manager", "owner"]);
  const [board, readinessReport] = await Promise.all([
    getRestaurantConfigurationBoard(),
    getProductionReadinessReport(),
  ]);
  const activeZones = board.deliveryZones.filter((zone) => zone.active);

  return (
    <>
      <section className="pt-10">
        <div className="grid gap-4 rounded-[2.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.46)] px-5 py-5 shadow-[0_20px_60px_rgba(36,29,15,0.06)] sm:grid-cols-2 xl:grid-cols-4 lg:px-8">
          {[
            {
              label: "Canais principais",
              value: "4",
              description: "Telefone, WhatsApp, e-mail e mapa alimentando a frente digital.",
              icon: Globe2,
            },
            {
              label: "Linhas de horario",
              value: String(board.preview.schedule.length),
              description: "Faixas de atendimento exibidas para o cliente no site.",
              icon: Settings2,
            },
            {
              label: "Zonas de delivery",
              value: String(activeZones.length),
              description: "Coberturas ativas hoje no checkout e no fluxo da equipe.",
              icon: MessageCircle,
            },
            {
              label: "Endereco publicado",
              value: board.preview.address,
              description: board.preview.city,
              icon: MapPinned,
            },
          ].map((item) => (
            <div key={item.label} className="rounded-[1.5rem] px-4 py-4">
              <item.icon className="text-[var(--gold)]" size={18} />
              <p className="mt-4 text-xs uppercase tracking-[0.24em] text-[var(--sage)]">
                {item.label}
              </p>
              <p className="mt-3 text-2xl font-semibold text-[var(--forest)]">
                {item.value}
              </p>
              <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.68)]">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="pt-14">
        <ProductionReadinessPanel report={readinessReport} />
      </section>

      <section className="pt-14">
        <div className="luxury-card rounded-[2.2rem] p-6">
          <SectionHeading
            eyebrow="Configuracoes da casa"
            title="Ajuste identidade, contato, horarios e delivery sem sair da operacao"
            description="Gerente e dono conseguem manter o restaurante coerente no site, no carrinho e nas rotas de atendimento."
            compact
          />

          <div className="mt-8">
            <RestaurantSettingsPanel
              settings={board.settings}
              preview={board.preview}
              deliveryZones={board.deliveryZones}
            />
          </div>
        </div>
      </section>
    </>
  );
}
