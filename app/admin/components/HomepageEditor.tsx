"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Check } from "lucide-react";
import type { HomepageConfig, Cover } from "@/lib/homepage-config/types";
import { DEFAULT_HOMEPAGE_CONFIG, COVER_POSITIONS } from "@/lib/homepage-config/defaults";
import { hexToRgb, THEMES } from "@/lib/homepage-config/themes";

const AUTH_HEADERS = {
  Authorization: `Bearer ${Buffer.from("admin:dawgs2026").toString("base64")}`,
};

type SectionKeys = keyof HomepageConfig;
type NestedValue = string | number | { first: string; second: string } | { initials: string; name: string } | { step: string; title: string; copy: string } | { name: string; instagram: string };

export default function HomepageEditor() {
  const [config, setConfig] = useState<HomepageConfig>(DEFAULT_HOMEPAGE_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<SectionKeys>("hero");

  useEffect(() => {
    fetch("/api/admin/homepage-config", { headers: AUTH_HEADERS })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.config) setConfig(data.config);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateNested = useCallback(
    <K extends SectionKeys>(section: K, key: string, value: NestedValue) => {
      setConfig((prev) => {
        const sectionData = prev[section];
        if (typeof sectionData !== "object" || sectionData === null) return prev;
        return {
          ...prev,
          [section]: { ...sectionData, [key]: value },
        };
      });
    },
    [],
  );

  const updateArtist = useCallback((index: number, field: "first" | "second", value: string) => {
    setConfig((prev) => {
      const artists = [...prev.hero.artistNames];
      artists[index] = { ...artists[index], [field]: value };
      return { ...prev, hero: { ...prev.hero, artistNames: artists } };
    });
  }, []);

  const updateSponsor = useCallback((index: number, field: "initials" | "name", value: string) => {
    setConfig((prev) => {
      const sponsors = [...prev.ticketCard.sponsors];
      sponsors[index] = { ...sponsors[index], [field]: value };
      return { ...prev, ticketCard: { ...prev.ticketCard, sponsors } };
    });
  }, []);

  const updateStep = useCallback(
    (index: number, field: "step" | "title" | "copy", value: string) => {
      setConfig((prev) => {
        const steps = [...prev.accessSection.steps];
        steps[index] = { ...steps[index], [field]: value };
        return { ...prev, accessSection: { ...prev.accessSection, steps } };
      });
    },
    [],
  );

  const addArtist = () => {
    setConfig((prev) => ({
      ...prev,
      hero: { ...prev.hero, artistNames: [...prev.hero.artistNames, { first: "", second: "" }] },
    }));
  };

  const removeArtist = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      hero: { ...prev.hero, artistNames: prev.hero.artistNames.filter((_, i) => i !== index) },
    }));
  };

  const addSponsor = () => {
    setConfig((prev) => ({
      ...prev,
      ticketCard: {
        ...prev.ticketCard,
        sponsors: [...prev.ticketCard.sponsors, { initials: "", name: "" }],
      },
    }));
  };

  const removeSponsor = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      ticketCard: {
        ...prev.ticketCard,
        sponsors: prev.ticketCard.sponsors.filter((_, i) => i !== index),
      },
    }));
  };

  const addStep = () => {
    setConfig((prev) => ({
      ...prev,
      accessSection: {
        ...prev.accessSection,
        steps: [...prev.accessSection.steps, { step: "", title: "", copy: "" }],
      },
    }));
  };

  const removeStep = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      accessSection: {
        ...prev.accessSection,
        steps: prev.accessSection.steps.filter((_, i) => i !== index),
      },
    }));
  };

  const updateCover = (index: number, field: keyof Cover, value: string | number) => {
    setConfig((prev) => {
      const covers = [...prev.covers];
      covers[index] = { ...covers[index], [field]: value };
      return { ...prev, covers };
    });
  };

  const addCover = () => {
    setConfig((prev) => ({
      ...prev,
      covers: [
        ...prev.covers,
        {
          src: "/images/trap_loud_trio_artists.png",
          label: "Nuevo álbum",
          className: COVER_POSITIONS[prev.covers.length % COVER_POSITIONS.length],
          rotation: 0,
          delay: prev.covers.length * 0.25,
        },
      ],
    }));
  };

  const removeCover = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      covers: prev.covers.filter((_, i) => i !== index),
    }));
  };

  const handleCoverUpload = async (index: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/admin/homepage-config/upload", {
        method: "POST",
        headers: AUTH_HEADERS,
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        updateCover(index, "src", data.url);
      } else {
        alert("Error al subir imagen");
      }
    } catch {
      alert("Error de red al subir");
    }
  };

  const btnClass =
    "inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.15em] text-zinc-400 transition hover:border-pink-400/30 hover:text-pink-300";

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/homepage-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...AUTH_HEADERS },
        body: JSON.stringify({ config }),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      alert("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const tabs: { id: SectionKeys | "covers" | "theme"; label: string }[] = [
    { id: "hero", label: "Hero" },
    { id: "covers", label: "Álbumes" },
    { id: "ticketCard", label: "Ticket Card" },
    { id: "accessSection", label: "Access" },
    { id: "nextSignals", label: "Próximas señales" },
    { id: "theme", label: "Tema" },
    { id: "footer", label: "Footer" },
  ];

  const selectedTheme = THEMES.find((theme) => theme.id === config.theme) ?? THEMES[0];
  const selectedThemeRgb = hexToRgb(selectedTheme.colors.primary);

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-pink-400/50 focus:bg-white/[0.06]";
  const labelClass = "block text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1.5";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-pink-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex flex-wrap gap-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-xl px-4 py-2 text-[9px] font-black uppercase tracking-[0.18em] transition ${
              activeTab === tab.id
                ? "bg-pink-500 text-white shadow-[0_0_20px_rgba(236,72,153,0.3)]"
                : "border border-white/10 bg-white/[0.04] text-zinc-400 hover:border-white/20 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Form sections */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-5">
        {activeTab === "covers" && (
          <>
            <div className="space-y-3">
              {config.covers.map((cover, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500">
                      Álbum {i + 1}
                    </p>
                    <button
                      onClick={() => removeCover(i)}
                      className="rounded-lg border border-white/10 bg-white/[0.04] p-1.5 text-zinc-500 transition hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-300"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Image preview + upload */}
                  <div className="flex items-center gap-3">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-900">
                      <img
                        src={cover.src}
                        alt={cover.label}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <label className="cursor-pointer rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[8px] font-black uppercase tracking-[0.15em] text-zinc-400 transition hover:border-pink-400/30 hover:text-pink-300">
                      Cambiar imagen
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleCoverUpload(i, file);
                        }}
                      />
                    </label>
                  </div>

                  <input
                    className={inputClass}
                    placeholder="Label"
                    value={cover.label}
                    onChange={(e) => updateCover(i, "label", e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[7px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">
                        Rotación
                      </label>
                      <input
                        type="number"
                        className={inputClass}
                        value={cover.rotation}
                        onChange={(e) =>
                          updateCover(i, "rotation", Number(e.target.value))
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-[7px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">
                        Delay (s)
                      </label>
                      <input
                        type="number"
                        step={0.05}
                        className={inputClass}
                        value={cover.delay}
                        onChange={(e) =>
                          updateCover(i, "delay", Number(e.target.value))
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[7px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">
                      Posición
                    </label>
                    <select
                      className={inputClass}
                      value={cover.className}
                      onChange={(e) => updateCover(i, "className", e.target.value)}
                    >
                      {COVER_POSITIONS.map((pos, pi) => (
                        <option key={pi} value={pos} className="bg-zinc-900 text-white">
                          Posición {pi + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
              <button onClick={addCover} className={btnClass}>
                <Plus className="h-3 w-3" /> Agregar álbum
              </button>
            </div>
          </>
        )}
        {activeTab === "hero" && (
          <>
            <div>
              <label className={labelClass}>Tagline</label>
              <input
                className={inputClass}
                value={config.hero.tagline}
                onChange={(e) => updateNested("hero", "tagline", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Descripción móvil</label>
              <textarea
                rows={2}
                className={inputClass}
                value={config.hero.mobileDescription}
                onChange={(e) => updateNested("hero", "mobileDescription", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Artistas (cycling)</label>
              {config.hero.artistNames.map((a, i) => (
                <div key={i} className="mt-2 flex gap-2 items-center">
                  <input
                    className={inputClass}
                    placeholder="First name"
                    value={a.first}
                    onChange={(e) => updateArtist(i, "first", e.target.value)}
                  />
                  <input
                    className={inputClass}
                    placeholder="Second name (optional)"
                    value={a.second}
                    onChange={(e) => updateArtist(i, "second", e.target.value)}
                  />
                  <button onClick={() => removeArtist(i)} className="shrink-0 rounded-xl border border-white/10 bg-white/[0.04] p-2 text-zinc-500 transition hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-300">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <button onClick={addArtist} className={btnClass}>
                <Plus className="h-3 w-3" /> Agregar artista
              </button>
            </div>
          </>
        )}

        {activeTab === "ticketCard" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Badge</label>
                <input
                  className={inputClass}
                  value={config.ticketCard.badge}
                  onChange={(e) => updateNested("ticketCard", "badge", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Badge subtitle</label>
                <input
                  className={inputClass}
                  value={config.ticketCard.badgeSub}
                  onChange={(e) => updateNested("ticketCard", "badgeSub", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Precio</label>
                <input
                  type="number"
                  className={inputClass}
                  value={config.ticketCard.price}
                  onChange={(e) => updateNested("ticketCard", "price", Number(e.target.value))}
                />
              </div>
              <div>
                <label className={labelClass}>Moneda</label>
                <input
                  className={inputClass}
                  value={config.ticketCard.currency}
                  onChange={(e) => updateNested("ticketCard", "currency", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Título del evento</label>
              <input
                className={inputClass}
                value={config.ticketCard.eventTitle}
                onChange={(e) => updateNested("ticketCard", "eventTitle", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Subtítulo del evento</label>
              <input
                className={inputClass}
                value={config.ticketCard.eventSubtitle}
                onChange={(e) => updateNested("ticketCard", "eventSubtitle", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Descripción</label>
              <textarea
                rows={2}
                className={inputClass}
                value={config.ticketCard.description}
                onChange={(e) => updateNested("ticketCard", "description", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>DAWG DJ</label>
              <div className="mt-1 flex gap-2">
                <input
                  className={inputClass}
                  placeholder="Name"
                  value={config.ticketCard.daWgDj.name}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      ticketCard: {
                        ...prev.ticketCard,
                        daWgDj: { ...prev.ticketCard.daWgDj, name: e.target.value },
                      },
                    }))
                  }
                />
                <input
                  className={inputClass}
                  placeholder="Instagram"
                  value={config.ticketCard.daWgDj.instagram}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      ticketCard: {
                        ...prev.ticketCard,
                        daWgDj: { ...prev.ticketCard.daWgDj, instagram: e.target.value },
                      },
                    }))
                  }
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Sponsors</label>
              {config.ticketCard.sponsors.map((s, i) => (
                <div key={i} className="mt-2 flex gap-2 items-center">
                  <input
                    className={inputClass}
                    placeholder="Initials"
                    value={s.initials}
                    onChange={(e) => updateSponsor(i, "initials", e.target.value)}
                  />
                  <input
                    className={inputClass}
                    placeholder="Name"
                    value={s.name}
                    onChange={(e) => updateSponsor(i, "name", e.target.value)}
                  />
                  <button onClick={() => removeSponsor(i)} className="shrink-0 rounded-xl border border-white/10 bg-white/[0.04] p-2 text-zinc-500 transition hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-300">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <button onClick={addSponsor} className={btnClass}>
                <Plus className="h-3 w-3" /> Agregar sponsor
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Botón &quot;Ver evento&quot;</label>
                <input
                  className={inputClass}
                  value={config.ticketCard.verEventoText}
                  onChange={(e) => updateNested("ticketCard", "verEventoText", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Botón &quot;Comprar entrada&quot;</label>
                <input
                  className={inputClass}
                  value={config.ticketCard.comprarEntradaText}
                  onChange={(e) => updateNested("ticketCard", "comprarEntradaText", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Countdown label</label>
              <input
                className={inputClass}
                value={config.ticketCard.countdownLabel}
                onChange={(e) => updateNested("ticketCard", "countdownLabel", e.target.value)}
              />
            </div>
          </>
        )}

        {activeTab === "accessSection" && (
          <>
            <div>
              <label className={labelClass}>Badge</label>
              <input
                className={inputClass}
                value={config.accessSection.badge}
                onChange={(e) => updateNested("accessSection", "badge", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Heading línea 1</label>
                <input
                  className={inputClass}
                  value={config.accessSection.headingLine1}
                  onChange={(e) => updateNested("accessSection", "headingLine1", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Heading línea 2</label>
                <input
                  className={inputClass}
                  value={config.accessSection.headingLine2}
                  onChange={(e) => updateNested("accessSection", "headingLine2", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>QR subtitle</label>
              <input
                className={inputClass}
                value={config.accessSection.qrSubtitle}
                onChange={(e) => updateNested("accessSection", "qrSubtitle", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Descripción</label>
              <textarea
                rows={3}
                className={inputClass}
                value={config.accessSection.description}
                onChange={(e) => updateNested("accessSection", "description", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Steps</label>
              {config.accessSection.steps.map((s, i) => (
                <div key={i} className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500">Step {i + 1}</p>
                    <button onClick={() => removeStep(i)} className="rounded-lg border border-white/10 bg-white/[0.04] p-1.5 text-zinc-500 transition hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-300">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <input
                    className={inputClass}
                    placeholder="Step number"
                    value={s.step}
                    onChange={(e) => updateStep(i, "step", e.target.value)}
                  />
                  <input
                    className={inputClass}
                    placeholder="Title"
                    value={s.title}
                    onChange={(e) => updateStep(i, "title", e.target.value)}
                  />
                  <textarea
                    rows={2}
                    className={inputClass}
                    placeholder="Copy"
                    value={s.copy}
                    onChange={(e) => updateStep(i, "copy", e.target.value)}
                  />
                </div>
              ))}
              <button onClick={addStep} className={btnClass}>
                <Plus className="h-3 w-3" /> Agregar step
              </button>
            </div>
          </>
        )}

        {activeTab === "nextSignals" && (
          <>
            <div>
              <label className={labelClass}>Pre-heading</label>
              <input
                className={inputClass}
                value={config.nextSignals.preHeading}
                onChange={(e) => updateNested("nextSignals", "preHeading", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Heading</label>
              <input
                className={inputClass}
                value={config.nextSignals.heading}
                onChange={(e) => updateNested("nextSignals", "heading", e.target.value)}
              />
            </div>
          </>
        )}

        {activeTab === "theme" && (
          <>
            <div className="space-y-5">
              <label className={labelClass}>Tema de color</label>
              <p className="text-[9px] leading-4 text-zinc-500">
                Elige la energía visual del homepage. La vista previa cambia al instante y se aplica al guardar.
              </p>

              <div
                className="relative overflow-hidden rounded-[28px] border p-5 sm:p-6"
                style={{
                  borderColor: `rgba(${selectedThemeRgb}, 0.38)`,
                  background: `radial-gradient(circle at 18% 20%, rgba(${selectedThemeRgb}, 0.36), transparent 34%), linear-gradient(135deg, rgba(${selectedThemeRgb}, 0.18), rgba(6,6,6,0.96) 52%, rgba(${selectedThemeRgb}, 0.1))`,
                  boxShadow: `0 20px 70px rgba(0,0,0,0.42), 0 0 55px rgba(${selectedThemeRgb}, 0.16)`,
                }}
              >
                <div
                  className="absolute -right-12 -top-14 h-40 w-40 rounded-full blur-3xl"
                  style={{ backgroundColor: `rgba(${selectedThemeRgb}, 0.3)` }}
                />
                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor: selectedTheme.colors.primaryLight,
                          boxShadow: `0 0 14px ${selectedTheme.colors.primary}`,
                        }}
                      />
                      <p className="text-[8px] font-black uppercase tracking-[0.25em] text-white/60">
                        Atmósfera activa
                      </p>
                    </div>
                    <h3 className="mt-2 text-2xl font-black uppercase italic tracking-tight text-white">
                      {selectedTheme.label}
                    </h3>
                    <p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-zinc-400">
                      Fondos, luces, botones y destellos
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {[selectedTheme.colors.primaryDark, selectedTheme.colors.primary, selectedTheme.colors.primaryLight].map((color, index) => (
                      <span
                        key={color}
                        className={`rounded-2xl border border-white/15 ${index === 1 ? "h-14 w-14" : "h-10 w-10"}`}
                        style={{
                          backgroundColor: color,
                          boxShadow: index === 1 ? `0 0 30px rgba(${selectedThemeRgb}, 0.45)` : "none",
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="relative mt-5 flex items-center gap-3">
                  <div
                    className="h-2 flex-1 rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${selectedTheme.colors.bgFrom}, ${selectedTheme.colors.primaryLight}, ${selectedTheme.colors.bgTo})`,
                      boxShadow: `0 0 20px rgba(${selectedThemeRgb}, 0.36)`,
                    }}
                  />
                  <span
                    className="rounded-full px-4 py-2 text-[8px] font-black uppercase tracking-[0.18em] text-white"
                    style={{
                      background: `linear-gradient(135deg, ${selectedTheme.colors.btnFrom}, ${selectedTheme.colors.btnTo})`,
                      boxShadow: `0 0 24px ${selectedTheme.colors.btnShadow}`,
                    }}
                  >
                    Ver tickets
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {THEMES.map((t) => {
                  const isActive = config.theme === t.id;
                  const rgb = hexToRgb(t.colors.primary);
                  return (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setConfig((prev) => ({ ...prev, theme: t.id }))}
                      aria-pressed={isActive}
                      className="group relative min-h-36 overflow-hidden rounded-2xl border p-4 text-left transition duration-300 hover:-translate-y-1"
                      style={{
                        borderColor: `rgba(${rgb}, ${isActive ? "0.7" : "0.2"})`,
                        background: `radial-gradient(circle at 20% 8%, rgba(${rgb}, ${isActive ? "0.34" : "0.14"}), transparent 46%), rgba(255,255,255,${isActive ? "0.055" : "0.02"})`,
                        boxShadow: isActive
                          ? `0 0 0 1px rgba(${rgb}, 0.25), 0 16px 44px rgba(${rgb}, 0.2)`
                          : "0 12px 30px rgba(0,0,0,0.18)",
                      }}
                    >
                      <div
                        className="absolute inset-x-0 bottom-0 h-1 transition-all duration-300 group-hover:h-1.5"
                        style={{ background: `linear-gradient(90deg, ${t.colors.bgFrom}, ${t.colors.primaryLight}, ${t.colors.bgTo})` }}
                      />
                      {isActive && (
                        <div
                          className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full text-black"
                          style={{
                            backgroundColor: t.colors.primaryLight,
                            boxShadow: `0 0 18px rgba(${rgb}, 0.7)`,
                          }}
                        >
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        </div>
                      )}
                      <div
                        className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15"
                        style={{
                          background: `linear-gradient(145deg, ${t.colors.primaryLight}, ${t.colors.primaryDark})`,
                          boxShadow: `0 0 26px rgba(${rgb}, 0.34)`,
                        }}
                      >
                        <span className="h-2 w-2 rounded-full bg-white/90 shadow-[0_0_10px_white]" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.08em] text-white">{t.label}</p>
                      <p className="mt-1 text-[8px] uppercase tracking-[0.14em] text-white/40">
                        {isActive ? "Seleccionado" : "Elegir paleta"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
        {activeTab === "footer" && (
          <>
            <div>
              <label className={labelClass}>Brand</label>
              <input
                className={inputClass}
                value={config.footer.brand}
                onChange={(e) => updateNested("footer", "brand", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Tagline</label>
              <input
                className={inputClass}
                value={config.footer.tagline}
                onChange={(e) => updateNested("footer", "tagline", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                className={inputClass}
                value={config.footer.email}
                onChange={(e) => updateNested("footer", "email", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Copyright</label>
              <input
                className={inputClass}
                value={config.footer.copyright}
                onChange={(e) => updateNested("footer", "copyright", e.target.value)}
              />
            </div>
          </>
        )}
      </div>

      {/* Save button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex h-11 items-center gap-2 rounded-2xl bg-pink-500 px-6 text-[9px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-pink-400 disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
        {saved && (
          <span className="text-[10px] font-bold text-green-400">¡Guardado!</span>
        )}
      </div>
    </div>
  );
}
