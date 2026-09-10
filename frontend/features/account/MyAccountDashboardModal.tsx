"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  X,
  User,
  Calendar,
  Ticket,
  Heart,
  CreditCard,
  Building2,
  CheckCircle2,
  Clock,
  QrCode,
  Edit3,
  ChevronRight,
  ShieldCheck,
  MapPin,
  Lock,
  Check,
  RefreshCw,
  DollarSign,
  Users,
  TrendingUp,
  Plus,
  FileText,
  Eye,
  Sparkles,
  ArrowLeft,
  MessageCircle,
  Copy,
  FileX,
  ZoomIn,
  Send,
  Crown,
  Search,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import type { Event } from "@/frontend/types/domain";
import TicketPassModal from "@/frontend/components/TicketPassModal";

function getReceiptBankName(r: any): string {
  if (!r) return "Ahorita (Banco de Loja)";
  
  // 1. If detected in OCR
  const ocrBank = r.ocrResult?.detectedBank || r.detectedBank;
  if (ocrBank && typeof ocrBank === "string" && ocrBank.trim()) {
    const bLower = ocrBank.toLowerCase();
    if (bLower.includes("ahorita") || bLower.includes("loja")) return "Ahorita (Banco de Loja)";
    if (bLower.includes("deuna") || bLower.includes("pichincha")) return "Deuna (Banco Pichincha)";
    if (bLower.includes("guayaquil")) return "Banco Guayaquil";
    if (bLower.includes("produbanco")) return "Produbanco";
    if (bLower.includes("austro")) return "Banco del Austro";
    if (bLower.includes("pacifico")) return "Banco del Pacífico";
    return ocrBank;
  }

  // 2. From OCR extracted text scan
  const text = (r.ocrResult?.extractedText || r.extractedText || "").toLowerCase();
  if (text.includes("ahorita") || text.includes("banco de loja") || text.includes("banco loja") || text.includes("loja")) return "Ahorita (Banco de Loja)";
  if (text.includes("deuna") || text.includes("pichincha")) return "Deuna (Banco Pichincha)";
  if (text.includes("guayaquil")) return "Banco Guayaquil";
  if (text.includes("produbanco") || text.includes("be produbanco")) return "Produbanco";
  if (text.includes("austro")) return "Banco del Austro";
  if (text.includes("pacifico")) return "Banco del Pacífico";

  // 3. From payment method
  const method = (r.paymentMethod || "").toLowerCase();
  if (method.includes("ahorita") || method.includes("loja")) return "Ahorita (Banco de Loja)";
  if (method.includes("deuna") || method.includes("pichincha")) return "Deuna (Banco Pichincha)";
  if (method.includes("guayaquil")) return "Banco Guayaquil";
  if (method.includes("produbanco")) return "Produbanco";

  // 4. From matched profile
  const profile = (r.ocrResult?.matchedProfile || "").toLowerCase();
  if (profile.includes("ahorita") || profile.includes("loja")) return "Ahorita (Banco de Loja)";
  if (profile.includes("deuna") || profile.includes("pichincha")) return "Deuna (Banco Pichincha)";

  // 5. From direct bank field
  if (r.bank && typeof r.bank === "string" && r.bank.trim()) {
    const bLower = r.bank.toLowerCase();
    if (bLower.includes("ahorita") || bLower.includes("loja")) return "Ahorita (Banco de Loja)";
    if (bLower.includes("deuna") || bLower.includes("pichincha")) return "Deuna (Banco Pichincha)";
    return r.bank;
  }
  
  return "Ahorita (Banco de Loja)";
}

export interface MyAccountDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    type?: string;
    venueName?: string;
    city?: string;
    instagram?: string;
    address?: string;
    openingDays?: string[];
    hasCompletedOnboarding?: boolean;
  } | null;
  onUpdateProfile: (updated: any) => void;
  allEvents: Event[];
  onOpenEventDetail?: (event: Event) => void;
  onStartCreateEvent?: () => void;
  initialTab?: "master_receivables" | "master_roles" | "events" | "tickets" | "reservations" | "favorites" | "partner_profile" | "payouts";
}

export default function MyAccountDashboardModal({
  isOpen,
  onClose,
  userProfile,
  onUpdateProfile,
  allEvents = [],
  onOpenEventDetail,
  onStartCreateEvent,
  initialTab,
}: MyAccountDashboardModalProps) {
  const isMasterUser = Boolean(
    userProfile &&
    (userProfile.type === "Master Admin" ||
     userProfile.type === "master" ||
     userProfile.email?.toLowerCase().trim() === "brandon.medina@unl.edu.ec" ||
     userProfile.email?.toLowerCase().trim() === "master@4go.live")
  );

  const [activeTab, setActiveTab] = useState<
    "master_receivables" | "master_roles" | "events" | "tickets" | "reservations" | "favorites" | "partner_profile" | "payouts"
  >(initialTab || (isMasterUser ? "master_receivables" : "events"));

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
      setManagingEvent(null);
    }
  }, [initialTab]);

  // Real events created by this user
  const [myCreatedEvents, setMyCreatedEvents] = useState<any[]>([]);
  const [managingEvent, setManagingEvent] = useState<Event | null>(null);
  const [configuringEvent, setConfiguringEvent] = useState<Event | null>(null);
  const [editEventForm, setEditEventForm] = useState<Partial<Event> | null>(null);
  const [receiptsList, setReceiptsList] = useState<any[]>([]);
  const [loadingReceipts, setLoadingReceipts] = useState(false);
  const [receiptActionMessage, setReceiptActionMessage] = useState<string | null>(null);

  // Partner Profile Edit state
  const [editBrandName, setEditBrandName] = useState(userProfile?.venueName || userProfile?.name || "");
  const [editBrandLogo, setEditBrandLogo] = useState(userProfile?.avatar || "");
  const [editInstagram, setEditInstagram] = useState(userProfile?.instagram?.replace(/^@/, "") || "");
  const [editType, setEditType] = useState(userProfile?.type || "Discoteca / Club");
  const [editAddress, setEditAddress] = useState(userProfile?.address || "");
  const [editDays, setEditDays] = useState<string[]>(userProfile?.openingDays || ["Jueves", "Viernes", "Sábado"]);
  const [isSavingPartner, setIsSavingPartner] = useState(false);
  const [partnerSaveSuccess, setPartnerSaveSuccess] = useState(false);

  // Master Dashboard Data & Role Requests
  const [masterPayouts, setMasterPayouts] = useState<any[]>([]);
  const [masterRoleRequests, setMasterRoleRequests] = useState<any[]>([]);
  const [loadingMasterData, setLoadingMasterData] = useState(false);
  const [masterStatusFilter, setMasterStatusFilter] = useState<string>("todos");
  const [masterSearchQuery, setMasterSearchQuery] = useState<string>("");
  const [masterToast, setMasterToast] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Clean Discoteca Role Request State (No extra photo modals)
  const [hasPendingRoleRequest, setHasPendingRoleRequest] = useState(false);
  const [isSubmittingRoleReq, setIsSubmittingRoleReq] = useState(false);
  const [roleReqSuccess, setRoleReqSuccess] = useState(false);

  // Real User purchased tickets, reservations & favorites
  const [userPurchasedTickets, setUserPurchasedTickets] = useState<any[]>([]);
  const [userReservations, setUserReservations] = useState<any[]>([]);
  const [favoriteEvents, setFavoriteEvents] = useState<Event[]>([]);

  // QR Viewer Modal
  const [viewingTicketQr, setViewingTicketQr] = useState<any | null>(null);
  const [viewingReceiptImage, setViewingReceiptImage] = useState<any | null>(null);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && typeof window !== "undefined") {
      if (userProfile) {
        setEditBrandName(userProfile.venueName || userProfile.name || "");
        setEditBrandLogo(userProfile.avatar || "");
        setEditInstagram(userProfile.instagram?.replace(/^@/, "") || "");
        setEditType(userProfile.type || "Discoteca / Club");
        setEditAddress(userProfile.address || "");
        setEditDays(userProfile.openingDays || ["Jueves", "Viernes", "Sábado"]);
      }

      try {
        const currentEmail = (userProfile?.email || "").trim().toLowerCase();

        // 1. Real Created Events (Empty by default unless user actually created events)
        const storedCreated = localStorage.getItem("4go_created_events");
        let initialCreated: any[] = [];
        if (storedCreated) {
          try {
            const parsedCreated = JSON.parse(storedCreated);
            if (Array.isArray(parsedCreated)) initialCreated = parsedCreated;
          } catch {}
        }
        setMyCreatedEvents(initialCreated);

        // Fetch server events and merge with user profile
        fetch("/api/events")
          .then((res) => res.json())
          .then((data) => {
            if (data?.events && Array.isArray(data.events)) {
              const activeUserNames = [
                userProfile?.venueName?.toLowerCase(),
                userProfile?.name?.toLowerCase(),
                userProfile?.email?.toLowerCase(),
                currentEmail,
                "prueba1",
              ].filter(Boolean);

              const serverEvents = data.events.filter((e: any) => {
                const org = (e.organizer || "").toLowerCase().trim();
                const orgs = (Array.isArray(e.organizers) ? e.organizers : []).map((o: string) => (o || "").toLowerCase().trim());
                return activeUserNames.some((u) => u && (org === u || orgs.includes(u)));
              });

              setMyCreatedEvents((prev) => {
                const merged = [...prev];
                for (const sEvt of serverEvents) {
                  if (!merged.some((m: any) => m.id === sEvt.id || m.title === sEvt.title)) {
                    merged.push(sEvt);
                  }
                }
                try {
                  localStorage.setItem("4go_created_events", JSON.stringify(merged));
                } catch {}
                return merged;
              });
            }
          })
          .catch((e) => console.error("Error fetching created events from /api/events:", e));

        // 2. Real Favorites (Connected to billboard hearts)
        const favKey = currentEmail ? `user_favorites_${currentEmail}` : "organizer_favorites";
        const storedFav = localStorage.getItem(favKey) || localStorage.getItem("organizer_favorites") || localStorage.getItem("4go_favorites");
        if (storedFav) {
          const parsedFav = JSON.parse(storedFav);
          const favIds = typeof parsedFav === "object" ? Object.keys(parsedFav).filter((k) => parsedFav[k]) : [];
          const matched = allEvents.filter((evt) => favIds.includes(evt.id));
          setFavoriteEvents(matched);
        } else {
          setFavoriteEvents([]);
        }

        // 3. Real Purchased Tickets
        const storedPurchases = localStorage.getItem("nenez_purchased_tickets");
        if (storedPurchases) {
          const parsed = JSON.parse(storedPurchases);
          setUserPurchasedTickets(Array.isArray(parsed) ? parsed : []);
        } else {
          setUserPurchasedTickets([]);
        }

        // 4. Real Reservations
        const storedRes = localStorage.getItem("4go_user_reservations");
        if (storedRes) {
          const parsed = JSON.parse(storedRes);
          setUserReservations(Array.isArray(parsed) ? parsed : []);
        } else {
          setUserReservations([]);
        }
        // 5. Check pending Master role requests
        fetch("/api/master")
          .then((res) => res.json())
          .then((data) => {
            if (data.ok && data.data?.roleRequests) {
              const pending = data.data.roleRequests.find(
                (r: any) => r.organizerEmail.toLowerCase() === currentEmail && r.status === "pendiente"
              );
              setHasPendingRoleRequest(!!pending);
            }
          })
          .catch(() => {});
      } catch (err) {
        console.error("Error loading account data:", err);
      }
    }
  }, [isOpen, userProfile, allEvents]);

  const fetchMasterData = async () => {
    setLoadingMasterData(true);
    try {
      const res = await fetch("/api/master");
      const json = await res.json();
      if (json.ok && json.data) {
        setMasterPayouts(json.data.payouts || []);
        setMasterRoleRequests(json.data.roleRequests || []);
      }
    } catch (e) {
      console.error("Error fetching master data:", e);
    } finally {
      setLoadingMasterData(false);
    }
  };

  useEffect(() => {
    if (isOpen && isMasterUser) {
      fetchMasterData();
      if (!initialTab && (activeTab === "events" || !activeTab)) {
        setActiveTab("master_receivables");
      }
    }
  }, [isOpen, isMasterUser, initialTab]);

  const handleApprovePayout = async (payoutId: string) => {
    try {
      const res = await fetch("/api/master", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve_payout", payoutId }),
      });
      const data = await res.json();
      if (data.ok) {
        setMasterPayouts((prev) =>
          prev.map((p) => (p.id === payoutId ? { ...p, status: "liquidado" } : p))
        );
        setMasterToast("✓ Liquidación aprobada y registrada.");
        setTimeout(() => setMasterToast(null), 3500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleApproveRoleRequest = async (requestId: string, orgId: string, orgName: string) => {
    try {
      const res = await fetch("/api/master", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve_role_request", requestId, organizerId: orgId }),
      });
      const data = await res.json();
      if (data.ok) {
        setMasterRoleRequests((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, status: "aprobado" } : r))
        );
        setMasterToast(`✓ ${orgName} ha sido ascendido a Discoteca Oficial.`);
        setTimeout(() => setMasterToast(null), 3500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectRoleRequest = async (requestId: string) => {
    try {
      const res = await fetch("/api/master", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject_role_request", requestId, reason: "No cumple con las condiciones requeridas." }),
      });
      const data = await res.json();
      if (data.ok) {
        setMasterRoleRequests((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, status: "rechazado" } : r))
        );
        setMasterToast("Solicitud rechazada.");
        setTimeout(() => setMasterToast(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRequestDiscotecaRole = async () => {
    setIsSubmittingRoleReq(true);
    try {
      const res = await fetch("/api/master", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_role_request",
          organizerId: userProfile?.id || (userProfile?.email || "").split("@")[0],
          organizerName: editBrandName.trim() || userProfile?.venueName || userProfile?.name || "Organizador",
          organizerEmail: userProfile?.email || "",
          phone: "+593 98 000 0000",
          venueAddress: editAddress.trim() || userProfile?.address || "Av. Salvador Bustamante Celi, Loja",
          city: userProfile?.city || "Loja",
          openingDays: editDays,
        }),
      });
      const result = await res.json();
      if (result.ok) {
        setHasPendingRoleRequest(true);
        setRoleReqSuccess(true);
        setTimeout(() => setRoleReqSuccess(false), 4000);
      }
    } catch (err) {
      console.error("Failed to submit role request:", err);
    } finally {
      setIsSubmittingRoleReq(false);
    }
  };

  // Remove event from favorites and sync with billboard
  const handleRemoveFavorite = (eventId: string) => {
    try {
      const email = (userProfile?.email || "").toLowerCase().trim();
      const favKey = email ? `user_favorites_${email}` : "organizer_favorites";
      const currentFavs = JSON.parse(localStorage.getItem(favKey) || "{}");
      delete currentFavs[eventId];

      localStorage.setItem(favKey, JSON.stringify(currentFavs));
      localStorage.setItem("organizer_favorites", JSON.stringify(currentFavs));

      setFavoriteEvents((prev) => prev.filter((evt) => evt.id !== eventId));

      fetch("/api/users/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, eventId, isFavorite: false }),
      }).catch(() => {});
    } catch (err) {
      console.error("Error removing favorite:", err);
    }
  };

  // Load receipts for an organizer event
  const handleSelectManageEvent = async (event: Event) => {
    const rawVenue = event.venue?.trim();
    const uName = userProfile?.name?.trim().toLowerCase();
    const uVenue = userProfile?.venueName?.trim().toLowerCase();
    const cleanVenue = (rawVenue && rawVenue.toLowerCase() !== uName && rawVenue.toLowerCase() !== uVenue && !rawVenue.toLowerCase().startsWith("prueba")) ? rawVenue : "CUBIC";

    const cleanedEvent = { ...event, venue: cleanVenue };
    setManagingEvent(cleanedEvent);
    setEditEventForm({ ...cleanedEvent });
    setLoadingReceipts(true);
    setReceiptActionMessage(null);

    try {
      const res = await fetch(`/api/access-drop/receipts?eventId=${encodeURIComponent(event.id)}&eventTitle=${encodeURIComponent(event.title)}`).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        if (data.receipts && Array.isArray(data.receipts)) {
          setReceiptsList(data.receipts);
        } else {
          setReceiptsList([]);
        }
      } else {
        const localReceipts = JSON.parse(localStorage.getItem(`receipts_${event.id}`) || "[]");
        setReceiptsList(localReceipts);
      }
    } finally {
      setLoadingReceipts(false);
    }
  };

  const handleReviewReceipt = async (receiptId: string, action: "aprobado" | "rechazado", rejectionReason?: string) => {
    setReceiptsList((prev) => {
      const updated = prev.map((r) => (r.id === receiptId ? { ...r, status: action, rejectionReason } : r));
      if (managingEvent?.id) {
        localStorage.setItem(`receipts_${managingEvent.id}`, JSON.stringify(updated));
      }
      return updated;
    });

    if (viewingReceiptImage?.id === receiptId) {
      setViewingReceiptImage((prev: any) => (prev ? { ...prev, status: action, rejectionReason } : null));
    }

    try {
      await fetch(`/api/access-drop/receipts/${receiptId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: action,
          reviewedBy: userProfile?.venueName || userProfile?.name || "Organizador",
          rejectionReason: rejectionReason || (action === "rechazado" ? "Datos de depósito no coinciden con la cuenta." : undefined),
        }),
      });

      const storedPurchases = localStorage.getItem("nenez_purchased_tickets");
      if (storedPurchases) {
        try {
          const parsed = JSON.parse(storedPurchases);
          if (Array.isArray(parsed)) {
            const updatedPurchases = parsed.map((t: any) =>
              t.id === receiptId || t.referenceNumber?.includes(receiptId) || t.eventId === managingEvent?.id
                ? { ...t, status: action === "aprobado" ? "confirmed" : "rejected" }
                : t
            );
            localStorage.setItem("nenez_purchased_tickets", JSON.stringify(updatedPurchases));
            setUserPurchasedTickets(updatedPurchases);
          }
        } catch {}
      }
    } catch (err) {
      console.error("Error saving review:", err);
    }

    setReceiptActionMessage(
      action === "aprobado"
        ? "✓ Comprobante aprobado y guardado. Acceso digital y pase QR liberado al comprador."
        : "✕ Comprobante marcado como rechazado."
    );
    setTimeout(() => setReceiptActionMessage(null), 3500);
  };

  const handleSaveEditedEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const targetEvt = configuringEvent || managingEvent;
    if (!targetEvt || !editEventForm) return;

    const eventDateStr = targetEvt.date || targetEvt.startsAt || "";
    const isPast = eventDateStr ? new Date(eventDateStr).getTime() < new Date().setHours(0, 0, 0, 0) : false;
    if (isPast) {
      alert("No se pueden editar eventos que ya han finalizado o cuya fecha ha pasado.");
      return;
    }

    const updated = { ...targetEvt, ...editEventForm } as Event;
    if (managingEvent) setManagingEvent(updated);
    if (configuringEvent) setConfiguringEvent(updated);

    setMyCreatedEvents((prev) => {
      const list = prev.map((evt) => (evt.id === updated.id ? updated : evt));
      localStorage.setItem("4go_created_events", JSON.stringify(list));
      return list;
    });

    setReceiptActionMessage("Evento actualizado correctamente.");
    setTimeout(() => setReceiptActionMessage(null), 3000);
    setConfiguringEvent(null);
  };

  const handleSavePartnerProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPartner(true);
    setPartnerSaveSuccess(false);

    try {
      const email = (userProfile?.email || "usuario@ejemplo.com").trim().toLowerCase();
      const updated = {
        ...(userProfile || {}),
        name: editBrandName.trim(),
        venueName: editBrandName.trim(),
        avatar: editBrandLogo,
        instagram: editInstagram ? `@${editInstagram.replace(/^@/, "")}` : "",
        type: editType,
        address: editAddress,
        openingDays: editDays,
        hasCompletedOnboarding: true,
      };

      localStorage.setItem("organizer_profile", JSON.stringify(updated));
      localStorage.setItem(`organizer_profile_${email}`, JSON.stringify(updated));
      onUpdateProfile(updated);

      setPartnerSaveSuccess(true);
      setTimeout(() => setPartnerSaveSuccess(false), 3000);
    } finally {
      setIsSavingPartner(false);
    }
  };

  // Calculate per-event statistics
  const approvedReceiptsCount = receiptsList.filter((r) => r.status === "aprobado").length;
  const pendingReceiptsCount = receiptsList.filter((r) => r.status === "en_verificacion" || !r.status).length;
  const eventBasePrice = managingEvent?.price || 10;
  const totalRevenueForEvent = receiptsList
    .filter((r) => r.status === "aprobado")
    .reduce((acc, r) => acc + (Number(r.totalAmount) || Number(r.quantity || 1) * eventBasePrice), 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="my-account-dashboard"
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(24px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[600] overflow-y-auto bg-black/90 backdrop-blur-2xl text-white selection:bg-[#dfff28] selection:text-black font-sans"
        >
        {/* Dynamic Atmospheric Ambient Atmosphere */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1100px] h-[600px] bg-gradient-to-b from-zinc-800/25 via-zinc-900/10 to-transparent blur-[140px] rounded-full pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/90 to-black pointer-events-none" />
        </div>

        {/* ─── CASE A: GESTIONAR EVENTO ESPECÍFICO (PANTALLA COMPLETA CINEMÁTICA) ─── */}
        {managingEvent ? (
          (() => {
            const activeReceipt =
              receiptsList.find((r) => r.id === selectedReceiptId) ||
              receiptsList.find((r) => r.status === "pendiente") ||
              receiptsList[0] ||
              null;

            const eventImageSrc = managingEvent.imageUrl || managingEvent.poster || "/images/now4go-hero-presentation-hd-v3_3840w.jpg";
            const activeTotalQty = activeReceipt?.quantity || 1;
            const activeTotalAmount = activeReceipt?.totalAmount || activeTotalQty * eventBasePrice;
            const activeUnitPrice = activeReceipt?.totalAmount ? activeReceipt.totalAmount / activeTotalQty : eventBasePrice;

            const sanitizedPhone = (activeReceipt?.phone || "").replace(/[^0-9]/g, "");
            const whatsappNumber = sanitizedPhone.startsWith("593")
              ? sanitizedPhone
              : sanitizedPhone.startsWith("0")
              ? `593${sanitizedPhone.slice(1)}`
              : `593${sanitizedPhone}`;
            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
              `¡Hola ${activeReceipt?.firstName || ""}! Te saludamos de ${managingEvent.title} (NENEZ). Respecto a tu solicitud de compra #${(activeReceipt?.id || "").slice(0, 8)} por ${activeTotalQty} entrada(s)...`
            )}`;

            return (
              <div className="relative z-10 min-h-screen">
                {/* Dynamic Blurred Event Poster Atmosphere */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0">
                  <div className="absolute inset-0 scale-125 transform-gpu">
                    <Image
                      src={eventImageSrc}
                      alt={managingEvent.title}
                      fill
                      priority
                      quality={20}
                      sizes="120px"
                      className="object-cover object-top scale-150 blur-[90px] saturate-200 brightness-110 opacity-85 transform-gpu will-change-transform"
                    />
                  </div>
                  <div className="absolute top-0 inset-x-0 h-44 bg-gradient-to-b from-black/90 via-black/40 to-transparent pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/35 to-black pointer-events-none" />
                </div>

                {/* Top Navigation Header Bar */}
                <header className="fixed top-0 inset-x-0 z-[600] flex items-center justify-between px-4 sm:px-8 py-4 bg-gradient-to-b from-black/95 via-black/50 to-transparent pointer-events-none">
                  <div className="pointer-events-auto flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setManagingEvent(null)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-black/70 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white backdrop-blur-xl transition-all duration-200 cursor-pointer shadow-2xl active:scale-95 text-xs font-bold uppercase tracking-wider"
                    >
                      <span>← Volver a Mis Eventos</span>
                    </button>
                  </div>

                  <div className="pointer-events-auto flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setConfiguringEvent(managingEvent);
                        setEditEventForm({ ...managingEvent });
                      }}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-black/70 hover:bg-white/20 border border-white/20 hover:border-white/40 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-xl transition-all duration-200 active:scale-95 shadow-2xl cursor-pointer"
                    >
                      <span>Configuración del Evento</span>
                    </button>
                  </div>
                </header>

                {/* Main Content Container */}
                <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-8 pt-24 pb-28 space-y-10">
                  {receiptActionMessage && (
                    <div className="p-4 rounded-2xl bg-zinc-950/90 border border-[#dfff28]/50 text-white text-xs font-bold shadow-2xl backdrop-blur-xl">
                      <span>{receiptActionMessage}</span>
                    </div>
                  )}

                  {/* Dual-Column Request Review */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Requests List + Compact Receipt Preview + Buyer Info */}
                    <div className="lg:col-span-7 space-y-6">
                      {/* Event Brand Header */}
                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-white/25 bg-black/40 shadow-2xl shrink-0">
                          <Image src={eventImageSrc} alt={managingEvent.title} fill sizes="64px" className="object-cover" />
                        </div>
                        <div className="min-w-0">
                          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white truncate">
                            {managingEvent.title}
                          </h1>
                          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-zinc-300 mt-0.5">
                            <span>{managingEvent.dateLabel || managingEvent.date || "30 AGO 2026"} • {managingEvent.time || "22:00"}</span>
                            <span className="text-zinc-500">•</span>
                            <span className="text-zinc-400 font-medium">{managingEvent.venue || "CUBIC"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Metrics Summary Strip */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-xl space-y-0.5">
                          <span className="text-[9.5px] text-zinc-400 font-bold uppercase block">
                            Recaudado
                          </span>
                          <p className="text-base sm:text-lg font-black text-white">${totalRevenueForEvent.toFixed(2)} USD</p>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-xl space-y-0.5">
                          <span className="text-[9.5px] text-zinc-400 font-bold uppercase block">
                            Vendidas
                          </span>
                          <p className="text-base sm:text-lg font-black text-white">{approvedReceiptsCount} Pases</p>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-xl space-y-0.5">
                          <span className="text-[9.5px] text-zinc-400 font-bold uppercase block">
                            Por Verificar
                          </span>
                          <p className="text-base sm:text-lg font-black text-white">{pendingReceiptsCount} Solicitudes</p>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-xl space-y-0.5">
                          <span className="text-[9.5px] text-zinc-400 font-bold uppercase block">
                            Precio Base
                          </span>
                          <p className="text-base sm:text-lg font-black text-white">${eventBasePrice} USD</p>
                        </div>
                      </div>

                      {/* Solicitudes de Compra List */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h2 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                            Solicitudes de Compra ({receiptsList.length})
                          </h2>
                          <span className="text-[10px] text-zinc-500 font-medium">Selecciona una solicitud</span>
                        </div>

                        {loadingReceipts ? (
                          <div className="p-8 rounded-2xl bg-black/40 border border-white/10 text-center text-xs text-zinc-400">
                            Cargando solicitudes...
                          </div>
                        ) : receiptsList.length === 0 ? (
                          <div className="p-8 rounded-2xl bg-black/40 border border-white/10 text-center space-y-2">
                            <Ticket className="w-8 h-8 text-zinc-600 mx-auto" />
                            <p className="text-xs font-bold text-zinc-400 uppercase">Sin solicitudes pendientes para este evento</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {receiptsList.map((r) => {
                              const isSelected = activeReceipt?.id === r.id;
                              const isApproved = r.status === "aprobado";
                              const isRejected = r.status === "rechazado";
                              const qty = r.quantity || 1;
                              const itemAmount = r.totalAmount || qty * eventBasePrice;

                              return (
                                <div
                                  key={r.id}
                                  onClick={() => setSelectedReceiptId(r.id)}
                                  className={`p-3.5 rounded-2xl transition-all cursor-pointer border flex flex-col justify-between space-y-3 ${
                                    isSelected
                                      ? "bg-zinc-900 border-[#dfff28] shadow-[0_0_20px_rgba(223,255,40,0.15)] ring-1 ring-[#dfff28]"
                                      : "bg-black/50 hover:bg-zinc-900/80 border-white/10"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <h4 className={`text-xs font-black uppercase truncate ${isSelected ? "text-[#dfff28]" : "text-white"}`}>
                                        {r.firstName || "Comprador"} {r.lastName || ""}
                                      </h4>
                                      <p className="text-[11px] text-zinc-400 font-bold mt-0.5">
                                        {qty}x Entrada (${itemAmount.toFixed(0)} USD)
                                      </p>
                                    </div>

                                    <span
                                      className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shrink-0 ${
                                        isApproved
                                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                          : isRejected
                                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                      }`}
                                    >
                                      {isApproved ? "Confirmado" : isRejected ? "Rechazado" : "Por Verificar"}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-2 border-t border-white/5">
                                    <span className="font-mono text-zinc-500">Ref: #{r.referenceNumber || r.id?.slice(0, 8)}</span>
                                    <span className="font-medium text-zinc-400">{getReceiptBankName(r)}</span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setViewingReceiptImage(r);
                                    }}
                                    className="w-full py-1.5 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer border border-white/10"
                                  >
                                    <Eye className="w-3 h-3 text-[#dfff28]" />
                                    <span>Ver Comprobante</span>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Datos del Comprador Seleccionado */}
                      {activeReceipt && (
                        <div className="p-5 rounded-3xl bg-black/60 border border-white/10 backdrop-blur-xl space-y-4">
                          <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-[#dfff28]" />
                            <span>Datos del Comprador</span>
                          </h3>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="p-3 rounded-2xl bg-zinc-950/80 border border-white/5 space-y-0.5">
                              <span className="text-[10px] text-zinc-400 font-bold uppercase block">Nombre Completo</span>
                              <p className="font-black text-white uppercase">{activeReceipt.firstName || ""} {activeReceipt.lastName || ""}</p>
                            </div>

                            <div className="p-3 rounded-2xl bg-zinc-950/80 border border-white/5 space-y-0.5">
                              <span className="text-[10px] text-zinc-400 font-bold uppercase block">Cédula / Documento</span>
                              <p className="font-mono text-zinc-300 font-bold">{activeReceipt.dni || activeReceipt.cedula || "No especificado"}</p>
                            </div>

                            <div className="p-3 rounded-2xl bg-zinc-950/80 border border-white/5 flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <span className="text-[10px] text-zinc-400 font-bold uppercase block">Teléfono / WhatsApp</span>
                                <p className="font-mono text-zinc-300 font-bold truncate">{activeReceipt.phone || "No especificado"}</p>
                              </div>
                              {activeReceipt.phone && (
                                <a
                                  href={whatsappUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider transition shrink-0 flex items-center gap-1 cursor-pointer"
                                >
                                  <MessageCircle className="w-3 h-3" />
                                  <span>WhatsApp</span>
                                </a>
                              )}
                            </div>

                            <div className="p-3 rounded-2xl bg-zinc-950/80 border border-white/5 flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <span className="text-[10px] text-zinc-400 font-bold uppercase block">Correo Electrónico</span>
                                <p className="text-zinc-300 font-medium truncate">{activeReceipt.email || "No especificado"}</p>
                              </div>
                              {activeReceipt.email && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(activeReceipt.email);
                                    setReceiptActionMessage("Correo copiado al portapapeles.");
                                    setTimeout(() => setReceiptActionMessage(null), 2500);
                                  }}
                                  className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300 text-[10px] font-bold uppercase transition shrink-0 flex items-center gap-1 cursor-pointer"
                                >
                                  <Copy className="w-3 h-3" />
                                  <span>Copiar</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Meet2Go Physical Ticket Simulation Card */}
                    {activeReceipt && (
                      <div className="lg:col-span-5 sticky top-24 space-y-4">
                        <div className="w-full bg-white text-black rounded-[32px] p-6 sm:p-7 shadow-2xl space-y-6 font-sans border border-zinc-200">
                          {/* Ticket Header & Price */}
                          <div className="border-b border-zinc-200 pb-5 space-y-1">
                            <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-zinc-950">
                              {activeTotalQty} {activeTotalQty === 1 ? "ENTRADA" : "ENTRADAS"}
                            </h3>
                            <div className="flex items-baseline gap-2">
                              <span className="text-base font-bold text-zinc-800 uppercase tracking-wider">Total —</span>
                              <span className="text-2xl font-black text-black">${activeTotalAmount.toFixed(0)} $</span>
                            </div>
                          </div>

                          {/* Ticket Summary Details */}
                          <div className="space-y-2.5 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="text-zinc-500 font-bold uppercase text-[9px]">Comprador:</span>
                              <span className="font-black text-zinc-900 uppercase">{activeReceipt.firstName} {activeReceipt.lastName}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-zinc-500 font-bold uppercase text-[9px]">Referencia:</span>
                              <span className="font-mono font-bold text-zinc-900">{activeReceipt.referenceNumber || "32561683"}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-zinc-500 font-bold uppercase text-[9px]">Método de pago:</span>
                              <span className="font-bold text-zinc-900 uppercase">{getReceiptBankName(activeReceipt)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-1 border-t border-zinc-200">
                              <span className="text-zinc-500 font-bold uppercase text-[9px]">Estado:</span>
                              <span className="px-2.5 py-0.5 rounded-full text-[9.5px] font-black uppercase bg-zinc-200 text-zinc-800 border border-zinc-300">
                                {activeReceipt.status === "aprobado" ? "Confirmado" : activeReceipt.status === "rechazado" ? "Rechazado" : "Pendiente de Aceptación"}
                              </span>
                            </div>
                          </div>

                          {/* Primary Buttons */}
                          {activeReceipt.status !== "aprobado" ? (
                            <div className="space-y-3">
                              <button
                                type="button"
                                onClick={() => handleReviewReceipt(activeReceipt.id, "aprobado")}
                                className="w-full py-4 px-4 rounded-2xl bg-[#dfff28] hover:bg-[#ebff52] text-black font-black text-xs sm:text-sm uppercase tracking-widest shadow-2xl transition active:scale-[0.98] cursor-pointer"
                              >
                                <span>ACEPTAR Y EMITIR ENTRADA</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleReviewReceipt(activeReceipt.id, "rechazado")}
                                className="w-full py-3 rounded-2xl bg-zinc-100 hover:bg-rose-50 text-rose-700 border border-zinc-200 font-bold text-xs uppercase tracking-wider transition active:scale-[0.98] cursor-pointer"
                              >
                                <span>Rechazar Solicitud</span>
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="rounded-2xl bg-zinc-100 border border-zinc-200 p-3.5 text-center">
                                <p className="text-xs font-black uppercase text-zinc-900">
                                  Pase Digital QR Emitido con Éxito
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleReviewReceipt(activeReceipt.id, "rechazado")}
                                className="w-full text-xs text-zinc-500 hover:text-rose-700 font-bold uppercase py-2 transition text-center cursor-pointer"
                              >
                                Cambiar a Rechazado
                              </button>
                            </div>
                          )}

                          {/* Security terms note */}
                          <div className="pt-2 border-t border-zinc-200 text-zinc-500 text-[10px] leading-relaxed">
                            <span>Al aceptar esta solicitud de compra, se validará el comprobante bancario, se generará el <strong>código QR dinámico único</strong> y se enviará la entrada digital con confirmación inmediata al correo y WhatsApp del comprador.</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </main>
              </div>
            );
          })()
        ) : (
          /* ─── CASE B: PANEL PRINCIPAL (CUENTA ORGANIZADOR / DISCOTECA / MASTER ADMIN) ─── */
          <div className="relative z-10 flex flex-col min-h-screen">
            {/* Top Navigation Header Bar */}
            <header className="sticky top-0 inset-x-0 z-40 flex items-center justify-between px-4 sm:px-8 py-4 bg-black/85 backdrop-blur-xl border-b border-white/10">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-black/70 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white backdrop-blur-xl transition-all duration-200 cursor-pointer shadow-2xl active:scale-95 text-xs font-bold uppercase tracking-wider"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Volver a Cartelera</span>
                </button>
              </div>

              {/* Profile / Venue Branding */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-700 overflow-hidden flex items-center justify-center shrink-0 shadow-md">
                  {userProfile?.avatar ? (
                    <img
                      src={userProfile.avatar}
                      alt={userProfile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-zinc-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-black uppercase tracking-tight text-white truncate">
                      {isMasterUser ? "PANEL MASTER 4GO" : (userProfile?.venueName || userProfile?.name || "Mi Cuenta")}
                    </h2>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      isMasterUser
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : "bg-white/10 text-zinc-200 border border-white/15"
                    }`}>
                      {isMasterUser ? "Master Admin" : "Partner 4GO"}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-medium truncate max-w-xs">{userProfile?.email}</p>
                </div>
              </div>

              {/* Right: Publish Event + Close Button */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onStartCreateEvent?.();
                  }}
                  className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-zinc-200 text-black text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-2xl active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Publicar Evento</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-black/70 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white backdrop-blur-xl flex items-center justify-center transition-all duration-200 cursor-pointer shadow-2xl active:scale-95 text-sm font-bold"
                  title="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* Tab Navigation Strip */}
            <div className="sticky top-[73px] z-30 flex items-center gap-2 px-4 sm:px-8 py-3 bg-black/75 backdrop-blur-xl border-b border-white/10 overflow-x-auto no-scrollbar shrink-0 text-xs font-bold uppercase tracking-wider">
              {isMasterUser && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("master_receivables");
                      setManagingEvent(null);
                    }}
                    className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                      activeTab === "master_receivables"
                        ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black shadow-lg shadow-amber-500/20"
                        : "text-amber-300 hover:text-white hover:bg-amber-500/15 border border-amber-500/30"
                    }`}
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span>Cuentas por Cobrar (6%)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("master_roles");
                      setManagingEvent(null);
                    }}
                    className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                      activeTab === "master_roles"
                        ? "bg-white text-black font-black shadow-lg"
                        : "text-purple-300 hover:text-white hover:bg-purple-500/15 border border-purple-500/30"
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>
                      Solicitudes Discoteca ({masterRoleRequests.filter((r) => r.status === "pendiente").length})
                    </span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  setActiveTab("events");
                  setManagingEvent(null);
                }}
                className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                  activeTab === "events"
                    ? "bg-white text-black font-black shadow-lg"
                    : "text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Mis Eventos ({myCreatedEvents.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("tickets");
                  setManagingEvent(null);
                }}
                className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                  activeTab === "tickets"
                    ? "bg-white text-black font-black shadow-lg"
                    : "text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5"
                }`}
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>Mis Tickets ({userPurchasedTickets.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("reservations");
                  setManagingEvent(null);
                }}
                className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                  activeTab === "reservations"
                    ? "bg-white text-black font-black shadow-lg"
                    : "text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5"
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Mis Reservas</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("favorites");
                  setManagingEvent(null);
                }}
                className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                  activeTab === "favorites"
                    ? "bg-white text-black font-black shadow-lg"
                    : "text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5"
                }`}
              >
                <Heart className="w-3.5 h-3.5" />
                <span>Mis Favoritos ({favoriteEvents.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("partner_profile");
                  setManagingEvent(null);
                }}
                className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                  activeTab === "partner_profile"
                    ? "bg-white text-black font-black shadow-lg"
                    : "text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Datos de Partner</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("payouts");
                  setManagingEvent(null);
                }}
                className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                  activeTab === "payouts"
                    ? "bg-white text-black font-black shadow-lg"
                    : "text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5"
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Pagos y Liquidaciones</span>
              </button>
            </div>

            {/* Main Content Area */}
            <main className="relative z-10 mx-auto max-w-7xl w-full px-4 sm:px-8 py-8 space-y-8 flex-1">

            {/* MASTER TOAST NOTIFICATION */}
            {masterToast && (
              <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black flex items-center justify-between shadow-xl">
                <span>{masterToast}</span>
                <button type="button" onClick={() => setMasterToast(null)} className="text-emerald-400 hover:text-white">✕</button>
              </div>
            )}

            {/* MASTER TAB 1: CUENTAS POR COBRAR (6% COMISIONES) */}
            {activeTab === "master_receivables" && isMasterUser && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">👑</span>
                      <h3 className="text-xl font-black uppercase tracking-tight text-white">
                        Tabla de Cuentas por Cobrar
                      </h3>
                    </div>
                    <p className="text-xs text-zinc-400 font-medium mt-1">
                      Comisión de la plataforma calculada al 6% de lo recaudado por discotecas y organizadores.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={fetchMasterData}
                    disabled={loadingMasterData}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingMasterData ? "animate-spin" : ""}`} />
                    <span>Actualizar Datos</span>
                  </button>
                </div>

                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Total Recaudado</span>
                    <h4 className="text-xl sm:text-2xl font-black text-white">
                      S/ {masterPayouts.reduce((acc, p) => acc + (p.totalCollected || 0), 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </h4>
                    <span className="text-[10px] text-zinc-500 font-bold">Venta total eventos</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-900/90 border border-amber-500/30 space-y-1">
                    <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Comisión 4GO (6%)</span>
                    <h4 className="text-xl sm:text-2xl font-black text-amber-300">
                      S/ {masterPayouts.reduce((acc, p) => acc + (p.platformFee || 0), 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </h4>
                    <span className="text-[10px] text-amber-400/80 font-bold">Total comisión generada</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-900/90 border border-red-500/30 space-y-1">
                    <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Por Cobrar / Pendiente</span>
                    <h4 className="text-xl sm:text-2xl font-black text-red-300">
                      S/ {masterPayouts.filter(p => p.status !== "liquidado").reduce((acc, p) => acc + (p.platformFee || 0), 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </h4>
                    <span className="text-[10px] text-red-400/80 font-bold">Comisiones por cobrar</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-900/90 border border-emerald-500/30 space-y-1">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Liquidado / Aprobado</span>
                    <h4 className="text-xl sm:text-2xl font-black text-emerald-300">
                      S/ {masterPayouts.filter(p => p.status === "liquidado").reduce((acc, p) => acc + (p.platformFee || 0), 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </h4>
                    <span className="text-[10px] text-emerald-400/80 font-bold">Cobros completados</span>
                  </div>
                </div>

                {/* Filter Selector & Search */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                    {[
                      { id: "todos", label: "Todos" },
                      { id: "pendiente_pago", label: "Pendientes de Pago" },
                      { id: "comprobante_subido", label: "Comprobante Subido" },
                      { id: "liquidado", label: "Liquidados" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setMasterStatusFilter(tab.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                          masterStatusFilter === tab.id
                            ? "bg-white text-black font-black shadow-md"
                            : "bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Buscar discoteca o evento..."
                      value={masterSearchQuery}
                      onChange={(e) => setMasterSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
                    />
                  </div>
                </div>

                {/* Tabla de Cuentas por Cobrar */}
                <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-950/60 shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-zinc-300">
                      <thead className="bg-zinc-900/90 text-zinc-400 font-extrabold uppercase tracking-wider text-[10px] border-b border-zinc-800">
                        <tr>
                          <th className="px-4 py-3.5">Discoteca / Productora</th>
                          <th className="px-4 py-3.5">Evento y Fecha</th>
                          <th className="px-4 py-3.5">Total Recaudado</th>
                          <th className="px-4 py-3.5 text-amber-300">Comisión 4GO (6%)</th>
                          <th className="px-4 py-3.5">Estado</th>
                          <th className="px-4 py-3.5 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900">
                        {masterPayouts
                          .filter((p) => {
                            if (masterStatusFilter !== "todos" && p.status !== masterStatusFilter) return false;
                            if (masterSearchQuery.trim()) {
                              const q = masterSearchQuery.toLowerCase();
                              return (
                                (p.organizerName || "").toLowerCase().includes(q) ||
                                (p.eventTitle || "").toLowerCase().includes(q)
                              );
                            }
                            return true;
                          })
                          .map((p, pIdx) => {
                            const isLiquidated = p.status === "liquidado";
                            const hasReceipt = p.status === "comprobante_subido";

                            return (
                              <tr key={p.id || `payout-${pIdx}`} className="hover:bg-zinc-900/40 transition">
                                <td className="px-4 py-3 font-bold text-white whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-black">
                                      {p.organizerName ? p.organizerName[0] : "D"}
                                    </div>
                                    <span>{p.organizerName}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="font-semibold text-white line-clamp-1">{p.eventTitle}</div>
                                  <div className="text-[11px] text-zinc-500">{p.eventDate}</div>
                                </td>
                                <td className="px-4 py-3 font-bold text-white whitespace-nowrap">
                                  S/ {(p.totalCollected || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-4 py-3 font-black text-amber-400 whitespace-nowrap">
                                  S/ {(p.platformFee || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                                    isLiquidated
                                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                      : hasReceipt
                                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                      : "bg-red-500/20 text-red-300 border border-red-500/30"
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                      isLiquidated ? "bg-emerald-400" : hasReceipt ? "bg-amber-400" : "bg-red-400"
                                    }`} />
                                    {isLiquidated
                                      ? "Liquidado / Aprobado"
                                      : hasReceipt
                                      ? "Comprobante Subido"
                                      : "Pendiente de Pago"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-2">
                                    {/* Ver Comprobante Button */}
                                    {p.receiptUrl && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setViewingReceiptImage({
                                            id: p.id,
                                            receiptImage: p.receiptUrl,
                                            referenceNumber: p.id,
                                            bank: "Banco Pichincha / Deuna",
                                          });
                                        }}
                                        className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                        title="Ver comprobante subido"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                        <span>Comprobante</span>
                                      </button>
                                    )}

                                    {/* Recordar Cobro por WhatsApp */}
                                    {!isLiquidated && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const msg = `Hola ${p.organizerName}, te saluda Brandon de 4GO Master. Adjuntamos el reporte de liquidación del evento "${p.eventTitle}" por un total recaudado de S/ ${(p.totalCollected || 0).toFixed(2)}. La comisión acordada del 6% es de S/ ${(p.platformFee || 0).toFixed(2)}. Por favor sube el comprobante de pago por el panel o confírmanos por aquí. ¡Gracias!`;
                                          navigator.clipboard.writeText(msg);
                                          setCopiedIndex(pIdx);
                                          setTimeout(() => setCopiedIndex(null), 2500);
                                        }}
                                        className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                        title="Copiar recordatorio de WhatsApp"
                                      >
                                        {copiedIndex === pIdx ? (
                                          <>
                                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                                            <span className="text-emerald-400">¡Copiado!</span>
                                          </>
                                        ) : (
                                          <>
                                            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                                            <span>WhatsApp</span>
                                          </>
                                        )}
                                      </button>
                                    )}

                                    {/* Aprobar Liquidación */}
                                    {!isLiquidated ? (
                                      <button
                                        type="button"
                                        onClick={() => handleApprovePayout(p.id)}
                                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition shadow-md active:scale-95 cursor-pointer flex items-center gap-1"
                                      >
                                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                                        <span>Aprobar</span>
                                      </button>
                                    ) : (
                                      <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>Liquidado</span>
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* MASTER TAB 2: SOLICITUDES DE ASCENSO A DISCOTECA */}
            {activeTab === "master_roles" && isMasterUser && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-purple-400" />
                    <h3 className="text-xl font-black uppercase tracking-tight text-white">
                      Solicitudes de Ascenso a Discoteca
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-400 font-medium mt-1">
                    Regla de oro: El usuario NUNCA puede cambiarse de rol por sí mismo. Solo tú como Master apruebas el cambio tras auditar las 3 condiciones.
                  </p>
                </div>

                {/* 3 Automated Audit Rules Banner */}
                <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-purple-300">
                    Condiciones Obligatorias para Aprobar:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                    <div className="p-2.5 rounded-xl bg-black/40 border border-purple-500/20 space-y-1">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        1. Historial Limpio (Deuda Cero)
                      </span>
                      <p className="text-[11px] text-zinc-400 leading-snug">
                        El sistema audita automáticamente que no tenga comisiones pendientes de ningún evento anterior.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-black/40 border border-purple-500/20 space-y-1">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        2. Reputación Previa
                      </span>
                      <p className="text-[11px] text-zinc-400 leading-snug">
                        Haber completado con éxito 1 o 2 eventos pagando comisiones al día (o pagar primera cuota adelantada si es nuevo).
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-black/40 border border-purple-500/20 space-y-1">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        3. Verificación Física del Local
                      </span>
                      <p className="text-[11px] text-zinc-400 leading-snug">
                        Local comercial propio y fijo con dirección confirmada, no un promotor que alquila por una noche.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Solicitudes List */}
                <div className="space-y-3">
                  {masterRoleRequests.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-center space-y-2">
                      <Building2 className="w-8 h-8 text-zinc-600 mx-auto" />
                      <p className="text-sm font-bold text-zinc-400">No hay solicitudes de cambio de rol pendientes</p>
                    </div>
                  ) : (
                    masterRoleRequests.map((req) => {
                      const isPending = req.status === "pendiente";
                      const isApproved = req.status === "aprobado";
                      const hasCleanDebt = (req.currentDebt || 0) === 0;
                      const hasGoodReputation = (req.completedEvents || 0) >= 1;

                      return (
                        <div
                          key={req.id}
                          className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 transition space-y-4 shadow-xl"
                        >
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-base font-black text-white">{req.organizerName}</h4>
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                  isApproved
                                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                    : isPending
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                    : "bg-red-500/20 text-red-300 border border-red-500/30"
                                }`}>
                                  {req.status}
                                </span>
                              </div>
                              <p className="text-xs text-zinc-400">{req.organizerEmail} • Tel: {req.phone || "No especificado"}</p>
                            </div>

                            <div className="text-right text-xs text-zinc-500">
                              <span>Solicitado: {req.requestedAt?.split("T")[0] || "2026-09-02"}</span>
                            </div>
                          </div>

                          {/* 3 Audit Checks Details */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                            <div className={`p-3 rounded-xl border ${
                              hasCleanDebt ? "bg-emerald-950/20 border-emerald-500/30" : "bg-red-950/20 border-red-500/30"
                            }`}>
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                                Condición 1: Historial de Comisiones
                              </span>
                              <div className="flex items-center gap-1.5 mt-1 font-extrabold text-white">
                                {hasCleanDebt ? (
                                  <>
                                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                                    <span className="text-emerald-300">Deuda Cero (S/ 0.00) ✓</span>
                                  </>
                                ) : (
                                  <>
                                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                                    <span className="text-red-400">Tiene deuda pendiente</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className={`p-3 rounded-xl border ${
                              hasGoodReputation ? "bg-emerald-950/20 border-emerald-500/30" : "bg-yellow-950/20 border-yellow-500/30"
                            }`}>
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                                Condición 2: Reputación Previa
                              </span>
                              <div className="flex items-center gap-1.5 mt-1 font-extrabold text-white">
                                {hasGoodReputation ? (
                                  <>
                                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                                    <span className="text-emerald-300">{req.completedEvents || 2} eventos cumplidos ✓</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-4 h-4 text-yellow-400 shrink-0" />
                                    <span className="text-yellow-300">Usuario Nuevo (Pago adelantado)</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                                Condición 3: Local Físico Fijo
                              </span>
                              <div className="flex items-center gap-1.5 mt-1 font-medium text-white truncate" title={req.venueAddress}>
                                <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                <span className="truncate">{req.venueAddress || "Av. Salvador Bustamante Celi, Loja"}</span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          {isPending && (
                            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-900">
                              <button
                                type="button"
                                onClick={() => handleRejectRoleRequest(req.id)}
                                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white font-bold text-xs cursor-pointer transition active:scale-95"
                              >
                                Rechazar Solicitud
                              </button>

                              <button
                                type="button"
                                onClick={() => handleApproveRoleRequest(req.id, req.organizerId, req.organizerName)}
                                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white font-black text-xs uppercase tracking-wider transition shadow-lg active:scale-95 flex items-center gap-2 cursor-pointer"
                              >
                                <Check className="w-4 h-4 stroke-[3]" />
                                <span>Aprobar como Discoteca</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 1: MIS EVENTOS */}
            {activeTab === "events" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                      Eventos Creados con tu Cuenta
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-400 font-medium mt-1">
                      Revisa recaudación, comprobantes por verificar y detalles de cada evento.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onStartCreateEvent?.();
                    }}
                    className="px-5 py-2.5 rounded-full bg-white hover:bg-zinc-200 text-black text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-xl flex items-center gap-2 self-start sm:self-auto active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Publicar Nuevo Evento</span>
                  </button>
                </div>

                {myCreatedEvents.length === 0 ? (
                  <div className="p-12 rounded-3xl bg-zinc-950/80 border border-zinc-800 text-center space-y-3 shadow-xl">
                    <Calendar className="w-8 h-8 text-zinc-500 mx-auto" />
                    <h4 className="text-sm font-black uppercase text-white">
                      Aún no has creado eventos
                    </h4>
                    <p className="text-xs text-zinc-400 font-medium max-w-sm mx-auto">
                      Publica tu evento oficial en la cartelera de 4GO para empezar a recibir ventas de tickets.
                    </p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onStartCreateEvent?.();
                        }}
                        className="px-5 py-2.5 rounded-full bg-white hover:bg-zinc-200 text-black text-xs font-black uppercase tracking-wider transition cursor-pointer"
                      >
                        Crear Evento Ahora →
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                    {myCreatedEvents.map((evt) => {
                      const eventDateStr = evt.date || evt.startsAt || "";
                      const isPast = eventDateStr ? new Date(eventDateStr).getTime() < new Date().setHours(0, 0, 0, 0) : false;
                      const displayVenue = (evt.venue && !evt.venue.toLowerCase().startsWith("prueba") && evt.venue.toLowerCase() !== (userProfile?.venueName || "").toLowerCase()) ? evt.venue : "CUBIC";

                      return (
                        <div
                          key={evt.id}
                          className="p-5 rounded-3xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition flex flex-col justify-between space-y-4 shadow-xl backdrop-blur-md"
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-18 h-22 sm:w-20 sm:h-24 rounded-2xl overflow-hidden bg-black shrink-0 relative border border-zinc-700 shadow-md">
                              <img
                                src={evt.poster || "/images/4go_red_girl_showcase.jpg"}
                                alt={evt.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="space-y-1 min-w-0 flex-1">
                              <h4 className="text-base font-black uppercase text-white truncate">
                                {evt.title}
                              </h4>
                              <p className="text-xs text-zinc-400 font-medium truncate">
                                {displayVenue} • {evt.city || "Loja"}
                              </p>
                              <p className="text-xs text-zinc-500 font-medium">
                                {evt.dateLabel || evt.date}
                              </p>

                              <div className="pt-1 flex items-center gap-2 flex-wrap">
                                {isPast ? (
                                  <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[9.5px] font-bold uppercase border border-zinc-700">
                                    Evento Finalizado
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white text-[9.5px] font-bold uppercase border border-white/20">
                                    Publicado / Activo
                                  </span>
                                )}
                                <span className="text-[10px] text-zinc-400 font-bold">
                                  Base: ${evt.price || 10} USD
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-zinc-800/80 space-y-2">
                            <button
                              type="button"
                              onClick={() => handleSelectManageEvent(evt)}
                              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 shadow-sm active:scale-98"
                            >
                              <span>Gestionar Evento y Estadísticas</span>
                              <span>&gt;</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setConfiguringEvent(evt);
                                setEditEventForm({ ...evt, venue: displayVenue });
                              }}
                              className="w-full py-2 px-4 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/60 text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                            >
                              <span>Configuración & Opciones del Evento</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: MIS TICKETS */}
            {activeTab === "tickets" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-white">
                    Mis Entradas Compradas
                  </h3>
                  <p className="text-xs text-zinc-400 font-medium">
                    Tus pases de acceso con código QR adquiridos en 4GO.
                  </p>
                </div>

                {userPurchasedTickets.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-zinc-950 border border-zinc-800 text-center space-y-3">
                    <Ticket className="w-8 h-8 text-zinc-500 mx-auto" />
                    <h4 className="text-sm font-bold uppercase text-white">
                      No tienes entradas compradas
                    </h4>
                    <p className="text-xs text-zinc-400 font-medium max-w-sm mx-auto">
                      Explora los eventos en la cartelera principal y compra tus tickets de acceso directo.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userPurchasedTickets.map((t, idx) => (
                      <div
                        key={t.id || idx}
                        className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition flex flex-col justify-between space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] text-zinc-400 font-bold uppercase">Entrada Oficial</span>
                            <h4 className="text-sm font-black uppercase text-white mt-0.5">
                              {t.eventName || t.title || "Evento 4GO"}
                            </h4>
                            <p className="text-xs text-zinc-400 font-medium">{t.venue || "CUBIC"} • {t.date || "Fecha por confirmar"}</p>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-white/10 text-white text-[9px] font-bold uppercase border border-white/15">
                            {t.status || "Activo"}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-zinc-300">
                            Pase #{t.ticketCode || t.id?.slice(0, 8)}
                          </span>
                          <button
                            type="button"
                            onClick={() => setViewingTicketQr(t)}
                            className="px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Ver QR</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: MIS RESERVAS */}
            {activeTab === "reservations" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-white">
                    Mis Reservas de Mesa / Box
                  </h3>
                  <p className="text-xs text-zinc-400 font-medium">
                    Reservaciones de espacios VIP y mesas exclusivas en locales asociados.
                  </p>
                </div>

                {userReservations.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-zinc-950 border border-zinc-800 text-center space-y-3">
                    <Building2 className="w-8 h-8 text-zinc-500 mx-auto" />
                    <h4 className="text-sm font-bold uppercase text-white">
                      No tienes reservas registradas
                    </h4>
                    <p className="text-xs text-zinc-400 font-medium max-w-sm mx-auto">
                      Reserva tus mesas, salas lounge y consumiciones para los mejores eventos nocturnos.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {userReservations.map((res, idx) => (
                      <div
                        key={res.id || idx}
                        className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] text-zinc-400 font-bold uppercase">{res.zoneName || "Mesa VIP"}</span>
                            <h4 className="text-sm font-black uppercase text-white mt-0.5">
                              {res.eventName || "Reserva Oficial"}
                            </h4>
                            <p className="text-xs text-zinc-400 font-medium">{res.venue || "CUBIC"} • {res.date || "Próximamente"}</p>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-white/10 text-white text-[9px] font-bold uppercase border border-white/15">
                            {res.status || "Confirmada"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: MIS FAVORITOS */}
            {activeTab === "favorites" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-white">
                    Mis Eventos Favoritos
                  </h3>
                  <p className="text-xs text-zinc-400 font-medium">
                    Eventos guardados que te interesan para no perderte ninguna actualización.
                  </p>
                </div>

                {favoriteEvents.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-zinc-950 border border-zinc-800 text-center space-y-3">
                    <Heart className="w-8 h-8 text-zinc-500 mx-auto" />
                    <h4 className="text-sm font-bold uppercase text-white">
                      Aún no has guardado favoritos
                    </h4>
                    <p className="text-xs text-zinc-400 font-medium max-w-sm mx-auto">
                      Toca el ícono de corazón en cualquier evento para guardarlo en tu lista personal.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {favoriteEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition flex flex-col justify-between space-y-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-14 h-18 rounded-xl overflow-hidden bg-black shrink-0 border border-zinc-700 relative">
                            <img src={evt.poster} alt={evt.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs sm:text-sm font-black uppercase text-white truncate">
                              {evt.title}
                            </h4>
                            <p className="text-xs text-zinc-400 truncate">{evt.venue || "CUBIC"} • {evt.city || "Loja"}</p>
                            <p className="text-[11px] text-zinc-500">{evt.dateLabel || evt.date}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenEventDetail?.(evt);
                          }}
                          className="w-full py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-black uppercase tracking-wider transition cursor-pointer"
                        >
                          Ver Evento →
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: DATOS DE PARTNER */}
            {activeTab === "partner_profile" && (
              <form onSubmit={handleSavePartnerProfile} className="space-y-5 max-w-2xl">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-white">
                    Configuración de Perfil Partner 4GO
                  </h3>
                  <p className="text-xs text-zinc-400 font-medium">
                    Estos datos se sincronizan con tus eventos y perfil público en la cartelera.
                  </p>
                </div>

                {partnerSaveSuccess && (
                  <div className="p-3.5 rounded-2xl bg-zinc-900 border border-white/30 text-white text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>✓ Datos de Partner guardados correctamente.</span>
                  </div>
                )}

                {/* Logo Uploader */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center">
                    {editBrandLogo ? (
                      <img src={editBrandLogo} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-6 h-6 text-zinc-500" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <input
                      type="file"
                      accept="image/*"
                      id="modal-edit-partner-logo-input"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setEditBrandLogo(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <label
                      htmlFor="modal-edit-partner-logo-input"
                      className="inline-block px-3.5 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-black uppercase tracking-wider transition cursor-pointer"
                    >
                      {editBrandLogo ? "Cambiar Logo" : "Subir Logo de Marca"}
                    </label>
                    <p className="text-[10px] text-zinc-500 font-medium">Recomendado: 500x500px cuadrado.</p>
                  </div>
                </div>

                {/* Nombre Comercial */}
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                    Nombre de la Marca / Discoteca
                  </label>
                  <input
                    type="text"
                    required
                    value={editBrandName}
                    onChange={(e) => setEditBrandName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs sm:text-sm text-white focus:outline-none focus:border-white transition font-medium"
                  />
                </div>

                {/* Instagram Handle */}
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                    Instagram Oficial (@usuario)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-xs">@</span>
                    <input
                      type="text"
                      value={editInstagram}
                      onChange={(e) => setEditInstagram(e.target.value.replace(/^@/, ""))}
                      placeholder="usuario_instagram"
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs sm:text-sm text-white focus:outline-none focus:border-white transition font-medium"
                    />
                  </div>
                </div>

                {/* Partner Type & City */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                      Rol / Tipo de Partner
                    </label>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                      <div className="flex items-center gap-2">
                        {editType.toLowerCase().includes("discoteca") ? (
                          <Building2 className="w-4 h-4 text-purple-400" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-yellow-400" />
                        )}
                        <span className="text-xs font-black text-white uppercase tracking-wider">
                          {editType.toLowerCase().includes("discoteca") ? "Discoteca / Club" : "Organizador de Eventos"}
                        </span>
                      </div>
                      {editType.toLowerCase().includes("discoteca") ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-extrabold uppercase">
                          Local Verificado
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 text-[10px] font-extrabold uppercase">
                          Organizador
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      disabled
                      value={userProfile?.city || "Loja"}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800 text-xs font-bold text-zinc-400 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Solicitud de Cambio a Discoteca (Regla de Oro Master) */}
                {!editType.toLowerCase().includes("discoteca") && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-zinc-900 to-zinc-900 border border-purple-500/30 space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 text-purple-400 font-black text-xs uppercase tracking-wider">
                          <Building2 className="w-4 h-4" />
                          <span>¿Tienes un local físico fijo? Solicita ser Discoteca</span>
                        </div>
                        <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                          En 4GO el cambio a Discoteca requiere aprobación manual en el <strong>Panel Master</strong> tras auditar: (1) Historial limpio de deuda cero, (2) eventos previos completados y (3) verificación física del local.
                        </p>
                      </div>

                      {hasPendingRoleRequest ? (
                        <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-extrabold uppercase shrink-0">
                          <Clock className="w-3.5 h-3.5" />
                          <span>En Revisión Master</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            handleRequestDiscotecaRole();
                          }}
                          disabled={isSubmittingRoleReq}
                          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider transition cursor-pointer shrink-0 shadow-lg active:scale-95 flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isSubmittingRoleReq ? "Enviando..." : "Solicitar Ascenso a Discoteca"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Dirección Física */}
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                    Dirección Física del Local / Oficina
                  </label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="Ej. Av. Salvador Bustamante Celi y Guayaquil, Loja"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs sm:text-sm text-white focus:outline-none focus:border-white transition font-medium"
                  />
                </div>

                {/* Días de Apertura */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                    Días de Apertura Habituales
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].map((day) => {
                      const isSelected = editDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setEditDays(editDays.filter((d) => d !== day));
                            } else {
                              setEditDays([...editDays, day]);
                            }
                          }}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            isSelected
                              ? "bg-white text-black font-black"
                              : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isSavingPartner}
                    className="px-6 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    {isSavingPartner ? "Guardando..." : "Guardar Cambios de Partner"}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 6: PAGOS Y LIQUIDACIONES */}
            {activeTab === "payouts" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-white">
                    Historial de Liquidaciones & Recaudación
                  </h3>
                  <p className="text-xs text-zinc-400 font-medium">
                    Liquidaciones automáticas a tu cuenta bancaria registrada en Ecuador.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase">Total Recaudado</span>
                    <h4 className="text-2xl font-black text-white">
                      ${myCreatedEvents.length > 0 ? (myCreatedEvents.length * 120).toFixed(2) : "0.00"}
                    </h4>
                    <span className="text-[10px] text-zinc-300 font-bold">100% Recaudación neta</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase">Comisión de Plataforma</span>
                    <h4 className="text-2xl font-black text-white">$0.00</h4>
                    <span className="text-[10px] text-zinc-400 font-bold">0% Promo lanzamiento</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase">Liquidado a Banco</span>
                    <h4 className="text-2xl font-black text-white">
                      ${myCreatedEvents.length > 0 ? (myCreatedEvents.length * 120).toFixed(2) : "0.00"}
                    </h4>
                    <span className="text-[10px] text-zinc-300 font-bold">✓ Al día</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-white">
                      Cuenta Bancaria Vinculada para Transferencias
                    </h4>
                    <span className="px-2 py-0.5 rounded-md bg-white/10 text-white text-[9px] font-bold uppercase border border-white/15">
                      Verificada
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 font-medium">
                    Banco de Loja / Banco Pichincha • Cuenta Corriente • <span className="font-mono text-white">****-4819</span>
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
      )}
      </motion.div>
      )}

      {/* ─── MODAL: CONFIGURACIÓN & OPCIONES DEL EVENTO ─── */}
      {configuringEvent && (() => {
        const eventDateStr = configuringEvent.date || configuringEvent.startsAt || "";
        const isPast = eventDateStr ? new Date(eventDateStr).getTime() < new Date().setHours(0, 0, 0, 0) : false;

        return (
          <div className="fixed inset-0 z-[800] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-1 bg-[#dfff28] rounded-full" />
                  <h3 className="text-lg font-black uppercase tracking-wider text-white">
                    Configuración & Opciones del Evento
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setConfiguringEvent(null)}
                  className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center text-sm font-bold cursor-pointer transition"
                >
                  ✕
                </button>
              </div>

              {/* 1. Promotores y Co-Organizadores */}
              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                    Promotores y Co-Organizadores de este Evento
                  </h4>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase">
                    Alianzas del Evento
                  </span>
                </div>

                <div className="flex flex-wrap gap-2.5 pt-1">
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-black/70 border border-zinc-700 text-xs font-bold text-white shadow-sm">
                    <span>{configuringEvent.organizer || userProfile?.venueName || userProfile?.name || "Organizador Principal"}</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-white text-black font-black uppercase">
                      Principal
                    </span>
                  </div>

                  {configuringEvent.lineup && Array.isArray(configuringEvent.lineup) && configuringEvent.lineup.length > 1 ? (
                    configuringEvent.lineup.slice(1).map((coHost: string, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-black/60 border border-zinc-800 text-xs font-bold text-zinc-300"
                      >
                        <span>{coHost}</span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold uppercase">
                          Co-Host Confirmado
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-zinc-400 font-medium self-center">
                      Producción individual sin co-organizadores vinculados.
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Editar Información del Evento */}
              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
                <form onSubmit={handleSaveEditedEvent} className="space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                      Editar Información del Evento
                    </h4>

                    {isPast ? (
                      <div className="px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px] font-black uppercase">
                        <span>Evento Pasado (Edición Bloqueada)</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-zinc-400 font-bold uppercase">
                        Edición Activa
                      </span>
                    )}
                  </div>

                  {isPast && (
                    <div className="p-3 rounded-xl bg-black/60 border border-zinc-800 text-xs text-zinc-400 font-medium">
                      Este evento ya finalizó en fecha <span className="text-white font-bold">{configuringEvent.dateLabel || configuringEvent.date}</span>. Los eventos pasados no pueden ser editados.
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                        Título del Evento
                      </label>
                      <input
                        type="text"
                        disabled={isPast}
                        value={editEventForm?.title || ""}
                        onChange={(e) => setEditEventForm((prev: any) => ({ ...prev, title: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl bg-black/70 border border-zinc-800 text-xs sm:text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-[#dfff28]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                        Subtítulo / Sala
                      </label>
                      <input
                        type="text"
                        disabled={isPast}
                        value={editEventForm?.subtitle || ""}
                        onChange={(e) => setEditEventForm((prev: any) => ({ ...prev, subtitle: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl bg-black/70 border border-zinc-800 text-xs sm:text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-[#dfff28]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                        Lugar / Venue
                      </label>
                      <input
                        type="text"
                        disabled={isPast}
                        value={editEventForm?.venue || ""}
                        onChange={(e) => setEditEventForm((prev: any) => ({ ...prev, venue: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl bg-black/70 border border-zinc-800 text-xs sm:text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-[#dfff28]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                        Precio Base ($ USD)
                      </label>
                      <input
                        type="number"
                        disabled={isPast}
                        value={editEventForm?.price || 0}
                        onChange={(e) => setEditEventForm((prev: any) => ({ ...prev, price: Number(e.target.value) }))}
                        className="w-full px-4 py-2.5 rounded-xl bg-black/70 border border-zinc-800 text-xs sm:text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-[#dfff28]"
                      />
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setConfiguringEvent(null)}
                      className="px-5 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold uppercase transition"
                    >
                      Cancelar
                    </button>
                    {!isPast && (
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-full bg-white hover:bg-zinc-200 text-black text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-xl active:scale-95"
                      >
                        Guardar Cambios del Evento
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── LIGHTBOX: SOLO LA IMAGEN DEL COMPROBANTE ─── */}
      {viewingReceiptImage && (
        <div
          className="fixed inset-0 z-[850] flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-xl"
          onClick={() => setViewingReceiptImage(null)}
        >
          <div
            className="relative max-w-3xl w-full max-h-[92vh] flex flex-col items-center justify-center space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar */}
            <div className="w-full flex items-center justify-between text-white px-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  Comprobante de Pago
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {getReceiptBankName(viewingReceiptImage)} • Ref: #{viewingReceiptImage.referenceNumber || viewingReceiptImage.id?.slice(0, 8)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setViewingReceiptImage(null)}
                className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold uppercase tracking-wider text-white transition active:scale-95 cursor-pointer"
              >
                Cerrar ✕
              </button>
            </div>

            {/* Clean Receipt Image */}
            <div className="w-full max-h-[82vh] overflow-auto rounded-2xl bg-black/80 border border-white/15 shadow-2xl flex items-center justify-center p-2">
              <img
                src={
                  viewingReceiptImage.filePath
                    ? viewingReceiptImage.filePath.startsWith("/")
                      ? viewingReceiptImage.filePath
                      : `/${viewingReceiptImage.filePath.replace(/\\/g, "/")}`
                    : viewingReceiptImage.receiptImage || `/api/access-drop/receipts/${viewingReceiptImage.id}?file=true`
                }
                alt="Comprobante Bancario"
                className="max-h-[78vh] w-auto object-contain rounded-xl select-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── TICKET PASS CINEMATIC MODAL ─── */}
      <TicketPassModal
        isOpen={!!viewingTicketQr}
        onClose={() => setViewingTicketQr(null)}
        ticket={viewingTicketQr}
      />
    </AnimatePresence>
  );
}
