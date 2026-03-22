import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const updatedAt = "22 de marco de 2026";

export default async function CancelamentosPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="pb-16">
        <section className="shell pt-12">
          <div className="luxury-card rounded-[2.3rem] p-7 md:p-10">
            <SectionHeading
              eyebrow="Politica de cancelamento"
              title="Regras para cancelamentos de reservas e pedidos"
              description="Orientacoes para manter previsibilidade da operacao e atendimento justo para todos os clientes."
            />
            <p className="mt-6 text-sm uppercase tracking-[0.22em] text-[var(--sage)]">
              Ultima atualizacao: {updatedAt}
            </p>
          </div>
        </section>

        <section className="shell pt-12">
          <div className="space-y-5">
            {[
              {
                title: "1. Cancelamento de reserva",
                text: "Recomendamos cancelar com antecedencia. Reservas em cima do horario podem impactar disponibilidade para outros clientes.",
              },
              {
                title: "2. Reagendamento",
                text: "Sempre que possivel, prefira reagendar para outro horario ou data diretamente na area de reservas.",
              },
              {
                title: "3. Pedidos em preparo",
                text: "Pedidos que ja entraram em preparo podem nao ser elegiveis para cancelamento total, conforme etapa operacional.",
              },
              {
                title: "4. Entrega e retirada",
                text: "Em delivery e retirada, cancelamentos e ajustes seguem o status do pedido no momento da solicitacao.",
              },
              {
                title: "5. Canal oficial",
                text: "Para excecoes, use os canais de contato oficiais exibidos no site para suporte da equipe.",
              },
            ].map((item) => (
              <article
                key={item.title}
                className="luxury-card rounded-[2rem] p-6"
              >
                <h2 className="text-2xl font-semibold text-[var(--forest)]">
                  {item.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[rgba(21,35,29,0.74)]">
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
