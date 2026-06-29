"use client";

/**
 * EventDetailOverlay — Premium cinematic full-screen event detail experience.
 * NENEZ Platform — Designed to feel like Apple keynote × Awwwards editorial.
 */

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  MapPin,
  Calendar,
  Clock,
  Tag,
  Users,
  Music,
  Globe,
  ShoppingBag,
  ChevronRight,
  ChevronLeft,
  Ticket,
  Shield,
  ExternalLink,
} from "lucide-react";
import type { Event } from "@/frontend/types/domain";
import { CAROUSEL_EVENTS } from "@/frontend/components/EventTicketCarousel";

interface EventDetailOverlayProps {
  event: Event;
  allEvents: Event[];
  onClose: () => void;
  onBuy: (event: Event) => void;
  onSelectEvent: (event: Event) => void;
}

const ROLE_ORDER = ["Headliner", "Supporting", "Guest", "DJ", "Live Act", "Surprise"] as const;

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const map = {
    available: { label: "Disponible", cls: "border-white/20 bg-white/[0.06] text-white" },
    "sold-out": { label: "Agotado", cls: "border-red-500/30 bg-red-950/40 text-red-400" },
    "coming-soon": { label: "Próximamente", cls: "border-white/10 bg-white/[0.03] text-zinc-400" },
  };
  const s = map[status as keyof typeof map] || map.available;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[8px] font-black uppercase tracking-[0.25em] ${s.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status === "available" ? "bg-white animate-pulse" : status === "sold-out" ? "bg-red-400" : "bg-zinc-500"}`} />
      {s.label}
    </span>
  );
}

function SocialIcon({ platform }: { platform: string }) {
  const icons: Record<string, React.ReactNode> = {
    instagram: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
      </svg>
    ),
    tiktok: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.07a8.16 8.16 0 0 0 4.77 1.52V7.14a4.85 4.85 0 0 1-1-.45z"/>
      </svg>
    ),
    spotify: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
      </svg>
    ),
    appleMusic: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.997 6.124a9.23 9.23 0 0 0-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 0 0-1.877-.726 10.496 10.496 0 0 0-1.564-.15c-.04-.003-.083-.01-.124-.013H5.988c-.152.01-.303.017-.455.026C4.786.07 4.043.15 3.34.428 2.004.958 1.04 1.88.475 3.208a4.98 4.98 0 0 0-.35 1.58c-.06.737-.068 1.473-.07 2.21v9.56c.002.76.01 1.518.064 2.275.047.664.165 1.313.448 1.92.596 1.287 1.591 2.152 2.967 2.519a5.9 5.9 0 0 0 1.44.195c.498.022.995.032 1.492.033h11.42c.5-.001.997-.01 1.496-.035a7.68 7.68 0 0 0 1.52-.215c1.358-.367 2.33-1.21 2.93-2.47.243-.521.356-1.08.415-1.65.07-.73.086-1.463.086-2.197V8.49c0-.79-.008-1.577-.063-2.366zm-8.754 10.23c-.226 0-.451.01-.676-.035-.518-.103-.935-.522-1.039-1.042a2.437 2.437 0 0 1-.03-.406c-.001-2.31-.001-4.618.001-6.928 0-.11.017-.222.045-.33.12-.455.48-.765.946-.798.37-.025.74-.014 1.113.016.555.045 1.004.437 1.15.98a2.33 2.33 0 0 1 .066.573c.007 1.57.007 3.14.003 4.71-.003.792.003 1.583-.005 2.374a1.39 1.39 0 0 1-.047.344c-.14.52-.59.866-1.126.895-.135.008-.27.002-.4-.354zm-3.688-6.72a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0z"/>
      </svg>
    ),
    youtube: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
    website: <Globe className="h-4 w-4" />,
  };
  return icons[platform] || <ExternalLink className="h-4 w-4" />;
}

function SocialLabel({ platform }: { platform: string }) {
  const labels: Record<string, string> = {
    instagram: "Instagram",
    tiktok: "TikTok",
    spotify: "Spotify",
    appleMusic: "Apple Music",
    youtube: "YouTube",
    website: "Website",
  };
  return <>{labels[platform] || platform}</>;
}

export default function EventDetailOverlay({
  event,
  allEvents,
  onClose,
  onBuy,
  onSelectEvent,
}: EventDetailOverlayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [activeMerchIdx, setActiveMerchIdx] = useState(0);
  const relatedEvents = allEvents.filter((e) => e.id !== event.id);

  const handleGoToMerch = () => {
    onClose();
    setTimeout(() => {
      document.getElementById("wear")?.scrollIntoView({ behavior: "smooth" });
    }, 150);
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => setScrolled(el.scrollTop > 60);
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, []);

  // Group lineup by role
  const groupedLineup = (event.detailedLineup || []).reduce(
    (acc, artist) => {
      if (!acc[artist.role]) acc[artist.role] = [];
      acc[artist.role]!.push(artist);
      return acc;
    },
    {} as Record<string, NonNullable<typeof event.detailedLineup>>
  );

  const sortedRoles = ROLE_ORDER.filter((r) => groupedLineup[r]?.length);
  const hasMerch = event.merch && event.merch.length > 0;
  const hasSchedule = event.schedule && event.schedule.length > 0;
  const hasSocials =
    event.socialLinks &&
    Object.values(event.socialLinks).some((v) => v);
  const hasImportantInfo = event.importantInfo && event.importantInfo.length > 0;

  const overlayTransition = {
    hidden: { opacity: 0, y: 40, scale: 0.99 as number },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1 as number,
    },
    exit: {
      opacity: 0,
      y: 40,
      scale: 0.99 as number,
    },
  };

  return (
    <motion.div
      key="event-detail-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[300] flex items-end md:items-center justify-center"
      style={{ backdropFilter: "blur(24px)", background: "rgba(0,0,0,0.88)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={overlayTransition.hidden}
        animate={overlayTransition.visible}
        exit={overlayTransition.exit}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative w-full h-[96dvh] md:h-[96vh] md:max-w-[860px] overflow-hidden flex flex-col rounded-t-[32px] md:rounded-[36px] bg-[#060606]"
        style={{
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 -20px 80px rgba(0,0,0,0.8), 0 60px 180px rgba(0,0,0,0.95)",
        }}
      >
        {/* Drag handle — mobile only */}
        <div className="md:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>
        {/* Sticky close button — always on top */}
        <button
          onClick={onClose}
          aria-label="Cerrar detalle"
          className={`absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${
            scrolled
              ? "bg-black/90 border border-white/15 shadow-lg"
              : "bg-black/50 border border-white/10"
          } text-white/70 hover:text-white hover:border-white/30 hover:bg-black/80`}
        >
          <X className="h-4 w-4" />
        </button>

        {/* Scrollable content */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto no-scrollbar"
          style={{ scrollBehavior: "smooth" }}
        >
          {/* ─── HERO ─── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative h-[52vw] min-h-[280px] max-h-[400px] w-full overflow-hidden"
          >
            <Image
              src={event.poster}
              alt={event.title}
              fill
              sizes="860px"
              className="object-cover grayscale brightness-50 scale-105"
              priority
            />
            {/* Cinematic gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#060606] via-[#060606]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#060606]/40 via-transparent to-transparent" />

            {/* Hero text */}
            <div className="absolute bottom-0 left-0 right-0 p-8">
              {event.organizer && (
                <p className="text-[8px] font-black uppercase tracking-[0.45em] text-zinc-500 mb-2">
                  {event.organizer} presenta
                </p>
              )}
              <h1 className="text-4xl sm:text-5xl font-black uppercase leading-none tracking-tighter text-white">
                {event.title}
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-zinc-400 mt-1.5">
                {event.subtitle}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <StatusBadge status={event.status} />
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[8px] font-black uppercase tracking-[0.2em] text-zinc-300">
                  {event.dateLabel}
                </span>
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[8px] font-black uppercase tracking-[0.2em] text-zinc-300">
                  {event.city}
                </span>
                {event.time && (
                  <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[8px] font-black uppercase tracking-[0.2em] text-zinc-300">
                    {event.time}
                  </span>
                )}
              </div>
            </div>
          </motion.div>

          {/* ─── MAIN CONTENT ─── */}
          <div className="px-6 sm:px-8 pb-16 space-y-10 mt-2">

            {/* ─── EVENT INFORMATION CARDS ─── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.07, ease: "easeOut" }}>
              <SectionLabel>Información del Evento</SectionLabel>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-4">
                {[
                  { icon: <Tag className="h-3.5 w-3.5" />, label: "Evento", value: event.title },
                  { icon: <Users className="h-3.5 w-3.5" />, label: "Artista Principal", value: event.detailedLineup?.find(a => a.role === "Headliner")?.name || event.lineup[0] },
                  { icon: <Calendar className="h-3.5 w-3.5" />, label: "Fecha", value: event.dateLabel },
                  { icon: <Clock className="h-3.5 w-3.5" />, label: "Hora", value: event.time || "Por confirmar" },
                  { icon: <MapPin className="h-3.5 w-3.5" />, label: "Ciudad", value: event.city },
                  { icon: <MapPin className="h-3.5 w-3.5" />, label: "Venue", value: event.venue || "Por confirmar" },
                  { icon: <Music className="h-3.5 w-3.5" />, label: "Categoría", value: event.category || "Urban" },
                  { icon: <Shield className="h-3.5 w-3.5" />, label: "Edad", value: event.ageRestriction || "18+" },
                  { icon: <Ticket className="h-3.5 w-3.5" />, label: "Estado", value: event.status === "available" ? "Disponible" : event.status === "sold-out" ? "Agotado" : "Próximamente" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04]"
                  >
                    <div className="flex items-center text-zinc-600 mb-2 group-hover:text-zinc-400 transition-colors">
                      <span className="text-[7px] font-black uppercase tracking-[0.25em]">{item.label}</span>
                    </div>
                    <p className="text-[11px] font-black text-white uppercase tracking-wide leading-tight truncate">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>



            {/* ─── LINEUP ─── */}
            {sortedRoles.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.21, ease: "easeOut" }}>
                <SectionLabel>Lineup</SectionLabel>
                <div className="mt-4 space-y-5">
                  {sortedRoles.map((role) => (
                    <div key={role}>
                      <p className="text-[8px] font-black uppercase tracking-[0.35em] text-zinc-600 mb-3">{role}</p>
                      <div className="flex flex-wrap gap-3">
                        {groupedLineup[role]!.map((artist) => (
                          <div
                            key={artist.name}
                            className="group flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3 transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.05]"
                          >
                            {artist.image && (
                              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10">
                                <Image
                                  src={artist.image}
                                  alt={artist.name}
                                  fill
                                  sizes="40px"
                                  className="object-cover grayscale"
                                />
                              </div>
                            )}
                            <div>
                              <p className="text-[11px] font-black text-white uppercase tracking-wide">
                                {artist.name}
                              </p>
                              <p className="text-[7px] font-bold text-zinc-600 uppercase tracking-widest mt-0.5">
                                {role}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ─── SCHEDULE ─── */}
            {hasSchedule && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.28, ease: "easeOut" }}>
                <SectionLabel>Horario del Evento</SectionLabel>
                <div className="mt-4 relative">
                  {/* Timeline line */}
                  <div className="absolute left-[60px] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/[0.08] to-transparent" />
                  <div className="space-y-1">
                    {event.schedule!.map((item, i) => (
                      <div key={i} className="flex items-center gap-5 py-3">
                        <span className="w-[60px] shrink-0 text-right text-[9px] font-black text-zinc-500 uppercase tracking-wider">
                          {item.time}
                        </span>
                        <div className="relative z-10 h-2 w-2 shrink-0 rounded-full bg-white/30 ring-2 ring-black ring-offset-1 ring-offset-black ml-0.5" />
                        <p className="text-[11px] font-black text-white uppercase tracking-wide">
                          {item.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}



            {/* ─── SOCIAL LINKS ─── */}
            {hasSocials && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.42, ease: "easeOut" }}>
                <SectionLabel>Links Oficiales</SectionLabel>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  {Object.entries(event.socialLinks!).map(([platform, url]) => {
                    if (!url || platform === 'spotify') return null;
                    return (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400 transition-all duration-300 hover:border-white/[0.2] hover:bg-white/[0.07] hover:text-white"
                      >
                        <span className="text-zinc-500 group-hover:text-white transition-colors">
                          <SocialIcon platform={platform} />
                        </span>
                        <SocialLabel platform={platform} />
                        <ExternalLink className="h-2.5 w-2.5 opacity-40 group-hover:opacity-80 transition-opacity" />
                      </a>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ─── MERCH CAROUSEL ─── */}
            {hasMerch && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.49, ease: "easeOut" }}>
                <div className="flex items-center justify-between mb-4">
                  <SectionLabel>Merch Oficial</SectionLabel>
                  <button
                    onClick={handleGoToMerch}
                    className="text-[8px] font-black uppercase tracking-[0.25em] text-zinc-400 hover:text-white transition-colors"
                  >
                    Ver Todo
                  </button>
                </div>
                <div className="overflow-x-auto no-scrollbar -mx-6 sm:-mx-8">
                  <div className="flex gap-3 px-6 sm:px-8">
                    {event.merch!.map((product, i) => (
                      <div
                        key={product.id}
                        className="group shrink-0 w-[160px] rounded-[20px] border border-white/[0.06] opacity-90 hover:opacity-100 hover:border-white/25 hover:shadow-[0_0_40px_rgba(255,255,255,0.04)] overflow-hidden cursor-pointer transition-all duration-400"
                        onClick={handleGoToMerch}
                      >
                        <div className="relative h-[180px] bg-zinc-900 overflow-hidden">
                          {product.image ? (
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              sizes="160px"
                              className="object-cover grayscale brightness-75 group-hover:brightness-85 transition-all duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <ShoppingBag className="h-8 w-8 text-zinc-700" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                          <div className="absolute top-2 left-2 rounded-full border border-white/10 bg-black/60 px-2 py-1 text-[7px] font-black uppercase tracking-widest text-zinc-400 backdrop-blur-md">
                            {product.category}
                          </div>
                        </div>
                        <div className="bg-[#0a0a0a] p-3 border-t border-white/[0.05]">
                          <p className="text-[9px] font-black text-white uppercase tracking-wide truncate">{product.name}</p>
                          <p className="text-[10px] font-black text-white/60 mt-0.5">{product.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── RELATED EVENTS ─── */}
            {relatedEvents.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.56, ease: "easeOut" }}>
                <SectionLabel>Otros Eventos NENEZ</SectionLabel>
                <div className="overflow-x-auto no-scrollbar -mx-6 sm:-mx-8 mt-4">
                  <div className="flex gap-3 px-6 sm:px-8">
                    {relatedEvents.map((rel) => (
                      <button
                        key={rel.id}
                        onClick={() => onSelectEvent(rel)}
                        className="group shrink-0 w-[200px] rounded-[20px] border border-white/[0.07] overflow-hidden bg-white/[0.02] transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.05] text-left"
                      >
                        <div className="relative h-[120px] overflow-hidden">
                          <Image
                            src={rel.poster}
                            alt={rel.title}
                            fill
                            sizes="200px"
                            className="object-cover grayscale brightness-50 group-hover:brightness-[0.65] group-hover:scale-105 transition-all duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <p className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-0.5">
                              {rel.dateLabel}
                            </p>
                            <p className="text-[12px] font-black text-white uppercase tracking-tight leading-none">
                              {rel.title}
                            </p>
                          </div>
                        </div>
                        <div className="p-3 border-t border-white/[0.05]">
                          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider flex items-center">
                            {rel.city}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[7px] font-black text-white/40 uppercase tracking-wider">Ver detalles</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

          </div>
        </div>

        {/* ─── STICKY BOTTOM CTA ─── */}
        <div
          className="shrink-0 flex items-center gap-3 px-6 py-4 border-t border-white/[0.06]"
          style={{ background: "rgba(6,6,6,0.95)", backdropFilter: "blur(20px)" }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-[7px] font-black uppercase tracking-[0.35em] text-zinc-600">
              {event.organizer || "NENEZ"}
            </p>
            <p className="text-[11px] font-black text-white uppercase tracking-wide truncate">
              {event.title} · {event.dateLabel}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              className="flex h-11 px-4 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400 transition hover:border-white/20 hover:text-white"
            >
              Cerrar
            </button>
            <button
              onClick={() => onBuy(event)}
              disabled={event.status === "sold-out"}
              className="flex h-11 px-6 items-center justify-center rounded-full bg-white text-[8px] font-black uppercase tracking-[0.2em] text-black transition hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {event.status === "sold-out" ? "Agotado" : "Comprar Entrada"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <p className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-600">{children}</p>
      <div className="flex-1 h-px bg-white/[0.05]" />
    </div>
  );
}
