"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, Ticket, Check, ShieldCheck, UserCheck, Armchair } from "lucide-react";
import type { Event } from "@/frontend/types/domain";

interface ReservationCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
  userProfile: any;
  userLoggedIn: boolean;
  userReservations: Record<string, boolean>;
  onConfirmReservation: (eventId: string, tierId: string) => void;
  onOpenAuth: () => void;
  onViewMyReservations: () => void;
}

export interface TierOption {
  id: string;
  name: string;
  price: number;
  releaseTag: string;
  type: "ticket" | "table";
}

const DEFAULT_TIERS: TierOption[] = [
  {
    id: "preventa-1",
    name: "GA - Preventa 1 (Entry BEFORE 1AM)",
    price: 5,
    releaseTag: "(1st Release)",
    type: "ticket",
  },
  {
    id: "preventa-2",
    name: "GA - Preventa 2 (Entry BEFORE 3AM)",
    price: 7,
    releaseTag: "(2nd Release)",
    type: "ticket",
  },
  {
    id: "preventa-3",
    name: "GA - Preventa 3 (Entry ANYTIME)",
    price: 10,
    releaseTag: "(3rd Release)",
    type: "ticket",
  },
  {
    id: "mesa-normal",
    name: "MESA NORMAL (Incluye 4 Pases)",
    price: 50,
    releaseTag: "(Mesa Standard)",
    type: "table",
  },
  {
    id: "mesa-vip",
    name: "MESA VIP STAGE (Incluye 8 Pases)",
    price: 120,
    releaseTag: "(Mesa VIP Exclusiva)",
    type: "table",
  },
];

const getHdImageSrc = (src?: string) => {
  if (!src) return "/images/now4go-hero-presentation-hd-v3.png";
  if (src.includes("event_fisher") || src.includes("fisher")) return "/images/now4go-hero-presentation-hd-v3.png";
  if (src.includes("yan_block") || src.includes("trap-loud")) return "/images/yan_block_artist_1779161408288.png";
  if (src.includes("anuel")) return "/images/trap_loud_anuel_1778966415162.png";
  if (src.includes("brent")) return "/images/rnb_loud_brent_1778966427864.png";
  if (src.includes("bad_bunny")) return "/images/latin_loud_bad_bunny_1778966469259.png";
  return src;
};

export default function ReservationCheckoutModal({
  isOpen,
  onClose,
  event,
  userProfile,
  userLoggedIn,
  userReservations,
  onConfirmReservation,
  onOpenAuth,
  onViewMyReservations,
}: ReservationCheckoutModalProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showLimitWarning, setShowLimitWarning] = useState(false);

  const activeEvent = event || {
    id: "fisher-factory-town",
    title: "FISHER",
    dateLabel: "SÁB, 26 SEPT, 22:00 GMT-5",
    venue: "CUBIC CLUB LOJA",
    poster: "/images/event_fisher.png",
    price: 5,
  };

  const isAlreadyReserved = userLoggedIn && Boolean(activeEvent?.id && userReservations[activeEvent.id]);

  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setShowLimitWarning(false);
      // Default to 1 item for Preventa 1 if not already reserved
      if (isAlreadyReserved) {
        setQuantities({});
      } else {
        setQuantities({ "preventa-1": 1 });
      }
    }
  }, [isOpen, isAlreadyReserved, event?.id, userLoggedIn]);

  const handleIncrease = (tierId: string) => {
    if (isAlreadyReserved) return;
    const currentTotal = Object.values(quantities).reduce((a, b) => a + b, 0);
    if (currentTotal >= 4) {
      setShowLimitWarning(true);
      setTimeout(() => setShowLimitWarning(false), 3000);
      return;
    }
    setQuantities((prev) => ({
      ...prev,
      [tierId]: (prev[tierId] || 0) + 1,
    }));
  };

  const handleDecrease = (tierId: string) => {
    if (isAlreadyReserved) return;
    setQuantities((prev) => {
      const current = prev[tierId] || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[tierId];
        return next;
      }
      return { ...prev, [tierId]: current - 1 };
    });
  };

  const totalQuantity = Object.values(quantities).reduce((a, b) => a + b, 0);
  const totalPrice = DEFAULT_TIERS.reduce((sum, tier) => {
    return sum + tier.price * (quantities[tier.id] || 0);
  }, 0);

  const selectedTierId = DEFAULT_TIERS.find((t) => (quantities[t.id] || 0) > 0)?.id || "preventa-1";

  const handleConfirm = () => {
    if (!userLoggedIn) {
      onOpenAuth();
      return;
    }

    if (activeEvent?.id) {
      onConfirmReservation(activeEvent.id, selectedTierId);
      setIsSuccess(true);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className="fixed inset-0 z-[500] bg-[#0c0714] text-white flex flex-col select-none overflow-y-auto p-4 sm:p-6 md:p-8"
    >
          {/* ─── AMBIENT POSTER COLOR BLUR (AUTHENTIC GRADIENT FADE TO DEEP BLACK) ─── */}
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
                src={activeEvent.poster || "/images/now4go-hero-presentation-hd-v3.png"}
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

          {/* ─── TOP NAVIGATION HEADER BAR ─── */}
          <header className="fixed top-0 inset-x-0 z-[520] flex items-center justify-between px-4 sm:px-8 py-4 bg-gradient-to-b from-[#0c0714]/90 via-[#0c0714]/50 to-transparent pointer-events-none">
            <button
              type="button"
              onClick={onClose}
              className="pointer-events-auto flex items-center justify-center w-11 h-11 rounded-full bg-black/60 border border-white/20 text-white hover:bg-white/20 backdrop-blur-md transition-all cursor-pointer shadow-2xl active:scale-95"
              aria-label="Volver"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
              <span className={isSuccess ? "text-zinc-500" : "text-white font-black"}>Reserva</span>
              <span>→</span>
              <span className={isSuccess ? "text-white font-black" : "text-zinc-500"}>Pase 4GO</span>
            </div>

            <div className="pointer-events-auto flex items-center gap-3">
              <button
                type="button"
                className="hidden md:inline-flex px-4 py-2 rounded-full bg-black/60 border border-white/20 text-white hover:bg-white/20 backdrop-blur-md text-[11px] font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-2xl active:scale-95"
              >
                ¿TIENES UN CÓDIGO?
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex items-center justify-center w-11 h-11 rounded-full bg-black/60 border border-white/20 text-white hover:bg-white/20 backdrop-blur-md transition-all cursor-pointer shadow-2xl active:scale-95"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* ─── MAIN CONTENT CONTAINER ─── */}
          <div className="relative z-10 flex-1 w-full max-w-6xl mx-auto pt-24 pb-10 px-4 sm:px-8">
            {isSuccess ? (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-xl mx-auto bg-zinc-900/90 backdrop-blur-2xl border border-emerald-500/30 rounded-[36px] p-8 text-center space-y-6 shadow-2xl relative overflow-hidden"
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>

                <div className="space-y-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-widest inline-block">
                    RESERVA CONFIRMADA EN PUERTA
                  </span>
                  <h3 className="text-3xl font-black text-white uppercase tracking-tight">
                    ¡TU LUGAR ESTÁ ASEGURADO!
                  </h3>
                  <p className="text-sm text-zinc-300 font-medium max-w-sm mx-auto">
                    Tu reserva para <strong className="text-white">{activeEvent.title}</strong> ha sido guardada exitosamente. Presenta tu identificación en puerta.
                  </p>
                </div>

                <div className="bg-black/80 border border-white/15 rounded-3xl p-6 space-y-3 max-w-xs mx-auto text-center shadow-inner">
                  <div className="w-32 h-32 mx-auto bg-white p-2 rounded-2xl flex items-center justify-center">
                    <Image
                      src="/images/qr-banco-pichincha.png"
                      alt="QR Pase 4GO"
                      width={110}
                      height={110}
                      className="object-contain"
                    />
                  </div>
                  <div className="text-left space-y-0.5 pt-2 border-t border-white/10">
                    <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest block">TITULAR DEL PASE</span>
                    <p className="text-xs font-black text-white truncate">{userProfile?.name || "Brandon Medina"}</p>
                    <p className="text-[11px] font-medium text-zinc-300 truncate">{userProfile?.email || "brandon.medina@unl.edu.ec"}</p>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onViewMyReservations();
                    }}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#dfff28] hover:bg-[#cbf01a] text-black font-black text-xs uppercase tracking-widest transition shadow-xl cursor-pointer"
                  >
                    VER MIS RESERVAS
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-widest transition cursor-pointer"
                  >
                    CERRAR
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* LEFT COLUMN: EVENT SUMMARY & TIER CARDS */}
                <div className="lg:col-span-7 space-y-5 text-left">
                  {/* Event Header */}
                  <div className="flex items-start gap-4 py-2">
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 border border-white/20 bg-zinc-950 shadow-2xl">
                      <Image
                        src={getHdImageSrc(activeEvent.poster)}
                        alt={activeEvent.title}
                        fill
                        sizes="(max-width: 640px) 64px, 80px"
                        className="object-cover"
                      />
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight truncate drop-shadow-md">
                        {activeEvent.title}
                      </h2>
                      <p className="text-sm sm:text-base font-bold text-white/90 truncate">
                        {activeEvent.dateLabel || "sáb, 26 sept, 22:00 GMT-5"} • {activeEvent.venue || "CUBIC CLUB LOJA"}
                      </p>
                      <div className="flex items-center gap-2 pt-1 text-xs sm:text-sm font-semibold text-zinc-300">
                        <span className="text-zinc-400 font-medium">Promotores:</span>
                        <span className="text-white font-black px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-[11px] uppercase tracking-wider">CUBIC</span>
                        <span className="text-white font-black px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-[11px] uppercase tracking-wider">SATA</span>
                      </div>
                    </div>
                  </div>

                  {showLimitWarning && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-2 shadow-lg"
                    >
                      <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>Máximo 4 pases de reserva por orden de usuario.</span>
                    </motion.div>
                  )}

                  {isAlreadyReserved && (
                    <div className="p-4 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-bold flex items-center justify-between gap-4 shadow-xl backdrop-blur-md">
                      <div className="flex items-center gap-3">
                        <UserCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>Ya tienes 1 reserva activa confirmada para este evento.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onViewMyReservations();
                        }}
                        className="px-4 py-2 rounded-full bg-emerald-400 text-black font-black text-xs uppercase tracking-wider shrink-0 hover:bg-emerald-300 transition cursor-pointer"
                      >
                        VER PASE
                      </button>
                    </div>
                  )}

                  {/* SQUARER TIER CARDS GRID (2-COLUMN MODERN CARDS) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    {DEFAULT_TIERS.map((tier) => {
                      const qty = quantities[tier.id] || 0;
                      const isSelected = qty > 0;
                      return (
                        <div
                          key={tier.id}
                          className={`relative p-5 rounded-3xl border transition-all backdrop-blur-xl flex flex-col justify-between space-y-4 min-h-[145px] ${
                            isSelected
                              ? "bg-black/95 border-white shadow-[0_0_30px_rgba(255,255,255,0.15)] ring-1 ring-white/40"
                              : "bg-black/60 border-white/20 hover:border-white/40"
                          }`}
                        >
                          {/* Top: Title & Release Tag */}
                          <div className="space-y-1 min-w-0">
                            <span className="text-[11px] font-bold text-zinc-400 block tracking-wider uppercase">
                              {tier.releaseTag}
                            </span>
                            <h3 className="text-sm sm:text-base font-black text-white tracking-tight leading-snug line-clamp-2">
                              {tier.name}
                            </h3>
                          </div>

                          {/* Bottom Row: Price & Quantity Counter */}
                          <div className="flex items-end justify-between gap-2 pt-2 border-t border-white/10">
                            <div className="space-y-0.5">
                              <span className="text-xs font-semibold text-zinc-400 block">Precio</span>
                              <span className="text-lg sm:text-xl font-black text-white">
                                {tier.price.toFixed(2)} $
                              </span>
                            </div>

                            {/* Quantity Counter Box */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleDecrease(tier.id)}
                                disabled={isAlreadyReserved || qty === 0}
                                className="w-7 h-7 flex items-center justify-center text-white hover:text-zinc-300 disabled:opacity-30 text-lg font-black transition cursor-pointer"
                                aria-label="Disminuir"
                              >
                                —
                              </button>

                              <div className="w-11 h-9 rounded-xl bg-zinc-800/90 border border-white/20 flex items-center justify-center font-black text-xs text-white shadow-inner">
                                {tier.type === "table" ? (
                                  <Armchair className="w-3.5 h-3.5 mr-1 text-amber-400" />
                                ) : (
                                  <Ticket className="w-3.5 h-3.5 mr-1 text-zinc-400" />
                                )}
                                <span>{qty}</span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleIncrease(tier.id)}
                                disabled={isAlreadyReserved}
                                className="w-7 h-7 flex items-center justify-center text-white hover:text-zinc-300 disabled:opacity-30 text-lg font-black transition cursor-pointer"
                                aria-label="Aumentar"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* RIGHT COLUMN: FLOATING SUMMARY CARD */}
                <div className="lg:col-span-5 space-y-4 text-left">
                  <div className="bg-white text-black rounded-[32px] p-6 sm:p-8 shadow-2xl space-y-6 border border-white font-sans">
                    <div className="space-y-1 border-b border-zinc-200 pb-4">
                      <h3 className="text-2xl font-black uppercase tracking-tight text-black">
                        {totalQuantity} {totalQuantity === 1 ? "reserva" : "reservas"}
                      </h3>
                      <p className="text-sm font-extrabold text-zinc-700">
                        Total – {totalPrice.toFixed(2)} $
                      </p>
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border-zinc-300 text-black focus:ring-black cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-zinc-700 leading-snug">
                        Deseo recibir correos electrónicos de 4GO con novedades sobre los próximos eventos y lanzamientos exclusivos.
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={handleConfirm}
                      disabled={totalQuantity === 0 || !acceptTerms}
                      className="w-full py-4 rounded-full bg-[#dfff28] hover:bg-[#cbf01a] text-black font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 cursor-pointer disabled:bg-zinc-300 disabled:text-zinc-500 disabled:cursor-not-allowed"
                    >
                      {isAlreadyReserved
                        ? "YA TIENES 1 RESERVA CONFIRMADA"
                        : !userLoggedIn
                        ? "INICIAR SESIÓN Y CONFIRMAR"
                        : "CONFIRMAR RESERVA EN LISTA"}
                    </button>
                  </div>

                  <div className="flex items-center gap-4 text-zinc-300 text-[11px] leading-relaxed pt-2">
                    <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center shrink-0 shadow-lg overflow-hidden border border-white/20">
                      <img
                        src="/images/logo_4go_black_white.png"
                        alt="4GO Favicon Logo"
                        width={48}
                        height={48}
                        loading="eager"
                        decoding="sync"
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <p className="text-zinc-300 text-xs font-semibold leading-snug">
                      Al solicitar esta reserva, abrirás una cuenta y aceptarás nuestras <a href="/terms_and_conditions" target="_blank" className="text-white font-bold hover:underline">Condiciones de Uso generales</a>, la <a href="/privacy_policy" target="_blank" className="text-white font-bold hover:underline">Política de Privacidad</a> y las <a href="/ticket_reservation_terms" target="_blank" className="text-white font-bold hover:underline">Condiciones de Reserva</a>. Procesamos tus datos personales de acuerdo con nuestra <a href="/privacy_policy" target="_blank" className="text-white font-bold hover:underline">Política de Privacidad</a>.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
  );
}

