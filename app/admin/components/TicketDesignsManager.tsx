"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Trash2, Plus, Loader2, Palette, Image as ImageIcon, Check } from "lucide-react";
import type { AdminEvent } from "@/lib/admin/types";
import { useToast } from "./Toast";
import type { TicketDesign } from "@/lib/tickets/designs";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setDesigns(data.designs || []);
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

  // Handle Add Design
  const handleAddDesign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !name || !badge || !accentColor || !imageFile) {
      toast("error", "Campos incompletos", "Por favor completa todos los campos.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("eventId", selectedEventId);
      formData.append("name", name);
      formData.append("badge", badge);
      formData.append("accentColor", accentColor);
      formData.append("image", imageFile);

      const res = await fetch("/api/admin/ticket-designs", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        toast("success", "Diseño agregado", "El diseño de entrada fue guardado con éxito.");
        setName("");
        setBadge("VIP ACCESS");
        setAccentColor("#C8FF00");
        setImageFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        loadDesigns();
      } else {
        toast("error", "Error al guardar", data.error);
      }
    } catch (err) {
      console.error(err);
      toast("error", "Error de red", "Ocurrió un error al subir el diseño.");
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

                      <button
                        onClick={() => handleDeleteDesign(design.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-500/20 text-red-500/80 hover:bg-red-500 hover:text-white transition"
                        title="Eliminar diseño"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upload Form */}
          <div className="rounded-2xl border border-white/5 bg-zinc-950/20 p-5 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <Plus className="h-4 w-4 text-red-500" /> Cargar Nuevo Diseño
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
                    required
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="design-file-input"
                  />
                  <label
                    htmlFor="design-file-input"
                    className="flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-zinc-900/40 py-6 hover:bg-zinc-900/70 transition"
                  >
                    {imageFile ? (
                      <div className="flex flex-col items-center text-center">
                        <Check className="h-6 w-6 text-green-500 mb-1" />
                        <span className="text-[10px] font-bold text-white px-3 max-w-[200px] truncate">
                          {imageFile.name}
                        </span>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="h-6 w-6 text-zinc-500 mb-1" />
                        <span className="text-[10px] font-bold text-zinc-400">Seleccionar Imagen</span>
                        <span className="text-[8px] text-zinc-600 mt-0.5">PNG o JPG de alta calidad</span>
                      </>
                    )}
                  </label>
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
                ) : (
                  <>
                    <Plus className="h-4 w-4" /> Agregar Diseño
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
