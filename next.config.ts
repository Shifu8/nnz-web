/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * Descripción: Configuración Next.js para assets remotos y seguridad NENEZ.
 */

import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const isDev = process.env.NODE_ENV !== "production";
const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https://images.unsplash.com",
  "font-src 'self'",
  "connect-src 'self' https://challenges.cloudflare.com https://pay.payphonetodoesposible.com https://*.supabase.co https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://graph.facebook.com https://in-v3.mailjet.com",
  "frame-src 'self' https://challenges.cloudflare.com",
  "media-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  env: {
    NEXT_PUBLIC_PAYPHONE_ENV: process.env.NEXT_PUBLIC_PAYPHONE_ENV || process.env.PAYPHONE_ENV || "",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "off",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: csp,
          },
          ...(isDev
            ? []
            : [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains; preload",
                },
              ]),
        ],
      },
    ];
  },
};

export default nextConfig;
