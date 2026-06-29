"use client";



export default function SponsorsSection() {
  const sponsors = [
    {
      name: "NENEZ Burgers",
      role: "Official Food Partner",
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20"
    },
    {
      name: "Kyoto Sushi Bar",
      role: "Premium Catering",
      color: "text-red-500",
      bg: "bg-red-500/10",
      border: "border-red-500/20"
    },
    {
      name: "Iron Athletics",
      role: "Fitness Partner",
      color: "text-zinc-300",
      bg: "bg-zinc-500/10",
      border: "border-zinc-500/20"
    },
    {
      name: "Zen Fisioterapia",
      role: "Recovery Partner",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20"
    }
  ];

  return (
    <section className="relative z-10 w-full bg-black py-24 border-t border-white/5">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="text-center mb-16">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500 mb-2">Respaldado por los mejores</p>
          <h2 className="text-3xl md:text-5xl font-black text-white leading-none tracking-tighter uppercase italic">
            Official Sponsors.
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {sponsors.map((sponsor, idx) => (
            <div key={idx} className={`flex flex-col items-center justify-center rounded-[24px] border ${sponsor.border} bg-black/40 p-8 transition-all hover:bg-white/5 hover:scale-105 group`}>
              <div className={`h-16 w-16 rounded-full flex items-center justify-center ${sponsor.bg} mb-4 group-hover:scale-110 transition-transform`}>
              </div>
              <h3 className="text-sm font-black text-white text-center uppercase tracking-widest">{sponsor.name}</h3>
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1 text-center">{sponsor.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
