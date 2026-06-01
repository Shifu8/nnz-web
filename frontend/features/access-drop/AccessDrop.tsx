"use client";

import { useState, useEffect, useRef, type CSSProperties } from "react";
import {
  ChevronRight,
  ChevronLeft,
  Zap,
  ShieldAlert,
  MapPin,
  Calendar,
  Minus,
  Plus,
} from "lucide-react";
import { gsap, useGSAP } from "@/frontend/animations/gsapSetup";
import PartyPass from "./PartyPass";
import BankTransferInfo from "./BankTransferInfo";
import { events } from "@/frontend/services/dawgsData";
import { useCountdown } from "@/frontend/hooks/useCountdown";
import { isBadWord } from "@/lib/badWords";
import { loadCheckoutDraft, saveCheckoutDraft } from "@/lib/persistence/clientState";

const EVENT = events[0];

const PRICE_PER_TICKET = 10;

const SPONSORS = [
  { name: "Kyoto Sushi", color: "text-red-500", border: "border-red-500/20", emoji: "🍣" },
  { name: "Iron Athletics", color: "text-zinc-300", border: "border-zinc-500/20", emoji: "💪" },
  { name: "Zen Fisio", color: "text-blue-400", border: "border-blue-500/20", emoji: "🧘" },
];

type DropState = "intro" | "register" | "payment" | "pendiente" | "winner" | "loser";

export default function AccessDrop({ onClose }: { onClose?: () => void }) {
  const scope = useRef<HTMLElement>(null);
  const introPanelRef = useRef<HTMLDivElement>(null);
  const formPanelRef = useRef<HTMLDivElement>(null);
  const paymentPanelRef = useRef<HTMLDivElement>(null);

  const [dropState, setDropState] = useState<DropState>("intro");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [quantity, setQuantity] = useState(1);
  const [selectedBank, setSelectedBank] = useState("banco-loja");
  const [selectedDesign, setSelectedDesign] = useState(1);
  const [passData, setPassData] = useState<{
    firstName: string;
    lastName: string;
    serialNumber: string;
    qrPayload: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [receiptStatus, setReceiptStatus] = useState<string | null>(null);

  const countdown = useCountdown(EVENT.startsAt);

  useEffect(() => {
    const draft = loadCheckoutDraft();
    if (draft) {
      queueMicrotask(() => {
        setFormData((prev) => ({ ...prev, ...draft }));
        if (draft.quantity) setQuantity(parseInt(draft.quantity, 10) || 1);
        if (draft.selectedDesign) setSelectedDesign(parseInt(draft.selectedDesign, 10) || 1);
      });
    }
  }, []);

  useEffect(() => {
    saveCheckoutDraft({ ...formData, quantity: quantity.toString(), selectedDesign: selectedDesign.toString() });
  }, [formData, quantity, selectedDesign]);

  useGSAP(
    () => {
      if (dropState === "register" && formPanelRef.current) {
        gsap.fromTo(formPanelRef.current, { opacity: 0, x: 80 }, { opacity: 1, x: 0, duration: 0.6, ease: "power3.out", delay: 0.08 });
      }
      if (dropState === "payment" && paymentPanelRef.current) {
        gsap.fromTo(paymentPanelRef.current, { opacity: 0, y: 40, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out" });
      }
      if (dropState === "winner") {
        gsap.from(".pass-reveal", { scale: 0.8, opacity: 0, y: 50, duration: 1, ease: "elastic.out(1, 0.7)" });
      }
    },
    { scope, dependencies: [dropState] },
  );

  const goToRegister = () => {
    setErrorMsg("");
    setDropState("register");
  };

  const goToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const rawPhone = "593" + formData.phone.replace(/\D/g, "");
    if (!/^59309\d{8}$/.test(rawPhone) || rawPhone.length !== 13) {
      setErrorMsg("NÚMERO INVÁLIDO. DEBE SER +593 09XXXXXXXX");
      return;
    }
    if (isBadWord(formData.firstName) || isBadWord(formData.lastName)) {
      setErrorMsg("LENGUAJE INAPROPIADO DETECTADO.");
      return;
    }
    setDropState("payment");
  };

  const handleUploadComplete = (result: {
    receiptId: string;
    status: string;
    autoRejected: boolean;
    rejectionReason?: string | null;
  }) => {
    setReceiptId(result.receiptId);
    setReceiptStatus(result.status);
    setDropState("pendiente");
  };

  const totalPrice = quantity * PRICE_PER_TICKET;

  const renderIntro = () => (
    <div ref={introPanelRef} className="relative z-10 w-full max-w-lg mx-auto">
      {onClose && (
        <button onClick={onClose} className="glass-pill glass-pill-red absolute -top-8 -right-8 z-50">
          <ChevronLeft className="h-3 w-3" /> SALIR
        </button>
      )}
      <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-black/60 shadow-[0_0_60px_rgba(255,0,24,.1)]">
        <div className="absolute inset-0">
          <img src={EVENT.poster} alt="" className="h-full w-full object-cover opacity-30 mix-blend-luminosity" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
        </div>

        <div className="relative p-6 md:p-8">
          <div className="flex items-center gap-2 rounded-full border border-red-500/30 bg-red-950/40 px-3 py-1.5 w-fit text-[9px] font-black uppercase tracking-[0.3em] text-red-200">
            <Zap className="h-3 w-3 text-red-500" /> DAWGS ACCESS
          </div>

          <div className="mt-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-4xl md:text-5xl font-black text-white uppercase leading-none">{EVENT.title}</h2>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.35em] text-red-400">{EVENT.subtitle}</p>
            </div>
            <div className="shrink-0 rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-center">
              <p className="text-xl font-black text-[#C8FF00]">${PRICE_PER_TICKET}</p>
              <p className="text-[7px] font-bold uppercase tracking-widest text-zinc-500">USD</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-[9px] font-black uppercase tracking-widest text-zinc-400">
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
              <MapPin className="h-3 w-3 text-red-400" /> {EVENT.city}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
              <Calendar className="h-3 w-3 text-red-400" /> {EVENT.dateLabel}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {EVENT.lineup.map((artist) => (
              <span key={artist} className="rounded border border-red-500/20 bg-red-950/30 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-red-100">
                {artist}
              </span>
            ))}
          </div>

          {!countdown.expired && (
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/60 p-5">
              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-3 text-center">Tiempo para el evento</p>
              <div className="grid grid-cols-4 gap-2">
                {(["days", "hours", "minutes", "seconds"] as const).map((unit) => (
                  <div key={unit} className="flex flex-col items-center rounded-xl border border-white/[0.06] bg-white/[0.03] py-2.5">
                    <span className="text-xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,.15)]">{countdown[unit]}</span>
                    <span className="text-[7px] font-bold uppercase tracking-widest text-zinc-600">{unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-2 text-center">Patrocinadores</p>
            <div className="grid grid-cols-2 gap-2">
              {SPONSORS.map((s) => (
                <div key={s.name} className={`flex items-center gap-2 rounded-lg border ${s.border} bg-black/30 px-2.5 py-1.5`}>
                  <span className="text-xs">{s.emoji}</span>
                  <span className="text-[8px] font-black uppercase tracking-wider text-white">{s.name}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={goToRegister}
            className="glass-action glass-action-primary mt-5 w-full justify-between"
            style={{ "--glass-action-height": "56px", "--glass-action-px": "1.5rem", "--glass-action-text": "0.82rem" } as CSSProperties}
          >
            <span>COMPRAR ENTRADA</span>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderRegister = () => {
    const TICKET_DESIGNS = [
      { id: 1, name: "BLOCK CARD", gradient: "from-red-900 via-red-950 to-black", accent: "red", label: "TRAP LOUD · YAN BLOCK", serial: "DAWGS-0001-A" },
      { id: 2, name: "BELLAKITA CARD", gradient: "from-[#C8FF00]/20 via-black to-black", accent: "lime", label: "VIP ACCESS · YAN BLOCK", serial: "DAWGS-0002-B" },
    ];
    const songs = [
      { label: "Qué Vas Hacer Hoy", artist: "Yan Block", image: "/images/covers/que-vas-hacer-hoy.jpg", color: "from-red-600 to-red-950", accent: "white", rotate: -12, top: "-4%", left: "0%" },
      { label: "Me gustas CC", artist: "Yan Block", image: "/images/covers/me-gustas-cc.jpg", color: "from-zinc-800 to-black", accent: "white", rotate: 8, top: "-3%", right: "10%" },
      { label: "Talento", artist: "Yan Block", image: "/images/covers/talento.jpg", color: "from-zinc-800 to-black", accent: "white", rotate: -6, top: "30%", left: "-12%" },
      { label: "666", artist: "Yan Block", image: "/images/covers/666.jpg", color: "from-red-800 to-red-950", accent: "white", rotate: 15, bottom: "18%", right: "-6%" },
      { label: "18", artist: "Yan Block", image: "/images/covers/18.jpg", color: "from-black to-zinc-900", accent: "white", rotate: -18, top: "52%", left: "6%" },
      { label: "Yo Se", artist: "Yan Block", image: "/images/covers/yo-se.jpg", color: "from-zinc-800 to-black", accent: "white", rotate: 12, bottom: "48%", left: "-5%" },
      { label: "444", artist: "Yan Block", image: "/images/covers/444.jpg", color: "from-red-900 to-black", accent: "white", rotate: -8, top: "62%", right: "8%" },
      { label: "111", artist: "Yan Block", image: "/images/covers/111.jpg", color: "from-red-700 to-black", accent: "white", rotate: -14, bottom: "15%", left: "-6%" },
      { label: "Vacile", artist: "Yan Block", image: "/images/covers/vacile.jpg", color: "from-zinc-900 to-black", accent: "white", rotate: 18, bottom: "58%", right: "-8%" },
      { label: "Wo Oh Oh", artist: "Omar Courtz & ROA", image: "/images/covers/wo-oh-oh.jpg", color: "from-[#C8FF00]/20 to-zinc-900", accent: "white", rotate: 10, bottom: "-3%", right: "18%" },
      { label: "Tate Quieta", artist: "ROA", image: "/images/covers/tate-quieta.jpg", color: "from-zinc-900 to-black", accent: "white", rotate: 20, bottom: "4%", left: "2%" },
    ];

    return (
      <div className="relative z-10 w-full max-w-7xl mx-auto">
        {onClose && (
          <button onClick={onClose} className="glass-pill glass-pill-red absolute -top-3 right-4 z-50">
            <ChevronLeft className="h-3 w-3" /> SALIR
          </button>
        )}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[1.4fr_1.5fr] md:items-start">
          <div className="relative w-full min-h-[640px] flex flex-col items-center justify-center gap-4">
            <p className="relative z-20 text-[9px] font-black uppercase tracking-[0.35em] text-zinc-500">elige tu diseño</p>
            <div className="relative z-20 flex flex-col items-center gap-4">
              {TICKET_DESIGNS.map((t) => {
                const isSelected = selectedDesign === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedDesign(t.id)}
                    className={`ticket-float w-[240px] text-left transition-all duration-500 ${isSelected ? "scale-105" : "opacity-60 hover:opacity-90 hover:scale-[1.02]"}`}
                    style={{ animationDelay: t.id === 1 ? "0s" : "0.5s" }}
                  >
                    <div className={`relative overflow-hidden rounded-2xl border-2 ${isSelected ? t.id === 1 ? "border-red-500/50 shadow-[0_0_30px_rgba(255,0,24,0.15)]" : "border-[#C8FF00]/50 shadow-[0_0_30px_rgba(200,255,0,0.15)]" : "border-white/10"} bg-gradient-to-br ${t.gradient}`}>
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.08),transparent_60%)]" />
                      <div className="relative p-5 flex flex-col min-h-[260px]">
                        <div className="flex items-center justify-between">
                          <div className={`flex items-center gap-1.5 ${t.accent === "red" ? "text-red-400" : "text-[#C8FF00]"}`}>
                            <Zap className="h-3 w-3" />
                            <span className={`text-[8px] font-black uppercase tracking-[0.3em] ${t.accent === "red" ? "text-red-400" : "text-[#C8FF00]"}`}>DAWGS</span>
                          </div>
                          <div className={`h-5 w-5 rounded-full border ${t.accent === "red" ? "border-red-500/40" : "border-[#C8FF00]/40"} flex items-center justify-center ${isSelected ? (t.accent === "red" ? "bg-red-500/20" : "bg-[#C8FF00]/20") : ""}`}>
                            {isSelected && <div className={`h-2.5 w-2.5 rounded-full ${t.accent === "red" ? "bg-red-500" : "bg-[#C8FF00]"}`} />}
                          </div>
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                          <p className="text-xs font-black text-white uppercase tracking-wider leading-relaxed">{t.label}</p>
                          <div className={`mt-3 h-px w-3/4 ${t.accent === "red" ? "bg-red-500/30" : "bg-[#C8FF00]/30"}`} />
                        </div>
                        <div className="flex items-center justify-between">
                          <p className={`text-[7px] font-mono font-bold ${t.accent === "red" ? "text-red-300" : "text-[#C8FF00]/70"}`}>{t.serial}</p>
                          <div className="rounded border border-white/10 bg-white/[0.04] px-2 py-0.5">
                            <p className="text-[6px] font-black uppercase tracking-wider text-zinc-500">VIP</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <style>{`
              .ticket-float { animation: ticketFloat 4s ease-in-out infinite; }
              @keyframes ticketFloat { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
            `}</style>

            <div className="absolute inset-0 pointer-events-none">
              {songs.map((s, i) => (
                <div
                  key={s.label}
                  className="absolute w-[130px]"
                  style={{
                    top: s.top as string | undefined,
                    right: s.right as string | undefined,
                    bottom: s.bottom as string | undefined,
                    left: s.left as string | undefined,
                    transform: `rotate(${s.rotate}deg)`,
                  }}
                >
                    <div className="album-float-inner" style={{ animationDelay: `${i * 0.3}s` }}>
                    <div className={`rounded-xl overflow-hidden bg-gradient-to-br ${s.color} border border-white/10 shadow-lg relative`}>
                      <div className="aspect-square relative">
                        <img src={s.image} alt={s.label} className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-2.5 text-center">
                          <p className="text-[8px] font-black uppercase leading-tight text-white">{s.label}</p>
                          <p className="text-[6px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5 truncate">{s.artist}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <style>{`
              .album-float-inner { animation: albumFloat 3.5s ease-in-out infinite; }
              @keyframes albumFloat { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
            `}</style>
          </div>

          <div ref={formPanelRef} className="w-full">
            <h2 className="text-4xl font-black text-white tracking-widest uppercase italic">registro</h2>
            <p className="text-sm uppercase tracking-[0.4em] text-red-500 font-bold">completa tus datos</p>

            <form onSubmit={goToPayment} className="mt-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <p className="ml-2 text-xs uppercase tracking-widest text-zinc-500 font-bold">nombre</p>
                  <input required type="text" placeholder="AXEL" className="w-full rounded-xl border border-white/10 bg-black/50 px-5 py-4 text-sm font-bold text-white placeholder-zinc-800 outline-none focus:border-red-500/50 transition" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ\s]/g, "") })} />
                </div>
                <div className="space-y-1.5">
                  <p className="ml-2 text-xs uppercase tracking-widest text-zinc-500 font-bold">apellido</p>
                  <input required type="text" placeholder="PEREZ" className="w-full rounded-xl border border-white/10 bg-black/50 px-5 py-4 text-sm font-bold text-white placeholder-zinc-800 outline-none focus:border-red-500/50 transition" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ\s]/g, "") })} />
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="ml-2 text-xs uppercase tracking-widest text-zinc-500 font-bold">teléfono</p>
                <div className="flex">
                  <span className="inline-flex items-center rounded-l-xl border border-r-0 border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-zinc-400">+593</span>
                  <input required type="tel" maxLength={10} placeholder="0988888888" className="w-full rounded-r-xl border border-white/10 bg-black/50 px-5 py-4 text-sm font-bold text-white placeholder-zinc-800 outline-none focus:border-red-500/50 transition" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") })} />
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/40 p-4 flex items-center gap-4">
                <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${selectedDesign === 1 ? "from-red-900 via-red-950 to-black" : "from-[#C8FF00]/20 via-black to-black"} flex items-center justify-center`}>
                  <Zap className={`h-4 w-4 ${selectedDesign === 1 ? "text-red-400" : "text-[#C8FF00]"}`} />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-black uppercase tracking-wider text-zinc-500">diseño seleccionado</p>
                  <p className="text-sm font-black text-white uppercase tracking-wider">{TICKET_DESIGNS[selectedDesign - 1].name}</p>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/40 p-6">
                <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">cantidad de entradas</p>
                <div className="flex items-center justify-between">
                  <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="glass-icon-button text-white" style={{ "--glass-icon-size": "48px" } as CSSProperties}>
                    <Minus className="h-5 w-5" />
                  </button>
                  <div className="text-center">
                    <span className="text-4xl font-black text-white">{quantity}</span>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">entradas</p>
                  </div>
                  <button type="button" onClick={() => setQuantity(Math.min(10, quantity + 1))} className="glass-icon-button text-white" style={{ "--glass-icon-size": "48px" } as CSSProperties}>
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">total</span>
                  <span className="text-2xl font-black text-[#C8FF00]">${totalPrice.toFixed(2)}</span>
                </div>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-3 text-sm font-bold text-red-400 bg-red-950/40 p-4 rounded-xl border border-red-500/30">
                  <ShieldAlert className="h-4 w-4 shrink-0" /> {errorMsg}
                </div>
              )}

              <button type="submit" className="glass-action glass-action-primary w-full" style={{ "--glass-action-height": "56px", "--glass-action-text": "0.95rem" } as CSSProperties}>
                COMPRAR — ${totalPrice.toFixed(2)}
              </button>

              <button type="button" onClick={() => setDropState("intro")} className="glass-action glass-action-quiet w-full text-zinc-300" style={{ "--glass-action-height": "44px", "--glass-action-text": "0.68rem" } as CSSProperties}>
                &larr; volver al evento
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section id="access" ref={scope} className="relative z-10 mx-auto w-full px-4 py-14 md:py-18 flex justify-center">
      <div className="relative w-full max-w-6xl">
        {dropState === "intro" && renderIntro()}

        {dropState === "register" && renderRegister()}

        {dropState === "payment" && (
          <div ref={paymentPanelRef} className="flex justify-center pt-6">
            <BankTransferInfo
              onClose={onClose}
              selectedBank={selectedBank}
              onSelectBank={setSelectedBank}
              quantity={quantity}
              totalPrice={totalPrice}
              selectedDesign={selectedDesign}
              formData={{
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: `+593 ${formData.phone}`,
              }}
              onUploadComplete={handleUploadComplete}
              onBack={() => setDropState("register")}
            />
          </div>
        )}

        {dropState === "pendiente" && (
          <div className="relative z-10 flex flex-col items-center text-center max-w-md mx-auto py-8 mt-8 pendiente-float">
            <div className="relative h-28 w-28 mb-6">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-28 w-28 rounded-full border-2 border-green-500 shadow-[0_0_40px_rgba(34,197,94,0.3)] pendiente-ring" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="h-16 w-16 pendiente-zap" viewBox="0 0 24 24" fill="none">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#22c55e" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-black text-white uppercase italic tracking-widest">comprobante recibido</h2>
            <p className="mt-3 text-[10px] font-bold text-zinc-400 uppercase tracking-wider leading-relaxed">
              HEMOS RECIBIDO TU COMPROBANTE. UN ADMINISTRADOR LO REVISARÁ Y RECIBIRÁS TU ACCESO POR WHATSAPP UNA VEZ APROBADO.
            </p>
            {receiptId && (
              <div className="mt-6 rounded-xl border border-zinc-800 bg-black/40 px-6 py-4">
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">ID DE REFERENCIA</p>
                <p className="mt-1 text-sm font-mono font-bold text-green-400">{receiptId}</p>
              </div>
            )}
            {onClose && (
              <button onClick={onClose} className="glass-pill">
                CERRAR
              </button>
            )}
            <style>{`
              .pendiente-float { animation: floatUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
              .pendiente-ring { animation: ringPulse 1.5s ease-out 0.3s infinite; }
              .pendiente-zap { animation: zapReveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both; }
              @keyframes floatUp { from { opacity: 0; transform: translateY(60px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
              @keyframes ringPulse { 0% { transform: scale(0.8); opacity: 0; } 50% { opacity: 0.15; } 100% { transform: scale(1.2); opacity: 0; } }
              @keyframes zapReveal { from { opacity: 0; transform: scale(0.3) rotate(-15deg); } to { opacity: 1; transform: scale(1) rotate(0deg); } }
            `}</style>
          </div>
        )}

        {dropState === "winner" && passData && (
          <div className="pass-reveal relative z-10 w-full py-4 mt-8">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-black text-white uppercase italic tracking-widest">¡acceso confirmado!</h2>
              <p className="text-[10px] uppercase tracking-[0.4em] text-red-500 mt-2 font-bold">bienvenido a la familia dawgs</p>
            </div>
            <PartyPass data={passData} />
            <p className="mt-6 text-[10px] font-bold text-zinc-400 text-center max-w-xs mx-auto">
              Escribe a nuestro WhatsApp con tu código: <span className="text-red-400">{passData.serialNumber}</span>
            </p>
          </div>
        )}

        {dropState === "loser" && (
          <div className="relative z-10 flex flex-col items-center text-center max-w-sm mx-auto py-12">
            <ShieldAlert className="h-12 w-12 text-zinc-500 mb-4" />
            <h2 className="text-3xl font-black text-white uppercase">drop agotado</h2>
            <button onClick={() => setDropState("intro")} className="glass-pill mt-8" style={{ padding: "0.625rem 1.25rem", fontSize: "0.65rem" } as CSSProperties}>
              VOLVER
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
