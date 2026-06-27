"use client";

import { useState, useEffect, useRef, useImperativeHandle, forwardRef, type CSSProperties } from "react";
import {
  ChevronRight,
  ChevronLeft,
  Zap,
  ShieldAlert,
  Minus,
  Plus,
  Building2,
  CreditCard,
  Mail,
  Upload,
  FileCheck,
  ImagePlus,
  Loader2,
  CheckCircle,
  ScanSearch,
  Trash2,
  MapPin,
  Navigation,
  Share2,
  X,
  Camera,
  Headphones,
  Wine,
  LockKeyhole
} from "lucide-react";
import { gsap, useGSAP } from "@/frontend/animations/gsapSetup";
import { events } from "@/frontend/services/dawgsData";
import type { Event } from "@/frontend/types/domain";
import { isBadWord } from "@/lib/badWords";
import { loadCheckoutDraft, saveCheckoutDraft } from "@/lib/persistence/clientState";
import TurnstileWidget, { hasTurnstileSiteKey } from "@/frontend/components/TurnstileWidget";
import {
  applyEmailSuggestion,
  cleanEmailInput,
  emailDomains,
  getEmailHint,
  getEmailSuggestion,
} from "@/frontend/utils/emailInput";
import { validateReceiptFileMetadata } from "@/lib/access-drop/fileValidation";

const EVENT = events[0];
const PRICE_PER_TICKET = 10;

const VENUE_PHOTOS = [
  "/images/trap_loud_trio_artists.png",
  "/images/trap_loud_trio_artists.png",
  "/images/trap_loud_trio_artists.png",
];

const TICKET_DESIGNS = [
  { id: 1, name: "BLOCK CARD", gradient: "from-pink-950 via-fuchsia-950 to-black", accent: "red", label: "TRAP LOUD · YAN BLOCK", serial: "DAWGS-0001-A" },
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

type DropState = "register" | "success";

function formatFileSize(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export type AccessDropHandle = { isSuccess: boolean; firstName: string };

const AccessDrop = forwardRef<AccessDropHandle, { onClose?: () => void; onFarewell?: (name: string) => void; event?: Event }>(({ onClose, onFarewell, event }, ref) => {
  const scope = useRef<HTMLElement>(null);

  const currentEvent = event || events[0];
  const pricePerTicket = currentEvent.id === "trap-loud" ? 10 : currentEvent.id === "dawg-night" ? 15 : 20;

  const ticketDesigns = [
    { id: 1, name: "BLOCK CARD", gradient: "from-pink-950 via-fuchsia-950 to-black", accent: "red", label: `${currentEvent.title} · ${currentEvent.subtitle}`, serial: "DAWGS-0001-A" },
    { id: 2, name: "BELLAKITA CARD", gradient: "from-[#C8FF00]/20 via-black to-black", accent: "lime", label: `VIP ACCESS · ${currentEvent.title}`, serial: "DAWGS-0002-B" },
  ];

  const [dropState, setDropState] = useState<DropState>("register");
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "" });
  const [quantity, setQuantity] = useState(1);
  const [selectedBank, setSelectedBank] = useState("banco-loja");
  const [selectedDesign, setSelectedDesign] = useState(1);
  const [errorMsg, setErrorMsg] = useState("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventPhotoIndex, setEventPhotoIndex] = useState(0);
  const [uploadMessage, setUploadMessage] = useState("");

  useImperativeHandle(ref, () => ({ isSuccess: dropState === "success", firstName: formData.firstName.trim() || "DAWGS" }));

  const handleSuccessClose = () => {
    const name = formData.firstName.trim() || "DAWGS";
    onFarewell?.(name);
    setTimeout(() => onClose?.(), 2500);
  };

  const emailHint = getEmailHint(formData.email);
  const emailSuggestion = getEmailSuggestion(formData.email);

  const resetTurnstile = () => {
    setTurnstileToken("");
    setTurnstileResetKey((key) => key + 1);
  };

  useEffect(() => {
    const draft = loadCheckoutDraft();
    if (draft) {
      queueMicrotask(() => {
        setFormData((prev) => ({
          ...prev,
          firstName: draft.firstName || "",
          lastName: draft.lastName || "",
          email: draft.email || "",
        }));
        if (draft.quantity) setQuantity(parseInt(draft.quantity, 10) || 1);
        if (draft.selectedDesign) setSelectedDesign(parseInt(draft.selectedDesign, 10) || 1);
      });
    }
  }, []);

  useEffect(() => {
    if (!showEventModal) return;
    const timer = setInterval(() => {
      setEventPhotoIndex((i) => (i + 1) % VENUE_PHOTOS.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [showEventModal]);

  useEffect(() => {
    saveCheckoutDraft({ ...formData, phone: "", quantity: quantity.toString(), selectedDesign: selectedDesign.toString() });
  }, [formData, quantity, selectedDesign]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const successRef = useRef<HTMLDivElement>(null);
  const sparklesRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (dropState === "success") {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        tl.from(".success-reveal", { scale: 0.4, opacity: 0, y: 100, duration: 1, ease: "elastic.out(1, 0.4)" });

        tl.fromTo(".success-energy-ring", { scale: 0, opacity: 0.7 }, { scale: 5, opacity: 0, duration: 1.2 }, "-=0.5");

        tl.from(".success-ring-inner", { scale: 0, duration: 0.6, ease: "back.out(2.5)" }, "-=0.6");

        const checkPath = scope.current?.querySelector<SVGPathElement>(".success-check-path");
        if (checkPath) {
          const length = checkPath.getTotalLength();
          gsap.set(checkPath, { strokeDasharray: length, strokeDashoffset: length });
          tl.to(checkPath, { strokeDashoffset: 0, duration: 0.5, ease: "power2.inOut" }, "-=0.3");
        }

        tl.from(".success-check-fill", { opacity: 0, duration: 0.3 }, "-=0.15");

        tl.from(".success-name", { y: 30, opacity: 0, duration: 0.5 }, "-=0.1");
        tl.from(".success-text", { y: 20, opacity: 0, duration: 0.4 }, "-=0.15");
        tl.from(".success-msg", { y: 15, opacity: 0, duration: 0.35 }, "-=0.15");

        tl.to(".success-ring-pulse", { borderWidth: 6, duration: 0.3, ease: "power2.out" }, "-=0.3");

        if (sparklesRef.current) {
          const sparkles = sparklesRef.current.querySelectorAll<HTMLDivElement>(".success-sparkle");
          sparkles.forEach((s) => {
            const angle = Math.random() * Math.PI * 2;
            const dist = 70 + Math.random() * 120;
            const x = Math.cos(angle) * dist;
            const y = Math.sin(angle) * dist - 40;
            tl.to(s, { x, y, opacity: 0, scale: 0.3, duration: 1.2 + Math.random() * 0.8, ease: "power2.out" }, "-=0.3");
          });
        }

        tl.from(".success-btn", { y: 15, opacity: 0, duration: 0.3 }, "-=0.1");
      }
    },
    { scope, dependencies: [dropState] },
  );

  const clearSelectedFile = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileSelect = (file: File | null) => {
    setErrorMsg("");
    setUploadMessage("");
    if (!file) {
      clearSelectedFile();
      return;
    }

    const validationError = validateReceiptFileMetadata(file);
    if (validationError) {
      clearSelectedFile();
      setErrorMsg(validationError.message);
      return;
    }

    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const previewUrl = URL.createObjectURL(file);
    previewUrlRef.current = previewUrl;
    setSelectedFile(file);
    setPreview(previewUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (isBadWord(formData.firstName) || isBadWord(formData.lastName)) {
      setErrorMsg("LENGUAJE INAPROPIADO DETECTADO.");
      return;
    }
    const email = formData.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg("CORREO INVALIDO. USA UN GMAIL O EMAIL ACTIVO.");
      return;
    }
    if (!selectedFile) {
      setErrorMsg("SELECCIONA UN COMPROBANTE.");
      return;
    }
    if (hasTurnstileSiteKey("visible") && !turnstileToken) {
      setErrorMsg("COMPLETA EL CAPTCHA DE SEGURIDAD.");
      return;
    }

    setIsSubmitting(true);
    setUploadMessage("REVISANDO COMPROBANTE...");
    try {
      const body = new FormData();
      body.append("comprobante", selectedFile);
      body.append("firstName", formData.firstName);
      body.append("lastName", formData.lastName);
      body.append("phone", "");
      body.append("email", email);
      body.append("quantity", quantity.toString());
      body.append("paymentMethod", selectedBank);
      body.append("cf-turnstile-response", turnstileToken);

      const res = await fetch("/api/access-drop/upload", { method: "POST", body });
      const data = await res.json() as {
        error?: string;
        code?: string;
        message?: string;
        receiptId?: string;
      };

      if (!res.ok) {
        if (data.code === "RECEIPT_REJECTED") clearSelectedFile();
        throw new Error(data.error || "Error al subir comprobante");
      }

      setReceiptId(data.receiptId || null);
      setUploadMessage(data.message || "COMPROBANTE VALIDADO.");
      clearSelectedFile();
      setDropState("success");
      resetTurnstile();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al subir comprobante";
      setErrorMsg(message.toUpperCase());
      setUploadMessage("");
      resetTurnstile();
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPrice = quantity * pricePerTicket;


  return (
    <section id="ticket-flow" ref={scope} className="relative z-10 mx-auto flex w-full justify-center px-3 py-8 sm:px-4 md:py-14">
      <div className="relative w-full max-w-6xl">
        {dropState === "register" && (
          <div className="relative z-10 w-full max-w-5xl mx-auto">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="glass-pill glass-pill-red absolute -top-3 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5 text-[8px] font-black uppercase tracking-wider"
              >
                <X className="h-3.5 w-3.5" /> SALIR
              </button>
            )}

            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-white tracking-widest uppercase italic bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-fuchsia-400 to-zinc-200">
                {currentEvent.title}
              </h2>
              <p className="text-[10px] uppercase tracking-[0.4em] text-pink-400 font-bold mt-1">
                {currentEvent.subtitle} • COMPRA SEGURA
              </p>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEFT COLUMN: Datos y Diseño */}
              <div className="lg:col-span-6 space-y-6">
                
                {/* 1. Registro de Datos */}
                <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-4 backdrop-blur-2xl">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-pink-500/20 text-[10px] font-black text-pink-300">1</span>
                    <h3 className="text-xs font-black uppercase tracking-widest text-white">Tus Datos</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <p className="ml-1 text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Nombre</p>
                      <input
                        required
                        type="text"
                        maxLength={24}
                        autoComplete="given-name"
                        placeholder="EJ. AXEL"
                        className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-3.5 text-xs font-bold text-white placeholder-zinc-800 outline-none focus:border-pink-400/50 transition"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ\s]/g, "").slice(0, 24) })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <p className="ml-1 text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Apellido</p>
                      <input
                        required
                        type="text"
                        maxLength={24}
                        autoComplete="family-name"
                        placeholder="EJ. PEREZ"
                        className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-3.5 text-xs font-bold text-white placeholder-zinc-800 outline-none focus:border-pink-400/50 transition"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ\s]/g, "").slice(0, 24) })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <p className="ml-1 text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Correo Electrónico</p>
                    <div className="flex items-center rounded-xl border border-white/10 bg-black/60 px-3.5 transition focus-within:border-pink-400/50">
                      <Mail className="h-4 w-4 shrink-0 text-pink-300/80" />
                      <input
                        required
                        type="email"
                        maxLength={80}
                        inputMode="email"
                        autoComplete="email"
                        autoCapitalize="none"
                        spellCheck={false}
                        list="ticket-email-domains"
                        placeholder="tu@gmail.com"
                        className="w-full bg-transparent px-3 py-3.5 text-xs font-bold text-white placeholder-zinc-800 outline-none"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: cleanEmailInput(e.target.value) })}
                      />
                    </div>
                    <datalist id="ticket-email-domains">
                      {emailDomains.map((domain) => {
                        const local = formData.email.split("@")[0] || "tu";
                        return <option key={domain} value={`${local}@${domain}`} />;
                      })}
                    </datalist>
                    <div className="ml-1 flex flex-wrap items-center gap-2">
                      <p className={`text-[8px] font-bold uppercase tracking-wider ${
                        emailHint.tone === "ok"
                          ? "text-[#C8FF00]"
                          : emailHint.tone === "warn"
                            ? "text-pink-300"
                            : "text-zinc-600"
                      }`}>
                        {emailHint.text}
                      </p>
                      {emailSuggestion && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, email: applyEmailSuggestion(formData.email) })}
                          className="rounded-full border border-pink-300/20 bg-pink-500/10 px-2 py-0.5 text-[7px] font-black uppercase tracking-wider text-pink-100"
                        >
                          usar {emailSuggestion}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Diseño de Entrada */}
                <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-4 backdrop-blur-2xl">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-pink-500/20 text-[10px] font-black text-pink-300">2</span>
                    <h3 className="text-xs font-black uppercase tracking-widest text-white">Diseño de Entrada</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {ticketDesigns.map((t) => {
                      const isSelected = selectedDesign === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSelectedDesign(t.id)}
                          className={`w-full text-left transition-all duration-300 ${isSelected ? "scale-[1.02]" : "opacity-50 hover:opacity-85"}`}
                        >
                          <div className={`relative overflow-hidden rounded-xl border ${isSelected ? t.id === 1 ? "border-pink-500/50 shadow-[0_0_20px_rgba(255,79,163,0.14)]" : "border-[#C8FF00]/50 shadow-[0_0_20px_rgba(200,255,0,0.12)]" : "border-white/10"} bg-gradient-to-br ${t.gradient}`}>
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.06),transparent_60%)]" />
                            <div className="relative p-4 flex flex-col min-h-[160px] justify-between">
                              <div className="flex items-center justify-between">
                                <div className={`flex items-center gap-1 ${t.accent === "red" ? "text-pink-300" : "text-[#C8FF00]"}`}>
                                  <Zap className="h-3 w-3" />
                                  <span className="text-[7px] font-black uppercase tracking-[0.3em]">DAWGS</span>
                                </div>
                                <div className={`h-4.5 w-4.5 rounded-full border ${t.accent === "red" ? "border-pink-400/40" : "border-[#C8FF00]/40"} flex items-center justify-center ${isSelected ? (t.accent === "red" ? "bg-pink-500/20" : "bg-[#C8FF00]/20") : ""}`}>
                                  {isSelected && <div className={`h-2.5 w-2.5 rounded-full ${t.accent === "red" ? "bg-pink-400" : "bg-[#C8FF00]"}`} />}
                                </div>
                              </div>
                              <div className="my-2">
                                <p className="text-xs font-black text-white uppercase tracking-wider leading-relaxed truncate">{t.label}</p>
                                <div className={`mt-2 h-px w-2/3 ${t.accent === "red" ? "bg-pink-400/20" : "bg-[#C8FF00]/20"}`} />
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                <p className={`text-[6px] font-mono font-bold ${t.accent === "red" ? "text-pink-300/60" : "text-[#C8FF00]/50"}`}>{t.serial}</p>
                                <div className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.2">
                                  <p className="text-[5px] font-black uppercase tracking-wider text-zinc-500">VIP</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Cantidad de Entradas */}
                <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-4 backdrop-blur-2xl">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-pink-500/20 text-[10px] font-black text-pink-300">3</span>
                    <h3 className="text-xs font-black uppercase tracking-widest text-white">Cantidad</h3>
                  </div>

                  <div className="flex items-center justify-between gap-6">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="glass-icon-button text-white shrink-0"
                      style={{ "--glass-icon-size": "44px" } as CSSProperties}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <div className="text-center flex-1">
                      <span className="text-3xl font-black text-white">{quantity}</span>
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">entradas</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.min(10, quantity + 1))}
                      className="glass-icon-button text-white shrink-0"
                      style={{ "--glass-icon-size": "44px" } as CSSProperties}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: Pago y Comprobante */}
              <div className="lg:col-span-6 space-y-6">

                {/* 4. Método de Pago */}
                <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-4 backdrop-blur-2xl">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-pink-500/20 text-[10px] font-black text-pink-300">4</span>
                    <h3 className="text-xs font-black uppercase tracking-widest text-white">Método de Pago</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {BANKS.map((bank) => (
                      <button
                        key={bank.id}
                        type="button"
                        onClick={() => setSelectedBank(bank.id)}
                        className={`glass-select-tile p-3 text-center transition-all duration-300 ${selectedBank === bank.id ? "glass-select-tile-active scale-[1.01]" : "hover:border-white/20"}`}
                      >
                        {selectedBank === bank.id && <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,0,24,.06),transparent_60%)]" />}
                        <div className="relative">
                          <Building2 className={`mx-auto h-5 w-5 ${selectedBank === bank.id ? "text-pink-300" : "text-zinc-500"}`} />
                          <p className={`mt-1 text-[9px] font-black uppercase tracking-wider ${selectedBank === bank.id ? "text-white" : "text-zinc-400"}`}>{bank.name}</p>
                          <p className={`mt-0.5 text-xs font-black tracking-wider ${selectedBank === bank.id ? "text-[#C8FF00]" : "text-zinc-600"}`}>{bank.label}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Transfer Details Card & QR Code */}
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 rounded-xl border border-white/[0.06] bg-black/60 p-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-0.5">Beneficiario</p>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-black text-white tracking-wider">MEDINA BRANDON</p>
                          <span className="rounded-full border border-pink-400/20 bg-pink-950/40 px-1.5 py-0.2 text-[6px] font-black uppercase tracking-widest text-pink-200">DAWGS Admin</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-0.5">Detalles de Cuenta</p>
                        <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest leading-relaxed">
                          {selectedBank === "banco-loja" ? "CTA AHORROS: 2901416738" : "DEUNA AL: 0983803157"}
                        </p>
                      </div>
                      <div className="pt-1">
                        <span className="rounded-full border border-[#C8FF00]/25 bg-[#C8FF00]/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-[#C8FF00]">
                          TOTAL A PAGAR: ${totalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/40 p-2 shrink-0">
                      <img
                        src={BANKS.find((b) => b.id === selectedBank)?.qrImage}
                        alt="QR Pago"
                        className="h-20 w-20 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                          const parent = (e.target as HTMLImageElement).parentElement;
                          if (parent) parent.innerHTML = '<div class="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">QR no disponible</div>';
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Comprobante de Pago */}
                <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-4 backdrop-blur-2xl">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-pink-500/20 text-[10px] font-black text-pink-300">5</span>
                    <h3 className="text-xs font-black uppercase tracking-widest text-white">Subir Comprobante</h3>
                  </div>

                  <input
                    ref={fileInputRef}
                    id="receipt-file-input"
                    type="file"
                    accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                    className="sr-only"
                    disabled={isSubmitting}
                    onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                  />

                  {selectedFile && preview ? (
                    <div className="overflow-hidden rounded-xl border border-emerald-400/20 bg-emerald-950/5">
                      <div className="relative flex min-h-40 items-center justify-center bg-black/50 p-2">
                        <img
                          src={preview}
                          alt="Vista previa"
                          className="max-h-48 w-full rounded-lg object-contain"
                        />
                        <div className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full border border-emerald-300/20 bg-black/80 px-2 py-0.5 text-[7px] font-black uppercase tracking-wider text-emerald-300 backdrop-blur">
                          <FileCheck className="h-3 w-3" /> listo
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 border-t border-white/[0.04] p-2.5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-[8px] font-black text-white">{selectedFile.name}</p>
                          <p className="mt-0.5 text-[7px] font-bold uppercase tracking-wider text-zinc-500">
                            {formatFileSize(selectedFile.size)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/[0.02] px-2.5 text-[7px] font-black uppercase tracking-wider text-zinc-200 hover:bg-white/[0.06]"
                          >
                            cambiar
                          </button>
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={clearSelectedFile}
                            className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-red-400/10 bg-red-500/10 px-2.5 text-[7px] font-black uppercase tracking-wider text-red-300 hover:bg-red-500/15"
                          >
                            eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        handleFileSelect(e.dataTransfer.files?.[0] || null);
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      className={`flex min-h-40 w-full flex-col items-center justify-center rounded-xl border border-dashed p-4 text-center transition ${
                        dragOver
                          ? "border-pink-500 bg-pink-500/5"
                          : "border-white/10 bg-black/40 hover:border-pink-300/20 hover:bg-white/[0.01]"
                      }`}
                    >
                      <Upload className="h-5 w-5 text-pink-300 mb-2" />
                      <p className="text-[10px] font-black uppercase tracking-wider text-white">Selecciona tu comprobante</p>
                      <p className="mt-1 text-[8px] font-medium text-zinc-500">Arrastra aquí o toca para buscar</p>
                      <span className="mt-2.5 rounded border border-white/5 bg-white/[0.02] px-2 py-0.5 text-[6px] font-black text-zinc-500 uppercase tracking-widest">
                        JPG · PNG · Máx 5MB
                      </span>
                    </button>
                  )}

                  {errorMsg && (
                    <div role="alert" aria-live="assertive" className="flex items-center gap-2.5 text-xs font-bold text-red-400 bg-red-950/20 p-3 rounded-lg border border-red-500/20">
                      <ShieldAlert className="h-4 w-4 shrink-0 text-red-400" /> {errorMsg}
                    </div>
                  )}

                  {isSubmitting && uploadMessage && (
                    <div aria-live="polite" className="flex items-center justify-center gap-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-zinc-500">
                      <Loader2 className="h-3 w-3 shrink-0 animate-spin text-pink-300" />
                      <span>{uploadMessage}</span>
                    </div>
                  )}

                  <TurnstileWidget
                    action="ticket_upload"
                    variant="visible"
                    label="Captcha de registro"
                    resetKey={turnstileResetKey}
                    onVerify={setTurnstileToken}
                    onExpire={() => setTurnstileToken("")}
                    onError={() => setTurnstileToken("")}
                  />

                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedFile}
                    className="glass-action glass-action-primary w-full"
                    style={{ "--glass-action-height": "48px", "--glass-action-text": "0.85rem" } as CSSProperties}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> PROCESANDO...
                      </>
                    ) : (
                      <>COMPRAR ENTRADA — ${totalPrice.toFixed(2)}</>
                    )}
                  </button>
                </div>

              </div>
            </form>
          </div>
        )}

        {/* Event info modal */}
        {showEventModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-300">
            <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[28px] border border-white/[0.10] bg-gradient-to-b from-zinc-900 to-black shadow-[0_40px_150px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-300">
              {/* Close button */}
              <button
                onClick={() => setShowEventModal(false)}
                className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white/50 backdrop-blur-md transition-all hover:bg-pink-500 hover:text-white hover:shadow-[0_0_20px_rgba(236,72,153,0.5)]"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Photo slideshow */}
              <div className="relative aspect-[4/3] overflow-hidden rounded-t-[28px] bg-zinc-900">
                <img
                  src={VENUE_PHOTOS[eventPhotoIndex]}
                  alt="Lugar del evento"
                  className="h-full w-full object-cover transition-all duration-700 scale-105 hover:scale-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-zinc-900/80 to-transparent h-16" />
                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                  {VENUE_PHOTOS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setEventPhotoIndex(i)}
                      className={`rounded-full transition-all duration-300 ${
                        i === eventPhotoIndex
                          ? "h-2.5 w-8 bg-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.6)]"
                          : "h-2.5 w-2.5 bg-white/30 hover:bg-white/60"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Location header with neon card */}
                <div className="relative overflow-hidden rounded-2xl border border-pink-500/20 bg-gradient-to-br from-pink-500/[0.08] to-fuchsia-500/[0.04] p-4">
                  <div className="absolute top-0 right-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-pink-500/10 blur-3xl" />
                  <div className="relative flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 shadow-[0_0_20px_rgba(236,72,153,0.3)]">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-black uppercase tracking-wider text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.15)]">
                        San Juan, Ecuador
                      </h3>
                      <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.25em] text-pink-200/70">
                        Casa privada · Dirección confirmada al comprar
                      </p>
                    </div>
                  </div>
                </div>

                {/* Features grid — glass cards */}
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { icon: Camera, label: "Photo spot", desc: "Captura el momento", gradient: "from-yellow-500/10 to-orange-500/5", border: "border-yellow-500/15", hoverBorder: "hover:border-yellow-400/30" },
                    { icon: Headphones, label: "Sonido envolvente", desc: "Ecosistema Dolby", gradient: "from-blue-500/10 to-cyan-500/5", border: "border-blue-500/15", hoverBorder: "hover:border-blue-400/30" },
                    { icon: Wine, label: "Barra libre", desc: "Premium selection", gradient: "from-emerald-500/10 to-green-500/5", border: "border-emerald-500/15", hoverBorder: "hover:border-emerald-400/30" },
                    { icon: LockKeyhole, label: "Acceso controlado", desc: "Entrada garantizada", gradient: "from-violet-500/10 to-purple-500/5", border: "border-violet-500/15", hoverBorder: "hover:border-violet-400/30" },
                  ].map((feat) => {
                    const IconComponent = feat.icon;
                    return (
                      <div
                        key={feat.label}
                        className={`group relative overflow-hidden rounded-2xl border ${feat.border} bg-gradient-to-br ${feat.gradient} px-4 py-3.5 text-center transition-all duration-300 ${feat.hoverBorder} hover:shadow-[0_0_25px_rgba(255,255,255,0.04)]`}
                      >
                        <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_30%,rgba(255,255,255,0.03)_50%,transparent_70%)] translate-x-[-200%] transition-transform duration-700 group-hover:translate-x-[200%]" />
                        <div className="flex justify-center mb-1.5">
                          <IconComponent className="h-5 w-5 text-zinc-300 transition-transform duration-300 group-hover:scale-110" />
                        </div>
                        <p className="relative text-[8px] font-black uppercase tracking-[0.2em] text-white/80">{feat.label}</p>
                        <p className="relative mt-0.5 text-[7px] font-medium text-white/40">{feat.desc}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-2.5">
                  <a
                    href="https://maps.google.com/?q=San+Juan+Ecuador"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative inline-flex h-13 items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-pink-600 to-rose-500 text-[9px] font-black uppercase tracking-[0.2em] text-white transition-all duration-300 hover:from-pink-500 hover:to-rose-400 hover:shadow-[0_0_40px_rgba(236,72,153,0.4)] hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span className="absolute inset-0 bg-[linear-gradient(120deg,transparent_30%,rgba(255,255,255,0.15)_50%,transparent_70%)] translate-x-[-200%] transition-transform duration-700 group-hover:translate-x-[200%]" />
                    <Navigation className="h-4 w-4 relative z-10" />
                    <span className="relative z-10">Abrir en Google Maps</span>
                  </a>
                  <button
                    onClick={() => {
                      navigator.share?.({ title: `DAWGS - ${currentEvent.title}`, text: `${currentEvent.title} · ${currentEvent.dateLabel} · ${currentEvent.city}`, url: window.location.href });
                    }}
                    className="group relative inline-flex h-12 items-center justify-center gap-3 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] text-[8px] font-black uppercase tracking-[0.2em] text-zinc-300 transition-all duration-300 hover:border-pink-400/30 hover:bg-pink-500/[0.08] hover:text-pink-300 hover:shadow-[0_0_30px_rgba(236,72,153,0.12)] hover:scale-[1.01] active:scale-[0.98]"
                  >
                    <span className="absolute inset-0 bg-[linear-gradient(120deg,transparent_30%,rgba(236,72,153,0.06)_50%,transparent_70%)] translate-x-[-200%] transition-transform duration-700 group-hover:translate-x-[200%]" />
                    <div className="relative z-10 flex items-center gap-2.5">
                      <span className="flex -space-x-1.5">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-[#25D366] drop-shadow-[0_0_6px_rgba(37,211,102,0.3)]">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-[#E4405F] drop-shadow-[0_0_6px_rgba(228,64,95,0.3)]">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </span>
                      <span className="h-3.5 w-px bg-white/10" />
                      <Share2 className="h-3.5 w-3.5" />
                    </div>
                    <span className="relative z-10">Compartir</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {dropState === "success" && (
          <div ref={successRef} className="success-reveal relative z-10 flex flex-col items-center text-center max-w-md mx-auto py-12 mt-8">
            <div className="success-ring relative mb-8">
              <div className="success-energy-ring absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="h-20 w-20 rounded-full border-[3px] border-[#FFD700] opacity-0" />
              </div>
              <div className="success-ring-pulse absolute -inset-4 rounded-full border-[3px] border-[#FFD700] shadow-[0_0_60px_rgba(255,215,0,0.25)]" />
              <div className="success-ring-inner relative flex items-center justify-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#FFD700] to-[#FFA500] shadow-[0_0_50px_rgba(255,215,0,0.35)]">
                  <svg viewBox="0 0 48 48" className="h-11 w-11" fill="none">
                    <path
                      d="M14 24l6 6 14-14"
                      stroke="#1a1a1a"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="success-check-path"
                    />
                    <path
                      d="M14 24l6 6 14-14"
                      fill="#1a1a1a"
                      className="success-check-fill"
                      opacity="0"
                    />
                  </svg>
                </div>
              </div>
              <div ref={sparklesRef} className="absolute inset-0 pointer-events-none overflow-visible">
                {Array.from({ length: 16 }).map((_, i) => {
                  const colors = ["#FFD700", "#FFA500", "#FF6B6B", "#00E5FF", "#FF4081", "#FFFFFF"];
                  return (
                    <div
                      key={i}
                      className="success-sparkle absolute h-1.5 w-1.5 rounded-full opacity-0"
                      style={{
                        left: "50%",
                        top: "50%",
                        background: colors[i % colors.length],
                        boxShadow: `0 0 6px ${colors[i % colors.length]}`,
                      }}
                    />
                  );
                })}
              </div>
            </div>
            {formData.firstName.trim() && (
              <h2 className="success-name text-3xl font-black text-white uppercase italic tracking-widest drop-shadow-[0_0_20px_rgba(255,215,0,0.25)]">
                ¡GRACIAS, {formData.firstName.trim().toUpperCase()}!
              </h2>
            )}
            <h3 className="success-text mt-2 text-lg font-bold text-[#FFD700] uppercase tracking-widest">comprobante recibido</h3>
            <p className="success-msg mt-3 text-[10.5px] font-bold text-zinc-400 uppercase tracking-wider leading-relaxed max-w-sm">
              TU COMPROBANTE FUE RECIBIDO CORRECTAMENTE. UN MIEMBRO DE VENTAS DAWG CONFIRMARA EL PAGO Y RECIBIRAS TU ACCESO POR GMAIL.
            </p>
            {onClose && (
              <button onClick={handleSuccessClose} className="success-btn glass-action glass-action-primary mt-8" style={{ "--glass-action-height": "48px", "--glass-action-px": "2rem", "--glass-action-text": "0.72rem" } as CSSProperties}>
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
        .success-ring-pulse { animation: ringPulse 2.8s ease-out 0.6s infinite; }
        @keyframes ringPulse { 0% { transform: scale(0.8); opacity: 0; } 40% { opacity: 0.15; } 100% { transform: scale(1.6); opacity: 0; } }
      `}</style>
    </section>
  );
});

export default AccessDrop;
