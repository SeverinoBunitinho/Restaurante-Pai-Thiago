import { ShoppingBag, Sparkles } from "lucide-react";

import { CartCheckout } from "@/components/cart-checkout";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { requireRole } from "@/lib/auth";
import { getRestaurantProfile } from "@/lib/restaurant-profile";

export default async function CarrinhoPage() {
  const session = await requireRole("customer");
  const firstName = session.profile.full_name.split(" ")[0];
  const restaurantInfo = await getRestaurantProfile();

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="pb-16">
        <section className="shell pt-12">
          <div className="hero-stage luxury-card-dark rounded-[2.6rem] p-7 text-[var(--cream)] md:p-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-[rgba(217,185,122,0.92)]">
                  Carrinho e checkout
                </p>
                <h1 className="display-title page-hero-title mt-4 text-white">
                  {firstName}, revise o pedido antes de enviar para a equipe
                </h1>
              </div>
              <div className="rounded-full border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.04)] p-4 text-[var(--gold-soft)]">
                <ShoppingBag size={20} />
              </div>
            </div>

            <p className="mt-5 max-w-3xl text-base leading-8 text-[rgba(255,247,232,0.76)]">
              O carrinho concentra os itens escolhidos no cardapio, a escolha
              entre delivery ou retirada, a forma de pagamento e o envio
              consolidado para o fluxo operacional do restaurante.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[rgba(217,185,122,0.16)] bg-[rgba(255,255,255,0.05)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[rgba(255,247,232,0.8)]">
              <Sparkles size={14} />
              checkout integrado ao painel da equipe
            </div>
          </div>
        </section>

        <section className="shell section-frame pt-16">
          <CartCheckout customerName={firstName} restaurantInfo={restaurantInfo} />
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
