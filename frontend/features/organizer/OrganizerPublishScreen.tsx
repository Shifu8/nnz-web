"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Ticket,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  MessageCircle,
  Zap,
  Building2,
  Mail,
  Lock,
  User,
  MapPin,
  Globe,
  CheckCircle2,
  Calculator,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Smartphone,
  QrCode,
  CreditCard,
} from "lucide-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

// FAQ Data Structure
const FAQ_ITEMS = [
  {
    q: "¿Realmente no cobran comisión durante la promoción?",
    a: "¡Así es! Durante este mes de lanzamiento, el 100% de lo recaudado por la venta de tus entradas pasa directamente a tu cuenta sin retención ni cobros por gestión de plataforma.",
  },
  {
    q: "¿Cómo y cuándo recibo la recaudación de mis entradas?",
    a: "Las liquidaciones se procesan directamente a tu cuenta bancaria registrada con reportes detallados en tiempo real desde tu panel de organizador.",
  },
  {
    q: "¿Cómo funciona el control de accesos el día del evento?",
    a: "Te proporcionamos nuestra app de escaneo de alta velocidad compatible con cualquier smartphone Android/iOS, o enviamos equipo técnico de soporte en sitio según la magnitud de tu evento.",
  },
  {
    q: "¿Qué es el sistema Tap2Go Cashless?",
    a: "Es nuestra tecnología dual NFC que permite a tus asistentes cargar saldo online antes del evento o en puntos físicos dentro del recinto, pagando en barras y merchandising en segundos sin depender de internet ni hacer filas.",
  },
  {
    q: "¿Tiene algún costo crear mi cuenta de organizador?",
    a: "No. Crear tu perfil de organizador y explorar la plataforma es 100% gratuito sin compromisos.",
  },
];

export default function OrganizerPublishScreen() {
  const router = useRouter();

  // Mode & Step state
  const [mode, setMode] = useState<"register" | "login">("register");
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Calculator State
  const [calcTickets, setCalcTickets] = useState<number>(500);
  const [calcPrice, setCalcPrice] = useState<number>(25);

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Form State
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

  const scrollToForm = () => {
    const el = document.getElementById("register-form-section");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
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

      setSuccessMsg("¡Registro exitoso! Redirigiendo a tu panel de organizador...");
      setTimeout(() => {
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

      setSuccessMsg("¡Sesión iniciada correctamente! Redirigiendo a tu panel...");
      setTimeout(() => {
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

      setSuccessMsg("¡Sesión iniciada correctamente! Redirigiendo a tu panel...");
      setTimeout(() => {
        router.push("/organizer/dashboard");
      }, 1000);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Calculator figures
  const totalRevenue = calcTickets * calcPrice;
  const traditionalFees = Math.round(totalRevenue * 0.12);
  const savingsAmount = traditionalFees;

  return (
    <div className="relative w-full text-white font-sans overflow-hidden select-none bg-[#050507]">
      
      {/* ══════════════════════════════════════════════════════
          1. STUNNING 3D HERO SHOWCASE WITH FULL 4GO DJ ARTWORK
          (Combines full image visibility + 3D floating phone cards layout)
          ══════════════════════════════════════════════════════ */}
      <section className="relative min-h-[92vh] w-full flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#0a0a10] via-[#08080d] to-[#050507] px-6 sm:px-12 md:px-16 py-12">
        
        {/* Full-Screen 4GO DJ Artwork Backdrop (Unblurred & Crisp on Mobile and Desktop) */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Image
            src="/4go_dj_hero_v3.jpg"
            alt="4GO DJ Character Backdrop"
            fill
            priority
            quality={100}
            unoptimized
            sizes="100vw"
            className="object-cover object-top sm:object-center w-full h-full opacity-85 transition-opacity duration-500 image-render-crisp"
          />
          {/* Soft Mobile & Desktop Gradient Overlays for Text Contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black/90 sm:bg-gradient-to-r sm:from-black/90 sm:via-black/55 sm:to-transparent" />
        </div>

        {/* Ambient Purple & Neon Glow Waves */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
          <div className="absolute -top-32 left-1/4 w-[600px] h-[600px] rounded-full bg-[#7c3aed]/25 blur-[140px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-[#c2d902]/20 blur-[130px]" />
        </div>

        {/* Main Grid Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto grid lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column (Span 6): Headline & SUBE TU EVENTO Button (Centered on Mobile) */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            {/* High-Impact Clean Urban Title (Mentions 4go, No underline) */}
            <h1 className="text-4xl sm:text-6xl xl:text-7xl font-black uppercase text-white leading-[1.02] tracking-tight drop-shadow-2xl">
              TUS EVENTOS <br />
              EN OTRO NIVEL <br />
              <span className="text-[#c2d902]">CON 4go</span>
            </h1>

            <p className="text-xs sm:text-sm text-zinc-300 font-medium leading-relaxed max-w-lg mx-auto lg:mx-0 drop-shadow-md">
              Boletería digital oficial, accesos QR anti-fraude y gestión de recaudación directa para tus festivales y conciertos.
            </p>

            {/* Clean Feature Badges Strip (No icons, ALL CAPS bold) */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 pt-1">
              <div className="px-4 py-2 rounded-xl bg-black/80 border border-white/20 text-[10px] font-black tracking-wider text-white uppercase backdrop-blur-md">
                0% COMISIÓN PROMO
              </div>
              <div className="px-4 py-2 rounded-xl bg-black/80 border border-white/20 text-[10px] font-black tracking-wider text-white uppercase backdrop-blur-md">
                ACCESOS QR RÁPIDOS
              </div>
              <div className="px-4 py-2 rounded-xl bg-black/80 border border-white/20 text-[10px] font-black tracking-wider text-white uppercase backdrop-blur-md">
                RECAUDACIÓN DIRECTA
              </div>
            </div>

            {/* Premium Urban CTA Button: "SUBE TU EVENTO" (Centered on Mobile) */}
            <div className="pt-3 flex justify-center lg:justify-start">
              <button
                type="button"
                onClick={scrollToForm}
                className="group relative inline-flex items-center justify-between gap-6 px-8 py-4 rounded-2xl border-2 border-[#c2d902] bg-black text-[#c2d902] hover:bg-[#c2d902] hover:text-black font-black text-xs sm:text-sm uppercase tracking-widest transition-all duration-300 shadow-[0_0_30px_rgba(194,217,2,0.35)] cursor-pointer active:scale-95"
              >
                <span>SUBE TU EVENTO</span>
                <div className="w-7 h-7 rounded-xl bg-[#c2d902] text-black group-hover:bg-black group-hover:text-[#c2d902] flex items-center justify-center transition-colors">
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </div>
              </button>
            </div>
          </div>

          {/* Right Column (Span 6): TWO 3D Smartphones Showcase Stack (Photo 2 inspired) */}
          <div className="lg:col-span-6 relative flex items-center justify-center pt-8 lg:pt-0 min-h-[440px] sm:min-h-[500px]">
            
            {/* Background Glow Ring */}
            <div className="absolute w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-[#c2d902]/20 blur-3xl -z-10" />

            {/* TWO 3D SMARTPHONES STACK CONTAINER WITH SMOOTH FLOATING MOTION */}
            <div className="relative w-full max-w-[360px] sm:max-w-[420px] flex items-center justify-center">
              
              {/* PHONE 2 (BACK / RIGHT ANGLED PHONE — Floats up and down smoothly) */}
              <motion.div
                animate={{ y: [0, 10, 0], rotate: [8, 10, 8] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                className="absolute top-2 right-2 sm:right-4 w-[240px] sm:w-[280px] aspect-[9/16] rounded-[36px] border-4 border-purple-500/60 bg-black p-2.5 shadow-2xl scale-95 opacity-90 overflow-hidden z-10 hover:rotate-[4deg] transition-all duration-500 cursor-pointer"
              >
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-3 rounded-full bg-black z-30 border border-white/10" />
                <div className="relative w-full h-full rounded-[26px] overflow-hidden bg-black">
                  <Image
                    src="/4go_dj_hero_v3.jpg"
                    alt="4GO Event Pass Showcase"
                    fill
                    priority
                    sizes="(max-width: 768px) 240px, 280px"
                    className="object-cover object-top"
                  />
                  <div className="absolute bottom-3 left-3 right-3 z-20 p-2 rounded-xl bg-black/80 backdrop-blur-md border border-white/20">
                    <span className="text-[8px] font-black uppercase text-purple-300 block">4GO TICKET PASS</span>
                    <span className="text-[10px] font-black uppercase text-white">ACCESO EXCLUSIVO</span>
                  </div>
                </div>
              </motion.div>

              {/* PHONE 1 (FRONT / LEFT ANGLED PHONE — Floats in counter-rhythm) */}
              <motion.div
                animate={{ y: [0, -12, 0], rotate: [-5, -3, -5] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 0.2 }}
                className="relative z-20 w-[250px] sm:w-[290px] aspect-[9/16] rounded-[40px] border-4 border-[#c2d902] bg-black p-3 shadow-[0_25px_80px_rgba(194,217,2,0.4)] overflow-hidden group cursor-pointer"
              >
                {/* Phone Speaker Notch */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-3.5 rounded-full bg-black z-30 border border-white/10" />

                {/* Surreal Flowers 4GO Artwork Image inside Front Phone Screen */}
                <div className="relative w-full h-full rounded-[30px] overflow-hidden bg-black">
                  <Image
                    src="/images/4go_red_girl_showcase.jpg"
                    alt="4GO Surreal Flowers 3D Artwork"
                    fill
                    priority
                    quality={100}
                    unoptimized
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  />
                  
                  {/* Phone UI Overlay Pill */}
                  <div className="absolute bottom-3 left-3 right-3 z-20 p-2.5 rounded-2xl bg-black/85 backdrop-blur-md border border-white/20 flex items-center justify-between shadow-lg">
                    <div>
                      <span className="text-[8px] font-black uppercase text-[#c2d902] block">4GO ARTWORK</span>
                      <span className="text-[10px] font-black uppercase text-white">4GO SURREAL 2026</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#c2d902] text-black text-[8px] font-black uppercase">
                      PROMO $0
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Floating Benefit Card 1 (Top Left — Floating motion) */}
              <motion.div
                animate={{ y: [0, -8, 0], x: [0, 3, 0] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
                className="absolute -top-4 -left-2 sm:-left-6 z-30 p-3 rounded-xl bg-zinc-950/90 border border-[#c2d902]/50 backdrop-blur-xl shadow-2xl max-w-[170px] hidden sm:block"
              >
                <span className="text-[9px] font-black uppercase text-[#c2d902] block">0% COMISIÓN</span>
                <span className="text-[8px] text-zinc-400 font-bold">100% Recaudación Libre</span>
              </motion.div>

              {/* Floating Benefit Card 2 (Bottom Right — Floating motion) */}
              <motion.div
                animate={{ y: [0, 8, 0], x: [0, -3, 0] }}
                transition={{ repeat: Infinity, duration: 5.2, ease: "easeInOut", delay: 0.3 }}
                className="absolute -bottom-4 right-0 z-30 p-3 rounded-xl bg-zinc-950/90 border border-purple-500/50 backdrop-blur-xl shadow-2xl max-w-[170px] hidden sm:block"
              >
                <span className="text-[9px] font-black uppercase text-purple-300 block">ENTRADAS QR</span>
                <span className="text-[8px] text-zinc-400 font-bold">Escaneo en Puerta</span>
              </motion.div>

            </div>

          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          2. SIMPLE & LEGIBLE VENTAS Y RECAUDACIÓN (Calculadora)
          ══════════════════════════════════════════════════════ */}
      <section id="savings-calculator" className="py-16 px-6 sm:px-12 md:px-20 max-w-6xl mx-auto space-y-10 border-t border-white/10">
        <div className="space-y-2 text-left border-l-4 border-[#c2d902] pl-4">
          <span className="text-xs font-black uppercase tracking-[0.25em] text-[#c2d902] block">
            0% COMISIÓN DE LANZAMIENTO
          </span>
          <h2 className="text-3xl sm:text-5xl font-black uppercase text-white tracking-tight">
            Ventas &amp; Recaudación Directa
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 font-medium max-w-xl">
            Calcula el valor exacto de tus ingresos libres de comisiones de plataforma.
          </p>
        </div>

        {/* Clean Calculator Grid */}
        <div className="grid md:grid-cols-2 gap-8 items-center pt-2">
          {/* Sliders Box */}
          <div className="space-y-6 p-6 sm:p-8 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider">
                <span className="text-zinc-300">Boletos Proyectados</span>
                <span className="text-[#c2d902] font-mono text-base">{calcTickets.toLocaleString()} tickets</span>
              </div>
              <input
                type="range"
                min={50}
                max={5000}
                step={50}
                value={calcTickets}
                onChange={(e) => setCalcTickets(Number(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#c2d902]"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider">
                <span className="text-zinc-300">Precio por Boleto</span>
                <span className="text-white font-mono text-base">${calcPrice} USD</span>
              </div>
              <input
                type="range"
                min={5}
                max={150}
                step={5}
                value={calcPrice}
                onChange={(e) => setCalcPrice(Number(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-between items-center">
              <span className="text-xs font-bold text-zinc-400">Total Recaudación Bruta:</span>
              <span className="text-lg font-black text-white font-mono">${totalRevenue.toLocaleString()} USD</span>
            </div>
          </div>

          {/* Revenue Savings Output */}
          <div className="space-y-4 p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-[#c2d902]/15 to-transparent border border-[#c2d902]/40 text-left">
            <span className="text-xs font-black uppercase tracking-widest text-[#c2d902] block">
              TU AHORRO NETO CON 4GO
            </span>
            <div className="text-4xl sm:text-5xl font-black text-[#c2d902] font-mono">
              +${savingsAmount.toLocaleString()} USD
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed font-medium">
              El 100% de la venta ingresa íntegro a tu cuenta sin retención ni tarifas ocultas por boleto vendido.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={scrollToForm}
                className="px-6 py-3 bg-[#c2d902] text-black text-xs font-black uppercase tracking-wider hover:bg-[#b0c700] transition cursor-pointer font-bold rounded-full"
              >
                SUBE TU EVENTO
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          3. CLEAN 3-STEP PROCESS
          ══════════════════════════════════════════════════════ */}
      <section className="py-12 px-6 sm:px-12 md:px-20 max-w-6xl mx-auto space-y-8 border-t border-white/10">
        <div className="text-left space-y-1">
          <span className="text-xs font-black uppercase tracking-widest text-[#c2d902]">PASO A PASO</span>
          <h3 className="text-2xl sm:text-3xl font-black uppercase text-white">¿Cómo publicar mi evento?</h3>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
            <span className="text-3xl font-black text-[#c2d902] font-mono">01</span>
            <h4 className="text-sm font-black uppercase text-white">Crea tu Promotora</h4>
            <p className="text-xs text-zinc-400 font-medium leading-relaxed">
              Ingresa el nombre de tu marca y datos de contacto en 30 segundos.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
            <span className="text-3xl font-black text-[#c2d902] font-mono">02</span>
            <h4 className="text-sm font-black uppercase text-white">Sube tu Afiche &amp; Precios</h4>
            <p className="text-xs text-zinc-400 font-medium leading-relaxed">
              Define etapas de preventa, lotes limitados y localidades a tu medida.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
            <span className="text-3xl font-black text-[#c2d902] font-mono">03</span>
            <h4 className="text-sm font-black uppercase text-white">Vende con QR Oficial</h4>
            <p className="text-xs text-zinc-400 font-medium leading-relaxed">
              Tus asistentes compran al instante y escaneas en puerta con nuestra app de alta velocidad.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          4. FORMULARIO SENCILLO & LEGIBLE (Paso a Paso)
          ══════════════════════════════════════════════════════ */}
      <section id="register-form-section" className="py-16 px-6 sm:px-12 md:px-20 max-w-4xl mx-auto space-y-8 border-t border-white/10">
        <div className="text-left space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-[#c2d902]">REGISTRO E INICIO DE SESIÓN</span>
          <h2 className="text-3xl sm:text-4xl font-black uppercase text-white">
            {mode === "register" ? "Crea tu Cuenta de Organizador" : "Iniciar Sesión"}
          </h2>
        </div>

        {/* Mode Switcher Pills */}
        <div className="flex justify-start">
          <div className="inline-flex rounded-full bg-white/10 p-1 border border-white/15">
            <button
              type="button"
              onClick={() => {
                setError("");
                setMode("register");
                setStep(1);
              }}
              className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                mode === "register" ? "bg-[#c2d902] text-black shadow-md" : "text-white/70 hover:text-white"
              }`}
            >
              Crear Cuenta
            </button>
            <button
              type="button"
              onClick={() => {
                setError("");
                setMode("login");
              }}
              className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                mode === "login" ? "bg-white text-black shadow-md" : "text-white/70 hover:text-white"
              }`}
            >
              Iniciar Sesión
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
            {successMsg}
          </div>
        )}

        {mode === "register" ? (
          <form onSubmit={handleRegisterSubmit} className="space-y-5">
            {step === 1 ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase mb-2">
                    Nombre de tu Organización / Promotora *
                  </label>
                  <input
                    type="text"
                    name="org_name"
                    value={form.org_name}
                    onChange={handleChange}
                    placeholder="Ej: Asteria Events"
                    required
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#c2d902] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase mb-2">
                    Nombre para Mostrar *
                  </label>
                  <input
                    type="text"
                    name="display_name"
                    value={form.display_name}
                    onChange={handleChange}
                    placeholder="Ej: Asteria Events Loja"
                    required
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#c2d902] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase mb-2">
                    Ciudad Principal
                  </label>
                  <select
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    className="w-full bg-[#121212] border border-white/15 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-[#c2d902] transition cursor-pointer"
                  >
                    <option value="Loja">Loja</option>
                    <option value="Quito">Quito</option>
                    <option value="Guayaquil">Guayaquil</option>
                    <option value="Cuenca">Cuenca</option>
                    <option value="Manta">Manta</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full py-4 rounded-xl bg-[#c2d902] text-black font-black uppercase text-xs tracking-wider hover:bg-[#b0c700] transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <span>Continuar al Paso 2</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase mb-2">
                    Email de la Organización *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="admin@tuorganizacion.com"
                    required
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#c2d902] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase mb-2">
                    Contraseña *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Mínimo 8 caracteres"
                    required
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#c2d902] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase mb-2">
                    Confirmar Contraseña *
                  </label>
                  <input
                    type="password"
                    name="confirm_password"
                    value={form.confirm_password}
                    onChange={handleChange}
                    placeholder="Repite tu contraseña"
                    required
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#c2d902] transition"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/3 py-4 rounded-xl border border-white/20 bg-white/5 text-white font-bold text-xs uppercase cursor-pointer"
                  >
                    Atrás
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-2/3 py-4 rounded-xl bg-[#c2d902] text-black font-black uppercase text-xs tracking-wider hover:bg-[#b0c700] transition cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {loading ? "Registrando..." : "Completar Registro"}
                  </button>
                </div>
              </div>
            )}
          </form>
        ) : (
          <form onSubmit={handleLoginSubmit} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="admin@tuorganizacion.com"
                required
                className="w-full bg-[#121212] border border-white/15 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-[#c2d902] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase mb-2">
                Contraseña *
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Tu contraseña"
                required
                className="w-full bg-[#121212] border border-white/15 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-[#c2d902] transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-white text-black font-black uppercase text-xs tracking-wider hover:bg-zinc-200 transition cursor-pointer shadow-md disabled:opacity-50"
            >
              {loading ? "Iniciando sesión..." : "Ingresar a mi Panel"}
            </button>
          </form>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════
          5. FAQ & WHATSAPP FOOTER
          ══════════════════════════════════════════════════════ */}
      <section className="py-12 px-6 sm:px-12 md:px-20 max-w-4xl mx-auto space-y-6 border-t border-white/10">
        <div className="text-left space-y-1">
          <span className="text-xs font-black uppercase tracking-widest text-[#c2d902]">PREGUNTAS FRECUENTES</span>
          <h3 className="text-2xl font-black uppercase text-white">Dudas Comunes</h3>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, idx) => (
            <div key={idx} className="border-b border-white/10 pb-3">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full text-left py-2 flex items-center justify-between text-xs font-bold text-white cursor-pointer"
              >
                <span>{item.q}</span>
                {openFaq === idx ? <ChevronUp className="w-4 h-4 text-[#c2d902]" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
              </button>
              {openFaq === idx && (
                <p className="text-xs text-zinc-400 pt-1 leading-relaxed font-medium">
                  {item.a}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="pt-6 text-left">
          <a
            href="https://wa.me/593988831372?text=Hola%204go,%20requiero%20asesoria%20personalizada%20para%20un%20evento."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#c2d902] hover:underline"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Hablar con Soporte por WhatsApp &rarr;</span>
          </a>
        </div>
      </section>
    </div>
  );
}
