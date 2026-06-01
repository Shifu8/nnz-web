"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, LayoutDashboard, Ticket, Calendar, TrendingUp, Users, Settings,
  LogOut, Bell, Search, X, ChevronRight, ChevronLeft, ShieldCheck,
  ShieldAlert, FileCheck, FileX, Clock, Ban, Check, Eye, Loader2,
  ArrowUpRight, Menu, Palette, QrCode,
} from "lucide-react";
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

const ADMIN_CREDENTIALS = { user: "admin", pass: "dawgs2026" };

const SIDEBAR_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "entradas", label: "Entradas", icon: Ticket },
  { id: "eventos", label: "Eventos", icon: Calendar },
  { id: "qr-control", label: "QR Control", icon: QrCode },
  { id: "ventas", label: "Ventas", icon: TrendingUp },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "ajustes", label: "Ajustes", icon: Settings },
];



function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <motion.div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black" exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} className="flex flex-col items-center">
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-32 w-32 rounded-full bg-red-500/20 blur-3xl animate-pulse" />
          </div>
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-red-500/30 bg-black/60 shadow-[0_0_60px_rgba(255,0,24,0.3)]">
            <Zap className="h-12 w-12 text-red-500" />
          </div>
        </div>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.8 }} className="mt-6 text-4xl font-black text-white tracking-[0.2em]">DAWGS</motion.p>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.6 }} className="mt-2 text-[10px] font-bold uppercase tracking-[0.6em] text-zinc-600">Admin Panel</motion.p>
      </motion.div>
      <motion.div initial={{ width: 0 }} animate={{ width: 120 }} transition={{ delay: 0.8, duration: 1.5, ease: [0.16, 1, 0.3, 1] }} className="absolute bottom-20 h-[2px] rounded-full bg-gradient-to-r from-transparent via-red-500 to-transparent" />
    </motion.div>
  );
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user === ADMIN_CREDENTIALS.user && pass === ADMIN_CREDENTIALS.pass) { onLogin(); }
    else { setError(true); setTimeout(() => setError(false), 2000); }
  };
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-red-500/10 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-red-500/5 blur-[120px]" />
      </div>
      <button onClick={() => window.location.href = "/?menu=access"} className="absolute top-6 left-6 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl px-4 py-3 text-[10px] font-black uppercase tracking-wider text-zinc-400 transition hover:text-white hover:border-white/20 z-10">
        <ArrowUpRight className="h-4 w-4 rotate-180" /> Volver
      </button>
      <motion.div initial={{ opacity: 0, scale: 0.92, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
        <div className="relative w-[400px] overflow-hidden rounded-[32px] border border-white/[0.08] bg-white/[0.03] backdrop-blur-2xl p-10 shadow-[0_0_80px_rgba(255,0,24,0.08)]">
          <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-950/50 border border-red-500/20"><Zap className="h-6 w-6 text-red-400" /></div>
              <div><p className="text-lg font-black text-white tracking-[0.15em]">DAWGS</p><p className="text-[8px] font-bold uppercase tracking-[0.3em] text-zinc-500">Admin Access</p></div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">Usuario</p>
                <input required value={user} onChange={(e) => setUser(e.target.value)} placeholder="admin" className="w-full rounded-2xl border border-white/10 bg-black/50 px-5 py-4 text-sm font-bold text-white placeholder-zinc-800 outline-none transition focus:border-red-500/50" />
              </div>
              <div className="space-y-1.5">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">Contraseña</p>
                <input required type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" className="w-full rounded-2xl border border-white/10 bg-black/50 px-5 py-4 text-sm font-bold text-white placeholder-zinc-800 outline-none transition focus:border-red-500/50" />
              </div>
              {error && <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-[10px] font-bold text-red-400">Credenciales incorrectas</motion.p>}
              <button type="submit" className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-red-600 text-sm font-black uppercase tracking-[0.2em] text-white shadow-[0_0_30px_rgba(255,0,24,0.3)] transition hover:bg-red-500 hover:shadow-[0_0_50px_rgba(255,0,24,0.5)]">
                INGRESAR <ArrowUpRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

const statusBadge = (status: ReceiptStatus) => {
  switch (status) {
    case "pendiente": return <span className="rounded-full border border-amber-500/30 bg-amber-950/30 px-2.5 py-1 text-[9px] font-black text-amber-400 uppercase tracking-wider shadow-[0_0_12px_rgba(251,191,36,0.15)]">PENDIENTE</span>;
    case "aprobado": return <span className="rounded-full border border-green-500/30 bg-green-950/30 px-2.5 py-1 text-[9px] font-black text-green-400 uppercase tracking-wider shadow-[0_0_12px_rgba(34,197,94,0.15)]">APROBADO</span>;
    case "rechazado": return <span className="rounded-full border border-red-500/30 bg-red-950/30 px-2.5 py-1 text-[9px] font-black text-red-400 uppercase tracking-wider shadow-[0_0_12px_rgba(239,68,68,0.15)]">RECHAZADO</span>;
  }
};

/* Fixed StatsCard — shows plain number or $ prefix based on `isCurrency` prop */
function StatsCard({ label, value, icon: Icon, color, isCurrency, sub }: {
  label: string; value: number; icon: any; color: string; isCurrency?: boolean; sub?: string;
}) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const step = Math.ceil(value / 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(start);
    }, 25);
    return () => clearInterval(timer);
  }, [value]);
  return (
    <motion.div whileHover={{ y: -4 }} className="group relative overflow-hidden rounded-3xl border border-white/[0.1] bg-white/[0.05] backdrop-blur-2xl p-6 transition-all duration-500 hover:border-white/20 hover:shadow-[0_0_50px_rgba(255,255,255,0.04)]">
      <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-red-500/5 blur-[80px] group-hover:bg-red-500/10 transition-all duration-700" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className={`text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400`}>{label}</p>
          <p className={`mt-2 text-4xl font-black ${color}`}>
            {isCurrency ? `$${display.toLocaleString()}` : display.toLocaleString()}
          </p>
          {sub && <p className="mt-1 text-[9px] font-bold text-zinc-500">{sub}</p>}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-2xl ${color}`}>
          <Icon className="h-5 w-5" />
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
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.1] bg-white/[0.04] backdrop-blur-2xl p-6 shadow-[0_0_60px_rgba(0,0,0,0.2)]">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      <p className="relative text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-4">Eventos</p>
      <div className="relative h-[280px]">
        {events.map((ev, i) => {
          const offset = i - activeIdx;
          const isActive = i === activeIdx;
          return (
            <motion.div
              key={ev.id}
              animate={{ x: offset * 60, scale: isActive ? 1 : 0.88, opacity: isActive ? 1 : 0.3 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`absolute inset-0 rounded-2xl overflow-hidden cursor-pointer ${isActive ? "z-10" : "z-0"}`}
              onClick={() => setActiveIdx(i)}
              style={{ pointerEvents: isActive ? "auto" : "none" }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-950/20 to-black/90" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,0,24,0.08),transparent_60%)]" />
              <div className="relative h-full flex flex-col justify-end p-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-red-400">{ev.subtitle}</p>
                <p className="text-3xl md:text-4xl font-black text-white tracking-tight mt-1">{ev.title}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                  <span>{ev.date}</span>
                  <span>{ev.location}</span>
                  <span>{ev.time}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      <div className="flex items-center justify-between mt-4">
        <div className="flex gap-2">
          {events.map((_, i) => (
            <button key={i} onClick={() => setActiveIdx(i)} className={`h-1.5 rounded-full transition-all duration-500 ${i === activeIdx ? "w-8 bg-red-500" : "w-1.5 bg-zinc-700"}`} />
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={prev} className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-zinc-400 hover:text-white transition"><ChevronLeft className="h-4 w-4" /></button>
          <button onClick={next} className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-zinc-400 hover:text-white transition"><ChevronRight className="h-4 w-4" /></button>
        </div>
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

  const filteredReceipts = receipts.filter((r) => {
    if (filterStatus !== "todas" && r.status !== filterStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const name = `${r.firstName} ${r.lastName}`.toLowerCase();
      const phone = r.phone.toLowerCase();
      if (!name.includes(q) && !phone.includes(q)) return false;
    }
    return true;
  });

  const stats = {
    total: receipts.length,
    pendientes: receipts.filter((r) => r.status === "pendiente").length,
    aprobados: receipts.filter((r) => r.status === "aprobado").length,
    rechazados: receipts.filter((r) => r.status === "rechazado").length,
  };

  const totalRevenue = receipts.filter((r) => r.status === "aprobado").reduce((s, r) => s + (r.quantity || 0) * 10, 0);
  const totalTicketsSold = receipts.filter((r) => r.status === "aprobado").reduce((s, r) => s + (r.quantity || 0), 0);

  const handleApprove = async (id: string) => {
    setReviewing(true);
    try {
      const res = await fetch(`/api/access-drop/receipts/${id}/review`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "aprobado", reviewedBy: "admin" }),
      });
      const data = await res.json();
      if (data.success) { setSelected(null); toast("success", "Comprobante aprobado", "La entrada se generó y envió."); onRefresh(); }
    } catch { toast("error", "Error al aprobar"); }
    finally { setReviewing(false); }
  };

  const handleReject = async (id: string, reason: string) => {
    setReviewing(true);
    try {
      const res = await fetch(`/api/access-drop/receipts/${id}/review`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rechazado", reviewedBy: "admin", rejectionReason: reason }),
      });
      const data = await res.json();
      if (data.success) { setSelected(null); setShowRejectOptions(false); setRejectReason(null); toast("success", "Comprobante rechazado", "Se notificó al usuario."); onRefresh(); }
    } catch { toast("error", "Error al rechazar"); }
    finally { setReviewing(false); }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Stats Grid — fixed metrics */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="grid grid-cols-3 gap-4">
        <StatsCard label="Aprobadas" value={stats.aprobados} icon={FileCheck} color="text-green-400" sub="comprobantes" />
        <StatsCard label="Pendientes" value={stats.pendientes} icon={Clock} color="text-amber-400" sub="comprobantes" />
        <StatsCard label="Rechazadas" value={stats.rechazados} icon={Ban} color="text-red-400" sub="comprobantes" />
      </motion.div>

      {/* Premium Ventas Totales Card */}
      <VentasCard totalRevenue={totalRevenue} totalTicketsSold={totalTicketsSold} pendingCount={stats.pendientes} approvedCount={stats.aprobados} />

      {/* Events Carousel */}
      <EventCarousel events={events} />

      {/* Comprobantes List */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="relative overflow-hidden rounded-3xl border border-white/[0.1] bg-white/[0.04] backdrop-blur-2xl p-6 shadow-[0_0_60px_rgba(0,0,0,0.2)]">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
        <div className="relative flex items-center justify-between mb-6">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400">Entradas</p>
            <p className="text-xl font-black text-white mt-1">Comprobantes</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
              <input type="text" placeholder="Buscar..." className="w-44 rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl px-8 py-2.5 text-[9px] font-bold text-white placeholder-zinc-600 outline-none transition focus:border-red-500/50" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            {/* Filter tabs */}
            <div className="flex gap-1">
              {(["todas", "pendiente", "aprobado", "rechazado"] as const).map((f) => (
                <button key={f} onClick={() => { setFilterStatus(f); setSelected(null); }}
                  className={`rounded-xl px-3 py-2 text-[8px] font-black uppercase tracking-wider transition-all ${
                    filterStatus === f ? "bg-red-600 text-white shadow-[0_0_20px_rgba(255,0,24,0.2)]" : "border border-white/10 bg-white/[0.04] backdrop-blur-xl text-zinc-500 hover:border-white/20"
                  }`}
                >
                  {f === "todas" ? "Todas" : f === "pendiente" ? "Pendientes" : f === "aprobado" ? "Aprobadas" : "Rechazadas"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredReceipts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
            <ShieldCheck className="h-10 w-10 mb-3" />
            <p className="text-xs font-bold uppercase tracking-wider">No hay comprobantes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReceipts.map((receipt) => (
              <motion.div
                key={receipt.id} layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl hover:border-white/20 transition-all duration-500 overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
                        receipt.status === "aprobado" ? "border-green-500/20 bg-green-500/10" :
                        receipt.status === "rechazado" ? "border-red-500/20 bg-red-500/10" : "border-amber-500/20 bg-amber-500/10"
                      }`}>
                        {receipt.status === "aprobado" ? <FileCheck className="h-5 w-5 text-green-400" /> :
                         receipt.status === "rechazado" ? <FileX className="h-5 w-5 text-red-400" /> : <ShieldAlert className="h-5 w-5 text-amber-400" />}
                      </div>
                      <div>
                        <p className="text-sm font-black text-white tracking-wider">{receipt.firstName} {receipt.lastName}</p>
                        <p className="text-[9px] text-zinc-500 mt-0.5">{receipt.phone} · {receipt.quantity} entrada{receipt.quantity !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {statusBadge(receipt.status)}
                      <button onClick={() => setSelected(selected?.id === receipt.id ? null : receipt)} className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${
                        selected?.id === receipt.id ? "border-red-500/30 bg-red-500/10 text-red-400" : "border-white/10 bg-white/[0.04] backdrop-blur-xl text-zinc-500 hover:text-white"
                      }`}>
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {selected?.id === receipt.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                        <div className="mt-4 pt-4 border-t border-white/[0.06]">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <p className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2">Comprobante</p>
                              <div className="flex items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-4">
                                {receipt.mimeType === "application/pdf" ? (
                                  <div className="flex flex-col items-center gap-2 py-6"><FileCheck className="h-8 w-8 text-zinc-600" /><p className="text-[8px] font-bold text-zinc-600">PDF</p></div>
                                ) : (
                                  <img src={`/api/access-drop/receipts/${receipt.id}?file=true`} alt="" className="max-h-48 rounded-xl object-contain" />
                                )}
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-4 space-y-2">
                                <p className="text-[9px] font-bold text-white">{receipt.firstName} {receipt.lastName}</p>
                                <p className="text-[8px] text-zinc-500">📞 {receipt.phone}</p>
                                {receipt.email && <p className="text-[8px] text-zinc-500">📧 {receipt.email}</p>}
                                {receipt.documentNumber && <p className="text-[8px] text-zinc-500">🆔 {receipt.documentNumber}</p>}
                                <p className="text-[8px] text-zinc-500">🎫 {receipt.quantity} entrada(s)</p>
                                <p className="text-[8px] text-zinc-500">🏦 {receipt.paymentMethod}</p>
                                {receipt.serialNumber && <p className="text-[8px] text-green-400 font-bold">✅ Serial: {receipt.serialNumber}</p>}
                                {receipt.status === "rechazado" && receipt.rejectionReason && (
                                  <p className="text-[8px] text-red-400 font-bold">❌ Motivo: {REJECTION_REASONS.find((r) => r.id === receipt.rejectionReason)?.label || receipt.rejectionReason}</p>
                                )}
                              </div>

                              {receipt.status === "pendiente" && !showRejectOptions && (
                                <div className="flex gap-3">
                                  <button onClick={() => handleApprove(receipt.id)} disabled={reviewing} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-green-600 py-3 text-[10px] font-black uppercase tracking-wider text-white transition hover:bg-green-500 disabled:opacity-50 shadow-[0_0_20px_rgba(34,197,94,0.15)]">
                                    {reviewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} APROBAR
                                  </button>
                                  <button onClick={() => { setShowRejectOptions(true); setRejectReason(null); }} disabled={reviewing} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-600 py-3 text-[10px] font-black uppercase tracking-wider text-white transition hover:bg-red-500 disabled:opacity-50 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
                                    <FileX className="h-4 w-4" /> RECHAZAR
                                  </button>
                                </div>
                              )}

                              {showRejectOptions && (
                                <div>
                                  <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-2">Motivo del rechazo</p>
                                  <div className="space-y-1">
                                    {REJECTION_REASONS.map((r) => (
                                      <button key={r.id} onClick={() => setRejectReason(r.id)}
                                        className={`w-full flex items-center justify-between rounded-xl border px-3 py-2.5 text-left transition ${
                                          rejectReason === r.id ? "border-red-500/40 bg-red-500/10 text-white" : "border-white/[0.08] bg-white/[0.03] backdrop-blur-xl text-zinc-400 hover:border-white/20"
                                        }`}
                                      >
                                        <div>
                                          <p className="text-[9px] font-bold uppercase tracking-wider">{r.label}</p>
                                          <p className="text-[7px] text-zinc-600">{r.description}</p>
                                        </div>
                                        {rejectReason === r.id && <Check className="h-3.5 w-3.5 text-red-400 shrink-0" />}
                                      </button>
                                    ))}
                                  </div>
                                  <div className="flex gap-3 mt-3">
                                    <button onClick={() => { setShowRejectOptions(false); setRejectReason(null); }} className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl py-3 text-[10px] font-black uppercase tracking-wider text-zinc-500 hover:text-white transition">CANCELAR</button>
                                    <button onClick={() => rejectReason && handleReject(receipt.id, rejectReason)} disabled={!rejectReason || reviewing} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-600 py-3 text-[10px] font-black uppercase tracking-wider text-white transition hover:bg-red-500 disabled:opacity-50 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
                                      {reviewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />} ENVIAR RECHAZO
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
      </motion.div>
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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const update = () => {
      const d = new Date();
      setClock(d.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" }));
      const h = d.getHours();
      setGreeting(h < 12 ? "Buenos días" : h < 18 ? "Buenas tardes" : "Buenas noches");
    };
    update();
    const t = setInterval(update, 10000);
    return () => clearInterval(t);
  }, []);

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardContent receipts={receipts} events={events} onRefresh={loadData} />;
      case "entradas":
        return <DashboardContent receipts={receipts} events={events} onRefresh={loadData} />;
      case "qr-control":
        return <QrControlSection />;
      case "eventos":
        return <EventsSection events={events} onEventsChange={loadData} />;
      case "ventas":
        return <VentasSection receipts={receipts} />;
      case "clientes":
        return <ClientsSection receipts={receipts} />;
      case "ajustes":
        return <SettingsSection />;
      default:
        return <DashboardContent receipts={receipts} events={events} onRefresh={loadData} />;
    }
  };

  const sectionLabel = SIDEBAR_ITEMS.find((i) => i.id === activeSection)?.label || "Dashboard";

  return (
    <>
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed left-0 top-0 z-40 h-screen backdrop-blur-3xl border-r border-white/[0.08] bg-white/[0.03] flex flex-col transition-all duration-500 ${sidebarOpen ? "w-60" : "w-20"}`}
      >
        <div className="flex items-center gap-3 px-5 h-20 border-b border-white/[0.06]">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-500/20 to-red-950/30 border border-red-500/20 shadow-[0_0_15px_rgba(255,0,24,0.1)]">
            <Zap className="h-5 w-5 text-red-400" />
          </div>
          {sidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-sm font-black text-white tracking-[0.15em]">DAWGS</p>
              <p className="text-[7px] font-bold uppercase tracking-[0.3em] text-zinc-500">Admin</p>
            </motion.div>
          )}
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                activeSection === item.id
                  ? "bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_20px_rgba(255,0,24,0.1)]"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05]"
              }`}
            >
              <item.icon className={`h-4 w-4 shrink-0 ${activeSection === item.id ? "text-red-400" : ""}`} />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        {/* Tools + Logout */}
        <div className="px-3 pb-4 pt-3 border-t border-white/[0.06] space-y-1">
          <button onClick={onOpenDesigner} className="flex w-full items-center gap-3 rounded-2xl border border-[#C8FF00]/20 bg-[#C8FF00]/5 backdrop-blur-xl px-4 py-3 text-[10px] font-black uppercase tracking-wider text-[#C8FF00] transition-all duration-300 hover:bg-[#C8FF00]/10 hover:border-[#C8FF00]/40">
            <Palette className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span>Diseñar Entrada</span>}
          </button>
          <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl px-4 py-3 text-[10px] font-black uppercase tracking-wider text-zinc-300 transition-all duration-300 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400">
            <LogOut className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span>Cerrar Sesión</span>}
          </button>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-zinc-900/80 backdrop-blur-xl text-zinc-500 hover:text-white transition">
          <ChevronLeft className={`h-3 w-3 transition ${sidebarOpen ? "" : "rotate-180"}`} />
        </button>
      </motion.aside>

      {/* Main */}
      <div className={`flex-1 transition-all duration-500 ${sidebarOpen ? "ml-60" : "ml-20"}`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 backdrop-blur-3xl border-b border-white/[0.08] bg-white/[0.03]">
          <div className="flex items-center justify-between px-6 h-20">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-400 hover:text-white transition backdrop-blur-xl">
                <Menu className="h-4 w-4" />
              </button>
              <div>
                <p className="text-sm font-black text-white">{greeting}, Admin</p>
                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">{clock} · {sectionLabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-400 hover:text-white transition backdrop-blur-xl">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(255,0,24,0.5)]" />
              </button>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500/20 to-red-950/30 border border-red-500/20 text-[11px] font-black text-red-400 shadow-[0_0_15px_rgba(255,0,24,0.1)]">A</div>
            </div>
          </div>
        </header>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-red-500" />
          </div>
        ) : (
          renderContent()
        )}
      </div>
    </>
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
          <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen text-white flex relative">
            {/* Ambient background */}
            <div className="fixed inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black" />
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,0,24,0.06),transparent_50%)]" />
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(200,255,0,0.03),transparent_50%)]" />
            <AdminDashboardInner onLogout={() => setPhase("login")} onOpenDesigner={() => setShowTicketDesigner(true)} />
          </motion.div>
        )}
        {phase === "dashboard" && showTicketDesigner && (
          <motion.div key="ticket-designer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen text-white relative">
            <div className="fixed inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black" />
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,0,24,0.06),transparent_50%)]" />
            <div className="max-w-7xl mx-auto px-6 py-8 relative">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400">Herramientas</p>
                  <p className="text-xl font-black text-white mt-1">Diseñador de Entradas</p>
                </div>
                <button onClick={() => setShowTicketDesigner(false)}
                  className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl px-5 py-3 text-[10px] font-black uppercase tracking-wider text-zinc-400 transition hover:text-white"
                >
                  <ArrowUpRight className="h-4 w-4" /> Volver al Dashboard
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
