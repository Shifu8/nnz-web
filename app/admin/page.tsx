"use client";

import { useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, LayoutDashboard, Ticket, Calendar, TrendingUp, Users, Settings,
  LogOut, Bell, Search, ChevronRight, ChevronLeft, ShieldCheck,
  ShieldAlert, FileCheck, FileX, Clock, Ban, Check, Eye, Loader2,
  ArrowUpRight, Menu, Palette, QrCode, RefreshCw,
  Activity, Sparkles, CircleDollarSign, WalletCards, Globe,
  type LucideIcon,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReceiptRecord, ReceiptStatus } from "@/lib/access-drop/types";
import { REJECTION_REASONS } from "@/lib/access-drop/types";
import type { AdminEvent } from "@/lib/admin/types";
import { ToastProvider, useToast } from "./components/Toast";
import VentasCard from "./components/VentasCard";
import EventsSection from "./components/EventsSection";
import TicketDesigner from "./components/TicketDesigner";
import ClientsSection from "./components/ClientsSection";
import VentasSection from "./components/VentasSection";
import SettingsSection from "./components/SettingsSection";
import QrControlSection from "./components/QrControlSection";
import TurnstileWidget, { hasTurnstileSiteKey } from "@/frontend/components/TurnstileWidget";
import HomepageEditor from "./components/HomepageEditor";
import TicketDesignsManager from "./components/TicketDesignsManager";

type ChartTooltipProps = {
  active?: boolean;
  payload?: readonly { value?: unknown }[];
  label?: ReactNode;
};

const tooltipNumber = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  return 0;
};

const ADMIN_CREDENTIALS = { user: "admin" };

const SIDEBAR_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "entradas", label: "Entradas", icon: Ticket },
  { id: "eventos", label: "Eventos", icon: Calendar },
  { id: "qr-control", label: "QR Control", icon: QrCode },
  { id: "ventas", label: "Ventas", icon: TrendingUp },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "homepage", label: "Homepage", icon: Globe },
  { id: "ajustes", label: "Ajustes", icon: Settings },
  { id: "cerrar-sesion", label: "Cerrar Sesion", icon: LogOut },
];

const cardPalettes = [
  "from-[#f8d77a] via-[#d59d58] to-[#67513c]",
  "from-[#7cb7ff] via-[#8276dd] to-[#473779]",
  "from-[#ff8a9d] via-[#e5577d] to-[#78304d]",
  "from-[#ffd36a] via-[#ff9d47] to-[#91522f]",
  "from-[#ffb44f] via-[#f07541] to-[#633322]",
];

const currency = (value: number) => `$${value.toLocaleString("en-US")}`;

const getInitials = (first = "", last = "") => {
  const initials = `${first.trim()[0] || ""}${last.trim()[0] || ""}`.toUpperCase();
  return initials || "A";
};

const formatDateLabel = (value?: string) => {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-EC", { day: "2-digit", month: "short" });
};

function buildDailySales(receipts: ReceiptRecord[]) {
  const days = Array.from({ length: 8 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (7 - index));
    const key = date.toISOString().slice(0, 10);
    return {
      key,
      name: date.toLocaleDateString("es-EC", { weekday: "short" }).replace(".", ""),
      revenue: 0,
      tickets: 0,
    };
  });

  const byKey = new Map(days.map((day) => [day.key, day]));
  for (const receipt of receipts) {
    if (receipt.status !== "aprobado" || !receipt.createdAt) continue;
    const key = new Date(receipt.createdAt).toISOString().slice(0, 10);
    const day = byKey.get(key);
    if (!day) continue;
    day.tickets += receipt.quantity || 1;
    day.revenue += (receipt.quantity || 1) * 10;
  }

  return days;
}

function buildStatusBars(receipts: ReceiptRecord[]) {
  return [
    { name: "Apr", value: receipts.filter((r) => r.status === "aprobado").length, fill: "#f8d77a" },
    { name: "Pen", value: receipts.filter((r) => r.status === "pendiente").length, fill: "#8bb9ff" },
    { name: "Rej", value: receipts.filter((r) => r.status === "rechazado").length, fill: "#ff7b8f" },
    { name: "Tot", value: receipts.length, fill: "#ffb44f" },
  ];
}

function buildMiniTrend(receipts: ReceiptRecord[]) {
  const daily = buildDailySales(receipts);
  let running = 0;
  return daily.map((day) => {
    running += day.tickets;
    return { name: day.name, value: running };
  });
}

function getTopClients(receipts: ReceiptRecord[]) {
  const map = new Map<string, { name: string; phone: string; tickets: number; spent: number; initials: string }>();
  for (const receipt of receipts) {
    const key = receipt.phone || `${receipt.firstName}-${receipt.lastName}`;
    if (!map.has(key)) {
      map.set(key, {
        name: `${receipt.firstName} ${receipt.lastName}`.trim() || "Cliente",
        phone: receipt.phone,
        tickets: 0,
        spent: 0,
        initials: getInitials(receipt.firstName, receipt.lastName),
      });
    }
    const item = map.get(key)!;
    item.tickets += receipt.quantity || 1;
    if (receipt.status === "aprobado") item.spent += (receipt.quantity || 1) * 10;
  }
  return Array.from(map.values()).sort((a, b) => b.spent - a.spent || b.tickets - a.tickets).slice(0, 4);
}

function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 1600);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#120f13] text-white"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7 }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#120f13_0%,#3a241f_42%,#f1b764_100%)] opacity-80" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.16),transparent_42%)]" />
      <motion.div
        initial={{ scale: 0.78, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex flex-col items-center"
      >
        <div className="flex h-24 w-24 items-center justify-center rounded-[28px] border border-white/20 bg-black/[0.35] shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
          <Zap className="h-11 w-11 text-[#ffd36a]" />
        </div>
        <p className="mt-6 text-4xl font-black tracking-[0.18em]">NENEZ</p>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.45em] text-white/[0.55]">Admin Panel</p>
      </motion.div>
    </motion.div>
  );
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [user, setUser] = useState("admin");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const passwordRef = useRef<HTMLInputElement>(null);

  const resetTurnstile = () => {
    setTurnstileToken("");
    setTurnstileResetKey((key) => key + 1);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (user.trim().toLowerCase() !== ADMIN_CREDENTIALS.user) {
      setError("Usuario incorrecto");
      return;
    }

    if (hasTurnstileSiteKey("invisible") && !turnstileToken) {
      setError("Verificacion segura cargando. Intenta otra vez.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pass, role: "admin", turnstileToken }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Credenciales incorrectas");
        resetTurnstile();
        return;
      }
      onLogin();
      return;
    } catch {
      setError("Error de red");
      resetTurnstile();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center overflow-hidden bg-[#181014] px-4 text-white">
      <div className="absolute inset-0 bg-[linear-gradient(132deg,#0b0709_0%,#251316_40%,#d9964f_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,234,174,0.26),transparent_48%),linear-gradient(180deg,rgba(0,0,0,0.14),rgba(0,0,0,0.42))]" />
      <button
        onClick={() => { window.location.href = "/?menu=access"; }}
        className="absolute left-5 top-5 z-10 flex h-11 items-center gap-2 rounded-full border border-white/[0.15] bg-white/10 px-4 text-[10px] font-black uppercase tracking-[0.12em] text-white/70 backdrop-blur-2xl transition hover:bg-white/[0.15] hover:text-white"
      >
        <ArrowUpRight className="h-4 w-4 rotate-180" /> Volver
      </button>
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[420px] overflow-hidden rounded-[30px] border border-white/[0.18] bg-[#130d12]/[0.7] p-8 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-3xl"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.45] to-transparent" />
        <div className="relative">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#ffd36a]/[0.3] bg-[#ffd36a]/[0.15]">
              <Zap className="h-6 w-6 text-[#ffd36a]" />
            </div>
            <div>
              <p className="text-lg font-black tracking-[0.16em] text-white">NENEZ</p>
              <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-white/[0.45]">Admin Access</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/50">Usuario</span>
              <input
                required
                name="username"
                autoComplete="username"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder="admin"
                className="h-[52px] w-full rounded-2xl border border-white/[0.12] bg-black/[0.28] px-5 text-sm font-bold text-white outline-none transition placeholder:text-white/25 focus:border-[#ffd36a]/[0.45]"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/50">Contrasena</span>
              <input
                ref={passwordRef}
                required
                name="password"
                type="password"
                autoComplete="current-password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="********"
                className="h-[52px] w-full rounded-2xl border border-white/[0.12] bg-black/[0.28] px-5 text-sm font-bold text-white outline-none transition placeholder:text-white/25 focus:border-[#ffd36a]/[0.45]"
              />
            </label>
            <button
              type="button"
              onClick={() => passwordRef.current?.focus()}
              className="flex h-10 w-full items-center justify-center rounded-2xl border border-[#ffd36a]/20 bg-[#ffd36a]/10 text-[9px] font-black uppercase tracking-[0.16em] text-[#ffe1a1] md:hidden"
            >
              Face ID / contrasena guardada
            </button>
            {error && (
              <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-[10px] font-bold text-[#ff8a9d]">
                {error}
              </motion.p>
            )}
            <TurnstileWidget
              action="admin_login"
              variant="invisible"
              resetKey={turnstileResetKey}
              onVerify={setTurnstileToken}
              onExpire={() => setTurnstileToken("")}
              onError={() => setTurnstileToken("")}
            />
            <button
              type="submit"
              disabled={loading}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#ffd36a] text-[11px] font-black uppercase tracking-[0.18em] text-[#1d130a] shadow-[0_18px_42px_rgba(255,179,82,0.22)] transition hover:bg-[#ffe19a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Validando..." : "Ingresar"} <ArrowUpRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

const statusBadge = (status: ReceiptStatus) => {
  switch (status) {
    case "pendiente":
      return <span className="rounded-full border border-[#ffd36a]/[0.35] bg-[#ffd36a]/[0.12] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-[#ffd36a]">Pendiente</span>;
    case "aprobado":
      return <span className="rounded-full border border-[#8ff0aa]/[0.35] bg-[#8ff0aa]/[0.12] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-[#9ff0b5]">Aprobado</span>;
    case "rechazado":
      return <span className="rounded-full border border-[#ff8a9d]/[0.35] bg-[#ff8a9d]/[0.12] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-[#ff9bad]">Rechazado</span>;
  }
};

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  palette,
  delay,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  palette: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -4 }}
      className={`relative min-h-[132px] overflow-hidden rounded-[24px] bg-gradient-to-br ${palette} p-4 text-white shadow-[0_20px_50px_rgba(0,0,0,0.22)]`}
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.32),transparent_34%,rgba(0,0,0,0.2))]" />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/[0.15] backdrop-blur-xl">
            <Icon className="h-4 w-4" />
          </div>
          <span className="rounded-full bg-white/[0.18] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.1em]">
            Live
          </span>
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/[0.72]">{label}</p>
          <p className="mt-1 text-3xl font-black">{value}</p>
          <p className="mt-1 text-[9px] font-bold text-white/[0.68]">{detail}</p>
        </div>
      </div>
    </motion.div>
  );
}

function EventCarousel({ events }: { events: AdminEvent[] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const prev = () => setActiveIdx((i) => (i === 0 ? events.length - 1 : i - 1));
  const next = () => setActiveIdx((i) => (i === events.length - 1 ? 0 : i + 1));
  if (events.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#17131c]/[0.62] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_22px_60px_rgba(0,0,0,0.18)] backdrop-blur-2xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/[0.45]">Eventos</p>
          <p className="text-base font-black text-white">Cartelera activa</p>
        </div>
        <div className="flex gap-2">
          <button onClick={prev} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-white/[0.55] transition hover:text-white">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={next} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-white/[0.55] transition hover:text-white">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative h-[220px]">
        {events.map((event, index) => {
          const offset = index - activeIdx;
          const isActive = index === activeIdx;
          return (
            <motion.div
              key={event.id}
              animate={{ x: offset * 40, scale: isActive ? 1 : 0.9, opacity: isActive ? 1 : 0.18 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={() => setActiveIdx(index)}
              className={`absolute inset-0 overflow-hidden rounded-[20px] border border-white/10 ${isActive ? "z-10" : "z-0"}`}
              style={{ pointerEvents: isActive ? "auto" : "none" }}
            >
              {event.imageUrl ? (
                <img src={event.imageUrl} alt={event.title} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-[#7cb7ff] via-[#e5577d] to-[#ffb44f]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/[0.82] via-black/[0.34] to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#ffd36a]">{event.subtitle}</p>
                <p className="mt-1 text-2xl font-black text-white">{event.title}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-[9px] font-bold uppercase tracking-[0.08em] text-white/[0.65]">
                  <span>{event.date}</span>
                  <span>{event.location}</span>
                  <span>{event.time}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function DashboardContent({ receipts, events, onRefresh }: { receipts: ReceiptRecord[]; events: AdminEvent[]; onRefresh: () => void }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<ReceiptStatus | "todas">("todas");
  const [selected, setSelected] = useState<ReceiptRecord | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [showRejectOptions, setShowRejectOptions] = useState(false);
  const [rejectReason, setRejectReason] = useState<string | null>(null);
  const { toast } = useToast();

  const filteredReceipts = receipts.filter((receipt) => {
    if (filterStatus !== "todas" && receipt.status !== filterStatus) return false;
    if (search.trim()) {
      const query = search.toLowerCase();
      const name = `${receipt.firstName} ${receipt.lastName}`.toLowerCase();
      const phone = receipt.phone.toLowerCase();
      if (!name.includes(query) && !phone.includes(query)) return false;
    }
    return true;
  });

  const stats = useMemo(() => ({
    total: receipts.length,
    pendientes: receipts.filter((r) => r.status === "pendiente").length,
    aprobados: receipts.filter((r) => r.status === "aprobado").length,
    rechazados: receipts.filter((r) => r.status === "rechazado").length,
  }), [receipts]);

  const totalRevenue = useMemo(
    () => receipts.filter((r) => r.status === "aprobado").reduce((sum, receipt) => sum + (receipt.quantity || 0) * 10, 0),
    [receipts],
  );

  const totalTicketsSold = useMemo(
    () => receipts.filter((r) => r.status === "aprobado").reduce((sum, receipt) => sum + (receipt.quantity || 0), 0),
    [receipts],
  );

  const dailySales = useMemo(() => buildDailySales(receipts), [receipts]);
  const statusBars = useMemo(() => buildStatusBars(receipts), [receipts]);
  const trendLine = useMemo(() => buildMiniTrend(receipts), [receipts]);
  const topClients = useMemo(() => getTopClients(receipts), [receipts]);
  const approvedRate = stats.total ? Math.round((stats.aprobados / stats.total) * 100) : 0;

  const handleApprove = async (id: string) => {
    setReviewing(true);
    try {
      const res = await fetch(`/api/access-drop/receipts/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "aprobado", reviewedBy: "admin" }),
      });
      const data = await res.json();
      if (data.success) {
        setSelected(null);
        toast("success", "Comprobante aprobado", "La entrada se genero y envio.");
        onRefresh();
      }
    } catch {
      toast("error", "Error al aprobar");
    } finally {
      setReviewing(false);
    }
  };

  const handleReject = async (id: string, reason: string) => {
    setReviewing(true);
    try {
      const res = await fetch(`/api/access-drop/receipts/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rechazado", reviewedBy: "admin", rejectionReason: reason }),
      });
      const data = await res.json();
      if (data.success) {
        setSelected(null);
        setShowRejectOptions(false);
        setRejectReason(null);
        toast("success", "Comprobante rechazado", "Se notifico al usuario.");
        onRefresh();
      }
    } catch {
      toast("error", "Error al rechazar");
    } finally {
      setReviewing(false);
    }
  };

  const metricCards = [
    { label: "Aprobadas", value: stats.aprobados.toLocaleString("en-US"), detail: `${approvedRate}% tasa aprobada`, icon: FileCheck },
    { label: "Pendientes", value: stats.pendientes.toLocaleString("en-US"), detail: "por revisar", icon: Clock },
    { label: "Ingresos", value: currency(totalRevenue), detail: `${totalTicketsSold} tickets vendidos`, icon: CircleDollarSign },
    { label: "Rechazadas", value: stats.rechazados.toLocaleString("en-US"), detail: `${stats.total} comprobantes`, icon: Ban },
  ];

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card, index) => (
          <MetricCard
            key={card.label}
            label={card.label}
            value={card.value}
            detail={card.detail}
            icon={card.icon}
            palette={cardPalettes[index]}
            delay={index * 0.04}
          />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_0.9fr]">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="relative overflow-hidden rounded-[26px] border border-white/10 bg-[#18131d]/[0.62] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_24px_70px_rgba(0,0,0,0.2)] backdrop-blur-2xl"
        >
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/[0.42]">Key savings</p>
              <div className="mt-1 flex items-end gap-2">
                <p className="text-4xl font-black text-white">{currency(totalRevenue)}</p>
                <p className="pb-1 text-[10px] font-bold text-white/[0.42]">ventas aprobadas</p>
              </div>
            </div>
            <button
              onClick={onRefresh}
              className="flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 text-[9px] font-black uppercase tracking-[0.12em] text-white/[0.58] transition hover:bg-white/[0.12] hover:text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Actualizar
            </button>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[22px] border border-white/[0.08] bg-black/[0.16] p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/[0.42]">Ventas por dia</p>
                  <p className="text-sm font-black text-white">Ultimos 8 dias</p>
                </div>
                <div className="rounded-full border border-[#ffd36a]/[0.3] bg-[#ffd36a]/10 px-3 py-1 text-[9px] font-black text-[#ffd36a]">
                  {currency(dailySales.reduce((sum, day) => sum + day.revenue, 0))}
                </div>
              </div>
              <div className="h-[225px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailySales} barGap={8}>
                    <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.42)", fontSize: 10, fontWeight: 700 }} />
                    <YAxis hide />
                    <Tooltip
                      cursor={{ fill: "rgba(255,255,255,0.04)" }}
                      content={({ active, payload, label }: ChartTooltipProps) => active && payload?.length ? (
                        <div className="rounded-2xl border border-white/10 bg-[#161018]/[0.9] px-3 py-2 text-xs shadow-xl backdrop-blur-xl">
                          <p className="font-black text-white">{label}</p>
                          <p className="mt-1 font-bold text-[#ffd36a]">{currency(tooltipNumber(payload[0]?.value))}</p>
                        </div>
                      ) : null}
                    />
                    <Bar dataKey="revenue" radius={[10, 10, 4, 4]} fill="#f4c46e" />
                    <Bar dataKey="tickets" radius={[10, 10, 4, 4]} fill="#7ba7ff" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[22px] border border-white/[0.08] bg-black/[0.16] p-4">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/[0.42]">Estado</p>
                  <Activity className="h-4 w-4 text-[#ffd36a]" />
                </div>
                <div className="h-[130px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusBars}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.42)", fontSize: 10, fontWeight: 800 }} />
                      <YAxis hide />
                      <Tooltip
                        cursor={{ fill: "rgba(255,255,255,0.04)" }}
                        content={({ active, payload, label }: ChartTooltipProps) => active && payload?.length ? (
                          <div className="rounded-xl border border-white/10 bg-[#161018]/[0.9] px-3 py-2 text-xs shadow-xl backdrop-blur-xl">
                            <p className="font-black text-white">{label}</p>
                            <p className="font-bold text-[#ffd36a]">{tooltipNumber(payload[0]?.value)}</p>
                          </div>
                        ) : null}
                      />
                      <Bar dataKey="value" radius={[9, 9, 4, 4]} fill="#f4c46e" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-[22px] border border-white/[0.08] bg-black/[0.16] p-4">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/[0.42]">Tendencia</p>
                  <Sparkles className="h-4 w-4 text-[#ff8a9d]" />
                </div>
                <div className="h-[130px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendLine}>
                      <XAxis hide dataKey="name" />
                      <YAxis hide />
                      <Tooltip
                        cursor={{ stroke: "rgba(255,255,255,0.1)" }}
                        content={({ active, payload, label }: ChartTooltipProps) => active && payload?.length ? (
                          <div className="rounded-xl border border-white/10 bg-[#161018]/[0.9] px-3 py-2 text-xs shadow-xl backdrop-blur-xl">
                            <p className="font-black text-white">{label}</p>
                            <p className="font-bold text-[#ffb0bd]">{tooltipNumber(payload[0]?.value)} tickets</p>
                          </div>
                        ) : null}
                      />
                      <Line type="monotone" dataKey="value" stroke="#ffb0bd" strokeWidth={3} dot={{ r: 3, fill: "#ffd36a", strokeWidth: 0 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <div className="space-y-5">
          <EventCarousel events={events} />
          <div className="rounded-[24px] border border-white/10 bg-[#17131c]/[0.62] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_22px_60px_rgba(0,0,0,0.18)] backdrop-blur-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/[0.45]">Clientes</p>
                <p className="text-base font-black text-white">Top compradores</p>
              </div>
              <WalletCards className="h-4 w-4 text-[#ffd36a]" />
            </div>
            <div className="space-y-3">
              {topClients.length === 0 ? (
                <p className="py-8 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-white/[0.35]">Sin clientes todavia</p>
              ) : topClients.map((client, index) => (
                <div key={client.phone || client.name} className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.06] px-3 py-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${cardPalettes[index % cardPalettes.length]} text-xs font-black text-white`}>
                    {client.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-black text-white">{client.name}</p>
                    <p className="text-[9px] font-bold text-white/[0.42]">{client.tickets} entradas</p>
                  </div>
                  <p className="text-sm font-black text-[#ffd36a]">{currency(client.spent)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <VentasCard totalRevenue={totalRevenue} totalTicketsSold={totalTicketsSold} pendingCount={stats.pendientes} approvedCount={stats.aprobados} />

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.18 }}
        className="relative overflow-hidden rounded-[26px] border border-white/10 bg-[#18131d]/[0.62] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_24px_70px_rgba(0,0,0,0.2)] backdrop-blur-2xl"
      >
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/[0.42]">Entradas</p>
            <p className="text-xl font-black text-white">Comprobantes</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/[0.35]" />
              <input
                type="text"
                placeholder="Buscar..."
                className="h-10 w-full rounded-full border border-white/10 bg-white/[0.08] px-9 text-[10px] font-bold text-white outline-none transition placeholder:text-white/30 focus:border-[#ffd36a]/[0.45] sm:w-52"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-1.5 rounded-full border border-white/[0.08] bg-black/[0.16] p-1">
              {(["todas", "pendiente", "aprobado", "rechazado"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => { setFilterStatus(filter); setSelected(null); }}
                  className={`rounded-full px-3 py-2 text-[8px] font-black uppercase tracking-[0.08em] transition ${
                    filterStatus === filter
                      ? "bg-[#ffd36a] text-[#1d130a]"
                      : "text-white/[0.45] hover:bg-white/[0.08] hover:text-white"
                  }`}
                >
                  {filter === "todas" ? "Todas" : filter === "pendiente" ? "Pendientes" : filter === "aprobado" ? "Aprobadas" : "Rechazadas"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredReceipts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[22px] border border-dashed border-white/10 bg-black/[0.14] py-14 text-white/[0.35]">
            <ShieldCheck className="mb-3 h-10 w-10" />
            <p className="text-xs font-bold uppercase tracking-[0.12em]">No hay comprobantes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReceipts.map((receipt) => (
              <motion.div
                key={receipt.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="overflow-hidden rounded-[20px] border border-white/[0.08] bg-white/[0.06] transition-all duration-300 hover:border-white/[0.18]"
              >
                <div className="p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
                        receipt.status === "aprobado" ? "border-[#8ff0aa]/[0.22] bg-[#8ff0aa]/[0.12]" :
                        receipt.status === "rechazado" ? "border-[#ff8a9d]/[0.22] bg-[#ff8a9d]/[0.12]" : "border-[#ffd36a]/25 bg-[#ffd36a]/[0.12]"
                      }`}>
                        {receipt.status === "aprobado" ? <FileCheck className="h-5 w-5 text-[#9ff0b5]" /> :
                         receipt.status === "rechazado" ? <FileX className="h-5 w-5 text-[#ff9bad]" /> : <ShieldAlert className="h-5 w-5 text-[#ffd36a]" />}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-white">{receipt.firstName} {receipt.lastName}</p>
                        <p className="mt-0.5 text-[9px] font-bold text-white/[0.42]">
                          {receipt.phone} / {receipt.quantity} entrada{receipt.quantity !== 1 ? "s" : ""} / {formatDateLabel(receipt.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      {statusBadge(receipt.status)}
                      <button
                        onClick={() => setSelected(selected?.id === receipt.id ? null : receipt)}
                        className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all ${
                          selected?.id === receipt.id
                            ? "border-[#ffd36a]/[0.35] bg-[#ffd36a]/[0.12] text-[#ffd36a]"
                            : "border-white/10 bg-white/[0.08] text-white/[0.45] hover:text-white"
                        }`}
                        aria-label="Ver comprobante"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {selected?.id === receipt.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                        <div className="mt-4 border-t border-white/[0.08] pt-4">
                          <div className="grid gap-4 lg:grid-cols-[0.85fr_1fr]">
                            <div>
                              <p className="mb-2 text-[8px] font-black uppercase tracking-[0.18em] text-white/[0.38]">Comprobante</p>
                              <div className="flex min-h-56 items-center justify-center rounded-[18px] border border-white/[0.08] bg-black/[0.18] p-4">
                                {receipt.mimeType === "application/pdf" ? (
                                  <div className="flex flex-col items-center gap-2 py-6">
                                    <FileCheck className="h-8 w-8 text-white/[0.35]" />
                                    <p className="text-[8px] font-bold text-white/[0.35]">PDF</p>
                                  </div>
                                ) : (
                                  <img src={`/api/access-drop/receipts/${receipt.id}?file=true`} alt="" className="max-h-60 rounded-2xl object-contain" />
                                )}
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div className="rounded-[18px] border border-white/[0.08] bg-black/[0.18] p-4">
                                <div className="grid gap-3 sm:grid-cols-2">
                                  {[
                                    ["Cliente", `${receipt.firstName} ${receipt.lastName}`],
                                    ["Telefono", receipt.phone],
                                    ["Email", receipt.email || "-"],
                                    ["Documento", receipt.documentNumber || "-"],
                                    ["Entradas", `${receipt.quantity}`],
                                    ["Metodo", receipt.paymentMethod],
                                    ["Serial", receipt.serialNumber || "-"],
                                    ["Envio", receipt.deliveryChannel ? `${receipt.deliveryChannel} / ${receipt.deliveryStatus || "-"}` : "-"],
                                  ].map(([label, value]) => (
                                    <div key={label} className="rounded-2xl border border-white/[0.08] bg-white/[0.05] px-3 py-2">
                                      <p className="text-[7px] font-black uppercase tracking-[0.16em] text-white/[0.32]">{label}</p>
                                      <p className="mt-1 break-words text-[10px] font-bold text-white/[0.78]">{value}</p>
                                    </div>
                                  ))}
                                </div>
                                {receipt.status === "rechazado" && receipt.rejectionReason && (
                                  <p className="mt-3 text-[9px] font-bold text-[#ff9bad]">
                                    Motivo: {REJECTION_REASONS.find((reason) => reason.id === receipt.rejectionReason)?.label || receipt.rejectionReason}
                                  </p>
                                )}
                              </div>

                              {receipt.status === "pendiente" && !showRejectOptions && (
                                <div className="flex flex-col gap-3 sm:flex-row">
                                  <button
                                    onClick={() => handleApprove(receipt.id)}
                                    disabled={reviewing}
                                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#8ff0aa] py-3 text-[10px] font-black uppercase tracking-[0.1em] text-[#062510] transition hover:bg-[#aaf8bf] disabled:opacity-50"
                                  >
                                    {reviewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Aprobar
                                  </button>
                                  <button
                                    onClick={() => { setShowRejectOptions(true); setRejectReason(null); }}
                                    disabled={reviewing}
                                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#ff8a9d] py-3 text-[10px] font-black uppercase tracking-[0.1em] text-[#351014] transition hover:bg-[#ff9bad] disabled:opacity-50"
                                  >
                                    <FileX className="h-4 w-4" /> Rechazar
                                  </button>
                                </div>
                              )}

                              {showRejectOptions && (
                                <div>
                                  <p className="mb-2 text-[8px] font-black uppercase tracking-[0.18em] text-white/[0.38]">Motivo del rechazo</p>
                                  <div className="space-y-1.5">
                                    {REJECTION_REASONS.map((reason) => (
                                      <button
                                        key={reason.id}
                                        onClick={() => setRejectReason(reason.id)}
                                        className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2.5 text-left transition ${
                                          rejectReason === reason.id
                                            ? "border-[#ff8a9d]/[0.42] bg-[#ff8a9d]/[0.12] text-white"
                                            : "border-white/[0.08] bg-white/[0.05] text-white/[0.52] hover:border-white/[0.16]"
                                        }`}
                                      >
                                        <div>
                                          <p className="text-[9px] font-bold uppercase tracking-[0.1em]">{reason.label}</p>
                                          <p className="text-[7px] text-white/[0.34]">{reason.description}</p>
                                        </div>
                                        {rejectReason === reason.id && <Check className="h-3.5 w-3.5 shrink-0 text-[#ff9bad]" />}
                                      </button>
                                    ))}
                                  </div>
                                  <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                                    <button
                                      onClick={() => { setShowRejectOptions(false); setRejectReason(null); }}
                                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.07] py-3 text-[10px] font-black uppercase tracking-[0.1em] text-white/[0.55] transition hover:text-white"
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      onClick={() => rejectReason && handleReject(receipt.id, rejectReason)}
                                      disabled={!rejectReason || reviewing}
                                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#ff8a9d] py-3 text-[10px] font-black uppercase tracking-[0.1em] text-[#351014] transition hover:bg-[#ff9bad] disabled:opacity-50"
                                    >
                                      {reviewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />} Enviar
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>
    </div>
  );
}

function AdminDashboardInner({ onLogout, onOpenDesigner }: { onLogout: () => void; onOpenDesigner: () => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [receipts, setReceipts] = useState<ReceiptRecord[]>([]);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [clock, setClock] = useState("");
  const [greeting, setGreeting] = useState("");
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [receiptRes, eventRes] = await Promise.all([
        fetch("/api/access-drop/receipts"),
        fetch("/api/admin/events"),
      ]);
      const receiptData = await receiptRes.json();
      const eventData = await eventRes.json();
      setReceipts(receiptData.receipts || []);
      setEvents(eventData.events || []);
    } catch (err) {
      console.error("Error loading data:", err);
      toast("error", "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  useEffect(() => {
    const update = () => {
      const date = new Date();
      setClock(date.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" }));
      const hour = date.getHours();
      setGreeting(hour < 12 ? "Buenos dias" : hour < 18 ? "Buenas tardes" : "Buenas noches");
    };
    update();
    const timer = setInterval(update, 10000);
    return () => clearInterval(timer);
  }, []);

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardContent receipts={receipts} events={events} onRefresh={loadData} />;
      case "entradas":
        return (
          <div className="space-y-5 p-4 md:p-6">
            <TicketDesignsManager events={events} />
          </div>
        );
      case "qr-control":
        return <QrControlSection />;
      case "eventos":
        return <EventsSection events={events} onEventsChange={loadData} />;
      case "ventas":
        return <VentasSection receipts={receipts} />;
      case "clientes":
        return <ClientsSection receipts={receipts} />;
      case "homepage":
        return <HomepageEditor />;
      case "ajustes":
        return <SettingsSection />;
      default:
        return <DashboardContent receipts={receipts} events={events} onRefresh={loadData} />;
    }
  };

  const sectionLabel = SIDEBAR_ITEMS.find((item) => item.id === activeSection)?.label || "Dashboard";

  return (
    <div className="relative z-10 flex min-h-[calc(100vh-2rem)] w-full overflow-hidden rounded-[32px] border border-white/[0.18] bg-[#120d14]/[0.74] shadow-[0_32px_140px_rgba(0,0,0,0.42)] backdrop-blur-3xl md:min-h-[calc(100vh-3rem)]">
      <aside className={`hidden shrink-0 flex-col border-r border-white/[0.08] bg-black/40 transition-[width] duration-500 md:flex ${sidebarOpen ? "w-60" : "w-[84px]"}`}>
        <div className="flex h-20 items-center gap-3 px-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.18] bg-white/10">
            <Zap className="h-5 w-5 text-[#ffd36a]" />
          </div>
          {sidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="text-sm font-black tracking-[0.14em] text-white">NENEZ</p>
              <p className="text-[8px] font-bold uppercase tracking-[0.22em] text-white/[0.42]">Admin</p>
            </motion.div>
          )}
        </div>

        <nav className="flex-1 space-y-1 px-3 py-3">
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === "cerrar-sesion") {
                  onLogout();
                } else {
                  setActiveSection(item.id);
                }
              }}
              className={`flex w-full items-center gap-3 rounded-full px-4 py-3 text-[10px] font-black uppercase tracking-[0.08em] transition-all duration-300 ${
                item.id === "cerrar-sesion"
                  ? "border border-white/10 bg-white/[0.07] text-white/[0.55] hover:border-[#ff8a9d]/[0.35] hover:bg-[#ff8a9d]/10 hover:text-[#ffb0bd]"
                  : activeSection === item.id
                    ? "bg-[#69c7ff] text-[#07131b] shadow-[0_12px_28px_rgba(105,199,255,0.18)]"
                    : "text-white/[0.56] hover:bg-white/[0.08] hover:text-white"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute left-[calc(var(--sidebar-left,0px)+100%)] top-20 hidden h-7 w-7 -translate-x-3 items-center justify-center rounded-full border border-white/[0.12] bg-[#17111a] text-white/[0.45] transition hover:text-white md:flex"
        >
          <ChevronLeft className={`h-3.5 w-3.5 transition ${sidebarOpen ? "" : "rotate-180"}`} />
        </button>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#151019]/[0.72] backdrop-blur-3xl">
          <div className="flex min-h-20 flex-col gap-3 px-4 py-4 md:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-white/[0.55] transition hover:text-white"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div>
                <p className="text-lg font-black text-white">{sectionLabel}</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/[0.42]">{greeting}, Admin / {clock}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="hidden h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-4 text-[10px] font-bold text-white/[0.48] sm:flex">
                <Search className="h-3.5 w-3.5" />
                Admin search
              </div>
              <button
                onClick={loadData}
                className="flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 text-[9px] font-black uppercase tracking-[0.1em] text-white/[0.58] transition hover:text-white"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Sync
              </button>
              <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-white/[0.55] transition hover:text-white">
                <Bell className="h-4 w-4" />
                {receipts.some((receipt) => receipt.status === "pendiente") && (
                  <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-[#ff8a9d]" />
                )}
              </button>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#ffd36a] to-[#ff8a5b] text-[11px] font-black text-[#1d130a]">
                A
              </div>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto px-4 pb-4 md:hidden">
            {SIDEBAR_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "cerrar-sesion") {
                    onLogout();
                  } else {
                    setActiveSection(item.id);
                  }
                }}
                className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-[9px] font-black uppercase tracking-[0.08em] ${
                  item.id === "cerrar-sesion"
                    ? "border border-white/10 bg-white/[0.07] text-white/[0.55]"
                    : activeSection === item.id
                      ? "bg-[#69c7ff] text-[#07131b]"
                      : "border border-white/10 bg-white/[0.07] text-white/[0.55]"
                }`}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            ))}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex h-[62vh] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#ffd36a]" />
            </div>
          ) : (
            renderContent()
          )}
        </div>
      </main>
    </div>
  );
}

export default function AdminPage() {
  const [phase, setPhase] = useState<"splash" | "login" | "dashboard">("splash");
  const [showTicketDesigner, setShowTicketDesigner] = useState(false);

  return (
    <ToastProvider>
      <AnimatePresence mode="wait">
        {phase === "splash" && <SplashScreen key="splash" onDone={() => setPhase("login")} />}
        {phase === "login" && <LoginScreen key="login" onLogin={() => setPhase("dashboard")} />}
        {phase === "dashboard" && !showTicketDesigner && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative min-h-screen overflow-hidden bg-[#211519] p-4 text-white md:p-6"
          >
            <div className="absolute inset-0 bg-[linear-gradient(130deg,#080607_0%,#1f1218_34%,#8d5537_67%,#edb66b_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,230,170,0.22),transparent_45%),linear-gradient(180deg,rgba(0,0,0,0.12),rgba(0,0,0,0.36))]" />
            <AdminDashboardInner onLogout={() => setPhase("login")} onOpenDesigner={() => setShowTicketDesigner(true)} />
          </motion.div>
        )}
        {phase === "dashboard" && showTicketDesigner && (
          <motion.div
            key="ticket-designer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative min-h-screen overflow-hidden bg-[#211519] p-4 text-white md:p-6"
          >
            <div className="absolute inset-0 bg-[linear-gradient(130deg,#080607_0%,#1f1218_34%,#8d5537_67%,#edb66b_100%)]" />
            <div className="relative z-10 mx-auto max-w-7xl rounded-[30px] border border-white/[0.18] bg-[#120d14]/[0.76] p-5 shadow-[0_32px_140px_rgba(0,0,0,0.42)] backdrop-blur-3xl md:p-8">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/[0.42]">Herramientas</p>
                  <p className="text-xl font-black text-white">Disenador de Entradas</p>
                </div>
                <button
                  onClick={() => setShowTicketDesigner(false)}
                  className="flex h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-5 text-[10px] font-black uppercase tracking-[0.1em] text-white/60 transition hover:text-white"
                >
                  <ArrowUpRight className="h-4 w-4 rotate-180" /> Volver al Dashboard
                </button>
              </div>
              <TicketDesigner />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ToastProvider>
  );
}
