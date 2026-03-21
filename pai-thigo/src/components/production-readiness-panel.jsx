import { AlertTriangle, CheckCircle2, ShieldCheck, Siren, Wifi } from "lucide-react";

const statusMeta = {
  ok: {
    icon: CheckCircle2,
    badge: "bg-[rgba(95,123,109,0.12)] text-[var(--sage)]",
  },
  warning: {
    icon: AlertTriangle,
    badge: "bg-[rgba(182,135,66,0.12)] text-[var(--gold)]",
  },
  error: {
    icon: Siren,
    badge: "bg-[rgba(138,93,59,0.12)] text-[var(--clay)]",
  },
};

export function ProductionReadinessPanel({ report }) {
  return (
    <section className="luxury-card rounded-[2.2rem] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--gold)]">
            Prontidao de producao
          </p>
          <h2 className="page-panel-title mt-3 font-semibold text-[var(--forest)]">
            O que ja esta pronto para publicar e o que ainda pede credencial externa
          </h2>
          <p className="mt-4 text-sm leading-7 text-[rgba(21,35,29,0.7)]">
            Esta leitura automatica confere ambiente, banco, dominio e pontos
            externos do projeto para evitar publicacao incompleta.
          </p>
        </div>

        <div
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            report.publishReady
              ? "bg-[rgba(95,123,109,0.12)] text-[var(--sage)]"
              : "bg-[rgba(182,135,66,0.12)] text-[var(--gold)]"
          }`}
        >
          {report.publishReady ? "publicacao tecnicamente pronta" : "ainda existem pendencias externas"}
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Checks aprovados",
            value: String(report.summary.ok),
            description: "Itens de infraestrutura e operacao ja validados neste ambiente.",
            icon: CheckCircle2,
          },
          {
            label: "Alertas",
            value: String(report.summary.warning),
            description: "Pontos que nao quebram o site, mas merecem conferência antes da publicacao.",
            icon: AlertTriangle,
          },
          {
            label: "Bloqueios",
            value: String(report.summary.error),
            description: "Itens que ainda impedem chamar o ambiente de producao completo.",
            icon: ShieldCheck,
          },
          {
            label: "URL lida",
            value: report.siteUrl,
            description: "Base atual usada para login, recuperacao, sitemap e metadados.",
            icon: Wifi,
          },
        ].map((item) => (
          <article
            key={item.label}
            className="rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5"
          >
            <item.icon className="text-[var(--gold)]" size={18} />
            <p className="mt-4 text-xs uppercase tracking-[0.22em] text-[var(--sage)]">
              {item.label}
            </p>
            <p className="content-copy-safe mt-3 text-2xl font-semibold text-[var(--forest)]">
              {item.value}
            </p>
            <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.68)]">
              {item.description}
            </p>
          </article>
        ))}
      </div>

      {report.blockingItems.length ? (
        <div className="mt-8 rounded-[1.8rem] border border-[rgba(138,93,59,0.16)] bg-[rgba(138,93,59,0.06)] p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--clay)]">
            Pendencias que ainda bloqueiam publicacao plena
          </p>
          <div className="mt-4 grid gap-4">
            {report.blockingItems.map((item) => (
              <article
                key={item.key}
                className="rounded-[1.4rem] border border-[rgba(138,93,59,0.16)] bg-[rgba(255,255,255,0.62)] p-4"
              >
                <p className="text-sm font-semibold text-[var(--forest)]">
                  {item.label}
                </p>
                <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.7)]">
                  {item.detail}
                </p>
                {item.recommendation ? (
                  <p className="mt-2 text-sm leading-6 text-[var(--clay)]">
                    {item.recommendation}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-8 grid gap-4">
        {report.checks.map((check) => {
          const Icon = statusMeta[check.status]?.icon ?? AlertTriangle;
          const badge = statusMeta[check.status]?.badge ?? statusMeta.warning.badge;

          return (
            <article
              key={check.key}
              className="rounded-[1.6rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-3xl">
                  <div className="flex items-center gap-3">
                    <Icon size={18} className="text-[var(--gold)]" />
                    <p className="text-lg font-semibold text-[var(--forest)]">
                      {check.label}
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                    {check.detail}
                  </p>
                  {check.recommendation ? (
                    <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.62)]">
                      {check.recommendation}
                    </p>
                  ) : null}
                </div>

                <span
                  className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${badge}`}
                >
                  {check.status}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
