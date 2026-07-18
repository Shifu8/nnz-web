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
  events?: CarouselEvent[];
  activeIndex: number;
  setActiveIndex: (idx: number) => void;
  onBuy: (event: Event) => void;
  onViewDetails: (event: Event) => void;
  isTicketPulse?: boolean;
  onInactiveClick?: (event: Event) => void;
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
    venue: "Mónaco Nightclub · Av. Pío Jaramillo Alvarado, Loja",
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
      { icon: "📍", title: "Ubicación", description: "Mónaco Nightclub - Av. Pío Jaramillo Alvarado, Loja." },
      { icon: "🍸", title: "Bar & Barra", description: "Servicio de botellas premium y tragos de autor adentro." },
    ],
    socialLinks: {
      instagram: "https://instagram.com/omarcourtz",
      tiktok: "https://tiktok.com/@omarcourtz",
      spotify: "https://open.spotify.com/artist/omarcourtz",
      youtube: "https://youtube.com/@omarcourtz",
    },
    drinks: [
      { id: "mojito-eleva", name: "Mojito Eleva", category: "Cocteles Especiales", price: "$2", description: "Ron blanco, menta fresca, soda de lima e infusión secreta NENEZ.", badge: "ESPECIAL DE LA NOCHE" },
      { id: "gran-malo", name: "Gran Malo Tequila (750ml)", category: "Botellas", price: "$35", description: "Tequila especiado con infusión sabor horchata.", badge: "POPULAR" },
      { id: "jagger", name: "Jägermeister (750ml)", category: "Botellas", price: "$45", description: "Servido helado a -18°C con 4 energizantes." },
      { id: "black-label", name: "Black Label Whisky (750ml)", category: "Botellas", price: "$75", description: "Johnnie Walker Black Label 12 Años." },
      { id: "absolut", name: "Absolut Vodka (750ml)", category: "Botellas", price: "$40", description: "Vodka sueco ultra refinado con mixers." },
      { id: "don-julio", name: "Don Julio Reposado (750ml)", category: "Botellas", price: "$95", description: "Tequila 100% agave azul de la casa." },
    ],
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
  events: propEvents,
  activeIndex,
  setActiveIndex,
  onBuy,
  onViewDetails,
  isTicketPulse = false,
  onInactiveClick
}: EventTicketCarouselProps) {
  const events = (propEvents && propEvents.length > 0) ? propEvents : CAROUSEL_EVENTS;
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef(0);
  const dragOffsetRef = useRef(0);
  const clickStartRef = useRef<{ x: number; y: number } | null>(null);
  const clickMovedRef = useRef(false);
  const clickThreshold = 8;

  // Touch Swipe tracking refs
  const touchStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isHorizontalSwipe = useRef<boolean | null>(null);

  // Mouse tilt parallax offsets
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [radius, setRadius] = useState(320);

  useEffect(() => {
    const handleResize = () => {
      setRadius(
        window.innerWidth > 1536
          ? 480
          : window.innerWidth > 1280
          ? 430
          : window.innerWidth > 1024
          ? 390
          : window.innerWidth > 768
          ? 340
          : 320
      );
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Simple mouse move parallax (Desktop only)
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let rafId: number;

    const handleMouseMove = (e: MouseEvent) => {
      if (window.innerWidth < 1024) return; // Skip parallax on tablet and mobile
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX - innerWidth / 2) / (innerWidth / 2); // -1 to 1
      const y = (e.clientY - innerHeight / 2) / (innerHeight / 2); // -1 to 1
      targetX = x;
      targetY = y;
    };

    const updatePosition = () => {
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;

      setMouseOffset({ x: currentX, y: currentY });
      rafId = requestAnimationFrame(updatePosition);
    };

    window.addEventListener("mousemove", handleMouseMove);
    rafId = requestAnimationFrame(updatePosition);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = e.clientX;
    dragOffsetRef.current = 0;
    clickStartRef.current = { x: e.clientX, y: e.clientY };
    clickMovedRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current;
    const deg = deltaX * 0.15;
    dragOffsetRef.current = deg;
    setDragOffset(deg);
    if (clickStartRef.current) {
      const moveX = Math.abs(e.clientX - clickStartRef.current.x);
      const moveY = Math.abs(e.clientY - clickStartRef.current.y);
      if (moveX > clickThreshold || moveY > clickThreshold) {
        clickMovedRef.current = true;
      }
    }
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    clickStartRef.current = null;

    const finalOffset = dragOffsetRef.current;
    if (Math.abs(finalOffset) > 6) {
      if (finalOffset > 0) {
        const prev = (activeIndex - 1 + events.length) % events.length;
        setActiveIndex(prev);
      } else {
        const next = (activeIndex + 1) % events.length;
        setActiveIndex(next);
      }
    }
    setDragOffset(0);
    dragOffsetRef.current = 0;
  };

  // Touch Support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    const touch = e.touches[0];
    dragStartRef.current = touch.clientX;
    dragOffsetRef.current = 0;
    clickStartRef.current = { x: touch.clientX, y: touch.clientY };
    clickMovedRef.current = false;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    isHorizontalSwipe.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    if (isHorizontalSwipe.current === null) {
      if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
        isHorizontalSwipe.current = Math.abs(deltaX) > Math.abs(deltaY);
      }
    }

    if (isHorizontalSwipe.current === true) {
      if (e.cancelable) e.preventDefault();
      const deg = (touch.clientX - dragStartRef.current) * 0.22;
      dragOffsetRef.current = deg;
      setDragOffset(deg);
      clickMovedRef.current = true;
    }
  };

  const handleTouchEnd = () => {
    handleMouseUp();
  };

  const handlePrev = () => {
    const prev = (activeIndex - 1 + events.length) % events.length;
    setActiveIndex(prev);
  };

  const handleNext = () => {
    const next = (activeIndex + 1) % events.length;
    setActiveIndex(next);
  };

  // Global mouseup/touchend event listener during active drag
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalRelease = () => {
      handleMouseUp();
    };

    window.addEventListener("mouseup", handleGlobalRelease);
    window.addEventListener("touchend", handleGlobalRelease);

    return () => {
      window.removeEventListener("mouseup", handleGlobalRelease);
      window.removeEventListener("touchend", handleGlobalRelease);
    };
  }, [isDragging, activeIndex, events.length]);

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-[520px] md:h-[560px] lg:h-[680px] xl:h-[740px] 2xl:h-[780px] flex items-center justify-center select-none overflow-visible"
    >
      {/* 3D Scene Wrapper */}
      <div 
        className="relative w-full h-full flex items-center justify-center overflow-visible"
        style={{ perspective: 1200, transformStyle: "preserve-3d" }}
      >
        {events.map((event, idx) => {
          let diff = idx - activeIndex;
          
          if (diff < -1) diff += events.length;
          if (diff > 1) diff -= events.length;

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
              onClick={(e) => {
                if (clickMovedRef.current) {
                  e.preventDefault();
                  e.stopPropagation();
                  return;
                }
                if (diff === 0) {
                  if (event.status === "available") {
                    onBuy(event);
                  } else {
                    onInactiveClick?.(event);
                  }
                }
              }}
              className={`absolute w-[290px] h-[410px] md:w-[330px] md:h-[460px] lg:w-[410px] lg:h-[560px] xl:w-[460px] xl:h-[620px] 2xl:w-[490px] 2xl:h-[660px] rounded-[32px] cursor-pointer origin-center transition-all animate-float group ${
                diff === 0 && isTicketPulse ? "ticket-pulse-active" : ""
              }`}
              style={{
                transform: `translate3d(${translateX + px}px, ${diff === 0 ? -15 + py : py}px, ${translateZ}px) rotateY(${rotateY + prY}deg) rotateX(${prX}deg) scale(${scale})`,
                zIndex,
                opacity,
                filter: `blur(${blur}px)`,
                transition: "transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), filter 0.8s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.8s ease",
                transformStyle: "preserve-3d",
                boxShadow: diff === 0 
                  ? "0 40px 100px rgba(0,0,0,0.85), 0 0 50px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.15)"
                  : "0 20px 40px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)",
                background: "rgba(10, 10, 10, 0.72)",
                backdropFilter: "blur(24px)",
                border: diff === 0 ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {/* Tooltip on hover if inactive */}
              {event.status !== "available" && (
                <div 
                  className="absolute -top-14 left-1/2 w-max scale-90 opacity-0 pointer-events-none group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 z-50 bg-zinc-950/95 border border-white/10 text-white rounded-xl px-4 py-2 text-[9px] font-bold tracking-widest backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.9)] flex flex-col items-center"
                  style={{ transform: "translate3d(-50%, 0, 45px)" }}
                >
                  <span className="text-zinc-400 font-medium text-[8px] tracking-widest uppercase">
                    {event.status === "sold-out" ? "Entradas Agotadas" : "Venta Próximamente"}
                  </span>
                  <span className="text-white font-black mt-0.5 uppercase tracking-widest text-[9px]">
                    {event.status === "sold-out" ? "Evento Agotado" : "Evento Próximo"}
                  </span>
                  {/* Arrow pointing down */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-950" />
                </div>
              )}
              <div className="relative w-full h-full p-5 xl:p-6 flex flex-col justify-between z-10" style={{ transform: "translateZ(20px)" }}>
                
                {/* Grayscale Artist Cover */}
                <div className={`relative w-full rounded-[20px] overflow-hidden bg-zinc-900 border border-white/5 transition-all duration-500 ${
                  diff === 0 ? "h-[50%] md:h-[54%] lg:h-[58%] xl:h-[60%]" : "h-[58%] xl:h-[62%]"
                }`}>
                  {event.poster ? (
                    <Image
                      src={event.poster}
                      alt={event.title}
                      fill
                      sizes="(max-width: 768px) 290px, (max-width: 1024px) 330px, (max-width: 1280px) 410px, 490px"
                      className="object-cover grayscale contrast-[1.15] brightness-[0.82] transition duration-1000 group-hover:scale-105"
                      priority={idx === 0}
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-950 border-b border-white/5">
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-700">Próximamente</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  
                  {/* Minimal Monochrome Price Badge */}
                  <div className="absolute top-3.5 left-3.5 rounded-full border border-white/10 bg-black/75 px-3 py-1.5 backdrop-blur-md">
                    <span className="text-[10px] xl:text-xs font-black text-white tracking-wider">
                      ${event.price} <span className="text-zinc-500 font-bold text-[8px] xl:text-[9px]">{event.currency}</span>
                    </span>
                  </div>

                  {/* Status badge */}
                  {event.status && (
                    <div className={`absolute top-3.5 right-3.5 rounded-full px-2.5 py-1 text-[7px] xl:text-[8px] font-black uppercase tracking-wider backdrop-blur-md ${
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
                <div className="flex-1 flex flex-col justify-end mt-3 xl:mt-4 text-left">
                  <div>
                    <span className="text-[7px] xl:text-[8px] font-black tracking-[0.3em] text-zinc-500 uppercase">
                      {event.badge || "NENEZ EXPERIENCE"}
                    </span>
                    <h4 className="text-xl md:text-2xl xl:text-3xl font-black text-white uppercase mt-0.5 tracking-tight">
                      {event.title}
                    </h4>
                    <p className="text-[9px] md:text-[10px] xl:text-xs font-bold text-zinc-400 uppercase mt-0.5 tracking-wider">
                      {event.subtitle}
                    </p>
                  </div>

                  {/* Horizontal dividers & metadata details */}
                  <div className="flex items-center gap-4 mt-3 xl:mt-4 pt-3 border-t border-white/5 text-zinc-400">
                    <div className="flex items-center text-[8px] md:text-[9px] xl:text-[10px] font-black uppercase tracking-wider">
                      <span>{event.dateLabel}</span>
                    </div>
                    <div className="flex items-center text-[8px] md:text-[9px] xl:text-[10px] font-black uppercase tracking-wider">
                      <span>{event.city}</span>
                    </div>
                  </div>

                  {/* Active Card Action Buttons (Mobile & Desktop) */}
                  {diff === 0 && (
                    <div className="flex gap-2 mt-3 xl:mt-4 pt-3 border-t border-white/5 w-full z-50">
                      <button
                        type="button"
                        disabled={event.status === "coming-soon"}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (clickMovedRef.current) return;
                          onViewDetails(event);
                        }}
                        className={`flex-1 h-9 xl:h-10 rounded-full border text-[8px] xl:text-[9px] font-black uppercase tracking-[0.15em] transition duration-300 ${
                          event.status === "coming-soon"
                            ? "border-zinc-800 bg-zinc-900/20 text-zinc-600 cursor-not-allowed opacity-50"
                            : "border-white/25 bg-white/10 text-white hover:border-white/50 hover:bg-white/25 active:scale-95 cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.5)] backdrop-blur-md"
                        }`}
                      >
                        Ver Detalle
                      </button>

                      {event.status === "available" ? (
                        <div className="flex-1 relative p-[1.5px] rounded-full overflow-hidden bg-zinc-950 flex items-center justify-center shadow-[0_0_15px_rgba(225,0,117,0.2)] group/btn">
                          {/* Pink spinning line */}
                          <div className="absolute inset-[-150%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_35%,#e10075_50%,transparent_65%)] pointer-events-none" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (clickMovedRef.current) return;
                              onBuy(event);
                            }}
                            className="relative z-10 w-full h-[34px] xl:h-[38px] rounded-full bg-zinc-950 text-[8px] xl:text-[9px] font-black uppercase tracking-[0.15em] text-white hover:bg-zinc-900 transition-all duration-300 active:scale-95 cursor-pointer"
                          >
                            Comprar Entrada
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (clickMovedRef.current) return;
                            onInactiveClick?.(event);
                          }}
                          className="flex-1 h-9 rounded-full border border-zinc-800 bg-zinc-900/20 text-[8px] font-black uppercase tracking-[0.15em] text-zinc-600 hover:text-zinc-500 hover:border-zinc-700 transition duration-300 active:scale-95 cursor-pointer"
                        >
                          {event.status === "sold-out" ? "Agotado" : "Próximamente"}
                        </button>
                      )}
                    </div>
                  )}
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
            <div
              key={idx}
              className={`h-1 rounded-full transition-all duration-500 ${
                idx === activeIndex
                  ? "w-5 bg-white"
                  : "w-1 bg-white/20"
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
