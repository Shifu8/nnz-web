"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { HomepageConfig } from "@/lib/homepage-config/types";
import { DEFAULT_HOMEPAGE_CONFIG } from "@/lib/homepage-config/defaults";

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
      setConfig((prev) => ({
        ...prev,
        [section]: { ...prev[section], [key]: value },
      }));
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

  const tabs: { id: SectionKeys; label: string }[] = [
    { id: "hero", label: "Hero" },
    { id: "ticketCard", label: "Ticket Card" },
    { id: "accessSection", label: "Access" },
    { id: "nextSignals", label: "Próximas señales" },
    { id: "footer", label: "Footer" },
  ];

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
                <label className={labelClass}>Botón "Ver evento"</label>
                <input
                  className={inputClass}
                  value={config.ticketCard.verEventoText}
                  onChange={(e) => updateNested("ticketCard", "verEventoText", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Botón "Comprar entrada"</label>
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
