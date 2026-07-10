/**
 * Autor: Brandon Medina
 * Fecha: 2026
 * Descripción: Intro premium fluida, sin cuadros estáticos. Efecto cristal holográfico.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "@/frontend/animations/gsapSetup";

function forceScrollTop() {
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

export default function IntroCinematic() {
  const scope = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    window.history.scrollRestoration = "manual";
    forceScrollTop();
  }, []);

  useGSAP(
    () => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduceMotion) {
        gsap.set(scope.current, { autoAlpha: 0 });
        setHidden(true);
        forceScrollTop();
        return;
      }

      // Animación fluida desde el instante 0
      const tl = gsap.timeline({
        onComplete: () => {
          forceScrollTop();
          setHidden(true);
        },
      });

      // Animación del orbe de luz (respiración y expansión sutil)
      gsap.fromTo(
        orbRef.current,
        { scale: 0.8, opacity: 0 },
        { scale: 1.2, opacity: 0.3, duration: 3, ease: "power2.out" }
      );

      // Texto: Entra suavemente con fade y blur ligero, sin zoom agresivo
      tl.fromTo(
        textRef.current,
        {
          scale: 0.95,
          opacity: 0,
          filter: "blur(15px)",
        },
        {
          scale: 1,
          opacity: 1,
          filter: "blur(0px)",
          duration: 2.5,
          ease: "power2.out"
        }
      )
        .fromTo(
          ".intro-subtitle",
          { opacity: 0, y: 10, letterSpacing: "0.2em" },
          { opacity: 1, y: 0, letterSpacing: "0.5em", duration: 1.5, ease: "power3.out" },
          "-=1.5"
        )
        // Efecto salida suave
        .to(scope.current, {
          opacity: 0,
          scale: 1.05,
          filter: "blur(10px)",
          duration: 1.0,
          ease: "power2.inOut"
        }, 3.5);

      // Efecto parallax muy sutil en el orbe
      const handleMouseMove = (e: MouseEvent) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 20;
        const y = (e.clientY / window.innerHeight - 0.5) * 20;
        gsap.to(orbRef.current, { x, y, duration: 1.5, ease: "power2.out" });
        gsap.to(textRef.current, { x: x * 0.2, y: y * 0.2, duration: 1.5, ease: "power2.out" });
      };

      window.addEventListener("mousemove", handleMouseMove);
      return () => window.removeEventListener("mousemove", handleMouseMove);
    },
    { scope }
  );

  if (!mounted || hidden) return null;

  return (
    <div
      ref={scope}
      className="pointer-events-auto fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#000000] overflow-hidden"
      style={{ perspective: "1000px" }}
      suppressHydrationWarning
    >
      {/* Orbe de luz roja cinematográfica de fondo */}
      <div
        ref={orbRef}
        className="absolute top-1/2 left-1/2 h-[40vh] w-[40vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600 blur-[100px] md:h-[60vh] md:w-[60vh] md:blur-[140px]"
      />

      {/* Contenedor Principal */}
      <div className="relative z-10 flex flex-col items-center justify-center transform-style-3d">
        <h1
          ref={textRef}
          className="text-[5rem] sm:text-[10rem] font-black uppercase tracking-[0.05em]"
          style={{
            // Cristal holográfico y metálico muy limpio (sin hacks de 15 capas)
            background: "linear-gradient(135deg, #ffffff 0%, #a3a3a3 40%, #555555 50%, #d4d4d4 60%, #ffffff 100%)",
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0px 10px 30px rgba(0,0,0,0.8)) drop-shadow(0px 0px 20px rgba(255,0,24,0.3))",
            transformStyle: "preserve-3d",
            willChange: "transform, opacity, filter" // Previene cuadros estáticos iniciales
          }}
        >
          NOW
        </h1>

        <p className="intro-subtitle mt-4 text-[9px] font-bold uppercase text-zinc-400 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
          Welcome
        </p>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes shine {
          to { background-position: 200% center; }
        }
        h1 { animation: shine 4s linear infinite; }
      `}} />
    </div>
  );
}
