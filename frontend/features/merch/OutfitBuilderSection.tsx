"use client";

import Image from "next/image";

const STUDIO_HERO_IMAGE = "/images/dawgs-studio-couch.png";
const STUDIO_PORTRAIT_IMAGE = "/images/dawgs-studio-portrait.png";
const STUDIO_FIT_IMAGE = "/images/dawgs-studio-fit-front.png";

export default function OutfitBuilderSection() {
  return (
    <section
      id="wear"
      className="hero-reveal relative z-20 -mx-4 mt-8 overflow-hidden bg-[#050404] text-white sm:-mx-8 md:-mx-14 lg:-mx-20"
    >
      <div className="relative min-h-[760px] overflow-hidden">
        <Image
          src={STUDIO_HERO_IMAGE}
          alt="Modelos DAWGS usando hoodie y jogger burgundy en sofa de estudio"
          fill
          sizes="100vw"
          className="object-cover object-center opacity-[0.96]"
          priority={false}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.74)_0%,rgba(0,0,0,0.3)_44%,rgba(0,0,0,0.58)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.35)_0%,transparent_44%,rgba(0,0,0,0.88)_100%)]" />
        <div className="absolute inset-0 opacity-[0.09] [background-image:linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:100%_5px]" />

        <div className="relative z-10 mx-auto flex min-h-[760px] w-full max-w-[1500px] flex-col justify-between px-4 pb-7 pt-24 sm:px-6 sm:pb-9 sm:pt-28 md:px-12 lg:px-16">
          <div className="flex items-center justify-between gap-4 text-[10px] font-black uppercase tracking-[0.18em] text-white/[0.72]">
            <span>DAWGS Studio</span>
            <span className="rounded-full border border-white/[0.14] bg-white/[0.08] px-3 py-1.5 backdrop-blur-md">
              Drop activo
            </span>
          </div>

          <div className="grid items-end gap-8 lg:grid-cols-[420px_minmax(0,1fr)]">
            <div className="max-w-[420px]">
              <div className="relative overflow-hidden rounded-[8px] border border-white/[0.12] bg-black shadow-[0_28px_90px_rgba(0,0,0,0.62)]">
                <div className="relative aspect-[4/5] min-h-[560px] overflow-hidden bg-[#070606]">
                  <Image
                    src={STUDIO_PORTRAIT_IMAGE}
                    alt="Modelos DAWGS en hoodie burgundy editorial"
                    fill
                    sizes="(max-width: 768px) 100vw, 420px"
                    className="object-cover object-[68%_42%]"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_0%,transparent_45%,rgba(0,0,0,0.82)_100%)]" />
                  <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.65)_1px,transparent_1px)] [background-size:100%_6px]" />
                  <div className="absolute left-4 top-4 rounded-full border border-white/[0.13] bg-black/48 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-white/[0.72] backdrop-blur-md">
                    Made by studios
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-100/[0.7]">
                      Burgundy mood
                    </p>
                    <h3 className="mt-2 max-w-xs text-3xl font-black uppercase leading-[0.92] text-white">
                      No es outfit.
                      <span className="block text-[#ffd8df]">
                        Es presencia.
                      </span>
                    </h3>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {["Drop privado", "Sin uniforme", "Movimiento"].map(
                  (label) => (
                    <span
                      key={label}
                      className="rounded-full border border-white/[0.1] bg-black/42 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white/[0.58] backdrop-blur-md"
                    >
                      {label}
                    </span>
                  )
                )}
              </div>
            </div>
            <div className="hidden max-w-sm justify-self-end rounded-[8px] border border-white/[0.1] bg-black/42 p-5 text-right backdrop-blur-md lg:block">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-100/[0.62]">
                Obsession 01
              </p>
              <p className="mt-3 text-3xl font-black uppercase leading-[0.92]">
                Studio rack
                <span className="block text-[#ffd8df]">ready to wear</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-[9px] font-black uppercase tracking-[0.18em] text-white/[0.42]">
            <span>DAWGS Studio / private drop</span>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 w-full max-w-[1500px] overflow-hidden rounded-[8px] border border-white/[0.1] bg-black/62 px-4 shadow-[0_28px_90px_rgba(0,0,0,0.5)] backdrop-blur-md sm:px-6 md:px-12 lg:px-16">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_430px]">
          <div className="relative flex h-[620px] items-center justify-center overflow-hidden bg-[#090706] sm:h-[760px] lg:h-[820px]">
            <Image
              src={STUDIO_FIT_IMAGE}
              alt="Modelo usando el set DAWGS burgundy como cierre de la experiencia"
              width={1122}
              height={1402}
              sizes="(max-width: 1024px) 92vw, 780px"
              className="relative z-10 h-full w-auto max-w-full object-contain"
            />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.18)_0%,transparent_24%,transparent_76%,rgba(0,0,0,0.18)_100%)]" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.75)_1px,transparent_1px)] [background-size:100%_6px]" />
          </div>
          <div className="flex flex-col justify-between border-t border-white/[0.08] p-5 sm:p-7 lg:border-l lg:border-t-0">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-100/[0.62]">
                Experiencia DAWGS
              </p>
              <h4 className="mt-4 text-4xl font-black uppercase leading-[0.92] text-white sm:text-5xl">
                No es solo
                <span className="block text-[#ffd8df]">ponerte ropa.</span>
              </h4>
              <p className="mt-5 text-sm font-semibold leading-6 text-white/[0.58]">
                Es entrar al mood: hoodie pesado, jogger amplio y presencia
                limpia para moverte como si el drop ya fuera tuyo.
              </p>
            </div>
            <div className="mt-8">
              <div className="flex flex-wrap gap-2">
                {["Corte ancho", "Burgundy wash", "Studio uniform"].map(
                  (label) => (
                    <span
                      key={label}
                      className="rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white/[0.58]"
                    >
                      {label}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
