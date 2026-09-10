"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  X,
  Sparkles,
  Ticket,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  MessageCircle,
  Building2,
  Mail,
  Lock,
  User,
  MapPin,
  Globe,
  Zap,
  CreditCard,
} from "lucide-react";
import { gsap } from "gsap";
import { useRouter } from "next/navigation";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

interface PublishEventModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PublishEventModal({ isOpen, onClose }: PublishEventModalProps) {
  const router = useRouter();
  const [isClosing, setIsClosing] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Form & Tab State
  const [mode, setMode] = useState<"register" | "login">("register");
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [form, setForm] = useState({
    org_name: "",
    display_name: "",
    city: "Loja",
    bio: "",
    instagram: "",
    website: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  useEffect(() => {
    if (isOpen && !isClosing && modalRef.current && backdropRef.current) {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      gsap.killTweensOf([modalRef.current, backdropRef.current]);

      gsap.fromTo(
        backdropRef.current,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: reduceMotion ? 0 : 0.24, ease: "power2.out" }
      );

      gsap.fromTo(
        modalRef.current,
        {
          opacity: 0,
          y: 24,
          scale: reduceMotion ? 1 : 0.97,
          filter: reduceMotion ? "none" : "blur(10px)",
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: reduceMotion ? 0 : 0.4,
          ease: "power3.out",
        }
      );
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen && !isClosing) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isClosing]);

  const handleClose = () => {
    if (isClosing) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !modalRef.current || !backdropRef.current) {
      setIsClosing(false);
      onClose();
      return;
    }

    setIsClosing(true);
    gsap.killTweensOf([modalRef.current, backdropRef.current]);

    gsap.to(backdropRef.current, {
      autoAlpha: 0,
      duration: 0.2,
      ease: "power2.inOut",
    });

    gsap.to(modalRef.current, {
      opacity: 0,
      y: 20,
      scale: 0.95,
      filter: "blur(8px)",
      duration: 0.25,
      ease: "power3.in",
      onComplete: () => {
        setIsClosing(false);
        onClose();
      },
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleNextStep = () => {
    if (!form.org_name.trim()) return setError("El nombre de tu organización es requerido.");
    if (!form.display_name.trim()) return setError("El nombre para mostrar es requerido.");
    setError("");
    setStep(2);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.email.trim()) return setError("El email es requerido.");
    if (form.password.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    if (form.password !== form.confirm_password) return setError("Las contraseñas no coinciden.");

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/organizers/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_name: form.org_name,
          display_name: form.display_name,
          city: form.city,
          email: form.email,
          password: form.password,
          bio: form.bio || undefined,
          instagram: form.instagram || undefined,
          website: form.website || undefined,
          turnstile_token: "dev-token",
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || data?.detail || `Error al registrarse (${res.status}). Intenta de nuevo.`);
        return;
      }

      localStorage.setItem("organizer_token", data.access_token);
      localStorage.setItem("organizer_refresh", data.refresh_token);
      localStorage.setItem("organizer_profile", JSON.stringify(data.organizer));

      setSuccessMsg("¡Registro exitoso! Redirigiendo al panel...");
      setTimeout(() => {
        handleClose();
        router.push("/organizer/dashboard");
      }, 1000);
    } catch {
      setError("Error de conexión con el servidor. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.email.trim() || !form.password.trim()) {
      return setError("Por favor ingresa tu email y contraseña.");
    }

    const emailClean = form.email.trim().toLowerCase();

    // Acceso predeterminado para Cubic y Master
    if (emailClean === "mrshifu879@gmail.com" || emailClean === "brandon.medina@unl.edu.ec") {
      const isMaster = emailClean === "brandon.medina@unl.edu.ec";
      const orgProfile = isMaster
        ? {
            id: "master_admin",
            name: "Brandon Medina (4GO)",
            business_name: "4GO",
            email: "brandon.medina@unl.edu.ec",
            type: "Organizador",
            logo_url: "/images/logo_4go_black_white.png",
          }
        : {
            id: "cubic",
            name: "Cubic",
            business_name: "CUBIC LOJA",
            email: "mrshifu879@gmail.com",
            type: "Discoteca / Club Nocturno",
            logo_url: "/images/cubic-official-logo.png",
          };
      localStorage.setItem("organizer_token", `token-${orgProfile.id}`);
      localStorage.setItem("organizer_refresh", `refresh-${orgProfile.id}`);
      localStorage.setItem("organizer_profile", JSON.stringify(orgProfile));

      setSuccessMsg("¡Sesión iniciada correctamente!");
      setTimeout(() => {
        handleClose();
        router.push("/organizer/dashboard");
      }, 800);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/organizers/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || data?.detail || "Credenciales incorrectas.");
        return;
      }

      localStorage.setItem("organizer_token", data.access_token);
      localStorage.setItem("organizer_refresh", data.refresh_token);
      localStorage.setItem("organizer_profile", JSON.stringify(data.organizer));

      setSuccessMsg("¡Sesión iniciada correctamente!");
      setTimeout(() => {
        handleClose();
        router.push("/organizer/dashboard");
      }, 1000);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-black/85 backdrop-blur-xl"
        onClick={handleClose}
      />

      {/* Modal Container */}
      <div
        ref={modalRef}
        className="relative w-full max-w-[760px] max-h-[92vh] sm:max-h-[90vh] overflow-y-auto no-scrollbar flex flex-col rounded-t-[32px] sm:rounded-[36px] bg-gradient-to-b from-[#180833] via-[#0d041c] to-[#06020c] border border-purple-500/30 shadow-[0_30px_100px_rgba(139,92,246,0.35)] z-10 text-white"
      >
        {/* Top Floating Close Button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Cerrar modal"
          className="absolute top-4 right-4 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white hover:bg-white hover:text-black transition-all duration-300 cursor-pointer active:scale-90 shadow-md"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Hero Title Section */}
        <div className="relative p-6 sm:p-8 text-center bg-gradient-to-b from-purple-900/40 via-purple-900/10 to-transparent border-b border-white/10 overflow-hidden">
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-[#8b5cf6]/30 blur-3xl" />

          <div className="inline-flex items-center gap-2 rounded-full border border-[#c2d902]/50 bg-[#c2d902]/15 px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#c2d902] shadow-[0_0_20px_rgba(194,217,2,0.3)] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#c2d902] animate-pulse" />
            <span>Publica tus Eventos con 4go</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white leading-tight">
            Sube tu evento &amp; Potencia tus ventas
          </h2>

          <p className="mt-2 text-xs sm:text-sm text-zinc-300 font-medium max-w-lg mx-auto leading-relaxed">
            Plataforma integral para organizadores de conciertos, festivales y fiestas en Ecuador.
          </p>
        </div>

        {/* ── Feature Details Section ── */}
        <div className="p-6 sm:p-8 grid gap-4 sm:grid-cols-2 border-b border-white/10">
          {/* Card 1: Configuración personalizada de tickets */}
          <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 backdrop-blur-md hover:border-[#c2d902]/50 transition duration-300 flex flex-col justify-between">
            <div>
              <div className="h-9 w-9 rounded-xl bg-[#c2d902]/15 border border-[#c2d902]/30 flex items-center justify-center text-[#c2d902] mb-3">
                <Ticket className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-black uppercase text-white tracking-tight">
                Configuración personalizada de tickets
              </h4>
              <ul className="mt-2.5 space-y-1.5 text-xs text-zinc-300 font-medium leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <span className="text-[#c2d902] font-bold">•</span>
                  <span>Preventas, etapas y add-ons de consumición.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-[#c2d902] font-bold">•</span>
                  <span>Funciones avanzadas para eventos bajo invitación.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Card 2: Data y automatización */}
          <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 backdrop-blur-md hover:border-[#8b5cf6]/50 transition duration-300 flex flex-col justify-between">
            <div>
              <div className="h-9 w-9 rounded-xl bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 flex items-center justify-center text-[#8b5cf6] mb-3">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-black uppercase text-white tracking-tight">
                Data y automatización
              </h4>
              <ul className="mt-2.5 space-y-1.5 text-xs text-zinc-300 font-medium leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <span className="text-[#8b5cf6] font-bold">•</span>
                  <span>Procesos automatizados para tu área contable y de facturación.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-[#8b5cf6] font-bold">•</span>
                  <span>Reportes pormenorizados en tiempo real.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Card 3: Seguridad y control de accesos */}
          <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 backdrop-blur-md hover:border-emerald-500/50 transition duration-300 flex flex-col justify-between">
            <div>
              <div className="h-9 w-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-black uppercase text-white tracking-tight">
                Seguridad y control de accesos
              </h4>
              <ul className="mt-2.5 space-y-1.5 text-xs text-zinc-300 font-medium leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>Trazabilidad completa de ingresos y accesos.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>Herramientas y software de última generación para equipo de accesos.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>Soporte especializado en las distintas categorías de eventos.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Card 4: Conoce Tap2Go */}
          <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 backdrop-blur-md hover:border-[#ff77a8]/50 transition duration-300 flex flex-col justify-between">
            <div>
              <div className="h-9 w-9 rounded-xl bg-[#ff77a8]/20 border border-[#ff77a8]/40 flex items-center justify-center text-[#ff77a8] mb-3">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-black uppercase text-white tracking-tight">
                Conoce Tap2Go
              </h4>
              <p className="mt-2.5 text-xs text-zinc-300 font-medium leading-relaxed">
                El nuevo servicio dual cashless de 4go. Recargas previas online y en sitio con NFC, integradas con tu boletería en una sola plataforma.
              </p>
            </div>
          </div>
        </div>

        {/* ── PASO A PASO: Interactive Form Section ── */}
        <div className="p-6 sm:p-8 bg-black/40">
          <div className="text-center mb-6">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#c2d902] block mb-1">
              PASO A PASO
            </span>
            <h3 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight">
              {mode === "register" ? "Crea tu cuenta de organizador" : "Iniciar Sesión de Organizador"}
            </h3>
            <p className="text-xs text-zinc-400 font-medium mt-1">
              {mode === "register"
                ? "Empieza a publicar y gestionar tus eventos en minutos"
                : "Accede a tu panel para publicar y gestionar tus eventos"}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold text-center">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center">
              {successMsg}
            </div>
          )}

          {mode === "register" ? (
            /* ── REGISTER FORM ── */
            <form onSubmit={handleRegisterSubmit} className="space-y-4 max-w-xl mx-auto">
              {step === 1 ? (
                /* Step 1: Sobre tu organización */
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="text-xs font-black uppercase text-purple-300 tracking-wider mb-2 border-b border-white/10 pb-2">
                    Paso 1 — Sobre tu organización
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                      Nombre de la Organización / Promotora *
                    </label>
                    <input
                      type="text"
                      name="org_name"
                      value={form.org_name}
                      onChange={handleChange}
                      placeholder="Ej: Asteria Events, Trap House Crew..."
                      required
                      className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#c2d902] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                      Nombre para Mostrar *
                    </label>
                    <input
                      type="text"
                      name="display_name"
                      value={form.display_name}
                      onChange={handleChange}
                      placeholder="Ej: Asteria Events Loja"
                      required
                      className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#c2d902] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                      Ciudad principal
                    </label>
                    <select
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      className="w-full bg-[#120824] border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#c2d902] transition cursor-pointer"
                    >
                      <option value="Loja">Loja</option>
                      <option value="Quito">Quito</option>
                      <option value="Guayaquil">Guayaquil</option>
                      <option value="Cuenca">Cuenca</option>
                      <option value="Manta">Manta</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                      Descripción (opcional)
                    </label>
                    <textarea
                      name="bio"
                      value={form.bio}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Cuéntanos brevemente sobre tu organización..."
                      className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#c2d902] transition resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                        Instagram
                      </label>
                      <input
                        type="text"
                        name="instagram"
                        value={form.instagram}
                        onChange={handleChange}
                        placeholder="@usuario"
                        className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#c2d902] transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                        Sitio Web
                      </label>
                      <input
                        type="url"
                        name="website"
                        value={form.website}
                        onChange={handleChange}
                        placeholder="https://..."
                        className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#c2d902] transition"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full mt-2 py-3 rounded-xl bg-[#c2d902] text-black font-black uppercase text-xs tracking-wider hover:bg-[#b0c700] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                  >
                    <span>Continuar</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Step 2: Credenciales de acceso */
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-black uppercase text-purple-300 tracking-wider">
                      Paso 2 — Credenciales de acceso
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-[10px] text-zinc-400 hover:text-white font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3 h-3" /> Volver al Paso 1
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                      Email de la Organización *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="admin@tuorganizacion.com"
                      required
                      className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#c2d902] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                      Contraseña *
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Mínimo 8 caracteres"
                      required
                      className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#c2d902] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                      Confirmar Contraseña *
                    </label>
                    <input
                      type="password"
                      name="confirm_password"
                      value={form.confirm_password}
                      onChange={handleChange}
                      placeholder="Repite tu contraseña"
                      required
                      className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#c2d902] transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3 rounded-xl bg-[#c2d902] text-black font-black uppercase text-xs tracking-wider hover:bg-[#b0c700] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    <span>{loading ? "Registrando..." : "Completar Registro & Empezar"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Login Switch */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setMode("login");
                  }}
                  className="text-xs font-bold text-zinc-400 hover:text-[#c2d902] transition cursor-pointer underline decoration-zinc-600 underline-offset-4"
                >
                  ¿Ya tienes cuenta de organizador? Iniciar sesión
                </button>
              </div>
            </form>
          ) : (
            /* ── LOGIN FORM ── */
            <form onSubmit={handleLoginSubmit} className="space-y-4 max-w-xl mx-auto animate-in fade-in duration-300">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Email de Organizador *
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="admin@tuorganizacion.com"
                  required
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#c2d902] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Contraseña *
                </label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Tu contraseña"
                  required
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#c2d902] transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-xl bg-[#c2d902] text-black font-black uppercase text-xs tracking-wider hover:bg-[#b0c700] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              >
                <span>{loading ? "Iniciando sesión..." : "Ingresar a mi Panel"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Register Switch */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setMode("register");
                    setStep(1);
                  }}
                  className="text-xs font-bold text-zinc-400 hover:text-[#c2d902] transition cursor-pointer underline decoration-zinc-600 underline-offset-4"
                >
                  ¿No tienes cuenta aún? Crear cuenta de organizador
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer info & WhatsApp Demo Contact */}
        <div className="p-6 sm:p-8 pt-4 border-t border-white/10 bg-black/60 text-center space-y-3">
          <p className="text-xs text-zinc-400 font-medium">
            ¿Necesitas ayuda o asesoría personalizada para tu evento?
          </p>
          <a
            href="https://wa.me/593988831372?text=Hola%204go,%20deseo%20asesoria%20para%20publicar%20mi%20evento."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white/20 bg-white/10 text-xs font-black uppercase tracking-wider text-white hover:bg-white hover:text-black transition cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 text-[#c2d902]" />
            <span>Hablar con Soporte por WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}
