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
  Building2,
  CreditCard,
  Upload,
  FileCheck,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { gsap, useGSAP } from "@/frontend/animations/gsapSetup";
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

const TICKET_DESIGNS = [
  { id: 1, name: "BLOCK CARD", gradient: "from-red-900 via-red-950 to-black", accent: "red", label: "TRAP LOUD · YAN BLOCK", serial: "DAWGS-0001-A" },
  { id: 2, name: "BELLAKITA CARD", gradient: "from-[#C8FF00]/20 via-black to-black", accent: "lime", label: "VIP ACCESS · YAN BLOCK", serial: "DAWGS-0002-B" },
];

const BANKS = [
  {
    id: "banco-loja",
    name: "Banco Loja",
    label: "AHORITA",
    qrImage: "/images/qr-banco-loja.png",
  },
  {
    id: "banco-pichincha",
    name: "Banco Pichincha",
    label: "DE UNA",
    qrImage: "/images/qr-banco-pichincha.png",
  },
];

type DropState = "intro" | "register" | "success";

export default function AccessDrop({ onClose }: { onClose?: () => void }) {
  const scope = useRef<HTMLElement>(null);
  const introPanelRef = useRef<HTMLDivElement>(null);

  const [dropState, setDropState] = useState<DropState>("intro");
  const [formData, setFormData] = useState({ firstName: "", lastName: "", phone: "" });
  const [quantity, setQuantity] = useState(1);
  const [selectedBank, setSelectedBank] = useState("banco-loja");
  const [selectedDesign, setSelectedDesign] = useState(1);
  const [errorMsg, setErrorMsg] = useState("");

  const [step, setStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [receiptId, setReceiptId] = useState<string | null>(null);

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
      if (dropState === "success") {
        gsap.from(".success-reveal", { scale: 0.6, opacity: 0, y: 60, duration: 1, ease: "elastic.out(1, 0.6)" });
        gsap.from(".success-ring", { scale: 0, opacity: 0, duration: 0.8, ease: "power3.out", delay: 0.2 });
        gsap.from(".success-check", { scale: 0, rotate: -90, duration: 0.5, ease: "back.out(2)", delay: 0.5 });
      }
    },
    { scope, dependencies: [dropState] },
  );

  const goToRegister = () => {
    setErrorMsg("");
    setStep(1);
    setDropState("register");
  };

  const handleFileSelect = (file: File | null) => {
    setErrorMsg("");
    if (!file) {
      setSelectedFile(null);
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("ARCHIVO MUY GRANDE. MÁXIMO 5MB.");
      return;
    }
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (![".jpg", ".jpeg", ".png", ".pdf"].includes(ext)) {
      setErrorMsg("FORMATO NO SOPORTADO. USA JPG, PNG O PDF.");
      return;
    }
    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
    if (!selectedFile) {
      setErrorMsg("SELECCIONA UN COMPROBANTE.");
      return;
    }

    setIsSubmitting(true);
    try {
      const body = new FormData();
      body.append("comprobante", selectedFile);
      body.append("firstName", formData.firstName);
      body.append("lastName", formData.lastName);
      body.append("phone", `+593 ${formData.phone}`);
      body.append("quantity", quantity.toString());
      body.append("paymentMethod", selectedBank);

      const res = await fetch("/api/access-drop/upload", { method: "POST", body });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Error al subir comprobante");

      setReceiptId(data.receiptId);
      setDropState("success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al subir comprobante";
      setErrorMsg(message.toUpperCase());
    } finally {
      setIsSubmitting(false);
    }
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
          <button onClick={goToRegister} className="glass-action glass-action-primary mt-5 w-full justify-between" style={{ "--glass-action-height": "56px", "--glass-action-px": "1.5rem", "--glass-action-text": "0.82rem" } as CSSProperties}>
            <span>COMPRAR ENTRADA</span>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <section id="ticket-flow" ref={scope} className="relative z-10 mx-auto flex w-full justify-center px-3 py-8 sm:px-4 md:py-14">
      <div className="relative w-full max-w-6xl">
        {dropState === "intro" && renderIntro()}

        {dropState === "register" && (
          <div className="relative z-10 w-full max-w-5xl mx-auto">
            {onClose && (
              <button onClick={onClose} className="glass-pill glass-pill-red absolute -top-3 right-4 z-50">
                <ChevronLeft className="h-3 w-3" /> SALIR
              </button>
            )}

            {/* Step indicator */}
            <div className="mb-8 flex items-center justify-center gap-1 sm:mb-10 sm:gap-4">
              {[
                { num: 1, label: "DISEÑO" },
                { num: 2, label: "DATOS" },
                { num: 3, label: "PAGO" },
              ].map((s) => (
                <div key={s.num} className="flex items-center gap-1.5 sm:gap-4">
                  <div className="flex items-center gap-2">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-all duration-500 ${step === s.num ? "bg-red-500 shadow-[0_0_20px_rgba(255,0,24,0.3)]" : step > s.num ? "bg-green-500/80" : "border border-white/10 bg-white/[0.04]"}`}>
                      {step > s.num ? <CheckCircle className="h-4 w-4 text-black" /> : <span className={`text-xs font-black ${step === s.num ? "text-white" : "text-zinc-600"}`}>{s.num}</span>}
                    </div>
                    <span className={`text-[7px] font-black uppercase tracking-[0.15em] transition-all duration-500 sm:text-[9px] sm:tracking-[0.3em] ${step === s.num ? "text-white" : "text-zinc-600"}`}>{s.label}</span>
                  </div>
                  {s.num < 3 && <div className={`h-px w-4 transition-all duration-500 sm:w-12 ${step > s.num ? "bg-green-500/50" : "bg-white/10"}`} />}
                </div>
              ))}
            </div>

            {/* Step 1: Diseño */}
            {step === 1 && (
              <div className="w-full max-w-3xl mx-auto">
                <div className="relative flex flex-col items-center justify-center gap-6 sm:flex-row">
                  {TICKET_DESIGNS.map((t) => {
                    const isSelected = selectedDesign === t.id;
                    return (
                      <button key={t.id} type="button" onClick={() => setSelectedDesign(t.id)} className={`ticket-float w-full max-w-[260px] text-left transition-all duration-500 ${isSelected ? "scale-105" : "opacity-60 hover:opacity-90 hover:scale-[1.02]"}`} style={{ animationDelay: t.id === 1 ? "0s" : "0.5s" }}>
                        <div className={`relative overflow-hidden rounded-2xl border-2 ${isSelected ? t.id === 1 ? "border-red-500/50 shadow-[0_0_30px_rgba(255,0,24,0.15)]" : "border-[#C8FF00]/50 shadow-[0_0_30px_rgba(200,255,0,0.15)]" : "border-white/10"} bg-gradient-to-br ${t.gradient}`}>
                          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.08),transparent_60%)]" />
                          <div className="relative p-5 flex flex-col min-h-[280px]">
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
                              <p className="text-sm font-black text-white uppercase tracking-wider leading-relaxed">{t.label}</p>
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
                <div className="mt-8 flex justify-center">
                  <button type="button" onClick={() => setStep(2)} className="glass-action glass-action-primary" style={{ "--glass-action-height": "48px", "--glass-action-px": "2.5rem", "--glass-action-text": "0.82rem" } as CSSProperties}>
                    SIGUIENTE <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 flex justify-center">
                  <button type="button" onClick={() => setDropState("intro")} className="glass-action glass-action-quiet text-zinc-400" style={{ "--glass-action-height": "36px", "--glass-action-px": "1.5rem", "--glass-action-text": "0.6rem" } as CSSProperties}>
                    &larr; volver al evento
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Datos */}
            {step === 2 && (
              <div className="w-full max-w-xl mx-auto space-y-6">
                <div className="text-center">
                  <h2 className="text-3xl font-black text-white tracking-widest uppercase italic">tus datos</h2>
                  <p className="text-xs uppercase tracking-[0.4em] text-red-500 font-bold">completa el formulario</p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

                <div className="flex items-center justify-between gap-4">
                  <button type="button" onClick={() => setStep(1)} className="glass-action glass-action-quiet" style={{ "--glass-action-height": "44px", "--glass-action-px": "1.5rem", "--glass-action-text": "0.68rem" } as CSSProperties}>
                    <ChevronLeft className="h-4 w-4" /> ANTERIOR
                  </button>
                  <button type="button" onClick={() => setStep(3)} className="glass-action glass-action-primary" style={{ "--glass-action-height": "44px", "--glass-action-px": "2rem", "--glass-action-text": "0.82rem" } as CSSProperties}>
                    SIGUIENTE <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Pago */}
            {step === 3 && (
              <div className="w-full max-w-2xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="text-center">
                    <h2 className="text-3xl font-black text-white tracking-widest uppercase italic">pago</h2>
                    <p className="text-xs uppercase tracking-[0.4em] text-red-500 font-bold">elige tu método</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-3 text-center">Paga con</p>
                    <div className="grid grid-cols-2 gap-3">
                      {BANKS.map((bank) => (
                        <button key={bank.id} type="button" onClick={() => setSelectedBank(bank.id)} className={`glass-select-tile p-4 text-center transition-all duration-300 ${selectedBank === bank.id ? "glass-select-tile-active scale-[1.02]" : "hover:border-white/25"}`}>
                          {selectedBank === bank.id && <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,0,24,.08),transparent_60%)]" />}
                          <div className="relative">
                            <Building2 className={`mx-auto h-6 w-6 ${selectedBank === bank.id ? "text-red-400" : "text-zinc-500"}`} />
                            <p className={`mt-1.5 text-[10px] font-black uppercase tracking-wider ${selectedBank === bank.id ? "text-white" : "text-zinc-400"}`}>{bank.name}</p>
                            <p className={`mt-0.5 text-sm font-black tracking-widest ${selectedBank === bank.id ? "text-[#C8FF00]" : "text-zinc-600"}`}>{bank.label}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-[1fr_auto]">
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <CreditCard className="h-4 w-4 text-red-400" />
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-400">cuenta</p>
                        </div>
                        <div className="rounded-xl border border-white/[0.06] bg-black/40 p-4">
                          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">a nombre de:</p>
                          <div className="flex items-center gap-2">
                            <p className="text-base font-black text-white tracking-wider">MEDINA BRANDON</p>
                            <span className="rounded-full border border-red-500/20 bg-red-950/40 px-2 py-0.5 text-[7px] font-black uppercase tracking-widest text-red-300">miembro dawgs</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="ml-2 text-[7px] uppercase tracking-widest text-zinc-500 font-bold">sube tu comprobante (JPG, PNG, PDF)</p>
                        <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files?.[0] || null); }} onClick={() => fileInputRef.current?.click()} className={`relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition ${dragOver ? "border-red-500 bg-red-950/20" : selectedFile ? "border-green-500/40 bg-green-950/10" : "border-white/10 bg-black/40 hover:border-white/20"}`}>
                          <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={(e) => handleFileSelect(e.target.files?.[0] || null)} />
                          {selectedFile && preview ? (
                            <div className="w-full">
                              <img src={preview} alt="" className="mx-auto max-h-32 rounded-lg object-contain" />
                              <p className="mt-2 text-center text-[8px] font-bold text-green-400 uppercase tracking-wider"><FileCheck className="mr-1 inline h-3 w-3" /> {selectedFile.name}</p>
                              <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="glass-action glass-action-danger mx-auto mt-2" style={{ "--glass-action-height": "28px", "--glass-action-px": "0.75rem", "--glass-action-text": "0.44rem" } as CSSProperties}>eliminar</button>
                            </div>
                          ) : selectedFile ? (
                            <div className="text-center">
                              <FileCheck className="mx-auto h-8 w-8 text-green-400" />
                              <p className="mt-2 text-[8px] font-bold text-green-400 uppercase tracking-wider">{selectedFile.name}</p>
                              <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="glass-action glass-action-danger mx-auto mt-2" style={{ "--glass-action-height": "28px", "--glass-action-px": "0.75rem", "--glass-action-text": "0.44rem" } as CSSProperties}>eliminar</button>
                            </div>
                          ) : (
                            <><Upload className="mb-2 h-7 w-7 text-zinc-600" /><p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">ARRASTRA O SELECCIONA</p><p className="mt-1 text-[6px] text-zinc-700 uppercase tracking-widest">JPG, PNG o PDF — 5MB máx</p></>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5">
                      <p className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-3 text-center">código QR</p>
                      <div className="flex items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/40 p-4 w-fit mx-auto">
                        <img src={BANKS.find((b) => b.id === selectedBank)?.qrImage} alt="QR" className="h-28 w-28 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; const parent = (e.target as HTMLImageElement).parentElement; if (parent) parent.innerHTML = '<div class="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">QR no disponible</div>'; }} />
                      </div>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="flex items-center gap-3 text-sm font-bold text-red-400 bg-red-950/40 p-4 rounded-xl border border-red-500/30">
                      <ShieldAlert className="h-4 w-4 shrink-0" /> {errorMsg}
                    </div>
                  )}

                  <button type="submit" disabled={isSubmitting} className="glass-action glass-action-primary w-full" style={{ "--glass-action-height": "56px", "--glass-action-text": "0.95rem" } as CSSProperties}>
                    {isSubmitting ? <><Loader2 className="h-5 w-5 animate-spin" /> ENVIANDO...</> : <>COMPRAR — ${totalPrice.toFixed(2)}</>}
                  </button>

                  <div className="flex items-center justify-center">
                    <button type="button" onClick={() => setStep(2)} className="glass-action glass-action-quiet text-zinc-400" style={{ "--glass-action-height": "36px", "--glass-action-px": "1.5rem", "--glass-action-text": "0.6rem" } as CSSProperties}>
                      <ChevronLeft className="h-4 w-4" /> ANTERIOR
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {dropState === "success" && (
          <div className="success-reveal relative z-10 flex flex-col items-center text-center max-w-md mx-auto py-12 mt-8">
            <div className="success-ring relative h-32 w-32 mb-8">
              <div className="absolute inset-0 rounded-full border-4 border-[#C8FF00] shadow-[0_0_60px_rgba(200,255,0,0.3)] success-ring-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="success-check flex h-20 w-20 items-center justify-center rounded-full bg-[#C8FF00] shadow-[0_0_40px_rgba(200,255,0,0.4)]">
                  <CheckCircle className="h-10 w-10 text-black" />
                </div>
              </div>
            </div>
            <h2 className="text-3xl font-black text-white uppercase italic tracking-widest drop-shadow-[0_0_20px_rgba(200,255,0,0.3)]">compra realizada</h2>
            <p className="mt-4 text-[11px] font-bold text-zinc-400 uppercase tracking-wider leading-relaxed max-w-sm">
              HEMOS RECIBIDO TU COMPROBANTE. UN ADMINISTRADOR LO REVISARÁ Y RECIBIRÁS TU ACCESO POR WHATSAPP.
            </p>
            {receiptId && (
              <div className="mt-6 rounded-xl border border-[#C8FF00]/20 bg-black/50 px-6 py-4 shadow-[0_0_30px_rgba(200,255,0,0.05)]">
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">ID DE REFERENCIA</p>
                <p className="mt-1 text-sm font-mono font-bold text-[#C8FF00]">{receiptId}</p>
              </div>
            )}
            {onClose && (
              <button onClick={onClose} className="glass-action glass-action-primary mt-8" style={{ "--glass-action-height": "48px", "--glass-action-px": "2rem", "--glass-action-text": "0.72rem" } as CSSProperties}>
                CERRAR
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`
        .ticket-float { animation: ticketFloat 4s ease-in-out infinite; }
        @keyframes ticketFloat { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
        .album-float-inner { animation: albumFloat 3.5s ease-in-out infinite; }
        @keyframes albumFloat { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        .success-ring-pulse { animation: ringPulse 2s ease-out 0.5s infinite; }
        @keyframes ringPulse { 0% { transform: scale(0.8); opacity: 0; } 50% { opacity: 0.15; } 100% { transform: scale(1.3); opacity: 0; } }
      `}</style>
    </section>
  );
}
