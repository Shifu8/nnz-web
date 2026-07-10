"use client";

import { useState, useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from "react";
import { gsap, useGSAP } from "@/frontend/animations/gsapSetup";
import { events } from "@/frontend/services/nenezData";
import type { Event } from "@/frontend/types/domain";
import { isBadWord } from "@/lib/badWords";
// No longer using clientState persistence for checkout draft to ensure it only lives in memory while the page is open
import TurnstileWidget, { hasTurnstileSiteKey } from "@/frontend/components/TurnstileWidget";
import {
  applyEmailSuggestion,
  cleanEmailInput,
  emailDomains,
  getEmailHint,
  getEmailSuggestion,
} from "@/frontend/utils/emailInput";
import { validateReceiptFileMetadata } from "@/lib/access-drop/fileValidation";
import { ChevronLeft, ChevronRight, ClipboardCopy, ClipboardCheck } from "lucide-react";
import { getEventDesigns, type TicketDesign } from "@/lib/tickets/designs";


const BANKS = [
  {
    id: "banco-loja",
    name: "Banco Loja",
    label: "AHORITA",
    account: "CTA AHORROS: 2904334981",
    qrImage: "/images/qr-banco-loja.png",
    color: "#4ade80",
  },
  {
    id: "banco-pichincha",
    name: "Banco Pichincha",
    label: "DE UNA",
    account: "CTA AHORROS: 2211985907",
    qrImage: "/images/qr-banco-pichincha.png",
    color: "#a78bfa",
  },
];

type DropState = "register" | "verifying" | "success";

function formatFileSize(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

const getArtistDetails = (eventId: string) => {
  switch (eventId) {
    case "trap-loud":
      return { name: "YAN BLOCK", photo: "/images/yan_block_artist_1779161408288.png", accentColor: "#C8FF00", shadowColor: "rgba(200, 255, 0, 0.25)" };
    case "trap-loud-anuel":
      return { name: "ANUEL AA", photo: "/images/trap_loud_anuel_1778966415162.png", accentColor: "#FF2E2E", shadowColor: "rgba(255, 46, 46, 0.25)" };
    case "rnb-loud":
      return { name: "BRENT FAIYAZ", photo: "/images/rnb_loud_brent_1778966427864.png", accentColor: "#FF00FF", shadowColor: "rgba(255, 0, 255, 0.25)" };
    case "latin-loud":
      return { name: "BAD BUNNY", photo: "/images/latin_loud_bad_bunny_1778966469259.png", accentColor: "#00E5FF", shadowColor: "rgba(0, 229, 255, 0.25)" };
    default:
      return { name: "YAN BLOCK", photo: "/images/yan_block_artist_1779161408288.png", accentColor: "#C8FF00", shadowColor: "rgba(200, 255, 0, 0.25)" };
  }
};

export type AccessDropHandle = { isSuccess: boolean; firstName: string; reset: () => void };

const AccessDrop = forwardRef<AccessDropHandle, { onClose?: () => void; onFarewell?: (name: string) => void; event?: Event }>(({ onClose, onFarewell, event }, ref) => {
  const scope = useRef<HTMLElement>(null);
  const ticketRef = useRef<HTMLDivElement>(null);
  const modalTicketRef = useRef<HTMLDivElement>(null);

  const currentEvent = event || events[0];
  const pricePerTicket = currentEvent.id === "trap-loud" ? 10 : currentEvent.id === "dawg-night" ? 15 : 20;
  const artistDetails = getArtistDetails(currentEvent.id);

  const [dropState, setDropState] = useState<DropState>("register");
  const [verifyingMessage, setVerifyingMessage] = useState("ENVIANDO COMPROBANTE...");
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

  const [selectedDesignIndex, setSelectedDesignIndex] = useState<number | null>(null);
  const [currentViewedDesignIndex, setCurrentViewedDesignIndex] = useState<number>(0);
  const [designs, setDesigns] = useState<TicketDesign[]>([]);

  useEffect(() => {
    let active = true;
    // Set default static designs first
    setDesigns(getEventDesigns(currentEvent.id));
    
    // Fetch custom designs from the API (using cache-breaking parameter)
    fetch(`/api/access-drop/ticket-designs?eventId=${currentEvent.id}&t=${Date.now()}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (active && data.success && data.designs && data.designs.length > 0) {
          setDesigns(data.designs);
        }
      })
      .catch((err) => {
        console.warn("[ACCESS_DROP] Failed to fetch custom designs, using defaults:", err);
      });
    return () => {
      active = false;
    };
  }, [currentEvent.id]);

  const resetForm = () => {
    setFormData({ firstName: "", lastName: "", email: "" });
    setQuantity(1);
    setSelectedBank("banco-loja");
    setErrorMsg("");
    setSelectedFile(null);
    setPreview(null);
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setDropState("register");
    setUploadMessage("");
    setIsSubmitting(false);
    setDragOver(false);
    resetTurnstile();
    setSelectedDesignIndex(null);
    setCurrentViewedDesignIndex(0);
  };

  useImperativeHandle(ref, () => ({
    isSuccess: dropState === "success",
    firstName: formData.firstName.trim() || "NENEZ",
    reset: resetForm
  }));

  const handleSuccessClose = () => {
    const name = formData.firstName.trim() || "NENEZ";
    onFarewell?.(name);
    onClose?.();
    setTimeout(() => {
      resetForm();
    }, 500);
  };

  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [uploadMessage, setUploadMessage] = useState("");
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const emailHint = getEmailHint(formData.email);
  const emailSuggestion = getEmailSuggestion(formData.email);

  const resetTurnstile = () => {
    setTurnstileToken("");
    setTurnstileResetKey((key) => key + 1);
  };

  // Cleanup object URL previews
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  // Modal open/close with animation
  const openModal = useCallback(() => {
    setShowTicketModal(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setModalVisible(true)));
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setTimeout(() => setShowTicketModal(false), 350);
  }, []);

  // ESC key closes modal
  useEffect(() => {
    if (!showTicketModal) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeModal(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showTicketModal, closeModal]);

  const successRef = useRef<HTMLDivElement>(null);
  const sparklesRef = useRef<HTMLDivElement>(null);

  // GSAP animations for success state
  useGSAP(
    () => {
      if (dropState === "success") {
        const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
        
        // 1. Reveal parent container
        tl.fromTo(".success-reveal", 
          { opacity: 0 }, 
          { opacity: 1, duration: 0.3 }
        );
        
        // 2. Ticket card drop & bounce with 3D tilts
        tl.fromTo(".success-ticket-card", 
          { scale: 1.6, rotationX: -30, rotationY: 20, y: -100, opacity: 0, filter: "blur(8px)" },
          { scale: 1, rotationX: 0, rotationY: 0, y: 0, opacity: 1, filter: "blur(0px)", duration: 0.8, ease: "back.out(1.5)" }
        );
        
        // 3. Stamp slams down
        tl.fromTo(".success-stamp",
          { scale: 4.5, opacity: 0, rotation: 30 },
          { scale: 1, opacity: 1, rotation: -12, duration: 0.35, ease: "bounce.out" },
          "-=0.2"
        );
        
        // 3.5. Camera Shake on stamp hit
        tl.to(".success-ticket-card", {
          x: "random(-4, 4)",
          y: "random(-4, 4)",
          duration: 0.05,
          repeat: 5,
          yoyo: true,
          clearProps: "x,y"
        }, "-=0.2");

        // 4. Energy ring expand on hit
        tl.fromTo(".success-energy-ring", 
          { scale: 0, opacity: 0.8 }, 
          { scale: 5, opacity: 0, duration: 0.8, ease: "power2.out" },
          "-=0.25"
        );
        
        // 5. Draw checkmark
        const checkPath = scope.current?.querySelector<SVGPathElement>(".success-check-path");
        if (checkPath) {
          const length = checkPath.getTotalLength();
          gsap.set(checkPath, { strokeDasharray: length, strokeDashoffset: length });
          tl.to(checkPath, { strokeDashoffset: 0, duration: 0.3, ease: "power1.inOut" }, "-=0.2");
        }
        
        // 6. Burst sparkles
        if (sparklesRef.current) {
          const sparkles = sparklesRef.current.querySelectorAll<HTMLDivElement>(".success-sparkle");
          sparkles.forEach((s) => {
            const angle = Math.random() * Math.PI * 2;
            const dist = 60 + Math.random() * 110;
            const x = Math.cos(angle) * dist;
            const y = Math.sin(angle) * dist;
            gsap.fromTo(s, 
              { x: 0, y: 0, scale: 0.2, opacity: 1 },
              { 
                x, 
                y, 
                opacity: 0, 
                scale: "random(0.3, 1.2)", 
                rotation: "random(-360, 360)",
                duration: 1.2 + Math.random() * 0.6, 
                ease: "power2.out" 
              }
            );
          });
        }
        
        // 7. Text details entries
        tl.fromTo(".success-name", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, "-=0.15");
        tl.fromTo(".success-text", { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 }, "-=0.1");
        tl.fromTo(".success-msg", { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 }, "-=0.15");
        tl.fromTo(".success-btn-container", { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35 }, "-=0.2");
      }
    },
    { scope, dependencies: [dropState] }
  );

  const clearSelectedFile = () => {
    if (previewUrlRef.current) { URL.revokeObjectURL(previewUrlRef.current); previewUrlRef.current = null; }
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileSelect = (file: File | null) => {
    setErrorMsg("");
    setUploadMessage("");
    if (!file) { clearSelectedFile(); return; }
    const validationError = validateReceiptFileMetadata(file);
    if (validationError) { clearSelectedFile(); setErrorMsg(validationError.message); return; }
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const previewUrl = URL.createObjectURL(file);
    previewUrlRef.current = previewUrl;
    setSelectedFile(file);
    setPreview(previewUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (isBadWord(formData.firstName) || isBadWord(formData.lastName)) { setErrorMsg("LENGUAJE INAPROPIADO DETECTADO."); return; }
    const email = formData.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErrorMsg("CORREO INVALIDO. USA UN GMAIL O EMAIL ACTIVO."); return; }
    if (!selectedFile) { setErrorMsg("SELECCIONA UN COMPROBANTE."); return; }
    if (selectedDesignIndex === null) { setErrorMsg("ELIGE TU DISEÑO DE ENTRADA EN LA VISTA PREVIA PARA PODER CONTINUAR."); return; }
    if (hasTurnstileSiteKey("visible") && !turnstileToken) { setErrorMsg("COMPLETA EL CAPTCHA DE SEGURIDAD."); return; }
    setIsSubmitting(true);
    setErrorMsg("");
    
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
      body.append("ticketDesign", selectedDesignIndex !== null ? selectedDesignIndex.toString() : "0");
      
      const res = await fetch("/api/access-drop/upload", { method: "POST", body });
      const data = await res.json() as { error?: string; code?: string; message?: string; receiptId?: string };
      
      if (!res.ok) {
        if (data.code === "RECEIPT_REJECTED") clearSelectedFile();
        throw new Error(data.error || "Error al subir comprobante");
      }
      
      // Transición al estado de carga / verificando tras éxito en subida
      setDropState("verifying");
      setVerifyingMessage("COMPROBANTE RECIBIDO");
      
      const t1 = setTimeout(() => setVerifyingMessage("ANALIZANDO INTEGRIDAD DE LA IMAGEN..."), 700);
      const t2 = setTimeout(() => setVerifyingMessage("VERIFICANDO TRANSACCIÓN BANCARIA..."), 1500);
      const t3 = setTimeout(() => setVerifyingMessage("GENERANDO ENTRADA EN EL SISTEMA..."), 2300);
      
      await new Promise(resolve => {
        setTimeout(() => {
          clearTimeout(t1);
          clearTimeout(t2);
          clearTimeout(t3);
          resolve(true);
        }, 3000);
      });
      
      setUploadMessage(data.message || "COMPROBANTE VALIDADO.");
      clearSelectedFile();
      setDropState("success");
      resetTurnstile();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al subir comprobante";
      setErrorMsg(message.toUpperCase());
      setUploadMessage("");
      setDropState("register");
      resetTurnstile();
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3D tilt for modal ticket
  const handleModalMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = modalTicketRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    const angleX = (yc - y) / 22;
    const angleY = (x - xc) / 22;
    card.style.transform = `perspective(1200px) rotateX(${angleX}deg) rotateY(${angleY}deg) scale3d(1.02, 1.02, 1.02)`;
    card.style.setProperty("--mx", `${x}px`);
    card.style.setProperty("--my", `${y}px`);
  };

  const handleModalMouseLeave = () => {
    const card = modalTicketRef.current;
    if (!card) return;
    card.style.transform = `perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    card.style.setProperty("--mx", `-1000px`);
    card.style.setProperty("--my", `-1000px`);
  };

  const totalPrice = quantity * pricePerTicket;
  const selectedBankData = BANKS.find((b) => b.id === selectedBank)!;
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [showCopyToast, setShowCopyToast] = useState(false);

  const handleCopyAccount = async () => {
    const digitsOnly = selectedBankData.account.replace(/\D+/g, "");
    try {
      await navigator.clipboard.writeText(digitsOnly);
      setCopiedAccount(selectedBankData.id);
      setShowCopyToast(true);
      window.setTimeout(() => {
        setCopiedAccount(null);
        setShowCopyToast(false);
      }, 1800);
    } catch {
      setCopiedAccount(null);
      setShowCopyToast(false);
    }
  };

  return (
    <>
      <section id="ticket-flow" ref={scope} className="relative z-10 mx-auto flex w-full justify-center px-4 pt-4 pb-10 md:px-6 md:pt-6 md:pb-12">
        <div className="relative w-full max-w-5xl">

          {dropState === "register" && (
            <div className="relative z-10 w-full mx-auto">
              {/* Compact Header */}
              <div className="mb-5 select-none">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-600">NENEZ</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-800" />
                  <span className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-600">COMPRA SEGURA</span>
                </div>
                <h1 className="text-xl font-black uppercase tracking-tighter text-white leading-none">{currentEvent.title}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[8px] font-black tracking-wider text-zinc-500 uppercase">
                  <span>{currentEvent.city}</span>
                  <span className="w-0.5 h-0.5 rounded-full bg-zinc-700" />
                  <span>{currentEvent.dateLabel}</span>
                  {currentEvent.subtitle && (
                    <>
                      <span className="w-0.5 h-0.5 rounded-full bg-zinc-700" />
                      <span className="text-zinc-600">{currentEvent.subtitle}</span>
                    </>
                  )}
                </div>
              </div>

              {/* ── MAIN CHECKOUT GRID ── */}
              <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-5 items-start">

                {/* ════════════════════════════════════════
                    LEFT COLUMN — Formulario principal
                ════════════════════════════════════════ */}
                <div className="w-full lg:w-[60%] space-y-4 order-2 lg:order-1">

                  {/* ── PASO 1: Datos del Comprador ── */}
                  <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-4 space-y-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-[8px] font-mono font-bold text-zinc-500">1</span>
                      <span className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-500">Tus Datos</span>
                    </div>

                    {/* Nombre + Apellido en la misma fila */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="group relative rounded-xl border border-zinc-900 bg-black/40 px-3 py-2.5 transition-all duration-200 hover:border-zinc-800 focus-within:border-zinc-700">
                        <label className="block text-[7px] font-black uppercase tracking-widest text-zinc-600">Nombre</label>
                        <input
                          required
                          type="text"
                          maxLength={24}
                          autoComplete="given-name"
                          placeholder="EJ. AXEL"
                          className="w-full bg-transparent text-sm font-bold text-white placeholder-zinc-800 outline-none mt-0.5"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ\s]/g, "").slice(0, 24) })}
                        />
                      </div>
                      <div className="group relative rounded-xl border border-zinc-900 bg-black/40 px-3 py-2.5 transition-all duration-200 hover:border-zinc-800 focus-within:border-zinc-700">
                        <label className="block text-[7px] font-black uppercase tracking-widest text-zinc-600">Apellido</label>
                        <input
                          required
                          type="text"
                          maxLength={24}
                          autoComplete="family-name"
                          placeholder="EJ. PEREZ"
                          className="w-full bg-transparent text-sm font-bold text-white placeholder-zinc-800 outline-none mt-0.5"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ\s]/g, "").slice(0, 24) })}
                        />
                      </div>
                    </div>

                    {/* Correo */}
                    <div className="group relative rounded-xl border border-zinc-900 bg-black/40 px-3 py-2.5 transition-all duration-200 hover:border-zinc-800 focus-within:border-zinc-700">
                      <label className="block text-[7px] font-black uppercase tracking-widest text-zinc-600">Correo Electrónico</label>
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
                        className="w-full bg-transparent text-sm font-bold text-white placeholder-zinc-800 outline-none mt-0.5"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: cleanEmailInput(e.target.value) })}
                      />
                      <datalist key={formData.email.split("@")[0] || "tu"} id="ticket-email-domains">
                        {emailDomains.map((domain) => {
                          const local = formData.email.split("@")[0] || "tu";
                          return <option key={domain} value={`${local}@${domain}`} />;
                        })}
                      </datalist>
                      {/* Hint única vez */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        {emailHint.text && (
                          <span className={`text-[7px] font-bold uppercase tracking-wider ${emailHint.tone === "ok" ? "text-zinc-500" : "text-zinc-600"}`}>
                            {emailHint.text}
                          </span>
                        )}
                        {emailSuggestion && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, email: applyEmailSuggestion(formData.email) })}
                            className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[7px] font-black uppercase tracking-wider text-white hover:bg-zinc-800 transition duration-200"
                          >
                            Usar {emailSuggestion}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── PASO 2: Método de Pago ── */}
                  <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-4 space-y-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-[8px] font-mono font-bold text-zinc-500">2</span>
                      <span className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-500">Método de Pago</span>
                    </div>

                    {/* Bank selection — premium cards */}
                    <div className="grid grid-cols-2 gap-3">
                      {BANKS.map((bank) => {
                        const isActive = selectedBank === bank.id;
                        return (
                          <button
                            key={bank.id}
                            type="button"
                            onClick={() => setSelectedBank(bank.id)}
                            className={`relative overflow-hidden rounded-xl border p-3.5 text-left transition-all duration-300 focus:outline-none ${isActive
                              ? "border-white/30 bg-zinc-900 scale-[1.02] shadow-[0_0_24px_rgba(255,255,255,0.07)]"
                              : "border-zinc-900 bg-zinc-950/60 hover:border-zinc-800 hover:bg-zinc-900/60"
                              }`}
                            style={isActive ? { boxShadow: `0 0 0 1px ${bank.color}30, 0 8px 32px ${bank.color}15` } : {}}
                          >
                            {/* Active indicator */}
                            {isActive && (
                              <div
                                className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full animate-pulse"
                                style={{ background: bank.color, boxShadow: `0 0 8px ${bank.color}` }}
                              />
                            )}
                            {/* Bank gradient strip */}
                            <div
                              className="absolute inset-x-0 top-0 h-0.5 rounded-t-xl transition-opacity duration-300"
                              style={{ background: `linear-gradient(90deg, transparent, ${bank.color}60, transparent)`, opacity: isActive ? 1 : 0 }}
                            />
                            <span className="block text-[7px] font-black uppercase tracking-widest text-zinc-600 mb-0.5">Banco</span>
                            <span className={`block text-sm font-black uppercase transition-colors duration-200 ${isActive ? "text-white" : "text-zinc-400"}`}>
                              {bank.name}
                            </span>
                            <span
                              className="inline-block mt-1.5 rounded px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wider"
                              style={isActive
                                ? { background: `${bank.color}15`, border: `1px solid ${bank.color}40`, color: bank.color }
                                : { background: "transparent", border: "1px solid #27272a", color: "#52525b" }}
                            >
                              {bank.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Bank details + QR — compact row */}
                    <div className="rounded-xl border border-zinc-900 bg-black/40 p-3.5">
                      <div className="flex items-start gap-4">
                        {/* Info */}
                        <div className="flex-1 space-y-2.5">
                          <div>
                            <span className="block text-[7px] font-black uppercase tracking-widest text-zinc-600">A nombre de</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-xs font-black text-white uppercase tracking-wide">MEDINA BRANDON</span>
                              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-[6px] font-black uppercase tracking-wider text-zinc-500">NENEZ MEMBER</span>
                            </div>
                          </div>
                          <div>
                            <span className="block text-[7px] font-black uppercase tracking-widest text-zinc-600">Cuenta</span>
                            <div className="relative mt-0.5">
                              <div
                                className="flex items-center gap-1 rounded-xl border border-white/10 bg-zinc-950/90 px-2.5 py-2"
                                onClick={handleCopyAccount}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    handleCopyAccount();
                                  }
                                }}
                              >
                                <p className="flex-1 min-w-0 text-xs font-black text-white tracking-wider">{selectedBankData.account}</p>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyAccount();
                                  }}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/15"
                                  aria-label="Copiar cuenta"
                                >
                                  {copiedAccount === selectedBankData.id ? (
                                    <ClipboardCheck className="h-4 w-4" />
                                  ) : (
                                    <ClipboardCopy className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                              <div
                                className={`absolute right-0 top-0 -translate-y-full rounded-full bg-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-white shadow-lg backdrop-blur-xl transition-all duration-300 ease-out ${showCopyToast ? "opacity-100 translate-y-0" : "opacity-0"}`}
                                aria-live="polite"
                              >
                                Texto copiado
                              </div>
                            </div>
                          </div>
                          <div>
                            <span className="block text-[7px] font-black uppercase tracking-widest text-zinc-600">Se aceptan</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {["Transferencias", "Depósitos"].map((t) => (
                                <span key={t} className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[7px] font-black uppercase tracking-wide text-zinc-500">{t}</span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* QR compact */}
                        <div className="shrink-0 flex flex-col items-center gap-1.5">
                          <div className="bg-white p-2 rounded-lg overflow-hidden border border-zinc-200 flex items-center justify-center">
                            <img
                              src={selectedBankData.qrImage}
                              alt="QR de Pago"
                              className="h-20 w-20 object-contain"
                              style={{ imageRendering: "pixelated", clipPath: "inset(4px)" }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                                const parent = (e.target as HTMLImageElement).parentElement;
                                if (parent) parent.innerHTML = '<div class="text-[7px] text-zinc-800 font-black uppercase tracking-widest py-6 px-3 text-center">QR no disponible</div>';
                              }}
                            />
                          </div>
                          <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">Escanear</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── PASO 3: Subir Comprobante ── */}
                  <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-4 space-y-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-[8px] font-mono font-bold text-zinc-500">3</span>
                      <span className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-500">Subir Comprobante</span>
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
                      /* File selected — elegant card */
                      <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 p-3">
                          {/* Thumbnail */}
                          <div className="shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-zinc-800 bg-black/60 flex items-center justify-center">
                            <img src={preview} alt="Comprobante" className="w-full h-full object-cover" />
                          </div>
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-xs font-bold text-white">{selectedFile.name}</p>
                            <p className="text-[7px] font-black uppercase tracking-widest text-zinc-500 mt-0.5">{formatFileSize(selectedFile.size)}</p>
                            <span className="inline-block mt-1 rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[7px] font-black uppercase tracking-wider text-zinc-400">CARGADO</span>
                          </div>
                          {/* Actions */}
                          <div className="shrink-0 flex gap-1.5">
                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={() => fileInputRef.current?.click()}
                              className="h-7 px-2.5 rounded-lg border border-zinc-800 bg-zinc-900 text-[7px] font-black uppercase tracking-wider text-white hover:bg-zinc-800 transition"
                            >
                              Cambiar
                            </button>
                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={clearSelectedFile}
                              className="h-7 px-2.5 rounded-lg border border-zinc-900 bg-red-950/20 text-[7px] font-black uppercase tracking-wider text-red-400 hover:bg-red-950/40 transition"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Drag & Drop — compact */
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files?.[0] || null); }}
                        onClick={() => fileInputRef.current?.click()}
                        className={`group flex min-h-[96px] w-full flex-col items-center justify-center rounded-xl border border-dashed p-4 text-center transition-all duration-300 focus:outline-none ${dragOver ? "border-white bg-zinc-900" : "border-zinc-800 bg-black/40 hover:border-zinc-700 hover:bg-zinc-950"
                          }`}
                      >
                        <div className="relative w-8 h-8 border border-zinc-700 rounded-lg flex items-center justify-center bg-zinc-950 mb-2 group-hover:border-zinc-500 transition duration-300">
                          <div className="w-0.5 h-3.5 bg-zinc-400 absolute transition-transform group-hover:-translate-y-0.5 duration-300" />
                          <div className="w-2.5 h-2.5 border-t-2 border-l-2 border-zinc-400 rotate-45 -translate-y-0.5 transition-transform group-hover:-translate-y-1 duration-300" />
                          <div className="w-4 h-0.5 border-b-2 border-zinc-400 absolute bottom-1.5" />
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-white">Arrastra tu comprobante</p>
                        <p className="mt-0.5 text-[7px] font-bold text-zinc-600 uppercase tracking-widest">o haz clic para seleccionarlo</p>
                        <span className="mt-2 rounded border border-zinc-900 bg-zinc-950 px-2 py-0.5 text-[6.5px] font-black text-zinc-600 uppercase tracking-widest">
                          JPG · PNG · Máx 5 MB
                        </span>
                      </button>
                    )}

                    {errorMsg && (
                      <div role="alert" className="text-[8px] font-black tracking-wider text-red-400 bg-red-950/20 px-3 py-2 rounded-lg border border-red-900 uppercase">
                        {errorMsg}
                      </div>
                    )}

                    {isSubmitting && uploadMessage && (
                      <div className="text-center py-0.5 text-[7px] font-black uppercase tracking-widest text-zinc-500 animate-pulse">
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

                  {/* ── BOTÓN CONFIRMAR COMPRA ── */}
                  <div className="space-y-2 pt-1">
                    <button
                      type="submit"
                      disabled={isSubmitting || !selectedFile || (hasTurnstileSiteKey("visible") && !turnstileToken)}
                      className="relative overflow-hidden w-full flex h-14 items-center justify-center rounded-xl bg-white text-[10px] font-black uppercase tracking-[0.35em] text-black transition-all duration-300 hover:bg-zinc-100 active:scale-[0.99] disabled:opacity-25 disabled:hover:bg-white disabled:cursor-not-allowed cursor-pointer shadow-[0_4px_32px_rgba(255,255,255,0.12)]"
                    >
                      {/* Shine animation */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <span className="h-3.5 w-3.5 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                          VERIFICANDO...
                        </span>
                      ) : (
                        "CONFIRMAR COMPRA"
                      )}
                    </button>
                    <p className="text-center text-[8px] font-medium tracking-wide text-zinc-600">
                      Tu entrada será validada por nuestro equipo tras confirmar el pago.
                    </p>
                  </div>

                </div>

                {/* ════════════════════════════════════════
                    RIGHT COLUMN — Resumen sticky
                ════════════════════════════════════════ */}
                <div className="w-full lg:w-[40%] order-1 lg:order-2 lg:sticky lg:top-24 space-y-3">

                  {/* Precio + Cantidad */}
                  <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-500">Resumen</span>
                      <span className="text-[7px] font-black uppercase tracking-widest text-zinc-700">VIP ACCESS</span>
                    </div>

                    {/* Event name compact */}
                    <div className="flex items-center gap-2.5 py-2 border-y border-zinc-900/60">
                      <div
                        className="w-1 h-8 rounded-full shrink-0"
                        style={{
                          background: `linear-gradient(to bottom, ${selectedDesignIndex !== null && designs[selectedDesignIndex]
                            ? designs[selectedDesignIndex].accentColor
                            : "#52525b"
                            }, ${selectedDesignIndex !== null && designs[selectedDesignIndex]
                              ? designs[selectedDesignIndex].accentColor
                              : "#52525b"
                            }40)`,
                        }}
                      />
                      <div>
                        <p className="text-xs font-black text-white uppercase tracking-tight leading-tight">{currentEvent.title}</p>
                        <p className="text-[7px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                          {selectedDesignIndex !== null && designs[selectedDesignIndex]
                            ? designs[selectedDesignIndex].name
                            : "SELECCIONA UN DISEÑO"}
                        </p>
                      </div>
                    </div>

                    {/* Price per ticket */}
                    <div className="flex items-baseline justify-between">
                      <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Precio por entrada</span>
                      <span className="text-sm font-black text-white">${pricePerTicket} USD</span>
                    </div>

                    {/* Quantity selector — integrado */}
                    <div className="flex items-center justify-between bg-black/40 rounded-xl border border-zinc-900 px-3 py-2">
                      <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Cantidad</span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-sm font-black text-white hover:border-zinc-700 active:scale-95 transition-all select-none"
                        >
                          −
                        </button>
                        <span className="text-lg font-black text-white w-5 text-center tabular-nums">{quantity}</span>
                        <button
                          type="button"
                          onClick={() => setQuantity(Math.min(10, quantity + 1))}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-sm font-black text-white hover:border-zinc-700 active:scale-95 transition-all select-none"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* ÚNICO TOTAL */}
                    <div className="flex items-baseline justify-between rounded-xl bg-white/[0.03] border border-zinc-900/60 px-4 py-3">
                      <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Total a pagar</span>
                      <div className="text-right">
                        <span className="text-2xl font-black text-white tracking-tight leading-none">${totalPrice.toFixed(2)}</span>
                        <span className="block text-[7px] font-black text-zinc-500 uppercase tracking-widest mt-0.5">USD</span>
                      </div>
                    </div>
                  </div>

                  {/* Vista previa de la entrada — botón modal */}
                  <button
                    type="button"
                    onClick={openModal}
                    className={`group w-full rounded-2xl border p-4 flex items-center justify-between gap-3 transition-all duration-300 focus:outline-none ${selectedDesignIndex === null
                      ? "border-red-500/30 bg-red-950/5 hover:border-red-500/50 hover:bg-red-950/10 shadow-[0_0_15px_rgba(239,68,68,0.05)]"
                      : "border-zinc-900 bg-zinc-950 hover:border-zinc-800 hover:bg-zinc-900/60"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Miniature ticket thumbnail */}
                      <div
                        className="w-9 h-12 rounded-lg overflow-hidden border border-zinc-800 shrink-0 relative"
                        style={{
                          boxShadow: `0 4px 12px ${selectedDesignIndex !== null && designs[selectedDesignIndex]
                            ? designs[selectedDesignIndex].shadowColor
                            : "rgba(255,255,255,0.05)"
                            }`,
                          filter: selectedDesignIndex === null ? "grayscale(1) opacity(0.4)" : "none",
                        }}
                      >
                        <img
                          src={
                            selectedDesignIndex !== null && designs[selectedDesignIndex]
                              ? designs[selectedDesignIndex].photo
                              : designs[0]?.photo || ""
                          }
                          alt="Ticket preview"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        <div
                          className="absolute inset-x-0 bottom-0 h-0.5"
                          style={{
                            background:
                              selectedDesignIndex !== null && designs[selectedDesignIndex]
                                ? designs[selectedDesignIndex].accentColor
                                : "#52525b",
                          }}
                        />
                      </div>
                      <div className="text-left font-sans">
                        <p className="text-[9px] font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                          Vista previa
                          {selectedDesignIndex === null && (
                            <span className="rounded bg-red-500/10 border border-red-500/20 px-1 py-0.2 text-[6px] font-black tracking-widest text-red-400 animate-pulse">
                              OBLIGATORIO
                            </span>
                          )}
                        </p>
                        <p className={`text-[7px] font-bold uppercase tracking-widest mt-0.5 ${selectedDesignIndex === null ? "text-red-400" : "text-zinc-500"
                          }`}>
                          {selectedDesignIndex !== null && designs[selectedDesignIndex]
                            ? `Diseño: ${designs[selectedDesignIndex].name}`
                            : "Elige tu diseño de entrada"}
                        </p>
                      </div>
                    </div>
                    {/* Arrow icon */}
                    <div className="shrink-0 w-7 h-7 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center transition-all duration-200 group-hover:border-zinc-700 group-hover:translate-x-0.5">
                      <svg className="w-3 h-3 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>

                </div>
              </form>
            </div>
          )}

          {/* ── VERIFYING / LOADING VIEW ── */}
          {dropState === "verifying" && (
            <div className="relative z-10 flex flex-col items-center justify-center text-center py-20 max-w-sm mx-auto select-none">
              {/* Central glowing core with pulse */}
              <div className="relative w-24 h-24 mb-8 flex items-center justify-center">
                {/* Rotating dashed border lines */}
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/10 border-t-[#e10075] animate-spin" />
                <div className="absolute inset-2 rounded-full border border-dashed border-white/10 border-b-[#C8FF00] animate-[spin_2s_linear_infinite_reverse]" />
                
                {/* Waving radar line */}
                <div className="absolute inset-4 rounded-full bg-gradient-to-t from-transparent via-[#C8FF00]/10 to-transparent animate-[pulse_1s_ease-in-out_infinite]" />
                
                {/* Glowing neon core */}
                <div className="h-6 w-6 rounded-full bg-white shadow-[0_0_20px_#C8FF00,0_0_35px_#e10075] animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]" />
                <div className="absolute h-6 w-6 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] flex items-center justify-center text-[7px] font-black text-black">
                  NOW
                </div>
              </div>
              
              <p className="text-xs font-black uppercase tracking-[0.25em] text-white animate-pulse">
                {verifyingMessage}
              </p>
              <p className="text-[7px] font-bold tracking-widest text-zinc-600 uppercase mt-2">
                Conexión segura SSL verificada
              </p>
            </div>
          )}

          {/* ── SUCCESS VIEW ── */}
          {dropState === "success" && (
            <div ref={successRef} className="success-reveal relative z-10 flex flex-col items-center text-center max-w-md mx-auto py-12">
              
              {/* 3D-like Ticket receipt container with stamp */}
              <div className="success-ticket-card relative mb-8 w-60 h-36 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md overflow-hidden flex flex-col justify-between p-4 shadow-[0_15px_35px_rgba(0,0,0,0.6)]">
                {/* Energy Ring inside card for centering the blast */}
                <div className="success-energy-ring absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2 border-[#C8FF00] opacity-0 pointer-events-none" />
                
                {/* Top ticket header */}
                <div className="flex justify-between items-center z-10">
                  <span className="text-[7px] font-black uppercase tracking-widest text-[#e10075]">NowTickets</span>
                  <span className="text-[6px] font-mono text-zinc-500">#{Math.floor(100000 + Math.random() * 900000)}</span>
                </div>
                
                {/* Dotted separator */}
                <div className="absolute top-[42px] inset-x-0 border-t border-dashed border-white/10" />
                
                {/* Middle details */}
                <div className="mt-4 text-left z-10">
                  <p className="text-[6px] font-black text-zinc-500 uppercase tracking-widest">Invitado</p>
                  <p className="text-xs font-black text-white uppercase tracking-wider truncate max-w-[150px]">
                    {formData.firstName.trim() ? `${formData.firstName.trim()} ${formData.lastName.trim()}` : "CLIENTE DAWG"}
                  </p>
                </div>
                
                {/* Bottom details / barcode */}
                <div className="flex justify-between items-end z-10">
                  <div>
                    <p className="text-[6px] font-black text-zinc-500 uppercase tracking-widest">Estado</p>
                    <p className="text-[7px] font-black text-[#C8FF00] uppercase tracking-wider">Verificando Pago</p>
                  </div>
                  {/* Barcode lines */}
                  <div className="flex gap-px h-5 items-end">
                    <div className="w-[1.5px] h-full bg-white/40" />
                    <div className="w-[3px] h-full bg-white/40" />
                    <div className="w-px h-full bg-white/40" />
                    <div className="w-[2px] h-[80%] bg-white/40" />
                    <div className="w-[1.5px] h-full bg-white/40" />
                    <div className="w-[3px] h-[60%] bg-white/40" />
                    <div className="w-px h-full bg-white/40" />
                    <div className="w-[2.5px] h-full bg-white/40" />
                  </div>
                </div>
                
                {/* The Stamp Overlay (slams down in 3D style) */}
                <div className="success-stamp absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <div className="h-16 w-16 rounded-full border-[3px] border-[#C8FF00] bg-zinc-950/95 flex items-center justify-center shadow-[0_0_20px_rgba(200,255,0,0.4)]">
                    <svg className="w-9 h-9 text-[#C8FF00]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" className="success-check-path" />
                    </svg>
                  </div>
                </div>

                {/* Particle explosion container */}
                <div ref={sparklesRef} className="absolute inset-0 pointer-events-none overflow-visible z-30">
                  {Array.from({ length: 24 }).map((_, i) => {
                    const colors = ["#e10075", "#ffffff", "#C8FF00", "#FFDD00", "#ffffff"];
                    const shapes = ["50%", "3px", "50% 0 50% 0", "0%"];
                    return (
                      <div
                        key={i}
                        className="success-sparkle absolute h-2 w-2 opacity-0"
                        style={{
                          left: "50%",
                          top: "50%",
                          background: colors[i % colors.length],
                          boxShadow: `0 0 8px ${colors[i % colors.length]}`,
                          borderRadius: shapes[i % shapes.length],
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
                <div className="success-btn-container mt-8 relative p-[1.5px] rounded-full overflow-hidden bg-zinc-950 flex items-center justify-center shadow-[0_0_20px_rgba(200,255,0,0.15)] hover:shadow-[0_0_25px_rgba(200,255,0,0.35)] transition-all duration-300 group max-w-[200px] w-full">
                  {/* Rotating border line */}
                  <div className="absolute inset-[-150%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_35%,#C8FF00_50%,transparent_65%)] pointer-events-none" />
                  <button
                    onClick={handleSuccessClose}
                    className="relative z-10 flex h-[42px] w-full items-center justify-center rounded-full bg-zinc-950 text-[9px] font-black uppercase tracking-widest text-white hover:bg-white hover:text-black transition-all duration-300"
                    style={{
                      transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  >
                    CERRAR
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          MODAL — Vista Previa de la Entrada VIP
      ═══════════════════════════════════════════════════ */}
      {showTicketModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ perspective: "1200px" }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 transition-all duration-350"
            style={{
              background: "rgba(0,0,0,0.88)",
              backdropFilter: `blur(${modalVisible ? "20px" : "0px"})`,
              opacity: modalVisible ? 1 : 0,
              transition: "opacity 0.35s ease, backdrop-filter 0.35s ease",
            }}
          />

          {/* Modal content */}
          <div
            className="relative z-10 flex flex-col items-center gap-4 transition-all duration-350 w-full max-w-[360px]"
            style={{
              opacity: modalVisible ? 1 : 0,
              transform: modalVisible ? "scale(1) translateY(0)" : "scale(0.88) translateY(32px)",
              transition: "opacity 0.35s cubic-bezier(0.34,1.56,0.64,1), transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between w-full px-2">
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.35em] text-zinc-500">NENEZ · Vista Previa</p>
                <p className="text-xs font-black text-white uppercase tracking-tight mt-0.5">{currentEvent.title}</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Cerrar preview"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950/80 text-zinc-400 hover:text-white hover:border-zinc-700 transition duration-200"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Ticket with navigation buttons */}
            <div className="flex items-center justify-between w-full gap-2 relative">
              {/* Left switch button */}
              <button
                type="button"
                onClick={() => setCurrentViewedDesignIndex((prev) => (prev - 1 + designs.length) % Math.max(1, designs.length))}
                className="shrink-0 w-8 h-8 rounded-full border border-zinc-800 bg-zinc-950/80 text-zinc-400 hover:text-white hover:border-zinc-700 flex items-center justify-center transition active:scale-90"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Ticket 3D — grande */}
              <div
                ref={modalTicketRef}
                onMouseMove={handleModalMouseMove}
                onMouseLeave={handleModalMouseLeave}
                className="relative w-full max-w-[260px] sm:max-w-[270px] aspect-[1/1.75] rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 cursor-default flex flex-col justify-between"
                style={{
                  transformStyle: "preserve-3d",
                  boxShadow: `0 32px 80px -12px rgba(0,0,0,0.95), 0 0 60px ${designs[currentViewedDesignIndex]?.shadowColor || "rgba(255,255,255,0.05)"}`,
                  transition: "transform 0.15s ease",
                }}
              >
                {/* Light reflection */}
                <div
                  className="absolute inset-0 z-30 pointer-events-none"
                  style={{ background: "radial-gradient(circle 200px at var(--mx, -1000px) var(--my, -1000px), rgba(255,255,255,0.08), transparent 80%)" }}
                />
                {/* Accent glow */}
                <div
                  className="absolute inset-0 rounded-2xl z-20 pointer-events-none"
                  style={{ boxShadow: `inset 0 0 12px ${designs[currentViewedDesignIndex]?.accentColor || "#52525b"}30` }}
                />

                {/* Artist photo */}
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-black shrink-0">
                  <img
                    src={designs[currentViewedDesignIndex]?.photo || ""}
                    alt={designs[currentViewedDesignIndex]?.name || "Artist"}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/60 z-10" />
                  <div className="absolute top-4 inset-x-4 z-20 flex justify-between items-center text-[8px] font-black uppercase tracking-[0.25em] text-white/90">
                    <span>NENEZ</span>
                    <span
                      className="rounded border border-white/20 bg-black/45 px-2 py-0.5 backdrop-blur-md"
                      style={{
                        borderColor: `${designs[currentViewedDesignIndex]?.accentColor || "#52525b"}40`,
                        color: designs[currentViewedDesignIndex]?.accentColor || "#ffffff"
                      }}
                    >
                      {designs[currentViewedDesignIndex]?.badge || "VIP ACCESS"}
                    </span>
                  </div>
                  <div className="absolute bottom-4 inset-x-4 z-20">
                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-400">{currentEvent.title}</span>
                    <h4 className="text-xl font-black uppercase tracking-tight text-white mt-0.5 leading-none">
                      {designs[currentViewedDesignIndex]?.name || "VIP"}
                    </h4>
                  </div>
                </div>

                {/* Perforated line */}
                <div className="relative w-full h-px shrink-0 z-20">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[#060606] border border-zinc-800 z-20" />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-5 h-5 rounded-full bg-[#060606] border border-zinc-800 z-20" />
                  <div className="absolute left-3.5 right-3.5 top-1/2 h-0.5 border-t border-dashed border-zinc-800 z-10" />
                </div>

                {/* Stub */}
                <div className="relative p-5 flex-1 flex flex-col justify-between bg-zinc-950 text-left">
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
                  <div className="text-[8px] font-mono font-bold tracking-widest text-zinc-600 uppercase">
                    TICKET NO: #NENEZ-{2026 + quantity}-{102 + quantity}VIP
                  </div>
                  <div className="flex items-center justify-between gap-4 mt-3">
                    <div className="flex-1 flex flex-col gap-1.5 min-w-0">
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
                      <span className="text-[6.5px] font-mono tracking-widest text-zinc-600 uppercase block truncate">*VIP-ONLY-ENTRY*</span>
                    </div>
                    <div className="w-12 h-12 bg-white p-1 rounded shrink-0 flex items-center justify-center shadow-md">
                      <svg className="w-full h-full text-black" viewBox="0 0 29 29" fill="currentColor">
                        <path d="M0 0h9v9H0zm1 1h7v7H1zm1 1h5v5H2zm12-2h1v1h-1zm2 0h2v1h-2zm3 0h1v1h-1zm1 0h3v1h-3zm5 0h1v1h-1zm-9 2h1v2h-1zm2 0h1v1h-1zm1 0h2v1h-2zm3 0h2v2h-2zm2 0h1v1h-1zm1 0h1v2h-1zm2 0h1v1h-1zm-10 2h2v1h-2zm3 0h1v1h-1zm2 0h2v1h-2zm3 0h1v1h-1zm-10 2h1v1h-1zm2 0h1v1h-1zm2 0h1v1h-1zm2 0h1v2h-1zm2 0h2v1h-2zm-9 2h1v1h-1zm3 0h1v1h-1zm1 0h1v1h-1zm3 0h1v1h-1zm2 0h3v1h-3zm-10 2h1v1h-1zm3 0h1v1h-1zm2 0h1v1h-1zm1 0h2v1h-2zm3 0h1v1h-1zm2 0h1v1h-1zm-12 2h9v9H0zm1 1h7v7H1zm1 1h5v5H2zm12-2h1v1h-1zm2 0h2v1h-2zm3 0h1v1h-1zm1 0h3v1h-3zm5 0h1v1h-1z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right switch button */}
              <button
                type="button"
                onClick={() => setCurrentViewedDesignIndex((prev) => (prev + 1) % Math.max(1, designs.length))}
                className="shrink-0 w-8 h-8 rounded-full border border-zinc-800 bg-zinc-950/80 text-zinc-400 hover:text-white hover:border-zinc-700 flex items-center justify-center transition active:scale-90"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Selector dots (just like homepage carousel) */}
            <div className="flex gap-1.5 justify-center py-1">
              {designs.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentViewedDesignIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentViewedDesignIndex
                    ? "w-4 bg-white"
                    : "w-1.5 bg-white/20 hover:bg-white/40"
                    }`}
                />
              ))}
            </div>

            {/* ELEGIR DISEÑO BUTTON (monochrome, no buttons on card) */}
            <button
              type="button"
              onClick={() => {
                setSelectedDesignIndex(currentViewedDesignIndex);
                closeModal();
              }}
              className={`w-full max-w-[270px] flex h-11 items-center justify-center rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${selectedDesignIndex === currentViewedDesignIndex
                ? "bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                : "bg-white text-black hover:bg-zinc-200"
                }`}
            >
              {selectedDesignIndex === currentViewedDesignIndex
                ? "✓ DISEÑO SELECCIONADO"
                : "ELEGIR ESTE DISEÑO"}
            </button>
          </div>
        </div>
      )}

      <style>{`
        .success-ring-pulse { animation: ringPulse 2.8s ease-out 0.6s infinite; }
        @keyframes ringPulse { 0% { transform: scale(0.8); opacity: 0; } 40% { opacity: 0.15; } 100% { transform: scale(1.5); opacity: 0; } }
      `}</style>
    </>
  );
});

AccessDrop.displayName = "AccessDrop";

export default AccessDrop;
