"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Trash2, Plus, Loader2, Image as ImageIcon, Check, Send, Mail, Hash, Clock, User, Edit } from "lucide-react";
import type { AdminEvent } from "@/lib/admin/types";
import { useToast } from "./Toast";
import type { TicketDesign } from "@/lib/tickets/designs";
import { emailDomains, cleanEmailInput } from "@/frontend/utils/emailInput";

type SentLogEntry = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  quantity: number;
  designName: string;
  sentAt: Date;
};

type TicketDesignsManagerProps = {
  events: AdminEvent[];
};

export default function TicketDesignsManager({ events }: TicketDesignsManagerProps) {
  const { toast } = useToast();
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [designs, setDesigns] = useState<TicketDesign[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [badge, setBadge] = useState("VIP ACCESS");
  const [accentColor, setAccentColor] = useState("#C8FF00");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingDesignId, setEditingDesignId] = useState<string | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Send Tickets State
  const [recipientForm, setRecipientForm] = useState({ firstName: "", lastName: "", email: "" });
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [selectedDesignId, setSelectedDesignId] = useState<string>("");
  const [sendingTickets, setSendingTickets] = useState(false);

  // Sent Log
  const [sentLog, setSentLog] = useState<SentLogEntry[]>([]);
  const [logLoading, setLogLoading] = useState(false);

  // Set default event
  useEffect(() => {
    if (events.length > 0 && !selectedEventId) {
      // Find the active one or fallback to first
      const active = events.find((e) => e.status === "active") || events[0];
      setSelectedEventId(active.slug || active.id);
    }
  }, [events, selectedEventId]);

  // Load designs for selected event
  const loadDesigns = useCallback(async () => {
    if (!selectedEventId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/ticket-designs?eventId=${selectedEventId}`);
      const data = await res.json();
      if (data.success) {
        const loaded = data.designs || [];
        setDesigns(loaded);
        if (loaded.length > 0) {
          setSelectedDesignId(loaded[0].id);
        }
      } else {
        toast("error", "Error al cargar diseños", data.error);
      }
    } catch (err) {
      console.error(err);
      toast("error", "Error de red", "No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }, [selectedEventId, toast]);

  useEffect(() => {
    loadDesigns();
  }, [loadDesigns]);

  // Load persisted sent log from server
  const loadSentLog = useCallback(async () => {
    setLogLoading(true);
    try {
      const res = await fetch("/api/admin/ticket-send-log");
      const data = await res.json();
      if (data.success && Array.isArray(data.entries)) {
        setSentLog(
          data.entries.map((e: any) => ({
            ...e,
            sentAt: new Date(e.sentAt),
          }))
        );
      }
    } catch (err) {
      console.error("[SentLog] Error cargando registro:", err);
    } finally {
      setLogLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSentLog();
  }, [loadSentLog]);

  // Handle Start Edit
  const handleStartEdit = (design: TicketDesign) => {
    setName(design.name);
    setBadge(design.badge);
    setAccentColor(design.accentColor);
    setEditingDesignId(design.id || null);
    setExistingPhotoUrl(design.photo || null);
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Handle Add/Edit Design
  const handleAddDesign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !name || !badge || !accentColor || (!existingPhotoUrl && !imageFile)) {
      toast("error", "Campos incompletos", "Por favor completa todos los campos, incluyendo la imagen.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      if (editingDesignId) {
        formData.append("id", editingDesignId);
      }
      formData.append("eventId", selectedEventId);
      formData.append("name", name);
      formData.append("badge", badge);
      formData.append("accentColor", accentColor);
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const url = "/api/admin/ticket-designs";
      const method = editingDesignId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        toast(
          "success",
          editingDesignId ? "Diseño actualizado" : "Diseño agregado",
          editingDesignId ? "El diseño fue actualizado con éxito." : "El diseño de entrada fue guardado con éxito."
        );
        setName("");
        setBadge("VIP ACCESS");
        setAccentColor("#C8FF00");
        setImageFile(null);
        setEditingDesignId(null);
        setExistingPhotoUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        loadDesigns();
      } else {
        toast("error", "Error al guardar", data.error);
      }
    } catch (err) {
      console.error(err);
      toast("error", "Error de red", "Ocurrió un error al guardar el diseño.");
    } finally {
      setUploading(false);
    }
  };

  // Handle Delete Design
  const handleDeleteDesign = async (id?: string) => {
    if (!id) return;
    if (!confirm("¿Estás seguro de eliminar este diseño de entrada?")) return;

    try {
      const res = await fetch(`/api/admin/ticket-designs?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast("success", "Diseño eliminado", "El diseño fue removido correctamente.");
        loadDesigns();
      } else {
        toast("error", "Error al eliminar", data.error);
      }
    } catch (err) {
      console.error(err);
      toast("error", "Error de red", "No se pudo eliminar el diseño.");
    }
  };

  // Handle Send Tickets
  const handleSendTickets = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientForm.firstName || !recipientForm.lastName) {
      toast("error", "Campos incompletos", "Por favor completa el nombre y apellido.");
      return;
    }

    setSendingTickets(true);
    try {
      const res = await fetch("/api/admin/generate-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: recipientForm.firstName,
          lastName: recipientForm.lastName,
          email: recipientForm.email || undefined,
          quantity: ticketQuantity,
          ticketDesign: selectedDesignId || undefined,
          deliveryChannel: "email",
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast("success", "Entradas enviadas", `Se generaron y enviaron ${ticketQuantity} entrada(s) correctamente.`);
        // Build log entry and persist it to the server
        const designName = designs.find((d) => d.id === selectedDesignId)?.name || "Diseño por defecto";
        const newEntry: SentLogEntry = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          firstName: recipientForm.firstName,
          lastName: recipientForm.lastName,
          email: recipientForm.email,
          quantity: ticketQuantity,
          designName,
          sentAt: new Date(),
        };
        // Persist to server (fire-and-forget, don't block the UI)
        fetch("/api/admin/ticket-send-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...newEntry, sentAt: newEntry.sentAt.toISOString() }),
        }).catch((err) => console.error("[SentLog] Error guardando:", err));
        // Update local state immediately
        setSentLog((prev) => [newEntry, ...prev]);
        setRecipientForm({ firstName: "", lastName: "", email: "" });
        setTicketQuantity(1);
      } else {
        toast("error", "Error al enviar", data.error || "No se pudieron enviar las entradas.");
      }
    } catch (err) {
      console.error(err);
      toast("error", "Error de red", "No se pudo conectar con el servidor.");
    } finally {
      setSendingTickets(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-white/10 bg-black/40 p-6 backdrop-blur-xl">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-black uppercase tracking-wider text-white">Diseños de Entradas</h2>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
              Carga y administra las tarjetas para la vista previa de compra
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Evento:</span>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs font-bold text-white outline-none focus:border-red-500/50"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.slug || ev.id}>
                  {ev.title} {ev.status === "active" ? "(Activo)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* List Section */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Diseños Activos</h3>

            {loading ? (
              <div className="flex h-48 items-center justify-center rounded-2xl border border-white/5 bg-zinc-950/20">
                <Loader2 className="h-6 w-6 animate-spin text-red-500" />
              </div>
            ) : designs.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-zinc-950/10 p-6 text-center">
                <ImageIcon className="h-8 w-8 text-zinc-600 mb-2" />
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">No hay diseños personalizados</p>
                <p className="text-[10px] text-zinc-600 mt-1 max-w-xs">
                  Se mostrarán los diseños por defecto (Yan Block, Roa, etc.) hasta que subas uno aquí.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {designs.map((design) => (
                  <div
                    key={design.id}
                    className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/40 p-3 transition hover:border-white/20"
                  >
                    <div className="aspect-[4/5] w-full overflow-hidden rounded-xl border border-white/5 bg-zinc-900">
                      <img
                        src={design.photo}
                        alt={design.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: design.accentColor }}
                          />
                          <p className="text-xs font-black text-white uppercase tracking-wider">{design.name}</p>
                        </div>
                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                          {design.badge}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(design)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-white/80 hover:bg-white hover:text-black transition"
                          title="Editar diseño"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDesign(design.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-500/20 text-red-500/80 hover:bg-red-500 hover:text-white transition"
                          title="Eliminar diseño"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upload Form */}
          <div className="rounded-2xl border border-white/5 bg-zinc-950/20 p-5 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              {editingDesignId ? <Edit className="h-4 w-4 text-red-500" /> : <Plus className="h-4 w-4 text-red-500" />}
              {editingDesignId ? "Editar Diseño" : "Cargar Nuevo Diseño"}
            </h3>

            <form onSubmit={handleAddDesign} className="space-y-4">
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">
                  Nombre de la Tarjeta / Artista
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: YAN BLOCK, ROA"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-xs font-bold text-white outline-none focus:border-red-500/50"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">
                  Texto del Badge / Acceso
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: VIP ACCESS, SPECIAL PASS"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-xs font-bold text-white outline-none focus:border-red-500/50"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">
                  Color de Acento (Hex)
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="h-8 w-8 cursor-pointer rounded-lg border border-white/10 bg-transparent"
                  />
                  <input
                    type="text"
                    required
                    placeholder="#C8FF00"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="flex-1 rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-xs font-bold text-white outline-none focus:border-red-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">
                  Imagen de Fondo (Aspecto 1:1.75 / Vertical)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    ref={fileInputRef}
                    required={!editingDesignId && !existingPhotoUrl}
                    accept="image/*"
                    onChange={(e) => {
                      const selected = e.target.files?.[0] || null;
                      setImageFile(selected);
                      if (selected) setExistingPhotoUrl(null);
                    }}
                    className="hidden"
                    id="design-file-input"
                  />
                  {imageFile ? (
                    <div className="flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-zinc-900/40 py-6">
                      <div className="flex flex-col items-center text-center">
                        <Check className="h-6 w-6 text-green-500 mb-1" />
                        <span className="text-[10px] font-bold text-white px-3 max-w-[200px] truncate mb-2">
                          {imageFile.name}
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[8px] font-black uppercase tracking-wider text-white transition hover:bg-white/10"
                          >
                            Cambiar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setImageFile(null);
                              if (fileInputRef.current) fileInputRef.current.value = "";
                            }}
                            className="rounded-lg border border-red-500/20 bg-red-950/20 px-2.5 py-1 text-[8px] font-black uppercase tracking-wider text-red-400 transition hover:bg-red-950/40"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : existingPhotoUrl ? (
                    <div className="flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-zinc-900/40 py-6">
                      <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-16 rounded overflow-hidden border border-white/10 bg-black mb-2 relative">
                          <img src={existingPhotoUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[8px] font-black uppercase tracking-wider text-white transition hover:bg-white/10"
                          >
                            Cambiar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setExistingPhotoUrl(null);
                              setImageFile(null);
                              if (fileInputRef.current) fileInputRef.current.value = "";
                            }}
                            className="rounded-lg border border-red-500/20 bg-red-950/20 px-2.5 py-1 text-[8px] font-black uppercase tracking-wider text-red-400 transition hover:bg-red-950/40"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <label
                      htmlFor="design-file-input"
                      className="flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-zinc-900/40 py-6 hover:bg-zinc-900/70 transition"
                    >
                      <ImageIcon className="h-6 w-6 text-zinc-500 mb-1" />
                      <span className="text-[10px] font-bold text-zinc-400">Seleccionar Imagen</span>
                      <span className="text-[8px] text-zinc-600 mt-0.5">PNG o JPG de alta calidad</span>
                    </label>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-xs font-black uppercase tracking-wider text-white transition hover:bg-red-500 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
                  </>
                ) : editingDesignId ? (
                  <>
                    <Check className="h-4 w-4" /> Guardar Cambios
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" /> Agregar Diseño
                  </>
                )}
              </button>
              {editingDesignId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingDesignId(null);
                    setName("");
                    setBadge("VIP ACCESS");
                    setAccentColor("#C8FF00");
                    setImageFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] py-2.5 text-xs font-black uppercase tracking-wider text-zinc-400 transition hover:border-white/20 hover:text-white mt-2"
                >
                  Cancelar Edición
                </button>
              )}
            </form>
          </div>

          {/* Send Tickets Form + Log — side by side */}
          <div className="lg:col-span-1 grid gap-5 xl:grid-cols-2 xl:col-span-3">
            {/* Send Tickets Form */}
            <div className="rounded-2xl border border-white/5 bg-zinc-950/20 p-5 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <Send className="h-3.5 w-3.5 text-[#C8FF00]" /> Enviar Entradas VIP (Gmail)
              </h3>

              <form onSubmit={handleSendTickets} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">
                    Seleccionar Diseño de Entrada
                  </label>
                  <select
                    className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-xs font-bold text-white outline-none focus:border-[#C8FF00]/40"
                    value={selectedDesignId}
                    onChange={(e) => setSelectedDesignId(e.target.value)}
                  >
                    {designs.map((design) => (
                      <option key={design.id} value={design.id} className="bg-black text-white">
                        {design.name} ({design.badge})
                      </option>
                    ))}
                    {designs.length === 0 && (
                      <option value="" className="bg-black text-white">
                        Diseño por defecto (1)
                      </option>
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">
                      Nombre
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: JUAN"
                      value={recipientForm.firstName}
                      onChange={(e) => setRecipientForm({ ...recipientForm, firstName: e.target.value.toUpperCase() })}
                      className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-xs font-bold text-white outline-none focus:border-[#C8FF00]/40"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">
                      Apellido
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: PEREZ"
                      value={recipientForm.lastName}
                      onChange={(e) => setRecipientForm({ ...recipientForm, lastName: e.target.value.toUpperCase() })}
                      className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-xs font-bold text-white outline-none focus:border-[#C8FF00]/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">
                    Correo Electrónico (Gmail)
                  </label>
                  <input
                    type="email"
                    required
                    list="admin-ticket-email-domains"
                    placeholder="ejemplo@gmail.com"
                    value={recipientForm.email}
                    onChange={(e) => setRecipientForm({ ...recipientForm, email: cleanEmailInput(e.target.value) })}
                    className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-xs font-bold text-white outline-none focus:border-[#C8FF00]/40"
                  />
                  <datalist key={recipientForm.email.split("@")[0] || "ejemplo"} id="admin-ticket-email-domains">
                    {emailDomains.map((domain) => {
                      const local = recipientForm.email.split("@")[0] || "ejemplo";
                      return <option key={domain} value={`${local}@${domain}`} />;
                    })}
                  </datalist>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-900/40 p-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    Cantidad de Entradas
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setTicketQuantity((q) => Math.max(1, q - 1))}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-zinc-950 text-xs font-bold text-white hover:bg-zinc-800 transition select-none"
                    >
                      -
                    </button>
                    <span className="w-6 text-center text-sm font-black text-white select-none">
                      {ticketQuantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setTicketQuantity((q) => Math.min(50, q + 1))}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-zinc-950 text-xs font-bold text-white hover:bg-zinc-800 transition select-none"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={sendingTickets}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-black uppercase tracking-wider text-black transition disabled:opacity-50 hover:brightness-110"
                  style={{ backgroundColor: "#C8FF00" }}
                >
                  {sendingTickets ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" /> Generar y Enviar
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Sent Tickets Log */}
            <div className="rounded-2xl border border-white/5 bg-zinc-950/20 p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-[#C8FF00]" /> Registro de Envíos
                </h3>
                {sentLog.length > 0 && (
                  <span
                    className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[9px] font-black text-black"
                    style={{ backgroundColor: "#C8FF00" }}
                  >
                    {sentLog.length}
                  </span>
                )}
              </div>

              {logLoading ? (
                <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-zinc-950/10 py-10 text-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-[#C8FF00]" />
                  <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Cargando registros...</p>
                </div>
              ) : sentLog.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-zinc-950/10 py-10 text-center gap-2">
                  <Send className="h-6 w-6 text-zinc-600" />
                  <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Sin envíos aún</p>
                  <p className="text-[9px] text-zinc-700 max-w-[160px]">
                    Los envíos se guardan y persisten entre sesiones
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 overflow-y-auto max-h-[420px] pr-0.5" style={{ scrollbarWidth: "thin", scrollbarColor: "#3f3f46 transparent" }}>
                  {sentLog.map((entry, idx) => (
                    <div
                      key={entry.id}
                      className="group relative rounded-xl border border-white/8 bg-gradient-to-br from-zinc-900/80 to-zinc-950/60 p-3 transition hover:border-[#C8FF00]/20 hover:from-zinc-900/90"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      {/* Top row: name + ticket count badge */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#C8FF00]/10 border border-[#C8FF00]/20">
                            <User className="h-3.5 w-3.5 text-[#C8FF00]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-black text-white uppercase truncate leading-tight">
                              {entry.firstName} {entry.lastName}
                            </p>
                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest truncate">
                              {entry.designName}
                            </p>
                          </div>
                        </div>
                        <div
                          className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-black text-black"
                          style={{ backgroundColor: "#C8FF00" }}
                        >
                          <Hash className="h-2.5 w-2.5" />
                          {entry.quantity}
                        </div>
                      </div>

                      {/* Email row */}
                      <div className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-zinc-950/40 px-2.5 py-1.5 mb-1.5">
                        <Mail className="h-3 w-3 text-zinc-500 shrink-0" />
                        <span className="text-[10px] font-bold text-zinc-300 truncate">{entry.email}</span>
                      </div>

                      {/* Footer: timestamp */}
                      <div className="flex items-center gap-1 text-[9px] text-zinc-600">
                        <Clock className="h-2.5 w-2.5" />
                        <span>
                          {entry.sentAt.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          {" · "}
                          {entry.sentAt.toLocaleDateString("es-EC", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                      </div>

                      {/* Subtle left accent stripe */}
                      <div
                        className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full opacity-60"
                        style={{ backgroundColor: "#C8FF00" }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
