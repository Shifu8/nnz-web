"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { MapPin, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import type { Event } from "@/frontend/types/domain";

export interface CarouselEvent extends Event {
  price: number;
  currency: string;
  miniImage: string;
  featuredImage: string;
  badge?: string;
  accentColor: string;
  useFullBackground?: boolean;
}

interface EventTicketCarouselProps {
  activeIndex: number;
  setActiveIndex: (idx: number) => void;
  onBuy: (event: Event) => void;
  onViewDetails: (event: Event) => void;
  isTicketPulse?: boolean;
}

export const CAROUSEL_EVENTS: CarouselEvent[] = [
  {
    id: "trap-loud",
    title: "TRAP LOUD",
    subtitle: "YAN BLOCK EXPERIENCE",
    city: "Loja",
    dateLabel: "18 JUN 2026",
    startsAt: "2026-06-18T21:00:00-05:00",
    poster: "/images/yan_block_card_bg.png",
    featuredImage: "/images/yan_block_card_bg.png",
    miniImage: "/images/yan_block_artist_1779161408288.png",
    lineup: ["DJ OFICIAL NENEZ"],
    price: 10,
    currency: "USD",
    badge: "LIVE ACCESS",
    accentColor: "#ffffff",
    useFullBackground: true,
    description: "La escena subterránea cobra vida. Trap latino oscuro, bajo retumbante y energía inagotable. Luces de escenario crudas, beats pesados y acceso restringido.",
    // Extended editorial data
    organizer: "NENEZ",
    venue: "Venue Privado · Loja",
    time: "9:00 PM",
    category: "Trap / Urban",
    ageRestriction: "18+",
    status: "available",
    about: [
      "La escena subterránea cobra vida en una noche diseñada para los que entienden el movimiento. TRAP LOUD es más que un concierto — es una experiencia que combina trap latino oscuro, bajo retumbante y energía inagotable en un venue exclusivo.",
      "Acceso strictly limitado. Beats pesados, luces de escenario crudas y una atmósfera que no encontrarás en ningún otro lugar. Esta es la experiencia NENEZ."
    ],
    detailedLineup: [
      { name: "DJ OFICIAL NENEZ", role: "DJ", image: "/images/roa_artist_1779161704881.png" },
    ],
    schedule: [
      { time: "8:00 PM", label: "Puertas Abren" },
      { time: "9:00 PM", label: "Apertura" },
      { time: "10:30 PM", label: "Show Principal" },
      { time: "1:00 AM", label: "After Party" },
    ],
    importantInfo: [
      { icon: "🎫", title: "Entrada", description: "Presenta tu acceso digital al ingresar. No se aceptan entradas físicas." },
      { icon: "🔞", title: "Edad Mínima", description: "Evento exclusivo para mayores de 18 años. ID requerida." },
      { icon: "🔒", title: "Seguridad", description: "Revisión de seguridad en la entrada. Prohibido ingresar con objetos peligrosos." },
      { icon: "📸", title: "Fotografía", description: "Cámaras profesionales no permitidas. Teléfonos móviles bienvenidos." },
    ],
    socialLinks: {
      instagram: "https://instagram.com/yanblock",
      tiktok: "https://tiktok.com/@yanblock",
      spotify: "https://open.spotify.com/artist/yanblock",
    },
    merch: [
      { id: "tl-hoodie", name: "TRAP LOUD Hoodie", category: "Hoodie", price: "$65", image: "/images/nenez-studio-fit-front.png" },
    ],
  },
  {
    id: "dawg-night",
    title: "DAWG NIGHT",
    subtitle: "OMAR COURTZ EXPERIENCE",
    city: "Loja",
    dateLabel: "15 AGO 2026",
    startsAt: "2026-08-15T22:00:00-05:00",
    poster: "/images/omar_courtz_card_bg.jpg",
    featuredImage: "/images/omar_courtz_card_bg.jpg",
    miniImage: "/images/omar_courtz_card_bg.jpg",
    lineup: ["Omar Courtz", "Anuel AA", "y más"],
    price: 15,
    currency: "USD",
    badge: "TRENDING PRESET",
    accentColor: "#ffffff",
    useFullBackground: true,
    description: "Voz única y flows de la calle. Autenticidad reggaetonera premium en una atmósfera brutal de luz cenital diseñada para vivirse al límite.",
    // Extended editorial data
    organizer: "NENEZ",
    venue: "Venue TBA · Loja",
    time: "10:00 PM",
    category: "Reggaetón / Urban",
    ageRestriction: "18+",
    status: "coming-soon",
    about: [
      "DAWG NIGHT es la experiencia definitiva de Omar Courtz en vivo. Una noche donde la autenticidad reggaetonera se fusiona con producción de nivel mundial en un ambiente íntimo y exclusivo.",
      "Voz única, flows de la calle y una energía que solo se encuentra en los mejores shows de Loja. Acceso limitado. La lista se cierra pronto.",
    ],
    detailedLineup: [
      { name: "Omar Courtz", role: "Headliner", image: "/images/omar_courtz_card_bg.jpg" },
      { name: "Anuel AA", role: "Supporting", image: "/images/trap_loud_anuel_1778966415162.png" },
    ],
    schedule: [
      { time: "9:00 PM", label: "Puertas Abren" },
      { time: "10:00 PM", label: "Opening Act" },
      { time: "11:30 PM", label: "Omar Courtz" },
    ],
    importantInfo: [
      { icon: "🎫", title: "Entrada", description: "Acceso digital verificado. Confirmación por email." },
      { icon: "🔞", title: "Edad Mínima", description: "18+ requerido. Presentar identificación válida." },
      { icon: "🅿️", title: "Parking", description: "Estacionamiento disponible en el venue. Capacidad limitada." },
      { icon: "♿", title: "Accesibilidad", description: "Venue accesible para personas con movilidad reducida." },
    ],
    socialLinks: {
      instagram: "https://instagram.com/omarcourtz",
      tiktok: "https://tiktok.com/@omarcourtz",
      spotify: "https://open.spotify.com/artist/omarcourtz",
      youtube: "https://youtube.com/@omarcourtz",
    },
    merch: [
      { id: "dn-hoodie", name: "DAWG NIGHT Hoodie", category: "Hoodie", price: "$75", image: "/images/nenez-studio-fit-front.png" },
      { id: "dn-jersey", name: "Courtz Jersey", category: "Jersey", price: "$85", image: "/images/nenez-studio-portrait.png" },
      { id: "dn-vinyl", name: "Omar Courtz Vinyl", category: "Vinyl", price: "$45", image: "/images/nenez-studio-rack.png" },
      { id: "dn-poster", name: "DAWG NIGHT Poster", category: "Poster", price: "$25", image: "/images/nenez-studio-couch.png" },
    ],
  },
  {
    id: "urban-drop",
    title: "URBAN DROP",
    subtitle: "RAUW & BAD BUNNY",
    city: "Loja",
    dateLabel: "10 DIC 2026",
    startsAt: "2026-12-10T20:00:00-05:00",
    poster: "/images/rauw_alejandro_card_bg.png",
    featuredImage: "/images/rauw_alejandro_card_bg.png",
    miniImage: "/images/roa_artist_1779161704881.png",
    lineup: ["Bad Bunny", "Rauw Alejandro", "y más"],
    price: 20,
    currency: "USD",
    badge: "COLLECTIBLE PASS",
    accentColor: "#ffffff",
    useFullBackground: true,
    description: "Energía sin límites y orgullo latino. Una experiencia masiva, de alto contraste y estética editorial que redefine la cultura urbana a gran escala.",
    // Extended editorial data
    organizer: "NENEZ × Wave Music",
    venue: "Arena Loja",
    time: "8:00 PM",
    category: "Festival / Urban",
    ageRestriction: "All Ages",
    status: "coming-soon",
    about: [
      "El festival urbano del año llega a Loja. URBAN DROP reúne a los artistas más grandes del movimiento latino en una producción de escala mundial.",
      "Una experiencia masiva de alto contraste y estética editorial que redefine la cultura urbana. Dos escenarios, producción internacional y energía sin límites en la ciudad de Loja.",
    ],
    detailedLineup: [
      { name: "Bad Bunny", role: "Headliner", image: "/images/trap_loud_anuel_1778966415162.png" },
      { name: "Rauw Alejandro", role: "Headliner", image: "/images/rauw_alejandro_card_bg.png" },
      { name: "ROA", role: "Supporting", image: "/images/roa_artist_1779161704881.png" },
    ],
    schedule: [
      { time: "6:00 PM", label: "Puertas Abren" },
      { time: "7:00 PM", label: "Apertura" },
      { time: "8:00 PM", label: "Rauw Alejandro" },
      { time: "10:00 PM", label: "Bad Bunny" },
      { time: "12:30 AM", label: "After Party Oficial" },
    ],
    importantInfo: [
      { icon: "🎫", title: "Política de Tickets", description: "No reembolsable. Transferible con 48h de anticipación." },
      { icon: "🔒", title: "Seguridad", description: "Revista de seguridad estricta. Coopera con el equipo de seguridad." },
      { icon: "🚗", title: "Transporte", description: "Se recomienda transporte público. Parking limitado disponible." },
      { icon: "♿", title: "Accesibilidad", description: "Áreas accesibles disponibles. Contacta al venue con anticipación." },
      { icon: "📷", title: "Fotografía", description: "Cámaras profesionales permitidas con credencial de prensa." },
    ],
    socialLinks: {
      instagram: "https://instagram.com/rauw_alejandro",
      spotify: "https://open.spotify.com/artist/rauwalejandro",
      youtube: "https://youtube.com/@rauwalejandro",
      website: "https://nenez.com",
    },
    merch: [
      { id: "ud-tee", name: "URBAN DROP Tee", category: "T-Shirt", price: "$40", image: "/images/nenez-studio-fit-front.png" },
      { id: "ud-hoodie", name: "URBAN DROP Hoodie", category: "Hoodie", price: "$70", image: "/images/nenez-studio-portrait.png" },
    ],
  },
];

export default function EventTicketCarousel({
  activeIndex,
  setActiveIndex,
  onBuy,
  onViewDetails,
  isTicketPulse = false
}: EventTicketCarouselProps) {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef(0);
  const dragOffsetRef = useRef(0);

  // Mouse tilt parallax offsets
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [radius, setRadius] = useState(320);

  useEffect(() => {
    const handleResize = () => {
      setRadius(window.innerWidth > 1024 ? 380 : window.innerWidth > 768 ? 340 : 320);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX - innerWidth / 2) / (innerWidth / 2); // -1 to 1
      const y = (e.clientY - innerHeight / 2) / (innerHeight / 2); // -1 to 1
      setMouseOffset({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = e.clientX;
    dragOffsetRef.current = 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current;
    const deg = deltaX * 0.15;
    dragOffsetRef.current = deg;
    setDragOffset(deg);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // Snapping threshold
    const finalOffset = dragOffsetRef.current;
    if (Math.abs(finalOffset) > 6) {
      if (finalOffset > 0) {
        const prev = (activeIndex - 1 + CAROUSEL_EVENTS.length) % CAROUSEL_EVENTS.length;
        setActiveIndex(prev);
      } else {
        const next = (activeIndex + 1) % CAROUSEL_EVENTS.length;
        setActiveIndex(next);
      }
    }
    setDragOffset(0);
  };

  // Touch Support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    dragStartRef.current = e.touches[0].clientX;
    dragOffsetRef.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaX = e.touches[0].clientX - dragStartRef.current;
    const deg = deltaX * 0.22;
    dragOffsetRef.current = deg;
    setDragOffset(deg);
  };

  const handleTouchEnd = () => {
    handleMouseUp();
  };

  const handlePrev = () => {
    const prev = (activeIndex - 1 + CAROUSEL_EVENTS.length) % CAROUSEL_EVENTS.length;
    setActiveIndex(prev);
  };

  const handleNext = () => {
    const next = (activeIndex + 1) % CAROUSEL_EVENTS.length;
    setActiveIndex(next);
  };

  const transitionStyle = isDragging
    ? "none"
    : "transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), filter 0.8s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.8s ease";

  return (
    <div className="relative w-full h-[520px] md:h-[560px] lg:h-[620px] flex items-center justify-center select-none overflow-visible">
      {/* 3D Scene Wrapper */}
      <div 
        className="relative w-full h-full flex items-center justify-center overflow-visible"
        style={{ perspective: 1200, transformStyle: "preserve-3d" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {CAROUSEL_EVENTS.map((event, idx) => {
          let diff = idx - activeIndex;
          
          if (diff < -1) diff += CAROUSEL_EVENTS.length;
          if (diff > 1) diff -= CAROUSEL_EVENTS.length;

          const angleStep = 45;
          const baseAngle = diff * angleStep;
          const angle = baseAngle + dragOffset;
          const rad = (angle * Math.PI) / 180;
          
          // using responsive state radius
          const translateX = Math.sin(rad) * radius;
          const translateZ = Math.cos(rad) * radius - radius + (diff === 0 ? 60 : 0);
          
          const rotateY = angle * 0.9;

          const px = mouseOffset.x * (diff === 0 ? 24 : 10);
          const py = mouseOffset.y * (diff === 0 ? 16 : 8);
          const prX = -mouseOffset.y * (diff === 0 ? 12 : 5);
          const prY = mouseOffset.x * (diff === 0 ? 14 : 6);

          const scale = diff === 0 ? 1 : 0.82;
          const opacity = diff === 0 ? 1 : 0.42;
          const zIndex = diff === 0 ? 30 : 10;
          const blur = diff === 0 ? 0 : 5;

          return (
            <div
              key={event.id}
              onClick={() => {
                if (diff !== 0) {
                  setActiveIndex(idx);
                }
              }}
              className={`absolute w-[290px] h-[410px] md:w-[330px] md:h-[460px] lg:w-[370px] lg:h-[520px] rounded-[32px] overflow-hidden cursor-pointer origin-center transition-all animate-float ${
                diff === 0 && isTicketPulse ? "ticket-pulse-active" : ""
              }`}
              style={{
                transform: `translate3d(${translateX + px}px, ${diff === 0 ? -15 + py : py}px, ${translateZ}px) rotateY(${rotateY + prY}deg) rotateX(${prX}deg) scale(${scale})`,
                zIndex,
                opacity,
                filter: `blur(${blur}px)`,
                transition: transitionStyle,
                transformStyle: "preserve-3d",
                boxShadow: diff === 0 
                  ? "0 40px 100px rgba(0,0,0,0.85), 0 0 50px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.15)"
                  : "0 20px 40px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)",
                background: "rgba(10, 10, 10, 0.72)",
                backdropFilter: "blur(24px)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="relative w-full h-full p-5 flex flex-col justify-between" style={{ transform: "translateZ(20px)" }}>
                
                {/* Grayscale Artist Cover */}
                <div className="relative w-full h-[62%] rounded-[20px] overflow-hidden bg-zinc-900 border border-white/5">
                  <Image
                    src={event.poster}
                    alt={event.title}
                    fill
                    sizes="(max-width: 768px) 290px, (max-width: 1024px) 330px, 370px"
                    className="object-cover grayscale contrast-[1.15] brightness-[0.82] transition duration-1000 group-hover:scale-105"
                    priority={idx === 0}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  
                  {/* Minimal Monochrome Price Badge */}
                  <div className="absolute top-3 left-3 rounded-full border border-white/10 bg-black/75 px-3 py-1.5 backdrop-blur-md">
                    <span className="text-[10px] font-black text-white tracking-wider">
                      ${event.price} <span className="text-zinc-500 font-bold text-[8px]">{event.currency}</span>
                    </span>
                  </div>

                  {/* Status badge */}
                  {event.status && (
                    <div className={`absolute top-3 right-3 rounded-full px-2.5 py-1 text-[7px] font-black uppercase tracking-wider backdrop-blur-md ${
                      event.status === "available" 
                        ? "bg-white/10 border border-white/20 text-white" 
                        : event.status === "sold-out" 
                        ? "bg-red-950/60 border border-red-500/30 text-red-400"
                        : "bg-zinc-900/60 border border-white/10 text-zinc-400"
                    }`}>
                      {event.status === "available" ? "Disponible" : event.status === "sold-out" ? "Agotado" : "Próximamente"}
                    </div>
                  )}
                </div>

                {/* Event info details */}
                <div className="flex-1 flex flex-col justify-end mt-3 text-left">
                  <div>
                    <span className="text-[7px] font-black tracking-[0.3em] text-zinc-500 uppercase">
                      {event.badge || "NENEZ EXPERIENCE"}
                    </span>
                    <h4 className="text-xl font-black text-white uppercase mt-0.5 tracking-tight">
                      {event.title}
                    </h4>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase mt-0.5 tracking-wider">
                      {event.subtitle}
                    </p>
                  </div>

                  {/* Horizontal dividers & metadata details */}
                  <div className="flex items-center gap-4 mt-3 pt-3 text-zinc-400">
                    <div className="flex items-center text-[8px] font-black uppercase tracking-wider">
                      <span>{event.dateLabel.split(" ")[0]} {event.dateLabel.split(" ")[1]}</span>
                    </div>
                    <div className="flex items-center text-[8px] font-black uppercase tracking-wider">
                      <span>{event.city}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Manual Minimal Navigation Indicators */}
      <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-6 z-40">
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Anterior evento"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/60 backdrop-blur-md transition hover:border-white/30 hover:bg-black/80 hover:text-white active:scale-90"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex gap-1.5">
          {CAROUSEL_EVENTS.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              aria-label={`Ir al evento ${idx + 1}`}
              className={`h-1 rounded-full transition-all duration-500 ${
                idx === activeIndex
                  ? "w-5 bg-white"
                  : "w-1 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleNext}
          aria-label="Siguiente evento"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/60 backdrop-blur-md transition hover:border-white/30 hover:bg-black/80 hover:text-white active:scale-90"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
