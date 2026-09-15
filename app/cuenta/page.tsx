"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  User,
  Calendar,
  Ticket,
  Heart,
  CreditCard,
  Building2,
  CheckCircle2,
  Lock,
  Edit3,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  MapPin,
  Check,
  RefreshCw,
  QrCode,
  LogOut,
  X,
  Plus,
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  Sparkles,
  Eye,
  FileText,
  ExternalLink,
  ArrowLeft,
  MessageCircle,
  Copy,
  FileX,
  ZoomIn,
} from "lucide-react";
import Image from "next/image";
import { events as fallbackEvents } from "@/frontend/services/nenezData";
import LocationPickerModal from "@/frontend/components/LocationPickerModal";
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

function CuentaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") as any;

  const [activeTab, setActiveTab] = useState<
    "events" | "tickets" | "reservations" | "favorites" | "partner_profile" | "payouts"
  >(
    initialTab && ["events", "tickets", "reservations", "favorites", "partner_profile", "payouts"].includes(initialTab)
      ? initialTab
      : "events"
  );

  const [userProfile, setUserProfile] = useState<{
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
  } | null>(null);

  // Real events created by this user
  const [myCreatedEvents, setMyCreatedEvents] = useState<any[]>([]);
  const [managingEvent, setManagingEvent] = useState<any | null>(null);
  const [configuringEvent, setConfiguringEvent] = useState<any | null>(null);
  const [editEventForm, setEditEventForm] = useState<any | null>(null);
  const [receiptsList, setReceiptsList] = useState<any[]>([]);
  const [loadingReceipts, setLoadingReceipts] = useState(false);
  const [receiptActionMessage, setReceiptActionMessage] = useState<string | null>(null);

  // Partner Profile Edit State
  const [editBrandName, setEditBrandName] = useState("");
  const [editBrandLogo, setEditBrandLogo] = useState("");
  const [editInstagram, setEditInstagram] = useState("");
  const [editType, setEditType] = useState("Discoteca / Club");
  const [editAddress, setEditAddress] = useState("");
  const [editDays, setEditDays] = useState<string[]>(["Jueves", "Viernes", "Sábado"]);
  const [isSavingPartner, setIsSavingPartner] = useState(false);
  const [partnerSaveSuccess, setPartnerSaveSuccess] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // User Tickets, Reservations & Favorites from real persistent localStorage
  const [userPurchasedTickets, setUserPurchasedTickets] = useState<any[]>([]);
  const [userReservations, setUserReservations] = useState<any[]>([]);
  const [favoriteEvents, setFavoriteEvents] = useState<any[]>([]);

  // QR Viewer Modal
  const [viewingTicketQr, setViewingTicketQr] = useState<any | null>(null);
  const [viewingReceiptImage, setViewingReceiptImage] = useState<any | null>(null);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);

  // Load actual user data from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedProfile = localStorage.getItem("organizer_profile");
        let currentEmail = "";
        if (storedProfile) {
          const parsed = JSON.parse(storedProfile);
          setUserProfile(parsed);
          currentEmail = (parsed.email || "").trim().toLowerCase();
          setEditBrandName(parsed.venueName || parsed.name || "");
          setEditBrandLogo(parsed.avatar || "");
          setEditInstagram(parsed.instagram?.replace(/^@/, "") || "");
          setEditType(parsed.type || "Discoteca / Club");
          setEditAddress(parsed.address || "");
          setEditDays(parsed.openingDays || ["Jueves", "Viernes", "Sábado"]);
        } else {
          // Default profile
          const defaultUser = {
            id: "master_admin",
            name: "Brandon Medina",
            email: "brandon.medina@unl.edu.ec",
            avatar: "/images/logo_4go_black_white.png",
            venueName: "4GO",
            type: "Organizador",
            city: "Loja",
            instagram: "@4gooooooooo",
            address: "Loja, Ecuador",
            openingDays: ["Jueves", "Viernes", "Sábado"],
            hasCompletedOnboarding: true,
          };
          setUserProfile(defaultUser);
          currentEmail = defaultUser.email;
          setEditBrandName(defaultUser.venueName);
          setEditBrandLogo(defaultUser.avatar);
          setEditInstagram("4gooooooooo");
          setEditAddress(defaultUser.address);
        }

        // 1. Real Created Events (Empty by default unless actually created)
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
          const matchedFavorites = fallbackEvents.filter((evt) => favIds.includes(evt.id));
          setFavoriteEvents(matchedFavorites);
        } else {
          setFavoriteEvents([]);
        }

        // 3. Real Purchased Tickets
        const storedPurchases = localStorage.getItem("nenez_purchased_tickets");
        if (storedPurchases) {
          const parsedTickets = JSON.parse(storedPurchases);
          setUserPurchasedTickets(Array.isArray(parsedTickets) ? parsedTickets : []);
        } else {
          setUserPurchasedTickets([]);
        }

        // 4. Real Reservations
        const storedRes = localStorage.getItem("4go_user_reservations");
        if (storedRes) {
          const parsedRes = JSON.parse(storedRes);
          setUserReservations(Array.isArray(parsedRes) ? parsedRes : []);
        } else {
          setUserReservations([]);
        }
      } catch (err) {
        console.error("Error reading localStorage on /cuenta:", err);
      }
    }
  }, []);

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

  // Select event to manage
  const handleSelectManageEvent = async (event: any) => {
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
        // Fallback to locally stored receipts for this event
        const localReceipts = JSON.parse(localStorage.getItem(`receipts_${event.id}`) || "[]");
        setReceiptsList(localReceipts);
      }
    } finally {
      setLoadingReceipts(false);
    }
  };

  const handleReviewReceipt = async (receiptId: string, action: "aprobado" | "rechazado", rejectionReason?: string) => {
    // 1. Optimistic UI update
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

    // 2. Persist to server
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

      // 3. Update localStorage purchased tickets if current user is the buyer
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
      console.error("Error saving receipt review to server:", err);
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

    const updatedEvent = { ...targetEvt, ...editEventForm };
    if (managingEvent) setManagingEvent(updatedEvent);
    if (configuringEvent) setConfiguringEvent(updatedEvent);

    setMyCreatedEvents((prev) => {
      const updated = prev.map((evt) => (evt.id === updatedEvent.id ? updatedEvent : evt));
      localStorage.setItem("4go_created_events", JSON.stringify(updated));
      return updated;
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

      setUserProfile(updated as any);
      localStorage.setItem("organizer_profile", JSON.stringify(updated));
      localStorage.setItem(`organizer_profile_${email}`, JSON.stringify(updated));

      fetch("/api/users/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: updated.name,
          avatar: updated.avatar,
          provider: "google",
          type: updated.type,
          venueName: updated.venueName,
          city: "Loja",
        }),
      }).catch(() => {});

      setPartnerSaveSuccess(true);
      setTimeout(() => setPartnerSaveSuccess(false), 3000);
    } finally {
      setIsSavingPartner(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("organizer_token");
    localStorage.removeItem("organizer_profile");
    router.push("/");
  };

  // Calculate per-event statistics for managing view
  const approvedReceiptsCount = receiptsList.filter((r) => r.status === "aprobado").length;
  const pendingReceiptsCount = receiptsList.filter((r) => r.status === "en_verificacion" || !r.status).length;
  const eventBasePrice = managingEvent?.price || 10;
  const totalRevenueForEvent = receiptsList
    .filter((r) => r.status === "aprobado")
    .reduce((acc, r) => acc + (Number(r.totalAmount) || Number(r.quantity || 1) * eventBasePrice), 0);

  return (
    <div className="min-h-screen w-full bg-[#09090b] text-white flex flex-col font-sans select-none">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold uppercase tracking-wider text-zinc-200 transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Volver a Cartelera</span>
          </Link>

          <div className="h-5 w-px bg-zinc-800 hidden sm:block" />

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center shrink-0">
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
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black uppercase tracking-tight text-white">
                  {userProfile?.venueName || userProfile?.name || "Mi Cuenta"}
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-[9px] font-black uppercase tracking-wider text-zinc-200 border border-white/15">
                  Partner 4GO
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium truncate max-w-xs">{userProfile?.email}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/?action=create_event")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-zinc-200 text-black text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-lg active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Publicar Evento</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-bold uppercase transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </button>
        </div>
      </header>

      {/* Modern Monochrome Tabs Bar */}
      <div className="w-full border-b border-zinc-800/60 bg-zinc-950/40 px-4 sm:px-8 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs font-bold uppercase tracking-wider shrink-0">
        <button
          type="button"
          onClick={() => {
            setActiveTab("events");
            setManagingEvent(null);
          }}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeTab === "events"
              ? "bg-white text-black font-black shadow-md"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
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
              ? "bg-white text-black font-black shadow-md"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
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
              ? "bg-white text-black font-black shadow-md"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Mis Reservas ({userReservations.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("favorites");
            setManagingEvent(null);
          }}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeTab === "favorites"
              ? "bg-white text-black font-black shadow-md"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
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
              ? "bg-white text-black font-black shadow-md"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
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
              ? "bg-white text-black font-black shadow-md"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Pagos y Liquidaciones</span>
        </button>
      </div>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8">
        
        {/* ══════════════════════════════════════════════════════════
            TAB 1: MIS EVENTOS
            ══════════════════════════════════════════════════════════ */}
        {activeTab === "events" && !managingEvent && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                  Eventos Creados con tu Cuenta
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 font-medium mt-1">
                  Gestiona cada evento individualmente, revisa comprobantes de compra y estadísticas de venta.
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push("/?action=create_event")}
                className="px-5 py-2.5 rounded-full bg-white hover:bg-zinc-200 text-black text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-xl flex items-center gap-2 self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Publicar Nuevo Evento</span>
              </button>
            </div>

            {myCreatedEvents.length === 0 ? (
              <div className="p-12 sm:p-16 rounded-3xl bg-zinc-950 border border-zinc-800 text-center space-y-4 shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
                  <Calendar className="w-8 h-8 text-zinc-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-black uppercase text-white">
                    Aún no has creado eventos
                  </h3>
                  <p className="text-xs text-zinc-400 font-medium max-w-md mx-auto">
                    Publica tu primer evento oficial en la cartelera de 4GO y empieza a recibir compras de entradas por transferencia o QR directo.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => router.push("/?action=create_event")}
                    className="px-6 py-3 rounded-full bg-white hover:bg-zinc-200 text-black text-xs font-black uppercase tracking-widest transition cursor-pointer shadow-lg"
                  >
                    Crear mi Primer Evento →
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {myCreatedEvents.map((evt) => {
                  const eventDateStr = evt.date || evt.startsAt || "";
                  const isPast = eventDateStr ? new Date(eventDateStr).getTime() < new Date().setHours(0, 0, 0, 0) : false;
                  const displayVenue = (evt.venue && !evt.venue.toLowerCase().startsWith("prueba") && evt.venue.toLowerCase() !== (userProfile?.venueName || "").toLowerCase()) ? evt.venue : "CUBIC";

                  return (
                    <div
                      key={evt.id}
                      className="p-5 rounded-3xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition flex flex-col justify-between space-y-4 shadow-lg"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-20 h-24 rounded-2xl overflow-hidden bg-black shrink-0 relative border border-zinc-700 shadow-md">
                          <img
                            src={evt.poster || "/images/4go_red_girl_showcase.jpg"}
                            alt={evt.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="space-y-1 min-w-0 flex-1">
                          <h3 className="text-base font-black uppercase text-white truncate">
                            {evt.title}
                          </h3>
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

                      {/* 2 Action Buttons: Gestionar Solicitudes vs Configurar Evento */}
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

        {/* ══════════════════════════════════════════════════════════
            MODAL: CONFIGURACIÓN & OPCIONES DEL EVENTO (STANDALONE MODAL)
            ══════════════════════════════════════════════════════════ */}
        {configuringEvent && (() => {
          const eventDateStr = configuringEvent.date || configuringEvent.startsAt || "";
          const isPast = eventDateStr ? new Date(eventDateStr).getTime() < new Date().setHours(0, 0, 0, 0) : false;

          return (
            <div className="fixed inset-0 z-[650] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
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

        {/* ══════════════════════════════════════════════════════════
            EVENT MANAGEMENT DETAIL VIEW (CINEMATIC FULLSCREEN EXPERIENCE)
            ══════════════════════════════════════════════════════════ */}
        {activeTab === "events" && managingEvent && (() => {
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
            <div className="fixed inset-0 z-[550] overflow-y-auto bg-black text-white selection:bg-[#dfff28] selection:text-black">
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
                        <Image src={eventImageSrc} alt={managingEvent.title} fill className="object-cover" />
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

                    {/* List of Purchase Requests */}
                    {receiptsList.length > 0 && (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/60">
                            SOLICITUDES DE COMPRA ({receiptsList.length})
                          </p>
                          <span className="text-[10px] text-zinc-400 font-medium">Selecciona una solicitud</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {receiptsList.map((r) => {
                            const isCurrent = activeReceipt?.id === r.id;
                            const rQty = r.quantity || 1;
                            const rTotal = r.totalAmount || rQty * eventBasePrice;

                            return (
                              <div
                                key={r.id}
                                onClick={() => setSelectedReceiptId(r.id)}
                                className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col justify-between gap-2.5 ${
                                  isCurrent
                                    ? "bg-zinc-900 border-[#dfff28] shadow-[0_0_20px_rgba(223,255,40,0.2)] ring-1 ring-[#dfff28]"
                                    : "bg-black/50 border-white/10 hover:border-white/30 hover:bg-zinc-900/50"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className={`text-xs font-black uppercase truncate ${isCurrent ? "text-[#dfff28]" : "text-white"}`}>
                                    {r.firstName} {r.lastName}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[8.5px] font-black uppercase border border-zinc-700">
                                    {r.status === "aprobado" ? "Confirmado" : r.status === "rechazado" ? "Rechazado" : "Pendiente"}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                                  <span className="font-bold text-zinc-300">{rQty}x Entrada (${rTotal} USD)</span>
                                  <span className="font-mono text-zinc-400 text-[10px]">Ref: {r.referenceNumber || "32561683"}</span>
                                </div>

                                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                                  <span className="text-[10px] text-zinc-400 font-bold uppercase">{getReceiptBankName(r)}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedReceiptId(r.id);
                                      setViewingReceiptImage(r);
                                    }}
                                    className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase transition border border-white/15 cursor-pointer"
                                  >
                                    Ver Comprobante
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Active Request Details: Buyer Info */}
                    {activeReceipt ? (
                      <div className="space-y-4">

                        {/* Datos del Comprador & Entrega (Only WHATSAPP has vibrant green color) */}
                        <div className="rounded-2xl border border-white/15 bg-black/50 backdrop-blur-xl p-5 shadow-2xl space-y-3">
                          <div className="border-b border-white/10 pb-3">
                            <h3 className="text-xs font-black uppercase tracking-wider text-white">
                              Datos del Comprador & Entrega
                            </h3>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="p-3 rounded-xl bg-zinc-950/70 border border-white/10 space-y-0.5">
                              <span className="text-[10px] font-bold uppercase text-zinc-400 block">Nombre Completo</span>
                              <p className="font-black text-white uppercase">{activeReceipt.firstName} {activeReceipt.lastName}</p>
                            </div>

                            <div className="p-3 rounded-xl bg-zinc-950/70 border border-white/10 space-y-0.5">
                              <span className="text-[10px] font-bold uppercase text-zinc-400 block">Cédula / Documento</span>
                              <p className="font-mono font-medium text-white">{activeReceipt.cedula || "No especificado"}</p>
                            </div>

                            <div className="p-3 rounded-xl bg-zinc-950/70 border border-white/10 flex items-center justify-between">
                              <div className="space-y-0.5 min-w-0">
                                <span className="text-[10px] font-bold uppercase text-zinc-400 block">Teléfono / WhatsApp</span>
                                <p className="font-mono text-white truncate">{activeReceipt.phone || "No especificado"}</p>
                              </div>
                              <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-black text-[10px] font-black uppercase transition shadow-md shrink-0 ml-2"
                              >
                                WHATSAPP
                              </a>
                            </div>

                            <div className="p-3 rounded-xl bg-zinc-950/70 border border-white/10 flex items-center justify-between">
                              <div className="space-y-0.5 min-w-0">
                                <span className="text-[10px] font-bold uppercase text-zinc-400 block">Correo Electrónico</span>
                                <p className="font-mono text-white truncate text-[11px]">{activeReceipt.email}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (navigator.clipboard) navigator.clipboard.writeText(activeReceipt.email);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-[10px] font-bold uppercase transition shrink-0 ml-2"
                              >
                                Copiar
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center rounded-2xl border border-white/10 bg-black/40 text-zinc-400 text-xs font-medium">
                        No hay solicitudes de compra pendientes para este evento.
                      </div>
                    )}
                  </div>

                  {/* Right Column: Floating Accept & Action Card (Sticky) */}
                  {activeReceipt && (
                    <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
                      <div className="rounded-[32px] bg-white text-zinc-900 p-6 sm:p-8 shadow-[0_30px_90px_rgba(0,0,0,0.6)] backdrop-blur-2xl border border-white/40 space-y-6">
                        <div>
                          <h4 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
                            {activeTotalQty} {activeTotalQty === 1 ? "entrada" : "entradas"}
                          </h4>
                          <p className="text-2xl sm:text-3xl font-black text-zinc-800 mt-0.5">
                            Total — {activeTotalAmount.toFixed(0)} $
                          </p>
                        </div>

                        {/* Summary Details Card */}
                        <div className="rounded-2xl bg-zinc-100 p-4 space-y-2 border border-zinc-200 text-xs">
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
        })()}

        {/* ══════════════════════════════════════════════════════════
            TAB 2: MIS TICKETS (EMPTY BY DEFAULT UNLESS REAL PURCHASES EXIST)
            ══════════════════════════════════════════════════════════ */}
        {activeTab === "tickets" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                Mis Entradas Compradas
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 font-medium mt-1">
                Tus pases oficiales de acceso adquiridos para eventos en 4GO.
              </p>
            </div>

            {userPurchasedTickets.length === 0 ? (
              <div className="p-12 sm:p-16 rounded-3xl bg-zinc-950 border border-zinc-800 text-center space-y-4 shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
                  <Ticket className="w-8 h-8 text-zinc-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-black uppercase text-white">
                    No tienes entradas compradas
                  </h3>
                  <p className="text-xs text-zinc-400 font-medium max-w-md mx-auto">
                    Cuando compres entradas para cualquier evento en la cartelera, tus pases con código QR y comprobantes se guardarán aquí automáticamente.
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    href="/"
                    className="inline-block px-6 py-3 rounded-full bg-white hover:bg-zinc-200 text-black text-xs font-black uppercase tracking-widest transition cursor-pointer shadow-lg"
                  >
                    Explorar Cartelera de Eventos →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {userPurchasedTickets.map((tkt) => (
                  <div
                    key={tkt.id}
                    className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-4 flex flex-col justify-between shadow-lg"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-zinc-500 uppercase">
                          Pase #{tkt.id}
                        </span>
                        {tkt.status === "confirmed" ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-white text-black text-[9.5px] font-black uppercase tracking-wider">
                            Confirmado • QR Activo
                          </span>
                        ) : tkt.status === "rejected" ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 text-[9.5px] font-bold uppercase tracking-wider">
                            Rechazado
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-[9.5px] font-bold uppercase tracking-wider">
                            En Verificación de Pago
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-black text-white uppercase">
                        {tkt.eventTitle}
                      </h3>

                      <div className="space-y-1 text-xs text-zinc-400">
                        <p>📍 {tkt.venue}</p>
                        <p>🗓️ {tkt.date}</p>
                        <p className="font-semibold text-zinc-200">
                          {tkt.tierName?.replace(/^\d+x\s*/i, "")} (${tkt.totalAmount} USD)
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setViewingTicketQr(tkt)}
                        className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>Ver Ticket</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 3: MIS RESERVAS
            ══════════════════════════════════════════════════════════ */}
        {activeTab === "reservations" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                Mis Reservas de Mesas y Botellas VIP
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 font-medium mt-1">
                Reservas activas en discotecas aliadas y clubs nocturnos 4GO.
              </p>
            </div>

            {userReservations.length === 0 ? (
              <div className="p-12 sm:p-16 rounded-3xl bg-zinc-950 border border-zinc-800 text-center space-y-4 shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
                  <Building2 className="w-8 h-8 text-zinc-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-black uppercase text-white">
                    No tienes reservas activas
                  </h3>
                  <p className="text-xs text-zinc-400 font-medium max-w-md mx-auto">
                    Reserva mesas VIP, lounges y consumo de botellas en discotecas aliadas directamente desde la app.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {userReservations.map((res) => (
                  <div
                    key={res.id}
                    className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-3 shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-white uppercase">{res.venue}</span>
                      <span className="px-3 py-0.5 rounded-full bg-white/10 text-white text-[9.5px] font-bold uppercase border border-white/20">
                        {res.status}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-zinc-300">
                      <p className="font-bold text-white text-sm">{res.tableNumber}</p>
                      <p className="text-zinc-400">🗓️ {res.date} • {res.guests} Personas</p>
                      <p className="text-xs text-zinc-400 font-medium">🍾 Consumo: {res.bottles}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 4: MIS FAVORITOS (100% REAL & SYNCED WITH BILLBOARD HEARTS)
            ══════════════════════════════════════════════════════════ */}
        {activeTab === "favorites" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                Eventos Guardados en Favoritos
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 font-medium mt-1">
                Tus eventos marcados con corazón en la cartelera.
              </p>
            </div>

            {favoriteEvents.length === 0 ? (
              <div className="p-12 sm:p-16 rounded-3xl bg-zinc-950 border border-zinc-800 text-center space-y-4 shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
                  <Heart className="w-8 h-8 text-zinc-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-black uppercase text-white">
                    No tienes eventos en favoritos
                  </h3>
                  <p className="text-xs text-zinc-400 font-medium max-w-md mx-auto">
                    Marca con el corazón los eventos de la cartelera que te interesen para encontrarlos aquí y comprar rápido.
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    href="/"
                    className="inline-block px-6 py-3 rounded-full bg-white hover:bg-zinc-200 text-black text-xs font-black uppercase tracking-widest transition cursor-pointer shadow-lg"
                  >
                    Ver Cartelera de Eventos →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {favoriteEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between space-y-3 shadow-lg relative group"
                  >
                    <div className="space-y-2.5">
                      <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-black relative border border-zinc-800 shadow-md">
                        <img
                          src={evt.poster || "/images/4go_red_girl_showcase.jpg"}
                          alt={evt.title}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveFavorite(evt.id)}
                          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/70 hover:bg-black text-red-500 flex items-center justify-center transition cursor-pointer backdrop-blur-md"
                          title="Quitar de favoritos"
                        >
                          <Heart className="w-4 h-4 fill-red-500" />
                        </button>
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white uppercase truncate">
                          {evt.title}
                        </h3>
                        <p className="text-xs text-zinc-400 font-medium">
                          {evt.venue} • {evt.dateLabel || evt.date}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/${evt.id}`}
                      className="w-full py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-black uppercase tracking-wider transition text-center block shadow-sm"
                    >
                      Ver Evento →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 5: DATOS DE PARTNER / PERFIL
            ══════════════════════════════════════════════════════════ */}
        {activeTab === "partner_profile" && (
          <div className="max-w-3xl space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                Configuración de Perfil Partner 4GO
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 font-medium mt-1">
                Datos de tu marca o discoteca sincronizados con tus eventos publicados.
              </p>
            </div>

            {partnerSaveSuccess && (
              <div className="p-4 rounded-2xl bg-zinc-900 border border-white/30 text-white text-xs font-bold flex items-center gap-2 shadow-lg">
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>✓ Datos de Partner guardados correctamente.</span>
              </div>
            )}

            <form onSubmit={handleSavePartnerProfile} className="space-y-5">
              {/* Logo Uploader */}
              <div className="flex items-center gap-5 p-5 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-md">
                <div className="w-20 h-20 rounded-2xl bg-zinc-800 border border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center">
                  {editBrandLogo ? (
                    <img src={editBrandLogo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-8 h-8 text-zinc-500" />
                  )}
                </div>
                <div className="space-y-1.5">
                  <input
                    type="file"
                    accept="image/*"
                    id="page-partner-logo-input"
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
                    htmlFor="page-partner-logo-input"
                    className="inline-block px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-sm"
                  >
                    {editBrandLogo ? "Cambiar Logo" : "Subir Logo de Marca"}
                  </label>
                  <p className="text-xs text-zinc-500 font-medium">Recomendado: 500x500px cuadrado.</p>
                </div>
              </div>

              {/* Nombre Comercial */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                  Nombre de la Marca / Discoteca
                </label>
                <input
                  type="text"
                  required
                  value={editBrandName}
                  onChange={(e) => setEditBrandName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs sm:text-sm text-white focus:outline-none focus:border-white transition font-medium"
                />
              </div>

              {/* Instagram Handle */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                  Instagram Oficial (@usuario)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-xs">@</span>
                  <input
                    type="text"
                    value={editInstagram}
                    onChange={(e) => setEditInstagram(e.target.value.replace(/^@/, ""))}
                    placeholder="usuario_instagram"
                    className="w-full pl-8 pr-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs sm:text-sm text-white focus:outline-none focus:border-white transition font-medium"
                  />
                </div>
              </div>

              {/* Partner Type & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                    Partner Type
                  </label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-white focus:outline-none focus:border-white transition cursor-pointer"
                  >
                    <option value="Discoteca / Club">Discoteca / Club</option>
                    <option value="Organizador / Promotor">Organizador / Promotor</option>
                    <option value="Artista / DJ">Artista / DJ</option>
                    <option value="Venue / Espacio">Venue / Espacio</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    disabled
                    value={userProfile?.city || "Loja"}
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs font-bold text-zinc-400 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Dirección Física con selector Maps */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                  Ubicación / Dirección Física
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="Av. Salvador Bustamante Celi y Guayaquil, Loja"
                    className="flex-1 px-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs sm:text-sm text-white focus:outline-none focus:border-white transition font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setIsLocationModalOpen(true)}
                    className="px-4 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold uppercase tracking-wider shrink-0 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <MapPin className="w-4 h-4 text-white" />
                    <span>Maps</span>
                  </button>
                </div>
              </div>

              {/* Días de Apertura */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                  Días de Apertura
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {["Jueves", "Viernes", "Sábado", "Domingo", "Todos"].map((day) => {
                    const isSelected = editDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          if (day === "Todos") {
                            setEditDays(["Jueves", "Viernes", "Sábado", "Domingo"]);
                            return;
                          }
                          setEditDays((prev) =>
                            isSelected ? prev.filter((d) => d !== day) : [...prev, day]
                          );
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                          isSelected
                            ? "bg-white text-black border-white"
                            : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingPartner || !editBrandName.trim()}
                  className="px-8 py-3.5 rounded-full bg-white hover:bg-zinc-200 disabled:opacity-50 text-black text-xs font-black uppercase tracking-widest transition shadow-xl cursor-pointer flex items-center gap-2"
                >
                  {isSavingPartner ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Guardar Perfil Partner</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 6: PAGOS Y LIQUIDACIONES
            ══════════════════════════════════════════════════════════ */}
        {activeTab === "payouts" && (
          <div className="space-y-6 max-w-4xl">
            <div>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                Historial de Pagos y Liquidaciones
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 font-medium mt-1">
                Liquidaciones automáticas a tu cuenta bancaria registrada en Ecuador.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-1 shadow-lg">
                <span className="text-[10px] text-zinc-400 font-bold uppercase">Total Recaudado</span>
                <h4 className="text-3xl font-black text-white">
                  ${myCreatedEvents.length > 0 ? (myCreatedEvents.length * 120).toFixed(2) : "0.00"}
                </h4>
                <span className="text-xs text-zinc-300 font-bold">100% Recaudación neta</span>
              </div>

              <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-1 shadow-lg">
                <span className="text-[10px] text-zinc-400 font-bold uppercase">Comisión de Plataforma</span>
                <h4 className="text-3xl font-black text-white">$0.00</h4>
                <span className="text-xs text-zinc-400 font-bold">0% Promo lanzamiento</span>
              </div>

              <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-1 shadow-lg">
                <span className="text-[10px] text-zinc-400 font-bold uppercase">Liquidado a Banco</span>
                <h4 className="text-3xl font-black text-white">
                  ${myCreatedEvents.length > 0 ? (myCreatedEvents.length * 120).toFixed(2) : "0.00"}
                </h4>
                <span className="text-xs text-zinc-300 font-bold">✓ Al día</span>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-2 shadow-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                  Cuenta Bancaria Vinculada para Transferencias
                </h3>
                <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-white text-[9.5px] font-bold uppercase border border-white/15">
                  Verificada
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-300 font-medium">
                Banco de Loja / Banco Pichincha • Cuenta Corriente • <span className="font-mono text-white">****-4819</span>
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Location Picker Modal */}
      <LocationPickerModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        initialVenue={editBrandName}
        initialAddress={editAddress}
        onSelectLocation={(venue, address) => {
          setEditAddress(address);
        }}
      />

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
    </div>
  );
}

export default function CuentaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen w-full bg-[#09090b] text-white flex items-center justify-center">Cargando...</div>}>
      <CuentaContent />
    </Suspense>
  );
}
