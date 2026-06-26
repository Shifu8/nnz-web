"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import {
  MapPin,
  CalendarDays,
  Ticket,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info
} from "lucide-react";
import type { Event } from "@/frontend/types/domain";

// Extend domain Event with price and mini image for our editorial card requirements
export interface CarouselEvent extends Event {
  price: number;
  currency: string;
  miniImage: string;
  featuredImage: string;
  badge?: string;
  accentColor: string; // e.g. 'pink', 'purple', 'cyan'
  useFullBackground?: boolean;
}

interface EventTicketCarouselProps {
  onBuy: (event: Event) => void;
  onViewDetails: (event: Event) => void;
  isTicketPulse?: boolean;
}

export const CAROUSEL_EVENTS: CarouselEvent[] = [
  {
    id: "trap-loud",
    title: "TRAP LOUD",
    subtitle: "YAN BLOCK EXPERIENCE",
    city: "San Juan",
    dateLabel: "18 JUN 2026",
    startsAt: "2026-06-18T21:00:00-05:00",
    poster: "/images/yan_block_card_bg.png",
    featuredImage: "/images/yan_block_card_bg.png",
    miniImage: "/images/yan_block_artist_1779161408288.png",
    lineup: ["Yan Block", "ROA", "Omar Courtz", "y más"],
    price: 10,
    currency: "USD",
    badge: "LIVE PICK",
    accentColor: "#ff0066",
    useFullBackground: true,
    description: "La escena subterránea cobra vida. Trap latino oscuro, bajo retumbante y energía inagotable. Luces rojas, beats pesados y acceso estricto."
  },
  {
    id: "dawg-night",
    title: "DAWG NIGHT",
    subtitle: "OMAR COURTZ EXPERIENCE",
    city: "Miami",
    dateLabel: "15 AGO 2026",
    startsAt: "2026-08-15T22:00:00-05:00",
    poster: "/images/omar_courtz_card_bg.jpg",
    featuredImage: "/images/omar_courtz_card_bg.jpg",
    miniImage: "/images/omar_courtz_artist_1779161689015.png",
    lineup: ["Omar Courtz", "Anuel AA", "y más"],
    price: 15,
    currency: "USD",
    badge: "TRENDING NOW",
    accentColor: "#6d5dfc",
    useFullBackground: true,
    description: "Voz única y flows de la calle. Autenticidad reggaetonera premium en una atmósfera diseñada para vivirse al máximo."
  },
  {
    id: "urban-drop",
    title: "URBAN DROP",
    subtitle: "RAUW & BAD BUNNY",
    city: "Medellín",
    dateLabel: "10 DIC 2026",
    startsAt: "2026-12-10T20:00:00-05:00",
    poster: "/images/rauw_alejandro_card_bg.png",
    featuredImage: "/images/rauw_alejandro_card_bg.png",
    miniImage: "/images/roa_artist_1779161704881.png",
    lineup: ["Bad Bunny", "Rauw Alejandro", "y más"],
    price: 20,
    currency: "USD",
    badge: "VIP CHOICE",
    accentColor: "#00b4d8",
    useFullBackground: true,
    description: "Energía sin límites y orgullo latino. Una experiencia masiva, brillante y premium que redefine la fiesta urbana underground a gran escala."
  }
];

export default function EventTicketCarousel({
  onBuy,
  onViewDetails,
  isTicketPulse = false
}: EventTicketCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Sync index based on scroll position (handles touch swipes on mobile natively)
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const scrollLeft = container.scrollLeft;
    const item = container.querySelector('[data-carousel-item]');
    if (!item) return;
    const itemWidth = item.clientWidth;
    const gap = 24; // matches gap-6 (24px)
    const newIndex = Math.round(scrollLeft / (itemWidth + gap));
    if (newIndex >= 0 && newIndex < CAROUSEL_EVENTS.length) {
      setActiveIndex(newIndex);
    }
  };

  const scrollTo = (index: number) => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const item = container.querySelector('[data-carousel-item]');
    if (!item) return;
    const itemWidth = item.clientWidth;
    const gap = 24; // matches gap-6 (24px)
    
    container.scrollTo({
      left: index * (itemWidth + gap),
      behavior: "smooth"
    });
    setActiveIndex(index);
  };

  const handlePrev = () => {
    const nextIndex = activeIndex === 0 ? CAROUSEL_EVENTS.length - 1 : activeIndex - 1;
    scrollTo(nextIndex);
  };

  const handleNext = () => {
    const nextIndex = activeIndex === CAROUSEL_EVENTS.length - 1 ? 0 : activeIndex + 1;
    scrollTo(nextIndex);
  };

  return (
    <div className="relative w-full flex flex-col pt-3 pb-8">
      {/* Editorial top section labels */}
      <div className="flex justify-between items-center mb-4 px-2 select-none">
        <p className="text-[10px] font-black uppercase tracking-[0.34em] text-zinc-500 hover:text-white transition">
          TOP TRENDING
        </p>
        <p className="text-[10px] font-black uppercase tracking-[0.34em] text-zinc-500 hover:text-white transition">
          LIVE PICK
        </p>
      </div>

      {/* Carousel container with Desktop arrows */}
      <div className="relative group/carousel flex items-center justify-center">
        {/* Left Arrow (Desktop only) */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Anterior evento"
          className="absolute -left-5 lg:-left-12 z-40 hidden md:flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/60 backdrop-blur-md transition hover:border-white/30 hover:bg-black/80 hover:text-white active:scale-95"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        {/* Horizontal Snap Scroll container */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex w-full overflow-x-auto snap-x snap-mandatory scroll-smooth hide-scrollbar gap-6 pb-2"
          style={{ scrollbarWidth: "none" }}
        >
          {CAROUSEL_EVENTS.map((event, idx) => {
            const isCurrent = idx === activeIndex;
            return (
              <div
                key={event.id}
                data-carousel-item
                className="snap-center shrink-0 w-full select-none"
              >
                {/* Premium Editorial Ticket Card */}
                <div
                  className={`relative w-full min-h-[420px] sm:min-h-[460px] overflow-hidden rounded-[32px] border transition-all duration-500 ${
                    isCurrent 
                      ? isTicketPulse 
                        ? "border-[var(--theme-primary-light)] scale-[1.01]" 
                        : "border-white/25" 
                      : "border-white/10"
                  } ${event.useFullBackground ? "bg-black/35" : "bg-gradient-to-br from-[#0c0a15]/95 via-[#0e0c1a]/95 to-[#16122d]/80"}`}
                  style={{
                    boxShadow: isCurrent
                      ? `0 24px 60px rgba(0,0,0,0.65), 0 0 45px rgba(${event.accentColor === "#ff0066" ? "255,0,102" : event.accentColor === "#6d5dfc" ? "109,93,252" : "0,180,216"}, 0.18)`
                      : "none"
                  }}
                >
                  {/* Subtle Grain Overlay */}
                  <div className="pointer-events-none absolute inset-0 bg-repeat bg-[url('data:image/svg+xml,%3Csvg%20viewBox=%220%200%20200%20200%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter%20id=%22noiseFilter%22%3E%3CfeTurbulence%20type=%22fractalNoise%22%20baseFrequency=%220.75%22%20numOctaves=%223%22%20stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect%20width=%22100%25%22%20height=%22100%25%22%20filter=%22url(%23noiseFilter)%22%20opacity=%220.015%22/%3E%3C/svg%3E')] opacity-50" />

                  {/* Backdrop blur effect */}
                  <div className="absolute inset-0 backdrop-blur-3xl -z-10" />

                  {/* Glowing background circles for visual depth */}
                  <div 
                    className="absolute -right-20 -bottom-20 h-72 w-72 rounded-full blur-[90px] opacity-25 transition-all duration-700" 
                    style={{ background: event.accentColor }}
                  />
                  <div 
                    className="absolute left-1/3 top-1/4 h-56 w-56 rounded-full blur-[100px] opacity-10" 
                    style={{ background: event.accentColor }}
                  />

                  {/* Dynamic card background representation */}
                  {event.useFullBackground ? (
                    <div className="absolute inset-0 pointer-events-none -z-10">
                      <Image
                        src={event.featuredImage}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 100vw, 800px"
                        className="object-cover"
                        priority={idx === 0}
                      />
                      {/* Highlight mask overlay to keep text highly readable on narrow screens */}
                      <div className="absolute inset-0 bg-black/45 sm:bg-black/10" />
                    </div>
                  ) : (
                    /* Large Artist Image (Right side blend) */
                    <div className="absolute top-0 right-0 h-full w-[46%] sm:w-[48%] pointer-events-none hidden sm:block -z-10">
                      <div className="relative h-full w-full">
                        <Image
                          src={event.featuredImage}
                          alt={event.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 360px"
                          className="object-cover object-center"
                        />
                        {/* Gradient overlay to seamlessly blend artist photo with dark card background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-[#0c0a15] via-[#0c0a15]/90 via-[#0c0a15]/45 to-transparent" />
                      </div>
                    </div>
                  )}

                  {/* Main content grid (Left aligned) */}
                  <div className="relative z-10 flex flex-col justify-between h-full min-h-[420px] sm:min-h-[460px] p-6 sm:p-8 sm:w-[58%]">
                    {/* Top Row: Mini Avatar + Dynamic Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 sm:h-14 sm:w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black shadow-md">
                          <Image
                            src={event.miniImage}
                            alt=""
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-[7px] font-black uppercase tracking-[0.24em] text-zinc-500">
                            {event.badge || "FEATURED EVENT"}
                          </p>
                          <p className="text-[10px] font-black text-white/95 uppercase tracking-wider mt-0.5">
                            DAWGS SHOWCASE
                          </p>
                        </div>
                      </div>
                      
                      {/* Pricing Tag */}
                      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 text-center backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                        <p className="text-sm font-black leading-none text-white">${event.price}</p>
                        <p className="mt-0.5 text-[5px] font-black uppercase tracking-widest text-zinc-500">{event.currency}</p>
                      </div>
                    </div>

                    {/* Middle Section: Titles + Info badges */}
                    <div className="mt-5 space-y-3.5">
                      <div>
                        <h3 className="text-3xl sm:text-4xl font-black uppercase leading-none tracking-[-0.05em] text-white">
                          {event.title}
                        </h3>
                        <p 
                          className="mt-1.5 text-[9px] font-black uppercase tracking-[0.24em]"
                          style={{ color: event.accentColor }}
                        >
                          {event.subtitle}
                        </p>
                      </div>

                      {/* Event location & date badges */}
                      <div className="flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.04] px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.16em] text-zinc-200">
                          <MapPin className="h-3 w-3 text-zinc-400" />
                          {event.city}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.04] px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.16em] text-zinc-200">
                          <CalendarDays className="h-3 w-3 text-zinc-400" />
                          {event.dateLabel}
                        </span>
                      </div>

                      {/* Lineup */}
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {event.lineup.map((artist) => (
                          <span
                            key={artist}
                            className="rounded-full border border-white/5 bg-white/[0.02] px-2 py-0.5 text-[6.5px] font-bold uppercase tracking-[0.12em] text-zinc-400"
                          >
                            {artist}
                          </span>
                        ))}
                      </div>

                      {/* Editorial fine print description */}
                      <p className="text-[9px] sm:text-[10px] leading-relaxed text-zinc-400 max-w-sm">
                        Tu entrada empieza aquí: diseño, registro, Gmail y pago. Si no llega, recupérala con tu correo.
                      </p>
                    </div>

                    {/* Bottom Section: Action buttons */}
                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => onViewDetails(event)}
                        className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] text-[8px] font-black uppercase tracking-[0.18em] text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                      >
                        <Info className="h-3 w-3 shrink-0" />
                        Ver evento
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => onBuy(event)}
                        className="group/buy inline-flex h-11 items-center justify-between rounded-xl bg-white px-4 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.18em] text-black shadow-lg transition hover:bg-zinc-200"
                      >
                        <span>Comprar</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/buy:translate-x-1" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Arrow (Desktop only) */}
        <button
          type="button"
          onClick={handleNext}
          aria-label="Siguiente evento"
          className="absolute -right-5 lg:-right-12 z-40 hidden md:flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/60 backdrop-blur-md transition hover:border-white/30 hover:bg-black/80 hover:text-white active:scale-95"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center gap-2 mt-4">
        {CAROUSEL_EVENTS.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => scrollTo(idx)}
            aria-label={`Ir al evento ${idx + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === activeIndex
                ? "w-6 bg-white"
                : "w-1.5 bg-white/20 hover:bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
