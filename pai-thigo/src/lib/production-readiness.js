import "server-only";

import { cache } from "react";

import { getSiteUrl } from "@/lib/site-url";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

function trimEnvValue(value) {
  return String(value ?? "").trim();
}

function isPublicUrl(value) {
  return /^https?:\/\//i.test(value) && !/localhost|127\.0\.0\.1/i.test(value);
}

function isHttpsUrl(value) {
  return /^https:\/\//i.test(value);
}

function createCheck({
  key,
  label,
  status,
  detail,
  recommendation = "",
  category = "operacao",
}) {
  return {
    key,
    label,
    status,
    detail,
    recommendation,
    category,
  };
}

function resolvePaymentReadiness() {
  const provider = trimEnvValue(process.env.PAYMENT_PROVIDER).toLowerCase() || "manual";
  const stripeReady =
    Boolean(trimEnvValue(process.env.STRIPE_SECRET_KEY)) &&
    Boolean(trimEnvValue(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY));
  const mercadoPagoReady =
    Boolean(trimEnvValue(process.env.MERCADO_PAGO_ACCESS_TOKEN)) &&
    Boolean(trimEnvValue(process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY));

  if (provider === "stripe") {
    return stripeReady
      ? createCheck({
          key: "payment_provider",
          label: "Pagamento online",
          status: "ok",
          detail: "Stripe configurado para cobranca online em producao.",
          category: "pagamento",
        })
      : createCheck({
          key: "payment_provider",
          label: "Pagamento online",
          status: "error",
          detail: "Stripe foi definido como gateway, mas as chaves ainda nao estao completas.",
          recommendation:
            "Preencha STRIPE_SECRET_KEY e NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY antes da publicacao.",
          category: "pagamento",
        });
  }

  if (provider === "mercadopago") {
    return mercadoPagoReady
      ? createCheck({
          key: "payment_provider",
          label: "Pagamento online",
          status: "ok",
          detail: "Mercado Pago configurado para cobranca online em producao.",
          category: "pagamento",
        })
      : createCheck({
          key: "payment_provider",
          label: "Pagamento online",
          status: "error",
          detail:
            "Mercado Pago foi definido como gateway, mas as credenciais ainda nao estao completas.",
          recommendation:
            "Preencha MERCADO_PAGO_ACCESS_TOKEN e NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY antes da publicacao.",
          category: "pagamento",
        });
  }

  return createCheck({
    key: "payment_provider",
    label: "Pagamento online",
    status: "warning",
    detail:
      "O checkout esta operando em modo manual, com confirmacao no atendimento, retirada ou entrega.",
    recommendation:
      "Se quiser cobranca online automatica, configure PAYMENT_PROVIDER com Stripe ou Mercado Pago.",
    category: "pagamento",
  });
}

export const getProductionReadinessReport = cache(
  async function getProductionReadinessReport() {
    const configuredSiteUrl =
      trimEnvValue(process.env.NEXT_PUBLIC_SITE_URL) ||
      trimEnvValue(process.env.SITE_URL);
    const serviceRoleConfigured = Boolean(
      trimEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY),
    );
    const supabaseConfigured = isSupabaseConfigured();
    const resolvedSiteUrl = configuredSiteUrl || (await getSiteUrl());
    const checks = [];

    checks.push(
      supabaseConfigured
        ? createCheck({
            key: "supabase_public_env",
            label: "Conexao publica com Supabase",
            status: "ok",
            detail: "NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estao definidos.",
            category: "infra",
          })
        : createCheck({
            key: "supabase_public_env",
            label: "Conexao publica com Supabase",
            status: "error",
            detail: "As variaveis publicas do Supabase ainda nao estao completas.",
            recommendation:
              "Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no ambiente de producao.",
            category: "infra",
          }),
    );

    checks.push(
      serviceRoleConfigured
        ? createCheck({
            key: "supabase_service_role",
            label: "Chave administrativa",
            status: "ok",
            detail: "SUPABASE_SERVICE_ROLE_KEY disponivel para operacoes administrativas.",
            category: "infra",
          })
        : createCheck({
            key: "supabase_service_role",
            label: "Chave administrativa",
            status: "warning",
            detail:
              "SUPABASE_SERVICE_ROLE_KEY nao esta definida no ambiente atual.",
            recommendation:
              "Preencha a chave se for automatizar criacao de equipe ou operacoes administrativas fora da sessao do usuario.",
            category: "infra",
          }),
    );

    const siteUrlStatus = !configuredSiteUrl
      ? createCheck({
          key: "site_url",
          label: "Dominio publicado",
          status: "error",
          detail: "NEXT_PUBLIC_SITE_URL ainda nao foi definido para um dominio publico.",
          recommendation:
            "Defina NEXT_PUBLIC_SITE_URL com o dominio final do projeto para confirmacao de conta, recuperacao e SEO.",
          category: "publicacao",
        })
      : !isPublicUrl(configuredSiteUrl)
        ? createCheck({
            key: "site_url",
            label: "Dominio publicado",
            status: "error",
            detail: `O site ainda esta apontando para ${configuredSiteUrl}.`,
            recommendation:
              "Troque NEXT_PUBLIC_SITE_URL para o dominio final antes de publicar.",
            category: "publicacao",
          })
        : !isHttpsUrl(configuredSiteUrl)
          ? createCheck({
              key: "site_url",
              label: "Dominio publicado",
              status: "warning",
              detail: `O site esta configurado em ${configuredSiteUrl}, mas ainda sem HTTPS.`,
              recommendation: "Publique com HTTPS para login, cookies e SEO local.",
              category: "publicacao",
            })
          : createCheck({
              key: "site_url",
              label: "Dominio publicado",
              status: "ok",
              detail: `Dominio publico configurado em ${configuredSiteUrl}.`,
              category: "publicacao",
            });

    checks.push(siteUrlStatus);

    const paymentCheck = resolvePaymentReadiness();
    checks.push(paymentCheck);

    const smtpCheck =
      configuredSiteUrl && isPublicUrl(configuredSiteUrl)
        ? createCheck({
            key: "supabase_smtp",
            label: "Entrega de e-mail",
            status: "warning",
            detail:
              "O fluxo de confirmacao e recuperacao esta pronto no app, mas o SMTP do Supabase precisa ser conferido no painel.",
            recommendation:
              "Valide SMTP proprio em Supabase Auth para garantir confirmacao de conta e redefinicao em producao.",
            category: "acesso",
          })
        : createCheck({
            key: "supabase_smtp",
            label: "Entrega de e-mail",
            status: "warning",
            detail:
              "O fluxo de e-mail esta pronto no app, mas o dominio publico e o SMTP ainda precisam ser alinhados no Supabase.",
            recommendation:
              "Publique o dominio final e configure SMTP proprio antes de depender da confirmacao por e-mail em clientes reais.",
            category: "acesso",
          });

    checks.push(smtpCheck);

    let connectionCheck = createCheck({
      key: "supabase_connection",
      label: "Leitura do banco",
      status: "error",
      detail: "Nao foi possivel iniciar a conexao do servidor com o Supabase.",
      recommendation:
        "Confira as variaveis publicas do projeto e a disponibilidade do banco antes da publicacao.",
      category: "infra",
    });

    let schemaCheck = createCheck({
      key: "schema_runtime",
      label: "Estrutura critica do banco",
      status: "error",
      detail: "As tabelas principais ainda nao puderam ser verificadas neste ambiente.",
      recommendation:
        "Rode novamente o schema mais recente no SQL Editor do Supabase e confira as policies.",
      category: "infra",
    });

    if (supabaseConfigured) {
      const supabase = await getSupabaseServerClient();

      if (supabase) {
        const [
          settingsResult,
          zonesResult,
          menuResult,
          tablesResult,
          reservationsResult,
        ] = await Promise.all([
          supabase.from("restaurant_settings").select("id").limit(1),
          supabase.from("delivery_zones").select("id").limit(1),
          supabase.from("menu_categories").select("id").limit(1),
          supabase.from("restaurant_tables").select("id").limit(1),
          supabase.from("reservations").select("id").limit(1),
        ]);

        const queryResults = [
          settingsResult,
          zonesResult,
          menuResult,
          tablesResult,
          reservationsResult,
        ];
        const queryErrors = queryResults.filter((result) => result.error);

        connectionCheck = queryErrors.length
          ? createCheck({
              key: "supabase_connection",
              label: "Leitura do banco",
              status: "warning",
              detail:
                "O servidor encontrou o Supabase, mas pelo menos uma leitura principal ainda falhou.",
              recommendation:
                "Confirme schema, policies e acesso das contas internas antes da publicacao.",
              category: "infra",
            })
          : createCheck({
              key: "supabase_connection",
              label: "Leitura do banco",
              status: "ok",
              detail: "O servidor conseguiu consultar as tabelas principais do projeto.",
              category: "infra",
            });

        schemaCheck = queryErrors.length
          ? createCheck({
              key: "schema_runtime",
              label: "Estrutura critica do banco",
              status: "error",
              detail:
                "Uma ou mais tabelas principais nao responderam como esperado na verificacao de runtime.",
              recommendation:
                "Rode o schema atual em supabase/schema.sql e valide as policies das areas internas.",
              category: "infra",
            })
          : createCheck({
              key: "schema_runtime",
              label: "Estrutura critica do banco",
              status: "ok",
              detail:
                "restaurant_settings, delivery_zones, menu_categories, restaurant_tables e reservations responderam corretamente.",
              category: "infra",
            });
      }
    }

    checks.push(connectionCheck, schemaCheck);

    const blockingItems = checks.filter((check) => check.status === "error");
    const warningItems = checks.filter((check) => check.status === "warning");
    const okItems = checks.filter((check) => check.status === "ok");

    return {
      generatedAt: new Date().toISOString(),
      siteUrl: resolvedSiteUrl,
      publishReady: blockingItems.length === 0,
      summary: {
        ok: okItems.length,
        warning: warningItems.length,
        error: blockingItems.length,
      },
      blockingItems,
      checks,
    };
  },
);
