"use client";

import { useState, useEffect, useRef, useCallback, type CSSProperties } from "react";
import { Crown, Loader2, Trophy, Users, ShieldAlert, ChevronLeft, Ticket, Gift, Eye, Sparkles, X, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { events } from "@/frontend/services/dawgsData";

const EVENT = events[0];

type Phase = "countdown" | "open" | "drawing" | "closed";

interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

function maskPhone(phone: string) {
  if (phone.length < 6) return "*******";
  return phone.slice(0, 3) + "*******";
}

const ALL_PRIZES = [
  { type: "ticket" as const, label: "Entrada VIP" },
  { type: "ticket" as const, label: "Entrada VIP" },
  { type: "ticket" as const, label: "Entrada VIP" },
  { type: "ticket" as const, label: "Entrada VIP" },
  { type: "ticket" as const, label: "Entrada VIP" },
  { type: "ticket" as const, label: "Entrada VIP" },
  { type: "ticket" as const, label: "Entrada VIP" },
  { type: "ticket" as const, label: "Entrada VIP" },
  { type: "ticket" as const, label: "Entrada VIP" },
  { type: "ticket" as const, label: "Entrada VIP" },
  { type: "ticket" as const, label: "Entrada VIP" },
  { type: "ticket" as const, label: "Entrada VIP" },
  { type: "ticket" as const, label: "Entrada VIP" },
  { type: "ticket" as const, label: "Entrada VIP" },
  { type: "ticket" as const, label: "Entrada VIP" },
  { type: "ticket" as const, label: "Entrada VIP" },
  { type: "ticket" as const, label: "Entrada VIP" },
  { type: "ticket" as const, label: "Entrada VIP" },
  { type: "ticket" as const, label: "Entrada VIP" },
  { type: "ticket" as const, label: "Entrada VIP" },
  { type: "sponsor" as const, label: "Iron Athletics · 1 Mes de Gimnasio", sponsor: "Iron Athletics", color: "text-zinc-300", emoji: "🏋️" },
  { type: "sponsor" as const, label: "Kyoto Sushi Bar · Cena para 2", sponsor: "Kyoto Sushi Bar", color: "text-red-500", emoji: "🍣" },
  { type: "sponsor" as const, label: "Zen Fisioterapia · Sesión de Descarga Muscular", sponsor: "Zen Fisioterapia", color: "text-blue-400", emoji: "💆" },
  { type: "sponsor" as const, label: "DAWGS Burgers · Combo Premium", sponsor: "DAWGS Burgers", color: "text-orange-500", emoji: "🍔" },
  { type: "sponsor" as const, label: "Mister Jeans · Gift Card $50", sponsor: "Mister Jeans", color: "text-green-400", emoji: "👖" },
];

interface Winner {
  prize: string;
  participant: Participant;
  type: "ticket" | "sponsor";
  sponsor?: string;
  color?: string;
  emoji?: string;
}

export default function LiveGiveaway({ onClose }: { onClose?: () => void }) {
  const [phase, setPhase] = useState<Phase>("countdown");
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [targetTime, setTargetTime] = useState<string>("");
  const [closeTime, setCloseTime] = useState<string>("");

  const [formData, setFormData] = useState({ firstName: "", lastName: "", phone: "" });
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [viewers, setViewers] = useState(1204);

  // Restore persisted state
  const [winners, setWinners] = useState<Winner[]>(() => {
    try {
      const saved = localStorage.getItem("gw_winners");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [currentPrizeIndex, setCurrentPrizeIndex] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showWinnersTable, setShowWinnersTable] = useState<boolean>(() => {
    try { return localStorage.getItem("gw_showTable") === "true"; } catch { return false; }
  });
  const [resultsEndTime, setResultsEndTime] = useState<Date | null>(() => {
    try {
      const saved = localStorage.getItem("gw_resultsEnd");
      return saved ? new Date(saved) : null;
    } catch { return null; }
  });
  const [resultsTimeLeft, setResultsTimeLeft] = useState<string>("");
  const [drawTrigger, setDrawTrigger] = useState(0);
  const [spinName, setSpinName] = useState("");
  const [verified, setVerified] = useState<Winner | null>(null);
  const serverMsUntilOpen = useRef(0);
  const serverMsUntilClose = useRef(0);
  const winnersEndServerRef = useRef(0);

  const drawStepRef = useRef(false);
  const restoredRef = useRef(false);
  const resultsEndRef = useRef<Date | null>(null);
  const allWinnersRef = useRef<Winner[]>([]);
  const revealedCountRef = useRef(0);
  const participantsRef = useRef<Participant[]>([]);
  participantsRef.current = participants;

  // Restore revealed count from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("gw_revealed");
      if (saved) revealedCountRef.current = Number(saved);
    } catch {}
  }, []);

  // If winners were persisted, mark drawing as done
  if (typeof window !== "undefined" && winners.length > 0) {
    drawStepRef.current = true;
  }

  // Persist winners/table to localStorage
  useEffect(() => {
    try { localStorage.setItem("gw_winners", JSON.stringify(winners)); } catch {}
  }, [winners]);

  useEffect(() => {
    try { localStorage.setItem("gw_showTable", String(showWinnersTable)); } catch {}
  }, [showWinnersTable]);

  // Persist revealed count so reload resume works
  useEffect(() => {
    try { localStorage.setItem("gw_revealed", String(revealedCountRef.current)); } catch {}
  }, [winners]);

  // Local countdown tick 1s — reads server-ref values to stay in sync
  useEffect(() => {
    if (phase !== "countdown" && phase !== "open") return;
    const interval = setInterval(() => {
      const ms = phase === "countdown" ? serverMsUntilOpen.current : serverMsUntilClose.current;
      if (ms > 0) {
        const total = Math.floor(ms / 1000);
        setTimeLeft({
          hours: Math.floor(total / 3600),
          minutes: Math.floor((total % 3600) / 60),
          seconds: total % 60,
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);
  useEffect(() => {
    const interval = setInterval(() => {
      setViewers(prev => prev + Math.floor((Math.random() - 0.3) * 15));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Sync with server
  const sync = useCallback(async () => {
    try {
      const res = await fetch("/api/giveaway/status", { cache: "no-store" });
      const data = await res.json();
      serverMsUntilOpen.current = data.msUntilOpen || 0;
      serverMsUntilClose.current = data.msUntilClose || 0;
      winnersEndServerRef.current = data.msUntilWinnersEnd || 0;
      setTargetTime(data.openAt);
      setCloseTime(data.closeAt);

      if (data.phase === "open") {
        const ms = serverMsUntilClose.current;
        if (ms > 0) {
          const total = Math.floor(ms / 1000);
          setTimeLeft({ hours: 0, minutes: Math.floor(total / 60), seconds: total % 60 });
        }
        setPhase("open");
      } else if (data.phase === "drawing") {
        setPhase("drawing");
      } else if (data.phase === "closed") {
        setPhase("closed");
        setShowWinnersTable(true);
      } else {
        // countdown / promo phase — clear any stale winners
        if (winners.length > 0) {
          setWinners([]);
          setShowWinnersTable(false);
          setCurrentPrizeIndex(0);
          drawStepRef.current = false;
          restoredRef.current = false;
          allWinnersRef.current = [];
          revealedCountRef.current = 0;
          try { localStorage.removeItem("gw_winners"); localStorage.removeItem("gw_showTable"); localStorage.removeItem("gw_revealed"); } catch {}
          // Clear server winners for the new cycle
          fetch("/api/giveaway/winners", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ winners: [] }),
          }).catch(() => {});
        }
        setPhase("countdown");
        const ms = serverMsUntilOpen.current;
        if (ms > 0) {
          const total = Math.floor(ms / 1000);
          setTimeLeft({
            hours: Math.floor(total / 3600),
            minutes: Math.floor((total % 3600) / 60),
            seconds: total % 60,
          });
        }
      }
      // Restore winners from server (once) — only when phase is closed (animation already finished)
      if (!restoredRef.current && data.winners?.length && data.phase === "closed") {
        restoredRef.current = true;
        const restored: Winner[] = data.winners.map((w: any) => ({
          prize: w.prize,
          participant: { id: w.participantId, firstName: w.firstName, lastName: w.lastName, phone: w.phone },
          type: w.type,
          sponsor: w.sponsor,
          emoji: w.emoji,
        }));
        allWinnersRef.current = restored;
        setWinners(restored);
        setShowWinnersTable(true);
        setPhase("closed");
        drawStepRef.current = true;
      }
    } catch {}
  }, [winners.length, showWinnersTable]);

  useEffect(() => {
    sync();
    const interval = setInterval(sync, 100);
    return () => clearInterval(interval);
  }, [sync]);

  // Fetch participants
  const fetchParticipants = useCallback(async () => {
    try {
      const res = await fetch("/api/giveaway/participants", { cache: "no-store" });
      const d = await res.json();
      if (d.participants?.length) setParticipants(d.participants);
    } catch {}
  }, []);

  useEffect(() => {
    fetchParticipants();
    const interval = setInterval(fetchParticipants, 500);
    return () => clearInterval(interval);
  }, [fetchParticipants]);

  // Auto-draw: when phase becomes "drawing"
  useEffect(() => {
    if (phase !== "drawing" || drawStepRef.current || showWinnersTable) return;

    const preDrawAll = async () => {
      try {
        // Check if another device already posted winners
        const checkRes = await fetch("/api/giveaway/winners", { cache: "no-store" });
        const checkData = await checkRes.json();
        if (checkData.winners?.length > 0) {
          // Winners already determined — restore to ref and animate
          const restored: Winner[] = checkData.winners.map((w: any) => ({
            prize: w.prize,
            participant: { id: w.participantId, firstName: w.firstName, lastName: w.lastName, phone: w.phone },
            type: w.type,
            sponsor: w.sponsor,
            emoji: w.emoji,
          }));
          allWinnersRef.current = restored;

          // Restore participants for the spin animation pool
          fetch("/api/giveaway/participants", { cache: "no-store" })
            .then(r => r.json())
            .then(d => { if (d.participants?.length) setParticipants(d.participants); })
            .catch(() => {});

          drawStepRef.current = true;
          restoredRef.current = true;
          setCurrentPrizeIndex(0);
          setDrawTrigger(t => t + 1);
          return;
        }
      } catch {}

      // First device — pre-determine ALL winners, POST to server
      const pRes = await fetch("/api/giveaway/participants", { cache: "no-store" });
      const pData = await pRes.json();
      if (!pData.participants?.length) return;
      setParticipants(pData.participants);

      const pool: Participant[] = pData.participants;
      const usedIds = new Set<string>();
      const allWinners: Winner[] = [];

      for (const prize of ALL_PRIZES) {
        const available = pool.filter(p => !usedIds.has(p.id));
        if (!available.length) break;
        const pick = available[Math.floor(Math.random() * available.length)];
        usedIds.add(pick.id);
        allWinners.push({
          prize: prize.label,
          participant: pick,
          type: prize.type,
          sponsor: prize.type === "sponsor" ? prize.sponsor : undefined,
          color: prize.type === "sponsor" ? prize.color : undefined,
          emoji: prize.type === "sponsor" ? prize.emoji : undefined,
        });
      }

      allWinnersRef.current = allWinners;

      try {
        await fetch("/api/giveaway/winners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            winners: allWinners.map(w => ({
              prize: w.prize,
              participantId: w.participant.id,
              firstName: w.participant.firstName,
              lastName: w.participant.lastName,
              phone: w.participant.phone,
              type: w.type,
              sponsor: w.sponsor,
              emoji: w.emoji,
            })),
          }),
        });
      } catch {}

      drawStepRef.current = true;
      restoredRef.current = true;
      setCurrentPrizeIndex(0);
      setDrawTrigger(t => t + 1);
    };

    preDrawAll();
  }, [phase]);

  // Catch-up draw: when page loads post-giveaway with no winners
  useEffect(() => {
    if (!showWinnersTable || winners.length > 0 || !participants.length || drawStepRef.current) return;
    drawStepRef.current = true;
    setCurrentPrizeIndex(0);
  }, [showWinnersTable, participants, winners.length]);

  // Draw next prize — reveals from pre-determined allWinnersRef
  useEffect(() => {
    if (!drawStepRef.current || winners.length >= ALL_PRIZES.length) return;

    const winner = allWinnersRef.current[winners.length];
    if (!winner) return;

    if (showWinnersTable) {
      setWinners(allWinnersRef.current);
      setIsDrawing(false);
      return;
    }

    const pool = participantsRef.current;
    const delay = winners.length === 0 ? 500 : 2500;
    const cleanups: number[] = [];
    const startTimer = window.setTimeout(() => {
      setIsDrawing(true);
      setSpinName("");

      const totalSpins = 18 + Math.floor(Math.random() * 8);
      let spinCount = 0;
      let speed = 100;

      const spin = () => {
        const idx = Math.floor(Math.random() * pool.length);
        spinCount++;
        setSpinName(`${pool[idx].firstName} ${pool[idx].lastName}`);

        if (spinCount >= totalSpins) {
          setVerified(winner);

          const addTimer = window.setTimeout(() => {
            setWinners(prev => [...prev, winner]);
            revealedCountRef.current = winners.length + 1;
            setIsDrawing(false);
            setVerified(null);
            setSpinName("");
          }, 2800);

          cleanups.push(addTimer);
          return;
        }

        if (spinCount > totalSpins * 0.6) {
          speed = Math.min(speed + 20, 350);
        }
        cleanups.push(window.setTimeout(spin, speed));
      };

      cleanups.push(window.setTimeout(spin, speed));
    }, delay);

    cleanups.push(startTimer);

    return () => {
      cleanups.forEach(id => window.clearTimeout(id));
    };
  }, [winners.length, phase, drawTrigger]);

  // When all winners done → show results table
  useEffect(() => {
    if (winners.length === ALL_PRIZES.length && winners.length > 0) {
      setIsDrawing(false);
      revealedCountRef.current = 0;
      try { localStorage.removeItem("gw_revealed"); } catch {}
      const timer = setTimeout(() => {
        setShowWinnersTable(true);
        setPhase("closed");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [winners.length]);

  // Winners countdown — from server msUntilWinnersEnd
  useEffect(() => {
    if (!showWinnersTable) return;
    const interval = setInterval(async () => {
      const diff = winnersEndServerRef.current;
      if (diff <= 0) return;
      if (diff <= 1000) {
        clearInterval(interval);
        try {
          await fetch("/api/giveaway/reset", { method: "POST" });
          localStorage.removeItem("gw_showTable");
          localStorage.removeItem("gw_winners");
          localStorage.removeItem("gw_resultsEnd");
        } catch {}
        setShowWinnersTable(false);
        setWinners([]);
        setCurrentPrizeIndex(0);
        drawStepRef.current = false;
        restoredRef.current = false;
        allWinnersRef.current = [];
        revealedCountRef.current = 0;
        setResultsTimeLeft("");
        // Also clear server winners
        try {
          await fetch("/api/giveaway/winners", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ winners: [] }),
          });
        } catch {}
        return;
      }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setResultsTimeLeft(`${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [showWinnersTable]);

  // Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/giveaway/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setSuccessMsg("¡REGISTRADO EXITOSAMENTE!");
      setTimeout(() => setSuccessMsg(""), 3000);
      setParticipants(prev => [{
        id: data.participantId,
        firstName: formData.firstName.toUpperCase(),
        lastName: formData.lastName.toUpperCase(),
        phone: formData.phone,
      }, ...prev]);
      setFormData({ firstName: "", lastName: "", phone: "" });
    } catch (err: any) {
      setErrorMsg(err.message.toUpperCase());
    } finally {
      setIsSubmitting(false);
    }
  };

  const seedParticipants = async () => {
    setSeeding(true);
    try {
      await fetch("/api/giveaway/seed", { method: "POST" });
      fetchParticipants(); // immediate refresh, poll will also pick it up
    } catch {}
    setSeeding(false);
  };

  return (
    <section className="relative z-10 mx-auto w-full px-4 py-14 md:py-18 flex justify-center">
      <div className="relative w-full max-w-6xl">
        {onClose && (
          <button onClick={onClose} className="glass-action glass-action-danger absolute -left-1 -top-2 z-50" style={{ "--glass-action-height": "38px", "--glass-action-px": "1rem", "--glass-action-text": "0.56rem" } as CSSProperties}>
            <ChevronLeft className="h-3.5 w-3.5" /> SALIR
          </button>
        )}

        <div className="max-w-lg mx-auto">
        <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-black/60 shadow-[0_0_60px_rgba(255,0,24,.1)]">
        <div className="absolute inset-0">
          <img src={EVENT.poster} alt="" className="h-full w-full object-cover opacity-30 mix-blend-luminosity" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
        </div>

        <div className="relative p-6 md:p-8">
        <div className="flex items-center gap-2 rounded-full border border-red-500/30 bg-red-950/40 px-3 py-1.5 w-fit text-[9px] font-black uppercase tracking-[0.3em] text-red-200">
          <Gift className="h-3 w-3 text-red-500" /> DAWGS GIVEAWAY
        </div>

        {/* Live viewers — only during drawing */}
        {phase === "drawing" && (
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-red-950/60 border border-red-900/50 px-3 py-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
            <span className="text-[9px] font-black text-red-500 tracking-widest flex items-center gap-1">
              <Eye className="w-3 h-3" /> {viewers.toLocaleString()}
            </span>
          </div>
        )}

        {/* ... existing phase content continues ... */}

        {/* ===== PROMO / COUNTDOWN ===== */}
        {phase === "countdown" && (
          <div className="relative">
            <div className="mt-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-4xl md:text-5xl font-black text-white uppercase leading-none">{EVENT.title}</h2>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.35em] text-red-400">{EVENT.subtitle}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-[9px] font-black uppercase tracking-widest text-zinc-400">
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                ROA · YAN BLOCK · OMAR COURTZ
              </span>
            </div>

            {timeLeft && (
              <div className="mt-5 rounded-2xl border border-white/10 bg-black/60 p-5">
                <p className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-3 text-center">Se abre en</p>
                <div className="grid grid-cols-3 gap-2">
                  {["HORAS", "MINUTOS", "SEGUNDOS"].map((label, i) => {
                    const parts = [`${String(timeLeft.hours).padStart(2,"0")}`, `${String(timeLeft.minutes).padStart(2,"0")}`, `${String(timeLeft.seconds).padStart(2,"0")}`];
                    return (
                      <div key={label} className="flex flex-col items-center rounded-xl border border-white/[0.06] bg-white/[0.03] py-2.5">
                        <span className="text-xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,.15)]">{parts[i]}</span>
                        <span className="text-[7px] font-bold uppercase tracking-widest text-zinc-600">{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-2 text-center">Patrocinadores</p>
              <div className="grid grid-cols-2 gap-2">
                {ALL_PRIZES.filter(p => p.type === "sponsor").map((s) => (
                  <div key={s.sponsor} className="flex items-center gap-2 rounded-lg border border-zinc-800/50 bg-black/30 px-2.5 py-1.5">
                    <span className="text-xs">{s.emoji}</span>
                    <span className="text-[8px] font-black uppercase tracking-wider text-white">{s.sponsor}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-4 text-center text-[8px] font-bold uppercase tracking-[0.25em] text-zinc-600">
              Se sortearán 20 ENTRADAS VIP + Premios de patrocinadores
            </p>
          </div>
        )}



        {/* ===== REGISTER ===== */}
        {phase === "open" && !showWinnersTable && (
          <div className="relative z-10">
            <div className="flex flex-col items-center text-center mb-10 mt-12">
              <span className="inline-flex items-center gap-1.5 w-fit rounded-lg border border-red-900/50 bg-red-950/40 px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-red-500 mb-5">
                <Radio className="w-3 h-3" /> REGISTRO ABIERTO
              </span>
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight uppercase leading-none">
                MEGA <span className="text-red-600">SORTEO</span>
              </h2>
              {timeLeft && (
                <p className="mt-4 text-sm md:text-base font-black text-zinc-600 uppercase tracking-widest">
                  CIERRE EN <span className="text-2xl md:text-3xl text-red-500 font-mono ml-2 tabular-nums">{String(timeLeft.minutes).padStart(2, "0")}:{String(timeLeft.seconds).padStart(2, "0")}</span>
                </p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-start">
              {/* Registration Form */}
              <div>
                <h3 className="text-lg font-black text-white mb-5 uppercase tracking-widest flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-red-500" /> Participar
                </h3>
                <form onSubmit={handleRegister} className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3.5">
                    <input required type="text" placeholder="NOMBRE" className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 text-xs font-bold text-white placeholder-zinc-600 outline-none focus:border-red-900/50 transition-colors" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ\s]/g, '')})} />
                    <input required type="text" placeholder="APELLIDO" className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 text-xs font-bold text-white placeholder-zinc-600 outline-none focus:border-red-900/50 transition-colors" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ\s]/g, '')})} />
                  </div>
                  <input required type="tel" minLength={10} maxLength={10} placeholder="TELÉFONO (09XXXXXXXX)" className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 text-xs font-bold text-white placeholder-zinc-600 outline-none focus:border-red-900/50 transition-colors" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value.replace(/[^\d]/g, '')})} />
                  {errorMsg && (
                    <p className="text-[10px] font-bold text-red-500 bg-red-950/50 p-3.5 rounded-xl border border-red-900/50 uppercase tracking-wider flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 shrink-0" /> {errorMsg}
                    </p>
                  )}
                  {successMsg && (
                    <p className="text-[10px] font-bold text-green-400 bg-green-950/50 p-3.5 rounded-xl border border-green-900/50 uppercase tracking-wider flex items-center gap-2">
                      {successMsg}
                    </p>
                  )}
                  <button disabled={isSubmitting} type="submit" className="glass-action glass-action-primary w-full" style={{ "--glass-action-height": "48px", "--glass-action-text": "0.72rem" } as CSSProperties}>
                    {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : "PARTICIPAR AHORA"}
                  </button>
                  <button type="button" onClick={seedParticipants} disabled={seeding}
                    className="glass-action-quiet w-full text-center"
                    style={{ "--glass-action-height": "32px", "--glass-action-px": "1rem", "--glass-action-text": "0.55rem" } as CSSProperties}>
                    {seeding ? "SEMBRANDO..." : "+100 PARA PRUEBAS"}
                  </button>
                </form>
              </div>

              {/* Participant List */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 h-[400px] flex flex-col">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
                  <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-red-500 flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" /> EN VIVO
                  </h4>
                  <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-1">
                    <Users className="h-3 w-3" /> {participants.length}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 space-y-1.5 no-scrollbar">
                  {participants.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-3 rounded-xl bg-zinc-900 p-2.5 border border-zinc-800">
                      <div className="h-7 w-7 rounded-lg bg-zinc-800 flex items-center justify-center text-[9px] font-black text-zinc-500">
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-zinc-300 tracking-widest uppercase">{p.firstName} {p.lastName}</p>
                        <p className="text-[8px] font-bold text-zinc-600 tracking-widest mt-0.5">{maskPhone(p.phone)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== DRAWING ===== */}
        {phase === "drawing" && !showWinnersTable && (
          <div className="relative z-10 min-h-[500px] flex flex-col items-center justify-center py-16 overflow-hidden">
            {/* Pulsing red glow behind */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] animate-pulse" />
            </div>

            <div className="relative">
              <span className="inline-flex items-center gap-1.5 w-fit rounded-lg border border-red-500/40 bg-red-950/60 px-5 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-red-400 mb-6 animate-pulse shadow-lg shadow-red-900/30">
                <Sparkles className="w-3.5 h-3.5" /> SORTEO EN VIVO
              </span>
            </div>

            <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight text-center mb-8 leading-none">
              {winners.length < ALL_PRIZES.length ? (
                <>
                  SORTEANDO
                  <motion.span
                    key={ALL_PRIZES[winners.length].label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-red-500 text-xl md:text-2xl mt-4 block font-black tracking-[0.15em]"
                  >
                    {ALL_PRIZES[winners.length].label}
                  </motion.span>
                </>
              ) : (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="inline-block">
                  ¡SORTEO COMPLETADO!
                </motion.span>
              )}
            </h2>

            {/* Slot machine */}
            <div className={`relative w-full max-w-md h-24 overflow-hidden rounded-2xl border-2 transition-all duration-300 ${isDrawing ? "border-red-500/60 shadow-lg shadow-red-600/20" : "border-zinc-700"}`}>
              {/* Scanning line */}
              <motion.div
                className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent z-20 pointer-events-none"
                animate={{ top: ["-2%", "102%"] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              />
              <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-zinc-950 to-transparent z-10" />
              <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-zinc-950 to-transparent z-10" />
              <div className="flex h-24 items-center justify-center">
                <AnimatePresence mode="wait">
                  {spinName ? (
                    <motion.p
                      key={spinName}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.1 }}
                      className="text-2xl md:text-3xl font-black text-zinc-300 uppercase tracking-widest"
                    >
                      {spinName}
                    </motion.p>
                  ) : verified ? (
                    <motion.p
                      key="verified"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-2xl md:text-3xl font-black text-yellow-400 uppercase tracking-widest"
                    >
                      {verified.participant.firstName} {verified.participant.lastName}
                    </motion.p>
                  ) : (
                    <motion.p
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-lg font-bold text-zinc-700 uppercase"
                    >
                      —
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Verification badge */}
            <AnimatePresence>
              {verified && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5, y: -20 }}
                  transition={{ type: "spring", stiffness: 200, damping: 12 }}
                  className="mt-6 text-center"
                >
                  <motion.div
                    initial={{ boxShadow: "0 0 0px rgba(234,179,8,0)" }}
                    animate={{ boxShadow: "0 0 40px rgba(234,179,8,0.3)" }}
                    transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
                    className="inline-flex items-center gap-2.5 rounded-xl border border-yellow-500/40 bg-yellow-950/60 px-6 py-3"
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                    >
                      <Crown className="w-6 h-6 text-yellow-400" />
                    </motion.div>
                    <span className="text-sm font-black text-yellow-400 uppercase tracking-[0.2em]">SELECCIONADO</span>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Winner reveal — only visible when NOT in verification (no exit animation delay) */}
            {!verified && winners.length > 0 && (
              <motion.div
                key={winners.length}
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="mt-10 text-center relative"
              >
                {/* Glow behind winner name */}
                <div className="absolute inset-0 bg-gradient-to-t from-red-600/10 to-transparent blur-2xl -z-10" />
                <motion.p
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                  className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em] mb-3"
                >
                  ═══ GANADOR ═══
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                    className="text-3xl md:text-4xl font-black text-white uppercase tracking-wider"
                  >
                    {winners[winners.length - 1].participant.firstName} {winners[winners.length - 1].participant.lastName}
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-sm text-zinc-500 mt-2 font-bold tracking-widest uppercase"
                  >
                    {winners[winners.length - 1].prize}
                  </motion.p>
                </motion.div>
              )}

            {/* Progress with labels */}
            <div className="mt-10 w-full max-w-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest">
                  PROGRESO {winners.length}/{ALL_PRIZES.length}
                </span>
                <span className="text-[8px] font-bold text-red-500/60 uppercase tracking-widest">
                  {isDrawing ? "GIRANDO..." : "LISTO"}
                </span>
              </div>
              <div className="flex gap-1.5 w-full">
                {ALL_PRIZES.map((p, i) => (
                  <div key={i} className="flex-1 h-1.5 rounded-full transition-all duration-700 relative group"
                    style={{ background: i < winners.length ? "#dc2626" : i === winners.length && isDrawing ? "linear-gradient(90deg, #dc2626, #ef4444, #dc2626)" : "#27272a" }}
                  >
                    <div className={`absolute -top-6 left-1/2 -translate-x-1/2 text-[6px] font-bold whitespace-nowrap transition-opacity duration-300 ${i === winners.length && isDrawing ? "text-red-500 opacity-100" : "text-zinc-700 opacity-0"}`}>
                      {p.type === "sponsor" ? `${p.emoji} ${p.label}` : p.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== RESULTS TABLE ===== */}
        {showWinnersTable && (
          <div className="relative z-10 py-8">
            <div className="text-center mb-10 mt-10">
              <span className="inline-flex items-center gap-1.5 w-fit rounded-lg border border-red-900/50 bg-red-950/40 px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-red-500 mb-5 mx-auto">
                <Trophy className="w-3 h-3" /> SORTEO FINALIZADO
              </span>
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight uppercase leading-none">GANADORES</h2>
              {resultsTimeLeft && (
                <p className="mt-3 text-sm font-black text-zinc-600 uppercase tracking-widest">
                  TABLA CIERRA EN <span className="text-red-500 font-mono ml-1">{resultsTimeLeft}</span>
                </p>
              )}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Sponsor Winners */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
                <h3 className="text-sm font-black text-red-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                  <Gift className="w-4 h-4" /> PREMIOS PATROCINADORES
                </h3>
                <div className="space-y-2.5">
                  {winners.filter(w => w.type === "sponsor").map((w, i) => (
                    <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3.5">
                      <p className="text-[9px] font-bold text-zinc-600 tracking-widest uppercase mb-1 flex items-center gap-2">
                        <span className="text-base">{w.emoji}</span> {w.prize}
                      </p>
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-black text-zinc-200 tracking-widest uppercase">{w.participant.firstName} {w.participant.lastName}</p>
                        <p className="text-[9px] font-bold text-red-500/60">{maskPhone(w.participant.phone)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ticket Winners */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
                <h3 className="text-sm font-black text-zinc-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-red-500" /> 20 ENTRADAS VIP
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
                  {winners.filter(w => w.type === "ticket").map((w, i) => (
                    <div key={i} className="rounded-xl bg-zinc-900 border border-zinc-800 p-2.5">
                      <p className="text-[10px] font-black text-zinc-300 tracking-widest uppercase leading-tight">{w.participant.firstName} {w.participant.lastName}</p>
                      <p className="text-[8px] font-bold text-zinc-600 mt-0.5">{maskPhone(w.participant.phone)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
      </div>
      </div>
    </section>
  );
}

function Radio({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3" fill="currentColor"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>;
}
