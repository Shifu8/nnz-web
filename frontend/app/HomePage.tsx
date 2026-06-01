/**
 * Autor: Brandon Medina
 * Fecha: 2026
 * Descripción: Home principal simplificado. Mantiene desktop, y la shell mobile optimizada sin scroll largo.
 */

"use client";

import { useRef, useState, useEffect, type CSSProperties } from "react";
import {
  Calendar,
  Flame,
  Gem,
  Radio,
  Ticket,
  Gift,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  ShieldAlert,
  Zap
} from "lucide-react";
import Atmosphere from "@/frontend/components/Atmosphere";
import AnimatedHeading from "@/frontend/components/AnimatedHeading";
import MobileFirstShell from "@/frontend/features/mobile/MobileFirstShell";
import AccessDrop from "@/frontend/features/access-drop/AccessDrop";
import LiveGiveaway from "@/frontend/features/giveaway/LiveGiveaway";
import type { Event } from "@/frontend/types/domain";
import StaffModal from "@/frontend/features/staff/StaffModal";
import AdminPanelModal from "@/frontend/features/staff/AdminPanelModal";
import { useRouter } from "next/navigation";

import DawgsWearSection from "@/frontend/features/merch/DawgsWearSection";
import DawgsStudio from "@/frontend/components/DawgsStudio";
import AIChatbot from "@/frontend/components/AIChatbot";
import { gsap, useGSAP } from "@/frontend/animations/gsapSetup";
import { motion, AnimatePresence } from "framer-motion";
import { loadActiveModal, saveActiveModal } from "@/lib/persistence/clientState";

function getEventTimeLabel(startsAt: string) {
  const time = startsAt.split("T")[1]?.slice(0, 5);
  if (!time) return "";
  const [hourRaw, minuteRaw] = time.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return "";
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

type DemoState = "scanning_1" | "success" | "scanning_2" | "denied";
const DEMO_STATES: DemoState[] = ["scanning_1", "success", "scanning_2", "denied"];

export default function HomePage() {
  const router = useRouter();
  const scope = useRef<HTMLElement>(null);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [showHiddenMenu, setShowHiddenMenu] = useState(false);
  const [activeModal, setActiveModal] = useState<"access" | "giveaway" | null>(null);
  const [currentSlideDesktop, setCurrentSlideDesktop] = useState(0);
  const [activeSection, setActiveSection] = useState("events");
  const [demoState, setDemoState] = useState<DemoState>("scanning_1");
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((data) => { if (data.success) setEvents(data.events); })
      .catch(() => {})
      .finally(() => setEventsLoading(false));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("menu") === "access") {
      setShowHiddenMenu(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("menu");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);
  const [demoTime, setDemoTime] = useState("");

  useEffect(() => {
    const savedModal = loadActiveModal();
    if (savedModal) {
      queueMicrotask(() => setActiveModal(savedModal));
    }
  }, []);

  useEffect(() => {
    saveActiveModal(activeModal);
  }, [activeModal]);

  useEffect(() => {
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep = (currentStep + 1) % DEMO_STATES.length;
      const nextDemoState = DEMO_STATES[currentStep];
      if (nextDemoState === "success") {
        setDemoTime(new Date().toLocaleTimeString());
      }
      setDemoState(nextDemoState);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  // Monitor scroll for section highlighting
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 120;
      const sections = ["events", "access", "merch", "studio"];
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const moveDesktopEvent = (direction: -1 | 1) => {
    setCurrentSlideDesktop((current) => (current + direction + events.length) % events.length);
  };

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      setShowHiddenMenu(true);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 3000); // 3 segundos para Hidden Menu
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
        y: 20,
        stagger: 0.06,
        delay: 0.15,
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

      {/* Header unificado */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-black/10 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] w-full items-center px-6 md:px-12 lg:px-16 py-4">
          {/* DAWGS - left */}
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

          {/* Nav - center */}
          <div className="hidden md:flex flex-1 items-center justify-center">
            <nav className="flex items-center gap-1">
              {["events", "access", "merch", "studio"].map((item) => (
                <div key={item} className="flex flex-col items-center gap-1">
                  <motion.a
                    href={`#${item}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`glass-action relative overflow-hidden ${activeSection === item ? "border-red-500/30 bg-red-500/20 text-red-400 shadow-[0_0_20px_rgba(255,0,24,0.15)]" : "glass-action-quiet text-zinc-300"}`}
                    style={{ "--glass-action-height": "34px", "--glass-action-px": "0.85rem", "--glass-action-text": "0.6rem" } as CSSProperties}
                  >
                    {activeSection === item && (
                      <motion.div layoutId="nav-glow-desktop" className="absolute inset-0 bg-red-500/10 blur-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} />
                    )}
                    <span className="relative z-10">{item === "access" ? "Access Info" : item === "merch" ? "Merch" : item}</span>
                  </motion.a>
                  {activeSection === item && (
                    <motion.div layoutId="nav-indicator-desktop" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className="h-0.5 w-6 rounded-full bg-red-500 shadow-[0_0_12px_rgba(255,0,24,0.5)]" />
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile First (Rediseño Compacto) */}
      <MobileFirstShell />

      {/* Desktop (Preservado) */}
      {/* Ambient background that shifts with active section */}
      <motion.div
        animate={{ background: activeSection === "events" ? "radial-gradient(ellipse at 30% 20%, rgba(255,0,24,0.08), transparent 60%)" : activeSection === "access" ? "radial-gradient(ellipse at 70% 30%, rgba(255,0,24,0.06), transparent 60%)" : activeSection === "merch" ? "radial-gradient(ellipse at 50% 50%, rgba(255,100,0,0.06), transparent 60%)" : "radial-gradient(ellipse at 40% 60%, rgba(100,0,255,0.06), transparent 60%)" }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className="fixed inset-0 z-0 pointer-events-none hidden md:block"
      />
      <section className="relative z-10 hidden md:block">
        <motion.section
          id="events"
          initial={{ opacity: 0.6 }}
          animate={{ opacity: activeSection === "events" ? 1 : 0.6 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 mx-auto flex min-h-screen max-w-[1600px] w-full flex-col justify-center px-6 md:px-12 lg:px-16 xl:px-20 pb-10 pt-28"
        >
          <div className="grid gap-8 md:grid-cols-[0.86fr_1.14fr] lg:gap-16 xl:grid-cols-[0.76fr_1.24fr] items-center">
            <div>
              <p className="cinematic-reveal text-[10px] font-black uppercase tracking-[0.54em] text-red-300 drop-shadow-[0_0_10px_red]">
                underground access
              </p>
              <AnimatedHeading
                text="DAWGS"
                as="h1"
                staggerMs={80}
                durationMs={500}
                className="mt-3 max-w-3xl whitespace-nowrap text-[4.35rem] font-black leading-[0.82] tracking-[-0.02em] text-white drop-shadow-[0_0_44px_rgba(255,0,24,.55)] sm:text-8xl md:text-9xl"
              />
              <p className="cinematic-reveal mt-5 max-w-md text-sm leading-7 text-zinc-300">
                Incredible live shows. Upfront pricing. Relevant recommendations. DAWGS makes going out easy.
              </p>
              <div className="cinematic-reveal mt-7 flex flex-wrap gap-2 pb-1">
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
            <div className="relative hidden h-[500px] w-full items-center justify-center perspective-dramatic md:flex lg:h-[590px]">
              <button
                type="button"
                aria-label="Evento anterior"
                onClick={() => moveDesktopEvent(-1)}
                className="glass-icon-button absolute -left-2 z-40 text-white lg:-left-5"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>

              <div className="cinematic-reveal hero-orbit relative h-full w-full max-w-[920px]">
                {events.map((event, index) => {
                  const isFirst = index === 0;
                  const isActive = index === currentSlideDesktop;
                  const stackSlot = (index - currentSlideDesktop + events.length) % events.length;
                  const isVisible = stackSlot < 3;
                  const imageSrc = event.poster || "/images/trap_loud_trio_artists.png";
                  const timeLabel = getEventTimeLabel(event.startsAt);

                  return (
                    <div
                      key={event.id}
                      role={!isActive ? "button" : undefined}
                      tabIndex={!isActive && isVisible ? 0 : -1}
                      aria-hidden={!isVisible}
                      onClick={() => !isActive && isVisible && setCurrentSlideDesktop(index)}
                      onKeyDown={(eventKey) => {
                        if (!isActive && isVisible && (eventKey.key === "Enter" || eventKey.key === " ")) {
                          setCurrentSlideDesktop(index);
                        }
                      }}
                      className={`event-stack-card group absolute inset-y-0 left-0 right-[54px] flex origin-center flex-col justify-end overflow-hidden rounded-[26px] border bg-black p-5 shadow-[0_28px_90px_rgba(0,0,0,0.72)] transition-all duration-700 ease-out lg:right-[84px] lg:rounded-[34px] lg:p-8 ${isActive ? "border-red-500/45 shadow-[0_0_90px_rgba(255,0,24,.24)]" : "cursor-pointer border-white/20 grayscale hover:border-red-400/40 hover:brightness-110"} ${isVisible ? "visible" : "invisible pointer-events-none"}`}
                      style={{
                        zIndex: 30 - stackSlot,
                        opacity: isVisible ? 1 - stackSlot * 0.18 : 0,
                        transform: `translateX(${stackSlot * 62}px) translateY(${stackSlot * 18}px) scale(${1 - stackSlot * 0.06}) rotateY(${stackSlot * -4}deg)`,
                        pointerEvents: isActive || isVisible ? "auto" : "none",
                        transitionDelay: `${stackSlot * 45}ms`,
                      }}
                    >
                      <div className="absolute inset-0 z-0 bg-black" />
                      <img
                        src={imageSrc}
                        alt={event.title}
                        className={`absolute inset-0 z-10 h-full w-full object-cover object-[58%_top] transition duration-700 ${isActive ? "scale-[1.035] opacity-95 brightness-95 group-hover:scale-[1.075]" : "opacity-55 brightness-50 contrast-125"}`}
                      />
                      <div className={`absolute inset-0 z-10 ${isActive ? "bg-[linear-gradient(90deg,rgba(0,0,0,.78),rgba(0,0,0,.34)_42%,rgba(0,0,0,.12)_68%,rgba(0,0,0,.66))]" : "bg-black/45"}`} />
                      <div className="absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-red-500/80 to-transparent" />
                      {isActive && (
                        <>
                          <div className="absolute left-0 top-0 z-20 h-[140%] w-[70px] origin-top-left bg-gradient-to-b from-red-600/35 via-red-500/10 to-transparent blur-2xl mix-blend-screen animate-laser-left [animation-duration:12s]" />
                          <div className="absolute right-4 top-0 z-20 h-[140%] w-[70px] origin-top-right bg-gradient-to-b from-red-600/35 via-red-500/10 to-transparent blur-2xl mix-blend-screen animate-laser-right [animation-duration:15s]" />
                          <div className="absolute bottom-0 left-1/2 z-20 h-[70%] w-[120%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_bottom,rgba(255,0,24,0.16),transparent_60%)] mix-blend-screen" />
                        </>
                      )}

                      <div className="relative z-30 max-w-[460px]">
                        <p className={`inline-flex w-fit items-center gap-2 rounded-lg px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] ${isFirst ? "bg-red-600 text-white shadow-[0_0_18px_rgba(255,0,24,.58)]" : "border border-white/15 bg-black/60 text-zinc-300"}`}>
                          <Zap className="h-3 w-3" />
                          {isFirst ? "proximo evento" : "proxima fecha"}
                        </p>
                        <h2 className="mt-4 text-3xl font-black leading-none text-white drop-shadow-[0_0_22px_rgba(255,0,24,0.58)] lg:text-5xl xl:text-6xl">
                          {event.title}
                        </h2>
                        <div className="mt-4 flex flex-wrap items-center gap-2.5 text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-200 lg:text-[10px] lg:tracking-[0.13em]">
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-zinc-100" />
                            {event.dateLabel}
                          </span>
                          <span className="h-3 w-px bg-white/20" />
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-zinc-100" />
                            {event.city}
                          </span>
                          {timeLabel && (
                            <>
                              <span className="h-3 w-px bg-white/20" />
                              <span className="inline-flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-zinc-100" />
                                {timeLabel}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="mt-4 h-1 w-14 rounded-full bg-red-500 shadow-[0_0_16px_rgba(255,0,24,0.68)]" />
                        <p className="mt-4 max-w-sm text-[11px] leading-5 text-zinc-300 line-clamp-2 lg:text-xs lg:leading-6">
                          {event.description}
                        </p>

                        <div className="mt-6 flex gap-3">
                          <button
                            disabled={!isFirst}
                            onClick={() => isFirst && setActiveModal("access")}
                            className={`glass-action ${isFirst ? "glass-action-primary" : "glass-action-quiet text-zinc-500"}`}
                            style={{ "--glass-action-height": "44px", "--glass-action-px": "1.65rem", "--glass-action-text": "0.72rem" } as CSSProperties}
                          >
                            <Ticket className="h-3.5 w-3.5" /> Shop Now
                          </button>
                          <button
                            disabled={!isFirst}
                            onClick={() => isFirst && setActiveModal("giveaway")}
                            className={`glass-action ${isFirst ? "glass-action-quiet" : "glass-action-quiet text-zinc-500"}`}
                            style={{ "--glass-action-height": "44px", "--glass-action-px": "1.65rem", "--glass-action-text": "0.72rem" } as CSSProperties}
                          >
                            <Gift className="h-3.5 w-3.5" /> Giveaway
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                aria-label="Siguiente evento"
                onClick={() => moveDesktopEvent(1)}
                className="glass-icon-button glass-icon-button-red absolute -right-2 z-40 text-white lg:-right-5"
              >
                <ChevronRight className="h-6 w-6" />
              </button>

              <div className="absolute -bottom-8 left-1/2 z-40 flex -translate-x-1/2 gap-3">
                {events.map((_, i) => (
                  <button
                    type="button"
                    aria-label={`Ir al evento ${i + 1}`}
                    onClick={() => setCurrentSlideDesktop(i)}
                    key={i}
                    className={`h-2 rounded-full transition-all duration-300 ${i === currentSlideDesktop ? "w-9 bg-red-500 shadow-[0_0_10px_red]" : "w-4 bg-white/20 hover:bg-white/40"}`}
                  />
                ))}
              </div>
            </div>

          </div>
        </motion.section>
      </section>

      {/* Secure Channel & Access Simulator */}
      <motion.section
        id="access"
        initial={{ opacity: 0.6 }}
        animate={{ opacity: activeSection === "access" ? 1 : 0.6 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mx-auto max-w-[1600px] w-full px-6 md:px-12 lg:px-16 xl:px-20 pb-24 border-t border-white/5 pt-24"
      >
        <div className="relative overflow-hidden rounded-[40px] border border-white/[0.07] bg-black/20 p-8 md:p-12 backdrop-blur-3xl shadow-[0_0_100px_rgba(239,68,68,0.06)]">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-red-500/5 blur-[120px] pointer-events-none" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-red-500/5 blur-[120px] pointer-events-none" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left side: Instructions and Diagram */}
            <div className="lg:col-span-7 flex flex-col text-left">
              <span className="inline-flex items-center gap-1.5 w-fit rounded border border-red-500/30 bg-red-950/30 px-3 py-1 text-[9px] font-black uppercase tracking-[0.25em] text-red-500">
                <svg className="w-3.5 h-3.5 text-red-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                prueba visual de acceso
              </span>
              <h2 className="mt-4 text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">
                Tu QR entra una vez<br />
                <span className="text-[#C8FF00] italic">y queda cerrado.</span>
              </h2>
              <p className="mt-4 text-sm text-zinc-400 leading-relaxed max-w-xl">
                Esta demo muestra el proceso de entrada. El QR real se entrega despues de comprar tu ticket; en puerta el staff lo escanea una sola vez y, si pasa, ese mismo codigo ya no vuelve a servir.
              </p>

              {/* Flow Steps */}
              <div className="mt-8 space-y-4">
                {[
                  {
                    step: "01",
                    title: "Compra tu ticket",
                    desc: "Pagas por transferencia bancaria (Banco Loja o Pichincha). Subes tu comprobante y recibes confirmación."
                  },
                  {
                    step: "02",
                    title: "Recibe tu QR",
                    desc: "Despues de la compra veras tu pase con QR. Guardalo y no lo compartas en chats ni historias."
                  },
                  {
                    step: "03",
                    title: "Muestralo en puerta",
                    desc: "Al llegar, ensenas el QR desde tu celular. El staff lo revisa con el scanner oficial."
                  },
                  {
                    step: "04",
                    title: "Primer uso y bloqueo",
                    desc: "Si el scanner marca acceso permitido, el QR queda usado. Una captura o reenvio posterior sera rechazado."
                  }
                ].map((s) => (
                  <div key={s.step} className="group flex gap-4 p-4 rounded-2xl border border-white/[0.04] bg-white/[0.01] hover:border-red-500/20 hover:bg-red-500/[0.03] hover:shadow-[0_0_30px_rgba(239,68,68,0.04)] transition-all duration-300">
                    <span className="text-sm font-black text-red-500 font-mono">{s.step}</span>
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">{s.title}</h4>
                      <p className="text-[11px] text-zinc-500 mt-1">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right side: QR demo automática (no interactiva) */}
            <div className="lg:col-span-5 flex flex-col items-center pointer-events-none select-none">
              <div className="absolute w-[300px] h-[300px] rounded-full bg-red-500/10 blur-[100px] -top-20 -right-20 pointer-events-none" />
              <div className="absolute w-[250px] h-[250px] rounded-full bg-red-500/5 blur-[100px] -bottom-20 -left-20 pointer-events-none" />
              <p className="mb-3 text-[9px] font-black uppercase tracking-[0.35em] text-zinc-500 text-center">
                Demo automática · validación en tiempo real
              </p>
              <div className="w-full max-w-[360px] rounded-[38px] border border-white/[0.06] bg-black/30 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col items-center backdrop-blur-2xl">

                {/* Scanner Glow border state overlay */}
                <div className={`absolute inset-0 border-[3px] rounded-[38px] pointer-events-none z-30 transition-all duration-500 ${demoState === "success"
                  ? "border-green-500/80 shadow-[inset_0_0_30px_rgba(34,197,94,0.4),0_0_40px_rgba(34,197,94,0.15)]"
                  : demoState === "denied"
                    ? "border-red-500/80 shadow-[inset_0_0_30px_rgba(239,68,68,0.4),0_0_40px_rgba(239,68,68,0.15)]"
                    : (demoState === "scanning_1" || demoState === "scanning_2")
                      ? "border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.2),0_0_40px_rgba(239,68,68,0.1)] animate-qr-scan"
                      : "border-white/[0.06]"
                  }`} />

                {/* Header of Pass */}
                <div className="w-full flex justify-between items-center border-b border-white/[0.06] pb-3 mb-4 z-10">
                  <span className="text-[8px] font-black tracking-[0.25em] text-[#C8FF00]">DAWGS VIP ACCESS</span>
                  <span className={`text-[7px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${demoState === "success"
                    ? "bg-green-950/40 text-green-400 border-green-500/30"
                    : demoState === "denied"
                      ? "bg-red-950/40 text-red-500 border-red-500/30"
                      : "bg-zinc-900 text-zinc-500 border-zinc-800"
                    }`}>
                    {demoState === "success" ? "usado" : demoState === "denied" ? "bloqueado" : "activo"}
                  </span>
                </div>

                {/* QR visual de prueba */}
                <div className="relative w-44 h-44 bg-white rounded-2xl p-3 flex items-center justify-center shadow-lg transition-transform duration-300">
                  {/* Blurred overlay if already used / blocked */}
                  {demoState === "success" && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center p-3 z-10">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-[10px] font-black text-green-700 uppercase tracking-widest mt-2 text-center">pase verificado</span>
                    </div>
                  )}
                  {demoState === "denied" && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center p-3 z-10">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <span className="text-[8px] font-black text-red-700 uppercase tracking-widest mt-2 text-center">¡acceso rechazado!<br />ya escaneado</span>
                    </div>
                  )}

                  {/* QR SVG de prueba */}
                  <svg className="w-full h-full text-black" viewBox="0 0 100 100" fill="currentColor">
                    <rect x="10" y="10" width="20" height="20" />
                    <rect x="15" y="15" width="10" height="10" fill="white" />
                    <rect x="70" y="10" width="20" height="20" />
                    <rect x="75" y="15" width="10" height="10" fill="white" />
                    <rect x="10" y="70" width="20" height="20" />
                    <rect x="15" y="75" width="10" height="10" fill="white" />
                    <rect x="40" y="40" width="20" height="20" />
                    <rect x="45" y="10" width="5" height="10" />
                    <rect x="55" y="25" width="10" height="5" />
                    <rect x="70" y="45" width="15" height="5" />
                    <rect x="10" y="45" width="10" height="10" />
                    <rect x="45" y="70" width="10" height="10" />
                    <rect x="70" y="70" width="5" height="15" />
                    <rect x="80" y="80" width="10" height="10" />
                  </svg>
                </div>

                {/* Ticket metadata */}
                <div className="w-full text-center mt-5 z-10 font-mono text-[9px] text-zinc-500 uppercase tracking-wider">
                  <p className="text-white font-bold text-xs tracking-normal">USUARIO</p>
                  <p className="mt-1">SERIAL: DAWGS-1982-MED</p>
                  <p className="text-[8px]">TRAP LOUD MEDELLIN • 2026</p>
                </div>

                {/* Real-time Status Message box */}
                <div className={`w-full mt-4 p-3 rounded-xl border text-center backdrop-blur-xl transition-all duration-300 ${demoState === "success"
                  ? "bg-green-950/30 border-green-500/30 text-green-400 text-[9px] font-bold shadow-[0_0_20px_rgba(34,197,94,0.05)]"
                  : demoState === "denied"
                    ? "bg-red-950/30 border-red-500/30 text-red-400 text-[9px] font-bold shadow-[0_0_20px_rgba(239,68,68,0.05)]"
                    : "bg-black/40 border-white/[0.06] text-zinc-400 text-[8px]"
                  }`}>
                  {demoState === "success" && (
                    <p className="uppercase tracking-wider">
                      [OK] ACCESO PERMITIDO a las {demoTime}<br />
                      <span className="text-green-500/70">QR usado. ya no vuelve a servir.</span>
                    </p>
                  )}
                  {demoState === "denied" && (
                    <p className="uppercase tracking-wider animate-pulse">
                      [FALLA] ACCESO RECHAZADO.<br />
                      <span className="text-red-400/70">este mismo QR ya fue escaneado antes.</span>
                    </p>
                  )}
                  {(demoState === "scanning_1" || demoState === "scanning_2") && <p className="uppercase tracking-widest animate-pulse text-zinc-500">consultando el estado del QR...</p>}
                </div>
              </div>
              <p className="mt-4 max-w-[360px] text-center text-[9px] leading-5 text-zinc-500 uppercase tracking-widest">
                Cada QR funciona una sola vez · sistema anti replicación
              </p>
            </div>

          </div>
        </div>
        <style dangerouslySetInnerHTML={{
          __html: `
          @keyframes qr-scan {
            0% { border-color: rgba(239,68,68,0.3); box-shadow: 0 0 10px rgba(239,68,68,0.1); }
            50% { border-color: rgba(239,68,68,0.7); box-shadow: 0 0 30px rgba(239,68,68,0.3), 0 0 60px rgba(239,68,68,0.1); }
            100% { border-color: rgba(239,68,68,0.3); box-shadow: 0 0 10px rgba(239,68,68,0.1); }
          }
        `}} />
      </motion.section>

      {/* Ropa y Estudio */}
      <DawgsWearSection />
      <DawgsStudio />

      {/* Asistente IA Concierge */}
      <AIChatbot />

      {/* Modales de Interacción Desktop */}
      <AnimatePresence>
        {activeModal === "access" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 backdrop-blur-xl flex items-center justify-center p-4 no-scrollbar"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="relative w-full max-w-[1400px]"
            >
              <AccessDrop onClose={() => setActiveModal(null)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === "giveaway" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 pb-28 pt-14 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="relative w-full max-w-[1400px] px-4 py-6"
            >
              <LiveGiveaway onClose={() => setActiveModal(null)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <StaffModal isOpen={isStaffModalOpen} onClose={() => setIsStaffModalOpen(false)} />
      <AdminPanelModal isOpen={isAdminPanelOpen} onClose={() => setIsAdminPanelOpen(false)} />

      {/* Hidden Admin/Staff Menu Selection */}
      <AnimatePresence>
        {showHiddenMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-3xl"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm rounded-[40px] border border-white/[0.08] bg-white/[0.03] backdrop-blur-2xl p-10 shadow-[0_0_80px_rgba(255,0,24,0.06)] text-center flex flex-col items-center"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent pointer-events-none rounded-[40px]" />
              <button onClick={() => setShowHiddenMenu(false)} className="absolute top-5 left-5 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl px-4 py-2.5 text-[8px] font-black uppercase tracking-wider text-zinc-400 transition hover:text-white hover:border-white/20 z-10">
                <ChevronLeft className="h-3 w-3" /> VOLVER
              </button>

              <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.06] border border-white/10 mb-5 shadow-[0_0_30px_rgba(255,255,255,0.03)]">
                <ShieldAlert className="h-6 w-6 text-zinc-300" />
              </div>
              <h2 className="relative text-2xl font-black uppercase tracking-[0.15em] text-white">System Access</h2>
              <p className="relative mt-2 text-[9px] text-zinc-500 mb-8 uppercase tracking-[0.3em] font-bold">Selecciona el modulo</p>

              <div className="relative flex flex-col gap-4 w-full">
                <button
                  onClick={() => { setShowHiddenMenu(false); setIsStaffModalOpen(true); }}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl px-5 py-4 text-[11px] font-black uppercase tracking-wider text-zinc-300 transition hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-400"
                >
                  <Radio className="h-4 w-4" /> Agente Staff
                </button>
                <button
                  onClick={() => { setShowHiddenMenu(false); router.push("/admin"); }}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl px-5 py-4 text-[11px] font-black uppercase tracking-wider text-zinc-300 transition hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400"
                >
                  <Zap className="h-4 w-4" /> Admin
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
