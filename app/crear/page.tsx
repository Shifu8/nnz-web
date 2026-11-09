import type { Metadata } from "next";
import CreateEventWelcome from "@/frontend/features/organizer/CreateEventWelcome";

export const metadata: Metadata = {
  title: "Crea tus eventos | Partner 4GO",
  description: "Dale vida a tu próxima idea. Crea tu cuenta Partner 4GO y empieza a publicar tus eventos.",
};

export default function CreateEventPage() {
  return <CreateEventWelcome />;
}
