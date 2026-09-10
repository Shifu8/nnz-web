"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

export default function OrganizerLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const emailClean = form.email.trim().toLowerCase();

    // Acceso directo preconfigurado para Cubic y Master
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
      router.push("/organizer/dashboard");
      setLoading(false);
      return;
    }

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

      if (!data) {
        setError("Respuesta del servidor no válida. Intenta de nuevo.");
        return;
      }

      localStorage.setItem("organizer_token", data.access_token);
      localStorage.setItem("organizer_refresh", data.refresh_token);
      localStorage.setItem("organizer_profile", JSON.stringify(data.organizer));
      router.push("/organizer/dashboard");
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    setSocialLoading(provider);
    setError("");
    setTimeout(() => {
      setSocialLoading(null);
      // Asignar perfil predeterminado según el proveedor/cuenta
      const isCubic = provider === "Google";
      const isMaster = provider === "Apple";
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
      router.push("/organizer/dashboard");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4 font-sans relative overflow-hidden">
      {/* Background Subtle Gradient Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-purple-600/10 via-pink-500/5 to-transparent blur-[120px] pointer-events-none rounded-full" />

      {/* Back Button */}
      <button
        onClick={() => router.push("/")}
        className="fixed top-6 left-6 text-zinc-400 hover:text-white transition text-xs font-black uppercase tracking-widest flex items-center gap-2 z-20 bg-zinc-900/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-lg cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Volver a 4GO
      </button>

      <div className="w-full max-w-sm relative z-10 my-12">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="text-2xl font-black tracking-widest text-white mb-2">
            NOW<span className="text-yellow-400">4GO</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Inicia sesión</h1>
          <p className="text-zinc-400 text-xs mt-1 font-semibold">Accede a tu panel de eventos &amp; reservaciones</p>
        </div>

        {/* ─── QUICK SOCIAL LOGIN BUTTONS (GOOGLE & APPLE) ─── */}
        <div className="space-y-3 mb-6">
          {/* Google Login Button */}
          <button
            type="button"
            onClick={() => handleSocialLogin("Google")}
            disabled={!!socialLoading}
            className="w-full h-12 rounded-full bg-white hover:bg-zinc-200 text-black text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-3 transition-all active:scale-95 cursor-pointer shadow-xl disabled:opacity-50"
          >
            {socialLoading === "Google" ? (
              <span className="text-xs font-bold text-zinc-700 animate-pulse">Conectando con Google...</span>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continuar con Google</span>
              </>
            )}
          </button>

          {/* Apple Login Button */}
          <button
            type="button"
            onClick={() => handleSocialLogin("Apple")}
            disabled={!!socialLoading}
            className="w-full h-12 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs sm:text-sm font-black uppercase tracking-wider border border-white/20 flex items-center justify-center gap-3 transition-all active:scale-95 cursor-pointer shadow-xl disabled:opacity-50"
          >
            {socialLoading === "Apple" ? (
              <span className="text-xs font-bold text-zinc-300 animate-pulse">Conectando con Apple...</span>
            ) : (
              <>
                <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.67-.82 1.12-1.96.99-3.1-.97.04-2.16.65-2.85 1.46-.62.72-1.16 1.88-.99 3.03 1.09.08 2.2-.57 2.85-1.39z" />
                </svg>
                <span>Continuar con Apple</span>
              </>
            )}
          </button>
        </div>

        {/* Divider line */}
        <div className="relative flex items-center justify-center my-6">
          <div className="border-t border-white/10 w-full" />
          <span className="bg-[#050505] px-3 text-[11px] font-extrabold uppercase tracking-widest text-zinc-500 shrink-0">
            o ingresa con tu email
          </span>
          <div className="border-t border-white/10 w-full" />
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1.5">
              Correo Electrónico
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              autoComplete="email"
              className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-white/40 transition"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-white/40 transition"
              required
            />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-full bg-white text-black text-xs sm:text-sm font-black uppercase tracking-widest hover:bg-zinc-200 transition active:scale-95 cursor-pointer shadow-xl disabled:opacity-50 mt-2"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>

          <p className="text-center text-xs text-zinc-500 pt-3">
            ¿No tienes cuenta?{" "}
            <button
              type="button"
              onClick={() => router.push("/organizer/register")}
              className="text-zinc-300 hover:text-white transition font-bold underline cursor-pointer"
            >
              Crear cuenta gratis
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
