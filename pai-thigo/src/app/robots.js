const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  process.env.SITE_URL?.trim() ||
  "http://localhost:3000";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/cardapio", "/reservas", "/eventos", "/contato"],
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
  };
}
