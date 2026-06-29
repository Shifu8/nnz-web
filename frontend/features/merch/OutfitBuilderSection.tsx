"use client";

import Image from "next/image";

const STUDIO_HERO_IMAGE = "/images/dawgs-studio-couch.png";
const STUDIO_PORTRAIT_IMAGE = "/images/dawgs-studio-portrait.png";

export default function OutfitBuilderSection() {
  return (
    <section
      id="wear"
      className="hero-reveal relative z-20 mx-auto w-full max-w-[1600px] px-4 pb-16 sm:px-6 md:px-12 lg:px-16"
    >
      <div 
        className="relative overflow-hidden rounded-[32px] border border-white/10 bg-black/45 backdrop-blur-2xl shadow-2xl min-h-[750px] md:min-h-[850px] flex flex-col"
        style={{ boxShadow: "0 24px 90px rgba(255, 255, 255, 0.01)" }}
      >
        {/* Grayscale Background Image integrating naturally into the dark room context */}
        <Image
          src={STUDIO_HERO_IMAGE}
          alt="Modelos DAWGS usando hoodie y jogger burgundy en sofa de estudio"
          fill
          sizes="(max-width: 1600px) 100vw, 1600px"
          className="object-cover object-[center_top] opacity-50 grayscale contrast-[1.15] brightness-[0.7]"
          priority={false}
        />
        
        {/* Soft dark vignette overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/35 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black/95" />
        <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:100%_5px]" />

        {/* Editorial Content Container */}
        <div className="relative z-10 flex-1 flex flex-col justify-between p-6 sm:p-8 lg:p-12">
          
          {/* Header Metadata */}
          <div className="flex items-center justify-between gap-4 text-[9px] font-black uppercase tracking-[0.24em] text-zinc-400">
            <span>DAWGS Studio</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-md text-white">
              Drop activo
            </span>
          </div>

          {/* Main Visuals & Title Composition */}
          <div className="grid items-end gap-10 lg:grid-cols-[380px_minmax(0,1fr)] mt-12 mb-8">
            
            {/* Left Box: Portrait Editorial Frame */}
            <div className="max-w-[380px] w-full">
              <div className="relative overflow-hidden rounded-[20px] border border-white/10 bg-black shadow-[0_24px_70px_rgba(0,0,0,0.7)]">
                <div className="relative aspect-[4/5] min-h-[460px] md:min-h-[500px] overflow-hidden bg-zinc-950">
                  <Image
                    src={STUDIO_PORTRAIT_IMAGE}
                    alt="Modelos DAWGS en hoodie burgundy editorial"
                    fill
                    sizes="(max-width: 768px) 100vw, 380px"
                    className="object-cover object-[68%_42%] grayscale contrast-[1.1] brightness-[0.75]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/90" />
                  <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.65)_1px,transparent_1px)] [background-size:100%_6px]" />
                  
                  <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-zinc-300 backdrop-blur-md">
                    Made by studios
                  </div>
                  
                  <div className="absolute bottom-5 left-5 right-5">
                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400">
                      Studio mood
                    </p>
                    <h3 className="mt-2 text-2xl font-black uppercase leading-[0.95] text-white tracking-tighter">
                      No es outfit.
                      <span className="block text-zinc-300 font-bold">
                        Es presencia.
                      </span>
                    </h3>
                  </div>
                </div>
              </div>

              {/* Tag Elements under Portrait */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {["Drop privado", "Sin uniforme", "Movimiento"].map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-white/5 bg-white/[0.02] px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.14em] text-zinc-400 backdrop-blur-md transition hover:border-white/20 hover:text-white"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Right Box: Editorial Text block (Visible on desktop) */}
            <div className="hidden max-w-sm justify-self-end rounded-2xl border border-white/10 bg-black/60 p-6 text-right backdrop-blur-md lg:block">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">
                Obsession 01
              </p>
              <p className="mt-3 text-2xl font-black uppercase leading-[1.0] tracking-tight text-white">
                Studio rack
                <span className="block text-zinc-400 font-medium text-lg mt-1 lowercase italic">ready to wear</span>
              </p>
            </div>

          </div>

          {/* Footer Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-[8px] font-black uppercase tracking-[0.22em] text-zinc-500">
            <span>DAWGS Studio / private drop</span>
          </div>

        </div>
      </div>
    </section>
  );
}
