import { Cormorant_Garamond, Manrope } from "next/font/google";

import { AppLiveSync } from "@/components/app-live-sync";
import { CartProvider } from "@/components/cart-provider";

import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  process.env.SITE_URL?.trim() ||
  "http://localhost:3000";
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
  title: "Pai Thiago | Restaurante contemporaneo",
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
  openGraph: {
    title: "Pai Thiago | Restaurante contemporaneo",
    description:
      "Reservas, delivery, atendimento e operacao interna em uma experiencia digital conectada ao restaurante.",
    url: "/",
    siteName: "Pai Thiago",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pai Thiago | Restaurante contemporaneo",
    description:
      "Reservas, delivery, atendimento e operacao interna em uma experiencia digital conectada ao restaurante.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="pt-BR"
      className={`${manrope.variable} ${cormorant.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <CartProvider>
          <AppLiveSync />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
