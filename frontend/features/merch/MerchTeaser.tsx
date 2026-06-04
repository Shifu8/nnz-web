"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ShoppingBag, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { gsap, useGSAP } from "@/frontend/animations/gsapSetup";

const WHATSAPP_NUMBER = "593988831372";

const FEATURED_MERCH = [
  {
    id: "signature-hoodie",
    name: "Signature Hoodie",
    image: "/images/kristina_merch.png",
  },
  {
    id: "classic-tracksuit",
    name: "Classic Tracksuit",
    image: "/images/ariana_merch.png",
  },
  {
    id: "heavyweight-hoodie",
    name: "Heavyweight Hoodie",
    image: "/images/johanel_merch.png",
  },
];

export default function MerchTeaser() {
  const scope = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const item = FEATURED_MERCH[active];

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActive((current) => (current + 1) % FEATURED_MERCH.length);
    }, 4200);

    return () => window.clearInterval(interval);
  }, []);

  useGSAP(
    () => {
      if (!cardRef.current) return;

      const mm = gsap.matchMedia();
      mm.add(
        {
          reduceMotion: "(prefers-reduced-motion: reduce)",
          allowMotion: "(prefers-reduced-motion: no-preference)",
        },
        (context) => {
          const { reduceMotion } = context.conditions as {
            reduceMotion: boolean;
            allowMotion: boolean;
          };

          if (reduceMotion) {
            gsap.set(cardRef.current, { autoAlpha: 1, x: 0, y: 0 });
            return;
          }

          gsap.set(cardRef.current, { autoAlpha: 0, x: -80, y: 18, rotation: -3 });
          gsap
            .timeline({ delay: 3.2 })
            .to(cardRef.current, {
              autoAlpha: 1,
              x: 0,
              y: 0,
              rotation: 0,
              duration: 0.9,
              ease: "back.out(1.4)",
            })
            .to(".merch-teaser-dot", {
              scale: 1.8,
              autoAlpha: 0,
              repeat: -1,
              duration: 1.4,
              ease: "power2.out",
            });
        },
        scope.current ?? undefined,
      );

      return () => mm.revert();
    },
    { scope },
  );

  if (!isVisible) return null;

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hola DAWGS, quiero comprar ${item.name}.`,
  )}`;

  return (
    <aside
      ref={scope}
      aria-label="DAWGS merch"
      className="pointer-events-none fixed bottom-4 left-4 z-[70] hidden lg:block"
    >
      <div
        ref={cardRef}
        className="pointer-events-auto relative flex w-[268px] gap-2.5 overflow-hidden rounded-[20px] border border-white/15 bg-black/78 p-2 shadow-[0_20px_70px_rgba(0,0,0,0.72),0_0_45px_rgba(255,0,72,0.14)] backdrop-blur-2xl"
      >
        <button
          type="button"
          aria-label="Cerrar anuncio de merch"
          onClick={() => setIsVisible(false)}
          className="absolute right-2 top-2 z-30 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-black/60 text-zinc-400 transition hover:border-white/25 hover:text-white"
        >
          <X className="h-3 w-3" />
        </button>

        <div className="relative h-[106px] w-[82px] shrink-0 overflow-hidden rounded-[15px] border border-white/10 bg-zinc-950">
          <AnimatePresence mode="wait">
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 1.08 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="absolute inset-0"
            >
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="82px"
                className="object-cover object-[50%_22%]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-black/20" />
            </motion.div>
          </AnimatePresence>

          <div className="absolute left-2 top-2 z-20 inline-flex items-center gap-1 rounded-full border border-pink-400/25 bg-black/55 px-1.5 py-1 text-[5px] font-black uppercase tracking-[0.16em] text-pink-200 backdrop-blur-xl">
            <span className="relative flex h-1.5 w-1.5">
              <span className="merch-teaser-dot absolute inset-0 rounded-full bg-pink-400" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-pink-400" />
            </span>
            Wear
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between py-1 pr-1">
          <div>
            <p className="inline-flex items-center gap-1 text-[6px] font-black uppercase tracking-[0.2em] text-pink-300">
              <Sparkles className="h-3 w-3 text-pink-400" /> Modelos DAWGS
            </p>
            <p className="mt-2 pr-5 text-sm font-black leading-[0.95] text-white">{item.name}</p>
            <p className="mt-1 text-[7px] text-zinc-500">Drop privado por WhatsApp.</p>
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 w-fit shrink-0 items-center gap-1.5 rounded-lg bg-white px-2.5 text-[7px] font-black uppercase tracking-[0.14em] text-black transition hover:bg-pink-200"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            Comprar
            <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
      </div>
    </aside>
  );
}
