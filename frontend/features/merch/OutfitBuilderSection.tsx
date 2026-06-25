"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ChevronRight, MousePointer2, ShoppingBag } from "lucide-react";

const STUDIO_HERO_IMAGE = "/images/dawgs-studio-couch.png";
const STUDIO_PORTRAIT_IMAGE = "/images/dawgs-studio-portrait.png";
const STUDIO_FIT_IMAGE = "/images/dawgs-studio-fit-front.png";
const STUDIO_SELECTOR_IMAGE = "/images/generated/dawgs-studio-rack-tv-v3.png";
const WHATSAPP_NUMBER = "593988831372";

const SIZES = ["XS", "S", "M", "L", "XL"];

const PRODUCTS = [
  {
    id: "hoodie",
    code: "01",
    name: "Hoodie",
    type: "Panel hoodie",
    price: 65,
    detail: "Burgundy fleece con paneles rose y bordado blanco en el hood.",
    position: "left-[40%] top-[43%]",
    highlightMasks: ["dawgs-highlight-hoodie"],
  },
  {
    id: "jogger",
    code: "02",
    name: "Jogger",
    type: "Wide sweatpant",
    price: 58,
    detail: "Burgundy solido, sin cordones, bordado blanco en pierna.",
    position: "left-[61%] top-[43%]",
    highlightMasks: ["dawgs-highlight-jogger"],
  },
  {
    id: "complete-set",
    code: "03",
    name: "Set completo",
    type: "Set completo",
    price: 110,
    detail: "Hoodie + wide sweatpant para el fit completo de estudio.",
    position: "left-[52%] top-[70%]",
    highlightMasks: ["dawgs-highlight-hoodie", "dawgs-highlight-jogger"],
  },
];

type Product = (typeof PRODUCTS)[number];

function productMessage(product: Product, size: string) {
  return encodeURIComponent(
    `Hola DAWGS, quiero comprar ${product.name} talla ${size}.`
  );
}

export default function OutfitBuilderSection() {
  const [selectedId, setSelectedId] = useState(PRODUCTS[0].id);
  const [size, setSize] = useState("M");

  const selected = useMemo(
    () => PRODUCTS.find((product) => product.id === selectedId) ?? PRODUCTS[0],
    [selectedId]
  );

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${productMessage(
    selected,
    size
  )}`;

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
            <span>Selecciona abajo</span>
          </div>
        </div>
      </div>

      <div
        id="studio-rack"
        className="relative z-10 mx-auto w-full max-w-[1500px] scroll-mt-24 px-4 py-10 sm:px-6 sm:py-12 md:px-12 lg:px-16"
      >
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,#050404_0%,#120409_48%,#050404_100%)]" />
        <div className="absolute inset-0 -z-10 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.65)_1px,transparent_1px)] [background-size:100%_6px]" />

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-100/[0.62]">
              Studio selector
            </p>
            <h3 className="mt-2 text-3xl font-black uppercase leading-none sm:text-5xl">
              Elige tu set
            </h3>
          </div>
          <p className="max-w-md text-sm font-semibold leading-6 text-white/[0.52]">
            Toca una prenda colgada, marca la talla y envia el pedido directo
            por WhatsApp.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.12fr)_390px]">
          <div className="relative min-h-[540px] overflow-hidden rounded-[8px] border border-white/[0.1] bg-black shadow-[0_28px_90px_rgba(0,0,0,0.45)]">
            <Image
              src={STUDIO_SELECTOR_IMAGE}
              alt="DAWGS Studio rack with selectable hanging clothing"
              fill
              sizes="(max-width: 1024px) 100vw, 980px"
              className="object-cover object-center brightness-[0.72] contrast-125 grayscale saturate-0"
            />
            {selected.highlightMasks.map((mask) => (
              <div key={mask} className={`absolute inset-0 ${mask}`}>
                <Image
                  src={STUDIO_SELECTOR_IMAGE}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 980px"
                  className="object-cover object-center brightness-[0.9] contrast-110 saturate-125"
                  aria-hidden="true"
                />
              </div>
            ))}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.1)_48%,rgba(0,0,0,0.72)_100%)]" />
            <div className="absolute inset-0 opacity-[0.1] [background-image:linear-gradient(rgba(255,255,255,0.65)_1px,transparent_1px)] [background-size:100%_5px]" />

            {PRODUCTS.map((product) => {
              const active = product.id === selected.id;

              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => setSelectedId(product.id)}
                  className={`absolute ${product.position} hidden -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] backdrop-blur-md transition sm:flex ${
                    active
                      ? "border-rose-200/65 bg-rose-500/[0.22] text-white shadow-[0_0_34px_rgba(255,140,170,0.38)]"
                      : "border-white/[0.13] bg-black/50 text-white/[0.62] hover:border-white/[0.28]"
                  }`}
                  aria-pressed={active}
                >
                  <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-white text-[10px] text-[#160509]">
                    {product.code}
                    {active ? (
                      <span className="absolute inset-0 rounded-full border border-white dawgs-select-ping" />
                    ) : null}
                  </span>
                  {product.name}
                </button>
              );
            })}

            <div className="absolute left-4 top-4 rounded-[8px] border border-white/[0.12] bg-black/48 px-3 py-2 backdrop-blur-md">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/[0.68]">
                <MousePointer2
                  className="h-4 w-4 text-[#ffd8df]"
                  aria-hidden="true"
                />
                Selecciona una prenda
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 sm:hidden">
              <div className="grid gap-2">
                {PRODUCTS.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => setSelectedId(product.id)}
                    className={`flex h-11 items-center justify-between rounded-[8px] border px-3 text-[10px] font-black uppercase ${
                      product.id === selected.id
                        ? "border-rose-200/55 bg-rose-500/[0.2] text-white"
                        : "border-white/[0.12] bg-black/46 text-white/[0.58]"
                    }`}
                  >
                    <span>{product.code}</span>
                    <span>{product.name}</span>
                    <span>${product.price}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <aside className="rounded-[8px] border border-white/[0.1] bg-black/58 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.45)] backdrop-blur-md">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-100/[0.58]">
              Seleccionado
            </p>
            <div className="mt-2 flex items-start justify-between gap-4">
              <div>
                <h4 className="text-3xl font-black uppercase leading-none">
                  {selected.name}
                </h4>
                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/[0.44]">
                  {selected.type}
                </p>
              </div>
              <p className="text-3xl font-black text-[#ffd8df]">
                ${selected.price}
              </p>
            </div>
            <p className="mt-4 text-sm font-semibold leading-6 text-white/[0.62]">
              {selected.detail}
            </p>

            <div className="mt-6">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/[0.45]">
                Talla
              </p>
              <div className="grid grid-cols-5 gap-2">
                {SIZES.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSize(option)}
                    className={`h-10 rounded-[8px] border text-xs font-black transition ${
                      option === size
                        ? "border-rose-200/55 bg-rose-500/[0.2] text-white"
                        : "border-white/[0.12] bg-white/[0.04] text-white/[0.58] hover:border-white/[0.24]"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-[#ffd8df] text-xs font-black uppercase text-[#17050a] transition hover:bg-white"
            >
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              Comprar por WhatsApp
            </a>

            <a
              href="#wear"
              className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-[8px] border border-white/[0.1] bg-white/[0.04] text-[10px] font-black uppercase text-white/[0.58] transition hover:border-white/[0.22] hover:text-white"
            >
              Volver al studio
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </aside>
        </div>

        <div className="mt-8 overflow-hidden rounded-[8px] border border-white/[0.1] bg-black/62 shadow-[0_28px_90px_rgba(0,0,0,0.5)] backdrop-blur-md">
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

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-[#ffd8df] text-xs font-black uppercase text-[#17050a] transition hover:bg-white"
                >
                  <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                  Pedir {selected.name} talla {size}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .dawgs-select-ping {
          animation: dawgsSelectPing 1.25s ease-out infinite;
        }

        .dawgs-highlight-hoodie,
        .dawgs-highlight-jogger {
          pointer-events: none;
          transition: clip-path 0.32s ease, opacity 0.32s ease;
          filter: drop-shadow(0 0 28px rgba(255, 185, 198, 0.2));
        }

        .dawgs-highlight-hoodie {
          clip-path: polygon(39% 16%, 55% 16%, 59% 65%, 36% 65%);
        }

        .dawgs-highlight-jogger {
          clip-path: polygon(58% 14%, 74% 14%, 76% 86%, 56% 86%);
        }

        @keyframes dawgsSelectPing {
          0% {
            opacity: 0.7;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(2.5);
          }
        }
      `}</style>
    </section>
  );
}
