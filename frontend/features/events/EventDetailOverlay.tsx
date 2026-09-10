"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  Calendar,
  Ticket,
  X,
  BadgeCheck,
  ChevronRight,
  Lock,
  Sparkles,
  Play,
  Info,
  Megaphone,
  ShieldCheck,
  Tag,
  ArrowUp,
  ArrowDown,
  Copy,
  Check,
  ExternalLink,
  DoorOpen,
  ArrowRight,
  Search,
  User,
  Flame,
  Plus,
} from "lucide-react";
import type { Event } from "@/frontend/types/domain";
import { DEFAULT_HD_EVENT_POSTER, getHdImageSrc } from "@/frontend/utils/hdImages";
import { ORGANIZER_DATA } from "@/frontend/features/organizer/OrganizerProfileOverlay";
import Footer from "@/components/Footer";

interface EventDetailOverlayProps {
  event: Event;
  allEvents?: Event[];
  onClose: () => void;
  onBuy: (event: Event) => void;
  onSelectEvent?: (event: Event) => void;
  onOpenOrganizer?: (slug: string) => void;
  onOpenDrinks?: () => void;
  onOpenSearch?: () => void;
  onOpenProfile?: () => void;
  onOpenCreate?: () => void;
  isCheckoutOpen?: boolean;
  userLoggedIn?: boolean;
  userProfile?: any;
  isFavorite?: boolean;
  onToggleFavorite?: (eventId: string, e?: React.MouseEvent) => void;
  onOpenAuth?: () => void;
  zIndex?: string;
  isOpen?: boolean;
}

export default function EventDetailOverlay({
  event,
  onClose,
  onBuy,
  onOpenOrganizer,
  onOpenSearch,
  onOpenProfile,
  onOpenCreate,
  userLoggedIn = false,
  userProfile,
  isFavorite = false,
  onToggleFavorite,
  onOpenAuth,
  zIndex = "z-[800]",
  isOpen = true,
}: EventDetailOverlayProps) {
  const [isExpandedDescription, setIsExpandedDescription] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [showPromoCodeInput, setShowPromoCodeInput] = useState(false);
  const [promoCodeText, setPromoCodeText] = useState("");
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const [followedIds, setFollowedIds] = useState<Record<string, boolean>>({});
  const [isAddressCopied, setIsAddressCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const mainContainerRef = useRef<HTMLDivElement>(null);
  const infoSectionRef = useRef<HTMLDivElement>(null);

  const getShareableUrl = () => {
    if (typeof window === "undefined") return "https://4go.ec";
    const origin = window.location.origin;
    const eventSlug = (event as any).slug || event.id;
    const isLocal = origin.includes("localhost") || origin.includes("127.0.0.1");
    const baseUrl = isLocal ? "https://4go.ec" : origin;
    return `${baseUrl}/events/${eventSlug}`;
  };

  const handleCopyLink = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const shareUrl = typeof window !== "undefined" ? window.location.href : getShareableUrl();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => {
        setCopiedLink(false);
        setShowShareMenu(false);
      }, 1800);
    }
  };

  const handleShareWhatsApp = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const shareUrl = getShareableUrl();
    const text = `¡Mira este evento en 4GO! 🎉\n\n📌 *${event.title}*\n🗓️ ${event.dateLabel || ''}\n📍 ${event.venue || event.city || ''}\n\n👉 ${shareUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
    setShowShareMenu(false);
  };

  const handleShareFacebook = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const shareUrl = getShareableUrl();
    const text = `${event.title} | 4GO`;
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(text)}`;
    window.open(fbUrl, "_blank", "width=650,height=600");
    setShowShareMenu(false);
  };

  const handleShareX = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const shareUrl = getShareableUrl();
    const text = `¡Mira este evento en 4GO!: ${event.title}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, "_blank", "width=600,height=500");
    setShowShareMenu(false);
  };

  useEffect(() => {
    if (isOpen && typeof window !== "undefined") {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop > 300) {
      setIsScrolledDown(true);
    } else {
      setIsScrolledDown(false);
    }
  };

  const scrollToTop = () => {
    if (mainContainerRef.current) {
      mainContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const scrollToBottomInfo = () => {
    if (infoSectionRef.current) {
      infoSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const toggleFollow = (id: string) => {
    setFollowedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const venueName = (() => {
    const rawVenue = event.venue?.trim();
    const uName = userProfile?.name?.trim().toLowerCase();
    const uVenue = userProfile?.venueName?.trim().toLowerCase();
    if (
      rawVenue &&
      rawVenue.toLowerCase() !== uName &&
      rawVenue.toLowerCase() !== uVenue &&
      !rawVenue.toLowerCase().startsWith("prueba")
    ) {
      return rawVenue;
    }
    const loc = (event as any).location?.trim();
    if (loc && loc.toLowerCase() !== uName && loc.toLowerCase() !== uVenue && !loc.toLowerCase().startsWith("prueba")) {
      return loc;
    }
    return "CUBIC";
  })();

  const venueAddress = (event as any).address || "Av. Salvador Bustamante Celi y Guayaquil, Loja, Ecuador";
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venueName} ${venueAddress}`)}`;

  const copyAddressToClipboard = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(venueAddress);
      setIsAddressCopied(true);
      setTimeout(() => setIsAddressCopied(false), 2000);
    }
  };

  const displayPrice = event.price === 0 ? "Gratis" : `${Math.round(event.price !== undefined ? event.price : 10)} $`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={`fixed inset-0 ${zIndex} bg-black text-white flex flex-col select-none overflow-hidden`}
    >
      {/* ─── ULTRA-VIVID AMBIENT POSTER COLOR BLUR (AUTHENTIC GRADIENT FADE TO DEEP BLACK) ─── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-black transform-gpu">
        {/* Blurred Image with Smooth Mask-Image Gradient Fade to Black */}
        <div
          className="absolute top-0 inset-x-0 h-[85vh] max-h-[850px] overflow-hidden"
          style={{
            WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 25%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0) 100%)",
            maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 25%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0) 100%)",
          }}
        >
          <Image
            src={event.poster || DEFAULT_HD_EVENT_POSTER}
            alt=""
            aria-hidden="true"
            fill
            priority
            quality={20}
            sizes="120px"
            className="object-cover object-top scale-150 blur-[90px] saturate-200 brightness-110 opacity-85 transform-gpu will-change-transform"
          />
        </div>

        {/* Global Smooth Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/25 via-40% to-black pointer-events-none" />
      </div>

      {/* ─── TOP NAVIGATION BAR ─── */}
      <header className="fixed top-0 inset-x-0 z-[350] flex items-center justify-between px-4 sm:px-8 py-4 bg-gradient-to-b from-[#0c0714]/90 via-[#0c0714]/50 to-transparent pointer-events-none">
        {/* Left: Back Arrow Button [←] with Hover Tooltip */}
        <div className="relative group pointer-events-auto flex items-center">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 backdrop-blur-xl transition-all cursor-pointer shadow-2xl active:scale-95"
            aria-label="Atrás"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          {/* Hover Tooltip: Atrás */}
          <div className="absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-zinc-950/90 border border-white/20 text-white text-[11px] font-bold uppercase tracking-wider backdrop-blur-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 -translate-x-1 group-hover:translate-x-0 whitespace-nowrap z-50">
            Atrás
          </div>
        </div>

        {/* Right Controls: + Crear on Left, Buscar in Middle, Avatar on Far Right (Horizontal Glass Buttons) */}
        <div className="pointer-events-auto flex flex-row items-center gap-2 sm:gap-2.5 shrink-0">
          {/* + Crear Glass Pill Button (Left) */}
          <button
            type="button"
            onClick={() => onOpenCreate?.()}
            className="h-10 px-3.5 sm:px-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-xl flex items-center gap-1.5 text-white font-bold text-xs sm:text-sm shadow-lg cursor-pointer transition-all active:scale-95 whitespace-nowrap"
            aria-label="Crear Evento"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Crear</span>
          </button>

          {/* Search Button with Hover Preview (Middle) */}
          <div className="relative group flex items-center justify-center">
            <button
              type="button"
              onClick={() => onOpenSearch?.()}
              className="w-10 h-10 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 text-white backdrop-blur-xl flex items-center justify-center shadow-lg cursor-pointer transition-all active:scale-95"
              aria-label="Buscar"
            >
              <Search className="w-5 h-5 text-white" />
            </button>

            {/* Hover Tooltip: Buscar */}
            <div className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-zinc-950/90 border border-white/20 text-white text-[11px] font-bold uppercase tracking-wider backdrop-blur-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 -translate-y-1 group-hover:translate-y-0 whitespace-nowrap z-50">
              Buscar
            </div>
          </div>

          {/* Profile Button with Hover Preview (Far Right) */}
          <div className="relative group flex items-center justify-center">
            <button
              type="button"
              onClick={() => {
                if (!userLoggedIn) {
                  onOpenAuth?.();
                } else {
                  onOpenProfile?.();
                }
              }}
              className="w-10 h-10 rounded-full bg-white/10 border border-white/20 backdrop-blur-xl flex items-center justify-center text-white hover:bg-white/20 shadow-lg cursor-pointer transition-all active:scale-95 overflow-hidden relative"
              aria-label="Perfil"
            >
              {userLoggedIn && userProfile?.avatar ? (
                <img
                  src={userProfile.avatar}
                  alt={userProfile.venueName || userProfile.name || "Perfil"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const fallback = e.currentTarget.parentElement?.querySelector(".detail-user-fallback");
                    if (fallback) fallback.classList.remove("hidden");
                  }}
                />
              ) : (
                <User className="w-5 h-5 text-white" />
              )}
              <User className="detail-user-fallback w-5 h-5 text-white hidden" />
            </button>

            {/* Hover Tooltip: Perfil */}
            <div className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-zinc-950/90 border border-white/20 text-white text-[11px] font-bold uppercase tracking-wider backdrop-blur-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 -translate-y-1 group-hover:translate-y-0 whitespace-nowrap z-50">
              Perfil
            </div>
          </div>
        </div>
      </header>

      {/* ─── FULL-PAGE MAIN SCROLLABLE CONTAINER ─── */}
      <div
        ref={mainContainerRef}
        onScroll={handleScroll}
        className="relative z-10 w-full h-full overflow-y-auto no-scrollbar pt-24 pb-0 flex flex-col justify-between"
      >
        {/* ─── MAIN 2-COLUMN GRID (DICE EXACT MATCHING SCREENSHOT) ─── */}
        <div className="max-w-6xl mx-auto px-3 sm:px-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          
          {/* ─── LEFT COLUMN (POSTER + AUDIO PLAYER + PROTECTION BADGES - STICKY ON PC) ─── */}
          <div className="lg:col-span-5 flex flex-col space-y-6 lg:sticky lg:top-6 lg:-mt-[72px]">
            {/* Poster Artwork Container (Full width on mobile, max-w-[440px] on desktop, aligned with title) */}
            <div
              onClick={() => setIsLightboxOpen(true)}
              className="relative w-full aspect-square max-w-full lg:max-w-[440px] mx-auto lg:mx-0 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)] border border-white/20 bg-zinc-950 cursor-pointer group"
            >
              <Image
                src={getHdImageSrc(event.poster || DEFAULT_HD_EVENT_POSTER)}
                alt={event.title}
                fill
                priority
                quality={100}
                sizes="(max-width: 768px) 100vw, 440px"
                className="object-cover object-center brightness-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

              {/* Overlaid Action Buttons Bottom Right (Heart & Share Popover) */}
              <div className="absolute bottom-4 right-4 flex items-center gap-2.5 z-20">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!userLoggedIn) {
                      onOpenAuth?.();
                      return;
                    }
                    onToggleFavorite?.(event.id, e);
                  }}
                  className="w-10 h-10 rounded-full backdrop-blur-md border border-white bg-white hover:bg-zinc-100 flex items-center justify-center transition-all active:scale-95 shadow-xl cursor-pointer"
                  aria-label="Guardar favorito"
                >
                  <Heart
                    className={`w-4 h-4 transition-colors ${
                      isFavorite ? "fill-red-500 text-red-500" : "text-zinc-900"
                    }`}
                  />
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowShareMenu(!showShareMenu);
                    }}
                    className="w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center transition-all active:scale-95 bg-white hover:bg-zinc-100 border-white text-zinc-900 shadow-xl cursor-pointer"
                    aria-label="Compartir evento"
                  >
                    <Share2 className="w-4 h-4 text-zinc-900" />
                  </button>

                  {/* Share Popover Menu (Glassmorphism Oscuro Matching User Request) */}
                  <AnimatePresence>
                    {showShareMenu && (
                      <>
                        <div
                          className="fixed inset-0 z-[95] bg-transparent cursor-default pointer-events-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowShareMenu(false);
                          }}
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: 10 }}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute bottom-12 right-0 z-[100] w-52 bg-zinc-950/90 backdrop-blur-2xl text-white shadow-[0_25px_60px_rgba(0,0,0,0.85)] rounded-2xl p-1.5 border border-white/20 flex flex-col divide-y divide-white/10 select-none"
                        >
                          {/* Copiar link */}
                          <button
                            type="button"
                            onClick={(e) => handleCopyLink(e)}
                            className="w-full flex items-center justify-between px-3.5 py-3 hover:bg-white/15 transition-colors cursor-pointer text-xs font-semibold text-white rounded-xl"
                          >
                            <span>{copiedLink ? "¡Link copiado!" : "Copiar link"}</span>
                            {copiedLink ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4 text-zinc-300" />
                            )}
                          </button>

                          {/* WhatsApp */}
                          <button
                            type="button"
                            onClick={(e) => handleShareWhatsApp(e)}
                            className="w-full flex items-center justify-between px-3.5 py-3 hover:bg-white/15 transition-colors cursor-pointer text-xs font-semibold text-white rounded-xl"
                          >
                            <span>WhatsApp</span>
                            <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                              <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984 0 1.76.459 3.477 1.33 4.987l-1.412 5.16 5.281-1.385c1.455.794 3.1 1.213 4.787 1.214h.004c5.505 0 9.987-4.479 9.988-9.986 0-2.668-1.038-5.176-2.925-7.062a9.924 9.924 0 0 0-7.063-2.916zm5.952 14.225c-.247.697-1.439 1.332-1.996 1.411-.512.072-1.176.103-3.69-.933-3.218-1.327-5.282-4.604-5.442-4.819-.159-.214-1.303-1.734-1.303-3.308 0-1.574.821-2.348 1.112-2.668.291-.32.635-.4.846-.4.212 0 .423.002.608.01.196.009.463-.075.725.555.264.634.9 2.195.979 2.355.079.16.132.348.026.56-.106.213-.159.347-.317.533-.159.187-.333.418-.476.561-.159.159-.325.333-.14.65.186.317.825 1.36 1.77 2.202 1.215 1.082 2.24 1.418 2.557 1.576.317.159.503.133.688-.079.185-.213.793-.925 1.005-1.243.212-.317.423-.264.714-.159.291.106 1.849.872 2.166 1.03.317.159.529.238.608.37.079.133.079.771-.168 1.468z"/>
                            </svg>
                          </button>

                          {/* Facebook */}
                          <button
                            type="button"
                            onClick={(e) => handleShareFacebook(e)}
                            className="w-full flex items-center justify-between px-3.5 py-3 hover:bg-white/15 transition-colors cursor-pointer text-xs font-semibold text-white rounded-xl"
                          >
                            <span>Facebook</span>
                            <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                          </button>

                          {/* X */}
                          <button
                            type="button"
                            onClick={(e) => handleShareX(e)}
                            className="w-full flex items-center justify-between px-3.5 py-3 hover:bg-white/15 transition-colors cursor-pointer text-xs font-semibold text-white rounded-xl"
                          >
                            <span>X</span>
                            <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* 4GO Anti-Scalping Protection Badge */}
            <div className="space-y-3 pt-1 text-center">
              <p className="text-xs text-zinc-300 leading-relaxed font-medium text-center">
                4GO protege a asistentes y organizadores contra la reventa ilegal. Tus entradas oficiales se confirman y quedan guardadas con acceso digital directo y 100% seguro.
              </p>
            </div>
          </div>

          {/* ─── RIGHT COLUMN (EVENT INFO + YELLOW COMPRAR TICKET BOX + CARTEL + SALA) ─── */}
          <div className="lg:col-span-7 flex flex-col space-y-6">
            
            {/* Title & Subtitle (Bold exact font weight matching Photo 1) */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1] font-sans">
                {event.title}
              </h1>
              <p className="text-xl sm:text-2xl font-bold text-zinc-200 tracking-tight">
                {event.subtitle || event.venue || "CUBIC LOJA"}
              </p>
            </div>

            {/* Date & Time Highlight (Yellow bold text exact match to screenshot) */}
            <div className="space-y-2">
              <p className="text-lg sm:text-xl font-bold text-yellow-400 tracking-tight">
                {event.dateLabel || "sáb, 19 sept, 22:00 GMT-5"}
              </p>
              <div className="flex items-center gap-4 text-xs font-bold text-zinc-300 pt-0.5">
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{event.category || "Fiesta / DJ"}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{event.city || "Loja"}</span>
                </span>
              </div>

              {/* Badge 'Muy vendido' (Only if explicitly marked as popular/high sales) */}
              {Boolean((event as any)?.isPopular || (event as any)?.isVeryPopular) && (
                <div className="pt-1 flex items-center">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#ff6600] text-black font-extrabold text-xs shadow-md tracking-tight select-none">
                    <Flame className="w-3.5 h-3.5 fill-black stroke-black" />
                    <span>Muy vendido</span>
                  </div>
                </div>
              )}
            </div>

            {/* ─── WHITE TICKET PRICE BOX WITH YELLOW COMPRAR BUTTON (DESKTOP) ─── */}
            <div className="hidden lg:flex bg-white text-black rounded-3xl p-6 sm:p-7 flex-row items-center justify-between gap-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <div className="space-y-1 text-left">
                <div className="text-2xl sm:text-3xl font-black text-black tracking-tight font-sans">
                  Desde {displayPrice}
                </div>
                <p className="text-xs text-zinc-600 font-medium leading-normal">
                  Precio final con acceso asegurado. Sin cargos sorpresa al pagar.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onBuy(event)}
                className="px-9 py-4 rounded-full bg-[#dfff28] hover:bg-[#cbf01a] text-black font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 text-center shadow-md"
              >
                COMPRAR
              </button>
            </div>

            {/* ─── "Información" Section ─── */}
            <div ref={infoSectionRef} className="space-y-3 pt-4 border-t border-white/10">
              <h2 className="text-2xl font-black text-white tracking-tight">
                Información
              </h2>
              <p className={`text-sm text-zinc-300 leading-relaxed font-medium ${!isExpandedDescription ? "line-clamp-4" : ""}`}>
                {event.description ||
                  `Llega la fiesta más esperada a CUBIC Loja. Presentado por SATA con barra libre, show audiovisual cinematográfico y la mejor música en vivo.`}
              </p>
              <button
                type="button"
                onClick={() => setIsExpandedDescription(!isExpandedDescription)}
                className="text-xs font-bold text-white hover:underline cursor-pointer"
              >
                {isExpandedDescription ? "Leer menos" : "Leer más"}
              </button>
            </div>

            {/* ─── Event Badges / Icons (Exact Match to Screenshot) ─── */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              <div className="flex items-center gap-3 text-xs text-zinc-300 font-medium">
                <Info className="w-4 h-4 text-zinc-400 shrink-0" />
                <span>This is an 18+ event</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-300 font-medium">
                <Megaphone className="w-4 h-4 text-zinc-400 shrink-0" />
                <span>Presented by {event.organizer || "CUBIC & SATA"}</span>
              </div>
              <div className="flex flex-col space-y-1 text-xs text-zinc-300 font-medium">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span>Puedes <strong>obtener un reembolso</strong> si:</span>
                </div>
                <ul className="pl-7 list-disc text-zinc-400 text-xs space-y-0.5">
                  <li>Este evento se reprograma o se cancela</li>
                </ul>
                <p className="pl-7 text-[11px] text-zinc-500 pt-1">
                  No puedes obtener un reembolso dentro de las 24 horas previas al inicio del evento.
                </p>
              </div>
            </div>

            {/* ─── "PROMOTOR" / Organizers & Promoters List ─── */}
            <div className="space-y-4 pt-6 border-t border-white/10">
              <h2 className="text-2xl font-black text-white tracking-tight">
                PROMOTOR
              </h2>

              <div className="space-y-3">
                {(() => {
                  let activeProfile = userProfile;
                  if (!activeProfile && typeof window !== "undefined") {
                    try {
                      const stored = localStorage.getItem("organizer_profile");
                      if (stored) activeProfile = JSON.parse(stored);
                    } catch {}
                  }

                  const primaryOrgRaw = (event.organizer || "Cubic").trim();
                  
                  // Collect all candidate organizer names
                  const rawCandidates: string[] = [primaryOrgRaw];

                  const rawCoOrgs = Array.isArray(event.organizers) && event.organizers.length > 0
                    ? event.organizers
                    : Array.isArray(event.lineup) && event.lineup.length > 0
                    ? event.lineup
                    : [];

                  for (const co of rawCoOrgs) {
                    if (co && typeof co === "string" && co.trim()) {
                      rawCandidates.push(co.trim());
                    }
                  }

                  // Deduplicate and build clean promoters list
                  const seenKeys = new Set<string>();
                  const list: Array<{
                    id: string;
                    slug?: string;
                    name: string;
                    type: string;
                    img: string;
                    instagramUrl: string;
                    isFollowing: boolean;
                  }> = [];

                  for (let i = 0; i < rawCandidates.length; i++) {
                    const candidate = rawCandidates[i];
                    if (!candidate) continue;

                    const lower = candidate.toLowerCase().trim();
                    const isCubic = lower.includes("cubic");
                    const isSata = lower.includes("sata");
                    const is4go = lower.includes("4go") || lower.includes("master") || lower.includes("headquarters");

                    // Check if candidate matches the logged in user profile (e.g. prueba1)
                    const isCurrentUser = !isCubic && !isSata && !!(
                      activeProfile &&
                      (
                        (activeProfile.venueName && activeProfile.venueName.toLowerCase().trim() === lower) ||
                        (activeProfile.name && activeProfile.name.toLowerCase().trim() === lower) ||
                        (activeProfile.email && activeProfile.email.toLowerCase().trim() === lower) ||
                        lower.includes("prueba") ||
                        (is4go && (activeProfile.id === "master_admin" || activeProfile.email?.toLowerCase().includes("master") || activeProfile.email?.toLowerCase().includes("brandon.medina")))
                      )
                    );

                    const canonicalKey = isCubic
                      ? "cubic"
                      : isSata
                      ? "sata"
                      : is4go
                      ? "4go"
                      : isCurrentUser
                      ? "current_user_promoter"
                      : `org_${lower.replace(/[^a-z0-9]+/g, "_")}`;

                    // Never add duplicate promoter
                    if (seenKeys.has(canonicalKey)) continue;

                    // If candidate is Cubic, but primary promoter is a custom creator (e.g. prueba1) AND Cubic is just the venue, skip!
                    const isPrimaryCustom = !primaryOrgRaw.toLowerCase().includes("cubic") && !primaryOrgRaw.toLowerCase().includes("sata");
                    const isVenueLocation = (event.venue || "").toLowerCase().includes("cubic");
                    if (isCubic && isPrimaryCustom && isVenueLocation) {
                      continue;
                    }

                    seenKeys.add(canonicalKey);

                    let name = isCubic
                      ? "CUBIC"
                      : isSata
                      ? "SATA"
                      : is4go
                      ? "4GO"
                      : isCurrentUser
                      ? (activeProfile?.venueName || activeProfile?.name || candidate).toUpperCase()
                      : candidate.toUpperCase();

                    if (name.includes("4GO MASTER") || name.includes("HEADQUARTERS")) {
                      name = "4GO";
                    }

                    let type = isCubic
                      ? "Discoteca / Club"
                      : isSata
                      ? "Organizador de eventos"
                      : is4go
                      ? "Organizador"
                      : isCurrentUser
                      ? (activeProfile?.type && !activeProfile.type.toLowerCase().includes("master") ? activeProfile.type : "Organizador")
                      : "Organizador de eventos";

                    if (type.toLowerCase().includes("master") || type.toLowerCase().includes("admin")) {
                      type = "Organizador";
                    }

                    const isPrueba = lower.includes("prueba");
                    const orgKey = isCubic ? "cubic" : isSata ? "sata" : is4go ? "4go" : isPrueba ? "prueba1" : lower;
                    const staticOrg = ORGANIZER_DATA[orgKey] || ORGANIZER_DATA[lower];

                    const img = is4go
                      ? "/images/logo_4go_black_white.png"
                      : (activeProfile?.avatar && (isCurrentUser || isPrueba))
                      ? activeProfile.avatar
                      : staticOrg?.logo
                      ? staticOrg.logo
                      : isCubic
                      ? "/images/cubic-official-logo.png"
                      : isSata
                      ? "/images/sata-official-logo.jpg"
                      : isPrueba
                      ? "/images/logo_4go_black_white.png"
                      : (event as any).miniImage || event.poster || event.imageUrl || "";

                    const instagramUrl =
                      staticOrg?.instagramUrl ||
                      (isCubic
                        ? "https://www.instagram.com/cubic_loja/?hl=es"
                        : isSata
                        ? "https://www.instagram.com/sata_events/"
                        : isPrueba
                        ? "https://www.instagram.com/brandon.mdna/"
                        : isCurrentUser && activeProfile?.instagram
                        ? `https://instagram.com/${activeProfile.instagram.replace(/^@/, "")}`
                        : orgKey
                        ? `https://www.instagram.com/${orgKey.replace(/[^a-z0-9_.]/g, "")}/`
                        : "https://www.instagram.com/4gooooooooo/");

                    list.push({
                      id: canonicalKey,
                      slug: orgKey,
                      name,
                      type,
                      img,
                      instagramUrl,
                      isFollowing: !!followedIds[canonicalKey],
                    });
                  }

                  return list.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                    >
                      <div
                        onClick={() => onOpenOrganizer?.(item.slug || item.id)}
                        className="flex items-center gap-3.5 cursor-pointer group"
                      >
                        <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white/20 group-hover:border-white bg-zinc-900 shrink-0 transition-colors flex items-center justify-center">
                          {item.img ? (
                            <img
                              src={item.img}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-black text-white uppercase">
                              {item.name.slice(0, 2) || "4G"}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-base font-extrabold text-white leading-tight group-hover:text-zinc-200 transition-colors">
                            {item.name}
                          </span>
                          <span className="text-xs text-zinc-400 font-medium">
                            {item.type}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (item.instagramUrl) {
                            window.open(item.instagramUrl, "_blank", "noopener,noreferrer");
                          }
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs bg-white hover:bg-zinc-200 text-black transition-all cursor-pointer shadow-md active:scale-95 shrink-0"
                        title={`Instagram de ${item.name}`}
                      >
                        <svg className="w-3.5 h-3.5 text-[#E1306C] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                        <span>Instagram</span>
                      </button>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* ─── "Lugar" / Venue & Map Section ─── */}
            <div className="space-y-3 pt-6 border-t border-white/10">
              <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">
                Lugar
              </span>
              
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-3xl font-black text-white tracking-tight">
                    {venueName}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-zinc-300 font-medium">
                    <span>{venueAddress}</span>
                    <button
                      type="button"
                      onClick={copyAddressToClipboard}
                      className="p-1 text-zinc-400 hover:text-white transition cursor-pointer"
                      title="Copiar dirección"
                    >
                      {isAddressCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons: ABRIR EN EL MAPA */}
              <div className="flex items-center gap-3 pt-2">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider border border-white/20 backdrop-blur-md transition cursor-pointer flex items-center gap-2 shadow-md active:scale-95"
                >
                  <MapPin className="w-3.5 h-3.5 text-yellow-400" />
                  <span>ABRIR EN EL MAPA</span>
                </a>
              </div>

              {/* Opening Doors Text */}
              <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium pt-2">
                <DoorOpen className="w-4 h-4 text-zinc-400" />
                <span>Apertura de puertas <strong>22:00 GMT-5</strong></span>
              </div>
            </div>

          </div>
        </div>

        {/* ─── FOOTER WITH EVENT ACCESS BANNER (ONLY ON EVENT DETAILS) ─── */}
        <div className="mt-20">
          <Footer showTopBanner={true} />
        </div>
      </div>



      {/* ─── MOBILE FIXED BOTTOM COMPRAR BAR (WHITE CARD STYLE) ─── */}
      <div className="fixed bottom-0 inset-x-0 z-[360] bg-white text-black rounded-t-3xl border-t border-zinc-200 px-5 py-4 pb-safe flex items-center justify-between shadow-[0_-15px_40px_rgba(0,0,0,0.6)] lg:hidden">
        <div className="flex flex-col text-left space-y-0.5">
          <div className="text-xl sm:text-2xl font-black text-black leading-tight font-sans">
            Desde {displayPrice}
          </div>
          <span className="text-[11px] font-bold text-zinc-600 leading-none">
            Precio final garantizado
          </span>
        </div>

        <button
          type="button"
          onClick={() => onBuy(event)}
          className="px-8 py-3.5 rounded-full bg-[#dfff28] hover:bg-[#d4f522] text-black font-black text-xs uppercase tracking-widest transition-all active:scale-95 cursor-pointer shadow-md shrink-0"
        >
          COMPRAR
        </button>
      </div>

      {/* Full Poster Lightbox */}
      <AnimatePresence>
        {isLightboxOpen && event.poster && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-8 cursor-pointer select-none"
            onClick={() => setIsLightboxOpen(false)}
          >
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-6 right-6 h-11 w-11 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center hover:bg-white hover:text-black transition-all cursor-pointer z-[510]"
              aria-label="Cerrar vista completa"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="relative max-w-5xl max-h-[90vh] flex items-center justify-center">
              <Image
                src={getHdImageSrc(event.poster || DEFAULT_HD_EVENT_POSTER)}
                alt={event.title}
                width={1600}
                height={1600}
                quality={100}
                sizes="(max-width: 768px) 100vw, 85vw"
                className="max-w-full max-h-[88vh] w-auto h-auto object-contain rounded-3xl shadow-2xl border border-white/15 cursor-default"
                priority
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
