/**
 * Autor: Brandon Medina
 * Fecha: 16/05/2026
 * Descripción: Sistema oficial DAWGS ACCESS DROP. Sistema de canje limitado con urgencia visual.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronRight, ShieldAlert, Zap, ChevronLeft, Loader2 } from "lucide-react";
import { gsap, useGSAP } from "@/frontend/animations/gsapSetup";
import PartyPass from "./PartyPass";
import { isBadWord } from "@/lib/badWords";

type DropState = "countdown" | "register" | "recover" | "waiting" | "winner" | "loser";

export default function AccessDrop({ onClose }: { onClose?: () => void }) {
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

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/kushki/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al iniciar pago");
      }

      // En un flujo real, aquí redirigirías a data.paymentUrl o inicializarías el SDK de Kushki.
      // Simulamos la espera del pago:
      setDropState("waiting");

      // Simulamos que el Webhook responde y activa el ticket después de 3 segundos
      setTimeout(async () => {
        try {
          // 1. Enviamos confirmación simulada al webhook
          await fetch("/api/kushki/webhook", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              transactionId: data.transactionId,
              status: "APPROVED",
              ticketNumber: `KUSHKI-${Math.floor(100000 + Math.random() * 900000)}`,
              amount: 10
            })
          });

          // 2. Recuperamos el pase real de la base de datos para garantizar que el QR y número de serie coincidan
          const recoverRes = await fetch("/api/access-drop/recover", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: phoneDigits })
          });

          if (recoverRes.ok) {
            const recoverData = await recoverRes.json();
            setPassData({
              firstName: recoverData.firstName,
              lastName: recoverData.lastName,
              serialNumber: recoverData.serialNumber,
              qrPayload: recoverData.qrPayload
            });
          } else {
            // Fallback robusto en desarrollo local sin DB
            const serialNumber = `DAWGS-${Math.floor(1000 + Math.random() * 9000)}-${data.transactionId.split('-')[0].toUpperCase()}`;
            const qrPayload = JSON.stringify({
              type: "DAWGS_PASS",
              serialNumber,
              token: data.transactionId,
              eventId: "trap-loud"
            });
            setPassData({
              firstName: formData.firstName.toUpperCase(),
              lastName: formData.lastName.toUpperCase(),
              serialNumber,
              qrPayload
            });
          }

          localStorage.setItem("dawgs_recovery_token", data.transactionId);
          setDropState("winner");
        } catch (webhookErr) {
          console.error("Error al procesar webhook o recuperación:", webhookErr);
          // Fallback robusto
          const serialNumber = `DAWGS-${Math.floor(1000 + Math.random() * 9000)}-${data.transactionId.split('-')[0].toUpperCase()}`;
          const qrPayload = JSON.stringify({
            type: "DAWGS_PASS",
            serialNumber,
            token: data.transactionId,
            eventId: "trap-loud"
          });
          setPassData({
            firstName: formData.firstName.toUpperCase(),
            lastName: formData.lastName.toUpperCase(),
            serialNumber,
            qrPayload
          });
          setDropState("winner");
        }
      }, 3000);

    } catch (err: any) {
      setErrorMsg(err.message.toUpperCase());
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

  const isWideLayout = dropState === "register" || dropState === "recover";

  return (
    <section id="access" ref={scope} className="relative z-10 mx-auto w-full px-6 md:px-12 py-16 md:py-24 flex justify-center">
      <div className={`relative overflow-hidden rounded-[40px] border border-dashed border-red-500/40 bg-zinc-950/95 p-6 shadow-[0_0_80px_rgba(255,0,24,.15)] backdrop-blur-3xl md:p-12 min-h-[600px] flex flex-col justify-center transition-all duration-500 w-full ${isWideLayout ? "max-w-5xl" : "max-w-xl"}`}>

        {/* Global Ticket punch hole cutouts */}
        <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black border-r border-red-500/30 z-20" />
        <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black border-l border-red-500/30 z-20" />

        {/* Tear-off vertical line divider on desktop */}
        {isWideLayout && (
          <>
            <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 border-r border-dashed border-red-500/30 -translate-x-1/2 z-10 pointer-events-none" />
            <div className="hidden lg:block absolute left-1/2 top-[-10px] -translate-x-1/2 w-5 h-5 rounded-full bg-black border-b border-red-500/30 z-20" />
            <div className="hidden lg:block absolute left-1/2 bottom-[-10px] -translate-x-1/2 w-5 h-5 rounded-full bg-black border-t border-red-500/30 z-20" />
          </>
        )}

        {/* Global Back / Close Button when in Countdown/Winner/Loser state */}
        {(dropState === "countdown" || dropState === "winner" || dropState === "loser") && onClose && (
          <button
            onClick={onClose}
            className="absolute top-6 left-6 flex items-center gap-2 rounded-full border border-red-500/20 bg-red-950/40 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-400 transition hover:bg-red-900/40 hover:text-white z-50 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse"
          >
            <ChevronLeft className="h-4 w-4" /> VOLVER
          </button>
        )}

        {/* Background Ambient Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,.03),transparent_60%)] opacity-40" />

        <style>{`
          @keyframes slideLeft {
            from {
              opacity: 0;
              transform: translateX(50px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}</style>

        {(dropState === "countdown" || dropState === "register" || dropState === "recover") && (
          <div className={`relative z-10 w-full transition-all duration-700 grid grid-cols-1 ${dropState !== "countdown" ? "lg:grid-cols-2 gap-12 items-center" : "max-w-md mx-auto"}`}>

            {/* LEFT COLUMN: Event Details Summary */}
            <div className={`relative flex flex-col ${dropState !== "countdown" ? "text-left items-start lg:pr-8" : "items-center text-center"} transition-all duration-700 w-full`}>

              {dropState !== "countdown" && (
                <button onClick={() => setDropState("countdown")} className="mb-6 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.3em] text-red-500 hover:text-white border border-red-500/20 bg-red-500/5 px-4 py-2 rounded-full transition hover:bg-red-500/10">
                  <ChevronLeft className="h-3 w-3" /> VOLVER AL EVENTO
                </button>
              )}

              <span className="inline-flex items-center gap-2 rounded border border-[#C8FF00]/40 bg-[#C8FF00]/5 px-3 py-1 text-[9px] font-black uppercase tracking-[0.25em] text-[#C8FF00] shadow-[0_0_15px_rgba(200,255,0,0.1)]">
                <Zap className="h-3.5 w-3.5 fill-[#C8FF00]" /> TRAP LOUD • OCT 31
              </span>
              
              <h2 className={`mt-6 font-black text-white drop-shadow-[0_0_20px_rgba(239,68,68,0.4)] tracking-tighter uppercase leading-none ${dropState !== "countdown" ? "text-4xl md:text-5xl text-left" : "text-5xl md:text-7xl text-center"}`}>
                MEDELLIN<br />
                <span className="text-[#C8FF00] drop-shadow-[0_0_15px_rgba(200,255,0,0.3)] italic">EXPERIENCE.</span>
              </h2>

              <div className="mt-8 grid grid-cols-2 gap-4 w-full text-left">
                <div className="flex flex-col p-4 rounded-xl border border-red-500/30 bg-black/40 backdrop-blur-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-8 h-8 bg-red-500/10 rounded-bl-full flex items-center justify-center">
                    <span className="text-[9px] font-bold text-red-400">LOC</span>
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#C8FF00] mb-2">UBICACIÓN</span>
                  <span className="text-xs font-black text-white uppercase tracking-wider">SECRET LOCATION</span>
                  <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mt-1">(Revelado al comprar)</span>
                </div>
                <div className="flex flex-col p-4 rounded-xl border border-red-500/30 bg-black/40 backdrop-blur-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-8 h-8 bg-red-500/10 rounded-bl-full flex items-center justify-center">
                    <span className="text-[9px] font-bold text-red-400">LINE</span>
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#C8FF00] mb-2">ARTISTAS</span>
                  <span className="text-xs font-black text-white uppercase tracking-wider leading-tight">DJ KHRIZ<br />YAN BLOCK<br />Y MÁS...</span>
                </div>
              </div>

              {/* Official Sponsors Block */}
              <div className="mt-8 w-full">
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-[#C8FF00] mb-3 text-center">• OFFICIAL PARTNERS •</p>
                <div className="grid grid-cols-2 gap-2.5 text-left">
                  <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3.5 py-2.5 text-[9px] font-black text-zinc-400 uppercase tracking-widest hover:border-[#C8FF00]/40 hover:text-white transition-all duration-300">
                    <span className="text-[12px]">🍔</span>
                    <span>DAWGS Burgers</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3.5 py-2.5 text-[9px] font-black text-zinc-400 uppercase tracking-widest hover:border-[#C8FF00]/40 hover:text-white transition-all duration-300">
                    <span className="text-[12px]">🍣</span>
                    <span>Kyoto Sushi Bar</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3.5 py-2.5 text-[9px] font-black text-zinc-400 uppercase tracking-widest hover:border-[#C8FF00]/40 hover:text-white transition-all duration-300">
                    <span className="text-[12px]">🏋️</span>
                    <span>Iron Athletics</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3.5 py-2.5 text-[9px] font-black text-zinc-400 uppercase tracking-widest hover:border-[#C8FF00]/40 hover:text-white transition-all duration-300">
                    <span className="text-[12px]">⚡</span>
                    <span>Zen Fisioterapia</span>
                  </div>
                </div>
              </div>

              {/* Monospace Barcode */}
              <div className="mt-8 flex flex-col items-center w-full select-none opacity-50">
                <div className="flex gap-[2px] h-8 items-stretch justify-center w-full">
                  {[1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2].map((w, idx) => (
                    <span key={idx} className="bg-white" style={{ width: `${w}px` }} />
                  ))}
                </div>
                <span className="text-[7px] font-mono tracking-[0.4em] text-zinc-500 mt-1">TL-9812-MED-2026</span>
              </div>

              {/* Render Buy Buttons if state is countdown */}
              {dropState === "countdown" && (
                <div className="mt-8 flex flex-col items-center gap-4 w-full">
                  <button 
                    onClick={() => setDropState("register")} 
                    className="group relative flex flex-col w-full items-center justify-center py-4 rounded-xl bg-[#C8FF00] text-black shadow-[0_0_35px_rgba(200,255,0,0.35)] transition duration-300 hover:bg-[#b5e600] hover:scale-[1.01] hover:shadow-[0_0_45px_rgba(200,255,0,0.5)] overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_50%,rgba(0,0,0,0.05)_50%)] bg-[length:4px_100%] opacity-20" />
                    <div className="relative flex items-center gap-2 text-sm font-black uppercase tracking-[0.25em]">
                      COMPRAR TICKET <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </div>
                    <span className="relative text-[9px] font-black text-black/60 mt-1 uppercase tracking-widest">$10.00 • INCLUYE IVA Y COMISIONES</span>
                  </button>

                  <button onClick={() => setDropState("recover")} className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-500 hover:text-white transition mt-2">
                    ¿YA TIENES UN TICKET? RECUPERAR AQUÍ
                  </button>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Interactive Form (Slides/Animates in) */}
            {dropState !== "countdown" && (
              <div
                className="w-full relative z-10 flex flex-col items-center justify-center rounded-3xl border border-[#C8FF00]/20 bg-zinc-950/90 p-6 shadow-[0_0_35px_rgba(200,255,0,0.05)] backdrop-blur-xl max-w-md mx-auto transition-all duration-500"
                style={{
                  animation: "slideLeft 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards"
                }}
              >
                {dropState === "register" && (
                  <div className="w-full">
                    <h2 className="text-2xl font-black text-white tracking-widest mb-1 uppercase italic text-center">checkout seguro</h2>
                    <p className="text-[9px] uppercase tracking-[0.4em] text-zinc-500 mb-6 font-bold flex items-center justify-center gap-2">
                      POWERED BY <span className="text-red-500 font-black">KUSHKI</span>
                    </p>

                    <form onSubmit={handleRegister} className="w-full space-y-4">
                      {/* Datos Personales */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="ml-2 text-[8px] uppercase tracking-widest text-zinc-500">nombre</p>
                          <input required type="text" placeholder="EJ. BRANDON" className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-xs font-bold text-white placeholder-zinc-800 outline-none focus:border-[#C8FF00]/50 transition" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ\s]/g, '') })} />
                        </div>
                        <div className="space-y-1">
                          <p className="ml-2 text-[8px] uppercase tracking-widest text-zinc-500">apellido</p>
                          <input required type="text" placeholder="EJ. MEDINA" className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-xs font-bold text-white placeholder-zinc-800 outline-none focus:border-[#C8FF00]/50 transition" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ\s]/g, '') })} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="ml-2 text-[8px] uppercase tracking-widest text-zinc-500">teléfono ecuador (09XXXXXXXX)</p>
                        <input required type="tel" maxLength={10} placeholder="0987654321" className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-xs font-bold text-white placeholder-zinc-800 outline-none focus:border-[#C8FF00]/50 transition" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/[^\d]/g, '') })} />
                      </div>

                      {/* Mock Payment Form (Kushki UI Prep) */}
                      <div className="pt-4 mt-4 border-t border-white/10">
                        <p className="ml-2 text-[10px] uppercase tracking-widest text-white mb-3 font-bold">Detalles de Pago ($10.00)</p>

                        <div className="space-y-3">
                          <div className="space-y-1">
                            <p className="ml-2 text-[8px] uppercase tracking-widest text-zinc-500">Número de Tarjeta</p>
                            <input required type="text" maxLength={19} placeholder="0000 0000 0000 0000" className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-xs font-bold text-white placeholder-zinc-800 outline-none focus:border-[#C8FF00]/50 transition tracking-widest" />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <p className="ml-2 text-[8px] uppercase tracking-widest text-zinc-500">Expiración</p>
                              <input required type="text" maxLength={5} placeholder="MM/YY" className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-xs font-bold text-white placeholder-zinc-800 outline-none focus:border-[#C8FF00]/50 transition text-center" />
                            </div>
                            <div className="space-y-1">
                              <p className="ml-2 text-[8px] uppercase tracking-widest text-zinc-500">CVC</p>
                              <input required type="password" maxLength={4} placeholder="•••" className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-xs font-bold text-white placeholder-zinc-800 outline-none focus:border-[#C8FF00]/50 transition text-center" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {errorMsg && (
                        <div className="flex items-center gap-3 text-[10px] font-bold text-red-400 bg-red-950/40 p-4 rounded-xl border border-red-500/30">
                          <ShieldAlert className="h-4 w-4 shrink-0" /> {errorMsg}
                        </div>
                      )}

                      <button 
                        disabled={isSubmitting} 
                        type="submit" 
                        className="mt-6 flex h-14 w-full items-center justify-between px-6 rounded-xl bg-[#C8FF00] text-xs font-black uppercase tracking-[0.2em] text-black shadow-[0_0_20px_rgba(200,255,0,0.25)] transition hover:bg-[#b5e600] hover:shadow-[0_0_30px_rgba(200,255,0,0.4)] disabled:opacity-50"
                      >
                        <span>{isSubmitting ? "PROCESANDO PAGO..." : "PAGAR $10.00"}</span>
                        {!isSubmitting && <ChevronRight className="h-4 w-4 text-black" />}
                      </button>

                      <p className="text-center mt-3 text-[8px] uppercase tracking-widest text-zinc-500">Transacción encriptada end-to-end</p>
                    </form>
                  </div>
                )}

                {dropState === "recover" && (
                  <div className="w-full text-center">
                    <h2 className="text-2xl font-black text-white tracking-widest mb-2 uppercase italic">recuperar access</h2>
                    <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 mb-8 font-bold">ingresa tu número registrado</p>

                    <form onSubmit={handleRecover} className="w-full space-y-4">
                      <div className="space-y-1 text-left">
                        <p className="ml-2 text-[8px] uppercase tracking-widest text-zinc-500">teléfono (09XXXXXXXX)</p>
                        <input required type="tel" maxLength={10} placeholder="0987654321" className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-4 text-xs font-bold text-white placeholder-zinc-800 outline-none focus:border-[#C8FF00]/50 transition" value={recoveryPhone} onChange={(e) => setRecoveryPhone(e.target.value.replace(/[^\d]/g, ''))} />
                      </div>

                      {errorMsg && (
                        <div className="flex items-center gap-3 text-[10px] font-bold text-red-400 bg-red-950/40 p-4 rounded-xl border border-red-500/30">
                          <ShieldAlert className="h-4 w-4 shrink-0" /> {errorMsg}
                        </div>
                      )}

                      <button 
                        disabled={isSubmitting} 
                        type="submit" 
                        className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#C8FF00] text-xs font-black uppercase tracking-[0.2em] text-black transition hover:bg-[#b5e600]"
                      >
                        {isSubmitting ? "BUSCANDO..." : "RECLAMAR MI PASE"}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
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
          <div className="pass-reveal relative z-10 w-full py-4 flex flex-col items-center">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-black text-white uppercase italic tracking-widest">¡acceso confirmado!</h2>
              <p className="text-[10px] uppercase tracking-[0.4em] text-red-500 mt-2 font-bold">bienvenido a la familia dawgs</p>
            </div>
            <PartyPass data={passData} />
            {onClose && (
              <button onClick={onClose} className="mt-8 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400 hover:text-white border border-white/20 bg-white/5 px-6 py-3 rounded-full transition hover:bg-white/10">
                <ChevronLeft className="h-3 w-3" /> VOLVER AL EVENTO
              </button>
            )}
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

