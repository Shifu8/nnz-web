/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * DescripciÃ³n: Layout raÃ­z de Next.js para NENEZ.
 */

import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono, Comfortaa, Quicksand } from "next/font/google";

import "./globals.css";
import MobileCookieConsent from "@/components/MobileCookieConsent";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const comfortaa = Comfortaa({
  variable: "--font-comfortaa",
  subsets: ["latin"],
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#000000",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "4go | Descubre y publica eventos en Loja",
  description:
    "Todo lo que pasa en Loja, en 4go. Descubre conciertos, ferias, cultura y talleres, compra tus entradas o publica tu propio evento.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/images/logo_4go_black_white.png?v=4", type: "image/png" },
    ],
    shortcut: "/images/logo_4go_black_white.png?v=4",
    apple: "/images/logo_4go_black_white.png?v=4",
  },
  openGraph: {
    title: "4go | Eventos y experiencias",
    description: "Descubre eventos en Loja y comparte el tuyo con toda la ciudad.",
    siteName: "4GO",
    images: [
      {
        url: "/images/nenez_merch_official_couch_hero.png",
        width: 1200,
        height: 630,
        alt: "4GO Eventos",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "4go | Eventos y experiencias",
    description: "Descubre eventos en Loja y comparte el tuyo con toda la ciudad.",
    images: ["/images/nenez_merch_official_couch_hero.png"],
  },
  appleWebApp: { capable: true, title: "4GO", statusBarStyle: "black-translucent" },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} ${comfortaa.variable} ${quicksand.variable} h-full antialiased`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/images/logo_4go_black_white.png?v=4" type="image/png" />
        <link rel="shortcut icon" href="/images/logo_4go_black_white.png?v=4" type="image/png" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/images/logo_4go_black_white.png?v=4" />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <MobileCookieConsent />
      </body>
    </html>
  );
}

