/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * DescripciÃ³n: Entrada App Router hacia la experiencia premium DAWGS.
 */

import DawgsHomePage from "@/frontend/app/HomePage";
import { loadConfig } from "@/lib/homepage-config/store";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const config = loadConfig();
  return <DawgsHomePage initialConfig={config} />;
}
