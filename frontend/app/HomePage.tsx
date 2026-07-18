/**
 * Autor: Brandon Medina
 * Fecha: 2026
 * Descripción: Homepage NENEZ - Futuristic Luxury Monochrome Redesign
 */

"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  ChevronLeft,
  KeyRound,
  LockKeyhole,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Ticket,
  X,
  Share2
} from "lucide-react";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import Atmosphere from "@/frontend/components/Atmosphere";
import AIChatbot from "@/frontend/components/AIChatbot";
import PurchaseFarewell from "@/frontend/components/PurchaseFarewell";
import AccessDrop, { type AccessDropHandle } from "@/frontend/features/access-drop/AccessDrop";
import TicketRecovery from "@/frontend/features/access-drop/TicketRecovery";
import OutfitBuilderSection from "@/frontend/features/merch/OutfitBuilderSection";
import StaffModal from "@/frontend/features/staff/StaffModal";
import EventTicketCarousel, { CAROUSEL_EVENTS } from "@/frontend/components/EventTicketCarousel";
import EventDetailOverlay from "@/frontend/features/events/EventDetailOverlay";
import { gsap, useGSAP } from "@/frontend/animations/gsapSetup";
import DrinksMenuModal from "@/frontend/components/DrinksMenuModal";
import { events as fallbackEvents } from "@/frontend/services/nenezData";
import { useHomepageConfig } from "@/frontend/hooks/useHomepageConfig";
import type { ThemeColors } from "@/lib/homepage-config/themes";
import type { HomepageConfig } from "@/lib/homepage-config/types";
import type { Event } from "@/frontend/types/domain";
import { getOnlineSalesStatus } from "@/frontend/utils/cutoff";

const HOME_NAV_ITEMS = [
  { id: "show", label: "Show" },
  { id: "access", label: "Access" },
  { id: "wear", label: "Merch" },
  { id: "support", label: "Support" },
] as const;

type HomeNavId = (typeof HOME_NAV_ITEMS)[number]["id"];

interface HomePageProps {
  initialConfig: HomepageConfig;
}

function TypewriterText({ text }: { text: string }) {
  const [displayedCount, setDisplayedCount] = useState(0);
  const textLength = text.length;

  useEffect(() => {
    setDisplayedCount(0);
    const timer = setInterval(() => {
      setDisplayedCount((prev) => {
        if (prev >= textLength) {
          clearInterval(timer);
          return textLength;
        }
        return prev + 1;
      });
    }, 28);
    return () => clearInterval(timer);
  }, []);

  const isFinished = displayedCount >= textLength;

  return (
    <span className="font-mono tracking-wider inline-flex items-center justify-center">
      <span>{isFinished ? text : text.slice(0, displayedCount)}</span>
      <span className="inline-block w-1.5 h-3 ml-1 bg-white/80 animate-pulse align-middle" />
    </span>
  );
}

export default function HomePage({ initialConfig }: HomePageProps) {
  const router = useRouter();
  const scope = useRef<HTMLElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const manualActiveUntil = useRef(0);

  const [events, setEvents] = useState<Event[]>(fallbackEvents);
  const [activeSection, setActiveSection] = useState<HomeNavId>("show");
  const [showHiddenMenu, setShowHiddenMenu] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [showFarewell, setShowFarewell] = useState(false);
  const [farewellName, setFarewellName] = useState("");
  const accessDropRef = useRef<AccessDropHandle>(null);
  const checkoutDragControls = useDragControls();
  const [isTicketPulse, setIsTicketPulse] = useState(false);
  const [isRecoveryPulse, setIsRecoveryPulse] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showDetailOverlay, setShowDetailOverlay] = useState(false);
  const [showDrinksModal, setShowDrinksModal] = useState(false);
  const [selectedCarouselEvent, setSelectedCarouselEvent] = useState<Event>(CAROUSEL_EVENTS[0]);

  // Custom states for 3D Carousel & Premium visual effects
  const [activeIndex, setActiveIndex] = useState(0);
  const activeEvent = events[activeIndex] || selectedCarouselEvent;
  const nextIndex = events.length > 0 ? (activeIndex + 1) % events.length : 0;
  const nextEvent = events[nextIndex] || activeEvent;
  const [isLoading, setIsLoading] = useState(true);
  const [checkoutState, setCheckoutState] = useState<string>("register");

  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeSalesStatus = getOnlineSalesStatus(activeEvent);

  // Inactive event Toast notification state
  const [toast, setToast] = useState<{
    message: string;
    type: 'coming-soon' | 'sold-out' | 'info';
    id: number;
  } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerInactiveToast = (event: Event) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    
    let message = "Este evento estará disponible próximamente.";
    let type: 'coming-soon' | 'sold-out' | 'info' = 'coming-soon';

    if ((event as any).customMessage) {
      message = (event as any).customMessage;
      type = "info";
    } else if (event.status === "sold-out") {
      message = "Este evento ya se encuentra agotado.";
      type = "sold-out";
    } else if (event.status === "coming-soon") {
      message = "Este evento es el próximo y sus entradas aún no están disponibles.";
      type = "coming-soon";
    } else {
      const status = getOnlineSalesStatus(event);
      if (status.isClosed) {
        message = `Las entradas online por esta web han finalizado a las ${status.cutoffTime} hs. Puedes adquirir tu entrada directamente en la puerta del evento.`;
        type = "info";
      }
    }

    setToast({
      message,
      type,
      id: Date.now()
    });

    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);



  const { config } = useHomepageConfig(initialConfig);

  // Forced Strict Monochromatic Grayscale Color Theme (Balenciaga / Apple / Stripe style)
  const theme: ThemeColors = {
    primary: "#ffffff",
    primaryLight: "#e4e4e7",
    primaryDark: "#27272a",
    bgFrom: "#000000",
    bgTo: "#050505",
    glowRgba: "rgba(255,255,255,0.02)",
    glowIntense: "rgba(255,255,255,0.05)",
    borderRgba: "rgba(255,255,255,0.08)",
    btnFrom: "#ffffff",
    btnTo: "#ffffff",
    btnShadow: "rgba(255,255,255,0.05)",
    textAccent: "#ffffff",
    badgeBg: "#27272a",
    cardBorder: "rgba(255,255,255,0.08)",
    cardShadow: "rgba(0,0,0,0.85)",
    hoverGlow: "rgba(255,255,255,0.05)",
    tagBg: "rgba(255,255,255,0.05)",
  };

  const primaryRgb = "255,255,255";
  const themeStyle = {
    "--theme-primary": theme.primary,
    "--theme-primary-rgb": primaryRgb,
    "--theme-primary-light": theme.primaryLight,
    "--theme-primary-dark": theme.primaryDark,
    "--theme-bg-tint": "rgba(255, 255, 255, 0.04)",
    "--theme-bg-glow": "rgba(255, 255, 255, 0.02)",
    "--theme-bg-glow-dark": "rgba(255, 255, 255, 0.01)",
    "--theme-bg-accent": "rgba(255, 255, 255, 0.04)",
    "--theme-bg-grid": "rgba(255, 255, 255, 0.02)",
    "--theme-btn-from": theme.btnFrom,
    "--theme-btn-to": theme.btnTo,
    "--theme-btn-shadow": theme.btnShadow,
    "--theme-glow-intense": theme.glowIntense,
    "--theme-border-accent": theme.borderRgba,
    "--theme-border-accent-light": "rgba(255, 255, 255, 0.12)",
    "--theme-border-accent-xlight": "rgba(255, 255, 255, 0.06)",
    "--theme-glow-rgba": theme.glowRgba,
    "--theme-text-accent": theme.textAccent,
    "--theme-text-rgb": primaryRgb,
    "--theme-badge-bg": theme.badgeBg,
    "--theme-card-border": theme.cardBorder,
    "--theme-card-shadow": theme.cardShadow,
    "--theme-hover-glow": theme.hoverGlow,
    "--theme-bg-pink-500": "rgba(255, 255, 255, 0.08)",
    "--theme-bg-pink-500-hover": "rgba(255, 255, 255, 0.14)",
    "--theme-tag-bg": theme.tagBg,
    background: "black",
  } as CSSProperties;

  // Loader transition trigger
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1400);
    return () => clearTimeout(timer);
  }, []);



  useEffect(() => {
    fetch("/api/events")
      .then((response) => response.json())
      .then((data) => {
        if (data.success && Array.isArray(data.events) && data.events.length > 0) {
          setEvents(data.events);
          setSelectedCarouselEvent(data.events[0]);
        }
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("menu") === "access") {
      queueMicrotask(() => setShowHiddenMenu(true));
      const url = new URL(window.location.href);
      url.searchParams.delete("menu");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.performance.now() < manualActiveUntil.current) return;

      const supportSection = document.getElementById("support");
      const isNearBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 120;

      if (supportSection && isNearBottom) {
        setActiveSection("support");
        return;
      }

      const showSection = document.getElementById("show");
      const accessSection = document.getElementById("access");
      const wearSection = document.getElementById("wear");

      const showTop = showSection ? showSection.getBoundingClientRect().top + window.scrollY : 0;
      const accessTop = accessSection ? accessSection.getBoundingClientRect().top + window.scrollY : 0;
      const wearTop = wearSection ? wearSection.getBoundingClientRect().top + window.scrollY : 0;

      const scrollPosition = window.scrollY + window.innerHeight * 0.45;

      let currentSection: HomeNavId = "show";
      if (scrollPosition >= wearTop) {
        currentSection = "wear";
      } else if (scrollPosition >= accessTop - 100) {
        currentSection = "access";
      } else {
        currentSection = "show";
      }

      setActiveSection(currentSection);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useGSAP(
    () => {
      if (isLoading) return;

      const mm = gsap.matchMedia();

      mm.add(
        {
          isDesktop: "(min-width: 1024px)",
          isMobile: "(max-width: 1023px)",
          reduceMotion: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          const { reduceMotion, isDesktop } = context.conditions as {
            reduceMotion: boolean;
            isDesktop: boolean;
          };

          if (reduceMotion) {
            gsap.set(".logo-icon", { opacity: 1, scale: 1, rotation: 0 });
            gsap.set(".logo-char", { opacity: 1, y: 0, scale: 1 });
            gsap.set(".hero-reveal", { autoAlpha: 1, y: 0 });
            return;
          }

          const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

          // Animación del logo de NowTickets (corre en móvil y desktop)
          tl.fromTo(".logo-icon",
            { scale: 0, rotation: -45, opacity: 0 },
            { scale: 1, rotation: 0, opacity: 1, duration: 0.8, ease: "back.out(1.7)" }
          )
          .fromTo(".logo-char",
            { opacity: 0, y: 15, scale: 0.7, transformOrigin: "50% 100%" },
            { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.04, ease: "back.out(1.5)" },
            "-=0.5"
          );

          // Animación adicional del hero (solo en desktop)
          if (isDesktop) {
            tl.from(".hero-reveal", {
              autoAlpha: 0,
              y: 28,
              stagger: 0.08,
              duration: 0.85,
            }, "-=0.3");
          }
        },
        scope.current ?? undefined,
      );

      return () => mm.revert();
    },
    { dependencies: [isLoading], scope },
  );

  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      setShowHiddenMenu(true);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 3000);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const getNavIdForTarget = (id: string): HomeNavId =>
    HOME_NAV_ITEMS.some((item) => item.id === id) ? (id as HomeNavId) : "show";

  const scrollToSection = (
    id: string,
    block: ScrollLogicalPosition = "center",
    activeId: HomeNavId = getNavIdForTarget(id),
  ) => {
    manualActiveUntil.current = window.performance.now() + 950;
    setActiveSection(activeId);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block });
  };

  const scrollToTicketCard = () => {
    scrollToSection("tickets-stage", "center", "show");
    setIsTicketPulse(true);
    window.setTimeout(() => {
      setIsTicketPulse(false);
    }, 2500);
  };

  const scrollToRecovery = () => {
    scrollToSection("recovery", "center", "access");
    window.setTimeout(() => {
      setIsRecoveryPulse(true);
      window.setTimeout(() => setIsRecoveryPulse(false), 2600);
    }, 650);
  };

  const onBuy = (event: Event) => {
    setSelectedCarouselEvent(event);
    setIsTicketModalOpen(true);
  };

  const onViewDetails = (event: Event) => {
    setSelectedCarouselEvent(event);
    setShowDetailOverlay(true);
  };

  const onSelectRelatedEvent = (event: Event) => {
    setSelectedCarouselEvent(event);
    // Also update the carousel index if event exists in carousel
    const idx = events.findIndex(e => e.id === event.id);
    if (idx !== -1) setActiveIndex(idx);
  };

  return (
    <main
      ref={scope}
      className="relative min-h-screen overflow-x-hidden bg-black text-white"
      style={themeStyle}
    >
      {/* Premium cinematic intro loader overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="loader"
            exit={{ opacity: 0, filter: "blur(12px)" }}
            transition={{ duration: 0.75, ease: "easeInOut" }}
            className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-black"
          >
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="text-center"
            >
              <h1 className="text-sm font-black uppercase tracking-[0.6em] text-white">NOW</h1>
              <p className="mt-2 text-[8px] font-black uppercase tracking-[0.4em] text-zinc-500">Elevate Your Frequency</p>
              <div className="mt-6 h-0.5 w-16 bg-white/20 mx-auto overflow-hidden rounded">
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                  className="h-full w-1/2 bg-white"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Atmosphere />

      {/* Modern, minimalist top navigation bar */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.02] bg-black/45 backdrop-blur-2xl">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 px-4 py-3 sm:px-6 md:px-12 lg:px-16">

          {/* Logo on the left (No puppy image, text visible on mobile and desktop) */}
          <div className="flex min-w-0 items-center">
            <button
              type="button"
              onMouseDown={handleTouchStart}
              onMouseUp={handleTouchEnd}
              onMouseLeave={handleTouchEnd}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="group flex select-none items-center gap-3 outline-none hover:opacity-85 transition-opacity duration-200"
              style={{ WebkitTapHighlightColor: "transparent" }}
              aria-label="nowtickets"
            >
              <svg
                className="logo-icon h-5 w-auto select-none opacity-0"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Two pink dots */}
                <circle cx="15" cy="31" r="10" fill="#e10075" />
                <circle cx="15" cy="69" r="10" fill="#e10075" />
                {/* White lowercase n arch */}
                <path
                  d="M 50.5,71 L 50.5,48 A 19,19 0 0 1 88.5,48 L 88.5,71"
                  stroke="#ffffff"
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="logo-text flex items-center text-[19px] font-semibold font-quicksand lowercase tracking-normal leading-none select-none">
                {"now".split("").map((char, index) => (
                  <span key={`now-${index}`} className="logo-char text-white inline-block opacity-0">
                    {char}
                  </span>
                ))}
                {"tickets".split("").map((char, index) => (
                  <span key={`tickets-${index}`} className="logo-char inline-block opacity-0" style={{ color: "#e10075" }}>
                    {char}
                  </span>
                ))}
              </span>
            </button>
          </div>

          {/* Centered nav links */}
          <nav className="hidden items-center gap-8 lg:flex">
            {HOME_NAV_ITEMS.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => {
                  scrollToSection(item.id, item.id === "show" ? "start" : "center");
                }}
                className={`relative py-2 text-[9px] font-black uppercase tracking-[0.28em] transition ${activeSection === item.id ? "text-white font-bold" : "text-zinc-500 hover:text-zinc-200"
                  }`}
              >
                {item.label}
                <span
                  className={`absolute inset-x-0 -bottom-0.5 h-px bg-white transition-transform duration-300 ${activeSection === item.id ? "scale-x-100" : "scale-x-0"
                    }`}
                />
              </button>
            ))}
          </nav>

          {/* Two rounded CTA buttons on the right */}
          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={scrollToRecovery}
              className={`inline-flex h-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-5 text-[8px] font-black uppercase tracking-[0.16em] text-zinc-300 transition hover:border-white/30 hover:bg-white/5 hover:text-white ${isRecoveryPulse ? "top-recovery-pulse" : ""
                }`}
            >
              Recuperar
            </button>

            <button
              type="button"
              onClick={scrollToTicketCard}
              className="inline-flex h-9 items-center justify-center rounded-full bg-white px-5 text-[8px] font-black uppercase tracking-[0.16em] text-black transition hover:bg-zinc-200"
            >
              Comprar
            </button>
          </div>

        </div>
      </header>

      {/* Monochromatic 3D Concrete Room backdrop */}
      <section
        id="show"
        className="relative z-10 flex min-h-[100svh] w-full flex-col overflow-hidden px-4 pb-8 pt-24 sm:px-8 md:px-14 lg:px-20 lg:pb-10 justify-center"
      >
        {/* Cinematic Concrete Room Environment */}
        <div aria-hidden className="absolute inset-0 -z-20 overflow-hidden bg-black select-none pointer-events-none">
          {/* Wall guidelines / vertical lines */}
          <div className="absolute inset-0 opacity-[0.02] border-x border-white mx-32 pointer-events-none" />
          <div className="absolute inset-0 opacity-[0.02] border-x border-white mx-64 pointer-events-none" />

          {/* Wall corner gradient shadow (Back wall shadow) - transitions smoothly to floor base color */}
          <div className="absolute top-0 inset-x-0 h-[45%] bg-gradient-to-b from-black via-zinc-950/90 to-[#090909]" />

          {/* Floor gradient */}
          <div
            className="absolute bottom-0 inset-x-0 h-[55%] bg-[#080808]"
            style={{
              backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.05) 0%, transparent 60%), linear-gradient(180deg, #090909 0%, #060606 40%, #030303 100%)",
            }}
          />

          {/* Soft diffused spotlight source at the top (replaces the solid white skylight) */}
          <div
            className="absolute top-0 lg:left-[64%] left-1/2 -translate-x-1/2 w-[110vw] lg:w-[75vw] h-[30vh] pointer-events-none mix-blend-screen"
            style={{
              background: "radial-gradient(ellipse at top, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 50%, transparent 80%)",
            }}
          />

          {/* Volumetric light cone with soft blurred edges (no clip-path to prevent browser blur clipping) */}
          <div
            className="absolute top-0 lg:left-[64%] left-1/2 -translate-x-1/2 w-[100vw] lg:w-[60vw] h-[100vh] opacity-15 pointer-events-none mix-blend-screen filter blur-[24px]"
            style={{
              background: "conic-gradient(from 165deg at 50% 0%, transparent, rgba(255, 255, 255, 0.08) 10deg, rgba(255, 255, 255, 0.08) 20deg, transparent 30deg)",
              maskImage: "linear-gradient(to bottom, black 0%, rgba(0, 0, 0, 0.2) 50%, transparent 85%)",
              WebkitMaskImage: "linear-gradient(to bottom, black 0%, rgba(0, 0, 0, 0.2) 50%, transparent 85%)",
            }}
          />


        </div>

        {/* Background Artwork Fade */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-40">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeEvent.id}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 0.08, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="absolute inset-0 grayscale filter blur-[50px] pointer-events-none"
            >
              {activeEvent.poster ? (
                <Image
                  src={activeEvent.poster}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="100vw"
                  priority
                />
              ) : (
                <div className="absolute inset-0 bg-[#0a0a0a]" />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Columns Grid Layout */}
        <div className="relative z-10 w-full max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-x-12 gap-y-6 lg:gap-y-12 items-center flex-1">

          {/* Block 1: Header info (NENEZ presenta & Description) */}
          <div className="order-1 lg:col-span-5 flex flex-col justify-center text-left select-none relative z-20">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500">
              NENEZ presenta
            </p>

            {/* Dynamic Big Artist Name with elegant AnimatePresence transition */}
            <AnimatePresence mode="wait">
              <motion.h1
                key={activeEvent.id}
                initial={{ opacity: 0, y: 35, rotateX: 12 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                exit={{ opacity: 0, y: -35, rotateX: -12 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="mt-2 text-7xl md:text-8xl font-black uppercase leading-none tracking-tighter text-white"
              >
                {activeEvent.lineup && activeEvent.lineup.length > 0 ? activeEvent.lineup.join(" / ") : activeEvent.title}
              </motion.h1>
            </AnimatePresence>

            {/* Luxury descriptive subtitle */}
            <p className="text-zinc-400 text-xs mt-2 max-w-sm leading-relaxed">
              Eventos temáticos que combinan DJ sets, visuales inmersivos y una producción inspirada en la esencia de tu artista favorito.
            </p>

            {/* Bar & Drinks Menu button (displayed on desktop screens) */}
            <div className="hidden lg:flex gap-4 pt-6">
              <div className="relative p-[2px] rounded-full overflow-hidden bg-zinc-950 flex items-center justify-center shadow-[0_0_20px_rgba(225,0,117,0.2)] hover:shadow-[0_0_30px_rgba(225,0,117,0.4)] transition-all duration-300 group">
                {/* Línea giratoria */}
                <div className="absolute inset-[-150%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_35%,#e10075_50%,transparent_65%)] pointer-events-none" />
                
                <button
                  type="button"
                  onClick={() => setShowDrinksModal(true)}
                  className="relative z-10 flex h-[44px] px-7 items-center justify-center rounded-full bg-zinc-950 text-[9px] font-black uppercase tracking-[0.2em] text-white hover:bg-white hover:text-black transition-all duration-300 cursor-pointer active:scale-95"
                >
                  Bar & Carta de Bebidas
                </button>
              </div>
            </div>
          </div>

          {/* Block 2: 3D Stage & Carousel */}
          <div className="order-2 lg:col-span-7 lg:row-span-2 relative h-[520px] md:h-[600px] lg:h-[680px] xl:h-[760px] 2xl:h-[800px] w-full flex items-center justify-center overflow-visible">

            {/* Circular Concrete Stage Platform */}
            <div
              className="absolute bottom-[5%] lg:bottom-[4%] left-1/2 -translate-x-1/2 w-[550px] lg:w-[680px] xl:w-[780px] 2xl:w-[850px] h-[160px] lg:h-[200px] xl:h-[230px] pointer-events-none z-0"
              style={{ perspective: 1000 }}
            >
              {/* Dark rim thickness shadow */}
              <div className="absolute inset-0 bg-black/90 blur-xl rounded-full translate-y-4" />
              {/* Concrete edge rim */}
              <div className="absolute inset-x-[15px] bottom-0 h-6 bg-[#040404] border-b border-zinc-900 rounded-full" />
              {/* Platform top face */}
              <div
                className="absolute inset-0 bg-gradient-to-b from-zinc-800 to-[#080808] border border-white/5 rounded-full"
                style={{
                  transform: "rotateX(72deg) translateZ(0)",
                }}
              />
              {/* Subtle light rim highlight */}
              <div
                className="absolute inset-[3px] bg-transparent border border-white/10 rounded-full"
                style={{
                  transform: "rotateX(72deg) translateZ(1px)",
                }}
              />
            </div>

            {/* The 3D Carousel component */}
            <div id="tickets-stage" className="relative z-10 w-full h-full flex items-center justify-center overflow-visible">
              <EventTicketCarousel
                events={events as any}
                activeIndex={activeIndex}
                setActiveIndex={setActiveIndex}
                onBuy={onBuy}
                onViewDetails={onViewDetails}
                isTicketPulse={isTicketPulse}
                onInactiveClick={triggerInactiveToast}
              />
            </div>

          </div>

          {/* Mobile Bar & Drinks Menu button (displayed under event cards on mobile screens) */}
          <div className="order-2 lg:hidden flex justify-center w-full pt-2 pb-2 relative z-30">
            <div className="relative p-[2px] rounded-full overflow-hidden bg-zinc-950 flex items-center justify-center shadow-[0_0_20px_rgba(225,0,117,0.2)] active:scale-95 transition-all duration-300 group">
              {/* Línea giratoria */}
              <div className="absolute inset-[-150%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_35%,#e10075_50%,transparent_65%)] pointer-events-none" />
              
              <button
                type="button"
                onClick={() => setShowDrinksModal(true)}
                className="relative z-10 flex h-[44px] px-7 items-center justify-center rounded-full bg-zinc-950 text-[9px] font-black uppercase tracking-[0.2em] text-white hover:bg-white hover:text-black transition-all duration-300 cursor-pointer active:scale-95"
              >
                Bar & Carta de Bebidas
              </button>
            </div>
          </div>

          {/* Block 3: Upcoming Event Details */}
          <div className="order-3 lg:col-span-5 flex flex-col justify-center text-left select-none space-y-4 lg:pt-0 pt-6 relative z-20">
            <div className="space-y-4">
              <p className="text-[8px] font-black tracking-[0.3em] text-zinc-500 uppercase">
                Próximo Evento
              </p>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-white">
                  {nextEvent.title}
                </h2>
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
                  {nextEvent.subtitle}
                </p>
              </div>

              {/* Event Location & Date info */}
              <div className="flex flex-wrap gap-2 text-zinc-300">
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[8px] font-black uppercase tracking-widest">
                  {nextEvent.dateLabel}
                </span>
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[8px] font-black uppercase tracking-widest">
                  {nextEvent.city}
                </span>
              </div>

              {/* Lineup tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {nextEvent.lineup.map((artist) => (
                  <span
                    key={artist}
                    className="rounded-full border border-white/15 bg-white/[0.03] px-2.5 py-1 text-[7px] font-black uppercase tracking-[0.2em] text-zinc-300"
                  >
                    {artist}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* ACCESS & INFORMATION SECTION (Side-by-side desktop layout) */}
      <section
        id="access"
        className="relative z-20 mx-auto w-full max-w-[1600px] px-4 py-16 sm:px-6 md:px-12 lg:px-16"
      >
        <div className="grid gap-8 grid-cols-1 lg:grid-cols-2">

          {/* Card 1: Protected Access */}
          <div
            className="relative overflow-hidden rounded-[32px] border border-white/10 bg-black/45 p-5 backdrop-blur-2xl sm:p-7 lg:p-9 shadow-2xl flex flex-col justify-start gap-8"
            style={{ boxShadow: "0 24px 90px rgba(255, 255, 255, 0.01)" }}
          >
            {/* Soft static monochrome lighting vignette details */}
            <div className="pointer-events-none absolute -right-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-white/[0.01] blur-3xl" />
            <div className="pointer-events-none absolute -left-24 bottom-0 h-52 w-52 rounded-full bg-white/[0.005] blur-3xl" />

            <div className="relative z-10 flex flex-col justify-center">
              <p className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.3em] text-white">
                {config.accessSection.badge}
              </p>
              <h2 className="mt-4 text-3xl font-black uppercase leading-[0.9] tracking-[-0.05em] text-white sm:text-4xl">
                {config.accessSection.headingLine1}
                <br />
                {config.accessSection.headingLine2}
              </h2>
              <p className="mt-5 inline-flex items-center text-xl font-black uppercase tracking-[-0.03em] text-white">
                {config.accessSection.qrSubtitle}
              </p>
              <p className="mt-5 max-w-lg text-sm leading-7 text-zinc-400">
                {config.accessSection.description}
              </p>
            </div>

            <div className="relative z-10 grid grid-cols-3 gap-2 sm:gap-3 w-full">
              {config.accessSection.steps.map((data) => (
                <article
                  key={data.step}
                  className="rounded-[16px] sm:rounded-[24px] border border-white/[0.07] bg-zinc-950/40 p-3 sm:p-5 shadow-[0_12px_32px_rgba(0,0,0,0.4)] transition duration-300 hover:border-white/20 hover:bg-white/[0.03] hover:shadow-[0_0_30px_rgba(255,255,255,0.02)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[7px] sm:text-[8px] font-black tracking-[0.24em] text-zinc-600">
                      {data.step}
                    </span>
                  </div>
                  <h3 className="mt-4 sm:mt-8 text-xs sm:text-lg font-black uppercase text-white">{data.title}</h3>
                  <p className="mt-1 sm:mt-2 text-[8px] sm:text-[10px] leading-normal sm:leading-5 text-zinc-500">{data.copy}</p>
                </article>
              ))}
            </div>
          </div>

          {/* Card 2: Ticket Recovery */}
          <TicketRecovery embedded pulse={isRecoveryPulse} className="hero-reveal h-full" />

        </div>
      </section>

      <OutfitBuilderSection />

      {showFarewell && (
        <PurchaseFarewell name={farewellName} onComplete={() => { setShowFarewell(false); setFarewellName(""); }} />
      )}

      <AIChatbot />
      <StaffModal isOpen={isStaffModalOpen} onClose={() => setIsStaffModalOpen(false)} />

      {/* Premium Toast/Alert for Inactive/Upcoming Events */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 50, scale: 0.95, x: "-50%" }}
            animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
            exit={{ opacity: 0, y: 20, scale: 0.95, x: "-50%" }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="fixed bottom-24 left-1/2 z-[9999] flex items-center gap-3 px-5 py-3 rounded-full bg-zinc-950/90 border border-white/10 backdrop-blur-md max-w-md w-[calc(100%-2rem)] sm:w-auto"
            style={{
              boxShadow: "0 20px 50px rgba(0,0,0,0.9), 0 0 20px rgba(255,255,255,0.02)",
            }}
          >
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-white border border-white/15">
              <LockKeyhole className="h-2.5 w-2.5" />
            </div>
            <span className="text-[10px] font-bold tracking-wide text-zinc-200 text-left leading-tight">
              {toast.message}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Monochromatic minimalist footer */}
      <footer
        id="support"
        className="relative z-10 -mx-4 border-t border-white/[0.04] px-4 py-16 sm:-mx-8 sm:px-6 md:-mx-14 md:px-12 lg:-mx-20 lg:px-16 backdrop-blur-xl"
        style={{
          background: "linear-gradient(to bottom, transparent 0%, rgba(39, 39, 42, 0.08) 50%, rgba(255, 255, 255, 0.02) 100%), radial-gradient(circle at bottom, rgba(255, 255, 255, 0.04) 0%, transparent 80%)",
        }}
      >
        <div className="mx-auto flex w-full max-w-[1600px] flex-col items-center text-center gap-4">
          {/* Logo brand */}
          <div className="flex items-center gap-3 select-none mb-2">
            <svg
              className="h-6 w-auto select-none"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Two pink dots */}
              <circle cx="15" cy="31" r="10" fill="#e10075" />
              <circle cx="15" cy="69" r="10" fill="#e10075" />
              {/* White lowercase n arch */}
              <path
                d="M 50.5,71 L 50.5,48 A 19,19 0 0 1 88.5,48 L 88.5,71"
                stroke="#ffffff"
                strokeWidth="16"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="flex items-center text-[22px] font-semibold font-quicksand lowercase tracking-normal leading-none select-none">
              <span className="text-white">now</span>
              <span style={{ color: "#e10075" }}>tickets</span>
            </span>
          </div>

          <p className="text-xl font-black uppercase tracking-[0.4em] text-white/90">
            {config.footer.brand}
          </p>
          <a
            href={`https://mail.google.com/mail/?view=cm&fs=1&to=${config.footer.email}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-2 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 backdrop-blur-md transition hover:border-white/[0.2] hover:bg-white/[0.08] hover:text-white"
          >
            {config.footer.email}
          </a>
          <p className="mt-2 text-[8px] font-bold tracking-wider text-zinc-600">
            {config.footer.copyright}
          </p>

          {/* DevEc Signature */}
          <div className="mt-8 flex flex-col items-center gap-1 opacity-35 hover:opacity-85 transition-opacity duration-300 select-none">
            <span className="text-[6px] font-black tracking-[0.25em] text-zinc-600 uppercase">Desarrollado por</span>
            <div className="flex flex-col items-center">
              <svg className="h-[18px] w-auto" viewBox="0 0 110 35" fill="none" xmlns="http://www.w3.org/2000/svg">
                <text x="0" y="25" fill="#ffffff" fontSize="22" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="-0.02em">Dev</text>
                <text x="41" y="25" fill="#ffffff" fontSize="22" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="-0.02em">E</text>
                <text x="56" y="25" fill="#ffffff" fontSize="22" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="-0.02em">c</text>
                {/* Waving flag tail */}
                <path d="M70 20 C78 20, 80 10, 92 10 C96 10, 98 14, 102 12" stroke="#FFDD00" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M70 23 C78 23, 80 13, 92 13 C96 13, 98 17, 102 15" stroke="#0033A0" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M70 26 C78 26, 80 16, 92 16 C96 16, 98 20, 102 18" stroke="#D52B1E" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
              <span className="text-[6px] font-black tracking-[0.3em] text-zinc-500 uppercase mt-0.5">
                SOFTWARE DEVELOPMENT
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Purchasing Access Modal Dialog */}
      <div
        className={`fixed inset-0 z-[350] flex items-end md:items-center justify-center transition-all duration-300 ${
          isTicketModalOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{
          backdropFilter: showDetailOverlay ? "none" : "blur(24px)",
          background: showDetailOverlay
            ? "transparent"
            : isTicketModalOpen
            ? "rgba(0, 0, 0, 0.88)"
            : "transparent",
        }}
      >
        <motion.div
          animate={isTicketModalOpen ? { y: 0, opacity: 1 } : { y: 60, opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          drag="y"
          dragControls={checkoutDragControls}
          dragListener={false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0.05, bottom: 0.85 }}
          onDragEnd={(event, info) => {
            if (info.offset.y > 150 || info.velocity.y > 500) {
              if (accessDropRef.current?.isSuccess) {
                setFarewellName(accessDropRef.current.firstName);
                setShowFarewell(true);
                accessDropRef.current?.reset();
                setShowDetailOverlay(false);
              }
              setIsTicketModalOpen(false);
              setCheckoutState("register");
            }
          }}
          className={`relative w-full h-[96dvh] transition-all duration-500 overflow-hidden flex flex-col rounded-t-[32px] md:rounded-[36px] border border-white/[0.07] bg-gradient-to-b from-zinc-900 via-zinc-950 to-black shadow-[0_-20px_80px_rgba(0,0,0,0.8)] md:shadow-[0_40px_120px_rgba(0,0,0,0.9)] md:mx-4 ${
            checkoutState === "success" || checkoutState === "verifying"
              ? "md:max-w-[460px] md:h-[580px]"
              : "md:max-w-[860px] md:h-[96vh]"
          }`}
        >
          {/* Drag handle — mobile only */}
          <div
            className="md:hidden flex justify-center pt-3 pb-3 shrink-0 cursor-grab active:cursor-grabbing touch-none"
            onPointerDown={(e) => checkoutDragControls.start(e)}
          >
            <div className="h-1.5 w-12 rounded-full bg-white/20" />
          </div>

          <button
            onClick={() => {
              if (accessDropRef.current?.isSuccess) {
                setFarewellName(accessDropRef.current.firstName);
                setShowFarewell(true);
                accessDropRef.current?.reset();
                setShowDetailOverlay(false);
              }
              setIsTicketModalOpen(false);
              setCheckoutState("register");
            }}
            aria-label="Cerrar compra"
            className="absolute right-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/70 text-white/60 transition hover:text-white hover:border-white/25"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Scrollable form content */}
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <AccessDrop
              ref={accessDropRef}
              onFarewell={(name) => {
                setFarewellName(name);
                setShowFarewell(true);
                setShowDetailOverlay(false);
              }}
              onClose={() => {
                setIsTicketModalOpen(false);
                setCheckoutState("register");
              }}
              onStateChange={(state) => setCheckoutState(state)}
              event={selectedCarouselEvent}
            />
          </div>
        </motion.div>
      </div>

      {/* Premium Cinematic Event Detail Overlay */}
      <AnimatePresence>
        {showDetailOverlay && (
          <EventDetailOverlay
            event={selectedCarouselEvent}
            allEvents={events}
            onClose={() => setShowDetailOverlay(false)}
            onBuy={(event) => {
              onBuy(event);
            }}
            onSelectEvent={(event) => {
              onSelectRelatedEvent(event);
              setSelectedCarouselEvent(event);
            }}
            onOpenDrinks={() => setShowDrinksModal(true)}
            isCheckoutOpen={isTicketModalOpen}
          />
        )}
      </AnimatePresence>

      {/* Drinks & Bar Menu Modal */}
      <DrinksMenuModal
        isOpen={showDrinksModal}
        onClose={() => setShowDrinksModal(false)}
        eventName={selectedCarouselEvent?.title || activeEvent.title}
        venueName={selectedCarouselEvent?.venue || activeEvent.venue}
        drinks={selectedCarouselEvent?.drinks || activeEvent?.drinks}
      />

      {/* Hidden agent modules menu */}
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
              className="relative flex w-full max-w-sm flex-col items-center rounded-[40px] border border-white/[0.08] bg-white/[0.03] p-10 text-center backdrop-blur-2xl" style={{ boxShadow: "0 0 80px rgba(255,255,255,0.02)" }}
            >
              <button
                type="button"
                onClick={() => setShowHiddenMenu(false)}
                className="absolute left-5 top-5 z-10 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-[8px] font-black uppercase tracking-wider text-zinc-400 transition hover:border-white/20 hover:text-white"
              >
                Volver
              </button>

              <div className="mb-5 mt-8">
              </div>
              <h2 className="text-2xl font-black uppercase tracking-[0.15em] text-white">System Access</h2>
              <p className="mb-8 mt-2 text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-500">
                Selecciona el módulo
              </p>

              <div className="flex w-full flex-col gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowHiddenMenu(false);
                    setIsStaffModalOpen(true);
                  }}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-[11px] font-black uppercase tracking-wider text-zinc-300 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
                >
                  Agente Staff
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowHiddenMenu(false);
                    router.push("/admin");
                  }}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-[11px] font-black uppercase tracking-wider text-zinc-300 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
                >
                  Admin
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Styled overridden stylesheet for total monochromatic consistency */}
      <style dangerouslySetInnerHTML={{
        __html: `
        :root {
          --theme-primary: ${theme.primary};
          --theme-primary-rgb: ${primaryRgb};
          --theme-primary-light: ${theme.primaryLight};
          --theme-primary-dark: ${theme.primaryDark};
          --theme-bg-tint: rgba(255,255,255,0.04);
          --theme-bg-glow: rgba(255,255,255,0.01);
          --theme-bg-glow-dark: rgba(255,255,255,0.01);
          --theme-bg-accent: rgba(255,255,255,0.04);
          --theme-bg-grid: rgba(255,255,255,0.02);
          --theme-btn-from: ${theme.btnFrom};
          --theme-btn-to: ${theme.btnTo};
          --theme-btn-shadow: ${theme.btnShadow};
          --theme-glow-intense: ${theme.glowIntense};
          --theme-border-accent: ${theme.borderRgba};
          --theme-border-accent-light: rgba(255,255,255,0.12);
          --theme-border-accent-xlight: rgba(255,255,255,0.06);
          --theme-glow-rgba: ${theme.glowRgba};
          --theme-text-accent: ${theme.textAccent};
          --theme-text-rgb: ${primaryRgb};
          --theme-badge-bg: ${theme.badgeBg};
          --theme-card-border: ${theme.cardBorder};
          --theme-card-shadow: ${theme.cardShadow};
          --theme-hover-glow: ${theme.hoverGlow};
          --theme-bg-pink-500: rgba(255,255,255,0.08);
          --theme-bg-pink-500-hover: rgba(255,255,255,0.14);
          --theme-tag-bg: ${theme.tagBg};
        }
        .theme-btn { background: #ffffff !important; color: #000000 !important; }
        .theme-btn:hover { background: #e4e4e7 !important; }
        .theme-text { color: #ffffff !important; }
        .theme-border { border-color: rgba(255,255,255,0.08) !important; }
        .theme-border-light { border-color: rgba(255,255,255,0.12) !important; }
        .theme-border-xlight { border-color: rgba(255,255,255,0.06) !important; }
        .theme-glow { box-shadow: 0 0 40px rgba(255,255,255,0.02) !important; }
        .theme-badge { background: #27272a !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.1) !important; }
        .theme-tag { background: rgba(255,255,255,0.05) !important; color: #e4e4e7 !important; }
        .theme-glow-sm { box-shadow: 0 0 24px rgba(255,255,255,0.02); }
        .theme-ring { box-shadow: 0 0 28px rgba(255,255,255,0.05); }
        .text-pink-100, .text-pink-50 { color: #ffffff !important; }
        .text-pink-300 { color: #e4e4e7 !important; }
        .hover\\:text-pink-300:hover { color: #ffffff !important; }
        .border-pink-300\\/25 { border-color: rgba(255,255,255,0.08) !important; }
        .border-pink-200\\/35, .border-pink-200\\/25, .border-pink-200\\/20, .border-pink-200\\/18, .border-pink-200\\/16 { border-color: rgba(255,255,255,0.08) !important; }
        .border-pink-300\\/35 { border-color: rgba(255,255,255,0.12) !important; }
        .border-pink-300\\/20 { border-color: rgba(255,255,255,0.08) !important; }
        .border-pink-300\\/[0.08] { border-color: rgba(255,255,255,0.06) !important; }
        .hover\\:border-pink-300\\/45:hover { border-color: rgba(255,255,255,0.2) !important; }
        .hover\\:border-pink-400\\/30:hover, .hover\\:border-pink-300\\/25:hover, .hover\\:border-pink-500\\/30:hover { border-color: rgba(255,255,255,0.15) !important; }
        .bg-pink-500\\/10 { background: rgba(255,255,255,0.04) !important; }
        .bg-pink-500\\/15 { background: rgba(255,255,255,0.06) !important; }
        .bg-pink-500\\/18 { background: rgba(255,255,255,0.08) !important; }
        .bg-pink-500\\/20 { background: rgba(255,255,255,0.1) !important; }
        .bg-pink-500\\/14, .bg-pink-500\\/16 { background: rgba(255,255,255,0.05) !important; }
        .bg-pink-500\\/[0.08] { background: rgba(255,255,255,0.04) !important; }
        .bg-pink-500\\/[0.055] { background: rgba(255,255,255,0.03) !important; }
        .bg-pink-500\\/12 { background: rgba(255,255,255,0.05) !important; }
        .bg-pink-500 { background: #ffffff !important; color: #000000 !important; }
        .hover\\:bg-pink-500\\/15:hover { background: rgba(255,255,255,0.08) !important; }
        .hover\\:bg-pink-500\\/20:hover { background: rgba(255,255,255,0.12) !important; }
        .hover\\:bg-pink-500\\/10:hover { background: rgba(255,255,255,0.06) !important; }
        .hover\\:bg-pink-400:hover { background: #e4e4e7 !important; }
        .bg-pink-400 { background: #ffffff !important; }
        .text-pink-200 { color: #a1a1aa !important; }
        .text-pink-400 { color: #ffffff !important; }
        .hover\\:bg-pink-100:hover { background: rgba(255,255,255,0.06) !important; }
        .bg-pink-600\\/20 { background: rgba(255,255,255,0.05) !important; }
        .bg-pink-300 { background: #ffffff !important; }
        .bg-pink-300\\/60 { background: rgba(255,255,255,0.4) !important; }
        .border-pink-300\\/15 { border-color: rgba(255,255,255,0.08) !important; }
        .border-pink-300\\/\\[0\\.12\\] { border-color: rgba(255,255,255,0.08) !important; }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes ticket-glow-pulse {
          0%, 100% {
            box-shadow: 0 40px 100px rgba(0,0,0,0.85), 0 0 30px rgba(225,0,117,0.2), inset 0 1px 0 rgba(255,255,255,0.15) !important;
            border-color: rgba(255,255,255,0.18) !important;
          }
          50% {
            box-shadow: 0 40px 100px rgba(0,0,0,0.85), 0 0 65px rgba(225,0,117,0.7), 0 0 100px rgba(225,0,117,0.35), inset 0 1px 0 rgba(225,0,117,0.4) !important;
            border-color: rgba(225,0,117,0.6) !important;
          }
        }
        .ticket-pulse-active {
          animation: ticket-glow-pulse 1.2s ease-in-out infinite !important;
        }
      `}} />
    </main>
  );
}
