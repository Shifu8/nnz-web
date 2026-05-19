/**
 * Autor: Brandon Medina
 * Fecha: 16/05/2026
 * Descripción: Sistema oficial DAWGS ACCESS DROP. Sistema de canje limitado con urgencia visual.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronRight, ShieldAlert, Zap } from "lucide-react";
import { gsap, useGSAP } from "@/frontend/animations/gsapSetup";
import PartyPass from "./PartyPass";
import { isBadWord } from "@/lib/badWords";

type DropState = "countdown" | "register" | "recover" | "waiting" | "winner" | "loser";

export default function AccessDrop() {
  const scope = useRef<HTMLElement>(null);
  const [dropState, setDropState] = useState<DropState>("countdown");
  const [formData, setFormData] = useState({ firstName: "", lastName: "", phone: "", instagram: "" });
  const [recoveryPhone, setRecoveryPhone] = useState("");
  const [remainingPasses, setRemainingPasses] = useState(100);
  const [participantsCount, setParticipantsCount] = useState(2841);
  const [passData, setPassData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Countdown timer logic
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 14, s: 59 });

  useEffect(() => {
    // Simular reducción de pases para urgencia
    const timer = setInterval(() => {
      setRemainingPasses(prev => {
        if (prev <= 3) return prev;
        const dec = Math.random() > 0.7 ? 1 : 0;
        return prev - dec;
      });
      setParticipantsCount(prev => prev + Math.floor(Math.random() * 2));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useGSAP(() => {
    if (dropState === "winner") {
      gsap.from(".pass-reveal", { scale: 0.8, opacity: 0, y: 50, duration: 1, ease: "elastic.out(1, 0.7)" });
    }
    
    // Pulsing urgency glow
    gsap.to(".urgency-glow", {
      opacity: 0.8,
      scale: 1.1,
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });
  }, [dropState]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Validación frontal de teléfono
    const phoneDigits = formData.phone.replace(/[^\d]/g, '');
    if (!/^09\d{8}$/.test(phoneDigits)) {
      setErrorMsg("NÚMERO INVÁLIDO. (09XXXXXXXX)");
      return;
    }

    if (isBadWord(formData.firstName) || isBadWord(formData.lastName)) {
      setErrorMsg("LENGUAJE INAPROPIADO DETECTADO.");
      return;
    }

    if (localStorage.getItem("dawgs_claimed")) {
      setErrorMsg("ESTE DISPOSITIVO YA RECLAMÓ UN ACCESO.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const res = await fetch("/api/access-drop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Error al procesar solicitud");
      }
      
      setPassData(data);
      localStorage.setItem("dawgs_claimed", "true");
      if (data.token || data.serialNumber) {
        localStorage.setItem("dawgs_recovery_token", data.token || data.serialNumber);
      }
      setDropState("waiting");
      
      setTimeout(() => setDropState("winner"), 2500);

    } catch (err: any) {
      setErrorMsg(err.message.toUpperCase());
      if (err.message.includes("AGOTADO")) setDropState("loser");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    
    const phoneDigits = recoveryPhone.replace(/[^\d]/g, '');
    if (!/^09\d{8}$/.test(phoneDigits)) {
      setErrorMsg("NÚMERO INVÁLIDO.");
      return;
    }

    const recoveryToken = localStorage.getItem("dawgs_recovery_token");
    if (!recoveryToken) {
      setErrorMsg("ESTE DISPOSITIVO NO CONTIENE UN TOKEN DE RECUPERACIÓN VÁLIDO.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/access-drop/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneDigits, token: recoveryToken })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "No se encontró acceso.");

      setPassData(data);
      setDropState("waiting");
      setTimeout(() => setDropState("winner"), 2000);
    } catch (err: any) {
      setErrorMsg(err.message.toUpperCase());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="access" ref={scope} className="relative z-10 mx-auto max-w-6xl px-4 py-16 md:py-24">
      <div className="relative overflow-hidden rounded-[40px] border border-red-500/30 bg-zinc-950/80 p-6 shadow-[0_0_80px_rgba(255,0,24,.15)] backdrop-blur-3xl md:p-12 min-h-[600px] flex flex-col justify-center">
        
        {/* Background Urgency Glow */}
        <div className="urgency-glow absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,0,24,.08),transparent_60%)] opacity-40" />
        
        {dropState === "countdown" && (
          <div className="relative z-10 flex flex-col items-center text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-950/40 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-red-200 shadow-[0_0_20px_rgba(255,0,24,0.3)]">
              <Zap className="h-4 w-4 text-red-500" /> access drop live
            </span>
            <h2 className="mt-8 text-6xl font-black text-white md:text-8xl drop-shadow-[0_0_40px_rgba(255,0,24,0.5)]">ACCESS DROP</h2>
            
            <div className="mt-4 flex flex-col items-center gap-2">
              <div className="flex items-center gap-3">
                <span className="text-4xl font-black text-red-500 drop-shadow-[0_0_15px_red]">{remainingPasses}</span>
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-300">pases disponibles</span>
              </div>
              <div className="h-1 w-64 rounded-full bg-zinc-900">
                <div 
                  className="h-full rounded-full bg-red-600 shadow-[0_0_10px_red] transition-all duration-1000" 
                  style={{ width: `${remainingPasses}%` }} 
                />
              </div>
            </div>

            <div className="mt-10 flex flex-col items-center gap-4 w-full max-w-md">
              <button onClick={() => setDropState("register")} className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-red-600 text-sm font-black uppercase tracking-[0.2em] text-white shadow-[0_0_50px_rgba(255,0,24,.6)] transition hover:bg-white hover:text-red-700 hover:scale-[1.02]">
                CANJEAR PASE AHORA <ChevronRight className="h-5 w-5" />
              </button>
              <button onClick={() => setDropState("recover")} className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 hover:text-white transition">
                ¿YA TIENES UN PASE? RECUPERAR AQUÍ
              </button>
            </div>
          </div>
        )}

        {dropState === "recover" && (
          <div className="relative z-10 flex flex-col items-center max-w-md mx-auto w-full text-center">
            <h2 className="text-3xl font-black text-white tracking-widest mb-2 uppercase italic">recuperar access</h2>
            <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 mb-8 font-bold">ingresa tu número registrado</p>
            
            <form onSubmit={handleRecover} className="w-full space-y-4">
              <div className="space-y-1 text-left">
                <p className="ml-2 text-[8px] uppercase tracking-widest text-zinc-500">teléfono (09XXXXXXXX)</p>
                <input required type="tel" maxLength={10} placeholder="0987654321" className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-4 text-xs font-bold text-white placeholder-zinc-800 outline-none focus:border-red-500/50 transition" value={recoveryPhone} onChange={(e) => setRecoveryPhone(e.target.value.replace(/[^\d]/g, ''))} />
              </div>

              {errorMsg && (
                <div className="flex items-center gap-3 text-[10px] font-bold text-red-400 bg-red-950/40 p-4 rounded-xl border border-red-500/30">
                  <ShieldAlert className="h-4 w-4 shrink-0" /> {errorMsg}
                </div>
              )}

              <button disabled={isSubmitting} type="submit" className="flex h-16 w-full items-center justify-center gap-2 rounded-2xl bg-white text-xs font-black uppercase tracking-[0.2em] text-black transition hover:bg-zinc-200">
                {isSubmitting ? "BUSCANDO..." : "RECLAMAR MI PASE"}
              </button>
              
              <button type="button" onClick={() => setDropState("countdown")} className="text-[8px] font-bold text-zinc-600 hover:text-white transition uppercase tracking-[0.3em]">
                volver
              </button>
            </form>
          </div>
        )}

        {dropState === "register" && (
          <div className="relative z-10 flex flex-col items-center max-w-md mx-auto w-full">
            <h2 className="text-3xl font-black text-white tracking-widest mb-2 uppercase italic">protocolo de registro</h2>
            <p className="text-[10px] uppercase tracking-[0.4em] text-red-500 mb-8 font-bold">validación de identidad requerida</p>
            
            <form onSubmit={handleRegister} className="w-full space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="ml-2 text-[8px] uppercase tracking-widest text-zinc-500">nombre</p>
                  <input required type="text" placeholder="EJ. BRANDON" className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-4 text-xs font-bold text-white placeholder-zinc-800 outline-none focus:border-red-500/50 transition" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ\s]/g, '')})} />
                </div>
                <div className="space-y-1">
                  <p className="ml-2 text-[8px] uppercase tracking-widest text-zinc-500">apellido</p>
                  <input required type="text" placeholder="EJ. MEDINA" className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-4 text-xs font-bold text-white placeholder-zinc-800 outline-none focus:border-red-500/50 transition" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ\s]/g, '')})} />
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="ml-2 text-[8px] uppercase tracking-widest text-zinc-500">teléfono ecuador (09XXXXXXXX)</p>
                <input required type="tel" maxLength={10} placeholder="0987654321" className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-4 text-xs font-bold text-white placeholder-zinc-800 outline-none focus:border-red-500/50 transition" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/[^\d]/g, '')})} />
              </div>

              <div className="space-y-1">
                <p className="ml-2 text-[8px] uppercase tracking-widest text-zinc-500">instagram (opcional)</p>
                <input type="text" placeholder="@DAWGS.EC" className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-4 text-xs font-bold text-white placeholder-zinc-800 outline-none focus:border-red-500/50 focus:bg-red-500/5 transition" value={formData.instagram} onChange={(e) => setFormData({...formData, instagram: e.target.value})} />
              </div>
              
              {errorMsg && (
                <div className="flex items-center gap-3 text-[10px] font-bold text-red-400 bg-red-950/40 p-4 rounded-xl border border-red-500/30">
                  <ShieldAlert className="h-4 w-4 shrink-0" /> {errorMsg}
                </div>
              )}

              <button disabled={isSubmitting} type="submit" className="mt-4 flex h-16 w-full items-center justify-center gap-2 rounded-2xl bg-white text-xs font-black uppercase tracking-[0.2em] text-black shadow-[0_0_30px_rgba(255,255,255,.2)] transition hover:bg-zinc-200 disabled:opacity-50">
                {isSubmitting ? "ENCRIPTANDO DATOS..." : "SOLICITAR ACCESO"}
              </button>
            </form>
          </div>
        )}

        {dropState === "waiting" && (
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="relative h-24 w-24">
              <div className="absolute inset-0 animate-ping rounded-full bg-red-500/20" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-red-500 shadow-[0_0_30px_red]">
                <Zap className="h-10 w-10 text-red-500 animate-pulse" />
              </div>
            </div>
            <h2 className="mt-8 text-2xl font-black text-white tracking-[0.3em] uppercase">procesando señal</h2>
            <p className="mt-2 text-[10px] text-red-500 uppercase tracking-[0.5em] font-bold animate-pulse">verificando disponibilidad en tiempo real</p>
          </div>
        )}

        {dropState === "winner" && passData && (
          <div className="pass-reveal relative z-10 w-full py-4">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-black text-white uppercase italic tracking-widest">¡acceso confirmado!</h2>
              <p className="text-[10px] uppercase tracking-[0.4em] text-red-500 mt-2 font-bold">bienvenido a la familia dawgs</p>
            </div>
            <PartyPass data={passData} />
          </div>
        )}

        {dropState === "loser" && (
          <div className="relative z-10 flex flex-col items-center text-center max-w-sm mx-auto">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-zinc-900 border border-white/10 text-zinc-500 mb-6">
              <ShieldAlert className="h-10 w-10" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-widest uppercase italic">drop agotado</h2>
            <p className="mt-4 text-xs text-zinc-400 uppercase tracking-widest leading-loose">
              Has llegado tarde a la señal. Los 100 pases exclusivos han sido reclamados. 
              <br /> <span className="text-red-500 font-bold">INTENTA EN EL LIVE GIVEAWAY ABAJO.</span>
            </p>
            <button onClick={() => setDropState("countdown")} className="mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-transparent text-xs font-black uppercase tracking-[0.2em] text-white transition hover:bg-white/5">
              VOLVER
            </button>
          </div>
        )}

      </div>
    </section>
  );
}

