const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  process.env.SITE_URL?.trim() ||
  "http://localhost:3000";

export default function sitemap() {
  const baseUrl = siteUrl.replace(/\/$/, "");
  const routes = ["/", "/cardapio", "/reservas", "/eventos", "/contato"];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : 0.7,
  }));
}
