import type { Metadata } from "next";
import { cookies } from "next/headers";
import HomePage from "@/frontend/app/HomePage";
import { loadConfig } from "@/lib/homepage-config/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Eventos en Loja | 4go", description: "Encuentra tu próximo concierto, fiesta o experiencia en Loja. Explora la cartelera de 4go." };

export default async function EventsPage() {
  const cookieStore = await cookies();
  return <HomePage initialConfig={loadConfig()} initialLoggedIn={Boolean(cookieStore.get("organizer_logged_in")?.value)} initialView="events" />;
}
