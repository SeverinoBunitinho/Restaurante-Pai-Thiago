import "server-only";

import { headers } from "next/headers";

export async function getSiteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.SITE_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  const headerStore = await headers();
  const origin = headerStore.get("origin");

  if (origin) {
    return origin.replace(/\/$/, "");
  }

  const forwardedProto = headerStore.get("x-forwarded-proto") ?? "http";
  const forwardedHost =
    headerStore.get("x-forwarded-host") ?? headerStore.get("host");

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return "http://localhost:3000";
}
