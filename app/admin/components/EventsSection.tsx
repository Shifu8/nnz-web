"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Edit3, Trash2, Calendar, MapPin, Clock, Eye, EyeOff,
  Star, Image as ImageIcon, X, Check, Loader2,
  QrCode, ChevronUp, ChevronDown,
} from "lucide-react";
import type { AdminEvent } from "@/lib/admin/types";
import { useToast } from "./Toast";

type EventsSectionProps = {
  events?: AdminEvent[];
  onEventsChange?: () => void;
};

type EnrichedEvent = AdminEvent & {
  totalScans?: number;
  scansPerCareer?: Record<string, number>;
};

const EMPTY_EVENT: Omit<AdminEvent, "id" | "createdAt" | "updatedAt"> & { slug: string } = {
  title: "",
  subtitle: "",
  location: "",
  date: "",
  time: "",
  countdownDate: "",
  price: 0,
  imageUrl: "",
  description: "",
  lineup: [],
  position: 0,
  status: "active",
  isFeatured: false,
  slug: "",
};

const AUTH_HEADERS = { Authorization: `Bearer ${Buffer.from("admin:nenez2026").toString("base64")}` };

export default function EventsSection(_props: EventsSectionProps) {
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EnrichedEvent | null>(null);
  const [form, setForm] = useState(EMPTY_EVENT);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);
  const [togglingFeatured, setTogglingFeatured] = useState<string | null>(null);
  const [movingPosition, setMovingPosition] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [events, setEvents] = useState<EnrichedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/qr/events", { headers: AUTH_HEADERS });
      const data = await res.json();
      if (data.success) setEvents(data.events);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const openCreate = () => {
    setEditingEvent(null);
    setForm(EMPTY_EVENT);
    setShowModal(true);
  };

  const openEdit = (event: EnrichedEvent) => {
    setEditingEvent(event);
    setForm({
      title: event.title,
      subtitle: event.subtitle,
      location: event.location,
      date: event.date,
      time: event.time,
      countdownDate: event.countdownDate,
      price: event.price,
      imageUrl: event.imageUrl,
      description: event.description,
      lineup: event.lineup || [],
      position: event.position ?? 0,
      status: event.status,
      isFeatured: event.isFeatured,
      slug: (event as any).slug || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.date || !form.time || form.price <= 0) {
      toast("error", "Campos requeridos", "Título, fecha, hora y precio son obligatorios.");
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, any> = { ...form, price: Number(form.price) };
      if (form.slug) body.slug = form.slug;

      if (editingEvent) {
        const res = await fetch(`/api/admin/events/${editingEvent.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...AUTH_HEADERS },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        toast("success", "Evento actualizado", `${form.title} se actualizó correctamente.`);
      } else {
        const res = await fetch("/api/admin/events", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...AUTH_HEADERS },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        toast("success", "Evento creado", `${form.title} se agregó correctamente.`);
      }
      setShowModal(false);
      loadEvents();
    } catch (err) {
      toast("error", "Error", err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/events/${id}`, {
        method: "DELETE",
        headers: AUTH_HEADERS,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast("success", "Evento eliminado", "El evento se eliminó correctamente.");
      loadEvents();
    } catch (err) {
      toast("error", "Error", err instanceof Error ? err.message : "No se pudo eliminar.");
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  };

  const handleImageUpload = async (eventId: string, file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(`/api/admin/events/${eventId}/image`, {
        method: "POST",
        headers: AUTH_HEADERS,
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast("success", "Imagen actualizada");
      loadEvents();
    } catch (err) {
      toast("error", "Error", err instanceof Error ? err.message : "No se pudo subir la imagen.");
    } finally {
      setUploading(false);
    }
  };

  const handleMovePosition = async (event: EnrichedEvent, direction: "up" | "down") => {
    setMovingPosition(event.id);
    try {
      const idx = sorted.indexOf(event);
      const newPos = direction === "up" ? (idx === 0 ? 0 : (sorted[idx - 1].position ?? 0)) : (idx >= sorted.length - 1 ? sorted.length - 1 : (sorted[idx + 1].position ?? 0));
      await fetch(`/api/admin/events/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...AUTH_HEADERS },
        body: JSON.stringify({ position: newPos }),
      });
      loadEvents();
    } catch {}
    finally { setMovingPosition(null); }
  };

  const handleToggleFeatured = async (event: EnrichedEvent) => {
    setTogglingFeatured(event.id);
    try {
      const res = await fetch(`/api/admin/events/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...AUTH_HEADERS },
        body: JSON.stringify({ isFeatured: !event.isFeatured }),
      });
      const data = await res.json();
      if (data.success) {
        toast("success", event.isFeatured ? "Destacado removido" : "Marcado como destacado");
        loadEvents();
      }
    } catch {
      toast("error", "Error al cambiar destacado");
    } finally {
      setTogglingFeatured(null);
    }
  };

  const handleToggleStatus = async (event: EnrichedEvent) => {
    setTogglingStatus(event.id);
    try {
      const newStatus = event.status === "active" ? "inactive" : "active";
      const res = await fetch(`/api/admin/events/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...AUTH_HEADERS },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast("success", event.status === "active" ? "Evento desactivado" : "Evento activado");
        loadEvents();
      }
    } catch {
      toast("error", "Error al cambiar estado");
    } finally {
      setTogglingStatus(null);
    }
  };

  // Sort only by position — stable sort preserves API order (admin events before fallback)
  const sorted = [...events].sort((a, b) => {
    const pa = a.position ?? 0;
    const pb = b.position ?? 0;
    return pa - pb;
  });

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/[0.42]">Gestion</p>
          <p className="text-xl font-black text-white mt-1">Eventos</p>
        </div>
        <button
          onClick={openCreate}
          className="flex h-11 items-center justify-center gap-2 rounded-full bg-[#ffd36a] px-5 text-[10px] font-black uppercase tracking-[0.1em] text-[#1d130a] shadow-[0_16px_36px_rgba(255,179,82,0.18)] transition hover:bg-[#ffe19a]"
        >
          <Plus className="h-4 w-4" /> Nuevo evento
        </button>
      </div>

      {/* Event Cards */}
      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[26px] border border-white/10 bg-[#18131d]/[0.62] py-20 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_24px_70px_rgba(0,0,0,0.2)] backdrop-blur-2xl">
          <Calendar className="h-12 w-12 text-white/[0.28] mb-4" />
          <p className="text-sm font-bold text-white/[0.45]">No hay eventos</p>
          <p className="text-[9px] text-white/[0.32] mt-1">Crea tu primer evento para empezar.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sorted.map((event, i) => {
            const totalScans = event.totalScans ?? 0;
            return (
              <motion.div
                key={event.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-[#18131d]/[0.62] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_20px_52px_rgba(0,0,0,0.18)] backdrop-blur-2xl transition-all duration-500 hover:border-white/20"
              >
                {/* Image */}
                <div className="relative h-44 overflow-hidden">
                  {event.imageUrl ? (
                    <img src={event.imageUrl} alt={event.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-zinc-900">
                      <ImageIcon className="h-8 w-8 text-zinc-700" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    {event.isFeatured && (
                      <span className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-950/30 px-2.5 py-1 text-[7px] font-black text-amber-400 uppercase tracking-wider">
                        <Star className="h-2.5 w-2.5" /> Destacado
                      </span>
                    )}
                    <span className={`rounded-full border px-2.5 py-1 text-[7px] font-black uppercase tracking-wider ${
                      event.status === "active"
                        ? "border-green-500/30 bg-green-950/30 text-green-400"
                        : "border-zinc-500/30 bg-zinc-950/30 text-zinc-500"
                    }`}>
                      {event.status === "active" ? "Activo" : "Inactivo"}
                    </span>
                  </div>

                  {/* Scan count */}
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    <span className="flex items-center gap-1 rounded-full border border-white/10 bg-black/50 px-2.5 py-1 text-[7px] font-black text-zinc-300">
                      <QrCode className="h-2.5 w-2.5" />
                      {loading ? "..." : totalScans} scans
                    </span>
                  </div>

                  {/* Title overlay */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-sm font-black text-white">{event.title}</p>
                    {event.subtitle && <p className="text-[8px] text-zinc-400 mt-0.5">{event.subtitle}</p>}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 space-y-2">
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[8px] font-bold text-zinc-500">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {event.location || "Sin ubicación"}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {event.date}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {event.time}</span>
                  </div>
                  {event.description && (
                    <p className="text-[9px] text-zinc-500 line-clamp-2">{event.description}</p>
                  )}

                  {/* Position controls */}
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-950/20 px-2.5 py-1">
                      {(event.position ?? 0) === 0 && <span className="text-[7px] font-black uppercase tracking-wider text-red-400">PRÓXIMO</span>}
                      <span className="text-[9px] font-black text-zinc-500">{(event.position ?? 0) + 1}°</span>
                    </span>
                    <span className="text-[8px] text-zinc-600 flex-1">en orden</span>
                    <button onClick={() => handleMovePosition(event, "up")} disabled={movingPosition === event.id} className="flex items-center justify-center rounded-lg border border-white/10 bg-black/50 px-2 py-1.5 text-zinc-500 transition hover:text-white hover:border-white/20 disabled:opacity-30">
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleMovePosition(event, "down")} disabled={movingPosition === event.id} className="flex items-center justify-center rounded-lg border border-white/10 bg-black/50 px-2 py-1.5 text-zinc-500 transition hover:text-white hover:border-white/20 disabled:opacity-30">
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    {event.isFeatured && <span className="text-amber-400">★</span>}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 pt-2 border-t border-white/[0.06]">
                    <button onClick={() => openEdit(event)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-black/40 py-2 text-[8px] font-black uppercase tracking-wider text-zinc-400 transition hover:text-white hover:border-white/20">
                      <Edit3 className="h-3 w-3" /> Editar
                    </button>
                    <button
                      onClick={() => handleToggleStatus(event)}
                      disabled={togglingStatus === event.id}
                      className={`flex items-center justify-center rounded-xl border p-2 transition ${
                        event.status === "active"
                          ? "border-green-500/20 bg-green-950/20 text-green-400 hover:bg-green-950/30"
                          : "border-zinc-500/20 bg-zinc-950/20 text-zinc-400 hover:bg-zinc-950/30"
                      }`}
                    >
                      {togglingStatus === event.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : event.status === "active" ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button onClick={() => handleToggleFeatured(event)} disabled={togglingFeatured === event.id} className={`flex items-center justify-center rounded-xl border p-2 transition ${
                      event.isFeatured
                        ? "border-amber-500/30 bg-amber-950/20 text-amber-400"
                        : "border-white/10 bg-black/40 text-zinc-400 hover:text-white"
                    }`}>
                      {togglingFeatured === event.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Star className={`h-3.5 w-3.5 ${event.isFeatured ? "fill-amber-400" : ""}`} />}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(confirmDelete === event.id ? null : event.id)}
                      className="flex items-center justify-center rounded-xl border border-white/10 bg-black/40 p-2 text-zinc-400 transition hover:text-red-400 hover:border-red-500/30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Confirm delete */}
                  <AnimatePresence>
                    {confirmDelete === event.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="flex items-center gap-2 pt-1.5">
                          <p className="text-[8px] font-bold text-red-400 flex-1">¿Eliminar {event.title}?</p>
                          <button onClick={() => setConfirmDelete(null)} className="rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-[8px] font-black text-zinc-500 transition hover:text-white">Cancelar</button>
                          <button onClick={() => handleDelete(event.id)} disabled={deleting === event.id} className="rounded-lg bg-red-600 px-3 py-1.5 text-[8px] font-black text-white transition hover:bg-red-500 disabled:opacity-50">
                            {deleting === event.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Eliminar"}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 px-4 pb-4 pt-[5vh] backdrop-blur-xl overflow-y-auto"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 20 }}
                className="relative w-full max-w-2xl rounded-[30px] border border-white/[0.12] bg-[#151019]/[0.94] backdrop-blur-2xl p-8 shadow-[0_30px_100px_rgba(0,0,0,0.55)]"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setShowModal(false)} className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-zinc-400 transition hover:bg-white/20 hover:text-white">
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3 mb-8">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-950/50 border border-red-500/20">
                  {editingEvent ? <Edit3 className="h-5 w-5 text-red-400" /> : <Plus className="h-5 w-5 text-red-400" />}
                </div>
                <div>
                  <p className="text-lg font-black text-white tracking-[0.05em]">{editingEvent ? "Editar Evento" : "Nuevo Evento"}</p>
                  <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-zinc-500">{editingEvent ? "Modifica los datos del evento" : "Completa los datos del evento"}</p>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-1.5 md:col-span-2">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">Título *</p>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value.toUpperCase() })} placeholder="TRAP LOUD" className="w-full rounded-2xl border border-white/10 bg-black/50 px-5 py-4 text-sm font-bold text-white placeholder-zinc-800 outline-none transition focus:border-red-500/50" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">Subtítulo</p>
                  <input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value.toUpperCase() })} placeholder="YAN BLOCK EXPERIENCE" className="w-full rounded-2xl border border-white/10 bg-black/50 px-5 py-4 text-sm font-bold text-white placeholder-zinc-800 outline-none transition focus:border-red-500/50" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">Slug (ID para escaneos)</p>
                  <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="trap-loud" className="w-full rounded-2xl border border-white/10 bg-black/50 px-5 py-4 text-sm font-bold text-white placeholder-zinc-800 outline-none transition focus:border-red-500/50" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">Ubicación</p>
                  <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Quito" className="w-full rounded-2xl border border-white/10 bg-black/50 px-5 py-4 text-sm font-bold text-white placeholder-zinc-800 outline-none transition focus:border-red-500/50" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">Precio $ *</p>
                  <input type="number" min={0} value={form.price || ""} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} placeholder="10" className="w-full rounded-2xl border border-white/10 bg-black/50 px-5 py-4 text-sm font-bold text-white placeholder-zinc-800 outline-none transition focus:border-red-500/50" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">Fecha *</p>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-black/50 px-5 py-4 text-sm font-bold text-white outline-none transition focus:border-red-500/50 [color-scheme:dark]" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">Hora *</p>
                  <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-black/50 px-5 py-4 text-sm font-bold text-white outline-none transition focus:border-red-500/50 [color-scheme:dark]" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">Fecha del contador (countdown)</p>
                  <input type="date" value={form.countdownDate} onChange={(e) => setForm({ ...form, countdownDate: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-black/50 px-5 py-4 text-sm font-bold text-white outline-none transition focus:border-red-500/50 [color-scheme:dark]" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">Descripción</p>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Descripción del evento..." className="w-full rounded-2xl border border-white/10 bg-black/50 px-5 py-4 text-sm font-bold text-white placeholder-zinc-800 outline-none transition focus:border-red-500/50 resize-none" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">Posición en eventos</p>
                  <p className="text-[7px] text-zinc-600">Define el orden de los eventos en la página principal (1° = primero en mostrarse)</p>
                  <select value={form.position ?? 0} onChange={(e) => setForm({ ...form, position: Number(e.target.value) })} className="w-full rounded-2xl border border-white/10 bg-black/50 px-5 py-4 text-sm font-bold text-white outline-none transition focus:border-red-500/50">
                    {sorted.map((_, i) => (
                      <option key={i} value={i} className="bg-zinc-900 text-white">{i + 1}° — {i === 0 ? "PRÓXIMO EVENTO" : `${i + 1}° evento`}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5" />
                <div className="space-y-1.5 md:col-span-2">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">Lineup (artistas, separados por coma)</p>
                  <input value={form.lineup.join(", ")} onChange={(e) => setForm({ ...form, lineup: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} placeholder="YAN BLOCK, ROA, OMAR COURTZ" className="w-full rounded-2xl border border-white/10 bg-black/50 px-5 py-4 text-sm font-bold text-white placeholder-zinc-800 outline-none transition focus:border-red-500/50" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">Estado</p>
                  <div className="flex gap-3">
                    {(["active", "inactive"] as const).map((s) => (
                      <button key={s} onClick={() => setForm({ ...form, status: s })}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border py-3 text-[10px] font-black uppercase tracking-wider transition ${
                          form.status === s
                            ? s === "active" ? "border-green-500/30 bg-green-950/20 text-green-400" : "border-zinc-500/30 bg-zinc-950/20 text-zinc-400"
                            : "border-white/10 bg-black/40 text-zinc-600"
                        }`}
                      >
                        {s === "active" ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        {s === "active" ? "Activo" : "Inactivo"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <button onClick={() => setForm({ ...form, isFeatured: !form.isFeatured })}
                    className={`flex items-center gap-2 rounded-2xl border px-5 py-3 text-[10px] font-black uppercase tracking-wider transition ${
                      form.isFeatured ? "border-amber-500/30 bg-amber-950/20 text-amber-400" : "border-white/10 bg-black/40 text-zinc-600 hover:text-zinc-400"
                    }`}
                  >
                    <Star className={`h-4 w-4 ${form.isFeatured ? "fill-amber-400" : ""}`} />
                    {form.isFeatured ? "Destacado" : "Marcar como destacado"}
                  </button>
                </div>
              </div>

              {/* Image upload for existing event */}
              {editingEvent && (
                <div className="mt-6 p-4 rounded-2xl border border-white/[0.06] bg-black/40">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2">Imagen del evento</p>
                  {form.imageUrl && (
                    <img src={form.imageUrl} alt="" className="h-32 rounded-xl object-cover mb-3" />
                  )}
                  <div className="flex items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          await handleImageUpload(editingEvent.id, file);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }
                      }}
                    />
                    <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-[9px] font-bold text-zinc-400 transition hover:text-white disabled:opacity-50">
                      {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
                      {uploading ? "Subiendo..." : "Subir imagen"}
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-8">
                <button onClick={() => setShowModal(false)} className="flex flex-1 items-center justify-center rounded-2xl border border-white/10 bg-black/40 py-4 text-[10px] font-black uppercase tracking-wider text-zinc-500 transition hover:text-white">
                  Cancelar
                </button>
                <button onClick={handleSave} disabled={saving} className="flex flex-[2] items-center justify-center gap-2 rounded-2xl bg-red-600 py-4 text-[10px] font-black uppercase tracking-wider text-white shadow-[0_0_30px_rgba(255,0,24,0.2)] transition hover:bg-red-500 disabled:opacity-50">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {saving ? "Guardando..." : editingEvent ? "Actualizar Evento" : "Crear Evento"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

