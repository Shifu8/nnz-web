/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * DescripciÃ³n: Intro cinematogrÃ¡fica con zoom 3D preparada para audio futuro.
 */

"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/frontend/animations/gsapSetup";

export default function IntroCinematic() {
  const scope = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(false);

  useGSAP(
    () => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduceMotion) {
        gsap.set(scope.current, { autoAlpha: 0 });
        setHidden(true);
        return;
      }

      const tl = gsap.timeline({
        defaults: { ease: "power4.inOut" },
        onComplete: () => setHidden(true),
      });

      tl.fromTo(".intro-camera", { scale: 1.35, rotationX: 12, z: -200 }, { scale: 1, rotationX: 0, z: 0, duration: 1.7 })
        .from(".intro-logo", { autoAlpha: 0, y: 34, scale: 0.88, duration: 0.8 }, 0.25)
        .to(".intro-logo", { textShadow: "0 0 48px rgba(255,0,24,.9)", duration: 0.4, repeat: 3, yoyo: true }, 0.6)
        .to(scope.current, { autoAlpha: 0, scale: 1.08, duration: 0.9 }, 2.35);
    },
    { scope }
  );

  if (hidden) return null;

  return (
    <div ref={scope} className="fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-black perspective-dramatic">
      <div className="intro-camera absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,0,24,.36),transparent_34%),linear-gradient(180deg,#030303,#120104)]" />
        <div className="dawgs-particles absolute inset-0 opacity-80" />
        <div className="dawgs-smoke absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600/15 blur-3xl" />
        <div className="scanlines absolute inset-0 opacity-35" />
      </div>
      <div className="relative z-10 text-center">
        <p className="mb-4 text-[10px] font-black uppercase tracking-[0.52em] text-red-300">access signal</p>
        <h1 className="intro-logo text-[4.5rem] font-black leading-none tracking-[0.18em] text-white sm:text-8xl">DAWGS</h1>
      </div>
    </div>
  );
}
