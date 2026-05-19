/**
 * Autor: Brandon Medina
 * Fecha: 2026
 * Descripción: Home principal simplificado. Mantiene desktop, y la shell mobile optimizada sin scroll largo.
 */

"use client";

import { useRef, useState } from "react";
import { Calendar, ChevronDown, Flame, Gem, Radio, Ticket, Gift, X } from "lucide-react";
import Atmosphere from "@/frontend/components/Atmosphere";
import IntroCinematic from "@/frontend/components/IntroCinematic";
import MobileFirstShell from "@/frontend/features/mobile/MobileFirstShell";
import EventCarousel from "@/frontend/features/events/EventCarousel";
import AccessDrop from "@/frontend/features/access-drop/AccessDrop";
import LiveGiveaway from "@/frontend/features/giveaway/LiveGiveaway";
import { events } from "@/frontend/services/dawgsData";
import StaffModal from "@/frontend/features/staff/StaffModal";
import FloatingWhatsAppBubble from "@/frontend/components/FloatingWhatsAppBubble";
import { gsap, useGSAP } from "@/frontend/animations/gsapSetup";

export default function HomePage() {
  const scope = useRef<HTMLElement>(null);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<"access" | "giveaway" | null>(null);
  const [currentSlideDesktop, setCurrentSlideDesktop] = useState(0);

  const handleDesktopScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const slide = Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth);
    setCurrentSlideDesktop(slide);
  };

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      setIsStaffModalOpen(true);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 3000); // 3 segundos para Staff Mode
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  useGSAP(
    () => {
      gsap.from(".cinematic-reveal", {
        autoAlpha: 0,
        y: 28,
        stagger: 0.08,
        delay: 2.45,
      });

      gsap.to(".hero-orbit", {
        y: -15,
        rotation: 2,
        repeat: -1,
        yoyo: true,
        duration: 4.0,
        ease: "sine.inOut",
      });
    },
    { scope }
  );

  return (
    <main ref={scope} className="relative min-h-screen overflow-hidden bg-black text-white">
      <Atmosphere />
      <IntroCinematic />

      {/* Header unificado */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <button
            onMouseDown={handleTouchStart}
            onMouseUp={handleTouchEnd}
            onMouseLeave={handleTouchEnd}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="text-sm font-black tracking-[0.38em] text-white uppercase outline-none select-none transition hover:text-red-400"
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            DAWGS
          </button>
          <nav className="hidden items-center gap-7 md:flex">
            {["events", "access", "giveaway"].map((item) => (
              <a
                key={item}
                href={`#${item}`}
                className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-400 transition hover:text-white"
              >
                {item}
              </a>
            ))}
          </nav>
        </div>
      </header>

      {/* Mobile First (Rediseño Compacto) */}
      <MobileFirstShell />

      {/* Desktop (Preservado) */}
      <section className="relative z-10 hidden md:block">
        <section
          id="home"
          className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 pb-10 pt-28"
        >
          <div className="grid gap-8 md:grid-cols-[1fr_0.82fr] md:items-center">
            <div>
              <p className="cinematic-reveal text-[10px] font-black uppercase tracking-[0.54em] text-red-300 drop-shadow-[0_0_10px_red]">
                underground access
              </p>
              <h1 className="cinematic-reveal mt-3 max-w-3xl text-[4.35rem] font-black leading-[0.82] tracking-[-0.02em] text-white drop-shadow-[0_0_44px_rgba(255,0,24,.55)] sm:text-8xl md:text-9xl">
                DAWGS
              </h1>
              <p className="cinematic-reveal mt-5 max-w-md text-sm leading-7 text-zinc-300">
                La nueva ola del trap. Sonido crudo, visuales inmersivos y acceso reservado a la comunidad.
              </p>
              <div className="cinematic-reveal mt-7 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { Icon: Flame, label: "trap latino" },
                  { Icon: Gem, label: "luxury dark" },
                  { Icon: Radio, label: "live signal" },
                  { Icon: Calendar, label: "party pass" },
                ].map(({ Icon, label }) => (
                  <span
                    key={label}
                    className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/12 bg-white/5 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-100 backdrop-blur-xl transition hover:border-red-500/50 hover:bg-white/10"
                  >
                    <Icon className="h-4 w-4 text-red-400" />
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative hidden md:flex flex-col h-[560px] w-full">
              <div 
                className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar h-full rounded-[42px] border border-red-400/20 shadow-[0_0_90px_rgba(255,0,24,.24)] backdrop-blur-2xl cinematic-reveal hero-orbit"
                onScroll={handleDesktopScroll}
              >
                {events.map((event, index) => {
                  const isFirst = index === 0;
                  const imageSrc = isFirst ? "/images/trap_loud_trio_artists.png?v=2" : event.poster;

                  return (
                    <div key={event.id} className="relative w-full shrink-0 snap-center overflow-hidden flex flex-col justify-end p-8 group">
                      {/* Fondo y Luces Animadas */}
                      <div className="absolute inset-0 bg-black z-0" />
                      <div className="absolute left-0 top-0 h-[150%] w-[60px] origin-top-left bg-gradient-to-b from-red-600/40 via-red-500/10 to-transparent blur-2xl mix-blend-screen animate-laser-left [animation-duration:12s] z-0" />
                      <div className="absolute right-0 top-0 h-[150%] w-[60px] origin-top-right bg-gradient-to-b from-red-600/40 via-red-500/10 to-transparent blur-2xl mix-blend-screen animate-laser-right [animation-duration:15s] z-0" />
                      <div className="absolute bottom-0 left-1/2 h-[80%] w-[120%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_bottom,rgba(255,0,24,0.15),transparent_60%)] mix-blend-screen animate-pulse [animation-duration:6s] z-0" />

                      <img 
                        src={imageSrc} 
                        alt={event.title} 
                        className="absolute inset-0 h-full w-full object-cover object-top opacity-85 mix-blend-luminosity brightness-90 transition-transform duration-1000 group-hover:scale-110 z-10" 
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,.7)_50%,#000)] z-10" />
                      
                      <div className="relative z-20 flex flex-col justify-end">
                        {isFirst && (
                          <p className="inline-block w-fit rounded bg-red-600 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-[0_0_15px_red] mb-2">
                            próximo evento
                          </p>
                        )}
                        <h2 className="mt-2 text-6xl font-black leading-none drop-shadow-[0_0_20px_rgba(255,0,24,0.6)] text-white">{event.title}</h2>
                        <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-zinc-300">
                          {event.dateLabel} - {event.city}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-zinc-400 line-clamp-2 max-w-md">
                          {event.description}
                        </p>

                        <div className="mt-8 flex gap-3 w-fit">
                          <button 
                            disabled={!isFirst}
                            onClick={() => isFirst && setActiveModal("access")}
                            className={`flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-xs font-black uppercase tracking-widest transition ${isFirst ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(255,0,24,0.4)] hover:bg-red-500' : 'bg-white/10 text-zinc-500 cursor-not-allowed'}`}
                          >
                            <Ticket className="h-4 w-4" /> Access
                          </button>
                          <button 
                            disabled={!isFirst}
                            onClick={() => isFirst && setActiveModal("giveaway")}
                            className={`flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-xs font-black uppercase tracking-widest transition ${isFirst ? 'border border-red-500/30 bg-red-950/80 text-red-100 hover:bg-red-900' : 'bg-white/5 text-zinc-500 cursor-not-allowed'}`}
                          >
                            <Gift className="h-4 w-4" /> Giveaway
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Paginación */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                {events.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSlideDesktop ? 'bg-red-500 w-8 shadow-[0_0_10px_red]' : 'bg-white/20 w-2'}`} 
                  />
                ))}
              </div>
            </div>
          </div>
          <a
            href="#events"
            className="cinematic-reveal mt-8 inline-flex w-fit items-center gap-2 text-[10px] font-black uppercase tracking-[0.34em] text-zinc-400 transition hover:text-white"
          >
            swipe experience <ChevronDown className="h-4 w-4 animate-bounce text-red-400" />
          </a>
        </section>

        <EventCarousel />
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-24">
        <div className="rounded-[34px] border border-white/12 bg-white/[0.03] p-8 backdrop-blur-2xl">
          <p className="text-[10px] font-black uppercase tracking-[0.46em] text-red-400">secure channel</p>
          <h2 className="mt-3 text-3xl md:text-5xl font-black text-white">Protocolo de acceso digital verificado.</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-4">
            {["entrar al drop", "selección manual", "recibir pase", "escanear qr con seguridad"].map((step) => (
              <div
                key={step}
                className="rounded-3xl border border-white/10 bg-black/40 p-4 text-sm font-bold uppercase tracking-[0.14em] text-zinc-300 transition hover:border-red-500/30"
              >
                {step}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Burbuja Flotante para Merch y Producción (Nueva) */}
      <FloatingWhatsAppBubble />

      {/* Modales de Interacción Desktop */}
      {activeModal === "access" && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/90 pb-28 pt-14 backdrop-blur-xl">
          <button
            onClick={() => setActiveModal(null)}
            className="fixed right-6 top-6 z-[110] flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/80 text-white transition hover:bg-white/10"
          >
            <X className="h-6 w-6" />
          </button>
          <AccessDrop />
        </div>
      )}

      {activeModal === "giveaway" && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/90 pb-28 pt-14 backdrop-blur-xl">
          <button
            onClick={() => setActiveModal(null)}
            className="fixed right-6 top-6 z-[110] flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/80 text-white transition hover:bg-white/10"
          >
            <X className="h-6 w-6" />
          </button>
          <LiveGiveaway />
        </div>
      )}

      <StaffModal isOpen={isStaffModalOpen} onClose={() => setIsStaffModalOpen(false)} />
    </main>
  );
}
