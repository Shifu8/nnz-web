"use client";

import Image from "next/image";

const STUDIO_HERO_IMAGE = "/images/nenez-studio-couch.png";
const STUDIO_PORTRAIT_IMAGE = "/images/nenez-studio-portrait.png";

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
        {/* Base stable image */}
        <Image
          src={STUDIO_HERO_IMAGE}
          alt="Modelos NENEZ usando hoodie y jogger burgundy en sofa de estudio"
          fill
          sizes="(max-width: 1600px) 100vw, 1600px"
          className="object-cover object-[center_top] opacity-65 pointer-events-none"
          priority={false}
        />

        {/* Glitch Slices - Occasional Horizontal Displacement */}
        <div className="absolute inset-0 pointer-events-none opacity-65 animate-glitch-slice-1">
          <Image
            src={STUDIO_HERO_IMAGE}
            alt=""
            fill
            sizes="(max-width: 1600px) 100vw, 1600px"
            className="object-cover object-[center_top]"
          />
        </div>
        <div className="absolute inset-0 pointer-events-none opacity-65 animate-glitch-slice-2">
          <Image
            src={STUDIO_HERO_IMAGE}
            alt=""
            fill
            sizes="(max-width: 1600px) 100vw, 1600px"
            className="object-cover object-[center_top]"
          />
        </div>

        {/* Vintage Rolling TV hum bar */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-x-0 h-[200px] bg-gradient-to-b from-transparent via-white/[0.03] to-transparent opacity-40 animate-rolling-bar" />
        </div>

        {/* Soft vignette overlays to integrate colors naturally into the dark theme */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/15 to-black/85" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:100%_5px]" />

        {/* Left Column: Symmetrical layout typography headers */}
        <div className="relative flex flex-col justify-center">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.3em] text-white">
            NENEZ Wear
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

        {/* Right Column: Premium Visual Product Showcase - Scaled Down for Visual Elegance */}
        <div className="relative z-10 w-full flex flex-col gap-4 items-center lg:items-end">
          <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-zinc-950/60 p-3 shadow-[0_24px_70px_rgba(0,0,0,0.6)] backdrop-blur-md w-full max-w-[330px] sm:max-w-[360px]">
            <div className="relative aspect-[4/5] min-h-[440px] sm:min-h-[480px] overflow-hidden rounded-[18px]">
              <Image
                src={STUDIO_PORTRAIT_IMAGE}
                alt="Modelos NENEZ en estudio"
                fill
                sizes="(max-width: 768px) 100vw, 360px"
                className="object-cover object-[68%_36%] transition-transform duration-700 hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

              <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/60 px-2 py-1 text-[7px] font-black uppercase tracking-[0.2em] text-zinc-300 backdrop-blur-md">
                Obsession 01
              </div>

              <div className="absolute bottom-3 left-3">
                <p className="text-[7px] font-black uppercase tracking-[0.2em] text-zinc-400">Made by studios</p>
                <p className="text-xs font-black uppercase text-white mt-0.5 tracking-tight">Ready to wear</p>
              </div>
            </div>
          </div>

          {/* Right Box: Editorial Text block - Made more compact */}
          <div className="hidden max-w-[240px] w-full rounded-2xl border border-white/10 bg-black/60 p-4 text-right backdrop-blur-md lg:block">
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500">
              Obsession 01
            </p>
            <p className="mt-2 text-lg font-black uppercase leading-[1.0] tracking-tight text-white">
              Studio rack
              <span className="block text-zinc-500 font-black text-[8px] uppercase tracking-[0.22em] mt-1.5">ready to wear</span>
            </p>
          </div>
        </div>

        {/* Centered button at the very bottom of the card spanning columns */}
        <div className="col-span-1 lg:col-span-2 flex justify-center mt-1 w-full relative z-20">
          <a
            href="https://wa.me/593988831372"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-8 text-[10px] font-black uppercase tracking-[0.25em] text-black transition-all hover:bg-zinc-200 active:scale-[0.98] select-none cursor-pointer"
          >
            Pedir por WhatsApp
          </a>
        </div>

      </div>
    </section>
  );
}
