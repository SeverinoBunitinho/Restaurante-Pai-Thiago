import {
  createLowOccupancyCouponAction,
  createCampaignAction,
  createCouponAction,
  setCampaignStatusAction,
  toggleCouponActiveAction,
} from "@/app/operacao/actions";
import { SectionHeading } from "@/components/section-heading";
import { requireRole } from "@/lib/auth";
import { getCampaignsBoard } from "@/lib/operations-advanced-data";
import { formatCurrency } from "@/lib/utils";

const channelOptions = [
  { value: "site", label: "Site" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "email", label: "E-mail" },
  { value: "interno", label: "Interno" },
];

const campaignStatusOptions = [
  { value: "draft", label: "Rascunho" },
  { value: "active", label: "Ativa" },
  { value: "paused", label: "Pausada" },
  { value: "finished", label: "Finalizada" },
];

const couponTypeOptions = [
  { value: "percentage", label: "Percentual (%)" },
  { value: "fixed_amount", label: "Valor fixo (R$)" },
];

export default async function OperacaoCampanhasPage({ searchParams }) {
  await requireRole(["manager", "owner"]);
  const resolvedSearchParams = await searchParams;
  const campaignNotice = Array.isArray(resolvedSearchParams?.campaignNotice)
    ? resolvedSearchParams.campaignNotice[0]
    : resolvedSearchParams?.campaignNotice;
  const campaignError = Array.isArray(resolvedSearchParams?.campaignError)
    ? resolvedSearchParams.campaignError[0]
    : resolvedSearchParams?.campaignError;
  const board = await getCampaignsBoard();

  return (
    <>
      <section className="pt-10">
        <div className="grid gap-4 rounded-[2.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.46)] px-5 py-5 shadow-[0_20px_60px_rgba(36,29,15,0.06)] sm:grid-cols-3 lg:px-8">
          {board.summary.map((item) => (
            <div key={item.label} className="rounded-[1.5rem] px-4 py-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--sage)]">
                {item.label}
              </p>
              <p className="mt-3 text-3xl font-semibold text-[var(--forest)]">
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
        <div className="luxury-card rounded-[2.2rem] p-6">
          <SectionHeading
            eyebrow="Leitura de ocupacao"
            title="Sinal em tempo real para cupom automatico"
            description="Use a leitura atual do salao para decidir quando ativar incentivo sem comprometer operacao."
            compact
          />

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <article className="rounded-[1.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--sage)]">
                Ocupacao
              </p>
              <p className="mt-2 text-2xl font-semibold text-[var(--forest)]">
                {Math.round((board.occupancySignal?.pressure ?? 0) * 100)}%
              </p>
              <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                {board.occupancySignal?.label ?? "Sem leitura"}
              </p>
            </article>
            <article className="rounded-[1.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--sage)]">
                Mesas ativas
              </p>
              <p className="mt-2 text-2xl font-semibold text-[var(--forest)]">
                {board.occupancySignal?.activeTables ?? 0}
              </p>
              <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                Com {board.occupancySignal?.openChecks ?? 0} conta(s) aberta(s) agora.
              </p>
            </article>
            <article className="rounded-[1.4rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--sage)]">
                Reservas ativas hoje
              </p>
              <p className="mt-2 text-2xl font-semibold text-[var(--forest)]">
                {board.occupancySignal?.activeReservations ?? 0}
              </p>
              <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                {board.occupancySignal?.message ?? "Sem sinal para recomendacao."}
              </p>
            </article>
          </div>

          <div className="mt-5 rounded-[1.4rem] border border-[rgba(182,135,66,0.2)] bg-[rgba(182,135,66,0.08)] px-4 py-3 text-sm leading-6 text-[var(--forest)]">
            {board.autoCouponSuggestion?.canCreate
              ? `Sugestao automatica: ${board.autoCouponSuggestion.discount}% de desconto com pedido minimo de R$ ${board.autoCouponSuggestion.minOrder}.`
              : `Cupom automatico bloqueado agora: ${board.autoCouponSuggestion?.reason ?? "sem leitura suficiente."}`}
          </div>

          <form action={createLowOccupancyCouponAction} className="mt-4">
            <button
              type="submit"
              disabled={!board.autoCouponSuggestion?.canCreate}
              className="button-primary disabled:cursor-not-allowed disabled:opacity-45"
            >
              Criar cupom automatico por baixa ocupacao
            </button>
          </form>
        </div>
      </section>

      <section className="pt-14">
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="luxury-card rounded-[2.2rem] p-6">
            <SectionHeading
              eyebrow="Nova campanha"
              title="Planejar acao comercial sem misturar com atendimento"
              description="Campanhas ficam centralizadas aqui para manter o restante da operacao limpo."
              compact
            />

            {campaignError ? (
              <div className="mt-6 rounded-[1.4rem] border border-[rgba(138,93,59,0.2)] bg-[rgba(138,93,59,0.08)] px-4 py-3 text-sm leading-6 text-[var(--clay)]">
                {campaignError}
              </div>
            ) : null}

            {campaignNotice ? (
              <div className="mt-6 rounded-[1.4rem] border border-[rgba(95,123,109,0.2)] bg-[rgba(95,123,109,0.08)] px-4 py-3 text-sm leading-6 text-[var(--forest)]">
                {campaignNotice}
              </div>
            ) : null}

            <form action={createCampaignAction} className="mt-8 grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[var(--forest)]">Titulo</span>
                <input
                  name="title"
                  type="text"
                  required
                  maxLength={120}
                  className="rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none"
                  placeholder="Ex.: Semana do chef"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[var(--forest)]">Oferta em destaque</span>
                <input
                  name="highlightOffer"
                  type="text"
                  maxLength={160}
                  className="rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none"
                  placeholder="Ex.: Menu degustacao com sobremesa."
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[var(--forest)]">Canal</span>
                  <select
                    name="channel"
                    defaultValue="site"
                    className="rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none"
                  >
                    {channelOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[var(--forest)]">Status</span>
                  <select
                    name="status"
                    defaultValue="draft"
                    className="rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none"
                  >
                    {campaignStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[var(--forest)]">Inicio</span>
                  <input
                    type="date"
                    name="startsOn"
                    required
                    className="rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[var(--forest)]">Fim</span>
                  <input
                    type="date"
                    name="endsOn"
                    required
                    className="rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none"
                  />
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[var(--forest)]">Publico alvo</span>
                <input
                  name="targetAudience"
                  type="text"
                  maxLength={120}
                  className="rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none"
                  placeholder="Ex.: Clientes frequentes do jantar"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[var(--forest)]">Descricao</span>
                <textarea
                  name="description"
                  rows={3}
                  maxLength={400}
                  className="rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none"
                  placeholder="Objetivo e contexto da campanha."
                />
              </label>

              <button type="submit" className="button-primary mt-1">
                Criar campanha
              </button>
            </form>
          </div>

          <div className="luxury-card rounded-[2.2rem] p-6">
            <SectionHeading
              eyebrow="Novo cupom"
              title="Registrar codigo com regra de uso"
              description="Cupons ficam vinculados a campanhas e podem ser pausados sem apagar historico."
              compact
            />

            <form action={createCouponAction} className="mt-8 grid gap-4">
              <label className="grid min-w-0 gap-2">
                <span className="text-sm font-semibold text-[var(--forest)]">Campanha vinculada</span>
                <select
                  name="campaignId"
                  defaultValue=""
                  className="w-full min-w-0 rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none"
                >
                  <option value="">Sem vinculo</option>
                  {board.campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.title}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="grid min-w-0 gap-2">
                  <span className="text-sm font-semibold text-[var(--forest)]">Codigo</span>
                  <input
                    name="code"
                    type="text"
                    required
                    maxLength={24}
                    className="w-full min-w-0 rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 uppercase outline-none"
                    placeholder="EX.: JANTAR10"
                  />
                </label>

                <label className="grid min-w-0 gap-2">
                  <span className="text-sm font-semibold text-[var(--forest)]">Tipo</span>
                  <select
                    name="couponType"
                    defaultValue="percentage"
                    className="w-full min-w-0 rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none"
                  >
                    {couponTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <label className="grid min-w-0 gap-2">
                  <span className="text-sm font-semibold text-[var(--forest)]">Valor</span>
                  <input
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="w-full min-w-0 rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none"
                    placeholder="10"
                  />
                </label>
                <label className="grid min-w-0 gap-2">
                  <span className="text-sm font-semibold text-[var(--forest)]">Pedido minimo</span>
                  <input
                    name="minOrder"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue="0"
                    required
                    className="w-full min-w-0 rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none"
                  />
                </label>
                <label className="grid min-w-0 gap-2">
                  <span className="text-sm font-semibold text-[var(--forest)]">Limite de uso</span>
                  <input
                    name="usageLimit"
                    type="number"
                    min="1"
                    className="w-full min-w-0 rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none"
                    placeholder="Opcional"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="grid min-w-0 gap-2">
                  <span className="text-sm font-semibold text-[var(--forest)]">Inicio</span>
                  <input
                    name="startsOn"
                    type="date"
                    required
                    className="w-full min-w-0 rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none"
                  />
                </label>
                <label className="grid min-w-0 gap-2">
                  <span className="text-sm font-semibold text-[var(--forest)]">Fim</span>
                  <input
                    name="endsOn"
                    type="date"
                    required
                    className="w-full min-w-0 rounded-[1.2rem] border border-[rgba(20,35,29,0.12)] bg-[rgba(255,255,255,0.82)] px-4 py-3 outline-none"
                  />
                </label>
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-[var(--forest)]">
                <input type="checkbox" name="isActive" defaultChecked />
                Cupom ativo
              </label>

              <button type="submit" className="button-primary mt-1">
                Criar cupom
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="pt-14">
        <div className="grid gap-5 xl:grid-cols-[0.98fr_1.02fr]">
          <div className="luxury-card rounded-[2.2rem] p-6">
            <SectionHeading
              eyebrow="Campanhas"
              title="Historico e status das acoes comerciais"
              description="Acompanhe campanhas sem misturar com filas operacionais."
              compact
            />

            <div className="mt-8 space-y-4">
              {board.campaigns.length ? (
                board.campaigns.map((campaign) => {
                  const statusView =
                    board.statusMeta[campaign.status] ?? board.statusMeta.draft;

                  return (
                    <article
                      key={campaign.id}
                      className="rounded-[1.7rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-semibold text-[var(--forest)]">
                            {campaign.title}
                          </h3>
                          <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                            {campaign.description || "Sem descricao complementar."}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${statusView.badge}`}
                        >
                          {statusView.label}
                        </span>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                        {campaign.channel} | {campaign.startsOn} ate {campaign.endsOn}
                      </p>
                      {campaign.highlightOffer ? (
                        <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                          Oferta: {campaign.highlightOffer}
                        </p>
                      ) : null}

                      <div className="mt-4 flex flex-wrap gap-2">
                        {campaignStatusOptions.map((option) => (
                          <form key={option.value} action={setCampaignStatusAction}>
                            <input type="hidden" name="campaignId" value={campaign.id} />
                            <input type="hidden" name="nextStatus" value={option.value} />
                            <button
                              type="submit"
                              disabled={campaign.status === option.value}
                              className="pill-wrap-safe rounded-full border border-[rgba(20,35,29,0.12)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--forest)] transition enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
                            >
                              {option.label}
                            </button>
                          </form>
                        ))}
                      </div>
                    </article>
                  );
                })
              ) : (
                <article className="rounded-[1.6rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.5)] p-6">
                  <p className="text-lg font-semibold text-[var(--forest)]">
                    Nenhuma campanha cadastrada
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                    Crie a primeira campanha acima para ativar a central comercial.
                  </p>
                </article>
              )}
            </div>
          </div>

          <div className="luxury-card rounded-[2.2rem] p-6">
            <SectionHeading
              eyebrow="Cupons"
              title="Codigos ativos e controle de uso"
              description="Cada cupom mostra regra de desconto, periodo e ativacao."
              compact
            />

            <div className="mt-8 space-y-4">
              {board.coupons.length ? (
                board.coupons.map((coupon) => (
                  <article
                    key={coupon.id}
                    className="rounded-[1.7rem] border border-[rgba(20,35,29,0.08)] bg-[rgba(255,255,255,0.58)] p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-[var(--sage)]">
                          {coupon.campaignTitle || "Sem campanha vinculada"}
                        </p>
                        <h3 className="mt-2 text-xl font-semibold text-[var(--forest)]">
                          {coupon.code}
                        </h3>
                        <p className="mt-1 text-sm text-[rgba(21,35,29,0.72)]">
                          {coupon.couponType === "percentage"
                            ? `${coupon.amount}%`
                            : formatCurrency(coupon.amount)}{" "}
                          | Minimo {formatCurrency(coupon.minOrder)}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${
                          coupon.isActive
                            ? "bg-[rgba(95,123,109,0.12)] text-[var(--sage)]"
                            : "bg-[rgba(138,93,59,0.12)] text-[var(--clay)]"
                        }`}
                      >
                        {coupon.isActive ? "ativo" : "pausado"}
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                      Vigencia: {coupon.startsOn} ate {coupon.endsOn} | Uso: {coupon.usageCount}
                      {coupon.usageLimit ? `/${coupon.usageLimit}` : ""}
                    </p>

                    <form action={toggleCouponActiveAction} className="mt-4">
                      <input type="hidden" name="couponId" value={coupon.id} />
                      <input
                        type="hidden"
                        name="nextActive"
                        value={String(!coupon.isActive)}
                      />
                      <button type="submit" className="button-secondary">
                        {coupon.isActive ? "Pausar cupom" : "Reativar cupom"}
                      </button>
                    </form>
                  </article>
                ))
              ) : (
                <article className="rounded-[1.6rem] border border-dashed border-[rgba(20,35,29,0.16)] bg-[rgba(255,255,255,0.5)] p-6">
                  <p className="text-lg font-semibold text-[var(--forest)]">
                    Nenhum cupom cadastrado
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[rgba(21,35,29,0.72)]">
                    Crie um cupom acima para liberar promocao com controle.
                  </p>
                </article>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
