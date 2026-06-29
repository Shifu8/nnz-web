"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  QrCode,
  RefreshCw,
  GraduationCap,
  TicketCheck,
  Plus,
  X,
  Loader2,
  Check,
  ShieldAlert,
  Download,
  Users,
  TrendingUp,
  Trophy,
  Medal,
  PieChart,
  ChevronDown,
} from "lucide-react";
import { useToast } from "./Toast";

type CareerEntry = {
  id: string;
  label: string;
  patterns: string[];
};

type ClearScope = "entry" | "carnet" | "all";

type StatsData = {
  totalEscaneos: number;
  escaneadosHoy: number;
  entradasUsadas: number;
  porCarrera: Record<string, number>;
};

type EventOption = {
  id: string;
  title: string;
  subtitle: string;
};

export default function QrControlSection() {
  const [careers, setCareers] = useState<CareerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState<ClearScope | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ id: "", label: "", patterns: "" });
  const { toast } = useToast();

  const [stats, setStats] = useState<StatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [eventOptions, setEventOptions] = useState<EventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("trap-loud");
  const [showEventDropdown, setShowEventDropdown] = useState(false);

  const authHeader = Buffer.from("admin:nenez2026").toString("base64");
  const authOpts = { headers: { Authorization: `Bearer ${authHeader}` } };

  const loadCareers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/qr/careers");
      const data = await res.json();
      setCareers(data.careers || []);
    } catch {
      toast("error", "Error al cargar carreras");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadStats = useCallback(async (eventId: string) => {
    setStatsLoading(true);
    try {
      const res = await fetch(`/api/admin/qr/stats?eventId=${eventId}`, authOpts);
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch {
      // silent
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/qr/events", authOpts);
      const data = await res.json();
      if (data.success) {
        const opts = data.events.map((e: any) => ({
          id: e.slug || e.id,
          title: e.title,
          subtitle: e.subtitle,
        }));
        setEventOptions(opts);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => { loadCareers(); }, [loadCareers]);
  useEffect(() => { loadEvents(); }, [loadEvents]);
  useEffect(() => { loadStats(selectedEventId); }, [selectedEventId, loadStats]);

  const refreshAll = () => {
    loadStats(selectedEventId);
  };

  const handleClear = async (scope: ClearScope) => {
    setClearing(scope);
    try {
      const res = await fetch("/api/admin/qr/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authOpts.headers },
        body: JSON.stringify({ scope, eventId: selectedEventId }),
      });
      const data = await res.json();
      if (data.success) {
        toast("success", "QR reiniciados", `Entradas: ${data.entryCleared}, Carnets: ${data.carnetCleared}`);
        refreshAll();
      } else {
        toast("error", data.error || "Error al limpiar");
      }
    } catch {
      toast("error", "Error de conexion");
    } finally {
      setClearing(null);
    }
  };

  const handleExportAnalytics = () => {
    if (!stats) return;
    const headers = ["Metrica", "Valor"];
    const rows: string[][] = [
      ["Total Escaneados", String(stats.totalEscaneos)],
      ["Carreras Detectadas", String(Object.keys(stats.porCarrera).length)],
    ];
    for (const [career, count] of Object.entries(stats.porCarrera).sort(([, a], [, b]) => b - a)) {
      rows.push([`Escaneados ${career}`, String(count)]);
    }
    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analiticas-${selectedEventId}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveCareer = async () => {
    if (!form.id || !form.label || !form.patterns) {
      toast("error", "Completa todos los campos");
      return;
    }
    try {
      const res = await fetch("/api/admin/qr/careers", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authOpts.headers },
        body: JSON.stringify({
          id: form.id.toLowerCase().replace(/[^a-z0-9]/g, "-"),
          label: form.label.toUpperCase(),
          patterns: form.patterns.split(",").map((p) => p.trim().toUpperCase()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCareers(data.careers);
        setShowAddForm(false);
        setEditId(null);
        setForm({ id: "", label: "", patterns: "" });
        toast("success", "Carrera guardada");
      } else {
        toast("error", data.error || "Error al guardar");
      }
    } catch {
      toast("error", "Error de conexion");
    }
  };

  const handleDeleteCareer = async (id: string) => {
    try {
      const res = await fetch("/api/admin/qr/careers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...authOpts.headers },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        setCareers(data.careers);
        toast("success", "Carrera eliminada");
      }
    } catch {
      toast("error", "Error al eliminar");
    }
  };

  const handleResetDefaults = async () => {
    try {
      const res = await fetch("/api/admin/qr/careers", {
        method: "PUT",
        headers: authOpts.headers,
      });
      const data = await res.json();
      if (data.success) {
        setCareers(data.careers);
        toast("success", "Carreras restablecidas");
      }
    } catch {
      toast("error", "Error al restablecer");
    }
  };

  const startEdit = (career: CareerEntry) => {
    setEditId(career.id);
    setForm({
      id: career.id,
      label: career.label,
      patterns: career.patterns.join(", "),
    });
    setShowAddForm(true);
  };

  const selectedEvent = eventOptions.find((e) => e.id === selectedEventId);
  const eventDisplay = selectedEvent
    ? `${selectedEvent.title}${selectedEvent.subtitle ? ` — ${selectedEvent.subtitle}` : ""}`
    : selectedEventId.replace(/-/g, " ").toUpperCase();

  const pieColors = [
    "#C8FF00", "#FF6B6B", "#4ECDC4", "#FFE66D", "#A78BFA",
    "#FB923C", "#34D399", "#F472B6", "#60A5FA", "#FBBF24",
  ];

  function DonutChart({ data, total }: { data: [string, number][]; total: number }) {
    const cx = 80, cy = 80, r = 60, strokeWidth = 28;
    const circumference = 2 * Math.PI * r;
    let offset = 0;
    const segments = data.map(([label, count], i) => {
      const pct = count / total;
      const length = pct * circumference;
      const seg = { label, count, pct, color: pieColors[i % pieColors.length], offset, length };
      offset -= length;
      return seg;
    });

    return (
      <svg viewBox="0 0 160 160" className="w-full h-full">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={strokeWidth} />
        {segments.map((seg) => (
          <circle
            key={seg.label}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${seg.length} ${circumference - seg.length}`}
            strokeDashoffset={seg.offset}
            strokeLinecap="butt"
            transform={`rotate(-90 ${cx} ${cy})`}
            className="transition-all duration-700"
          />
        ))}
        <text x={cx} y={cy - 8} textAnchor="middle" className="fill-white text-[11px] font-black">
          {total}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" className="fill-zinc-500 text-[5px] font-bold uppercase tracking-wider">
          Total
        </text>
      </svg>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header + Event selector + Reset actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-6 shadow-[0_0_60px_rgba(0,0,0,0.2)]"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">
              <QrCode className="h-6 w-6 text-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-white">Control de QR</p>

              {/* Event selector */}
              <div className="relative mt-1">
                <button
                  onClick={() => setShowEventDropdown(!showEventDropdown)}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[8px] font-bold uppercase tracking-[0.3em] text-zinc-400 hover:text-white hover:border-white/20 transition"
                >
                  {eventDisplay}
                  <ChevronDown className={`h-3 w-3 transition ${showEventDropdown ? "rotate-180" : ""}`} />
                </button>

                {showEventDropdown && (
                  <div className="absolute top-full left-0 mt-1 z-10 w-64 rounded-xl border border-white/10 bg-zinc-900 backdrop-blur-2xl shadow-2xl overflow-hidden">
                    {eventOptions.map((ev) => (
                      <button
                        key={ev.id}
                        onClick={() => { setSelectedEventId(ev.id); setShowEventDropdown(false); }}
                        className={`w-full text-left px-4 py-3 text-[9px] font-bold uppercase tracking-wider transition hover:bg-white/[0.06] ${
                          ev.id === selectedEventId ? "text-[#C8FF00] bg-[#C8FF00]/10" : "text-zinc-400"
                        }`}
                      >
                        <p className="leading-tight">{ev.title}</p>
                        {ev.subtitle && <p className="text-[7px] text-zinc-600 font-normal mt-0.5">{ev.subtitle}</p>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-2">
            <button
              onClick={() => handleClear("entry")}
              disabled={clearing !== null}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 text-left transition hover:border-green-500/30 hover:bg-green-500/5 disabled:opacity-50 group"
            >
              <TicketCheck className="h-6 w-6 text-green-400 mb-3" />
              <p className="text-[10px] font-black uppercase tracking-wider text-white">Reiniciar Entradas</p>
              <p className="mt-1 text-[7px] text-zinc-500 uppercase tracking-wider">Limpia pases de entrada usados</p>
              {clearing === "entry" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl">
                  <Loader2 className="h-6 w-6 animate-spin text-green-400" />
                </div>
              )}
            </button>

            <button
              onClick={() => handleClear("carnet")}
              disabled={clearing !== null}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 text-left transition hover:border-amber-500/30 hover:bg-amber-500/5 disabled:opacity-50 group"
            >
              <GraduationCap className="h-6 w-6 text-amber-400 mb-3" />
              <p className="text-[10px] font-black uppercase tracking-wider text-white">Limpiar Carnets</p>
              <p className="mt-1 text-[7px] text-zinc-500 uppercase tracking-wider">Borra escaneos de carnets UTPL</p>
              {clearing === "carnet" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl">
                  <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
                </div>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-3 gap-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 mb-3">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
            {statsLoading ? (
              <div className="h-8 w-16 rounded-lg bg-white/[0.04] animate-pulse" />
            ) : (
              <p className="text-2xl font-black text-white">{stats?.totalEscaneos ?? 0}</p>
            )}
            <p className="mt-1 text-[8px] font-bold uppercase tracking-wider text-zinc-500">Total Escaneados</p>
            <p className="text-[7px] text-zinc-700 font-bold uppercase tracking-wider mt-0.5">{eventDisplay}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.04 }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 mb-3">
              <TrendingUp className="h-5 w-5 text-purple-400" />
            </div>
            {statsLoading ? (
              <div className="h-8 w-16 rounded-lg bg-white/[0.04] animate-pulse" />
            ) : (
              <p className="text-2xl font-black text-white">{stats ? Object.keys(stats.porCarrera).length : 0}</p>
            )}
            <p className="mt-1 text-[8px] font-bold uppercase tracking-wider text-zinc-500">Carreras Detectadas</p>
            <p className="text-[7px] text-zinc-700 font-bold uppercase tracking-wider mt-0.5">En este evento</p>
          </div>
        </motion.div>

        {stats && (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.08 }}
            onClick={handleExportAnalytics}
            className="relative overflow-hidden rounded-2xl border border-dashed border-[#C8FF00]/30 bg-[#C8FF00]/5 backdrop-blur-xl p-5 text-left transition hover:bg-[#C8FF00]/10 hover:border-[#C8FF00]/50 group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#C8FF00]/20 bg-[#C8FF00]/10 mb-3 group-hover:scale-110 transition">
                <Download className="h-5 w-5 text-[#C8FF00]" />
              </div>
              <p className="text-[10px] font-black text-[#C8FF00]">Descargar</p>
              <p className="mt-1 text-[7px] font-bold uppercase tracking-wider text-zinc-500">Analiticas CSV</p>
            </div>
          </motion.button>
        )}
      </motion.div>

      {/* Pie chart + Leaderboard */}
      {stats && Object.keys(stats.porCarrera).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-6 shadow-[0_0_60px_rgba(0,0,0,0.2)]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#C8FF00]/[0.03] rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-6">
              <PieChart className="h-4 w-4 text-zinc-400" />
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400">Distribucion por Carrera</p>
            </div>

            <div className="grid grid-cols-[1fr_1.5fr] gap-8 items-center">
              <div className="flex flex-col items-center">
                <div className="w-[180px] h-[180px]">
                  <DonutChart
                    data={Object.entries(stats.porCarrera).sort(([, a], [, b]) => b - a)}
                    total={stats.totalEscaneos}
                  />
                </div>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-4">
                  {Object.entries(stats.porCarrera)
                    .sort(([, a], [, b]) => b - a)
                    .map(([career, count], i) => (
                      <div key={career} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: pieColors[i % pieColors.length] }} />
                        <p className="text-[7px] font-bold text-zinc-400 uppercase tracking-wider">{career}</p>
                        <p className="text-[7px] font-black text-white">{count}</p>
                      </div>
                    ))}
                </div>
              </div>

              <div className="space-y-2.5">
                {Object.entries(stats.porCarrera)
                  .sort(([, a], [, b]) => b - a)
                  .map(([career, count], i) => {
                    const total = stats.totalEscaneos || 1;
                    const pct = Math.round((count / total) * 100);
                    const isWinner = i === 0;

                    return (
                      <motion.div
                        key={career}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + i * 0.06 }}
                        className={`relative rounded-2xl border backdrop-blur-xl px-4 py-3 transition ${
                          isWinner
                            ? "border-yellow-500/30 bg-yellow-500/[0.06]"
                            : "border-white/[0.06] bg-white/[0.02]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${
                            isWinner
                              ? "bg-yellow-500/20 border border-yellow-500/30"
                              : "bg-white/[0.04] border border-white/10"
                          }`}>
                            {isWinner ? (
                              <Trophy className="h-4 w-4 text-yellow-400" />
                            ) : (
                              <p className="text-xs font-black text-zinc-500">{i + 1}</p>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: pieColors[i % pieColors.length] }} />
                                <p className={`text-[10px] font-black uppercase tracking-wider truncate ${
                                  isWinner ? "text-yellow-200" : "text-white"
                                }`}>
                                  {career}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                <p className={`text-base font-black ${
                                  isWinner ? "text-yellow-400" : "text-[#C8FF00]"
                                }`}>{count}</p>
                                <p className="text-[6px] text-zinc-500 font-bold uppercase tracking-wider">qr</p>
                              </div>
                            </div>
                            <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, delay: 0.25 + i * 0.06, ease: "easeOut" }}
                                className={`h-full rounded-full ${
                                  isWinner
                                    ? "bg-gradient-to-r from-yellow-400 to-yellow-500"
                                    : "bg-gradient-to-r from-[#C8FF00] to-[#a0d400]"
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                        {isWinner && (
                          <div className="absolute -top-2 -right-2">
                            <span className="inline-block px-2 py-0.5 rounded-full bg-yellow-500/20 text-[6px] text-yellow-300 font-black uppercase tracking-wider border border-yellow-500/30">
                              Lider
                            </span>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {!statsLoading && (!stats || Object.keys(stats.porCarrera).length === 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-6 shadow-[0_0_60px_rgba(0,0,0,0.2)]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
          <div className="relative flex flex-col items-center py-10 text-zinc-600">
            <PieChart className="h-10 w-10 mb-3 text-zinc-700" />
            <p className="text-[10px] font-black uppercase tracking-wider">Aun no hay escaneos</p>
            <p className="text-[7px] text-zinc-700 mt-1">Los resultados apareceran aqui cuando se escaneen carnets</p>
          </div>
        </motion.div>
      )}

      {/* Career management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-6 shadow-[0_0_60px_rgba(0,0,0,0.2)]"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400">Carreras Admitidas</p>
              <p className="text-sm font-black text-white mt-1">Gestiona las carreras validas para QR de carnet</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleResetDefaults}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl px-4 py-2.5 text-[8px] font-black uppercase tracking-wider text-zinc-400 transition hover:text-white"
              >
                <RefreshCw className="h-3 w-3" /> Restablecer
              </button>
              <button
                onClick={() => { setShowAddForm(true); setEditId(null); setForm({ id: "", label: "", patterns: "" }); }}
                className="flex items-center gap-2 rounded-xl border border-[#C8FF00]/30 bg-[#C8FF00]/10 px-4 py-2.5 text-[8px] font-black uppercase tracking-wider text-[#C8FF00] transition hover:bg-[#C8FF00]/20"
              >
                <Plus className="h-3 w-3" /> Agregar
              </button>
            </div>
          </div>

          {showAddForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="overflow-hidden mb-6"
            >
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400">
                    {editId ? "Editar carrera" : "Nueva carrera"}
                  </p>
                  <button onClick={() => { setShowAddForm(false); setEditId(null); }} className="text-zinc-500 hover:text-white transition">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <p className="text-[7px] font-bold uppercase tracking-wider text-zinc-500">ID</p>
                    <input
                      value={form.id}
                      onChange={(e) => setForm({ ...form, id: e.target.value })}
                      placeholder="psicologia"
                      disabled={editId !== null}
                      className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-[10px] font-bold text-white placeholder-zinc-700 outline-none transition focus:border-[#C8FF00]/50 disabled:opacity-40"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[7px] font-bold uppercase tracking-wider text-zinc-500">Nombre</p>
                    <input
                      value={form.label}
                      onChange={(e) => setForm({ ...form, label: e.target.value })}
                      placeholder="PSICOLOGIA CLINICA"
                      className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-[10px] font-bold text-white placeholder-zinc-700 outline-none transition focus:border-[#C8FF00]/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[7px] font-bold uppercase tracking-wider text-zinc-500">Patrones (separados por coma)</p>
                    <input
                      value={form.patterns}
                      onChange={(e) => setForm({ ...form, patterns: e.target.value })}
                      placeholder="PSICOLOGIA CLINICA, PSICOLOGIA"
                      className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-[10px] font-bold text-white placeholder-zinc-700 outline-none transition focus:border-[#C8FF00]/50"
                    />
                  </div>
                </div>
                <button
                  onClick={handleSaveCareer}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#C8FF00] px-6 py-3 text-[10px] font-black uppercase tracking-wider text-black transition hover:bg-[#daff33]"
                >
                  <Check className="h-4 w-4" /> {editId ? "Actualizar" : "Guardar"}
                </button>
              </div>
            </motion.div>
          )}

          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-zinc-500" /></div>
          ) : careers.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-zinc-600">
              <ShieldAlert className="h-8 w-8 mb-3" />
              <p className="text-[9px] font-bold uppercase tracking-wider">No hay carreras configuradas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {careers.map((career, i) => (
                <motion.div
                  key={career.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl px-5 py-4 group hover:border-white/20 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C8FF00]/10 border border-[#C8FF00]/20">
                      <GraduationCap className="h-5 w-5 text-[#C8FF00]" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white uppercase tracking-wider">{career.label}</p>
                      <p className="text-[8px] text-zinc-500 mt-0.5">ID: {career.id} · Patrones: {career.patterns.join(", ")}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => startEdit(career)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-zinc-500 hover:text-white transition"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCareer(career.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
