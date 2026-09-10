"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowLeft,
  Check,
  ShieldCheck,
  Upload,
  Copy,
  AlertCircle,
  Sparkles,
  QrCode,
  CreditCard,
  Building2,
  Lock,
  RefreshCw,
  Tag,
  Search,
  User,
  Plus,
} from "lucide-react";
import type { Event } from "@/frontend/types/domain";
import { getHdImageSrc, DEFAULT_HD_EVENT_POSTER } from "@/frontend/utils/hdImages";
import TicketPassModal from "@/frontend/components/TicketPassModal";

interface EventPurchaseCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
  userProfile?: any;
  userLoggedIn?: boolean;
  onOpenAuth?: () => void;
  onSuccessPurchase?: (orderId: string) => void;
  onOpenSearch?: () => void;
  onOpenProfile?: () => void;
  onOpenCreate?: () => void;
}

export interface PurchaseTier {
  id: string;
  name: string;
  price: number;
  releaseTag: string;
  type: "ticket" | "table";
  maxAvailable?: number;
  remainingTables?: number;
  status?: "active" | "expired" | "sold_out" | "upcoming";
  badge?: string;
}

const BANK_ACCOUNTS = [
  {
    id: "pichincha",
    bank: "Banco Pichincha",
    type: "Cuenta Corriente",
    accountNumber: "2100234589",
    holder: "4GO PRODUCTIONS S.A.S",
    idNumber: "1104589234001",
    email: "pagos@4go.ec",
    qrImage: "/images/qr-banco-pichincha.png",
    qrSubtitle: "Escanea con Pichincha o DeUna!",
  },
  {
    id: "loja",
    bank: "Banco de Loja",
    type: "Cuenta de Ahorros",
    accountNumber: "2901458920",
    holder: "4GO PRODUCTIONS S.A.S",
    idNumber: "1104589234001",
    email: "pagos@4go.ec",
    qrImage: "/images/qr-banco-loja.png",
    qrSubtitle: "Escanea con Banco de Loja Móvil",
  },
];

// Reusable Legal Notice Component with Favicon Image
function LegalNotice({ userLoggedIn }: { userLoggedIn?: boolean }) {
  return (
    <div className="flex items-start gap-3.5 pt-2 text-left">
      <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-md overflow-hidden p-1 border border-white/20">
        <img
          src="/images/logo_4go_black_white.png"
          alt="4GO Favicon"
          width={34}
          height={34}
          loading="eager"
          decoding="sync"
          className="w-[34px] h-[34px] object-contain rounded-xl"
        />
      </div>
      <p className="text-[11px] sm:text-xs text-zinc-300 font-sans font-medium leading-relaxed tracking-normal">
        {userLoggedIn ? (
          <>
            Comprando esta entrada, aceptarás nuestras{" "}
            <strong className="text-white font-bold">Condiciones de Uso</strong> generales, la{" "}
            <strong className="text-white font-bold">Política de Privacidad</strong> y las{" "}
            <strong className="text-white font-bold">Condiciones de Compra</strong> de entradas.
            Procesamos tus datos personales de acuerdo con nuestra{" "}
            <strong className="text-white font-bold">Política de Privacidad</strong>.
          </>
        ) : (
          <>
            Comprando esta entrada, abrirás una cuenta y aceptarás nuestras{" "}
            <strong className="text-white font-bold">Condiciones de Uso</strong> generales, la{" "}
            <strong className="text-white font-bold">Política de Privacidad</strong> y las{" "}
            <strong className="text-white font-bold">Condiciones de Compra</strong> de entradas.
            Procesamos tus datos personales de acuerdo con nuestra{" "}
            <strong className="text-white font-bold">Política de Privacidad</strong>.
          </>
        )}
      </p>
    </div>
  );
}

export default function EventPurchaseCheckoutModal({
  isOpen,
  onClose,
  event,
  userProfile,
  userLoggedIn,
  onOpenAuth,
  onSuccessPurchase,
  onOpenSearch,
  onOpenProfile,
  onOpenCreate,
}: EventPurchaseCheckoutModalProps) {
  // Steps: "select" (Paso 1: Entradas/Mesas) -> "payment" (Paso 2: Transferencia y Comprobante) -> "confirmed" (Paso 3: En espera de acreditación)
  const [currentStep, setCurrentStep] = useState<"select" | "payment" | "confirmed">("select");

  // Counters start at 0
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Promo code state
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState("");

  // Form info
  const [customerName, setCustomerName] = useState(userProfile?.name || "");
  const [customerEmail, setCustomerEmail] = useState(userProfile?.email || "");
  const [customerPhone, setCustomerPhone] = useState(userProfile?.phone || "");
  const [selectedBankId, setSelectedBankId] = useState("pichincha");

  // Receipt upload state
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState("");
  const [copiedBankField, setCopiedBankField] = useState<string | null>(null);
  const [verifyingStatusText, setVerifyingStatusText] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userExistingEventTickets, setUserExistingEventTickets] = useState<any[]>([]);
  const [viewingTicketQr, setViewingTicketQr] = useState<any | null>(null);

  // Reset when opening modal with a new event
  useEffect(() => {
    if (isOpen) {
      setCurrentStep("select");
      setQuantities({});
      setReceiptFile(null);
      setReceiptPreview(null);
      setUploadError("");
      setUploadSuccessMsg("");
      setShowPromoModal(false);
      setPromoInput("");
      setAppliedPromo(null);
      setPromoError("");
      setPromoSuccess("");
      if (userLoggedIn && userProfile) {
        if (userProfile.name) setCustomerName(userProfile.name);
        if (userProfile.email) setCustomerEmail(userProfile.email);
        if (userProfile.phone) setCustomerPhone(userProfile.phone);
      } else {
        setCustomerName("");
        setCustomerEmail("");
        setCustomerPhone("");
        setUserExistingEventTickets([]);
      }

      if (userLoggedIn && userProfile?.email && event && typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("nenez_purchased_tickets");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              const forEvent = parsed.filter(
                (t: any) =>
                  (t.eventId === event.id || t.eventTitle === event.title) &&
                  (!t.userEmail || t.userEmail.toLowerCase() === userProfile.email.toLowerCase())
              );
              const individualPasses: any[] = [];
              forEvent.forEach((item: any) => {
                const qty = Number(item.quantity) || 1;
                if (qty > 1) {
                  for (let i = 0; i < qty; i++) {
                    individualPasses.push({
                      ...item,
                      id: `${item.id}-${i + 1}`,
                      singleIndex: i + 1,
                      tierName: item.tierName?.replace(/^\d+x\s*/i, "") || "Entrada General",
                    });
                  }
                } else {
                  individualPasses.push({
                    ...item,
                    tierName: item.tierName?.replace(/^\d+x\s*/i, "") || "Entrada General",
                  });
                }
              });
              setUserExistingEventTickets(individualPasses);
            }
          }
        } catch {}
      } else {
        setUserExistingEventTickets([]);
      }
    }
  }, [isOpen, userLoggedIn, userProfile, event]);

  if (!isOpen || !event) return null;

  const basePrice = Math.round(event.price !== undefined ? event.price : 10);

  // Compute clean tiers based on the event's actual presales or standard tiers
  const tiers: PurchaseTier[] = (() => {
    if (event?.presales && Array.isArray(event.presales) && event.presales.length > 0) {
      const list: PurchaseTier[] = (event.presales as any[]).map((p: any, idx: number) => ({
        id: `presale-${p.id || idx}`,
        name: `GA - ${p.name || `Preventa ${idx + 1}`}`,
        price: Number(p.price) || basePrice,
        releaseTag: p.duration === "1_semana" ? "Dura 1 Semana (7 días)" : p.duration === "2_semanas" ? "Dura 2 Semanas" : idx === 0 ? "Fase Actual Activa" : "Siguiente Fase",
        type: "ticket",
        status: "active",
      }));

      // Add a VIP option
      list.push({
        id: "vip-tier",
        name: "VIP (Acceso Preferencial + Barra)",
        price: (Number((event.presales as any[])[0]?.price) || basePrice) * 2,
        releaseTag: "Acceso VIP Exclusivo",
        type: "ticket",
        status: "active",
      });
      return list;
    }

    return [
      {
        id: "ga-preventa-1",
        name: "GA - Preventa 1 (Early Bird)",
        price: basePrice,
        releaseTag: "Fase actual · Acceso General",
        type: "ticket",
        status: "active",
      },
      {
        id: "ga-preventa-2",
        name: "GA - Preventa 2 (Entry ANYTIME)",
        price: basePrice + 5,
        releaseTag: "Segunda fase de venta",
        type: "ticket",
        status: "active",
      },
      {
        id: "vip-preventa",
        name: "VIP (Entry ANYTIME)",
        price: basePrice * 2,
        releaseTag: "Acceso VIP + Barra Exclusiva",
        type: "ticket",
        status: "active",
      },
    ];
  })();

  const totalTickets = Object.entries(quantities).reduce((acc, [id, qty]) => {
    const tier = tiers.find((t) => t.id === id);
    if (tier?.type === "ticket") return acc + qty;
    return acc;
  }, 0);

  const totalTables = Object.entries(quantities).reduce((acc, [id, qty]) => {
    const tier = tiers.find((t) => t.id === id);
    if (tier?.type === "table") return acc + qty;
    return acc;
  }, 0);

  const existingTicketsCount = userLoggedIn
    ? userExistingEventTickets.filter(
        (t: any) => t.status !== "rejected" && t.status !== "rechazado"
      ).length
    : 0;
  const isMaxTicketsReached = userLoggedIn && existingTicketsCount >= 2;

  const handleIncrease = (tierId: string) => {
    if (existingTicketsCount + totalTickets >= 2) return;
    const tier = tiers.find((t) => t.id === tierId);
    if (!tier || tier.status === "expired" || tier.status === "sold_out") return;
    if (tier?.remainingTables !== undefined) {
      const current = quantities[tierId] || 0;
      if (current >= tier.remainingTables) return;
    }
    setQuantities((prev) => ({
      ...prev,
      [tierId]: (prev[tierId] || 0) + 1,
    }));
  };

  const handleDecrease = (tierId: string) => {
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

  const subtotalPrice = Object.entries(quantities).reduce((acc, [id, qty]) => {
    const tier = tiers.find((t) => t.id === id);
    return acc + (tier?.price || 0) * qty;
  }, 0);

  const discountAmount = appliedPromo ? Math.min(subtotalPrice, appliedPromo.discount) : 0;
  const totalPrice = Math.max(0, subtotalPrice - discountAmount);
  const totalItemsCount = totalTickets + totalTables;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError("");
    setPromoSuccess("");
    const cleaned = promoInput.trim().toUpperCase();
    if (!cleaned) {
      setPromoError("Ingresa un código.");
      return;
    }
    if (cleaned === "4GO" || cleaned === "VIP" || cleaned === "LOJA" || cleaned === "DESCUENTO" || cleaned === "PARTY") {
      setAppliedPromo({ code: cleaned, discount: 5 });
      setPromoSuccess("¡Código aplicado con éxito! Descuento de $5.00");
      setTimeout(() => setShowPromoModal(false), 1000);
    } else if (cleaned.length >= 3) {
      setAppliedPromo({ code: cleaned, discount: 2 });
      setPromoSuccess(`¡Código ${cleaned} de organizador aplicado! Descuento de $2.00`);
      setTimeout(() => setShowPromoModal(false), 1000);
    } else {
      setPromoError("Código promocional no válido.");
    }
  };

  const handleFileChange = (file: File | null) => {
    setUploadError("");
    if (!file) {
      setReceiptFile(null);
      setReceiptPreview(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setUploadError("Por favor sube una imagen válida (JPG o PNG).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("La imagen no debe superar los 5MB.");
      return;
    }

    setReceiptFile(file);
    const url = URL.createObjectURL(file);
    setReceiptPreview(url);
  };

  const handleCopyText = (text: string, fieldKey: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedBankField(fieldKey);
      setTimeout(() => setCopiedBankField(null), 2000);
    }
  };

  const handleProceedToPayment = () => {
    if (totalItemsCount === 0) return;
    if (!userLoggedIn) {
      onOpenAuth?.();
      return;
    }
    setCurrentStep("payment");
  };

  const handleSubmitReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError("");

    if (!customerName.trim()) {
      setUploadError("Por favor ingresa tu nombre completo.");
      return;
    }

    if (!customerEmail.trim() || !customerEmail.includes("@")) {
      setUploadError("Por favor ingresa un correo electrónico válido.");
      return;
    }

    if (!receiptFile) {
      setUploadError("Debes adjuntar la foto o captura del comprobante bancario.");
      return;
    }

    setIsUploading(true);
    setVerifyingStatusText("Analizando comprobante de pago...");

    try {
      const formData = new FormData();
      formData.append("comprobante", receiptFile);
      formData.append("firstName", customerName.split(" ")[0] || customerName);
      formData.append("lastName", customerName.split(" ").slice(1).join(" ") || "");
      formData.append("email", customerEmail.trim().toLowerCase());
      formData.append("phone", customerPhone.trim());
      formData.append("quantity", totalItemsCount.toString());
      formData.append("paymentMethod", selectedBankId === "loja" ? "banco-loja" : "banco-pichincha");
      formData.append("totalAmount", totalPrice.toString());
      formData.append("expectedTotal", totalPrice.toString());
      formData.append("eventId", event.id);
      formData.append("eventTitle", event.title);
      formData.append("ticketDesign", "0");
      formData.append("cf-turnstile-response", "");

      const res = await fetch("/api/access-drop/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "RECEIPT_REJECTED") {
          throw new Error(
            data.error ||
              "El sistema detectó que la imagen subida no es un comprobante de transferencia bancaria válido. Por favor sube tu captura real."
          );
        }
        throw new Error(data.error || "No se pudo procesar el comprobante.");
      }

      setVerifyingStatusText("Verificando transacción...");
      await new Promise((r) => setTimeout(r, 1200));

      setVerifyingStatusText("Registrando pedido...");
      await new Promise((r) => setTimeout(r, 800));

      setUploadSuccessMsg("Comprobante recibido con éxito.");

      // Save purchase request to localStorage
      try {
        const tierDesc = Object.entries(quantities)
          .map(([id]) => tiers.find((t) => t.id === id)?.name || id)
          .join(", ") || "Entrada General";

        const newTicket = {
          id: data.receiptId || `tkt-${Date.now()}`,
          eventId: event.id,
          eventTitle: event.title,
          venue: event.venue || "Lugar del Evento",
          date: event.dateLabel || event.date || "Fecha",
          quantity: totalItemsCount,
          tierName: tierDesc.replace(/^\d+x\s*/i, "").trim(),
          totalAmount: totalPrice,
          status: "en_verificacion",
          createdAt: new Date().toISOString(),
          referenceNumber: data.referenceNumber || (receiptFile?.name ? receiptFile.name.slice(0, 12) : "32561683"),
          qrCode: `4GO-${event.id}-${Date.now()}`,
        };

        const existing = JSON.parse(localStorage.getItem("nenez_purchased_tickets") || "[]");
        const updatedTickets = [newTicket, ...existing.filter((t: any) => t.id !== newTicket.id)];
        localStorage.setItem("nenez_purchased_tickets", JSON.stringify(updatedTickets));
        
        // Expand for current view
        const passes: any[] = [];
        if (totalItemsCount > 1) {
          for (let i = 0; i < totalItemsCount; i++) {
            passes.push({
              ...newTicket,
              id: `${newTicket.id}-${i + 1}`,
              singleIndex: i + 1,
              tierName: tierDesc.replace(/^\d+x\s*/i, "").trim(),
            });
          }
        } else {
          passes.push(newTicket);
        }
        setUserExistingEventTickets((prev) => [...passes, ...prev.filter((t: any) => !t.id.startsWith(newTicket.id))]);
      } catch (e) {
        console.error("Error storing purchased ticket:", e);
      }

      setCurrentStep("confirmed");
      onSuccessPurchase?.(data.receiptId || "order-" + Date.now());
    } catch (err: any) {
      setUploadError(err.message || "Error al procesar el comprobante.");
    } finally {
      setIsUploading(false);
      setVerifyingStatusText("");
    }
  };

  const selectedBank = BANK_ACCOUNTS.find((b) => b.id === selectedBankId) || BANK_ACCOUNTS[0];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className="fixed inset-0 z-[950] bg-black text-white flex flex-col select-none overflow-y-auto"
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

        {/* Top Edge Smooth Black Shadow Gradient */}
        <div className="absolute top-0 inset-x-0 h-36 sm:h-44 bg-gradient-to-b from-black/80 via-black/35 to-transparent pointer-events-none" />

        {/* Global Smooth Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/25 via-40% to-black pointer-events-none" />
      </div>

      {/* ─── TOP NAVIGATION HEADER BAR (EXACT MATCHING POSITION AS EVENT DETAIL) ─── */}
      <header className="fixed top-0 inset-x-0 z-[550] flex items-center justify-between px-4 sm:px-8 py-4 bg-gradient-to-b from-black/90 via-black/40 to-transparent pointer-events-none">
        {/* Left: Circular Back Arrow Button with Hover Tooltip */}
        <div className="relative group pointer-events-auto flex items-center">
          <button
            type="button"
            onClick={() => {
              if (currentStep === "payment") {
                setCurrentStep("select");
              } else {
                onClose();
              }
            }}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 backdrop-blur-xl transition-all cursor-pointer shadow-2xl active:scale-95 shrink-0"
            aria-label="Atrás"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          {/* Hover Tooltip: Atrás */}
          <div className="absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-zinc-950/90 border border-white/20 text-white text-[11px] font-bold uppercase tracking-wider backdrop-blur-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 -translate-x-1 group-hover:translate-x-0 whitespace-nowrap z-50">
            Atrás
          </div>
        </div>

        {/* Center: Breadcrumbs (Desktop Centered in same row) */}
        <div className="pointer-events-auto hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-3 text-xs sm:text-sm font-semibold tracking-normal text-zinc-400">
          <span className={currentStep === "select" ? "text-white font-bold" : "text-zinc-500"}>
            Entrada
          </span>
          <span className="text-zinc-600">→</span>
          <span className={currentStep === "payment" ? "text-white font-bold" : "text-zinc-500"}>
            Pago
          </span>
          <span className="text-zinc-600">→</span>
          <span className={currentStep === "confirmed" ? "text-white font-bold" : "text-zinc-500"}>
            Confirmación
          </span>
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
              onClick={() => onOpenProfile?.()}
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
                    const fallback = e.currentTarget.parentElement?.querySelector(".checkout-user-fallback");
                    if (fallback) fallback.classList.remove("hidden");
                  }}
                />
              ) : (
                <User className="w-5 h-5 text-white" />
              )}
              <User className="checkout-user-fallback w-5 h-5 text-white hidden" />
            </button>

            {/* Hover Tooltip: Perfil */}
            <div className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-zinc-950/90 border border-white/20 text-white text-[11px] font-bold uppercase tracking-wider backdrop-blur-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 -translate-y-1 group-hover:translate-y-0 whitespace-nowrap z-50">
              Perfil
            </div>
          </div>
        </div>
      </header>

      {/* ─── PROMO CODE MODAL OVERLAY ─── */}
      <AnimatePresence>
        {showPromoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[600] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setShowPromoModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-zinc-900 border border-white/20 rounded-3xl p-6 shadow-2xl space-y-4 text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#dfff28]" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    Código de Descuento
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPromoModal(false)}
                  className="p-1 rounded-full text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-zinc-400">
                Ingresa el código proporcionado por el organizador para obtener tu descuento oficial.
              </p>

              <form onSubmit={handleApplyPromo} className="space-y-3">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  placeholder="EJ. 4GO, VIP, LOJA"
                  className="w-full px-4 py-3 rounded-2xl bg-black/50 border border-white/20 text-xs font-black uppercase tracking-widest text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#dfff28]"
                  autoFocus
                />

                {promoError && (
                  <p className="text-xs text-red-400 font-bold">{promoError}</p>
                )}
                {promoSuccess && (
                  <p className="text-xs text-emerald-400 font-bold">{promoSuccess}</p>
                )}

                <button
                  type="submit"
                  className="w-full py-3 rounded-full bg-[#dfff28] hover:bg-[#d4f522] text-black font-black text-xs uppercase tracking-widest transition cursor-pointer shadow-lg active:scale-95"
                >
                  APLICAR CÓDIGO
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── SCROLLABLE CONTENT BODY ─── */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-20 md:pt-24 pb-36 lg:pb-20 flex flex-col space-y-5">
        {/* Mobile Centered Breadcrumbs (Only on mobile, below fixed back arrow) */}
        <div className="md:hidden flex items-center justify-center gap-2 text-xs font-semibold tracking-normal text-zinc-400 pb-1">
          <span className={currentStep === "select" ? "text-white font-bold" : "text-zinc-500"}>
            Entrada
          </span>
          <span className="text-zinc-600">→</span>
          <span className={currentStep === "payment" ? "text-white font-bold" : "text-zinc-500"}>
            Pago
          </span>
          <span className="text-zinc-600">→</span>
          <span className={currentStep === "confirmed" ? "text-white font-bold" : "text-zinc-500"}>
            Confirmación
          </span>
        </div>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* PASO 1: SELECCIÓN DE ENTRADAS Y MESAS                         */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {currentStep === "select" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start text-left">
            {/* Left Column (7 cols): Event Header + Tiers List + Mobile Legal Notice */}
            <div className="lg:col-span-7 space-y-4">
              {/* Event Header (No card box, floating freely as in Photo 3) */}
              <div className="flex items-center gap-4 text-left pb-1">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 border border-white/15 bg-zinc-900 shadow-xl">
                  <Image
                    src={getHdImageSrc(event.poster)}
                    alt={event.title}
                    fill
                    priority
                    unoptimized
                    sizes="(max-width: 640px) 64px, 80px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 text-left space-y-1">
                  <h2 className="text-base sm:text-lg font-black text-white leading-tight truncate">
                    {event.title}
                  </h2>
                  <p className="text-xs font-bold text-[#dfff28] flex items-center gap-1.5">
                    <span>{event.dateLabel || event.startsAt || "Próximamente"}</span>
                    <span>•</span>
                    <span>{event.time || "22:00 GMT-5"}</span>
                  </p>
                  <p className="text-xs text-zinc-400 font-medium truncate">
                    {event.venue || "CUBIC & SATA Club, Loja"}
                  </p>
                </div>
              </div>

              {/* ─── USER ACTIVE REQUESTS / PASSES FOR THIS EVENT (HORIZONAL CARD STYLE) ─── */}
              {userExistingEventTickets.length > 0 && (
                <div className="space-y-2 pt-1 pb-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 block">
                    Tus Solicitudes &amp; Pases para este Evento
                  </span>

                  <div className="space-y-2">
                    {userExistingEventTickets.map((tkt) => {
                      const isConfirmed = tkt.status === "confirmed" || tkt.status === "aprobado";
                      const isRejected = tkt.status === "rejected" || tkt.status === "rechazado";

                      return (
                        <div
                          key={tkt.id}
                          onClick={() => {
                            if (isConfirmed) {
                              setViewingTicketQr(tkt);
                            }
                          }}
                          className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/90 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition cursor-pointer group shadow-lg"
                        >
                          <div className="flex flex-col text-left space-y-0.5 min-w-0 pr-3">
                            <span className="text-sm font-extrabold text-white leading-tight truncate group-hover:text-zinc-200">
                              {tkt.tierName?.replace(/^\d+x\s*/i, "") || "Entrada"}
                            </span>
                            <span className="text-xs text-zinc-400 font-medium truncate">
                              {isConfirmed
                                ? "✓ Entrada confirmada · Código QR activo"
                                : isRejected
                                ? "✕ Solicitud no aprobada · Contactar organizador"
                                : `Ref: #${tkt.referenceNumber || tkt.id.slice(0, 8)} · Esperando verificación`}
                            </span>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            {isConfirmed ? (
                              <div className="flex items-center justify-center px-4 py-1.5 rounded-full bg-white text-black font-black text-xs uppercase tracking-wider shadow-md">
                                <span>VER TICKET</span>
                              </div>
                            ) : isRejected ? (
                              <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 font-bold text-xs uppercase">
                                Rechazado
                              </span>
                            ) : (
                              <div className="px-3.5 py-1.5 rounded-full bg-zinc-950 border border-zinc-700 text-zinc-300 font-bold text-[11px] uppercase tracking-wider">
                                <span>Por Confirmar</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tiers List */}
              <div className="space-y-3">
                {tiers.map((tier) => {
                  const count = quantities[tier.id] || 0;
                  const isExpiredOrSoldOut = tier.status === "expired" || tier.status === "sold_out";
                  const isTierDisabled = isExpiredOrSoldOut || isMaxTicketsReached;
                  const canIncrease = !isTierDisabled && (existingTicketsCount + totalTickets < 2);

                  return (
                    <div
                      key={tier.id}
                      className={`relative rounded-3xl p-5 sm:p-6 transition-all border ${
                        isTierDisabled
                          ? "bg-black/25 border-white/5 opacity-50 cursor-not-allowed select-none"
                          : count > 0
                          ? "bg-zinc-900/80 border-[#dfff28]/60 shadow-[0_10px_30px_rgba(223,255,40,0.08)]"
                          : "bg-black/40 hover:bg-black/60 border-white/15 backdrop-blur-xl"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        {/* Left: Info */}
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={`text-sm sm:text-base font-black tracking-wide ${
                              isTierDisabled ? "text-zinc-500" : "text-white"
                            }`}>
                              {tier.name}
                            </h3>
                            {isExpiredOrSoldOut && (
                              <span className="text-xs font-bold text-zinc-300 tracking-wide">
                                (Finalizada)
                              </span>
                            )}
                          </div>

                          <div className={`text-xl sm:text-2xl font-black font-sans ${
                            isTierDisabled ? "text-zinc-500" : "text-white"
                          }`}>
                            {tier.price} $
                          </div>

                          <div className="flex items-center gap-3 text-xs text-zinc-400 font-medium">
                            <span>{tier.releaseTag}</span>
                            {tier.remainingTables !== undefined && (
                              <span className="text-white font-medium">
                                • Quedan {tier.remainingTables} mesas
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right: Ticket Stub Counter (- [ 0 ] +) Matching Exact Screenshot */}
                        <div className="flex items-center gap-3 shrink-0">
                          {/* Minus Button */}
                          <button
                            type="button"
                            onClick={() => handleDecrease(tier.id)}
                            disabled={count === 0 || isTierDisabled}
                            className={`w-8 h-8 flex items-center justify-center transition-all cursor-pointer ${
                              count > 0 && !isTierDisabled
                                ? "text-white hover:text-[#dfff28] active:scale-90"
                                : "text-zinc-600 cursor-not-allowed opacity-40"
                            }`}
                            aria-label="Disminuir cantidad"
                          >
                            <span className="text-2xl font-black leading-none select-none">—</span>
                          </button>

                          {/* Authentic Ticket Badge with Semicircular Side Cutouts */}
                          <div className={`relative w-11 h-12 flex items-center justify-center shrink-0 ${
                            isTierDisabled ? "opacity-35" : ""
                          }`}>
                            <svg
                              viewBox="0 0 44 48"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              className={`w-full h-full transition-all ${
                                count > 0
                                  ? "text-zinc-700 drop-shadow-[0_2px_10px_rgba(223,255,40,0.25)]"
                                  : "text-zinc-800/90"
                              }`}
                            >
                              <path
                                d="M5 2 C2.2 2 0 4.2 0 7 V17 C3.5 17 6.5 19.8 6.5 24 C6.5 28.2 3.5 31 0 31 V41 C0 43.8 2.2 46 5 46 H39 C41.8 46 44 43.8 44 41 V31 C40.5 31 37.5 28.2 37.5 24 C37.5 19.8 40.5 17 44 17 V7 C44 4.2 41.8 2 39 2 H5 Z"
                                fill="currentColor"
                                stroke={count > 0 ? "rgba(223,255,40,0.4)" : "rgba(255,255,255,0.12)"}
                                strokeWidth="1.5"
                              />
                            </svg>
                            <span
                              className={`absolute inset-0 flex items-center justify-center font-black text-base font-sans select-none ${
                                count > 0 ? "text-white" : "text-zinc-400"
                              }`}
                            >
                              {count}
                            </span>
                          </div>

                          {/* Plus Button */}
                          <button
                            type="button"
                            onClick={() => handleIncrease(tier.id)}
                            disabled={!canIncrease}
                            className={`w-8 h-8 flex items-center justify-center transition-all ${
                              !canIncrease
                                ? "text-zinc-700 cursor-not-allowed opacity-30"
                                : "text-white hover:text-[#dfff28] active:scale-90 cursor-pointer"
                            }`}
                            aria-label="Aumentar cantidad"
                          >
                            <span className="text-2xl font-black leading-none select-none">+</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {/* Promo Code Link (Photo 3 Styling) */}
                <div className="pt-2 pb-1 text-left">
                  <button
                    type="button"
                    onClick={() => setShowPromoModal(true)}
                    disabled={isMaxTicketsReached}
                    className={`text-base sm:text-lg font-black transition-colors text-left inline-flex items-center gap-2 ${
                      isMaxTicketsReached
                        ? "text-zinc-600 opacity-40 cursor-not-allowed select-none"
                        : "text-white hover:text-[#dfff28] cursor-pointer"
                    }`}
                  >
                    <span>¿Tienes un código?</span>
                    {appliedPromo && (
                      <span className="text-xs bg-emerald-500 text-black px-2.5 py-0.5 rounded-full font-bold">
                        -{appliedPromo.discount}$ ({appliedPromo.code})
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Mobile Only Legal Notice below Tiers List (Screenshot 3) */}
              <div className="lg:hidden pt-3">
                <LegalNotice userLoggedIn={userLoggedIn} />
              </div>
            </div>

            {/* Right Column (5 cols): Desktop Sticky Floating White Box + Legal Info */}
            <div className="hidden lg:block lg:col-span-5 space-y-4 lg:sticky lg:top-24">
              {/* Floating White Checkout Box */}
              <div className="w-full bg-white text-black rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4 text-left">
                <div className="space-y-0.5">
                  <div className="text-base sm:text-lg font-black text-black">
                    {totalItemsCount} {totalItemsCount === 1 ? "entrada" : "entradas"}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs sm:text-sm font-bold text-zinc-600">
                      Total – {totalPrice} $
                    </span>
                    {appliedPromo && discountAmount > 0 && (
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                        -{discountAmount}$ Cupón {appliedPromo.code}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowPromoModal(true)}
                    disabled={isMaxTicketsReached}
                    className={`text-xs sm:text-sm font-black transition-colors text-left inline-flex items-center gap-1.5 ${
                      isMaxTicketsReached
                        ? "text-zinc-400 opacity-40 cursor-not-allowed select-none"
                        : "text-black hover:text-zinc-700 cursor-pointer"
                    }`}
                  >
                    <span>¿Tienes un código?</span>
                    {appliedPromo && (
                      <span className="text-[10px] bg-emerald-500 text-black px-2 py-0.5 rounded-full font-bold">
                        -{appliedPromo.discount}$
                      </span>
                    )}
                  </button>
                </div>

                <div className="relative group/finalize-desktop">
                  <button
                    type="button"
                    onClick={handleProceedToPayment}
                    disabled={totalItemsCount === 0 || isMaxTicketsReached}
                    className="w-full py-4 rounded-full bg-[#dfff28] hover:bg-[#d4f522] text-black font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-center"
                  >
                    FINALIZAR COMPRA
                  </button>

                  {/* Desktop Hover Tooltip (clean neutral design without warning colors/icons) */}
                  {isMaxTicketsReached && (
                    <div className="absolute bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2 w-max max-w-[260px] p-2.5 rounded-xl bg-zinc-950/95 border border-white/20 text-zinc-300 text-xs font-normal text-center opacity-0 group-hover/finalize-desktop:opacity-100 transition-opacity duration-200 pointer-events-none shadow-2xl z-50">
                      Has alcanzado el límite máximo de 2 entradas por usuario para este evento.
                    </div>
                  )}
                </div>
              </div>

              {/* Desktop Legal Notice */}
              <LegalNotice userLoggedIn={userLoggedIn} />
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* PASO 2: TRANSFERENCIA BANCARIA Y COMPROBANTE CON OCR / IA    */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {currentStep === "payment" && (
          <form onSubmit={handleSubmitReceipt} className="w-full max-w-2xl mx-auto space-y-6 text-left">
            {/* Order Summary Pill */}
            <div className="p-5 rounded-3xl bg-zinc-900/90 border border-white/15 backdrop-blur-2xl shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Resumen de tu pedido
                </span>
                <span className="text-xs font-black text-[#dfff28] uppercase">
                  {totalItemsCount} {totalItemsCount === 1 ? "Ítem" : "Ítems"}
                </span>
              </div>

              <div className="space-y-2">
                {Object.entries(quantities).map(([id, qty]) => {
                  const t = tiers.find((tier) => tier.id === id);
                  if (!t) return null;
                  return (
                    <div key={id} className="flex justify-between text-xs">
                      <span className="text-zinc-300 font-medium">
                        {qty}x {t.name}
                      </span>
                      <span className="font-black text-white">
                        {t.price * qty} $
                      </span>
                    </div>
                  );
                })}

                {appliedPromo && discountAmount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-400 font-bold pt-1 border-t border-white/5">
                    <span>Descuento ({appliedPromo.code}):</span>
                    <span>-{discountAmount} $</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-baseline pt-3 border-t border-white/10">
                <span className="text-sm font-black text-white">Total a Transferir:</span>
                <span className="text-2xl font-black text-[#dfff28]">{totalPrice} $</span>
              </div>
            </div>

            {/* Select Bank for Transfer (Only Pichincha & Loja) */}
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-wider text-zinc-400 block">
                1. Selecciona la Cuenta Bancaria para Transferir
              </label>

              <div className="grid grid-cols-2 gap-3">
                {BANK_ACCOUNTS.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBankId(b.id)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      selectedBankId === b.id
                        ? "bg-[#dfff28]/10 border-[#dfff28] text-white shadow-lg ring-1 ring-[#dfff28]/30"
                        : "bg-black/40 border-white/10 hover:bg-black/60 text-zinc-400"
                    }`}
                  >
                    <span className="text-sm font-black text-white">{b.bank}</span>
                    <span className="text-xs text-zinc-400 mt-1">{b.type}</span>
                  </button>
                ))}
              </div>

              {/* Selected Bank Details & QR Code Box */}
              <div className="p-5 sm:p-6 rounded-3xl bg-black/60 border border-white/15 backdrop-blur-xl space-y-4 font-sans">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase">Banco</span>
                    <h4 className="text-base font-black text-white">{selectedBank.bank}</h4>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-white/10 font-bold text-zinc-300">
                    {selectedBank.type}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                  {/* Left Column: Account Details */}
                  <div className="sm:col-span-7 space-y-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase block">
                        Número de Cuenta
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-base sm:text-lg font-mono font-black text-white">
                          {selectedBank.accountNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(selectedBank.accountNumber, "acc")}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition cursor-pointer"
                          title="Copiar número"
                        >
                          {copiedBankField === "acc" ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase block">
                        Titular / RUC
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate max-w-[170px]">
                          {selectedBank.holder}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(selectedBank.idNumber, "ruc")}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition cursor-pointer shrink-0"
                          title="Copiar RUC"
                        >
                          {copiedBankField === "ruc" ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs font-mono text-zinc-400">{selectedBank.idNumber}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase block">
                        Correo de Notificación
                      </span>
                      <p className="text-xs font-bold text-zinc-300">{selectedBank.email}</p>
                    </div>
                  </div>

                  {/* Right Column: Official Bank QR Code */}
                  <div className="sm:col-span-5 flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white text-black text-center shadow-xl space-y-2">
                    <div className="relative w-36 h-36 rounded-xl overflow-hidden bg-white p-1">
                      <Image
                        src={selectedBank.qrImage}
                        alt={`QR ${selectedBank.bank}`}
                        fill
                        priority
                        unoptimized
                        sizes="144px"
                        className="object-contain"
                      />
                    </div>
                    <span className="text-[10px] font-black text-zinc-800 leading-tight uppercase">
                      {selectedBank.qrSubtitle}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* User Data Inputs */}
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-wider text-zinc-400 block">
                2. Tus Datos para la Entrada o Reserva
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nombre y Apellido"
                    required
                    className="w-full px-4 py-3.5 rounded-2xl bg-black/50 border border-white/15 text-xs font-bold text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#dfff28]"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Correo (Gmail preferido)"
                    required
                    className="w-full px-4 py-3.5 rounded-2xl bg-black/50 border border-white/15 text-xs font-bold text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#dfff28]"
                  />
                </div>
              </div>
            </div>

            {/* Receipt Upload Box with OCR Verification Protection */}
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-wider text-zinc-400 block">
                3. Sube tu Comprobante de Transferencia
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              />

              {!receiptPreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-8 rounded-3xl border-2 border-dashed border-white/20 hover:border-[#dfff28] bg-black/40 hover:bg-black/60 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer text-center group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/10 group-hover:bg-[#dfff28] group-hover:text-black text-white flex items-center justify-center transition-colors shadow-lg">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-black text-white uppercase tracking-wider">
                      Toca aquí para subir captura o foto
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      Soporta JPG, PNG hasta 5MB. Verificación inteligente anti-fraude.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-3xl overflow-hidden border border-white/20 bg-black/60 p-4 flex items-center gap-4">
                  <div className="relative w-20 h-24 rounded-xl overflow-hidden bg-zinc-900 border border-white/10 shrink-0">
                    <Image
                      src={receiptPreview}
                      alt="Comprobante"
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-xs font-black text-white truncate">
                      {receiptFile?.name || "comprobante.jpg"}
                    </p>
                    <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Imagen cargada correctamente
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11px] font-bold text-zinc-400 hover:text-white underline cursor-pointer"
                    >
                      Cambiar foto
                    </button>
                  </div>
                </div>
              )}

              {uploadError && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>

            {/* Submit Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isUploading}
                className="w-full py-4 rounded-full bg-[#dfff28] hover:bg-[#d4f522] text-black font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{verifyingStatusText || "PROCESANDO PAGO..."}</span>
                  </>
                ) : (
                  <span>ENVIAR COMPROBANTE ({totalPrice} $)</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* PASO 3: CONFIRMACIÓN Y EN ESPERA DE VERIFICACIÓN               */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {currentStep === "confirmed" && (
          <div className="w-full max-w-2xl mx-auto p-8 sm:p-10 rounded-3xl bg-zinc-900/90 border border-zinc-800 backdrop-blur-2xl shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-zinc-800 border border-zinc-700 text-white flex items-center justify-center shadow-lg">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                ¡Solicitud de Entrada Registrada!
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 font-medium leading-relaxed max-w-md mx-auto">
                Tu comprobante ha sido recibido. El organizador verificará el depósito en su
                cuenta bancaria para liberar tu código QR oficial.
              </p>
            </div>

            {/* Request Card in Step 3 */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-left space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-white truncate">{event.title}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] font-bold uppercase">
                  <span>Esperando Verificación</span>
                </span>
              </div>

              <div className="space-y-1 text-xs text-zinc-400">
                <p className="text-white font-bold">{customerName} • {customerEmail}</p>
                <p>Total transferido: <span className="font-black text-white">${totalPrice} USD</span></p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.location.href = "/cuenta?tab=tickets";
                  }
                }}
                className="flex-1 py-3.5 rounded-full bg-white hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-widest transition cursor-pointer shadow-xl"
              >
                Ver en Mi Cuenta →
              </button>

              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Cerrar y Volver al Evento
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── TICKET PASS CINEMATIC MODAL ─── */}
      <TicketPassModal
        isOpen={!!viewingTicketQr}
        onClose={() => setViewingTicketQr(null)}
        ticket={
          viewingTicketQr && event
            ? {
                ...viewingTicketQr,
                eventTitle: viewingTicketQr.eventTitle || event.title,
                venue: viewingTicketQr.venue || event.venue,
                dateLabel: event.dateLabel || event.startsAt,
                time: event.time || "22:00 PM",
                poster: event.poster,
              }
            : null
        }
      />

      {/* ─── MOBILE FIXED BOTTOM CHECKOUT BAR (SCREENSHOT 3 EXACT MATCH) ─── */}
      {currentStep === "select" && (
        <div className="fixed bottom-0 inset-x-0 z-[530] bg-white text-black p-4 sm:p-5 pb-safe flex flex-col gap-2 shadow-[0_-15px_40px_rgba(0,0,0,0.7)] lg:hidden rounded-t-3xl border-t border-zinc-200">
          <div className="flex items-center justify-between">
            <div className="flex flex-col text-left">
              <span className="text-sm font-black tracking-tight text-black">
                {totalItemsCount} {totalItemsCount === 1 ? "entrada" : "entradas"}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-zinc-600">
                  Total – {totalPrice} $
                </span>
                {appliedPromo && discountAmount > 0 && (
                  <span className="text-[10px] font-bold text-emerald-600">
                    (-{discountAmount}$)
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleProceedToPayment}
              disabled={totalItemsCount === 0 || isMaxTicketsReached}
              className="px-8 py-3.5 rounded-full bg-[#dfff28] hover:bg-[#d4f522] text-black font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-center"
            >
              FINALIZAR COMPRA
            </button>
          </div>

          {isMaxTicketsReached && (
            <p className="text-[11px] text-zinc-500 font-medium text-center">
              Has alcanzado el límite máximo de 2 entradas por usuario para este evento.
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}
