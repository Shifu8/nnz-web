/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * DescripciÃ³n: Tarjeta premium de evento con countdown, poster, glow y lineup.
 */

"use client";

import Image from "next/image";
import { useRef } from "react";
import { ChevronRight, MapPin } from "lucide-react";
import { gsap, useGSAP } from "@/frontend/animations/gsapSetup";
import { useCountdown } from "@/frontend/hooks/useCountdown";
import type { Event } from "@/frontend/types/domain";

type EventCardProps = {
  event: Event;
  onArtistClick: (artistName: string) => void;
};

export default function EventCard({ event, onArtistClick }: EventCardProps) {
  const scope = useRef<HTMLElement>(null);
  const countdown = useCountdown(event.startsAt);

  useGSAP(
    () => {
      gsap.from(".event-reveal", {
        autoAlpha: 0,
        y: 42,
        stagger: 0.09,
        scrollTrigger: {
          trigger: scope.current,
          start: "top 84%",
          toggleActions: "play none none reverse",
        },
      });

      gsap.to(".poster-parallax", {
        yPercent: -8,
        scale: 1.07,
        scrollTrigger: {
          trigger: scope.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.8,
        },
      });
    },
    { scope }
  );

  return (
    <article ref={scope} className="group relative h-[72vh] min-h-[560px] w-[82vw] max-w-[430px] shrink-0 snap-center overflow-hidden rounded-[34px] border border-white/12 bg-white/[0.06] shadow-[0_30px_90px_rgba(0,0,0,.6)] backdrop-blur-2xl md:h-[680px] md:w-[390px]">
      <Image src={event.poster} alt={event.title} fill priority={event.id === "trap-loud"} sizes="(max-width: 768px) 82vw, 390px" className="poster-parallax object-cover" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.18),rgba(0,0,0,.15)_36%,rgba(0,0,0,.94))]" />
      <div className="absolute inset-0 scanlines opacity-25" />
      <div className="dawgs-lightning absolute left-[-35%] top-[25%] h-px w-[160%] rotate-[-13deg] bg-gradient-to-r from-transparent via-red-500 to-transparent blur-[2px]" />
      <div className="dawgs-smoke absolute bottom-10 left-8 h-52 w-72 rounded-full bg-red-600/20 blur-3xl" />

      <div className="relative z-10 flex h-full flex-col p-5">
        <div className="event-reveal flex items-center justify-between">
          <span className="rounded-full border border-red-400/25 bg-black/35 px-3 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-red-200 backdrop-blur-xl">{event.dateLabel}</span>
          <span className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-xl"><MapPin className="h-3 w-3" />{event.city}</span>
        </div>

        <div className="mt-auto">
          <p className="event-reveal text-[10px] font-black uppercase tracking-[0.48em] text-red-300">{event.subtitle}</p>
          <h2 className="event-reveal mt-2 text-5xl font-black leading-[0.9] tracking-tight text-white drop-shadow-[0_0_30px_rgba(255,0,24,.65)]">{event.title}</h2>
          <p className="event-reveal mt-3 max-w-xs text-sm leading-6 text-zinc-200">{event.description}</p>

          <div className="event-reveal mt-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {event.lineup.map((artist) => (
              <button key={artist} onClick={() => onArtistClick(artist)} className="shrink-0 rounded-full border border-white/12 bg-black/45 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white backdrop-blur-xl transition hover:border-red-400/60 hover:bg-red-500/20">
                {artist}
              </button>
            ))}
          </div>

          <div className="event-reveal mt-5 grid grid-cols-4 gap-2">
            {Object.entries(countdown).filter(([key]) => key !== "expired").map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-black/45 p-2 text-center backdrop-blur-xl">
                <strong className="block text-xl font-black text-white">{value as string}</strong>
                <span className="text-[8px] uppercase tracking-[0.18em] text-zinc-400">{label.slice(0, 3)}</span>
              </div>
            ))}
          </div>

          <a href="#claim" className="event-reveal mt-4 flex h-[52px] items-center justify-between rounded-2xl bg-white px-5 text-xs font-black uppercase tracking-[0.22em] text-black transition group-hover:shadow-[0_0_38px_rgba(255,0,24,.45)]">
            claim access <ChevronRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </article>
  );
}
