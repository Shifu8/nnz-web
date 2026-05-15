/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * DescripciÃ³n: Homepage mobile-first premium para DAWGS.
 */

"use client";

import { useRef } from "react";
import { Calendar, ChevronDown, Flame, Gem, Radio } from "lucide-react";
import Atmosphere from "@/frontend/components/Atmosphere";
import IntroCinematic from "@/frontend/components/IntroCinematic";
import MobileDock from "@/frontend/components/MobileDock";
import EventCarousel from "@/frontend/features/events/EventCarousel";
import RewardClaim from "@/frontend/features/rewards/RewardClaim";
import { gsap, useGSAP } from "@/frontend/animations/gsapSetup";

export default function HomePage() {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.from(".cinematic-reveal", {
        autoAlpha: 0,
        y: 28,
        stagger: 0.08,
        delay: 2.45,
      });

      gsap.to(".hero-orbit", {
        y: -24,
        rotation: 3,
        repeat: -1,
        yoyo: true,
        duration: 3.8,
        ease: "sine.inOut",
      });
    },
    { scope }
  );

  return (
    <main ref={scope} className="relative min-h-screen overflow-hidden bg-black pb-24 text-white md:pb-0">
      <Atmosphere />
      <IntroCinematic />
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/30 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <a href="#home" className="text-sm font-black tracking-[0.38em] text-white">DAWGS</a>
          <nav className="hidden items-center gap-7 md:flex">
            {["events", "merch", "claim", "access"].map((item) => (
              <a key={item} href={`#${item}`} className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-400 transition hover:text-white">{item}</a>
            ))}
          </nav>
        </div>
      </header>

      <section id="home" className="relative z-10 mx-auto flex min-h-[92svh] max-w-6xl flex-col justify-end px-4 pb-10 pt-28 md:min-h-screen md:justify-center">
        <div className="grid gap-8 md:grid-cols-[1fr_0.82fr] md:items-center">
          <div>
            <p className="cinematic-reveal text-[10px] font-black uppercase tracking-[0.54em] text-red-300">underground access</p>
            <h1 className="cinematic-reveal mt-3 max-w-3xl text-[4.35rem] font-black leading-[0.82] tracking-[-0.02em] text-white drop-shadow-[0_0_44px_rgba(255,0,24,.55)] sm:text-8xl md:text-9xl">DAWGS</h1>
            <p className="cinematic-reveal mt-5 max-w-md text-sm leading-7 text-zinc-300">Eventos compactos, merch de campaÃ±a y rewards sin login para entrar al siguiente ritual.</p>
            <div className="cinematic-reveal mt-7 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {[
                { Icon: Flame, label: "trap latino" },
                { Icon: Gem, label: "luxury dark" },
                { Icon: Radio, label: "live signal" },
                { Icon: Calendar, label: "party pass" },
              ].map(({ Icon, label }) => (
                <span key={label} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-100 backdrop-blur-xl">
                  <Icon className="h-4 w-4 text-red-300" />{label}
                </span>
              ))}
            </div>
          </div>
          <div className="cinematic-reveal hero-orbit relative hidden h-[560px] overflow-hidden rounded-[42px] border border-red-400/20 bg-white/[0.06] p-5 shadow-[0_0_90px_rgba(255,0,24,.24)] backdrop-blur-2xl md:block">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=900&q=85')] bg-cover bg-center opacity-75" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
            <div className="relative z-10 flex h-full flex-col justify-end">
              <p className="text-[10px] font-black uppercase tracking-[0.42em] text-red-200">next event</p>
              <h2 className="mt-2 text-5xl font-black leading-none">TRAP LOUD</h2>
            </div>
          </div>
        </div>
        <a href="#events" className="cinematic-reveal mt-8 inline-flex w-fit items-center gap-2 text-[10px] font-black uppercase tracking-[0.34em] text-zinc-400">
          swipe experience <ChevronDown className="h-4 w-4 animate-bounce text-red-300" />
        </a>
      </section>

      <EventCarousel />
      <RewardClaim />

      <section id="access" className="relative z-10 mx-auto max-w-6xl px-4 pb-16 md:pb-24">
        <div className="rounded-[34px] border border-white/12 bg-white/[0.055] p-5 backdrop-blur-2xl md:p-8">
          <p className="text-[10px] font-black uppercase tracking-[0.46em] text-red-300">backend ready</p>
          <h2 className="mt-3 text-3xl font-black text-white md:text-5xl">Flujo escalable: cÃ³digos Ãºnicos, Firebase y verificaciÃ³n en puerta.</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-4">
            {["validar cÃ³digo", "reclamar reward", "generar pass", "verificar expiraciÃ³n"].map((step) => (
              <div key={step} className="rounded-3xl border border-white/10 bg-black/35 p-4 text-sm font-bold uppercase tracking-[0.14em] text-zinc-300">{step}</div>
            ))}
          </div>
        </div>
      </section>
      <MobileDock />
    </main>
  );
}
