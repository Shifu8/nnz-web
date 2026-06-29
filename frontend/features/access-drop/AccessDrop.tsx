"use client";

import { useState, useEffect, useRef, useImperativeHandle, forwardRef, type CSSProperties } from "react";
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

// Map event to artist details for vertical ticket colors and assets
const getArtistDetails = (eventId: string) => {
  switch (eventId) {
    case "trap-loud":
      return {
        name: "YAN BLOCK",
        photo: "/images/yan_block_artist_1779161408288.png",
        accentColor: "#C8FF00",
        shadowColor: "rgba(200, 255, 0, 0.25)",
      };
    case "trap-loud-anuel":
      return {
        name: "ANUEL AA",
        photo: "/images/trap_loud_anuel_1778966415162.png",
        accentColor: "#FF2E2E",
        shadowColor: "rgba(255, 46, 46, 0.25)",
      };
    case "rnb-loud":
      return {
        name: "BRENT FAIYAZ",
        photo: "/images/rnb_loud_brent_1778966427864.png",
        accentColor: "#FF00FF",
        shadowColor: "rgba(255, 0, 255, 0.25)",
      };
    case "latin-loud":
      return {
        name: "BAD BUNNY",
        photo: "/images/latin_loud_bad_bunny_1778966469259.png",
        accentColor: "#00E5FF",
        shadowColor: "rgba(0, 229, 255, 0.25)",
      };
    default:
      return {
        name: "YAN BLOCK",
        photo: "/images/yan_block_artist_1779161408288.png",
        accentColor: "#C8FF00",
        shadowColor: "rgba(200, 255, 0, 0.25)",
      };
  }
};

export type AccessDropHandle = { isSuccess: boolean; firstName: string };

const AccessDrop = forwardRef<AccessDropHandle, { onClose?: () => void; onFarewell?: (name: string) => void; event?: Event }>(({ onClose, onFarewell, event }, ref) => {
  const scope = useRef<HTMLElement>(null);
  const ticketRef = useRef<HTMLDivElement>(null);

  const currentEvent = event || events[0];
  const pricePerTicket = currentEvent.id === "trap-loud" ? 10 : currentEvent.id === "dawg-night" ? 15 : 20;
  const artistDetails = getArtistDetails(currentEvent.id);

  const [dropState, setDropState] = useState<DropState>("register");
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "" });
  const [quantity, setQuantity] = useState(1);
  const [selectedBank, setSelectedBank] = useState("banco-loja");
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

  // Load checkout draft state
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
      });
    }
  }, []);

  // Save checkout draft state
  useEffect(() => {
    saveCheckoutDraft({ ...formData, phone: "", quantity: quantity.toString(), selectedDesign: "1" });
  }, [formData, quantity]);

  // Clean up object URL previews
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const successRef = useRef<HTMLDivElement>(null);
  const sparklesRef = useRef<HTMLDivElement>(null);

  // GSAP animations for success state
  useGSAP(
    () => {
      if (dropState === "success") {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        tl.from(".success-reveal", { scale: 0.8, opacity: 0, y: 50, duration: 0.8 });

        tl.fromTo(".success-energy-ring", { scale: 0, opacity: 0.5 }, { scale: 4, opacity: 0, duration: 1 });

        const checkPath = scope.current?.querySelector<SVGPathElement>(".success-check-path");
        if (checkPath) {
          const length = checkPath.getTotalLength();
          gsap.set(checkPath, { strokeDasharray: length, strokeDashoffset: length });
          tl.to(checkPath, { strokeDashoffset: 0, duration: 0.4 }, "-=0.3");
        }

        tl.from(".success-name", { y: 20, opacity: 0, duration: 0.4 }, "-=0.1");
        tl.from(".success-text", { y: 15, opacity: 0, duration: 0.3 }, "-=0.1");
        tl.from(".success-msg", { y: 10, opacity: 0, duration: 0.3 }, "-=0.15");

        if (sparklesRef.current) {
          const sparkles = sparklesRef.current.querySelectorAll<HTMLDivElement>(".success-sparkle");
          sparkles.forEach((s) => {
            const angle = Math.random() * Math.PI * 2;
            const dist = 50 + Math.random() * 80;
            const x = Math.cos(angle) * dist;
            const y = Math.sin(angle) * dist - 20;
            tl.to(s, { x, y, opacity: 0, scale: 0.3, duration: 1.0 + Math.random() * 0.5 }, "-=0.25");
          });
        }

        tl.from(".success-btn", { y: 10, opacity: 0, duration: 0.35 }, "-=0.2");
      }
    },
    { scope, dependencies: [dropState] }
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

  // Interactive 3D tilt and mouse reflection coordinates
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = ticketRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    const angleX = (yc - y) / 18;
    const angleY = (x - xc) / 18;
    
    card.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg) scale3d(1.015, 1.015, 1.015)`;
    card.style.setProperty("--x", `${x}px`);
    card.style.setProperty("--y", `${y}px`);
  };

  const handleMouseLeave = () => {
    const card = ticketRef.current;
    if (!card) return;
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    card.style.setProperty("--x", `-1000px`);
    card.style.setProperty("--y", `-1000px`);
  };

  const totalPrice = quantity * pricePerTicket;

  return (
    <section id="ticket-flow" ref={scope} className="relative z-10 mx-auto flex w-full justify-center px-4 pt-6 pb-12 md:px-6 md:py-10">
      <div className="relative w-full max-w-5xl">
        {dropState === "register" && (
          <div className="relative z-10 w-full mx-auto">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="absolute top-0 right-0 z-50 flex items-center justify-center rounded-full border border-zinc-800 bg-zinc-950/80 px-4 py-2 text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-white hover:border-zinc-700 transition duration-300"
              >
                SALIR
              </button>
            )}

            {/* Premium Editorial Header */}
            <div className="mb-10 text-center lg:text-left select-none max-w-xl">
              <span className="text-[9px] font-black uppercase tracking-[0.45em] text-zinc-500">DAWGS</span>
              <h1 className="text-sm font-black uppercase tracking-[0.3em] text-white mt-1">COMPRA SEGURA</h1>
              <div className="h-px w-8 bg-zinc-800 my-4 mx-auto lg:mx-0" />
              <h2 className="text-3xl font-black uppercase tracking-tighter text-white leading-none">
                {currentEvent.title}
              </h2>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-400 mt-2">
                {currentEvent.subtitle}
              </p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mt-4 text-[9px] font-black tracking-wider text-zinc-500 uppercase">
                <span>{currentEvent.city}</span>
                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                <span>{currentEvent.dateLabel}</span>
              </div>
            </div>

            {/* Main Checkout Layout: Flex order stacks Ticket Preview on top on mobile */}
            <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-10 items-start">
              
              {/* LEFT COLUMN: Toda la información del comprador */}
              <div className="w-full lg:w-7/12 order-2 lg:order-1 space-y-8">
                
                {/* Paso 1: Tus Datos */}
                <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-6 space-y-6">
                  <div className="flex items-center gap-3 border-b border-zinc-900 pb-3">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-[9px] font-mono font-bold text-zinc-400">1</span>
                    <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400">Tus Datos</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="group relative rounded-xl border border-zinc-900 bg-zinc-950 p-4 transition-all duration-300 hover:border-zinc-800 focus-within:border-zinc-700">
                      <label className="block text-[8px] font-black uppercase tracking-widest text-zinc-500">Nombre</label>
                      <input
                        required
                        type="text"
                        maxLength={24}
                        autoComplete="given-name"
                        placeholder="EJ. AXEL"
                        className="w-full bg-transparent text-sm font-bold text-white placeholder-zinc-800 outline-none mt-1"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ\s]/g, "").slice(0, 24) })}
                      />
                    </div>
                    
                    <div className="group relative rounded-xl border border-zinc-900 bg-zinc-950 p-4 transition-all duration-300 hover:border-zinc-800 focus-within:border-zinc-700">
                      <label className="block text-[8px] font-black uppercase tracking-widest text-zinc-500">Apellido</label>
                      <input
                        required
                        type="text"
                        maxLength={24}
                        autoComplete="family-name"
                        placeholder="EJ. PEREZ"
                        className="w-full bg-transparent text-sm font-bold text-white placeholder-zinc-800 outline-none mt-1"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ\s]/g, "").slice(0, 24) })}
                      />
                    </div>
                  </div>

                  <div className="group relative rounded-xl border border-zinc-900 bg-zinc-950 p-4 transition-all duration-300 hover:border-zinc-800 focus-within:border-zinc-700">
                    <label className="block text-[8px] font-black uppercase tracking-widest text-zinc-500">Correo Electrónico</label>
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
                      className="w-full bg-transparent text-sm font-bold text-white placeholder-zinc-800 outline-none mt-1"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: cleanEmailInput(e.target.value) })}
                    />
                    <datalist id="ticket-email-domains">
                      {emailDomains.map((domain) => {
                        const local = formData.email.split("@")[0] || "tu";
                        return <option key={domain} value={`${local}@${domain}`} />;
                      })}
                    </datalist>
                    {/* Suggestions hint */}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {emailHint.text && (
                        <span className={`text-[8px] font-bold uppercase tracking-wider ${
                          emailHint.tone === "ok" ? "text-zinc-400" : "text-zinc-600"
                        }`}>
                          {emailHint.text}
                        </span>
                      )}
                      {emailSuggestion && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, email: applyEmailSuggestion(formData.email) })}
                          className="rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-0.5 text-[7px] font-black uppercase tracking-wider text-white hover:bg-zinc-800 transition duration-300"
                        >
                          Usar {emailSuggestion}
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-[9px] font-medium tracking-wide text-zinc-600 ml-1">
                    Usa el correo donde recibirás tu entrada.
                  </p>
                </div>

                {/* Paso 2: Cantidad */}
                <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-6 space-y-6">
                  <div className="flex items-center gap-3 border-b border-zinc-900 pb-3">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-[9px] font-mono font-bold text-zinc-400">2</span>
                    <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400">Cantidad</h3>
                  </div>

                  <div className="flex items-center justify-between gap-6 p-4 rounded-xl border border-zinc-900 bg-black/40">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-base font-black text-white hover:border-zinc-700 active:scale-95 transition-all select-none"
                    >
                      -
                    </button>
                    <div className="text-center flex-1">
                      <span className="text-2xl font-black text-white transition-all duration-300">{quantity}</span>
                      <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mt-0.5">entradas</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.min(10, quantity + 1))}
                      className="flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-base font-black text-white hover:border-zinc-700 active:scale-95 transition-all select-none"
                    >
                      +
                    </button>
                  </div>
                  
                  <div className="flex items-baseline justify-between border-t border-zinc-900/60 pt-4 px-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">TOTAL ESTIMADO</span>
                    <span className="text-2xl font-black text-white tracking-tight">${totalPrice.toFixed(2)} USD</span>
                  </div>
                </div>

                {/* Paso 3: Método de Pago */}
                <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-6 space-y-6">
                  <div className="flex items-center gap-3 border-b border-zinc-900 pb-3">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-[9px] font-mono font-bold text-zinc-400">3</span>
                    <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400">Método de Pago</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      key="banco-loja"
                      type="button"
                      onClick={() => setSelectedBank("banco-loja")}
                      className={`relative overflow-hidden rounded-xl border p-4 text-left transition-all duration-300 focus:outline-none ${
                        selectedBank === "banco-loja"
                          ? "border-white bg-zinc-900 shadow-[0_0_20px_rgba(255,255,255,0.05)] scale-[1.01]"
                          : "border-zinc-900 bg-zinc-950 hover:border-zinc-800 opacity-60 hover:opacity-90"
                      }`}
                    >
                      <span className="block text-[8px] font-black uppercase tracking-widest text-zinc-500">Banco</span>
                      <span className="block text-sm font-black text-white uppercase mt-0.5">Banco Loja</span>
                      <span className="inline-block mt-2 rounded border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-white">
                        AHORITA
                      </span>
                    </button>

                    <button
                      key="banco-pichincha"
                      type="button"
                      onClick={() => setSelectedBank("banco-pichincha")}
                      className={`relative overflow-hidden rounded-xl border p-4 text-left transition-all duration-300 focus:outline-none ${
                        selectedBank === "banco-pichincha"
                          ? "border-white bg-zinc-900 shadow-[0_0_20px_rgba(255,255,255,0.05)] scale-[1.01]"
                          : "border-zinc-900 bg-zinc-950 hover:border-zinc-800 opacity-60 hover:opacity-90"
                      }`}
                    >
                      <span className="block text-[8px] font-black uppercase tracking-widest text-zinc-500">Banco</span>
                      <span className="block text-sm font-black text-white uppercase mt-0.5">Banco Pichincha</span>
                      <span className="inline-block mt-2 rounded border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-white">
                        DE UNA
                      </span>
                    </button>
                  </div>

                  <div className="rounded-xl border border-zinc-900 bg-black/40 p-5 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                      <div className="space-y-4 flex-1">
                        <div>
                          <span className="block text-[8px] font-black uppercase tracking-widest text-zinc-500">A nombre de</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-black text-white uppercase tracking-wider">MEDINA BRANDON</span>
                            <span className="rounded-full border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wider text-zinc-400">
                              DAWGS MEMBER
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <span className="block text-[8px] font-black uppercase tracking-widest text-zinc-500">Se aceptan</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-zinc-400">
                              Transferencias
                            </span>
                            <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-zinc-400">
                              Depósitos
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className="block text-[8px] font-black uppercase tracking-widest text-zinc-500">Detalles de la Cuenta</span>
                          <div className="mt-1">
                            {selectedBank === "banco-loja" ? (
                              <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Banco Loja</span>
                                <p className="text-xs font-bold text-white tracking-wider mt-0.5">CTA AHORROS: 2904334981</p>
                              </div>
                            ) : (
                              <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Banco Pichincha</span>
                                <p className="text-xs font-bold text-white tracking-wider mt-0.5">CTA AHORROS: 2211985907</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Payment QR container with plenty of spacing and border */}
                      <div className="flex flex-col items-center justify-center p-4 bg-zinc-950 border border-zinc-900 rounded-xl shrink-0 self-center">
                        <div className="bg-white p-3.5 rounded-lg overflow-hidden flex items-center justify-center">
                          <img
                            src={selectedBank === "banco-loja" ? "/images/qr-banco-loja.png" : "/images/qr-banco-pichincha.png"}
                            alt="QR de Pago"
                            className="h-28 w-28 object-contain"
                            style={{ imageRendering: "pixelated" }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                              const parent = (e.target as HTMLImageElement).parentElement;
                              if (parent) {
                                parent.innerHTML = '<div class="text-[8px] text-zinc-800 font-black uppercase tracking-widest py-8 px-4 text-center">QR no disponible</div>';
                              }
                            }}
                          />
                        </div>
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mt-2">Escanea para pagar</span>
                      </div>
                    </div>
                    
                    <div className="border-t border-zinc-900/60 pt-4 flex justify-between items-baseline px-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">TOTAL A PAGAR</span>
                      <span className="text-2xl font-black text-white tracking-tight">${totalPrice.toFixed(2)} USD</span>
                    </div>
                  </div>
                </div>

                {/* Paso 4: Subir Comprobante */}
                <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-6 space-y-6">
                  <div className="flex items-center gap-3 border-b border-zinc-900 pb-3">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-[9px] font-mono font-bold text-zinc-400">4</span>
                    <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400">Subir Comprobante</h3>
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
                    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 transition-all duration-300 animate-in fade-in zoom-in-95">
                      <div className="relative flex min-h-[160px] items-center justify-center bg-black/60 p-4">
                        <img
                          src={preview}
                          alt="Comprobante"
                          className="max-h-44 max-w-full rounded object-contain border border-zinc-800 shadow-2xl"
                        />
                        <div className="absolute left-3 top-3 inline-flex items-center rounded-full border border-zinc-800 bg-black px-2.5 py-0.5 text-[7px] font-black uppercase tracking-wider text-white">
                          CARGADO
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 border-t border-zinc-900 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-white">{selectedFile.name}</p>
                          <p className="mt-0.5 text-[8px] font-black uppercase tracking-wider text-zinc-500">
                            {formatFileSize(selectedFile.size)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex h-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 text-[8px] font-black uppercase tracking-wider text-white hover:bg-zinc-850 transition"
                          >
                            Cambiar
                          </button>
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={clearSelectedFile}
                            className="inline-flex h-8 items-center justify-center rounded-lg border border-zinc-900 bg-red-950/20 px-3.5 text-[8px] font-black uppercase tracking-wider text-red-400 hover:bg-red-950/40 transition"
                          >
                            Eliminar
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
                      className={`group flex min-h-[160px] w-full flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center transition-all duration-300 focus:outline-none ${
                        dragOver
                          ? "border-white bg-zinc-900"
                          : "border-zinc-800 bg-black/40 hover:border-zinc-700 hover:bg-zinc-950"
                      }`}
                    >
                      {/* Minimalist document upload CSS illustration (zero emojis / icons) */}
                      <div className="relative w-10 h-10 border border-zinc-700 rounded-lg flex items-center justify-center bg-zinc-950 mb-3 group-hover:border-zinc-500 transition duration-300">
                        <div className="w-0.5 h-4 bg-zinc-400 absolute transition-transform group-hover:-translate-y-0.5 duration-300" />
                        <div className="w-3 h-3 border-t-2 border-l-2 border-zinc-400 rotate-45 -translate-y-1 transition-transform group-hover:-translate-y-1.5 duration-300" />
                        <div className="w-5 h-1 border-b-2 border-zinc-400 absolute bottom-2" />
                      </div>
                      
                      <p className="text-[10px] font-black uppercase tracking-wider text-white">Arrastra tu comprobante aquí</p>
                      <p className="mt-1 text-[8px] font-bold text-zinc-500 uppercase tracking-widest">o haz clic para seleccionarlo</p>
                      <span className="mt-3 rounded border border-zinc-900 bg-zinc-950 px-2 py-0.5 text-[7px] font-black text-zinc-500 uppercase tracking-widest">
                        JPG · PNG · Máx 5 MB
                      </span>
                    </button>
                  )}

                  {errorMsg && (
                    <div role="alert" className="text-[9px] font-black tracking-wider text-red-400 bg-red-950/20 p-3 rounded-lg border border-red-900 uppercase">
                      {errorMsg}
                    </div>
                  )}

                  {isSubmitting && uploadMessage && (
                    <div className="text-center py-1 text-[8px] font-black uppercase tracking-widest text-zinc-500 animate-pulse">
                      {uploadMessage}
                    </div>
                  )}

                  <TurnstileWidget
                    action="ticket_upload"
                    variant="visible"
                    label="Verificación de seguridad Cloudflare"
                    resetKey={turnstileResetKey}
                    onVerify={setTurnstileToken}
                    onExpire={() => setTurnstileToken("")}
                    onError={() => setTurnstileToken("")}
                  />
                </div>

                {/* Final Button Area */}
                <div className="space-y-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedFile || (hasTurnstileSiteKey("visible") && !turnstileToken)}
                    className="relative overflow-hidden w-full flex h-14 items-center justify-center rounded-xl bg-white text-[10px] font-black uppercase tracking-[0.3em] text-black transition-all duration-300 hover:bg-zinc-200 active:scale-[0.99] disabled:opacity-30 disabled:hover:bg-white disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="h-3.5 w-3.5 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                        PROCESANDO...
                      </span>
                    ) : (
                      "CONFIRMAR COMPRA"
                    )}
                  </button>
                  <p className="text-center text-[9px] font-medium tracking-wide text-zinc-500">
                    Tu entrada será validada por nuestro equipo.
                  </p>
                </div>

              </div>

              {/* RIGHT COLUMN: Panel Fijo (Sticky) - Resumen y Entrada VIP Vertical */}
              <div className="w-full lg:w-5/12 order-1 lg:order-2 lg:sticky lg:top-24 space-y-6">
                
                {/* Live pricing and total summary */}
                <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-6">
                  <div className="flex items-baseline justify-between border-b border-zinc-900 pb-4 mb-6">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">PRICE</p>
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-5xl font-black text-white leading-none">${pricePerTicket}</span>
                        <span className="text-[9px] font-black tracking-wider text-zinc-400">USD</span>
                      </div>
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Per Ticket</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">TOTAL</p>
                      <span className="text-5xl font-black text-white leading-none tracking-tight">${totalPrice.toFixed(2)}</span>
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Updated Live</p>
                    </div>
                  </div>

                  {/* STEP 2: PREVIEW DE LA ENTRADA (VIP VERTICAL TICKET) */}
                  <div className="relative w-full flex justify-center py-2 select-none">
                    {/* The floating wrapper */}
                    <div className="ticket-float w-full max-w-[300px]">
                      {/* The interactive 3D card wrapper */}
                      <div
                        ref={ticketRef}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        className="relative w-full aspect-[1/1.75] rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 transition-all duration-200 cursor-default flex flex-col justify-between"
                        style={{
                          transformStyle: "preserve-3d",
                          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.9)",
                        }}
                      >
                        {/* Interactive light reflection overlay */}
                        <div
                          className="absolute inset-0 z-30 pointer-events-none transition-opacity duration-300"
                          style={{
                            background: "radial-gradient(circle 180px at var(--x, -1000px) var(--y, -1000px), rgba(255, 255, 255, 0.08), transparent 80%)",
                          }}
                        />
                        
                        {/* Glow outline around ticket based on artist details */}
                        <div 
                          className="absolute inset-0 border border-transparent rounded-2xl z-20 pointer-events-none transition-all duration-500"
                          style={{
                            boxShadow: `inset 0 0 10px ${artistDetails.accentColor}25`,
                          }}
                        />

                        {/* Top half: Beautiful Color Artist Photo */}
                        <div className="relative aspect-[4/5] w-full overflow-hidden bg-black shrink-0">
                          <img
                            src={artistDetails.photo}
                            alt={artistDetails.name}
                            className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                          />
                          {/* Dark vignette gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/60 z-10" />
                          
                          {/* Top Tagging */}
                          <div className="absolute top-4 inset-x-4 z-20 flex justify-between items-center text-[8px] font-black uppercase tracking-[0.25em] text-white/90">
                            <span>DAWGS</span>
                            <span className="rounded border border-white/20 bg-black/45 px-2 py-0.5 backdrop-blur-md">
                              VIP ACCESS
                            </span>
                          </div>

                          {/* Event info inside photo */}
                          <div className="absolute bottom-4 inset-x-4 z-20">
                            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-400">
                              {currentEvent.title}
                            </span>
                            <h4 className="text-xl font-black uppercase tracking-tight text-white mt-0.5 leading-none">
                              {artistDetails.name}
                            </h4>
                          </div>
                        </div>

                        {/* Dashed line cutout separating main body from stub */}
                        <div className="relative w-full h-px shrink-0 z-20">
                          {/* Left notch */}
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[#060606] border border-zinc-800 z-20" />
                          {/* Right notch */}
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-5 h-5 rounded-full bg-[#060606] border border-zinc-800 z-20" />
                          {/* Dashed divider */}
                          <div className="absolute left-3.5 right-3.5 top-1/2 h-0.5 border-t border-dashed border-zinc-800 z-10" />
                        </div>

                        {/* Bottom half: Ticket Stub */}
                        <div className="relative p-5 flex-1 flex flex-col justify-between bg-zinc-950 text-left">
                          {/* Info Rows */}
                          <div className="grid grid-cols-2 gap-3 text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                            <div>
                              <span className="block text-[7px] font-black tracking-widest text-zinc-600">CIUDAD</span>
                              <span className="text-white font-bold">{currentEvent.city}</span>
                            </div>
                            <div>
                              <span className="block text-[7px] font-black tracking-widest text-zinc-600">FECHA</span>
                              <span className="text-white font-bold">{currentEvent.dateLabel}</span>
                            </div>
                          </div>

                          {/* Dynamic ticket ID number */}
                          <div className="text-[8px] font-mono font-bold tracking-widest text-zinc-600 uppercase">
                            TICKET NO: #DAWGS-{2026 + quantity}-{102 + quantity}VIP
                          </div>

                          {/* CSS Barcode and sharp SVG QR code */}
                          <div className="flex items-center justify-between gap-4 mt-3">
                            <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                              {/* Horizontal Barcode illustration in CSS */}
                              <div className="flex items-end justify-start h-8 w-full opacity-60">
                                <div className="w-1.5 h-full bg-white shrink-0" />
                                <div className="w-0.5 h-full bg-white shrink-0 ml-0.5" />
                                <div className="w-2.5 h-full bg-white shrink-0 ml-1" />
                                <div className="w-0.5 h-full bg-white shrink-0 ml-0.5" />
                                <div className="w-1 h-full bg-white shrink-0 ml-0.5" />
                                <div className="w-2 h-full bg-white shrink-0 ml-1" />
                                <div className="w-0.5 h-full bg-white shrink-0 ml-0.5" />
                                <div className="w-1.5 h-full bg-white shrink-0 ml-0.5" />
                                <div className="w-0.5 h-full bg-white shrink-0 ml-1" />
                                <div className="w-1 h-full bg-white shrink-0 ml-0.5" />
                                <div className="w-2.5 h-full bg-white shrink-0 ml-1" />
                              </div>
                              <span className="text-[6.5px] font-mono tracking-widest text-zinc-600 uppercase block truncate">
                                *VIP-ONLY-ENTRY*
                              </span>
                            </div>

                            {/* Decorative High-Res sharp QR (SVG) */}
                            <div className="w-12 h-12 bg-white p-1 rounded shrink-0 flex items-center justify-center shadow-md">
                              <svg className="w-full h-full text-black" viewBox="0 0 29 29" fill="currentColor">
                                <path d="M0 0h9v9H0zm1 1h7v7H1zm1 1h5v5H2zm12-2h1v1h-1zm2 0h2v1h-2zm3 0h1v1h-1zm1 0h3v1h-3zm5 0h1v1h-1zm-9 2h1v2h-1zm2 0h1v1h-1zm1 0h2v1h-2zm3 0h2v2h-2zm2 0h1v1h-1zm1 0h1v2h-1zm2 0h1v1h-1zm-10 2h2v1h-2zm3 0h1v1h-1zm2 0h2v1h-2zm3 0h1v1h-1zm-10 2h1v1h-1zm2 0h1v1h-1zm2 0h1v1h-1zm2 0h1v2h-1zm2 0h2v1h-2zm-9 2h1v1h-1zm3 0h1v1h-1zm1 0h1v1h-1zm3 0h1v1h-1zm2 0h3v1h-3zm-10 2h1v1h-1zm3 0h1v1h-1zm2 0h1v1h-1zm1 0h2v1h-2zm3 0h1v1h-1zm2 0h1v1h-1zm-12 2h9v9H0zm1 1h7v7H1zm1 1h5v5H2zm12-2h1v1h-1zm2 0h2v1h-2zm3 0h1v1h-1zm1 0h3v1h-3zm5 0h1v1h-1z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </form>
          </div>
        )}

        {/* Success View */}
        {dropState === "success" && (
          <div ref={successRef} className="success-reveal relative z-10 flex flex-col items-center text-center max-w-md mx-auto py-12">
            <div className="success-ring relative mb-8">
              <div className="success-energy-ring absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="h-20 w-20 rounded-full border-[3px] border-white opacity-0" />
              </div>
              <div className="success-ring-pulse absolute -inset-4 rounded-full border-[2px] border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.1)]" />
              <div className="success-ring-inner relative flex items-center justify-center">
                {/* Checkmark Circle (no icons) */}
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-2xl">
                  <svg className="w-8 h-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" className="success-check-path" />
                  </svg>
                </div>
              </div>
              <div ref={sparklesRef} className="absolute inset-0 pointer-events-none overflow-visible">
                {Array.from({ length: 12 }).map((_, i) => {
                  const colors = ["#ffffff", "#e4e4e7", "#a1a1aa", "#71717a", "#ffffff"];
                  return (
                    <div
                      key={i}
                      className="success-sparkle absolute h-1.5 w-1.5 rounded-full opacity-0"
                      style={{
                        left: "50%",
                        top: "50%",
                        background: colors[i % colors.length],
                        boxShadow: `0 0 4px ${colors[i % colors.length]}`,
                      }}
                    />
                  );
                })}
              </div>
            </div>
            {formData.firstName.trim() && (
              <h2 className="success-name text-3xl font-black text-white uppercase italic tracking-widest">
                GRACIAS, {formData.firstName.trim().toUpperCase()}
              </h2>
            )}
            <h3 className="success-text mt-2 text-sm font-bold text-zinc-400 uppercase tracking-widest">comprobante recibido</h3>
            <p className="success-msg mt-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider leading-relaxed max-w-sm">
              TU COMPROBANTE FUE RECIBIDO CORRECTAMENTE. UN MIEMBRO DE VENTAS DAWG CONFIRMARA EL PAGO Y RECIBIRAS TU ACCESO POR CORREO ELECTRÓNICO.
            </p>
            {onClose && (
              <button onClick={handleSuccessClose} className="success-btn mt-8 flex h-12 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 px-8 text-[9px] font-black uppercase tracking-widest text-white hover:bg-zinc-900 transition duration-300">
                CERRAR
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`
        .ticket-float { animation: ticketFloat 4s ease-in-out infinite; }
        @keyframes ticketFloat { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
        .success-ring-pulse { animation: ringPulse 2.8s ease-out 0.6s infinite; }
        @keyframes ringPulse { 0% { transform: scale(0.8); opacity: 0; } 40% { opacity: 0.15; } 100% { transform: scale(1.5); opacity: 0; } }
      `}</style>
    </section>
  );
});

AccessDrop.displayName = "AccessDrop";

export default AccessDrop;
