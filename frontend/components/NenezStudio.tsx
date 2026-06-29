"use client";

import { useState, useEffect, type CSSProperties } from "react";

import { motion, AnimatePresence } from "framer-motion";

const studioImages = [
  {
    src: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2070&auto=format&fit=crop",
    title: "Medellin, CO",
    desc: "Analog & Digital Hybrid Setup"
  },
  {
    src: "https://images.unsplash.com/photo-1598653222000-6b7b7a552625?q=80&w=2070&auto=format&fit=crop",
    title: "Vocal Booth",
    desc: "Neumann U87 & Premium Acoustics"
  },
  {
    src: "https://images.unsplash.com/photo-1605722243979-fe0be8158232?q=80&w=2070&auto=format&fit=crop",
    title: "Creative Sessions",
    desc: "Live Vocal Recording & Songwriting"
  },
  {
    src: "https://images.unsplash.com/photo-1601042879364-f3947d3f9c16?q=80&w=2070&auto=format&fit=crop",
    title: "Control Room A",
    desc: "Solid State Logic & Producer Collaboration"
  }
];


export default function NenezStudio() {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImgIndex((prev) => (prev + 1) % studioImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const services = [
    { title: "Production", desc: "Beatmaking, sound design y estructuración." },
    { title: "Mix & Master", desc: "Sonido cristalino, punch analógico." },
    { title: "Creative Sessions", desc: "Campamentos de composición y grabación." },
    { title: "Sonic Branding", desc: "Identidad sonora para marcas y artistas." },
  ];

  return (
    <section id="studio" className="relative z-10 w-full min-h-screen bg-transparent py-24 border-t border-white/5 overflow-hidden">
      {/* Background Cinematic Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-red-900/10 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-zinc-800/10 rounded-full blur-[150px] mix-blend-screen" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")", backgroundRepeat: "repeat", backgroundSize: "128px 128px" }} />
      </div>

      <div className="mx-auto max-w-[1600px] w-full px-6 md:px-12 lg:px-16 xl:px-20 relative z-10">

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-red-500 mb-4 drop-shadow-[0_0_10px_rgba(255,0,0,0.5)]">
            Creative Hub
          </p>
          <h2 className="text-5xl md:text-8xl font-black text-white leading-[0.9] tracking-tighter mb-6">
            NENEZ<br />STUDIO
          </h2>
          <p className="text-sm md:text-base text-zinc-400 leading-relaxed">
            Más que un cuarto de grabación. Un ecosistema diseñado para esculpir el sonido de la próxima ola del trap y música urbana.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

          {/* Visual Showcase (Slideshow) */}
          <div className="relative h-[500px] md:h-[600px] rounded-[40px] border border-white/5 bg-black overflow-hidden group">
            {/* Background Image de Estudio real con crossfade */}
            <AnimatePresence mode="wait">
              <motion.img
                key={currentImgIndex}
                src={studioImages[currentImgIndex].src}
                alt="Studio Setup"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 0.4, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full object-cover mix-blend-luminosity"
              />
            </AnimatePresence>

            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8)_0%,transparent_1px)] bg-[size:4px_4px] pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.4)_40%,#000)] pointer-events-none" />

            <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black to-transparent pointer-events-none z-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentImgIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.6 }}
                >
                  <p className="text-white text-xl font-black uppercase tracking-widest">{studioImages[currentImgIndex].title}</p>
                  <p className="text-zinc-500 text-sm mt-1">{studioImages[currentImgIndex].desc}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Slide indicators */}
            <div className="absolute top-6 right-8 flex gap-1.5 z-10 pointer-events-none">
              {studioImages.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === currentImgIndex ? "bg-red-500 w-6 shadow-[0_0_8px_red]" : "bg-white/20 w-1.5"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Services & CTA */}
          <div className="flex flex-col justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
              {services.map((service, i) => (
                <div key={i} className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition duration-300">
                  <h3 className="text-white font-bold mb-2 uppercase tracking-wide text-sm">{service.title}</h3>
                  <p className="text-zinc-500 text-xs leading-relaxed">{service.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-start">
              <a 
                href="https://wa.me/593988831372?text=Hola%20NENEZ%20Studio,%20quiero%20empezar%20un%20proyecto" 
                target="_blank" 
                rel="noreferrer" 
                className="glass-action"
                style={{ "--glass-action-height": "56px", "--glass-action-px": "2.5rem", "--glass-action-text": "0.72rem" } as CSSProperties}
              >
                Start a Project

              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
