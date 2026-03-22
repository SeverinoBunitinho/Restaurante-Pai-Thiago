import { Cormorant_Garamond, Manrope } from "next/font/google";

import { AppLiveSync } from "@/components/app-live-sync";
import { CartProvider } from "@/components/cart-provider";
import { restaurantInfo } from "@/lib/mock-data";
import { resolvePublicSiteUrl } from "@/lib/site-url";

import "./globals.css";

const siteUrl = resolvePublicSiteUrl();
const metadataBase = (() => {
  try {
    return new URL(siteUrl);
  } catch {
    return new URL("http://localhost:3000");
  }
})();

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  metadataBase,
  applicationName: "Pai Thiago",
  title: {
    default: "Pai Thiago | Restaurante contemporaneo",
    template: "%s | Pai Thiago",
  },
  description:
    "Site do restaurante Pai Thiago com login, reservas, cardapio, areas por perfil e integracao com Supabase.",
  keywords: [
    "restaurante",
    "restaurante contemporaneo",
    "pai thiago",
    "delivery",
    "reservas online",
    "supabase",
    "next.js",
  ],
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Pai Thiago | Restaurante contemporaneo",
    description:
      "Reservas, delivery, atendimento e operacao interna em uma experiencia digital conectada ao restaurante.",
    url: "/",
    siteName: "Pai Thiago",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1400&q=80",
        width: 1400,
        height: 900,
        alt: "Ambiente do restaurante Pai Thiago",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pai Thiago | Restaurante contemporaneo",
    description:
      "Reservas, delivery, atendimento e operacao interna em uma experiencia digital conectada ao restaurante.",
    images: [
      "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1400&q=80",
    ],
  },
};

const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: restaurantInfo.name,
  description: restaurantInfo.description,
  url: siteUrl,
  telephone: restaurantInfo.phone,
  email: restaurantInfo.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: restaurantInfo.address,
    addressLocality: restaurantInfo.city,
    addressCountry: "BR",
  },
  servesCuisine: ["Brasileira contemporanea"],
  sameAs: [restaurantInfo.instagramUrl, restaurantInfo.facebookUrl],
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="pt-BR"
      className={`${manrope.variable} ${cormorant.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <a href="#main-content" className="skip-link">
          Pular para o conteudo principal
        </a>
        <CartProvider>
          <AppLiveSync />
          <div id="main-content">{children}</div>
        </CartProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationStructuredData),
          }}
        />
      </body>
    </html>
  );
}
