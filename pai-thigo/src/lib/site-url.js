function normalizeSiteUrl(value) {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return "";
  }

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw.replace(/\/+$/, "");
  }

  if (raw.startsWith("localhost") || raw.startsWith("127.0.0.1")) {
    return `http://${raw}`.replace(/\/+$/, "");
  }

  return `https://${raw}`.replace(/\/+$/, "");
}

export function resolvePublicSiteUrl() {
  const explicit =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim();
  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const vercelPreview = process.env.VERCEL_URL?.trim();

  return (
    normalizeSiteUrl(explicit) ||
    normalizeSiteUrl(vercelProduction) ||
    normalizeSiteUrl(vercelPreview) ||
    "http://localhost:3000"
  );
}

export function getSiteUrl() {
  return resolvePublicSiteUrl();
}
