import { resolvePublicSiteUrl } from "@/lib/site-url";

const siteUrl = resolvePublicSiteUrl();

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/cardapio",
          "/reservas",
          "/eventos",
          "/contato",
          "/privacidade",
          "/termos",
          "/cancelamentos",
        ],
        disallow: [
          "/login",
          "/cadastro",
          "/recuperar-senha",
          "/redefinir-senha",
          "/area-cliente",
          "/area-funcionario",
          "/painel",
          "/operacao",
        ],
      },
    ],
    sitemap: `${siteUrl.replace(/\/$/, "")}/sitemap.xml`,
    host: siteUrl.replace(/\/$/, ""),
  };
}
