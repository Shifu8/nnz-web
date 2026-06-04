/**
 * Autor: Brandon Medina
 * Fecha: 18/05/2026
 * Descripcion: Bubble flotante expandible para access y giveaway con animacion GSAP elastic y blur.
 */

"use client";

import { useRef, useState } from "react";
import { Sparkles, Ticket, X } from "lucide-react";
import { gsap, useGSAP } from "@/frontend/animations/gsapSetup";

type FloatingBubbleProps = {
  onAccessClick?: () => void;
  passCount?: number;
};

export default function FloatingBubble({ onAccessClick, passCount = 100 }: FloatingBubbleProps) {
  const scope = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useGSAP(
    () => {
      gsap.set(".bubble-backdrop", { autoAlpha: 0 });
      gsap.set(".bubble-panel", { autoAlpha: 0, scale: 0.7, y: 28, transformOrigin: "bottom right" });
    },
    { scope }
  );

  useGSAP(
    () => {
      if (open) {
        gsap.to(".bubble-backdrop", { autoAlpha: 1, duration: 0.25, ease: "power1.out" });
        gsap.to(".bubble-panel", {
          autoAlpha: 1,
          scale: 1,
          y: 0,
          duration: 0.62,
          ease: "elastic.out(1, 0.58)",
        });
        gsap.to(".bubble-trigger", { rotate: 45, duration: 0.3, ease: "power2.out" });
      } else {
        gsap.to(".bubble-backdrop", { autoAlpha: 0, duration: 0.2, ease: "power1.inOut" });
        gsap.to(".bubble-panel", { autoAlpha: 0, scale: 0.7, y: 24, duration: 0.24, ease: "power2.in" });
        gsap.to(".bubble-trigger", { rotate: 0, duration: 0.26, ease: "power2.out" });
      }
    },
    { scope, dependencies: [open], revertOnUpdate: true }
  );

  return (
    <div ref={scope} className="pointer-events-none fixed inset-0 z-[80] md:hidden">
      <button
        onClick={() => setOpen(false)}
        className="bubble-backdrop pointer-events-auto absolute inset-0 bg-black/35 backdrop-blur-[2px]"
        aria-label="Cerrar panel rapido"
      />

      <div className="absolute bottom-24 right-4 flex items-end gap-3">
        <div className="bubble-panel pointer-events-auto w-[86vw] max-w-[320px] rounded-3xl border border-red-500/35 bg-black/65 p-4 shadow-[0_0_55px_rgba(255,0,24,.35)] backdrop-blur-2xl">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-300">ACCESS DROP LIVE</p>
          <p className="mt-2 text-2xl font-black text-white">{passCount} pases disponibles</p>

          <button
            onClick={() => {
              onAccessClick?.();
              setOpen(false);
            }}
            className="mt-4 flex h-12 w-full items-center justify-between rounded-2xl bg-red-600 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-[0_0_35px_rgba(255,0,24,.5)]"
          >
            Canjear pase ahora <Ticket className="h-4 w-4" />
          </button>

        </div>

        <button
          onClick={() => setOpen((value) => !value)}
          className="bubble-trigger pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full border border-red-400/60 bg-black/70 text-red-200 shadow-[0_0_25px_rgba(255,0,24,.65)]"
          aria-label="Abrir acciones rapidas"
        >
          {open ? <X className="h-6 w-6" /> : <Sparkles className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
