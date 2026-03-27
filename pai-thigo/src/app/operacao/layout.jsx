import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { requireRole } from "@/lib/auth";

export default async function OperacaoLayout({ children }) {
  await requireRole(["waiter", "manager", "owner"]);

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="pb-16">
        <section className="shell pt-12">
          <div className="operations-main-stack">
            {children}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
