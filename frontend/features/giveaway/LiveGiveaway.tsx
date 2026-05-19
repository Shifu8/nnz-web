"use client";

import { useState, useEffect, useRef } from "react";
import { Crown, Loader2, Sparkles, Trophy, Users, ShieldAlert, ChevronLeft, ChevronRight, Ticket, Gift, Dices, Eye, Radio } from "lucide-react";
import { gsap } from "gsap";
import { useGSAP } from "@/frontend/animations/gsapSetup";
import { isBadWord } from "@/lib/badWords";

type GiveawayState = 
  | "register" 
  | "waiting" 
  | "selecting_tickets" 
  | "show_tickets" 
  | "selecting_sponsor" 
  | "show_sponsor"
  | "final_results"
  | "ended";

interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

const SPONSORS = [
  { id: "iron", name: "Iron Athletics", prize: "1 Mes de Gimnasio", color: "text-zinc-300" },
  { id: "sushi", name: "Kyoto Sushi Bar", prize: "Cena para 2", color: "text-red-500" },
  { id: "zen", name: "Zen Fisioterapia", prize: "Sesión de Descarga Muscular", color: "text-blue-400" },
  { id: "burgers", name: "DAWGS Burgers", prize: "Combo Premium DAWGS", color: "text-orange-500" },
];

export default function LiveGiveaway({ onClose }: { onClose?: () => void }) {
  const container = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<GiveawayState>("register");
  
  // Data
  const [formData, setFormData] = useState({ firstName: "", lastName: "", phone: "" });
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [ticketWinners, setTicketWinners] = useState<Participant[]>([]);
  const [sponsorWinners, setSponsorWinners] = useState<{sponsor: any, winner: Participant}[]>([]);
  
  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [viewers, setViewers] = useState(1204);
  const [currentSponsorIndex, setCurrentSponsorIndex] = useState(0);

  // Fake viewers simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setViewers(prev => prev + Math.floor((Math.random() - 0.3) * 15));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAddBots = () => {
    const bots: Participant[] = Array.from({ length: 50 }).map((_, i) => ({
      id: `bot-${Date.now()}-${i}`,
      firstName: `USUARIO_${i}`,
      lastName: `RANDOM`,
      phone: `099${Math.floor(1000000 + Math.random() * 9000000)}`
    }));
    setParticipants(prev => [...prev, ...bots]);
  };

  useGSAP(() => {
    if (state.startsWith("selecting_")) {
      const tl = gsap.timeline();
      tl.to(".slot-spinner", { yPercent: -85, duration: 3.5, ease: "power2.inOut" });
      tl.to(".slot-glow", { opacity: 1, scale: 1.2, duration: 0.2, yoyo: true, repeat: 17 }, 0);

      setTimeout(() => {
        if (state === "selecting_tickets") {
          // Elegir 20 tickets
          const shuffled = [...participants].sort(() => Math.random() - 0.5);
          setTicketWinners(shuffled.slice(0, 20));
          setState("show_tickets");
        } else if (state === "selecting_sponsor") {
          // Elegir 1 sponsor winner que no haya ganado nada
          const allWinnersIds = new Set([...ticketWinners.map(w => w.id), ...sponsorWinners.map(w => w.winner.id)]);
          const availables = participants.filter(p => !allWinnersIds.has(p.id));
          const winner = availables.length > 0 ? availables[Math.floor(Math.random() * availables.length)] : participants[0]; // Fallback if ran out
          
          setSponsorWinners(prev => [...prev, { sponsor: SPONSORS[currentSponsorIndex], winner }]);
          setState("show_sponsor");
        }
      }, 4000);
    }

    if (state === "show_tickets" || state === "show_sponsor" || state === "final_results") {
      gsap.fromTo(".winners-reveal", { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "back.out(1.5)" });
    }
  }, [state]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (isBadWord(formData.firstName) || isBadWord(formData.lastName)) {
      setErrorMsg("LENGUAJE INAPROPIADO DETECTADO.");
      return;
    }

    const isDuplicate = participants.some(p => p.phone === formData.phone || (p.firstName.toUpperCase() === formData.firstName.toUpperCase() && p.lastName.toUpperCase() === formData.lastName.toUpperCase()));
    if (isDuplicate) {
      setErrorMsg("ESTA PERSONA O NÚMERO YA ESTÁ REGISTRADA.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const newP: Participant = {
        id: Date.now().toString(),
        firstName: formData.firstName.toUpperCase(),
        lastName: formData.lastName.toUpperCase(),
        phone: formData.phone
      };
      setParticipants(prev => [newP, ...prev]);
      setState("waiting");
      setIsSubmitting(false);
    }, 1000);
  };

  const nextDrawPhase = () => {
    if (state === "waiting") {
      setState("selecting_tickets");
    } else if (state === "show_tickets") {
      setState("selecting_sponsor");
    } else if (state === "show_sponsor") {
      if (currentSponsorIndex + 1 < SPONSORS.length) {
        setCurrentSponsorIndex(prev => prev + 1);
        setState("selecting_sponsor");
      } else {
        setState("final_results");
      }
    }
  };
 
  if (state === "ended") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] text-center px-4">
        <Sparkles className="h-16 w-16 text-zinc-500 mb-8 opacity-50" />
        <h2 className="text-5xl md:text-7xl font-black text-white tracking-widest uppercase italic">Próximamente</h2>
        <p className="mt-4 text-sm font-bold text-zinc-500 uppercase tracking-[0.4em]">Nueva experiencia en camino.</p>
        <button onClick={() => {
          if (onClose) onClose();
          else setState("register");
        }} className="mt-12 text-[10px] uppercase font-bold text-zinc-600 hover:text-white transition tracking-widest">
          <ChevronLeft className="inline w-3 h-3" /> Volver
        </button>
      </div>
    );
  }
 
  return (
    <section ref={container} className="relative z-10 mx-auto max-w-6xl px-4 py-8 md:py-16 overflow-hidden">
      <div className="relative rounded-[40px] border border-white/10 bg-zinc-950/80 p-6 md:p-12 backdrop-blur-3xl shadow-2xl min-h-[600px] flex flex-col">
        
        {/* Back Button (Local for states) */}
        {state !== "register" && state !== "selecting_tickets" && state !== "selecting_sponsor" && (
          <button onClick={() => setState("register")} className="absolute top-6 left-6 flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-300 transition hover:bg-white/10 hover:text-white z-50">
            <ChevronLeft className="h-4 w-4" /> VOLVER
          </button>
        )}
 
        {/* Global Back / Close Button when in Register state */}
        {state === "register" && onClose && (
          <button onClick={onClose} className="absolute top-6 left-6 flex items-center gap-2 rounded-full border border-red-500/20 bg-red-950/40 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-400 transition hover:bg-red-900/40 hover:text-white z-50 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
            <ChevronLeft className="h-4 w-4" /> VOLVER
          </button>
        )}

        {/* Live Viewers Badge */}
        <div className="absolute top-6 right-6 flex items-center gap-2 rounded-full bg-red-600/20 border border-red-500/30 px-3 py-1.5 shadow-[0_0_15px_rgba(255,0,24,0.3)] z-50">
          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-black text-red-500 tracking-widest flex items-center gap-1">
            <Eye className="w-3 h-3" /> {viewers.toLocaleString()}
          </span>
        </div>

        {/* HEADER */}
        {state !== "final_results" && !state.startsWith("selecting_") && state !== "show_sponsor" && state !== "show_tickets" && (
          <div className="flex flex-col items-center text-center mb-12 mt-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.4em] text-red-400">
              <Radio className="h-4 w-4 text-red-500" /> LIVE BROADCAST
            </div>
            <h2 className="mt-6 text-4xl font-black text-white md:text-6xl tracking-tighter drop-shadow-2xl">
              MEGA <span className="text-red-500">SORTEO</span>
            </h2>
            <p className="mt-3 max-w-md text-xs font-bold uppercase tracking-[0.3em] text-zinc-400">
              20 ENTRADAS VIP + 5 PREMIOS DE PATROCINADORES
            </p>
          </div>
        )}

        {/* REGISTRO */}
        {state === "register" && (
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="w-full">
              <h3 className="text-xl font-black text-white mb-6 uppercase tracking-widest flex items-center gap-2"><Ticket className="w-5 h-5" /> Entrar al Sorteo</h3>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input required type="text" placeholder="NOMBRE" className="w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-4 text-xs font-bold text-white placeholder-zinc-600 outline-none focus:border-red-600/50 transition" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ\s]/g, '')})} />
                  <input required type="text" placeholder="APELLIDO" className="w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-4 text-xs font-bold text-white placeholder-zinc-600 outline-none focus:border-red-600/50 transition" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ\s]/g, '')})} />
                </div>
                <input required type="tel" minLength={10} maxLength={10} placeholder="TELÉFONO (09XXXXXXXX)" className="w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-4 text-xs font-bold text-white placeholder-zinc-600 outline-none focus:border-red-600/50 transition" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value.replace(/[^\d]/g, '')})} />
                
                {errorMsg && (
                  <p className="text-[10px] font-bold text-red-400 bg-red-950/40 p-3 rounded-xl border border-red-500/30 uppercase tracking-widest flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 shrink-0" /> {errorMsg}
                  </p>
                )}

                <button disabled={isSubmitting} type="submit" className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-white text-xs font-black uppercase tracking-[0.2em] text-black shadow-[0_0_30px_rgba(255,255,255,0.2)] transition hover:bg-zinc-200 hover:scale-[1.02] disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : "PARTICIPAR AHORA"}
                </button>
              </form>

              <button onClick={handleAddBots} className="mt-8 text-[8px] text-zinc-600 font-bold uppercase tracking-widest hover:text-white transition">
                [DEV] Añadir 50 personas de prueba
              </button>
            </div>

            <div className="relative rounded-3xl border border-white/5 bg-black/40 p-6 backdrop-blur-xl h-[400px] flex flex-col">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-green-400 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> TABLA EN VIVO
                </h4>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                  <Users className="h-3 w-3" /> {participants.length} REGISTRADOS
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-2 no-scrollbar">
                {participants.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
                    <div className="h-8 w-8 rounded-lg bg-zinc-900 flex items-center justify-center text-[10px] font-black text-white border border-white/10">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white tracking-widest uppercase">{p.firstName} {p.lastName}</p>
                      <p className="text-[8px] font-bold text-zinc-500 tracking-widest mt-0.5">{p.phone.replace(/(\d{4})\d{4}(\d{2})/, "$1****$2")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ESPERANDO EL SORTEO */}
        {state === "waiting" && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="relative h-24 w-24 mb-8">
              <div className="absolute inset-0 animate-ping rounded-full bg-green-500/20" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-green-500/30 bg-green-500/10">
                <Trophy className="h-10 w-10 text-green-400" />
              </div>
            </div>
            <h3 className="text-3xl font-black text-white tracking-widest uppercase">¡Estás dentro!</h3>
            <p className="mt-4 text-xs font-bold text-zinc-400 uppercase tracking-[0.3em]">Tu registro ha sido verificado.</p>
            
            <button onClick={nextDrawPhase} className="mt-12 flex items-center gap-2 text-[10px] font-black text-white bg-red-600 px-8 py-4 rounded-full hover:bg-red-500 transition uppercase tracking-widest shadow-[0_0_30px_rgba(255,0,24,0.4)]">
              <Dices className="w-4 h-4" /> COMENZAR TRANSMISIÓN EN VIVO
            </button>
          </div>
        )}

        {/* ANIMACIÓN DE RULETA (Tanto para Tickets como para Sponsors) */}
        {state.startsWith("selecting_") && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black backdrop-blur-3xl">
            <h3 className="text-2xl md:text-4xl font-black text-white tracking-[0.3em] uppercase mb-12 text-center px-4">
              {state === "selecting_tickets" ? "SORTEANDO 20 ENTRADAS VIP" : `SORTEANDO PREMIO: ${SPONSORS[currentSponsorIndex].prize.toUpperCase()}`}
            </h3>
            
            <div className="relative h-32 w-full max-w-sm overflow-hidden rounded-2xl border-2 border-red-500/50 bg-zinc-950 shadow-[0_0_80px_rgba(255,0,24,0.3)]">
              <div className="slot-glow absolute inset-0 bg-red-500/20 opacity-0" />
              <div className="slot-spinner absolute left-0 right-0 top-0 flex flex-col items-center">
                {Array.from({ length: 40 }).map((_, i) => {
                  const p = participants[i % participants.length] || { firstName: "USER", lastName: "UNKNOWN" };
                  return (
                    <div key={i} className="flex h-32 items-center justify-center text-2xl font-black uppercase text-white tracking-widest">
                      {p.firstName} {p.lastName}
                    </div>
                  );
                })}
              </div>
              <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black to-transparent" />
            </div>
          </div>
        )}

        {/* MOSTRAR GANADORES TICKETS */}
        {state === "show_tickets" && (
          <div className="flex-1 flex flex-col h-full overflow-y-auto no-scrollbar pb-8 pt-12">
            <div className="text-center mb-8 winners-reveal">
              <h3 className="text-4xl font-black text-white uppercase tracking-widest drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">20 TICKETS VIP</h3>
              <p className="mt-2 text-xs font-bold text-zinc-400 uppercase tracking-widest">Estos son los primeros afortunados</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 winners-reveal">
              {ticketWinners.map((w, i) => (
                <div key={i} className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-center transition-all duration-300 hover:border-red-500/30 hover:bg-white/[0.05] hover:-translate-y-1 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />
                  <span className="absolute top-2 right-2 text-[8px] font-black text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-md">VIP</span>
                  <p className="text-xs font-black text-white tracking-widest uppercase mt-1">{w.firstName}</p>
                  <p className="text-[9px] font-bold text-zinc-500 tracking-widest mt-1.5">{w.phone.replace(/(\d{4})\d{4}(\d{2})/, "$1****$2")}</p>
                </div>
              ))}
            </div>
            <button onClick={nextDrawPhase} className="mt-12 mx-auto flex items-center gap-2 bg-red-600 text-white px-8 py-4 rounded-full font-black uppercase tracking-widest winners-reveal hover:bg-red-500 transition shadow-[0_0_20px_rgba(255,0,24,0.3)]">
              SIGUIENTE PREMIO <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* MOSTRAR GANADOR SPONSOR INDIVIDUAL */}
        {state === "show_sponsor" && (
          <div className="flex-1 flex flex-col items-center justify-center text-center pb-8 pt-12">
            <div className="mb-8 winners-reveal">
              <p className="text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2 justify-center text-zinc-400">
                <Gift className="w-4 h-4" /> PREMIO DE PATROCINADOR
              </p>
              <h3 className={`text-4xl md:text-6xl font-black uppercase tracking-widest drop-shadow-[0_0_20px_currentColor] ${SPONSORS[currentSponsorIndex].color}`}>
                {SPONSORS[currentSponsorIndex].prize}
              </h3>
              <p className="mt-4 text-sm font-bold text-zinc-300 uppercase tracking-widest">Cortesía de {SPONSORS[currentSponsorIndex].name}</p>
            </div>
            
            <div className="winners-reveal relative overflow-hidden rounded-[30px] border border-red-500/30 bg-zinc-950/90 p-12 text-center w-full max-w-md shadow-[0_0_60px_rgba(255,0,0,0.15)] backdrop-blur-2xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,0,0,0.05),transparent_70%)]" />
              <Crown className="w-14 h-14 text-yellow-500 mx-auto mb-6 drop-shadow-[0_0_20px_rgba(234,179,8,0.6)] animate-bounce" />
              <p className="relative z-10 text-3xl font-black text-white tracking-wider uppercase leading-tight">{sponsorWinners[currentSponsorIndex]?.winner.firstName} <br/> {sponsorWinners[currentSponsorIndex]?.winner.lastName}</p>
              <p className="relative z-10 text-xl font-bold text-red-500 tracking-widest mt-4 drop-shadow-[0_0_10px_rgba(239,68,68,0.4)]">{sponsorWinners[currentSponsorIndex]?.winner.phone.replace(/(\d{4})\d{4}(\d{2})/, "$1****$2")}</p>
              <div className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-4 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[8px] font-black text-zinc-400 tracking-widest uppercase">Ganador Seleccionado</span>
              </div>
            </div>

            <button onClick={nextDrawPhase} className="mt-12 mx-auto flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-black uppercase tracking-widest winners-reveal hover:bg-zinc-200 transition">
              {currentSponsorIndex + 1 < SPONSORS.length ? "SIGUIENTE PREMIO" : "VER TABLA FINAL"} <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* TABLA RESUMEN FINAL */}
        {state === "final_results" && (
          <div className="flex-1 flex flex-col h-full overflow-y-auto no-scrollbar pb-8 pt-12">
            <div className="text-center mb-12 winners-reveal">
              <h3 className="text-4xl font-black text-white uppercase tracking-widest drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">RESUMEN FINAL</h3>
              <p className="mt-2 text-xs font-bold text-zinc-400 uppercase tracking-widest">HALL OF FAME</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 winners-reveal">
              {/* Columna Patrocinadores */}
              <div className="rounded-3xl border border-red-500/20 bg-black/40 p-6">
                <h4 className="text-sm font-black text-red-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-2"><Gift className="w-5 h-5" /> PREMIOS PATROCINADORES</h4>
                <div className="space-y-3">
                  {sponsorWinners.map((w, i) => (
                    <div key={i} className="flex flex-col rounded-xl border border-white/5 bg-white/5 p-4 transition-all hover:bg-white/10">
                      <p className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-1">{w.sponsor.prize} ({w.sponsor.name})</p>
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-black text-white tracking-widest uppercase">{w.winner.firstName} {w.winner.lastName}</p>
                        <p className="text-[10px] font-bold text-red-400 tracking-widest">{w.winner.phone.replace(/(\d{4})\d{4}(\d{2})/, "$1****$2")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Columna Entradas */}
              <div className="rounded-3xl border border-white/10 bg-black/40 p-6">
                <h4 className="text-sm font-black text-white uppercase tracking-[0.4em] mb-6 flex items-center gap-2"><Ticket className="w-5 h-5" /> LOS 20 VIP TICKETS</h4>
                <div className="grid grid-cols-2 gap-2 h-[300px] overflow-y-auto pr-2 no-scrollbar">
                  {ticketWinners.map((w, i) => (
                    <div key={i} className="flex justify-between items-center rounded-xl bg-white/5 p-3">
                      <p className="text-[10px] font-black text-white tracking-widest uppercase truncate max-w-[80px]">{w.firstName}</p>
                      <p className="text-[8px] font-bold text-zinc-500 tracking-widest">{w.phone.replace(/(\d{4})\d{4}(\d{2})/, "$1****$2")}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={() => setState("ended")} className="mt-12 mx-auto flex items-center justify-center gap-2 text-[10px] w-full max-w-sm font-black text-zinc-500 border border-zinc-700 px-8 py-4 rounded-full hover:bg-zinc-800 hover:text-white transition uppercase tracking-widest winners-reveal">
              CERRAR TRANSMISIÓN
            </button>
          </div>
        )}

      </div>
    </section>
  );
}
