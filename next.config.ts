/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * Descripción: Configuración Next.js para assets remotos DAWGS.
 */

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
