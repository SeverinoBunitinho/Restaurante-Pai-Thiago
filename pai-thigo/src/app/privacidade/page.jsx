import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const updatedAt = "22 de marco de 2026";

export default async function PrivacidadePage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="pb-16">
        <section className="shell pt-12">
          <div className="luxury-card rounded-[2.3rem] p-7 md:p-10">
            <SectionHeading
              eyebrow="Privacidade"
              title="Politica de privacidade e tratamento de dados"
              description="Transparencia sobre quais dados o Pai Thiago utiliza para reservas, pedidos e atendimento."
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
                title: "1. Dados coletados",
                text: "Coletamos dados de cadastro, contato, reservas e pedidos para operar o atendimento do restaurante com seguranca e continuidade.",
              },
              {
                title: "2. Finalidade do uso",
                text: "Os dados sao usados para confirmar reservas, processar pedidos, contato da equipe, historico de atendimento e melhoria da experiencia.",
              },
              {
                title: "3. Base legal e LGPD",
                text: "O tratamento observa a Lei Geral de Protecao de Dados (Lei 13.709/2018), com foco em execucao de servicos, cumprimento de obrigacoes e interesse legitimo.",
              },
              {
                title: "4. Compartilhamento",
                text: "Nao comercializamos dados pessoais. Compartilhamentos ocorrem apenas com fornecedores tecnicos essenciais para operacao do sistema.",
              },
              {
                title: "5. Armazenamento e seguranca",
                text: "Aplicamos controles de acesso por perfil, autenticacao e politicas de banco para reduzir risco de uso indevido.",
              },
              {
                title: "6. Direitos do titular",
                text: "Voce pode solicitar acesso, correcao, atualizacao e exclusao de dados pessoais quando aplicavel.",
              },
              {
                title: "7. Contato para privacidade",
                text: "Solicitacoes podem ser feitas pelos canais oficiais exibidos na pagina de contato.",
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
