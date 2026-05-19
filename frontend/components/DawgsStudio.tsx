"use client";

import { ArrowRight, Music, SlidersHorizontal, Disc3, Speaker } from "lucide-react";

export default function DawgsStudio() {
  const services = [
    { icon: Music, title: "Production", desc: "Beatmaking, sound design y estructuración." },
    { icon: SlidersHorizontal, title: "Mix & Master", desc: "Sonido cristalino, punch analógico." },
    { icon: Disc3, title: "Creative Sessions", desc: "Campamentos de composición y grabación." },
    { icon: Speaker, title: "Sonic Branding", desc: "Identidad sonora para marcas y artistas." },
  ];

  return (
    <section id="studio" className="relative z-10 w-full min-h-screen bg-[#050505] py-24 border-t border-white/5 overflow-hidden">
      {/* Background Cinematic Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-red-900/10 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-zinc-800/20 rounded-full blur-[150px] mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-8 relative z-10">

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-red-500 mb-4 drop-shadow-[0_0_10px_rgba(255,0,0,0.5)]">
            Creative Hub
          </p>
          <h2 className="text-5xl md:text-8xl font-black text-white leading-[0.9] tracking-tighter mb-6">
            DAWGS<br />STUDIO
          </h2>
          <p className="text-sm md:text-base text-zinc-400 leading-relaxed">
            Más que un cuarto de grabación. Un ecosistema diseñado para esculpir el sonido de la próxima ola del trap y música urbana.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

          {/* Visual Showcase (Mock image placeholder with CSS) */}
          <div className="relative h-[500px] md:h-[600px] rounded-[40px] border border-white/5 bg-black overflow-hidden group">
            {/* Background Image de Estudio real o placeholder */}
            <img
              src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2070&auto=format&fit=crop"
              alt="Studio Setup"
              className="absolute inset-0 w-full h-full object-cover mix-blend-luminosity opacity-40 transition-transform duration-1000 group-hover:scale-110"
            />

            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8)_0%,transparent_1px)] bg-[size:4px_4px]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.4)_40%,#000)]" />

            <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black to-transparent">
              <p className="text-white text-xl font-black uppercase tracking-widest">Medellin, CO</p>
              <p className="text-zinc-500 text-sm mt-1">Analog & Digital Hybrid Setup</p>
            </div>
          </div>

          {/* Services & CTA */}
          <div className="flex flex-col justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
              {services.map((service, i) => (
                <div key={i} className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition duration-300">
                  <service.icon className="w-6 h-6 text-red-400 mb-4" />
                  <h3 className="text-white font-bold mb-2 uppercase tracking-wide text-sm">{service.title}</h3>
                  <p className="text-zinc-500 text-xs leading-relaxed">{service.desc}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <a href="https://wa.me/593988831372?text=Hola%20DAWGS%20Studio,%20quiero%20empezar%20un%20proyecto" target="_blank" rel="noreferrer" className="w-full sm:w-auto flex items-center justify-between sm:justify-center gap-4 bg-white text-black h-14 px-8 rounded-2xl font-black uppercase tracking-widest transition-all hover:bg-zinc-200 hover:scale-[1.02]">
                Start a Project
                <ArrowRight className="w-5 h-5" />
              </a>
              <a href="https://wa.me/593988831372?text=Hola%20DAWGS%20Studio,%20quiero%20agendar%20una%20sesi%C3%B3n" target="_blank" rel="noreferrer" className="w-full sm:w-auto flex items-center justify-center gap-4 bg-transparent text-white border border-white/20 h-14 px-8 rounded-2xl font-bold uppercase tracking-widest transition-all hover:bg-white/5">
                Book a Session
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
