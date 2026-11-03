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
  Search,
  User,
  Plus,
  ChevronRight,
  LogOut,
} from "lucide-react";
import type { Event } from "@/frontend/types/domain";
import { getHdImageSrc, DEFAULT_HD_EVENT_POSTER } from "@/frontend/utils/hdImages";
import TicketPassModal from "@/frontend/components/TicketPassModal";
import TransferPaymentPanel from "@/frontend/components/TransferPaymentPanel";
import { validateReceiptFileMetadata } from "@/lib/access-drop/fileValidation";
import TurnstileWidget from "@/frontend/components/TurnstileWidget";

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
  onOpenDashboard?: () => void;
  onLogout?: () => void;
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
            <a
              href="/terms_and_conditions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white font-bold underline hover:text-zinc-200 transition-colors"
            >
              Condiciones de Uso
            </a>{" "}
            generales, la{" "}
            <a
              href="/privacy_policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white font-bold underline hover:text-zinc-200 transition-colors"
            >
              Política de Privacidad
            </a>{" "}
            y las{" "}
            <a
              href="/ticket_reservation_terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white font-bold underline hover:text-zinc-200 transition-colors"
            >
              Condiciones de Compra
            </a>{" "}
            de entradas. Procesamos tus datos personales de acuerdo con nuestra{" "}
            <a
              href="/privacy_policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white font-bold underline hover:text-zinc-200 transition-colors"
            >
              Política de Privacidad
            </a>
            .
          </>
        ) : (
          <>
            Comprando esta entrada, abrirás una cuenta y aceptarás nuestras{" "}
            <a
              href="/terms_and_conditions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white font-bold underline hover:text-zinc-200 transition-colors"
            >
              Condiciones de Uso
            </a>{" "}
            generales, la{" "}
            <a
              href="/privacy_policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white font-bold underline hover:text-zinc-200 transition-colors"
            >
              Política de Privacidad
            </a>{" "}
            y las{" "}
            <a
              href="/ticket_reservation_terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white font-bold underline hover:text-zinc-200 transition-colors"
            >
              Condiciones de Compra
            </a>{" "}
            de entradas. Procesamos tus datos personales de acuerdo con nuestra{" "}
            <a
              href="/privacy_policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white font-bold underline hover:text-zinc-200 transition-colors"
            >
              Política de Privacidad
            </a>
            .
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
  onOpenDashboard,
  onLogout,
}: EventPurchaseCheckoutModalProps) {
  // Steps: "select" (Paso 1: Entradas/Mesas) -> "payment" (Paso 2: Transferencia y Comprobante) -> "confirmed" (Paso 3: En espera de acreditación)
  const [currentStep, setCurrentStep] = useState<"select" | "payment" | "confirmed">("select");
  const [showCheckoutUserMenu, setShowCheckoutUserMenu] = useState(false);

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
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);

  // Receipt upload state
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState("");
  const [copiedBankField, setCopiedBankField] = useState<string | null>(null);
  const [verifyingStatusText, setVerifyingStatusText] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);

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
      setSelectedBankId(null);
      setTurnstileToken("");
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

      if (userLoggedIn && userProfile?.email && event) {
        const fetchUserEventTickets = async () => {
          try {
            const cleanUserEmail = userProfile.email.toLowerCase().trim();
            const res = await fetch(`/api/access-drop/receipts?email=${encodeURIComponent(cleanUserEmail)}`).catch(() => null);
            let serverTickets: any[] = [];
            if (res && res.ok) {
              const data = await res.json().catch(() => ({}));
              if (data.receipts && Array.isArray(data.receipts)) {
                serverTickets = data.receipts
                  .filter((r: any) => {
                    const eId = (r.eventId || "").toLowerCase();
                    const eTitle = (r.eventTitle || "").toLowerCase();
                    const targetId = (event.id || "").toLowerCase();
                    const targetTitle = (event.title || "").toLowerCase();
                    return (targetId && (eId === targetId || eId.includes(targetId))) ||
                           (targetTitle && (eTitle === targetTitle || eTitle.includes(targetTitle)));
                  })
                  .map((r: any) => ({
                    id: r.id,
                    eventId: r.eventId || event.id,
                    eventTitle: r.eventTitle || event.title,
                    userEmail: r.email,
                    quantity: r.quantity || 1,
                    totalAmount: r.totalAmount || 10,
                    status: r.status === "aprobado" ? "confirmed" : r.status === "rechazado" ? "rejected" : "en_verificacion",
                    referenceNumber: r.referenceNumber,
                    tierName: "Acceso General",
                    serialNumber: r.serialNumber,
                    qrCode: r.qrPayload || `4GO-${r.serialNumber || r.id}`,
                  }));
              }
            }

            const stored = typeof window !== "undefined" ? localStorage.getItem("nenez_purchased_tickets") : null;
            let localTickets: any[] = [];
            if (stored) {
              const parsed = JSON.parse(stored);
              if (Array.isArray(parsed)) {
                localTickets = parsed.filter(
                  (t: any) =>
                    (t.eventId === event.id || t.eventTitle === event.title) &&
                    (!t.userEmail || t.userEmail.toLowerCase() === cleanUserEmail)
                );
              }
            }

            const merged = [...serverTickets];
            localTickets.forEach((lt) => {
              if (!merged.some((m) => m.id === lt.id || (m.referenceNumber && m.referenceNumber === lt.referenceNumber))) {
                merged.push(lt);
              }
            });

            const individualPasses: any[] = [];
            merged.forEach((item: any) => {
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
          } catch (err) {
            console.error("Error loading user existing tickets:", err);
          }
        };

        fetchUserEventTickets();
      } else {
        setUserExistingEventTickets([]);
      }
    }
  }, [isOpen, userLoggedIn, userProfile, event]);

  useEffect(() => {
    return () => { if (receiptPreview) URL.revokeObjectURL(receiptPreview); };
  }, [receiptPreview]);

  if (!isOpen || !event) return null;

  const basePrice = event.price ?? 10;

  // Compute clean tiers based on the event's actual presales or standard single tier
  const tiers: PurchaseTier[] = (() => {
    if (event?.presales && Array.isArray(event.presales) && event.presales.length > 0) {
      return (event.presales as any[]).map((p: any, idx: number) => {
        let tag = "Fase actual";
        if (p.duration === "1_semana") tag = "Dura 1 Semana (7 días)";
        else if (p.duration === "2_semanas") tag = "Dura 2 Semanas";
        else if (p.duration === "3_dias") tag = "Dura 3 Días";
        else if (p.duration === "hasta_evento") tag = "Hasta el día del evento";
        else if (p.duration === "aforo") tag = "Hasta agotar aforo";
        else if (p.customEndDate) tag = `Hasta ${p.customEndDate}`;
        else if (idx === 0) tag = "Fase actual · Acceso General";
        else tag = `Fase ${idx + 1}`;

        const rawName = p.name || `Preventa ${idx + 1}`;
        const cleanName = rawName.toUpperCase().startsWith("GA") || rawName.toUpperCase().startsWith("VIP")
          ? rawName
          : `GA - ${rawName}`;

        return {
          id: `presale-${p.id || idx}`,
          name: cleanName,
          price: Number.isFinite(Number(p.price)) ? Number(p.price) : basePrice,
          releaseTag: tag,
          type: "ticket",
          status: "active",
        };
      });
    }

    return [
      {
        id: "ga-preventa-1",
        name: "GA - Preventa 1 (Acceso General)",
        price: basePrice,
        releaseTag: "Fase actual · Acceso General",
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

  const MAX_TICKETS_PER_EVENT = 3;

  const existingTicketsCount = userLoggedIn
    ? userExistingEventTickets.filter(
        (t: any) => t.status !== "rejected" && t.status !== "rechazado"
      ).length
    : 0;
  const isMaxTicketsReached = userLoggedIn && existingTicketsCount >= MAX_TICKETS_PER_EVENT;

  const handleIncrease = (tierId: string) => {
    if (existingTicketsCount + totalTickets >= MAX_TICKETS_PER_EVENT) return;
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

    // Check stored discount codes from admin
    let customCodes: any[] = [];
    try {
      const raw = localStorage.getItem("4go_discount_codes");
      if (raw) customCodes = JSON.parse(raw);
    } catch {}

    const matched = customCodes.find((c: any) => c.code?.toUpperCase() === cleaned);
    if (matched) {
      if (matched.active === false) {
        setPromoError("Este código de descuento está pausado o inactivo.");
        return;
      }

      // Check if code is global or specific to this event
      const isGlobal = !matched.eventId || matched.eventId === "all";
      const matchesThisEvent =
        isGlobal ||
        matched.eventId === event.id ||
        ((event as any).slug && matched.eventId === (event as any).slug) ||
        (matched.eventTitle && event.title && matched.eventTitle.trim().toLowerCase() === event.title.trim().toLowerCase());

      if (!matchesThisEvent) {
        setPromoError(
          `Este código solo es válido para "${matched.eventTitle || "otro evento"}" y no aplica a este evento.`
        );
        return;
      }

      const disc = Number(matched.discount) || 2;
      setAppliedPromo({ code: cleaned, discount: disc });
      setPromoSuccess(`¡Código ${cleaned} aplicado! Descuento de $${disc}.00 USD`);
      setTimeout(() => setShowPromoModal(false), 900);
      return;
    }

    if (cleaned === "4GO" || cleaned === "VIP" || cleaned === "LOJA" || cleaned === "DESCUENTO" || cleaned === "PARTY") {
      setAppliedPromo({ code: cleaned, discount: 5 });
      setPromoSuccess("¡Código aplicado con éxito! Descuento de $5.00 USD");
      setTimeout(() => setShowPromoModal(false), 900);
    } else if (cleaned.length >= 3) {
      setAppliedPromo({ code: cleaned, discount: 2 });
      setPromoSuccess(`¡Código ${cleaned} de organizador aplicado! Descuento de $2.00 USD`);
      setTimeout(() => setShowPromoModal(false), 900);
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

    const validationError = validateReceiptFileMetadata(file);
    if (validationError) {
      setReceiptFile(null);
      setReceiptPreview(null);
      setUploadError(validationError.message);
      return;
    }

    setReceiptFile(file);
    const url = URL.createObjectURL(file);
    setReceiptPreview(url);
  };

  const handleCopyText = async (text: string, fieldKey: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedBankField(fieldKey);
      setTimeout(() => setCopiedBankField(null), 2000);
    } catch {
      setUploadError("No pudimos copiar el dato. Puedes seleccionarlo y copiarlo manualmente.");
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

    if (isUploading) return;
    if (!selectedBankId) {
      setUploadError("Selecciona Deuna o Ahorita para continuar.");
      return;
    }

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
      formData.append("cf-turnstile-response", turnstileToken);

      const res = await fetch("/api/access-drop/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setTurnstileToken("");
        setTurnstileResetKey((key) => key + 1);
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      data-checkout-step={currentStep}
      className={`fixed inset-0 z-[950] flex flex-col overflow-y-auto ${currentStep === "payment" ? "bg-[#faf8f5] text-zinc-900" : "bg-black text-white"}`}
    >
      {/* ─── AMBIENT POSTER COLOR BLUR (AUTHENTIC GRADIENT FADE TO DEEP BLACK) ─── */}
      <div className={`fixed inset-0 z-0 pointer-events-none overflow-hidden bg-black transform-gpu ${currentStep === "payment" ? "hidden" : ""}`}>
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
      <header className="fixed top-0 inset-x-0 z-[550] flex items-center justify-between px-4 sm:px-8 py-4 bg-gradient-to-b from-[#0c0714]/95 via-[#0c0714]/70 to-transparent pointer-events-auto">
        {/* Left: Circular Back Arrow Button with Hover Tooltip */}
        <div className="relative group flex items-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
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
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-3 text-xs sm:text-sm font-semibold tracking-normal text-zinc-400">
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
        <div className="flex flex-row items-center gap-2 sm:gap-2.5 shrink-0 relative">
          {/* + Crear Glass Pill Button (Left) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenCreate?.();
            }}
            className="h-10 px-3.5 sm:px-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-xl flex items-center gap-1.5 text-white font-bold text-xs sm:text-sm shadow-lg cursor-pointer transition-all active:scale-95 whitespace-nowrap shrink-0"
            aria-label="Crear Evento"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Crear</span>
          </button>

          {/* Search Button with Hover Preview (Middle) */}
          <div className="relative group flex items-center justify-center">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenSearch?.();
              }}
              className="w-10 h-10 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 text-white backdrop-blur-xl flex items-center justify-center shadow-lg cursor-pointer transition-all active:scale-95 shrink-0"
              aria-label="Buscar"
            >
              <Search className="w-5 h-5 text-white" />
            </button>

            {/* Hover Tooltip: Buscar */}
            <div className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-zinc-950/90 border border-white/20 text-white text-[11px] font-bold uppercase tracking-wider backdrop-blur-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 -translate-y-1 group-hover:translate-y-0 whitespace-nowrap z-50">
              Buscar
            </div>
          </div>

          {/* Profile Button with Dropdown (Far Right) */}
          <div className="relative flex items-center justify-center">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!userLoggedIn) {
                  onOpenAuth?.();
                } else {
                  setShowCheckoutUserMenu((prev) => !prev);
                }
              }}
              className="w-10 h-10 rounded-full bg-zinc-800/90 border border-white/20 backdrop-blur-xl flex items-center justify-center text-white hover:bg-zinc-700/90 shadow-lg cursor-pointer transition-all active:scale-95 overflow-hidden relative shrink-0"
              aria-label="Perfil"
            >
              <User className="w-5 h-5 text-white" />
            </button>

            {/* Hover Tooltip: Perfil (only when menu closed) */}
            {!showCheckoutUserMenu && (
              <div className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-zinc-950/90 border border-white/20 text-white text-[11px] font-bold uppercase tracking-wider backdrop-blur-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 -translate-y-1 group-hover:translate-y-0 whitespace-nowrap z-50">
                Perfil
              </div>
            )}

            {/* User Dropdown Menu */}
            <AnimatePresence>
              {showCheckoutUserMenu && userLoggedIn && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm cursor-default"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCheckoutUserMenu(false);
                    }}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-[calc(100%+12px)] w-72 sm:w-80 rounded-[28px] bg-zinc-950/95 border border-white/20 backdrop-blur-3xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] p-4 z-50 text-white font-sans space-y-3"
                  >
                    {/* User Header */}
                    <div className="px-1.5 py-1 flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-zinc-800 border border-white/20 shrink-0 flex items-center justify-center shadow-inner">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-black uppercase text-white truncate">
                            {userProfile?.email?.trim().toLowerCase() === "brandon.medina@unl.edu.ec" ? "Brandon Medina" : (userProfile?.name || "Usuario")}
                          </p>
                        </div>
                        <p className="text-[11px] text-zinc-400 font-medium truncate">{userProfile?.email}</p>
                        <span className="inline-block mt-1 px-2.5 py-0.5 rounded-md text-[9.5px] font-black uppercase tracking-wider bg-white/10 text-white border border-white/20">
                          {userProfile?.email?.trim().toLowerCase() === "brandon.medina@unl.edu.ec" ? "Master Superadmin" : "Usuario"}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 font-sans">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCheckoutUserMenu(false);
                          onOpenDashboard?.();
                        }}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.10] border border-white/10 hover:border-white/20 text-white transition-all active:scale-[0.98] cursor-pointer text-xs font-bold uppercase tracking-wider"
                      >
                        <span>Mi Perfil & Dashboard</span>
                        <ChevronRight className="w-4 h-4 text-zinc-400" />
                      </button>

                      {userProfile?.email?.trim().toLowerCase() === "brandon.medina@unl.edu.ec" && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowCheckoutUserMenu(false);
                            onOpenCreate?.();
                          }}
                          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.10] border border-white/10 hover:border-white/20 text-white transition-all active:scale-[0.98] cursor-pointer text-xs font-bold uppercase tracking-wider"
                        >
                          <span>Publicar Evento</span>
                          <ChevronRight className="w-4 h-4 text-zinc-400" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setShowCheckoutUserMenu(false);
                          onLogout?.();
                        }}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-all active:scale-[0.98] cursor-pointer text-xs font-bold uppercase tracking-wider mt-1"
                      >
                        <span>Cerrar Sesión</span>
                        <LogOut className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
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
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  Código de Descuento
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPromoModal(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                Ingresa el código proporcionado por el organizador para obtener tu descuento oficial.
              </p>

              <form onSubmit={handleApplyPromo} className="space-y-3">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  placeholder="EJ. 4GO, VIP, LOJA"
                  className="w-full px-4 py-3 rounded-2xl bg-black/60 border border-white/20 text-xs font-black uppercase tracking-widest text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/50 transition"
                  autoFocus
                />

                {promoError && (
                  <p className="text-xs text-rose-400 font-bold">{promoError}</p>
                )}
                {promoSuccess && (
                  <p className="text-xs text-white font-bold bg-white/10 p-2.5 rounded-xl border border-white/20 text-center">{promoSuccess}</p>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-full bg-white hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-widest transition cursor-pointer shadow-lg active:scale-95"
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
        <div className={`${currentStep === "payment" ? "hidden" : "md:hidden flex"} items-center justify-center gap-2 text-xs font-semibold tracking-normal text-zinc-400 pb-1`}>
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
                    {userExistingEventTickets.map((tkt, idx) => {
                      const isConfirmed = tkt.status === "confirmed" || tkt.status === "aprobado";
                      const isRejected = tkt.status === "rejected" || tkt.status === "rechazado";

                      return (
                        <div
                          key={tkt.id || `exist-tkt-${idx}`}
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
                {tiers.map((tier, idx) => {
                  const count = quantities[tier.id] || 0;
                  const isExpiredOrSoldOut = tier.status === "expired" || tier.status === "sold_out";
                  const isTierDisabled = isExpiredOrSoldOut || isMaxTicketsReached;
                  const canIncrease = !isTierDisabled && (existingTicketsCount + totalTickets < MAX_TICKETS_PER_EVENT);

                  return (
                    <div
                      key={tier.id || `tier-${idx}`}
                      className={`relative rounded-3xl p-5 sm:p-6 transition-all border ${
                        isTierDisabled
                          ? "bg-black/25 border-white/5 opacity-50 cursor-not-allowed select-none"
                          : count > 0
                          ? "bg-zinc-900/90 border-white/40 shadow-[0_10px_30px_rgba(255,255,255,0.06)] ring-1 ring-white/20"
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
                                ? "text-white hover:text-zinc-300 active:scale-90"
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
                                  ? "text-zinc-700 drop-shadow-[0_2px_10px_rgba(255,255,255,0.15)]"
                                  : "text-zinc-800/90"
                              }`}
                            >
                              <path
                                d="M5 2 C2.2 2 0 4.2 0 7 V17 C3.5 17 6.5 19.8 6.5 24 C6.5 28.2 3.5 31 0 31 V41 C0 43.8 2.2 46 5 46 H39 C41.8 46 44 43.8 44 41 V31 C40.5 31 37.5 28.2 37.5 24 C37.5 19.8 40.5 17 44 17 V7 C44 4.2 41.8 2 39 2 H5 Z"
                                fill="currentColor"
                                stroke={count > 0 ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.12)"}
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
                                : "text-white hover:text-zinc-300 active:scale-90 cursor-pointer"
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
                {/* Promo Code Link (Clean Minimal Styling) */}
                <div className="pt-2 pb-1 text-left">
                  <button
                    type="button"
                    onClick={() => setShowPromoModal(true)}
                    disabled={isMaxTicketsReached}
                    className={`text-base sm:text-lg font-black transition-colors text-left inline-flex items-center gap-2 ${
                      isMaxTicketsReached
                        ? "text-zinc-600 opacity-40 cursor-not-allowed select-none"
                        : "text-white hover:text-zinc-300 cursor-pointer"
                    }`}
                  >
                    <span>¿Tienes un código?</span>
                    {appliedPromo && (
                      <span className="text-xs bg-white text-black px-2.5 py-0.5 rounded-full font-bold">
                        -{appliedPromo.discount}$
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
                      <span className="text-[11px] font-bold text-black bg-zinc-100 px-2 py-0.5 rounded-full">
                        -{discountAmount}$
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
                      <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-full font-bold">
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
                    className="w-full py-4 rounded-full bg-black hover:bg-zinc-800 text-white font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-center"
                  >
                    FINALIZAR COMPRA
                  </button>

                  {/* Desktop Hover Tooltip (clean neutral design without warning colors/icons) */}
                  {isMaxTicketsReached && (
                    <div className="absolute bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2 w-max max-w-[260px] p-2.5 rounded-xl bg-zinc-950/95 border border-white/20 text-zinc-300 text-xs font-normal text-center opacity-0 group-hover/finalize-desktop:opacity-100 transition-opacity duration-200 pointer-events-none shadow-2xl z-50">
                      Has alcanzado el límite máximo de 3 entradas por usuario para este evento.
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
          <form onSubmit={handleSubmitReceipt} className="mx-auto w-full max-w-xl space-y-6 pb-6 text-left">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-700">4go · Compra tu entrada</p>
                <h2 className="text-3xl font-semibold tracking-tight text-[#180d2b]">Pago</h2>
              </div>
              <span className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-500">2 de 3</span>
            </div>
            <div className="flex items-center gap-3 rounded-full bg-[#180d2b] px-5 py-3.5 text-xs text-white shadow-sm">
              <ShieldCheck className="h-5 w-5 shrink-0 text-[#dfff70]" />
              <span>Deuna o Ahorita. <strong className="text-[#dfff70]">El total que ves es el que pagas.</strong></span>
            </div>

            <TransferPaymentPanel accounts={BANK_ACCOUNTS} selectedId={selectedBankId} onSelect={(id) => { setSelectedBankId(id); setUploadError(""); }} total={totalPrice} copiedField={copiedBankField} onCopy={handleCopyText} busy={isUploading}>
              <fieldset disabled={isUploading} className="space-y-4">
                <legend className="mb-3 text-xs font-bold uppercase tracking-wider text-white">Tus datos para la entrada</legend>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="space-y-1.5 text-xs text-[#d3c6e3] sm:col-span-2">
                    <span>Nombre y apellido</span>
                    <input type="text" autoComplete="name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-[#dfff70]" />
                  </label>
                  <label className="space-y-1.5 text-xs text-[#d3c6e3]">
                    <span>Correo electrónico</span>
                    <input type="email" autoComplete="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} required className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-[#dfff70]" />
                  </label>
                  <label className="space-y-1.5 text-xs text-[#d3c6e3]">
                    <span>Celular / WhatsApp</span>
                    <input type="tel" autoComplete="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="09xxxxxxxx" required className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-[#dfff70]" />
                  </label>
                </div>
                <div className="space-y-3 pt-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-white">Subir comprobante (foto o captura)</p>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" className="hidden" aria-label="Seleccionar comprobante de pago" onChange={(e) => handleFileChange(e.target.files?.[0] || null)} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (!isUploading) handleFileChange(e.dataTransfer.files?.[0] || null); }} className="flex min-h-44 w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#dfff70]/60 bg-white/[0.04] p-5 text-center transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#dfff70]">
                    {receiptPreview ? <Image src={receiptPreview} alt="Vista previa del comprobante" width={180} height={130} unoptimized className="max-h-36 w-auto rounded-lg object-contain" /> : <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#dfff70] text-[#180d2b]"><Upload className="h-5 w-5" /></span>}
                    <span className="max-w-full break-all text-sm font-bold text-white">{receiptFile ? receiptFile.name : "Subir comprobante (foto o captura)"}</span>
                    <span className="text-xs text-[#d3c6e3]">{receiptFile ? "Toca para cambiar la imagen" : "Toca o arrastra tu imagen · JPG o PNG · Hasta 5 MB"}</span>
                  </button>
                  <p className="text-xs leading-relaxed text-[#d3c6e3]">{receiptFile ? "Imagen lista para enviar. Verificaremos que sea un comprobante válido." : "Sube tu comprobante para continuar."}</p>
                </div>
                <TurnstileWidget action="ticket_upload" variant="visible" resetKey={turnstileResetKey} onVerify={setTurnstileToken} onExpire={() => setTurnstileToken("")} onError={() => setTurnstileToken("")} />
                {uploadError && <p role="alert" className="rounded-xl border border-rose-300/30 bg-rose-400/10 px-4 py-3 text-xs leading-relaxed text-rose-200">{uploadError}</p>}
                <button type="submit" disabled={isUploading || !receiptFile || (process.env.NODE_ENV === "production" && !turnstileToken)} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#dfff70] px-5 py-3 text-xs font-black uppercase tracking-widest text-[#180d2b] transition-colors hover:bg-[#e9ff9f] disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/40">
                  {isUploading ? <><RefreshCw className="h-4 w-4 animate-spin" /><span>{verifyingStatusText || "Verificando comprobante..."}</span></> : "Enviar comprobante"}
                </button>
              </fieldset>
            </TransferPaymentPanel>

            <section className="space-y-4 pt-2 text-zinc-800" aria-label="Resumen del pedido">
              <div>
                <p className="flex items-center gap-2 text-xs font-bold text-violet-700"><span className="h-2 w-2 rounded-full bg-violet-500" />Tu pedido en 4go</p>
                <h3 className="mt-2 text-base font-bold">{event.title}</h3>
                <p className="mt-1 text-xs text-zinc-500">{event.organizer || "Organizador del evento"} · {event.city || "Loja"}</p>
              </div>
              <div className="space-y-2 border-b border-zinc-200 pb-4 text-sm">
                {Object.entries(quantities).map(([id, qty]) => {
                  const tier = tiers.find((item) => item.id === id);
                  return tier ? <div key={id} className="flex justify-between gap-4"><span>{qty} × {tier.name}</span><span className="shrink-0 tabular-nums">{new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" }).format(tier.price * qty)}</span></div> : null;
                })}
                {discountAmount > 0 && <div className="flex justify-between text-violet-700"><span>Descuento</span><span>−${discountAmount.toFixed(2)}</span></div>}
                <div className="flex justify-between text-xs text-zinc-500"><span>Recargo por pago</span><span>$0,00</span></div>
              </div>
              <div className="flex items-baseline justify-between gap-4"><span className="text-sm font-bold">Total</span><strong className="text-4xl font-medium tracking-tight text-[#180d2b]">{new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" }).format(totalPrice)}</strong></div>
              <a href={`https://wa.me/593988831372?text=${encodeURIComponent(`Hola 4go, necesito ayuda con el pago de ${event.title}.`)}`} target="_blank" rel="noopener noreferrer" className="inline-block min-h-10 text-xs font-medium text-[#180d2b] underline underline-offset-4">¿Problemas con el pago? Escríbenos por WhatsApp →</a>
              <button type="button" disabled={isUploading} onClick={onClose} className="block min-h-10 text-sm text-zinc-600 underline underline-offset-4 disabled:opacity-40">Cancelar y volver al evento</button>
            </section>
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
                  <span className="text-[10px] font-bold text-black bg-zinc-100 px-2 py-0.5 rounded-full">
                    (-{discountAmount}$)
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleProceedToPayment}
              disabled={totalItemsCount === 0 || isMaxTicketsReached}
              className="px-8 py-3.5 rounded-full bg-black hover:bg-zinc-800 text-white font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-center"
            >
              FINALIZAR COMPRA
            </button>
          </div>

          {isMaxTicketsReached && (
            <p className="text-[11px] text-zinc-500 font-medium text-center">
              Has alcanzado el límite máximo de 3 entradas por usuario para este evento.
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}
