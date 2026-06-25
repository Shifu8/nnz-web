/**
 * Autor: Brandon Medina
 * Fecha: 2026
 * Descripción: Homepage DAWGS para presentar el próximo show y vender entradas.
 */

"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  Clock3,
  KeyRound,
  LockKeyhole,
  MapPin,
  MessageCircle,
  Music2,
  Navigation,
  Radio,
  Share2,
  ShieldCheck,
  Sparkles,
  Ticket,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Atmosphere from "@/frontend/components/Atmosphere";
import AnimatedHeading from "@/frontend/components/AnimatedHeading";
import AIChatbot from "@/frontend/components/AIChatbot";
import PurchaseFarewell from "@/frontend/components/PurchaseFarewell";
import AccessDrop, { type AccessDropHandle } from "@/frontend/features/access-drop/AccessDrop";
import TicketRecovery from "@/frontend/features/access-drop/TicketRecovery";
import OutfitBuilderSection from "@/frontend/features/merch/OutfitBuilderSection";
import StaffModal from "@/frontend/features/staff/StaffModal";
import { gsap, useGSAP } from "@/frontend/animations/gsapSetup";
import { events as fallbackEvents } from "@/frontend/services/dawgsData";
import { useCountdown } from "@/frontend/hooks/useCountdown";
import { useHomepageConfig } from "@/frontend/hooks/useHomepageConfig";
import { getTheme, hexToRgb } from "@/lib/homepage-config/themes";
import type { ThemeColors } from "@/lib/homepage-config/themes";
import type { HomepageConfig } from "@/lib/homepage-config/types";
import type { Event } from "@/frontend/types/domain";

const HOME_NAV_ITEMS = [
  { id: "show", label: "Show" },
  { id: "access", label: "Access" },
  { id: "support", label: "Support" },
] as const;

type HomeNavId = (typeof HOME_NAV_ITEMS)[number]["id"];

interface HomePageProps {
  initialConfig: HomepageConfig;
}

const VENUE_PHOTOS = [
  "/images/trap_loud_trio_artists.png",
  "/images/trap_loud_trio_artists.png",
  "/images/trap_loud_trio_artists.png",
];

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
  const [isTicketPulse, setIsTicketPulse] = useState(false);
  const [isRecoveryPulse, setIsRecoveryPulse] = useState(false);
  const [artistIndex, setArtistIndex] = useState(0);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventPhotoIndex, setEventPhotoIndex] = useState(0);
  const { config } = useHomepageConfig(initialConfig);
  const theme: ThemeColors = getTheme(config.theme);
  const primaryRgb = hexToRgb(theme.primary);
  const themeStyle = {
    "--theme-primary": theme.primary,
    "--theme-primary-rgb": primaryRgb,
    "--theme-primary-light": theme.primaryLight,
    "--theme-primary-dark": theme.primaryDark,
    "--theme-bg-tint": `rgba(${primaryRgb}, 0.34)`,
    "--theme-bg-glow": `rgba(${primaryRgb}, 0.64)`,
    "--theme-bg-glow-dark": `rgba(${primaryRgb}, 0.5)`,
    "--theme-bg-accent": `rgba(${primaryRgb}, 0.3)`,
    "--theme-bg-grid": `rgba(${primaryRgb}, 0.12)`,
    "--theme-btn-from": theme.btnFrom,
    "--theme-btn-to": theme.btnTo,
    "--theme-btn-shadow": theme.btnShadow,
    "--theme-glow-intense": theme.glowIntense,
    "--theme-border-accent": theme.borderRgba,
    "--theme-border-accent-light": theme.borderRgba.replace("0.3", "0.18"),
    "--theme-border-accent-xlight": theme.borderRgba.replace("0.3", "0.08"),
    "--theme-glow-rgba": theme.glowRgba,
    "--theme-text-accent": theme.textAccent,
    "--theme-text-rgb": primaryRgb,
    "--theme-badge-bg": theme.badgeBg,
    "--theme-card-border": theme.cardBorder,
    "--theme-card-shadow": theme.cardShadow,
    "--theme-hover-glow": theme.hoverGlow,
    "--theme-bg-pink-500": `rgba(${primaryRgb}, 0.18)`,
    "--theme-bg-pink-500-hover": `rgba(${primaryRgb}, 0.3)`,
    "--theme-tag-bg": theme.tagBg,
    background:
      "linear-gradient(180deg, rgba(var(--theme-primary-rgb), 0.18), #040404 22%, rgba(var(--theme-primary-rgb), 0.16) 58%, #050505)",
  } as CSSProperties;

  const ARTISTS = config.hero.artistNames;

  useEffect(() => {
    const timer = setInterval(() => {
      setArtistIndex((i) => (i + 1) % ARTISTS.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [ARTISTS.length]);

  useEffect(() => {
    if (!showEventModal) return;
    const timer = setInterval(() => {
      setEventPhotoIndex((i) => (i + 1) % VENUE_PHOTOS.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [showEventModal]);

  const featuredEvent = events[0] ?? fallbackEvents[0];
  const featuredCovers = config.covers;
  const ticketCountdown = useCountdown(featuredEvent.startsAt);

  useEffect(() => {
    fetch("/api/events")
      .then((response) => response.json())
      .then((data) => {
        if (data.success && Array.isArray(data.events) && data.events.length > 0) {
          setEvents(data.events);
        }
      })
      .catch(() => {});
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
      const supportRect = supportSection?.getBoundingClientRect();
      const isNearBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 24;

      if (supportRect && (supportRect.top <= window.innerHeight * 0.82 || isNearBottom)) {
        setActiveSection("support");
        return;
      }

      const scrollPosition = window.scrollY + Math.min(window.innerHeight * 0.38, 320);
      let currentSection: HomeNavId = "show";

      for (const item of HOME_NAV_ITEMS.filter((item) => item.id !== "support")) {
        const section = document.getElementById(item.id);
        if (section && scrollPosition >= section.offsetTop) {
          currentSection = item.id;
        }
      }

      setActiveSection(currentSection);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          isDesktop: "(min-width: 1024px)",
          reduceMotion: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          const { isDesktop, reduceMotion } = context.conditions as {
            isDesktop: boolean;
            reduceMotion: boolean;
          };

          if (reduceMotion) {
            gsap.set(".hero-reveal", { autoAlpha: 1, y: 0 });
            return;
          }

          gsap
            .timeline({ defaults: { ease: "power3.out" } })
            .from(".hero-reveal", {
              autoAlpha: 0,
              y: 28,
              stagger: 0.08,
              duration: 0.85,
            })
            .from(
              ".album-orbit",
              {
                autoAlpha: 0,
                scale: 0.6,
                stagger: 0.07,
                duration: 0.65,
                ease: "back.out(1.5)",
              },
              "-=0.4",
            );

          gsap.to(".mascot-float", {
            y: isDesktop ? -18 : -10,
            rotation: isDesktop ? 1.2 : 0.6,
            repeat: -1,
            yoyo: true,
            duration: 4.8,
            ease: "sine.inOut",
          });

        },
        scope.current ?? undefined,
      );

      return () => mm.revert();
    },
    { scope },
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
    scrollToSection("tickets", "center", "show");
    window.setTimeout(() => {
      setIsTicketPulse(true);
      window.setTimeout(() => setIsTicketPulse(false), 2600);
    }, 650);
  };

  const scrollToRecovery = () => {
    scrollToSection("recovery", "center", "access");
    window.setTimeout(() => {
      setIsRecoveryPulse(true);
      window.setTimeout(() => setIsRecoveryPulse(false), 2600);
    }, 650);
  };

  return (
    <main
      ref={scope}
      className="relative min-h-screen overflow-x-hidden bg-black text-white"
      style={themeStyle}
    >
      <Atmosphere />

      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-black/35 backdrop-blur-2xl">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 px-4 py-3 sm:px-6 md:px-12 lg:px-16">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onMouseDown={handleTouchStart}
              onMouseUp={handleTouchEnd}
              onMouseLeave={handleTouchEnd}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="group flex shrink-0 select-none items-center gap-2 text-sm font-black uppercase tracking-[0.38em] text-white outline-none transition hover:text-pink-300"
              style={{ WebkitTapHighlightColor: "transparent" }}
              aria-label="DAWGS"
            >
              <span className="relative h-10 w-10 overflow-hidden rounded-full border bg-black sm:h-11 sm:w-11" style={{ borderColor: "var(--theme-border-accent)", boxShadow: "0 0 28px rgba(var(--theme-primary-rgb), 0.18)" }}>
                <Image
                  src="/images/dawgs-logo-hd.png"
                  alt=""
                  fill
                  sizes="44px"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              </span>
              <AnimatedHeading
                text="DAWGS"
                as="span"
                staggerMs={55}
                durationMs={420}
                className="hidden text-sm font-black uppercase tracking-[0.38em] text-white sm:block"
              />
            </button>
          </div>

          <nav className="hidden items-center gap-7 lg:flex">
            {HOME_NAV_ITEMS.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => {
                  scrollToSection(item.id, item.id === "show" ? "start" : "center");
                }}
                className={`relative py-2 text-[10px] font-black uppercase tracking-[0.24em] transition ${
                  activeSection === item.id ? "text-white" : "text-zinc-500 hover:text-zinc-200"
                }`}
              >
                {item.label}
                <span
                  className={`absolute inset-x-0 -bottom-0.5 h-px bg-pink-400 transition-transform duration-300 ${
                    activeSection === item.id ? "scale-x-100" : "scale-x-0"
                  }`}
                />
              </button>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={scrollToRecovery}
              className={`inline-flex h-10 items-center gap-1.5 rounded-full border border-pink-300/25 bg-white/[0.04] px-3 text-[8px] font-black uppercase tracking-[0.14em] text-pink-100 transition hover:border-pink-300/45 hover:bg-pink-500/15 sm:gap-2 sm:px-4 sm:text-[9px] sm:tracking-[0.18em] ${
                isRecoveryPulse ? "top-recovery-pulse" : ""
              }`}
            >
              <KeyRound className="h-3.5 w-3.5" />
              Recuperar
            </button>
            <button
              type="button"
              onClick={scrollToTicketCard}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-pink-300/25 bg-pink-500/10 px-3 text-[8px] font-black uppercase tracking-[0.14em] text-pink-100 transition hover:border-pink-300/45 hover:bg-pink-500/20 sm:gap-2 sm:px-4 sm:text-[9px] sm:tracking-[0.18em]"
            >
              <Ticket className="h-3.5 w-3.5" />
              Comprar
            </button>
          </div>
        </div>
      </header>

      <section
        id="show"
        className="relative z-10 flex min-h-[100svh] w-full flex-col overflow-hidden px-4 pb-8 pt-24 sm:px-8 md:px-14 lg:px-20 lg:pb-10"
      >
        <div aria-hidden className="absolute inset-0 -z-20 overflow-hidden border-b border-white/[0.05] bg-[#08070b]">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 50% 38%, rgba(var(--theme-primary-rgb), 0.34), transparent 31%), radial-gradient(circle at 16% 56%, rgba(var(--theme-primary-rgb), 0.22), transparent 32%), radial-gradient(circle at 88% 40%, rgba(var(--theme-primary-rgb), 0.16), transparent 26%), linear-gradient(180deg, #08070b 0%, rgba(var(--theme-primary-rgb), 0.14) 52%, #060607 100%)",
            }}
          />
        </div>

        <p
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[18%] -z-10 -translate-x-1/2 select-none whitespace-nowrap text-[27vw] font-black leading-none tracking-[-0.09em] text-white/[0.025] lg:top-[10%] lg:text-[19vw]"
        >
          DAWGS
        </p>

        <div className="relative grid flex-1 items-center gap-8 lg:grid-cols-12 lg:gap-4">
          <div className="contents lg:relative lg:z-30 lg:order-1 lg:col-span-5 lg:block">
            <div className="hero-reveal relative z-30 order-1 flex flex-col pt-1 text-center lg:block lg:pt-0 lg:text-left">

              <p className="mt-6 text-[11px] font-black uppercase tracking-[0.52em] text-zinc-400 sm:text-xs">
                {config.hero.tagline}
              </p>
              <div className="relative mt-3 h-[8.8rem] overflow-visible sm:h-[10.2rem] lg:h-[11.2rem] xl:h-[13.2rem]">
                <AnimatePresence mode="wait">
                  {ARTISTS.map((a, i) => i === artistIndex && (
                    <motion.h1
                      key={a.first}
                      initial={{ opacity: 0, y: 40, rotateX: 15 }}
                      animate={{ opacity: 1, y: 0, rotateX: 0 }}
                      exit={{ opacity: 0, y: -40, rotateX: -15 }}
                      transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute inset-0 text-6xl font-black uppercase leading-[0.82] tracking-[-0.06em] text-white sm:text-7xl lg:text-[5rem] xl:text-[6.4rem]"
                    >
                      {a.second ? (
                        <>
                          {a.first}
                          <br />
                          <span
                            className="inline-block bg-clip-text pr-2 text-transparent"
                            style={{
                              backgroundImage:
                                "linear-gradient(to right, var(--theme-primary-light), var(--theme-primary), var(--theme-primary-dark))",
                            }}
                          >
                            {a.second}
                          </span>
                        </>
                      ) : (
                        <span
                          className="inline-block bg-clip-text pr-2 text-transparent"
                          style={{
                            backgroundImage:
                              "linear-gradient(to right, var(--theme-primary-light), var(--theme-primary), var(--theme-primary-dark))",
                          }}
                        >
                          {a.first}
                        </span>
                      )}
                    </motion.h1>
                  ))}
                </AnimatePresence>
              </div>
              <p className="mx-auto mt-5 max-w-sm text-xs leading-6 text-zinc-400 lg:hidden">
                {config.hero.mobileDescription}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2 lg:hidden">
                {featuredEvent.lineup.slice(0, 4).map((artist) => (
                  <span
                    key={artist}
                    className="rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1 text-[7px] font-black uppercase tracking-[0.18em] text-zinc-300"
                  >
                    {artist}
                  </span>
                ))}
              </div>
            </div>
            <div
              id="tickets"
              className={`relative order-3 z-30 mx-auto mt-0 w-full max-w-[420px] overflow-hidden rounded-[26px] border border-pink-300/35 p-4 text-left opacity-100 ring-1 ring-pink-200/[0.05] transition sm:max-w-[500px] sm:p-5 lg:order-none lg:mx-0 lg:mt-8 lg:max-w-[540px] ${
                isTicketPulse ? "ticket-card-pulse" : ""
              }`}
              style={{
                background:
                  "linear-gradient(145deg, rgba(var(--theme-primary-rgb), 0.28), rgba(7,7,9,0.96) 54%, rgba(var(--theme-primary-rgb), 0.16))",
                boxShadow:
                  "0 18px 58px rgba(0,0,0,0.42), 0 0 54px rgba(var(--theme-primary-rgb),0.15), inset 0 1px 0 rgba(255,255,255,0.12)",
              }}
            >
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),transparent_42%)]" />

              <div className="relative z-10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="theme-glow-sm inline-flex items-center gap-2 rounded-full border border-pink-200/35 bg-pink-500/18 px-3 py-1.5 text-[7px] font-black uppercase tracking-[0.2em] text-pink-50">
                      <Ticket className="h-3 w-3" />
                      {config.ticketCard.badge}
                      <span className="h-1 w-1 rounded-full bg-pink-300/60" />
                      <Sparkles className="h-3 w-3" />
                      {config.ticketCard.badgeSub}
                    </p>
                  </div>
                  <div
                    className="rounded-[16px] border px-3 py-2 text-center"
                    style={{
                      borderColor: "rgba(var(--theme-primary-rgb), 0.48)",
                      background: "rgba(var(--theme-primary-rgb), 0.18)",
                      boxShadow: "0 0 34px rgba(var(--theme-primary-rgb), 0.24)",
                    }}
                  >
                    <p className="text-xl font-black leading-none text-[var(--theme-primary-light)] drop-shadow-[0_0_12px_var(--theme-primary)] sm:text-2xl">
                      ${config.ticketCard.price}
                    </p>
                    <p className="mt-1 text-[6px] font-black uppercase tracking-widest text-[var(--theme-primary-light)] opacity-70">
                      {config.ticketCard.currency}
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  <h3 className="text-3xl font-black uppercase leading-[0.88] tracking-[-0.05em] text-white drop-shadow-[0_0_18px_rgba(255,255,255,0.16)] sm:text-4xl">
                    {config.ticketCard.eventTitle}
                  </h3>
                  <p className="mt-1 text-[8px] font-black uppercase tracking-[0.24em] text-pink-200">
                    {config.ticketCard.eventSubtitle}
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-pink-200/18 bg-white/[0.08] px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.18em] text-zinc-100">
                    <MapPin className="h-3 w-3 text-pink-300" />
                    {featuredEvent.city}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-pink-200/18 bg-white/[0.08] px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.18em] text-zinc-100">
                    <CalendarDays className="h-3 w-3 text-pink-300" />
                    {featuredEvent.dateLabel}
                  </span>
                </div>

                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {featuredEvent.lineup.map((artist) => (
                    <span
                      key={artist}
                      className="rounded-full border border-pink-200/25 bg-pink-500/16 px-2.5 py-1 text-[7px] font-black uppercase tracking-[0.17em] text-pink-50"
                    >
                      {artist}
                    </span>
                  ))}
                  <a
                    href={`https://instagram.com/${config.ticketCard.daWgDj.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-blue-400/30 bg-blue-950/40 px-2.5 py-1 text-[7px] font-black uppercase tracking-[0.17em] text-blue-200 transition hover:bg-blue-900/50"
                  >
                    <Music2 className="h-2.5 w-2.5" /> {config.ticketCard.daWgDj.name}
                  </a>
                </div>

                <p className="mt-2.5 text-[9px] leading-5 text-zinc-200/90 sm:text-[10px]">
                  {config.ticketCard.description}
                </p>

                {!ticketCountdown.expired && (
                  <div className="mt-3 rounded-[22px] border border-pink-200/16 bg-black/55 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                    <p className="mb-2 flex items-center gap-2 text-[7px] font-black uppercase tracking-[0.22em] text-zinc-300">
                      <Clock3 className="h-3 w-3 text-pink-300" />
                      {config.ticketCard.countdownLabel}
                    </p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        ["days", ticketCountdown.days],
                        ["hours", ticketCountdown.hours],
                        ["minutes", ticketCountdown.minutes],
                        ["seconds", ticketCountdown.seconds],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="rounded-xl border border-white/[0.08] bg-black/70 px-1 py-1.5 text-center"
                        >
                          <p className="text-sm font-black leading-none text-white">{value}</p>
                          <p className="mt-0.5 text-[5px] font-black uppercase tracking-wider text-zinc-600">
                            {label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <p className="mr-1 text-[7px] font-black uppercase tracking-[0.2em] text-zinc-300">
                    Con apoyo de
                  </p>
                  {config.ticketCard.sponsors.map((sponsor) => (
                    <span
                      key={sponsor.name}
                      className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-pink-200/20 bg-pink-500/14 px-2 py-1"
                    >
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-pink-300/20 bg-black/40 text-[6px] font-black text-pink-100">
                        {sponsor.initials}
                      </span>
                      <span className="truncate text-[6.5px] font-black uppercase tracking-[0.1em] text-white">
                        {sponsor.name}
                      </span>
                    </span>
                  ))}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEventModal(true)}
                    className="inline-flex h-[50px] items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] text-[8px] font-black uppercase tracking-[0.2em] text-white transition hover:border-pink-400/30 hover:bg-pink-500/10 hover:text-pink-300 sm:h-[52px]"
                  >
                    <MapPin className="h-3.5 w-3.5" /> {config.ticketCard.verEventoText}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsTicketModalOpen(true)}
                    className={`ticket-buy-button inline-flex h-[50px] items-center justify-between rounded-2xl bg-white px-5 text-[9px] font-black uppercase tracking-[0.2em] text-black shadow-[0_12px_34px_rgba(255,255,255,0.12)] transition hover:bg-pink-100 sm:h-[52px] ${
                      isTicketPulse ? "ticket-button-pulse" : ""
                    }`}
                  >
                    {config.ticketCard.comprarEntradaText}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="order-2 lg:order-2 lg:col-span-7">
            <div className="relative mx-auto h-[365px] w-full max-w-[680px] sm:h-[545px] lg:h-[650px]">
              <div
                className="absolute left-1/2 top-1/2 h-[64%] w-[64%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px]"
                style={{ background: "rgba(var(--theme-primary-rgb), 0.32)" }}
              />
              <div
                className="absolute inset-x-[12%] bottom-[6%] h-[18%] rounded-full blur-[55px]"
                style={{ background: "rgba(var(--theme-primary-rgb), 0.28)" }}
              />

              {featuredCovers.map((cover) => (
                <div
                  key={cover.label}
                  className={`album-orbit absolute z-20 ${cover.className}`}
                  style={{
                    transform: `rotate(${cover.rotation}deg)`,
                    animationDelay: `${cover.delay}s`,
                  }}
                >
                  <div className="group relative aspect-square overflow-hidden rounded-[18px] border border-white/15 bg-black" style={{ boxShadow: "0 18px 46px rgba(0,0,0,0.68), 0 0 28px rgba(var(--theme-primary-rgb), 0.14)" }}>
                    <Image
                      src={cover.src}
                      alt={cover.label}
                      fill
                      sizes="144px"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                    <p className="absolute inset-x-1 bottom-2 truncate text-center text-[5.5px] font-black uppercase tracking-[0.12em] text-white/90 sm:text-[6.5px]">
                      {cover.label}
                    </p>
                  </div>
                </div>
              ))}

              <div className="mascot-float absolute inset-0 z-10">
                <Image
                  src="/images/dawgs-mascot-drink-v2.png"
                  alt="Mascota 3D de DAWGS"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 680px"
                  className="object-contain object-bottom"
                  style={{
                    filter:
                      "drop-shadow(0 0 46px rgba(var(--theme-primary-rgb), 0.38))",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div
          id="access"
          className="hero-reveal relative z-20 mt-8 overflow-hidden rounded-[32px] border border-pink-300/15 bg-black/45 p-5 backdrop-blur-2xl sm:p-7 lg:mt-10 lg:p-9" style={{ boxShadow: "0 24px 90px rgba(var(--theme-primary-rgb), 0.12)" }}
        >
          <div className="pointer-events-none absolute -left-20 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-pink-500/15 blur-3xl" />
          <div
            className="pointer-events-none absolute -right-24 bottom-0 h-64 w-64 rounded-full blur-3xl"
            style={{ background: "rgba(var(--theme-primary-rgb), 0.08)" }}
          />
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="relative z-10">
              <p className="inline-flex items-center gap-2 rounded-full border border-pink-300/20 bg-pink-500/[0.08] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.3em] text-pink-300">
                <Ticket className="h-3.5 w-3.5" />
                {config.accessSection.badge}
              </p>
              <h2 className="mt-4 text-4xl font-black uppercase leading-[0.9] tracking-[-0.05em] text-white sm:text-5xl">
                {config.accessSection.headingLine1}
                <br />
                {config.accessSection.headingLine2}
              </h2>
              <p className="mt-5 inline-flex items-center gap-2 text-xl font-black uppercase tracking-[-0.03em] text-white">
                <LockKeyhole className="h-5 w-5 text-pink-300" />
                {config.accessSection.qrSubtitle}
              </p>
              <p className="mt-5 max-w-lg text-sm leading-7 text-zinc-400">
                {config.accessSection.description}
              </p>
            </div>

            <div className="relative z-10 grid gap-3 sm:grid-cols-3">
              {[
                { icon: Ticket, data: config.accessSection.steps[0] },
                { icon: MessageCircle, data: config.accessSection.steps[1] },
                { icon: ShieldCheck, data: config.accessSection.steps[2] },
              ].map(({ icon: Icon, data }) => (
                <article
                  key={data.step}
                  className="rounded-[24px] border border-pink-300/[0.08] bg-black/45 p-5 shadow-[0_16px_46px_rgba(0,0,0,0.24)] transition hover:border-pink-300/25 hover:bg-pink-500/[0.055]"
                >
                  <div className="flex items-center justify-between">
                    <Icon className="h-5 w-5 text-pink-400" />
                    <span className="text-[8px] font-black tracking-[0.24em] text-zinc-600">{data.step}</span>
                  </div>
                  <h3 className="mt-8 text-lg font-black uppercase text-white">{data.title}</h3>
                  <p className="mt-2 text-[10px] leading-5 text-zinc-500">{data.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </div>

        <TicketRecovery embedded pulse={isRecoveryPulse} className="hero-reveal mt-5 lg:mt-7" />


      </section>

      <OutfitBuilderSection />

      {showFarewell && (
        <PurchaseFarewell name={farewellName} onComplete={() => { setShowFarewell(false); setFarewellName(""); }} />
      )}

      <AIChatbot />
      <StaffModal isOpen={isStaffModalOpen} onClose={() => setIsStaffModalOpen(false)} />

      <footer id="support" className="relative z-10 border-t border-white/[0.06] px-4 py-14 sm:px-6 md:px-12 lg:px-16">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col items-center text-center gap-4">
          <p className="text-lg font-black uppercase tracking-[0.34em] text-white">{config.footer.brand}</p>
          <p className="text-[9px] uppercase tracking-[0.24em] text-zinc-600">{config.footer.tagline}</p>
          <a
            href={`https://mail.google.com/mail/?view=cm&fs=1&to=${config.footer.email}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-400 transition hover:text-white"
          >
            {config.footer.email}
          </a>
          <p className="mt-2 text-[8px] font-bold tracking-wider text-zinc-600">{config.footer.copyright}</p>
        </div>
      </footer>

      <AnimatePresence>
        {isTicketModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="relative max-h-[92vh] w-full max-w-[980px] overflow-y-auto rounded-[34px] border border-white/[0.08] bg-black shadow-[0_30px_120px_rgba(0,0,0,0.7)]"
            >
              <button
                onClick={() => {
                  if (accessDropRef.current?.isSuccess) {
                    setFarewellName(accessDropRef.current.firstName);
                    setShowFarewell(true);
                  }
                  setIsTicketModalOpen(false);
                }}
                aria-label="Cerrar compra"
                className="absolute right-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/70 text-xs font-black text-white/60 transition hover:text-white"
              >
                X
              </button>
              <AccessDrop
                ref={accessDropRef}
                onFarewell={(name) => {
                  setFarewellName(name);
                  setShowFarewell(true);
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event info modal */}
      <AnimatePresence>
        {showEventModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[28px] border border-white/[0.08] bg-black shadow-[0_30px_120px_rgba(0,0,0,0.7)]"
            >
              <button
                onClick={() => setShowEventModal(false)}
                className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/70 text-white/60 transition hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="relative aspect-[4/3] overflow-hidden rounded-t-[28px] bg-zinc-900">
                <img
                  src={VENUE_PHOTOS[eventPhotoIndex]}
                  alt="Lugar del evento"
                  className="h-full w-full object-cover transition-opacity duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
                  {VENUE_PHOTOS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setEventPhotoIndex(i)}
                      className={`h-1.5 rounded-full transition-all ${i === eventPhotoIndex ? "w-6 bg-pink-300" : "w-1.5 bg-white/40 hover:bg-white/60"}`}
                    />
                  ))}
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-wider text-white">San Juan, Ecuador</h3>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Casa privada · Dirección confirmada al comprar</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-center">
                    <p className="text-lg">📸</p>
                    <p className="mt-1 text-[7px] font-black uppercase tracking-wider text-zinc-300">Photo spot</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-center">
                    <p className="text-lg">🎧</p>
                    <p className="mt-1 text-[7px] font-black uppercase tracking-wider text-zinc-300">Sonido envolvente</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-center">
                    <p className="text-lg">🍸</p>
                    <p className="mt-1 text-[7px] font-black uppercase tracking-wider text-zinc-300">Barra libre</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-center">
                    <p className="text-lg">🔒</p>
                    <p className="mt-1 text-[7px] font-black uppercase tracking-wider text-zinc-300">Acceso controlado</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <a
                    href="https://maps.google.com/?q=San+Juan+Ecuador"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-pink-500 text-[9px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-pink-400"
                  >
                    <Navigation className="h-4 w-4" /> Abrir en Google Maps
                  </a>
                  <button
                    onClick={() => {
                      navigator.share?.({ title: "DAWGS - TRAP LOUD", text: `${featuredEvent.title} · ${featuredEvent.dateLabel} · ${featuredEvent.city}`, url: window.location.href });
                    }}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] text-[8px] font-black uppercase tracking-[0.2em] text-zinc-300 transition hover:border-pink-400/30 hover:text-pink-300"
                  >
                    <Share2 className="h-3.5 w-3.5" /> Compartir evento
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
               className="relative flex w-full max-w-sm flex-col items-center rounded-[40px] border border-white/[0.08] bg-white/[0.03] p-10 text-center backdrop-blur-2xl" style={{ boxShadow: "0 0 80px rgba(var(--theme-primary-rgb), 0.08)" }}
            >
              <button
                type="button"
                onClick={() => setShowHiddenMenu(false)}
                className="absolute left-5 top-5 z-10 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-[8px] font-black uppercase tracking-wider text-zinc-400 transition hover:border-white/20 hover:text-white"
              >
                <ChevronLeft className="h-3 w-3" /> Volver
              </button>

              <div className="mb-5 mt-8 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.06]">
                <Zap className="h-6 w-6 text-pink-300" />
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
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-[11px] font-black uppercase tracking-wider text-zinc-300 transition hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-400"
                >
                  <Radio className="h-4 w-4" /> Agente Staff
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowHiddenMenu(false);
                    router.push("/admin");
                  }}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-[11px] font-black uppercase tracking-wider text-zinc-300 transition hover:border-pink-500/30 hover:bg-pink-500/10 hover:text-pink-300"
                >
                  <Music2 className="h-4 w-4" /> Admin
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --theme-primary: ${theme.primary};
          --theme-primary-rgb: ${primaryRgb};
          --theme-primary-light: ${theme.primaryLight};
          --theme-primary-dark: ${theme.primaryDark};
          --theme-bg-tint: rgba(${primaryRgb}, 0.34);
          --theme-bg-glow: rgba(${primaryRgb}, 0.64);
          --theme-bg-glow-dark: rgba(${primaryRgb}, 0.5);
          --theme-bg-accent: rgba(${primaryRgb}, 0.3);
          --theme-bg-grid: rgba(${primaryRgb}, 0.12);
          --theme-btn-from: ${theme.btnFrom};
          --theme-btn-to: ${theme.btnTo};
          --theme-btn-shadow: ${theme.btnShadow};
          --theme-glow-intense: ${theme.glowIntense};
          --theme-border-accent: ${theme.borderRgba};
          --theme-border-accent-light: ${theme.borderRgba.replace("0.3", "0.18")};
          --theme-border-accent-xlight: ${theme.borderRgba.replace("0.3", "0.08")};
          --theme-glow-rgba: ${theme.glowRgba};
          --theme-text-accent: ${theme.textAccent};
          --theme-text-rgb: ${primaryRgb};
          --theme-badge-bg: ${theme.badgeBg};
          --theme-card-border: ${theme.cardBorder};
          --theme-card-shadow: ${theme.cardShadow};
          --theme-hover-glow: ${theme.hoverGlow};
          --theme-bg-pink-500: rgba(var(--theme-primary-rgb), 0.18);
          --theme-bg-pink-500-hover: rgba(var(--theme-primary-rgb), 0.3);
          --theme-tag-bg: ${theme.tagBg};
        }
        .theme-btn { background: linear-gradient(135deg, var(--theme-btn-from), var(--theme-btn-to)); }
        .theme-btn:hover { box-shadow: 0 0 40px var(--theme-btn-shadow); }
        .theme-text { color: var(--theme-text-accent); }
        .theme-border { border-color: var(--theme-border-accent); }
        .theme-border-light { border-color: var(--theme-border-accent-light); }
        .theme-border-xlight { border-color: var(--theme-border-accent-xlight); }
        .theme-glow { box-shadow: 0 0 40px var(--theme-glow-rgba); }
        .theme-badge { background: var(--theme-badge-bg); }
        .theme-tag { background: var(--theme-tag-bg); }
        .theme-glow-sm { box-shadow: 0 0 24px rgba(var(--theme-primary-rgb), 0.12); }
        .theme-ring { box-shadow: 0 0 28px rgba(var(--theme-primary-rgb), 0.18); }
        .text-pink-100, .text-pink-50 { color: var(--theme-text-accent) !important; }
        .text-pink-300 { color: var(--theme-primary-light) !important; }
        .hover\\:text-pink-300:hover { color: var(--theme-primary-light) !important; }
        .border-pink-300\\/25 { border-color: var(--theme-border-accent) !important; }
        .border-pink-200\\/35, .border-pink-200\\/25, .border-pink-200\\/20, .border-pink-200\\/18, .border-pink-200\\/16 { border-color: rgba(var(--theme-primary-rgb), 0.16) !important; }
        .border-pink-300\\/35 { border-color: rgba(var(--theme-primary-rgb), 0.35) !important; }
        .border-pink-300\\/20 { border-color: var(--theme-border-accent) !important; }
        .border-pink-300\\/[0.08] { border-color: rgba(var(--theme-primary-rgb), 0.08) !important; }
        .hover\\:border-pink-300\\/45:hover { border-color: rgba(var(--theme-primary-rgb), 0.45) !important; }
        .hover\\:border-pink-400\\/30:hover, .hover\\:border-pink-300\\/25:hover, .hover\\:border-pink-500\\/30:hover { border-color: rgba(var(--theme-primary-rgb), 0.3) !important; }
        .bg-pink-500\\/10 { background: rgba(var(--theme-primary-rgb), 0.1) !important; }
        .bg-pink-500\\/15 { background: rgba(var(--theme-primary-rgb), 0.15) !important; }
        .bg-pink-500\\/18 { background: rgba(var(--theme-primary-rgb), 0.18) !important; }
        .bg-pink-500\\/20 { background: rgba(var(--theme-primary-rgb), 0.2) !important; }
        .bg-pink-500\\/14, .bg-pink-500\\/16 { background: rgba(var(--theme-primary-rgb), 0.16) !important; }
        .bg-pink-500\\/[0.08] { background: rgba(var(--theme-primary-rgb), 0.08) !important; }
        .bg-pink-500\\/[0.055] { background: rgba(var(--theme-primary-rgb), 0.055) !important; }
        .bg-pink-500\\/12 { background: rgba(var(--theme-primary-rgb), 0.12) !important; }
        .bg-pink-500 { background: var(--theme-primary) !important; }
        .hover\\:bg-pink-500\\/15:hover { background: rgba(var(--theme-primary-rgb), 0.15) !important; }
        .hover\\:bg-pink-500\\/20:hover { background: rgba(var(--theme-primary-rgb), 0.2) !important; }
        .hover\\:bg-pink-500\\/10:hover { background: rgba(var(--theme-primary-rgb), 0.1) !important; }
        .hover\\:bg-pink-400:hover { background: var(--theme-primary-light) !important; }
        .bg-pink-400 { background: var(--theme-primary) !important; }
        .text-pink-200 { color: rgba(var(--theme-primary-rgb), 0.6) !important; }
        .text-pink-400 { color: var(--theme-primary) !important; }
        .hover\\:bg-pink-100:hover { background: rgba(var(--theme-primary-rgb), 0.12) !important; }
        .bg-pink-600\\/20 { background: rgba(var(--theme-primary-rgb), 0.12) !important; }
        .bg-pink-300 { background: var(--theme-primary-light) !important; }
        .bg-pink-300\\/60 { background: rgba(var(--theme-primary-rgb), 0.35) !important; }
        .ring-pink-200\\/\\[0\\.05\\] { --tw-ring-color: rgba(var(--theme-primary-rgb), 0.05) !important; }
        .border-pink-300\\/15 { border-color: rgba(var(--theme-primary-rgb), 0.15) !important; }
        .border-pink-300\\/\\[0\\.12\\] { border-color: rgba(var(--theme-primary-rgb), 0.12) !important; }
        .bg-white\\/\\[0.04\\] { background: rgba(255,255,255,0.04) !important; }
        .album-orbit {
          animation: albumFloat 3.7s ease-in-out infinite;
        }
        .album-orbit:nth-child(even) {
          animation-delay: 0.18s;
          animation-name: albumFloatEven;
        }
        @keyframes albumFloat { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-12px) rotate(2deg); } }
        @keyframes albumFloatEven { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(12px) rotate(-2deg); } }
        .ticket-card-pulse {
          animation: ticketCardPulse 1.25s ease-in-out 2;
        }
        .ticket-button-pulse {
          animation: ticketButtonPulse 1.25s ease-in-out 2;
        }
        .recovery-card-pulse {
          animation: recoveryCardPulse 1.25s ease-in-out 2;
        }
        .recovery-button-pulse {
          animation: ticketButtonPulse 1.25s ease-in-out 2;
        }
        .top-recovery-pulse {
          animation: recoveryButtonPulse 1.25s ease-in-out 2;
        }
        @keyframes ticketCardPulse {
          0%, 100% {
            border-color: var(--theme-border-accent-light);
            box-shadow: 0 28px 100px var(--theme-card-shadow);
          }
          50% {
            border-color: var(--theme-primary-light);
            box-shadow: 0 0 0 5px var(--theme-border-accent), 0 30px 120px var(--theme-glow-rgba);
          }
        }
        @keyframes ticketButtonPulse {
          0%, 100% {
            background: #ffffff;
            color: #000000;
            box-shadow: none;
          }
          50% {
            background: rgba(var(--theme-primary-rgb), 0.7);
            color: #12020b;
            box-shadow: 0 0 0 6px var(--theme-border-accent), 0 0 46px var(--theme-glow-rgba);
          }
        }
        @keyframes recoveryCardPulse {
          0%, 100% {
            border-color: var(--theme-border-accent-xlight);
            box-shadow: 0 24px 90px var(--theme-card-shadow);
          }
          50% {
            border-color: var(--theme-primary-light);
            box-shadow: 0 0 0 5px var(--theme-border-accent-light), 0 28px 110px var(--theme-glow-rgba);
          }
        }
        @keyframes recoveryButtonPulse {
          0%, 100% {
            background: rgba(255, 255, 255, 0.04);
            color: var(--theme-text-accent);
            box-shadow: none;
          }
          50% {
            background: var(--theme-tag-bg);
            color: #ffffff;
            box-shadow: 0 0 0 6px var(--theme-border-accent), 0 0 42px var(--theme-glow-rgba);
          }
        }

      `}} />
    </main>
  );
}
