/**
 * Autor: Brandon Medina
 * Fecha: 16/05/2026
 * Descripción: Sistema de Sorteo en Vivo (LIVE GIVEAWAY). Experiencia premium, futurista y underground.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { Crown, Loader2, Sparkles, Trophy, Users, CheckCircle2, ShieldAlert } from "lucide-react";
import { gsap } from "gsap";
import { useGSAP } from "@/frontend/animations/gsapSetup";
import { isBadWord } from "@/lib/badWords";

type GiveawayState = "register" | "waiting" | "selecting" | "winners";

interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export default function LiveGiveaway() {
  const container = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<GiveawayState>("register");
  const [formData, setFormData] = useState({ firstName: "", lastName: "", phone: "" });
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [winners, setWinners] = useState<Participant[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLive, setIsLive] = useState(false);

  // Seed data fallback
  const seedParticipants: Participant[] = [
    { id: "1", firstName: "BRANDON", lastName: "MEDINA", phone: "0987******" },
    { id: "2", firstName: "ALEXIS", lastName: "TORRES", phone: "0991******" },
    { id: "3", firstName: "MATEO", lastName: "CRUZ", phone: "0985******" },
    { id: "4", firstName: "SEBASTIÁN", lastName: "VEGA", phone: "0998******" },
  ];

  useEffect(() => {
    fetchParticipants();
    
    // Check if it's 10:00 AM or later
    const checkTime = () => {
      const now = new Date();
      if (now.getHours() >= 10) {
        setIsLive(true);
      }
    };
    checkTime();

    const interval = setInterval(() => {
      fetchParticipants();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const fetchParticipants = async () => {
    try {
      const res = await fetch("/api/giveaway/participants");
      const data = await res.json();
      if (data.participants && data.participants.length > 0) {
        setParticipants(data.participants);
      } else {
        setParticipants(seedParticipants);
      }
    } catch (e) {
      setParticipants(seedParticipants);
    }
  };

  useGSAP(() => {
    if (state === "selecting") {
      const tl = gsap.timeline();
      
      // Floating names background animation
      tl.to(".floating-name-giveaway", {
        y: () => (Math.random() - 0.5) * 500,
        x: () => (Math.random() - 0.5) * 400,
        opacity: 0.6,
        scale: () => 0.4 + Math.random() * 1.2,
        rotate: () => (Math.random() - 0.5) * 45,
        duration: 0.4,
        stagger: { each: 0.02, repeat: 15, yoyo: true },
        ease: "power2.inOut"
      });

      // Camera shake and tension
      tl.to(container.current, {
        x: (i) => (Math.random() - 0.5) * 10,
        y: (i) => (Math.random() - 0.5) * 10,
        duration: 0.05,
        repeat: 100,
        yoyo: true
      }, 0);

      tl.to(".tension-overlay", {
        backgroundColor: "rgba(255,0,24,0.4)",
        duration: 0.1,
        repeat: 40,
        yoyo: true
      }, 0);

      setTimeout(() => {
        const selected = [...participants]
          .sort(() => Math.random() - 0.5)
          .slice(0, 10);
        setWinners(selected);
        setState("winners");
        // Final flash
        gsap.fromTo(".winners-grid", { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 1, ease: "expo.out" });
      }, 7000);
    }
  }, [state]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (isBadWord(formData.firstName) || isBadWord(formData.lastName)) {
      setErrorMsg("LENGUAJE INAPROPIADO DETECTADO.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const res = await fetch("/api/giveaway/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Error de registro");

      fetchParticipants();
      setState("waiting");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <section ref={container} className="relative z-10 mx-auto max-w-6xl px-4 py-16 md:py-24 overflow-hidden">
      <div className="relative rounded-[40px] border border-white/5 bg-zinc-950/50 p-8 md:p-16 backdrop-blur-2xl shadow-2xl">
        
        {/* Cinematic Header */}
        <div className="flex flex-col items-center text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">
            <Sparkles className="h-4 w-4 text-red-500" /> underground protocol
          </div>
          <h2 className="mt-8 text-5xl font-black text-white md:text-7xl italic tracking-tighter drop-shadow-2xl">
            LIVE <span className="text-red-600">GIVEAWAY</span>
          </h2>
          <p className="mt-4 max-w-md text-xs font-bold uppercase tracking-[0.3em] text-zinc-500">
            Sorteo en vivo de 10 pases founding dawg. <br />
            <span className="text-white">Activo hoy a las 10:00 AM.</span>
          </p>
        </div>

        {state === "register" && (
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Form Side */}
            <div className="w-full">
              <h3 className="text-2xl font-black text-white mb-8 italic uppercase tracking-widest">entrar al sorteo</h3>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input required type="text" placeholder="NOMBRE" className="w-full rounded-2xl border border-white/10 bg-black/40 px-6 py-5 text-xs font-bold text-white placeholder-zinc-800 outline-none focus:border-red-600/50 transition" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                  <input required type="text" placeholder="APELLIDO" className="w-full rounded-2xl border border-white/10 bg-black/40 px-6 py-5 text-xs font-bold text-white placeholder-zinc-800 outline-none focus:border-red-600/50 transition" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                </div>
                <input required type="tel" maxLength={10} placeholder="TELÉFONO (09XXXXXXXX)" className="w-full rounded-2xl border border-white/10 bg-black/40 px-6 py-5 text-xs font-bold text-white placeholder-zinc-800 outline-none focus:border-red-600/50 transition" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value.replace(/[^\d]/g, '')})} />
                
                {errorMsg && (
                  <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest ml-2 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4" /> {errorMsg}
                  </p>
                )}

                <button disabled={isSubmitting} type="submit" className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-red-600 text-xs font-black uppercase tracking-[0.3em] text-white shadow-[0_10px_40px_rgba(255,0,24,0.3)] transition hover:bg-white hover:text-black hover:scale-[1.02] disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : "REGISTRARME"}
                </button>
              </form>
            </div>

            {/* Live List Side */}
            <div className="relative rounded-3xl border border-white/5 bg-black/40 p-8 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" /> live signal
                </h4>
                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-1">
                  <Users className="h-3 w-3" /> {participants.length + 142} unidos
                </span>
              </div>
              
              <div className="space-y-3">
                {participants.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-4 transition-all hover:bg-white/10" style={{ opacity: 1 - i * 0.1 }}>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-zinc-900 flex items-center justify-center text-[10px] font-black text-red-500">
                        {p.firstName[0]}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-white tracking-widest">{p.firstName} {p.lastName}</p>
                        <p className="text-[8px] font-bold text-zinc-600 tracking-widest mt-0.5">{p.phone}</p>
                      </div>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-green-500/50" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {state === "waiting" && (
          <div className="flex flex-col items-center text-center py-20">
            <div className="relative h-32 w-32 mb-12">
              <div className="absolute inset-0 animate-ping rounded-full bg-red-600/10" />
              <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-2 border-red-600/30 shadow-[0_0_50px_rgba(255,0,24,0.2)]">
                <Trophy className="h-12 w-12 text-red-600" />
              </div>
            </div>
            <h3 className="text-3xl font-black text-white italic tracking-[0.3em] uppercase">registrado correctamente</h3>
            <p className="mt-4 text-xs font-bold text-zinc-500 uppercase tracking-[0.5em] animate-pulse">esperando inicio del sorteo...</p>
            
            <button onClick={() => setState("selecting")} className="mt-12 text-[10px] font-black text-red-500 border border-red-500/30 px-8 py-4 rounded-full hover:bg-red-500 hover:text-white transition uppercase tracking-widest">
              simular sorteo (demo)
            </button>
          </div>
        )}

        {state === "selecting" && (
          <div className="tension-overlay absolute inset-0 z-50 flex flex-col items-center justify-center bg-black overflow-hidden">
            <h3 className="text-5xl md:text-8xl font-black text-white tracking-[0.5em] italic z-50 mix-blend-difference">SELECCIONANDO</h3>
            <div className="mt-8 text-red-600 font-mono text-xl animate-pulse z-50">BYPASSING SECURITY...</div>
            
            {/* Floating Names Giveaway */}
            {participants.concat(seedParticipants).map((p, i) => (
              <div key={i} className="floating-name-giveaway absolute text-2xl font-black text-red-600/30 whitespace-nowrap pointer-events-none" style={{ left: "50%", top: "50%" }}>
                {p.firstName} {p.lastName}
              </div>
            ))}
          </div>
        )}

        {state === "winners" && (
          <div className="relative z-10 w-full">
            <div className="text-center mb-12">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-600 shadow-[0_0_40px_red] mb-6">
                <Crown className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-4xl font-black text-white italic uppercase tracking-widest">ganadores oficiales</h3>
              <p className="mt-2 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em]">nos comunicaremos mediante el número registrado</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {winners.map((w, i) => (
                <div key={i} className="group relative rounded-3xl border border-red-500/30 bg-black/60 p-6 text-center shadow-xl transition hover:border-red-500 hover:-translate-y-2">
                  <div className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg border-4 border-black group-hover:scale-125 transition">
                    <Trophy className="h-3 w-3" />
                  </div>
                  <div className="mx-auto h-12 w-12 rounded-full bg-zinc-900 border border-red-500/20 flex items-center justify-center text-red-500 font-black text-xs mb-4">
                    #{i + 1}
                  </div>
                  <p className="text-[10px] font-black text-white tracking-widest">{w.firstName}</p>
                  <p className="text-[10px] font-black text-white tracking-widest">{w.lastName}</p>
                  <div className="mt-4 flex items-center justify-center gap-1">
                    <div className="h-1 w-1 rounded-full bg-green-500" />
                    <span className="text-[8px] font-black text-zinc-500 tracking-widest uppercase">founding dawg</span>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => setState("register")} className="mt-16 mx-auto flex items-center gap-2 text-[10px] font-black text-zinc-600 hover:text-white transition uppercase tracking-widest">
              volver al inicio
            </button>
          </div>
        )}

      </div>
    </section>
  );
}
