"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";
const CITIES = ["Loja", "Quito", "Guayaquil", "Cuenca", "Ambato", "Manta", "Ibarra"];
const CATEGORIES = ["Festival", "Club", "Concierto", "Arte y cultura", "Ferias y gastronomía", "Talleres y educación", "Deportes y bienestar", "Comunidad", "Electrónica", "Reggaeton", "Urban", "Indie", "Otros"];

export default function NewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    description: "",
    category: "Festival",
    city: "Loja",
    venue: "",
    address: "",
    event_date: "",
    starts_at: "20:00",
    ends_at: "03:00",
    age_restriction: "+18",
    base_price: 10.0,
    capacity: 500,
    lineup: "",
    payment_bank: "Banco Pichincha",
    payment_account: "",
    payment_owner: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.title.trim()) return setError("El título es obligatorio.");
    if (!form.event_date) return setError("La fecha es obligatoria.");

    const token = localStorage.getItem("organizer_token");
    if (!token) {
      router.push("/organizer/login");
      return;
    }

    setLoading(true);
    try {
      const lineupArray = form.lineup
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const paymentInfoObj = {
        bank: form.payment_bank,
        account: form.payment_account,
        owner: form.payment_owner,
      };

      const res = await fetch(`${BACKEND_URL}/api/v1/organizer/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.title,
          subtitle: form.subtitle || undefined,
          description: form.description || undefined,
          category: form.category,
          city: form.city,
          venue: form.venue || undefined,
          address: form.address || undefined,
          event_date: form.event_date,
          starts_at: form.starts_at || undefined,
          ends_at: form.ends_at || undefined,
          age_restriction: form.age_restriction || undefined,
          base_price: Number(form.base_price) || 0,
          capacity: Number(form.capacity) || undefined,
          lineup_json: lineupArray.length > 0 ? JSON.stringify(lineupArray) : undefined,
          payment_info_json: JSON.stringify(paymentInfoObj),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al crear el evento.");
      }

      router.push(`/organizer/events/${data.id}`);
    } catch (err: any) {
      setError(err.message || "Error al crear el evento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push("/organizer/dashboard")}
            className="text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-white transition flex items-center gap-2"
          >
            ← Cancelar
          </button>
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
            Nuevo Evento · Draft
          </span>
        </div>

        <h1 className="text-3xl font-black tracking-tight mb-2">Crear Evento</h1>
        <p className="text-zinc-500 text-sm mb-8">
          Completa los datos básicos. Podrás agregar tipos de entrada y configurar tu equipo más adelante.
        </p>

        {error && (
          <div className="p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General */}
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-white/5 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Información General</h3>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">
                Título del Evento *
              </label>
              <input
                type="text"
                name="title"
                required
                value={form.title}
                onChange={handleChange}
                placeholder="Ej: Sunset Music Festival 2026"
                className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">
                Subtítulo / Tagline
              </label>
              <input
                type="text"
                name="subtitle"
                value={form.subtitle}
                onChange={handleChange}
                placeholder="Ej: La fiesta más esperada del año en Loja"
                className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">
                  Categoría
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">
                  Restricción de Edad
                </label>
                <select
                  name="age_restriction"
                  value={form.age_restriction}
                  onChange={handleChange}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white"
                >
                  <option value="Todo Público">Todo Público</option>
                  <option value="+16">+16</option>
                  <option value="+18">+18</option>
                  <option value="+21">+21</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">
                Descripción
              </label>
              <textarea
                name="description"
                rows={4}
                value={form.description}
                onChange={handleChange}
                placeholder="Detalles sobre el concepto del evento, código de vestimenta, horarios..."
                className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white resize-none"
              />
            </div>
          </div>

          {/* Fecha y Lugar */}
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-white/5 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Fecha y Ubicación</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">
                  Ciudad *
                </label>
                <select
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white"
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">
                  Fecha (AAAA-MM-DD) *
                </label>
                <input
                  type="date"
                  name="event_date"
                  required
                  value={form.event_date}
                  onChange={handleChange}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">
                  Lugar / Venue
                </label>
                <input
                  type="text"
                  name="venue"
                  value={form.venue}
                  onChange={handleChange}
                  placeholder="Ej: Quinta El Portal"
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Ej: Av. Salvador Bustamante Celi"
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white"
                />
              </div>
            </div>
          </div>

          {/* Precio Base y Aforo */}
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-white/5 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Precios y Aforo</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">
                  Precio Base ($ USD)
                </label>
                <input
                  type="number"
                  step="0.5"
                  name="base_price"
                  value={form.base_price}
                  onChange={handleChange}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">
                  Capacidad Total (Aforo)
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={form.capacity}
                  onChange={handleChange}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">
                Line Up / Artistas (Un artista por línea)
              </label>
              <textarea
                name="lineup"
                rows={3}
                value={form.lineup}
                onChange={handleChange}
                placeholder={"DJ Snake\nMartin Garrix\nLocal Support DJ"}
                className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white resize-none font-mono text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-white text-black font-black text-sm uppercase tracking-widest hover:bg-zinc-200 transition disabled:opacity-50 shadow-xl"
          >
            {loading ? "Creando Evento..." : "Guardar y Continuar"}
          </button>
        </form>
      </div>
    </div>
  );
}
