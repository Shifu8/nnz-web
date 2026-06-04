import { notFound } from "next/navigation";
import { getTicketByCode } from "@/lib/ticket";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TicketCard from "@/components/TicketCard";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TicketPage({ params }: Props) {
  const { id } = await params;
  const ticket = await getTicketByCode(id);

  if (!ticket) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-28">
        <div className="text-center mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.54em] text-[#C8FF00]">DAWGS</p>
          <h1 className="mt-3 text-3xl md:text-5xl font-black uppercase tracking-tighter text-white">
            TU TICKET
          </h1>
        </div>
        <TicketCard ticket={ticket} />
        <p className="mt-8 max-w-xs text-center text-[9px] text-zinc-600 uppercase tracking-widest leading-5">
          Este QR es válido una sola vez en puerta. No lo compartas en redes sociales.
        </p>
      </section>
      <Footer />
    </main>
  );
}
