import { resolvePublicSiteUrl } from "@/lib/site-url";

const siteUrl = resolvePublicSiteUrl();

export default function sitemap() {
  const baseUrl = siteUrl.replace(/\/$/, "");
  const routes = [
    "/",
    "/cardapio",
    "/reservas",
    "/eventos",
    "/contato",
    "/privacidade",
    "/termos",
    "/cancelamentos",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : 0.7,
  }));
}
