/**
 * Autor: Brandon Medina
 * Fecha: 2026
 * Descripción: Shell mobile-first ultra compacto, sin scroll largo, mostrando sólo lo esencial.
 */

"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Flame, Gem, Radio, Ticket, Gift, X } from "lucide-react";
import { events } from "@/frontend/services/dawgsData";
import AccessDrop from "@/frontend/features/access-drop/AccessDrop";
import LiveGiveaway from "@/frontend/features/giveaway/LiveGiveaway";

const tags = [
  { label: "trap latino", Icon: Flame },
  { label: "luxury dark", Icon: Gem },
  { label: "live signal", Icon: Radio },
  { label: "party pass", Icon: Ticket },
];

export default function MobileFirstShell() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeModal, setActiveModal] = useState<"access" | "giveaway" | null>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const slide = Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth);
    setCurrentSlide(slide);
  };

  // Countdown timer para el evento
  const [timeLeft, setTimeLeft] = useState({
    days: 30,
    hours: 23,
    minutes: 29,
    seconds: 37,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { days, hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) {
          seconds = 59;
          minutes--;
        }
        if (minutes < 0) {
          minutes = 59;
          hours--;
        }
        if (hours < 0) {
          hours = 23;
          days--;
        }
        return { days, hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative z-20 flex min-h-[100svh] flex-col justify-between px-4 pb-24 pt-20 md:hidden">
      
      {/* Hero Section */}
      <div className="flex-none">
        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-red-300 drop-shadow-[0_0_10px_red]">
          underground access
        </p>
        <h1 className="mt-2 text-[3.5rem] font-black leading-[0.85] tracking-[-0.03em] text-white drop-shadow-[0_0_30px_rgba(255,0,24,0.5)]">
          DAWGS
        </h1>
        <p className="mt-3 text-[11px] leading-5 text-zinc-300">
          La nueva ola del trap. Sonido crudo, visuales inmersivos y acceso reservado a la comunidad.
        </p>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {tags.map(({ label, Icon }) => (
            <span
              key={label}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/12 bg-white/5 px-2.5 py-1.5 text-[8px] font-black uppercase tracking-[0.18em] text-zinc-100 backdrop-blur-xl"
            >
              <Icon className="h-3 w-3 text-red-400" />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Slider de Eventos Compacto */}
      <div className="relative mt-4 flex-1 flex flex-col min-h-[360px]">
        <div 
          className="flex flex-1 overflow-x-auto snap-x snap-mandatory no-scrollbar"
          onScroll={handleScroll}
        >
          {events.map((event, index) => {
            const isFirst = index === 0;
            // Para el primer evento usamos la imagen local editada, para los demas el poster del objeto
            const imageSrc = isFirst ? "/images/trap_loud_trio_artists.png?v=2" : event.poster;

            return (
              <div key={event.id} className="w-full shrink-0 snap-center px-1 flex flex-col justify-end pb-2">
                <div className="relative flex-1 flex flex-col justify-end overflow-hidden rounded-[24px] border border-red-500/30 bg-black/50 shadow-[0_0_50px_rgba(255,0,24,.2)] backdrop-blur-md">
                  
                  {/* Luces sutiles en la base del card, sin animaciones glitch a los lados */}
                  <div className="absolute inset-0 z-0 bg-black" />
                  <div className="absolute bottom-0 left-1/2 h-[80%] w-[120%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_bottom,rgba(255,0,24,0.15),transparent_60%)] mix-blend-screen animate-pulse [animation-duration:6s] z-0" />

                  <img
                    src={imageSrc}
                    alt={event.title}
                    className="absolute inset-0 h-full w-full object-cover object-top opacity-95 mix-blend-luminosity brightness-80 z-10 scale-[1.15]"
                  />
                  <div className="absolute inset-0 z-10 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,.6)_40%,#000)]" />
                  <div className="absolute inset-0 z-10 bg-red-900/10 mix-blend-color" />
                  
                  <div className="relative z-10 p-5">
                    {isFirst && (
                      <p className="inline-block rounded bg-red-600 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.2em] text-white shadow-[0_0_10px_red] mb-1">
                        próximo
                      </p>
                    )}
                    <h2 className="mt-1 text-3xl font-black leading-none text-white drop-shadow-[0_0_15px_red]">
                      {event.title}
                    </h2>
                    <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-300">
                      {event.dateLabel} - {event.city}
                    </p>
                    <p className="mt-2 text-[10px] leading-4 text-zinc-400 line-clamp-2">
                      {event.description}
                    </p>
                    
                    <div className="mt-3 flex gap-1.5 flex-wrap">
                      {event.lineup.map(artist => (
                        <span key={artist} className="rounded border border-red-500/20 bg-black/60 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-red-100">
                          {artist}
                        </span>
                      ))}
                    </div>

                    {isFirst && (
                      <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                        {Object.entries(timeLeft).map(([unit, value]) => (
                          <div key={unit} className="flex flex-col rounded-lg border border-white/10 bg-black/40 p-1.5">
                            <span className="text-sm font-black text-white">{value.toString().padStart(2, "0")}</span>
                            <span className="text-[7px] font-bold uppercase tracking-widest text-red-400">{unit.slice(0, 3)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex gap-2 w-full">
                      <button 
                        disabled={!isFirst}
                        onClick={() => isFirst && setActiveModal("access")}
                        className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[9px] font-black uppercase tracking-widest transition ${isFirst ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(255,0,24,0.4)] hover:bg-red-500' : 'bg-white/5 text-zinc-500 cursor-not-allowed'}`}
                      >
                        <Ticket className="h-3.5 w-3.5" /> Access
                      </button>
                      <button 
                        disabled={!isFirst}
                        onClick={() => isFirst && setActiveModal("giveaway")}
                        className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[9px] font-black uppercase tracking-widest transition ${isFirst ? 'bg-red-950/80 border border-red-500/30 text-red-100 hover:bg-red-900' : 'bg-white/5 text-zinc-500 cursor-not-allowed'}`}
                      >
                        <Gift className="h-3.5 w-3.5" /> Giveaway
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Puntos de Paginación */}
        <div className="mt-2 flex justify-center gap-2">
          {events.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSlide ? 'bg-red-500 w-4 shadow-[0_0_5px_red]' : 'bg-white/20 w-1.5'}`} 
            />
          ))}
        </div>
      </div>

      {/* Modales de Interacción */}
      {activeModal === "access" && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/90 pb-28 pt-14 backdrop-blur-xl">
          <button
            onClick={() => setActiveModal(null)}
            className="fixed right-4 top-4 z-[110] flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/80 text-white"
          >
            <X className="h-5 w-5" />
          </button>
          <AccessDrop />
        </div>
      )}

      {activeModal === "giveaway" && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/90 pb-28 pt-14 backdrop-blur-xl">
          <button
            onClick={() => setActiveModal(null)}
            className="fixed right-4 top-4 z-[110] flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/80 text-white"
          >
            <X className="h-5 w-5" />
          </button>
          <LiveGiveaway />
        </div>
      )}
    </section>
  );
}
