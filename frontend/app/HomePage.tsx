/**
 * Autor: Brandon Medina
 * Fecha: 2026
 * Descripción: Homepage DAWGS para presentar el próximo show y vender entradas.
 */

"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  Clock3,
  Disc3,
  LockKeyhole,
  MapPin,
  MessageCircle,
  Music2,
  Radio,
  ShieldCheck,
  Sparkles,
  Ticket,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Atmosphere from "@/frontend/components/Atmosphere";
import AnimatedHeading from "@/frontend/components/AnimatedHeading";
import AIChatbot from "@/frontend/components/AIChatbot";
import AccessDrop from "@/frontend/features/access-drop/AccessDrop";
import TicketRecovery from "@/frontend/features/access-drop/TicketRecovery";
import MerchTeaser from "@/frontend/features/merch/MerchTeaser";
import StaffModal from "@/frontend/features/staff/StaffModal";
import { gsap, useGSAP } from "@/frontend/animations/gsapSetup";
import { events as fallbackEvents } from "@/frontend/services/dawgsData";
import { useCountdown } from "@/frontend/hooks/useCountdown";
import type { Event } from "@/frontend/types/domain";

const TICKET_PRICE = 10;

const HOME_NAV_ITEMS = [
  { id: "show", label: "Show" },
  { id: "tickets", label: "Entradas" },
  { id: "access", label: "Acceso" },
] as const;

type Cover = {
  src: string;
  label: string;
  className: string;
  rotation: number;
  delay: number;
};

const ARTISTS = [
  { first: "Yan", second: "Block", gradient: "from-pink-200 via-pink-500 to-fuchsia-700" },
  { first: "Omar", second: "Courtz", gradient: "from-blue-200 via-blue-400 to-purple-600" },
  { first: "ROA", second: "", gradient: "from-amber-200 via-amber-400 to-orange-600" },
];

const FEATURED_SPONSORS = [
  { initials: "KS", name: "Kyoto Sushi" },
  { initials: "IA", name: "Iron Athletics" },
] as const;

const SHOW_COVERS: Record<string, Cover[]> = {
  "trap-loud": [
    {
      src: "/images/covers/que-vas-hacer-hoy.jpg",
      label: "Qué Vas Hacer Hoy",
      className: "left-[1%] top-[12%] w-[4.7rem] sm:w-24 lg:-left-[10%] lg:top-[16%] lg:w-28",
      rotation: -12,
      delay: 0,
    },
    {
      src: "/images/covers/me-gustas-cc.jpg",
      label: "Me Gustas CC",
      className: "right-[1%] top-[20%] w-[4.4rem] sm:w-24 lg:-right-[6%] lg:top-[12%] lg:w-28",
      rotation: 10,
      delay: 0.3,
    },
    {
      src: "/images/covers/666.jpg",
      label: "666",
      className: "right-[3%] top-[52%] w-20 sm:w-24 lg:-right-[11%] lg:top-[48%] lg:w-32",
      rotation: 13,
      delay: 0.55,
    },
    {
      src: "/images/covers/talento.jpg",
      label: "Talento",
      className: "left-[2%] top-[55%] w-[4.4rem] sm:w-24 lg:-left-[13%] lg:top-[50%] lg:w-28",
      rotation: -8,
      delay: 0.8,
    },
    {
      src: "/images/covers/444.jpg",
      label: "444",
      className: "right-[19%] bottom-[4%] w-[4.4rem] sm:w-20 lg:right-[4%] lg:bottom-[1%] lg:w-24",
      rotation: -9,
      delay: 1.05,
    },
    {
      src: "/images/covers/vacile.jpg",
      label: "Vacile",
      className: "left-[18%] bottom-[5%] w-[4.4rem] sm:w-20 lg:left-[2%] lg:bottom-[3%] lg:w-24",
      rotation: 11,
      delay: 1.3,
    },
  ],
};

export default function HomePage() {
  const router = useRouter();
  const scope = useRef<HTMLElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [events, setEvents] = useState<Event[]>(fallbackEvents);
  const [activeSection, setActiveSection] = useState("show");
  const [showHiddenMenu, setShowHiddenMenu] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isHowToBuyOpen, setIsHowToBuyOpen] = useState(false);
  const [isTicketPulse, setIsTicketPulse] = useState(false);
  const [artistIndex, setArtistIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setArtistIndex((i) => (i + 1) % ARTISTS.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const featuredEvent = events[0] ?? fallbackEvents[0];
  const featuredCovers = SHOW_COVERS[featuredEvent.id] ?? [];
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
      const scrollPosition = window.scrollY + 160;
      for (const item of HOME_NAV_ITEMS) {
        const section = document.getElementById(item.id);
        if (!section) continue;
        if (
          scrollPosition >= section.offsetTop &&
          scrollPosition < section.offsetTop + section.offsetHeight
        ) {
          setActiveSection(item.id);
          break;
        }
      }
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

          gsap.to(".hero-ring", {
            rotation: 360,
            repeat: -1,
            duration: 24,
            ease: "none",
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

  const scrollToTicketCard = () => {
    setIsHowToBuyOpen(false);
    document.getElementById("tickets")?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => {
      setIsTicketPulse(true);
      window.setTimeout(() => setIsTicketPulse(false), 2600);
    }, 650);
  };

  return (
    <main ref={scope} className="relative min-h-screen overflow-x-hidden bg-black text-white">
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
              <span className="relative h-10 w-10 overflow-hidden rounded-full border border-pink-300/25 bg-black shadow-[0_0_28px_rgba(255,0,102,0.18)] sm:h-11 sm:w-11">
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
              <a
                key={item.id}
                href={`#${item.id}`}
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
              </a>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => setIsHowToBuyOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-pink-300/25 bg-pink-500/10 px-4 text-[9px] font-black uppercase tracking-[0.18em] text-pink-100 transition hover:border-pink-300/45 hover:bg-pink-500/20"
          >
            <Ticket className="h-3.5 w-3.5" />
            Comprar
          </button>
        </div>
      </header>

      <section
        id="show"
        className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[1600px] flex-col overflow-hidden px-4 pb-8 pt-24 sm:px-6 md:px-12 lg:px-16 lg:pb-10"
      >
        <div aria-hidden className="absolute inset-0 -z-20 overflow-hidden rounded-b-[44px] border-x border-b border-white/[0.05] bg-[#08070b]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(255,31,111,0.24),transparent_29%),radial-gradient(circle_at_16%_56%,rgba(120,0,70,0.20),transparent_30%),radial-gradient(circle_at_88%_40%,rgba(0,183,255,0.08),transparent_24%),linear-gradient(180deg,#09070d_0%,#10050d_52%,#060607_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_78%)]" />
          <div className="absolute inset-x-[10%] top-[18%] h-[48%] rounded-full border border-pink-300/[0.06] shadow-[0_0_120px_rgba(255,0,102,0.16),inset_0_0_120px_rgba(255,0,102,0.05)]" />
        </div>

        <p
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[18%] -z-10 -translate-x-1/2 select-none whitespace-nowrap text-[27vw] font-black leading-none tracking-[-0.09em] text-white/[0.025] lg:top-[10%] lg:text-[19vw]"
        >
          DAWGS
        </p>

        <div className="relative grid flex-1 items-center gap-8 lg:grid-cols-12 lg:gap-4">
          <div className="hero-reveal relative z-30 order-1 pt-4 text-center lg:col-span-4 lg:pt-0 lg:text-left">
            <p className="inline-flex items-center gap-2 rounded-full border border-pink-300/20 bg-pink-500/[0.08] px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.28em] text-pink-200 backdrop-blur-xl">
              <Radio className="h-3 w-3 text-pink-400" />
              Próxima señal en vivo
            </p>
            <p className="mt-6 text-[10px] font-black uppercase tracking-[0.48em] text-zinc-500">
              DAWGS presenta
            </p>
            <div className="mt-3 h-[8rem] sm:h-[9rem] lg:h-[10rem] xl:h-[12rem] relative overflow-hidden">
              <AnimatePresence mode="wait">
                {ARTISTS.map((a, i) => i === artistIndex && (
                  <motion.h1
                    key={a.first}
                    initial={{ opacity: 0, y: 40, rotateX: 15 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    exit={{ opacity: 0, y: -40, rotateX: -15 }}
                    transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0 text-5xl font-black uppercase leading-[0.82] tracking-[-0.06em] text-white sm:text-6xl lg:text-[4rem] xl:text-[5.3rem]"
                  >
                    {a.first}
                    {a.second && <><br /><span className={`bg-gradient-to-r ${a.gradient} bg-clip-text text-transparent`}>{a.second}</span></>}
                  </motion.h1>
                ))}
              </AnimatePresence>
            </div>
            <p className="mx-auto mt-5 max-w-sm text-xs leading-6 text-zinc-400 lg:hidden">
              Trap latino, bajos pesados y una noche diseñada para sentirse cerca del artista.
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
            <div
              id="tickets"
              className={`relative mx-auto mt-7 w-full max-w-[420px] overflow-hidden rounded-[26px] border border-pink-300/25 bg-black/60 p-4 text-left shadow-[0_24px_80px_rgba(255,0,102,0.14)] backdrop-blur-2xl transition sm:p-5 lg:mx-0 ${
                isTicketPulse ? "ticket-card-pulse" : ""
              }`}
            >
              <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-pink-500/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-16 left-8 h-44 w-44 rounded-full bg-[#C8FF00]/10 blur-3xl" />

              <div className="relative z-10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="inline-flex items-center gap-2 rounded-full border border-pink-300/20 bg-pink-500/[0.08] px-3 py-1.5 text-[7px] font-black uppercase tracking-[0.2em] text-pink-200">
                      <Ticket className="h-3 w-3" />
                      Entrada oficial
                      <span className="h-1 w-1 rounded-full bg-pink-300/60" />
                      <Sparkles className="h-3 w-3" />
                      Proximo evento
                    </p>
                  </div>
                  <div className="rounded-[18px] border border-[#C8FF00]/30 bg-[#C8FF00]/10 px-3 py-2 text-center shadow-[0_0_28px_rgba(200,255,0,0.1)]">
                    <p className="text-2xl font-black leading-none text-[#C8FF00]">${TICKET_PRICE}</p>
                    <p className="mt-1 text-[6px] font-black uppercase tracking-widest text-zinc-500">USD</p>
                  </div>
                </div>

                <div className="mt-3">
                  <h3 className="text-3xl font-black uppercase leading-[0.88] tracking-[-0.05em] text-white sm:text-4xl">
                    {featuredEvent.title}
                  </h3>
                  <p className="mt-1 text-[8px] font-black uppercase tracking-[0.24em] text-pink-300">
                    {featuredEvent.subtitle}
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.18em] text-zinc-300">
                    <MapPin className="h-3 w-3 text-pink-300" />
                    {featuredEvent.city}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.18em] text-zinc-300">
                    <CalendarDays className="h-3 w-3 text-pink-300" />
                    {featuredEvent.dateLabel}
                  </span>
                </div>

                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {featuredEvent.lineup.map((artist) => (
                    <span
                      key={artist}
                      className="rounded-full border border-pink-300/15 bg-pink-500/[0.07] px-2.5 py-1 text-[7px] font-black uppercase tracking-[0.17em] text-pink-100"
                    >
                      {artist}
                    </span>
                  ))}
                </div>

                <p className="mt-2.5 text-[10px] leading-5 text-zinc-400">
                  Tu entrada empieza aqui: diseno, registro, Gmail y pago. Si no llega, recuperala con tu correo.
                </p>

                {!ticketCountdown.expired && (
                  <div className="mt-3 rounded-[22px] border border-white/10 bg-white/[0.035] p-2.5">
                    <p className="mb-2 flex items-center gap-2 text-[7px] font-black uppercase tracking-[0.22em] text-zinc-500">
                      <Clock3 className="h-3 w-3 text-pink-300" />
                      Tiempo para el evento
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
                          className="rounded-xl border border-white/[0.06] bg-black/45 px-1 py-1.5 text-center"
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
                  <p className="mr-1 text-[7px] font-black uppercase tracking-[0.2em] text-zinc-500">
                    Con apoyo de
                  </p>
                  {FEATURED_SPONSORS.map((sponsor) => (
                    <span
                      key={sponsor.name}
                      className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-pink-300/15 bg-pink-500/[0.06] px-2 py-1"
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

                <button
                  type="button"
                  onClick={() => setIsTicketModalOpen(true)}
                  className={`ticket-buy-button mt-3 inline-flex h-[50px] w-full items-center justify-between rounded-2xl bg-white px-5 text-[9px] font-black uppercase tracking-[0.2em] text-black transition hover:bg-pink-200 ${
                    isTicketPulse ? "ticket-button-pulse" : ""
                  }`}
                >
                  Comprar entrada
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="order-2 lg:col-span-8">
            <div className="relative mx-auto h-[390px] w-full max-w-[640px] sm:h-[520px] lg:h-[620px]">
              <div className="hero-ring absolute left-1/2 top-1/2 h-[78%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-pink-200/[0.09]" />
              <div className="absolute left-1/2 top-1/2 h-[60%] w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-500/20 blur-[90px]" />
              <div className="absolute inset-x-[16%] bottom-[8%] h-[14%] rounded-full bg-pink-600/20 blur-[50px]" />

              {featuredCovers.map((cover) => (
                <div
                  key={cover.label}
                  className={`album-orbit absolute z-20 ${cover.className}`}
                  style={{
                    transform: `rotate(${cover.rotation}deg)`,
                    animationDelay: `${cover.delay}s`,
                  }}
                >
                  <div className="group relative aspect-square overflow-hidden rounded-[18px] border border-white/15 bg-black shadow-[0_18px_46px_rgba(0,0,0,0.68),0_0_28px_rgba(255,0,102,0.14)]">
                    <Image
                      src={cover.src}
                      alt={cover.label}
                      fill
                      sizes="132px"
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
                  sizes="(max-width: 1024px) 100vw, 640px"
                  className="object-contain object-bottom drop-shadow-[0_0_42px_rgba(255,39,132,0.28)]"
                />
              </div>
            </div>
          </div>
        </div>

      </section>

      <section
        id="access"
        className="relative z-10 mx-auto w-full max-w-[1600px] px-4 pb-20 sm:px-6 md:px-12 lg:px-16 lg:pb-28"
      >
        <div className="overflow-hidden rounded-[34px] border border-white/[0.08] bg-white/[0.025] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-8 lg:p-12">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-pink-300/20 bg-pink-500/[0.08] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.3em] text-pink-300">
                <Ticket className="h-3.5 w-3.5" />
                Tu entrada empieza aqui
              </p>
              <h2 className="mt-4 text-4xl font-black uppercase leading-[0.9] tracking-[-0.05em] text-white sm:text-5xl">
                Acceso
                <br />
                protegido.
              </h2>
              <p className="mt-5 inline-flex items-center gap-2 text-xl font-black uppercase tracking-[-0.03em] text-white">
                <LockKeyhole className="h-5 w-5 text-pink-300" />
                Un QR. Una entrada.
              </p>
              <p className="mt-5 max-w-lg text-sm leading-7 text-zinc-400">
                Tu pase se valida una sola vez en puerta. No compartas capturas ni reenvíes el
                código antes del show.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  icon: Ticket,
                  step: "01",
                  title: "Compra",
                  copy: "Completa el flujo y sube tu comprobante.",
                },
                {
                  icon: MessageCircle,
                  step: "02",
                  title: "Recibe",
                  copy: "Tu entrada llega por Gmail y WhatsApp confirma la compra.",
                },
                {
                  icon: ShieldCheck,
                  step: "03",
                  title: "Entra",
                  copy: "El staff escanea tu QR oficial una sola vez. Usado = bloqueado, así evitamos fraudes y reventa.",
                },
              ].map(({ icon: Icon, step, title, copy }) => (
                <article
                  key={step}
                  className="rounded-[24px] border border-white/[0.07] bg-black/35 p-5 transition hover:border-pink-300/20 hover:bg-pink-500/[0.035]"
                >
                  <div className="flex items-center justify-between">
                    <Icon className="h-5 w-5 text-pink-400" />
                    <span className="text-[8px] font-black tracking-[0.24em] text-zinc-600">{step}</span>
                  </div>
                  <h3 className="mt-8 text-lg font-black uppercase text-white">{title}</h3>
                  <p className="mt-2 text-[10px] leading-5 text-zinc-500">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <TicketRecovery />

      {events.length > 1 && (
        <section className="relative z-10 mx-auto w-full max-w-[1600px] px-4 pb-20 sm:px-6 md:px-12 lg:px-16 lg:pb-28">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.36em] text-zinc-500">Después de Yan Block</p>
              <h2 className="mt-2 text-2xl font-black uppercase text-white sm:text-3xl">Próximas señales</h2>
            </div>
            <Disc3 className="h-6 w-6 text-pink-400" />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {events.slice(1, 4).map((event) => (
              <article
                key={event.id}
                className="group relative min-h-[260px] overflow-hidden rounded-[26px] border border-white/[0.08] bg-black"
              >
                <Image
                  src={event.poster || "/images/trap_loud_trio_artists.png"}
                  alt={event.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover object-top opacity-65 grayscale transition duration-700 group-hover:scale-105 group-hover:opacity-80 group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="text-[8px] font-black uppercase tracking-[0.28em] text-pink-300">
                    {event.dateLabel} · {event.city}
                  </p>
                  <h3 className="mt-2 text-2xl font-black uppercase text-white">{event.title}</h3>
                  <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-400">
                    {event.subtitle}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <footer className="relative z-10 border-t border-white/[0.06] px-4 py-14 sm:px-6 md:px-12 lg:px-16">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col items-center text-center gap-4">
          <p className="text-lg font-black uppercase tracking-[0.34em] text-white">DAWGS</p>
          <p className="text-[9px] uppercase tracking-[0.24em] text-zinc-600">Live shows · official access · wear</p>
          <a
            href="https://mail.google.com/mail/?view=cm&fs=1&to=soporte.dawgs@gmail.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-400 transition hover:text-white"
          >
            soporte.dawgs@gmail.com
          </a>
          <p className="mt-2 text-[8px] font-bold tracking-wider text-zinc-600">© 2026 DAWGS. Todos los derechos reservados.</p>
        </div>
      </footer>

      <MerchTeaser />
      <AIChatbot />
      <StaffModal isOpen={isStaffModalOpen} onClose={() => setIsStaffModalOpen(false)} />

      <AnimatePresence>
        {isHowToBuyOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[145] flex items-center justify-center bg-black/75 p-4 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.95, y: 18 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 18 }}
              className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-white/[0.08] bg-[#070508] p-6 shadow-[0_30px_120px_rgba(255,0,102,0.12)]"
            >
              <button
                type="button"
                onClick={() => setIsHowToBuyOpen(false)}
                aria-label="Cerrar guia"
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xs font-black text-white/60 transition hover:text-white"
              >
                X
              </button>

              <div className="relative z-10">
                <p className="inline-flex items-center gap-2 rounded-full border border-pink-300/20 bg-pink-500/[0.08] px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.28em] text-pink-200">
                  <Ticket className="h-3 w-3" />
                  Como comprar
                </p>
                <h2 className="mt-5 text-3xl font-black uppercase leading-[0.9] tracking-[-0.04em] text-white">
                  Tres pasos
                  <br />
                  y listo.
                </h2>

                <div className="mt-6 space-y-3">
                  {[
                    ["01", "Baja al boton", "Busca la tarjeta Entrada oficial."],
                    ["02", "Elige diseno", "Escoge el estilo de tu entrada."],
                    ["03", "Sube el pago", "Registra tus datos y comprobante."],
                  ].map(([step, title, copy]) => (
                    <div
                      key={step}
                      className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-black/40 px-4 py-3"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-pink-300/20 bg-pink-500/[0.08] text-[9px] font-black text-pink-200">
                        {step}
                      </span>
                      <span>
                        <span className="block text-sm font-black uppercase text-white">{title}</span>
                        <span className="mt-0.5 block text-[10px] leading-4 text-zinc-500">{copy}</span>
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={scrollToTicketCard}
                  className="mt-6 inline-flex h-12 w-full items-center justify-between rounded-2xl bg-white px-4 text-[9px] font-black uppercase tracking-[0.2em] text-black transition hover:bg-pink-200"
                >
                  Ir a comprar
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                onClick={() => setIsTicketModalOpen(false)}
                aria-label="Cerrar compra"
                className="absolute right-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/70 text-xs font-black text-white/60 transition hover:text-white"
              >
                X
              </button>
              <AccessDrop />
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
              className="relative flex w-full max-w-sm flex-col items-center rounded-[40px] border border-white/[0.08] bg-white/[0.03] p-10 text-center shadow-[0_0_80px_rgba(255,0,102,0.08)] backdrop-blur-2xl"
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
        @keyframes ticketCardPulse {
          0%, 100% {
            border-color: rgba(249, 168, 212, 0.25);
            box-shadow: 0 28px 100px rgba(255, 0, 102, 0.16);
          }
          50% {
            border-color: rgba(255, 111, 188, 0.9);
            box-shadow: 0 0 0 5px rgba(255, 79, 163, 0.15), 0 30px 120px rgba(255, 0, 128, 0.34);
          }
        }
        @keyframes ticketButtonPulse {
          0%, 100% {
            background: #ffffff;
            color: #000000;
            box-shadow: none;
          }
          50% {
            background: #ff6fbc;
            color: #12020b;
            box-shadow: 0 0 0 6px rgba(255, 79, 163, 0.18), 0 0 46px rgba(255, 79, 163, 0.34);
          }
        }
      `}} />
    </main>
  );
}
