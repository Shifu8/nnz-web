"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BadgeCheck,
  Calendar,
  Check,
  ChevronLeft,
  MapPin,
  Share2,
  X,
} from "lucide-react";
import type { Event } from "@/frontend/types/domain";
import { getHdImageSrc } from "@/frontend/utils/hdImages";

type OrganizerProfileOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
  organizerName?: string;
  allEvents?: Event[];
  onSelectEvent?: (event: Event) => void;
  onBuyEvent?: (event: Event) => void;
  followedProfiles?: Record<string, boolean>;
  onToggleFollow?: (id: string) => void;
  zIndex?: string;
};

export type OrganizerProfile = {
  id: string;
  name: string;
  title: string;
  email: string;
  type: "Organizador" | "Discoteca / Club Nocturno";
  logo: string;
  instagramUrl: string;
  instagramHandle: string;
  location: string;
  schedule: string;
  description: string;
  followersCount: string;
};

export const ORGANIZER_DATA: Record<string, OrganizerProfile> = {
  cubic: {
    id: "cubic",
    name: "Cubic",
    title: "CUBIC LOJA",
    email: "mrshifu879@gmail.com",
    type: "Discoteca / Club Nocturno",
    logo: "/images/cubic-official-logo.png",
    instagramUrl: "https://www.instagram.com/cubic_loja/?hl=es",
    instagramHandle: "@cubic_loja",
    location: "Av. Salvador Bustamante Celi y Guayaquil, Loja",
    schedule: "Jueves, Viernes y Sabado",
    description: "El club nocturno lider en Loja. Experiencias audiovisuales sin precedentes, DJs invitados y la mejor vibra de la ciudad.",
    followersCount: "17K",
  },
  sata: {
    id: "sata",
    name: "Sata Music",
    title: "SATA MUSIC",
    email: "brandon.medina@unl.edu.ec",
    type: "Organizador",
    logo: "/images/sata-official-logo.jpg",
    instagramUrl: "https://www.instagram.com/sata_events/",
    instagramHandle: "@sata_events",
    location: "Loja, Ecuador",
    schedule: "Eventos Especiales & Conciertos",
    description: "Productora oficial de eventos underground, conciertos y fiestas exclusivas en Ecuador.",
    followersCount: "8.9K",
  },
  "4go": {
    id: "4go",
    name: "4GO",
    title: "4GO",
    email: "master@4go.live",
    type: "Organizador",
    logo: "/images/logo_4go_black_white.png",
    instagramUrl: "https://www.instagram.com/4gooooooooo/",
    instagramHandle: "@4gooooooooo",
    location: "Loja, Ecuador",
    schedule: "Eventos Especiales & Fiestas",
    description: "Plataforma oficial de eventos y experiencias en vivo en Loja, Ecuador.",
    followersCount: "12K",
  },
  prueba1: {
    id: "prueba1",
    name: "PRUEBA1",
    title: "PRUEBA1",
    email: "soporte.nenez@gmail.com",
    type: "Organizador",
    logo: "/images/logo_4go_black_white.png",
    instagramUrl: "https://www.instagram.com/brandon.mdna/",
    instagramHandle: "@brandon.mdna",
    location: "Loja, Ecuador",
    schedule: "Eventos Especiales",
    description: "Productora oficial y organizador de eventos exclusivos en 4GO.",
    followersCount: "475",
  },
};

export default function OrganizerProfileOverlay({
  isOpen,
  onClose,
  organizerName = "Cubic",
  allEvents = [],
  onSelectEvent,
  followedProfiles,
  onToggleFollow,
  zIndex = "z-[850]",
}: OrganizerProfileOverlayProps) {
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const eventsSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && typeof window !== "undefined") {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [isOpen]);

  const normalizedSlug = (organizerName || "").toLowerCase().trim();
  const matchedKey = Object.keys(ORGANIZER_DATA).find(
    (k) =>
      k === normalizedSlug ||
      ORGANIZER_DATA[k].id.toLowerCase() === normalizedSlug ||
      ORGANIZER_DATA[k].name.toLowerCase() === normalizedSlug ||
      normalizedSlug.includes(ORGANIZER_DATA[k].id.toLowerCase()) ||
      ORGANIZER_DATA[k].id.toLowerCase().includes(normalizedSlug)
  );

  const orgEvents = allEvents.filter((evt) => {
    const orgText = (
      (evt.organizer || "") + " " +
      ((evt.organizers || []).join(" ")) + " " +
      (evt.venue || "") + " " +
      evt.title
    ).toLowerCase();
    const searchTerms = [
      normalizedSlug,
      ...(matchedKey ? [matchedKey, ORGANIZER_DATA[matchedKey].id.toLowerCase(), ORGANIZER_DATA[matchedKey].name.toLowerCase()] : []),
    ];
    return searchTerms.some((term) => term && orgText.includes(term));
  });

  const displayEvents = orgEvents.length > 0 ? orgEvents : allEvents.slice(0, 6);

  const org: OrganizerProfile = (matchedKey && ORGANIZER_DATA[matchedKey]) || {
    id: normalizedSlug,
    name: organizerName,
    title: organizerName.toUpperCase(),
    email: `contact@${normalizedSlug.replace(/[^a-z0-9]/g, "") || "organizer"}.4go.live`,
    type: "Organizador",
    logo: (displayEvents[0] as any)?.miniImage || displayEvents[0]?.poster || "/images/4go_red_girl_showcase.jpg",
    instagramUrl: `https://www.instagram.com/${normalizedSlug.replace(/[^a-z0-9_]/g, "") || "brandon.mdna"}/`,
    instagramHandle: `@${normalizedSlug.replace(/[^a-z0-9_]/g, "") || "brandon.mdna"}`,
    location: displayEvents[0]?.city || displayEvents[0]?.venue || "Loja, Ecuador",
    schedule: "Eventos Especiales",
    description: `Perfil oficial de ${organizerName} en 4GO.`,
    followersCount: "475",
  };

  // Grab authentic color & blur from the organizer's profile photo (org.logo)
  const profileImgSrc = getHdImageSrc(org.logo);

  const isCubic =
    matchedKey === "cubic" ||
    org.id === "cubic" ||
    Boolean(org.name && org.name.toLowerCase().includes("cubic"));

  const isWhiteAndBlackLogo =
    isCubic ||
    matchedKey === "prueba1" ||
    Boolean(org.logo?.includes("logo_4go_black_white")) ||
    Boolean(org.logo?.includes("cubic"));

  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const handleShareOrCopy = async () => {
    const shareUrl = typeof window !== "undefined"
      ? `${window.location.origin}/organizer/${org.id}`
      : `https://4go.live/organizer/${org.id}`;

    let success = false;
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        success = true;
      } catch (err) {
        console.warn("navigator.clipboard failed, trying fallback:", err);
      }
    }

    if (!success && typeof document !== "undefined") {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = shareUrl;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        success = true;
      } catch (err) {
        console.error("Fallback copy failed:", err);
      }
    }

    setCopied(true);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => {
      setCopied(false);
    }, 2500);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setIsScrolledDown(e.currentTarget.scrollTop > 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      className={`fixed inset-0 ${zIndex} bg-black text-white flex flex-col select-none overflow-hidden`}
    >
      {/* ─── ULTRA-VIVID AMBIENT PROFILE COLOR BLUR (AUTHENTIC GRADIENT FADE TO DEEP BLACK) ─── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-black transform-gpu">
        {/* Ambient White/Silver Halo Glow for White/Black Logos like Cubic */}
        {isWhiteAndBlackLogo && (
          <div
            className="absolute top-8 sm:top-12 left-1/2 -translate-x-1/2 w-[580px] sm:w-[820px] h-[520px] sm:h-[650px] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.48)_0%,rgba(255,255,255,0.22)_35%,rgba(255,255,255,0.06)_65%,transparent_80%)] blur-[75px] pointer-events-none"
          />
        )}

        {/* Blurred Profile Image with Smooth Mask-Image Gradient Fade to Black */}
        <div
          className="absolute top-0 inset-x-0 h-[85vh] max-h-[850px] overflow-hidden"
          style={{
            WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 25%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0) 100%)",
            maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 25%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0) 100%)",
          }}
        >
          <Image
            src={profileImgSrc}
            alt=""
            aria-hidden="true"
            fill
            priority
            quality={20}
            sizes="120px"
            className={`object-cover object-center blur-[80px] transform-gpu will-change-transform ${
              isWhiteAndBlackLogo
                ? "scale-[3.2] brightness-200 contrast-125 opacity-95"
                : "scale-150 saturate-200 brightness-110 opacity-85"
            }`}
          />
        </div>

        {/* Global Smooth Gradient Overlay */}
        <div
          className={`absolute inset-0 pointer-events-none ${
            isWhiteAndBlackLogo
              ? "bg-gradient-to-b from-transparent via-black/15 via-40% to-black"
              : "bg-gradient-to-b from-black/10 via-black/25 via-40% to-black"
          }`}
        />
      </div>

      {/* Floating 'Link Copiado' Pill Toast */}
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: -15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[600] pointer-events-none flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black font-black text-xs uppercase tracking-wider shadow-[0_10px_35px_rgba(0,0,0,0.8)] border border-white/20"
          >
            <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
            <span>Link copiado</span>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="fixed top-0 inset-x-0 z-[550] flex items-center justify-between px-4 sm:px-8 py-4 bg-gradient-to-b from-black/90 via-black/40 to-transparent pointer-events-none">
        <button type="button" onClick={onClose} className="pointer-events-auto flex items-center justify-center w-11 h-11 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 backdrop-blur-xl transition-all cursor-pointer shadow-2xl active:scale-95" aria-label="Volver">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Share / Copy Web Link Button */}
          <button
            type="button"
            onClick={handleShareOrCopy}
            className={`flex items-center justify-center gap-1.5 h-11 px-3 sm:px-4 rounded-full border backdrop-blur-xl transition-all cursor-pointer shadow-2xl active:scale-95 ${
              copied
                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                : "bg-white/10 border-white/20 text-white hover:bg-white/20"
            }`}
            aria-label="Compartir perfil"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                <span className="text-xs font-bold tracking-tight whitespace-nowrap">Link copiado</span>
              </>
            ) : (
              <Share2 className="w-5 h-5" />
            )}
          </button>
          <button type="button" onClick={onClose} className="flex items-center justify-center w-11 h-11 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 backdrop-blur-xl transition-all cursor-pointer shadow-2xl active:scale-95" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div ref={mainContainerRef} onScroll={handleScroll} className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-4 sm:px-8 py-20 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pb-16">

          <div className="lg:col-span-5 flex flex-col space-y-6">
            <div className="relative w-full aspect-square max-w-[380px] mx-auto rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)] border border-white/20 bg-zinc-900 group">
              <Image src={org.logo} alt={org.name} fill priority quality={100} sizes="(max-width: 768px) 100vw, 380px" className="object-cover object-center brightness-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-40 pointer-events-none" />
              <div className="absolute bottom-3.5 left-3.5 flex items-center gap-1.5 bg-black/70 border border-white/20 backdrop-blur-md px-3 py-1 rounded-full z-10">
                <BadgeCheck className="w-4 h-4 text-blue-400 fill-blue-500/20" />
                <span className="text-[10px] font-black uppercase text-white tracking-wider">Verificado</span>
              </div>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between shadow-lg backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 p-0.5 flex items-center justify-center shrink-0">
                  <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-pink-400 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  </div>
                </div>
                <div className="flex flex-col space-y-0.5">
                  <span className="text-xs font-black text-white tracking-wide">Instagram Oficial</span>
                  <span className="text-xs text-zinc-400 font-medium">{org.instagramHandle}</span>
                </div>
              </div>
              <a href={org.instagramUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 hover:bg-white text-white hover:text-black font-extrabold text-xs uppercase transition-all cursor-pointer shadow-md active:scale-95">Visitar</a>
            </div>

            <div className="space-y-2.5 pt-1">
              <div className="flex items-center gap-3 text-xs text-zinc-300 font-medium">
                <MapPin className="w-4 h-4 text-purple-400 shrink-0" />
                <span>{org.location}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-300 font-medium">
                <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{org.schedule}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-none font-sans drop-shadow-md">{org.name}</h1>
                <BadgeCheck className="w-8 h-8 text-blue-400 fill-blue-500/20 shrink-0" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-zinc-200 tracking-tight">{org.type}</p>
            </div>

            <div ref={eventsSectionRef} className="space-y-4 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-white tracking-tight">Eventos de {org.name}</h2>
                <span className="text-xs font-bold text-zinc-300 bg-white/10 px-3.5 py-1 rounded-full border border-white/15">{displayEvents.length} Eventos Activos</span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {displayEvents.map((evt) => (
                  <div key={`org-grid-${evt.id}`} onClick={() => onSelectEvent?.(evt)} className="group relative flex flex-col rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden cursor-pointer hover:border-zinc-500 transition-all duration-300 shadow-xl">
                    <div className="relative w-full aspect-square bg-zinc-900 overflow-hidden">
                      <Image src={evt.poster || org.logo} alt={evt.title} fill className="object-cover transition-transform duration-500" sizes="(max-width: 768px) 50vw, 33vw" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                      <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-white text-black text-[10px] font-black shadow">${evt.price || 10} USD</span>
                    </div>
                    <div className="p-3.5 flex flex-col justify-between flex-1 bg-[#09090b]">
                      <div>
                        <span className="text-[9px] font-bold uppercase text-zinc-400 tracking-wider block">{org.name}</span>
                        <h3 className="text-xs font-bold uppercase text-white group-hover:text-yellow-400 transition-colors line-clamp-1">{evt.title}</h3>
                        <p className="text-[10px] text-zinc-400 font-medium line-clamp-1 mt-0.5">{evt.subtitle || evt.dateLabel}</p>
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-zinc-800 flex items-center justify-between">
                        <span className="text-[9px] font-bold text-zinc-400">{evt.dateLabel}</span>
                        <span className="text-[9px] font-bold text-white uppercase group-hover:translate-x-0.5 transition-transform">Ver &rarr;</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
