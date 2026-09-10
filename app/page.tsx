/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * DescripciÃ³n: Entrada App Router hacia la experiencia premium NENEZ.
 */

import NenezHomePage from "@/frontend/app/HomePage";
import { loadConfig } from "@/lib/homepage-config/store";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const cookieStore = await cookies();
  const initialLoggedIn = Boolean(cookieStore.get("organizer_logged_in")?.value);
  const config = loadConfig();
  return <NenezHomePage initialConfig={config} initialLoggedIn={initialLoggedIn} />;
}

