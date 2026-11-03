"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import CoOrganizerModal from "@/frontend/components/CoOrganizerModal";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

function authHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("organizer_token") : null;
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

interface EventStats {
  event_id: string;
  event_title: string;
  status: string;
  capacity: number | null;
  tickets_sold: number;
  revenue: number;
  receipts: { total: number; approved: number; pending: number; rejected: number };
  ticket_types: { name: string; price: number; sold: number; capacity: number | null }[];
}

interface Receipt {
  id: string;
  first_name: string;
  last_name: string;
  quantity: number;
  total_amount: number;
  status: string;
  reference_number: string | null;
  original_file_name: string;
  created_at: string;
  rejection_reason: string | null;
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface TicketType {
  id: string;
  name: string;
  price: number;
  capacity: number | null;
  sold: number;
  is_active: boolean;
  sort_order: number;
}

interface OrgEvent {
  id: string;
  slug: string;
  title: string;
  status: string;
  event_date: string;
  city: string;
  base_price: number;
  capacity: number | null;
  organizers?: string[];
}

type Tab = "overview" | "receipts" | "types" | "staff" | "coorganizers";

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<OrgEvent | null>(null);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  // New ticket type form
  const [newTT, setNewTT] = useState({ name: "", price: "0", capacity: "", description: "" });
  const [newStaff, setNewStaff] = useState({ name: "", role: "taquilla", password: "" });
  const [ttLoading, setTtLoading] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const [organizers, setOrganizers] = useState<string[]>(["Cubic", "4Go"]);
  const [isCoOrgModalOpen, setIsCoOrgModalOpen] = useState(false);

  const fetchAll = useCallback(async () => {
    const token = localStorage.getItem("organizer_token");
    if (!token) { router.push("/organizer/login"); return; }

    const [evtRes, statsRes, receiptsRes, staffRes, ttRes] = await Promise.all([
      fetch(`${BACKEND_URL}/api/v1/organizer/events/${eventId}`, { headers: authHeaders() }),
      fetch(`${BACKEND_URL}/api/v1/organizer/events/${eventId}/stats`, { headers: authHeaders() }),
      fetch(`${BACKEND_URL}/api/v1/organizer/events/${eventId}/tickets`, { headers: authHeaders() }),
      fetch(`${BACKEND_URL}/api/v1/organizer/events/${eventId}/staff`, { headers: authHeaders() }),
      fetch(`${BACKEND_URL}/api/v1/organizer/events/${eventId}/ticket-types`, { headers: authHeaders() }),
    ]);

    if (evtRes.status === 401) { router.push("/organizer/login"); return; }
    if (evtRes.status === 404) { router.push("/organizer/dashboard"); return; }

    setEvent(await evtRes.json());
    setStats(statsRes.ok ? await statsRes.json() : null);
    setReceipts(receiptsRes.ok ? await receiptsRes.json() : []);
    setStaff(staffRes.ok ? await staffRes.json() : []);
    setTicketTypes(ttRes.ok ? await ttRes.json() : []);
    setLoading(false);
  }, [eventId, router]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handlePublish = async () => {
    if (!event) return;
    setPublishing(true);
    const res = await fetch(`${BACKEND_URL}/api/v1/organizer/events/${eventId}/publish`, {
      method: "POST",
      headers: authHeaders(),
    });
    if (res.ok) {
      setEvent(prev => prev ? { ...prev, status: "published" } : prev);
    }
    setPublishing(false);
  };

  const handleReview = async (receiptId: string, action: "approve" | "reject") => {
    await fetch(`${BACKEND_URL}/api/v1/organizer/events/${eventId}/tickets/${receiptId}/review`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ action }),
    });
    fetchAll();
  };

  const handleCreateTT = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!newTT.name.trim()) return setFormError("El nombre es requerido.");
    setTtLoading(true);
    const res = await fetch(`${BACKEND_URL}/api/v1/organizer/events/${eventId}/ticket-types`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        name: newTT.name,
        price: parseFloat(newTT.price) || 0,
        capacity: newTT.capacity ? parseInt(newTT.capacity) : null,
        description: newTT.description || undefined,
      }),
    });
    if (res.ok) {
      setNewTT({ name: "", price: "0", capacity: "", description: "" });
      fetchAll();
    }
    setTtLoading(false);
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!newStaff.name.trim() || !newStaff.password) return setFormError("Nombre y contraseña requeridos.");
    setStaffLoading(true);
    const res = await fetch(`${BACKEND_URL}/api/v1/organizer/events/${eventId}/staff`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(newStaff),
    });
    if (res.ok) {
      setNewStaff({ name: "", role: "taquilla", password: "" });
      fetchAll();
    }
    setStaffLoading(false);
  };

  const handleDeleteStaff = async (staffId: string) => {
    await fetch(`${BACKEND_URL}/api/v1/organizer/events/${eventId}/staff/${staffId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    fetchAll();
  };

  const roleLabel: Record<string, string> = {
    bar: "Bar Admin",
    taquilla: "Taquilla",
    scanner: "Scanner QR",
    owner: "Propietario",
  };

  const statusColor: Record<string, string> = {
    draft: "text-zinc-500",
    published: "text-white",
    cancelled: "text-red-400",
    finished: "text-zinc-600",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/organizer/dashboard")}
              className="text-zinc-600 hover:text-white transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <span className="text-sm font-black text-white truncate max-w-xs">{event?.title}</span>
            {event && (
              <span className={`text-[9px] font-black uppercase tracking-wider ${statusColor[event.status]}`}>
                {event.status === "draft" ? "Borrador" : event.status === "published" ? "Publicado" : event.status}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {event?.status === "published" && (
              <a
                href={`/events/${event.slug}`}
                target="_blank"
                className="px-3 py-1.5 rounded-full border border-white/10 text-zinc-400 text-[10px] font-black uppercase tracking-wider hover:border-white/25 hover:text-white transition"
              >
                Ver público →
              </a>
            )}
            {event?.status === "draft" && (
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="px-4 py-1.5 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-wider hover:bg-zinc-100 transition active:scale-95 disabled:opacity-50"
              >
                {publishing ? "Publicando..." : "Publicar Evento"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 bg-white/3 rounded-full p-1 border border-white/5 w-fit mb-8 overflow-x-auto no-scrollbar">
          {([
            { key: "overview", label: "Resumen" },
            { key: "types", label: "Tipos de Entrada" },
            { key: "receipts", label: `Comprobantes (${receipts.filter(r => r.status === "pendiente").length})` },
            { key: "staff", label: "Staff" },
            { key: "coorganizers", label: `Co-Organizadores (${organizers.length})` },
          ] as { key: Tab; label: string }[]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition shrink-0 ${tab === t.key ? "bg-white text-black" : "text-zinc-500 hover:text-white"
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === "overview" && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Entradas Vendidas", value: stats.tickets_sold, sub: stats.capacity ? `/ ${stats.capacity} cap.` : "sin límite" },
                { label: "Ingresos Aprobados", value: `$${stats.revenue.toFixed(2)}` },
                { label: "Comprobantes Pendientes", value: stats.receipts.pending, sub: "por revisar" },
                { label: "Total Comprobantes", value: stats.receipts.total },
              ].map((stat, i) => (
                <div key={i} className="p-5 rounded-2xl bg-white/2 border border-white/5">
                  <div className="text-2xl font-black text-white mb-1">{stat.value}</div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{stat.label}</div>
                  {stat.sub && <div className="text-[9px] text-zinc-700 mt-0.5">{stat.sub}</div>}
                </div>
              ))}
            </div>

            {stats.ticket_types.length > 0 && (
              <div className="p-5 rounded-2xl bg-white/2 border border-white/5">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-4">Ventas por tipo de entrada</p>
                <div className="space-y-3">
                  {stats.ticket_types.map((tt, i) => {
                    const pct = tt.capacity ? Math.round((tt.sold / tt.capacity) * 100) : null;
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-black text-white">{tt.name}</span>
                          <span className="text-xs text-zinc-500">{tt.sold}{tt.capacity ? ` / ${tt.capacity}` : ""} — ${tt.price}</span>
                        </div>
                        {pct !== null && (
                          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-white/40"
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Event info */}
            <div className="p-5 rounded-2xl bg-white/2 border border-white/5">
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-4">Información del evento</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-zinc-600 text-[10px] uppercase tracking-wider block">Fecha</span><span className="text-white font-semibold">{event?.event_date}</span></div>
                <div><span className="text-zinc-600 text-[10px] uppercase tracking-wider block">Ciudad</span><span className="text-white font-semibold">{event?.city}</span></div>
                <div><span className="text-zinc-600 text-[10px] uppercase tracking-wider block">Slug público</span><span className="text-zinc-400 font-mono text-xs">/events/{event?.slug}</span></div>
                <div><span className="text-zinc-600 text-[10px] uppercase tracking-wider block">Precio base</span><span className="text-white font-semibold">${event?.base_price}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Ticket Types */}
        {tab === "types" && (
          <div className="space-y-6">
            {/* Existing types */}
            {ticketTypes.length > 0 && (
              <div className="space-y-2">
                {ticketTypes.map(tt => (
                  <div key={tt.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/2 border border-white/5">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white">{tt.name}</span>
                        {!tt.is_active && <span className="text-[9px] text-zinc-600 border border-zinc-800 rounded-full px-2 py-0.5">Inactivo</span>}
                      </div>
                      <div className="text-[10px] text-zinc-600 mt-0.5">
                        ${tt.price} · {tt.sold} vendidas{tt.capacity ? ` / ${tt.capacity} cap.` : ""}
                      </div>
                    </div>
                    <span className="text-xs font-black text-white">${tt.price}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Add new type */}
            <div className="p-5 rounded-2xl bg-white/2 border border-white/5">
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-4">
                Agregar tipo de entrada {/* los diseños revisar la idea, porque ya no creo que se manejen diseños pero bueno */}
              </p>
              <form onSubmit={handleCreateTT} className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-[9px] font-black uppercase tracking-wider text-zinc-600 mb-1">Nombre *</label>
                    <input
                      type="text"
                      value={newTT.name}
                      onChange={e => setNewTT(p => ({ ...p, name: e.target.value }))}
                      placeholder="General, VIP..."
                      className="w-full h-9 px-3 rounded-xl bg-white/5 border border-white/8 text-white text-xs placeholder-zinc-700 focus:outline-none focus:border-white/25 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-zinc-600 mb-1">Precio ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={newTT.price}
                      onChange={e => setNewTT(p => ({ ...p, price: e.target.value }))}
                      className="w-full h-9 px-3 rounded-xl bg-white/5 border border-white/8 text-white text-xs focus:outline-none focus:border-white/25 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-zinc-600 mb-1">Capacidad</label>
                    <input
                      type="number"
                      min="1"
                      value={newTT.capacity}
                      onChange={e => setNewTT(p => ({ ...p, capacity: e.target.value }))}
                      placeholder="Sin límite"
                      className="w-full h-9 px-3 rounded-xl bg-white/5 border border-white/8 text-white text-xs placeholder-zinc-700 focus:outline-none focus:border-white/25 transition"
                    />
                  </div>
                </div>
                {formError && <p className="text-xs text-red-400">{formError}</p>}
                <button
                  type="submit"
                  disabled={ttLoading}
                  className="px-5 py-2 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-zinc-100 transition active:scale-95 disabled:opacity-50"
                >
                  {ttLoading ? "Guardando..." : "Agregar Tipo"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Receipts / Taquilla */}
        {tab === "receipts" && (
          <div className="space-y-3">
            {receipts.length === 0 ? (
              <div className="text-center py-16 text-zinc-600 text-sm">No hay comprobantes aún.</div>
            ) : (
              receipts.map(r => (
                <div key={r.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/2 border border-white/5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-black text-white">{r.first_name} {r.last_name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${r.status === "aprobado" ? "border-white/20 text-white bg-white/5" :
                          r.status === "rechazado" ? "border-red-500/20 text-red-400 bg-red-500/5" :
                            "border-yellow-500/20 text-yellow-400 bg-yellow-500/5"
                        }`}>
                        {r.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-600">
                      {r.quantity} entrada{r.quantity !== 1 ? "s" : ""} · ${r.total_amount} · {r.original_file_name}
                    </div>
                    {r.rejection_reason && (
                      <div className="text-[9px] text-red-400 mt-0.5">Motivo: {r.rejection_reason}</div>
                    )}
                  </div>
                  {r.status === "pendiente" && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleReview(r.id, "approve")}
                        className="px-3 py-1.5 rounded-full bg-white text-black text-[9px] font-black uppercase tracking-wider hover:bg-zinc-100 transition"
                      >
                        Aprobar
                      </button>
                      <button
                        onClick={() => handleReview(r.id, "reject")}
                        className="px-3 py-1.5 rounded-full border border-red-500/30 text-red-400 text-[9px] font-black uppercase tracking-wider hover:border-red-500/50 transition"
                      >
                        Rechazar
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Staff */}
        {tab === "staff" && (
          <div className="space-y-6">
            {staff.length > 0 && (
              <div className="space-y-2">
                {staff.map(s => (
                  <div key={s.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/2 border border-white/5">
                    <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-black text-white shrink-0">
                      {s.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-black text-white">{s.name}</div>
                      <div className="text-[10px] text-zinc-600">{roleLabel[s.role] || s.role}</div>
                    </div>
                    <button
                      onClick={() => handleDeleteStaff(s.id)}
                      className="text-zinc-700 hover:text-red-400 transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="p-5 rounded-2xl bg-white/2 border border-white/5">
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-4">
                Agregar miembro del equipo
              </p>
              <form onSubmit={handleCreateStaff} className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-zinc-600 mb-1">Nombre *</label>
                    <input
                      type="text"
                      value={newStaff.name}
                      onChange={e => setNewStaff(p => ({ ...p, name: e.target.value }))}
                      placeholder="Juan Pérez"
                      className="w-full h-9 px-3 rounded-xl bg-white/5 border border-white/8 text-white text-xs placeholder-zinc-700 focus:outline-none focus:border-white/25 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-zinc-600 mb-1">Rol</label>
                    <select
                      value={newStaff.role}
                      onChange={e => setNewStaff(p => ({ ...p, role: e.target.value }))}
                      className="w-full h-9 px-3 rounded-xl bg-zinc-900 border border-white/8 text-white text-xs focus:outline-none focus:border-white/25 transition"
                    >
                      <option value="taquilla" className="bg-zinc-900">Taquilla</option>
                      <option value="bar" className="bg-zinc-900">Bar Admin</option>
                      <option value="scanner" className="bg-zinc-900">Scanner QR</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-zinc-600 mb-1">Contraseña *</label>
                    <input
                      type="password"
                      value={newStaff.password}
                      onChange={e => setNewStaff(p => ({ ...p, password: e.target.value }))}
                      placeholder="••••••"
                      className="w-full h-9 px-3 rounded-xl bg-white/5 border border-white/8 text-white text-xs placeholder-zinc-700 focus:outline-none focus:border-white/25 transition"
                    />
                  </div>
                </div>
                {formError && <p className="text-xs text-red-400">{formError}</p>}
                <button
                  type="submit"
                  disabled={staffLoading}
                  className="px-5 py-2 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-zinc-100 transition active:scale-95 disabled:opacity-50"
                >
                  {staffLoading ? "Guardando..." : "Agregar Staff"}
                </button>
              </form>

              <p className="text-[9px] text-zinc-700 mt-4">
                Los miembros del staff reciben acceso a su panel correspondiente (bar, taquilla o escáner QR) usando la contraseña que les asignes.
              </p>
            </div>
          </div>
        )}

        {/* Co-Organizadores */}
        {tab === "coorganizers" && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white/2 border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase text-white tracking-wider">
                    Organizadores & Co-Hosts Vinculados
                  </h3>
                  <p className="text-xs text-zinc-500 font-medium mt-0.5">
                    Discotecas, colectivos y productoras asociadas en este evento.
                  </p>
                </div>
                <button
                  onClick={() => setIsCoOrgModalOpen(true)}
                  className="px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
                >
                  + Vincular / Generar QR
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {organizers.map((org, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black flex items-center justify-center border border-emerald-400/30 uppercase">
                        {org.slice(0, 2)}
                      </div>
                      <div>
                        <div className="text-xs font-black uppercase text-white">{org}</div>
                        <div className="text-[10px] text-zinc-500">
                          {index === 0 ? "Organizador Principal" : "Co-Host Asociado"}
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-white/10 text-[9px] font-black uppercase text-zinc-300">
                      Verificado
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Co-Organizer Invitation & QR Modal */}
      <CoOrganizerModal
        isOpen={isCoOrgModalOpen}
        onClose={() => setIsCoOrgModalOpen(false)}
        eventTitle={event?.title || "Evento NENEZ"}
        currentOrganizers={organizers}
        onUpdateOrganizers={(updated) => setOrganizers(updated)}
      />
    </div>
  );
}
