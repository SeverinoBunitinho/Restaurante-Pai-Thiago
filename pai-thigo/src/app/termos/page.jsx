import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const updatedAt = "22 de marco de 2026";

export default async function TermosPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="pb-16">
        <section className="shell pt-12">
          <div className="luxury-card rounded-[2.3rem] p-7 md:p-10">
            <SectionHeading
              eyebrow="Termos de uso"
              title="Condicoes para uso da plataforma do Pai Thiago"
              description="Regras de utilizacao para reservas, pedidos e acesso aos modulos internos."
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
                title: "1. Aceitacao",
                text: "Ao usar o site, voce concorda com estes termos e com a politica de privacidade vigente.",
              },
              {
                title: "2. Conta e acesso",
                text: "Cada usuario e responsavel por manter seus dados de acesso protegidos. Funcionarios utilizam contas internas autorizadas.",
              },
              {
                title: "3. Reservas e pedidos",
                text: "Reservas e pedidos enviados pelo sistema estao sujeitos a disponibilidade da casa e confirmacao operacional.",
              },
              {
                title: "4. Conteudo e propriedade",
                text: "Textos, identidade visual, menu e materiais do site pertencem ao Pai Thiago, salvo indicacao contraria.",
              },
              {
                title: "5. Uso adequado",
                text: "Nao e permitido uso indevido, tentativa de fraude, violacao de acesso ou qualquer acao que prejudique a operacao.",
              },
              {
                title: "6. Alteracoes",
                text: "Estes termos podem ser atualizados para refletir ajustes legais, operacionais e evolucoes da plataforma.",
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
