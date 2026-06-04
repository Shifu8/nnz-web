import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LiveGiveaway from "@/frontend/features/giveaway/LiveGiveaway";

export default function GiveawayPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />
      <section className="relative z-10 mx-auto max-w-[1600px] w-full px-6 md:px-12 lg:px-16 pt-28 pb-24">
        <div className="text-center mb-12">
          <p className="text-[10px] font-black uppercase tracking-[0.54em] text-red-400">DAWGS</p>
          <h1 className="mt-3 text-4xl md:text-6xl font-black uppercase tracking-tighter text-white">
            GIVEAWAY
          </h1>
          <p className="mt-3 text-sm text-zinc-400 max-w-md mx-auto">
            Participa en los sorteos en vivo y gana premios exclusivos de la comunidad DAWGS.
          </p>
        </div>
        <LiveGiveaway onClose={undefined} />
      </section>
      <Footer />
    </main>
  );
}
