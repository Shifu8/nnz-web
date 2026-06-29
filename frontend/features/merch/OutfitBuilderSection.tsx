"use client";

import Image from "next/image";

const STUDIO_HERO_IMAGE = "/images/dawgs-studio-couch.png";
const STUDIO_PORTRAIT_IMAGE = "/images/dawgs-studio-portrait.png";

export default function OutfitBuilderSection() {
  return (
    <section
      id="wear"
      className="hero-reveal relative z-20 mx-auto w-full max-w-[1600px] px-4 py-16 sm:px-6 md:px-12 lg:px-16"
    >
      <div 
        className="relative overflow-hidden rounded-[32px] border border-white/10 bg-black/45 p-5 backdrop-blur-2xl sm:p-7 lg:p-9 shadow-2xl grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center"
        style={{ boxShadow: "0 24px 90px rgba(255, 255, 255, 0.01)" }}
      >
        {/* Ambient background Couch image - Full Color for rich visual contrast */}
        <Image
          src={STUDIO_HERO_IMAGE}
          alt="Modelos DAWGS usando hoodie y jogger burgundy en sofa de estudio"
          fill
          sizes="(max-width: 1600px) 100vw, 1600px"
          className="object-cover object-[center_top] opacity-65 transition-opacity duration-1000"
          priority={false}
        />
        
        {/* Soft vignette overlays to integrate colors naturally into the dark theme */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/15 to-black/85" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:100%_5px]" />

        {/* Left Column: Symmetrical layout typography headers */}
        <div className="relative flex flex-col justify-center">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.3em] text-white">
            DAWGS Wear
          </p>
          <h2 className="mt-4 text-4xl font-black uppercase leading-[0.9] tracking-[-0.05em] text-white sm:text-5xl">
            No es outfit.
            <br />
            Es presencia.
          </h2>
          <p className="mt-5 inline-flex items-center gap-2 text-xl font-black uppercase tracking-[-0.03em] text-white">
            Studio Rack
          </p>
          <p className="mt-5 max-w-lg text-sm leading-7 text-zinc-400">
            Edición limitada creada por nuestros diseñadores en el estudio, utilizando materiales premium y un fit estructurado listo para usarse.
          </p>
        </div>

        {/* Right Column: Premium Visual Product Showcase in Full Color (Vertical Portrait Aspect for Full Visibility) */}
        <div className="relative z-10 w-full flex flex-col gap-4">
          <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-zinc-950/60 p-3 shadow-[0_24px_70px_rgba(0,0,0,0.6)] backdrop-blur-md">
            <div className="relative aspect-[4/5] min-h-[560px] overflow-hidden rounded-[18px]">
              <Image
                src={STUDIO_PORTRAIT_IMAGE}
                alt="Modelos DAWGS en estudio"
                fill
                sizes="(max-width: 768px) 100vw, 680px"
                className="object-cover object-[68%_36%] transition-transform duration-700 hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              
              <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/60 px-3 py-1 text-[8px] font-black uppercase tracking-[0.2em] text-zinc-300 backdrop-blur-md">
                Obsession 01
              </div>
              
              <div className="absolute bottom-4 left-4">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400">Made by studios</p>
                <p className="text-sm font-black uppercase text-white mt-1 tracking-tight">Ready to wear</p>
              </div>
            </div>
          </div>

          {/* Product Tag Indicators matching layout borders */}
          <div className="flex flex-wrap gap-1.5 justify-end">
            {["Drop privado", "Diseño Studio", "Edición 01"].map((label) => (
              <span
                key={label}
                className="rounded-full border border-white/5 bg-white/[0.02] px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.14em] text-zinc-500 backdrop-blur-md"
              >
                {label}
              </span>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
