"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { Mail, KeyRound, Check, ArrowRight, ChevronLeft } from "lucide-react";

import TurnstileWidget, { hasTurnstileSiteKey } from "@/frontend/components/TurnstileWidget";
import {
  applyEmailSuggestion,
  cleanEmailInput,
  emailDomains,
  getEmailHint,
  getEmailSuggestion,
} from "@/frontend/utils/emailInput";

type RecoveryPhase = "email" | "code" | "done";

type RecoveredTicket = {
  eventName: string;
  seriesName: string;
  artist: string;
  date: string;
  venue: string;
  ticketCode: string;
  qrUrl: string;
  status: "APPROVED";
  holderName: string;
  quantity: number;
};

type TicketRecoveryProps = {
  embedded?: boolean;
  className?: string;
  pulse?: boolean;
};

const genericMessage =
  "Código enviado. Si tu compra con este correo ya fue aprobada, recibirás el PIN de 6 dígitos en tu bandeja de entrada.";

export default function TicketRecovery({ embedded = false, className = "", pulse = false }: TicketRecoveryProps) {
  const [phase, setPhase] = useState<RecoveryPhase>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [token, setToken] = useState("");
  const [ticket, setTicket] = useState<RecoveredTicket | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const emailHint = getEmailHint(email);
  const emailSuggestion = getEmailSuggestion(email);

  const resetTurnstile = () => {
    setTurnstileToken("");
    setTurnstileResetKey((key) => key + 1);
  };

  const requestCode = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (hasTurnstileSiteKey("invisible") && !turnstileToken) {
      setError("Espera un momento y vuelve a intentar la verificación.");
      resetTurnstile();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/tickets/recovery/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, turnstileToken }),
      });
      const data = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) throw new Error(data.error || "No pudimos procesar la solicitud.");

      setPhase("code");
      setCode("");
      setMessage(data.message || genericMessage);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No pudimos procesar la solicitud.");
    } finally {
      setLoading(false);
      resetTurnstile();
    }
  };

  const verifyCode = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!/^\d{6}$/.test(code)) {
      setError("Escribe el código completo de 6 dígitos.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/tickets/recovery/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = (await response.json()) as {
        error?: string;
        token?: string;
        ticket?: RecoveredTicket;
      };

      if (!response.ok || !data.token || !data.ticket) {
        throw new Error(data.error || "El código es incorrecto o expiró.");
      }

      setToken(data.token);
      setTicket(data.ticket);
      setPhase("done");
      setMessage("");
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "El código es incorrecto o expiró.");
    } finally {
      setLoading(false);
    }
  };

  const resendTicket = async () => {
    if (!token || resending) return;
    setError("");
    setMessage("");
    setResending(true);

    try {
      const response = await fetch("/api/tickets/recovery/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) throw new Error(data.error || "No pudimos reenviar la entrada.");

      setShowSuccessOverlay(true);

      setTimeout(() => {
        setShowSuccessOverlay(false);
        resetRecovery();
      }, 4000);
    } catch (resendError) {
      setError(resendError instanceof Error ? resendError.message : "No pudimos reenviar la entrada.");
    } finally {
      setResending(false);
    }
  };

  const resetRecovery = () => {
    setPhase("email");
    setCode("");
    setToken("");
    setTicket(null);
    setMessage("");
    setError("");
    resetTurnstile();
  };

  return (
    <section
      id="recovery"
      className={
        embedded
          ? `relative z-20 w-full ${className}`
          : `relative z-20 mx-auto w-full max-w-[1600px] px-4 py-16 sm:px-6 md:px-12 lg:px-16 ${className}`
      }
    >
      <div
        className={`relative overflow-hidden rounded-[32px] border border-white/10 bg-black/45 p-5 backdrop-blur-2xl sm:p-7 lg:p-9 shadow-2xl ${embedded
          ? "flex flex-col gap-6"
          : "grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center"
          } ${pulse ? "recovery-card-pulse" : ""}`}
        style={{ boxShadow: "0 24px 90px rgba(255, 255, 255, 0.01)" }}
      >
        {/* Soft static monochrome lighting vignette details */}
        <div className="pointer-events-none absolute -right-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-white/[0.01] blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-52 w-52 rounded-full bg-white/[0.005] blur-3xl" />

        {/* Left Column: Perfectly symmetrical layout headers */}
        <div className="relative flex flex-col justify-center">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.3em] text-white">
            Recuperar entrada
          </p>
          <h2 className="mt-4 text-3xl font-black uppercase leading-[0.9] tracking-[-0.05em] text-white sm:text-4xl">
            Tu entrada.
            <br />
            Sin vueltas.
          </h2>
          <p className="mt-5 inline-flex items-center text-xl font-black uppercase tracking-[-0.03em] text-white">
            Recuperación OTP
          </p>
          <p className="mt-5 max-w-lg text-sm leading-7 text-zinc-400">
            Validamos tu correo con un código privado y mostramos únicamente la entrada aprobada del evento actual.
          </p>
        </div>

        {/* Right Column: Steps Tracker + Active Form Container */}
        <div className="relative z-10 w-full flex flex-col gap-6">

          {/* Recovery Process Cards Tracker */}
          <div className="grid gap-3 sm:grid-cols-3 w-full">
            {[
              ["01", "Correo", "Escribe tu email."],
              ["02", "Código", "Copia el PIN."],
              ["03", "Entrada", "Baja tu pase."],
            ].map(([number, title, copy], index) => {
              const activeIndex = phase === "email" ? 0 : phase === "code" ? 1 : 2;
              const isActive = index === activeIndex;
              return (
                <article
                  key={number}
                  className={`rounded-[24px] border p-5 shadow-[0_16px_46px_rgba(0,0,0,0.4)] transition duration-300 ${isActive
                    ? "border-white/20 bg-white/5"
                    : "border-white/[0.06] bg-white/[0.01]"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[8px] font-black tracking-[0.24em] transition ${isActive ? "text-white" : "text-zinc-600"}`}>
                      {number}
                    </span>
                  </div>
                  <h3 className="mt-8 text-lg font-black uppercase text-white">{title}</h3>
                  <p className="mt-2 text-[10px] leading-5 text-zinc-500">{copy}</p>
                </article>
              );
            })}
          </div>

          {/* Symmetrical Form / Result Card */}
          <div className="relative rounded-[24px] border border-white/10 bg-black/60 p-6 sm:p-8 backdrop-blur-2xl shadow-xl flex flex-col justify-between overflow-hidden">
            {showSuccessOverlay && (
              <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6 text-center animate-smooth-fade">
                <div className="flex flex-col items-center justify-center animate-smooth-scale">
                  <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                    <Check className="h-8 w-8 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-wider text-white">¡Envío Exitoso!</h3>
                  <p className="mt-2 text-xs text-zinc-400 max-w-xs leading-5">
                    La entrada fue reenviada con éxito al correo asociado.
                  </p>
                  <p className="mt-2 text-[9px] text-zinc-600 font-bold uppercase tracking-wider">
                    Redireccionando...
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSuccessOverlay(false);
                      resetRecovery();
                    }}
                    className="mt-6 inline-flex h-10 px-6 items-center justify-center rounded-2xl bg-white text-[9px] font-black uppercase tracking-[0.2em] text-black transition hover:bg-zinc-200"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            )}

            {phase === "email" && (
              <form onSubmit={requestCode} className="space-y-6">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-[0.26em] text-zinc-400">correo de compra</label>
                  <div className="mt-2 flex items-center rounded-2xl border border-white/10 bg-black/40 px-4 py-1 transition-all duration-300 focus-within:border-white/30 focus-within:bg-black/70">
                    <Mail className="h-4 w-4 text-zinc-500 shrink-0" />
                    <input
                      required
                      type="email"
                      maxLength={120}
                      inputMode="email"
                      autoComplete="email"
                      autoCapitalize="none"
                      spellCheck={false}
                      list="recovery-email-domains"
                      value={email}
                      onChange={(event) => setEmail(cleanEmailInput(event.target.value))}
                      placeholder="tu@gmail.com"
                      className="h-12 w-full bg-transparent px-3 text-sm font-bold text-white outline-none placeholder:text-zinc-700"
                    />
                  </div>
                  <datalist id="recovery-email-domains">
                    {emailDomains.map((domain) => {
                      const local = email.split("@")[0] || "tu";
                      return <option key={domain} value={`${local}@${domain}`} />;
                    })}
                  </datalist>

                  {/* Suggestions and Hints */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 min-h-[24px]">
                    <p
                      className={`text-[8px] font-bold uppercase tracking-wider ${emailHint.tone === "ok"
                        ? "text-white/80"
                        : emailHint.tone === "warn"
                          ? "text-zinc-400"
                          : "text-zinc-600"
                        }`}
                    >
                      {emailHint.text}
                    </p>
                    {emailSuggestion && (
                      <button
                        type="button"
                        onClick={() => setEmail(applyEmailSuggestion(email))}
                        className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[7px] font-black uppercase tracking-wider text-white transition hover:bg-white/10 active:scale-95"
                      >
                        usar {emailSuggestion}
                      </button>
                    )}
                  </div>
                </div>

                <TurnstileWidget
                  action="ticket_recovery"
                  variant="invisible"
                  resetKey={turnstileResetKey}
                  onVerify={setTurnstileToken}
                  onExpire={() => setTurnstileToken("")}
                  onError={() => setTurnstileToken("")}
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex h-12 w-full items-center justify-between rounded-2xl bg-white px-6 text-[9px] font-black uppercase tracking-[0.2em] text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span>{loading ? "Procesando..." : "Enviar código"}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <p className="text-[7.5px] text-zinc-500 text-center font-bold uppercase tracking-[0.08em] mt-3">
                  * Límite de seguridad: máximo 2 recuperaciones de entrada por evento.
                </p>
              </form>
            )}

            {phase === "code" && (
              <form onSubmit={verifyCode} className="space-y-6">
                <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                  <button
                    type="button"
                    onClick={resetRecovery}
                    className="text-[8px] font-black uppercase tracking-[0.18em] text-zinc-400 hover:text-white transition inline-flex items-center gap-1.5"
                  >
                    <ChevronLeft className="h-3 w-3" /> Cambiar correo
                  </button>
                </div>

                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500">verificando</p>
                  <p className="mt-1 truncate text-xs font-bold text-zinc-300">{email}</p>
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase tracking-[0.26em] text-zinc-400">código de 6 dígitos</label>
                  <div className="mt-2 flex items-center rounded-2xl border border-white/10 bg-black/40 px-4 py-1 transition-all duration-300 focus-within:border-white/30 focus-within:bg-black/70">
                    <KeyRound className="h-4 w-4 text-zinc-500 shrink-0" />
                    <input
                      required
                      autoFocus
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={code}
                      onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                      placeholder="000000"
                      className="h-12 w-full bg-transparent px-3 text-center text-xl font-black tracking-[0.2em] text-white outline-none placeholder:text-zinc-800"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="inline-flex h-12 w-full items-center justify-between rounded-2xl bg-white px-6 text-[9px] font-black uppercase tracking-[0.2em] text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span>{loading ? "Validando..." : "Verificar código"}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={resetRecovery}
                    className="h-10 rounded-2xl border border-white/10 bg-white/[0.03] text-[8px] font-black uppercase tracking-[0.15em] text-zinc-400 transition hover:border-white/20 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPhase("email");
                      setCode("");
                      setMessage("");
                      setError("");
                    }}
                    className="h-10 rounded-2xl border border-white/10 bg-white/[0.03] text-[8px] font-black uppercase tracking-[0.15em] text-zinc-400 transition hover:border-white/20 hover:text-white"
                  >
                    Reenviar PIN
                  </button>
                </div>
              </form>
            )}

            {phase === "done" && ticket && (
              <div className="space-y-4 w-full animate-smooth-scale">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <button
                    type="button"
                    onClick={resetRecovery}
                    className="text-[8px] font-black uppercase tracking-[0.18em] text-zinc-400 hover:text-white transition inline-flex items-center gap-1.5"
                  >
                    <ChevronLeft className="h-3 w-3" /> Nueva consulta
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.25em] text-zinc-400">Entrada recuperada</p>
                    <h3 className="mt-1 text-xl font-black uppercase leading-none text-white">{ticket.eventName}</h3>
                    <p className="mt-1 text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500">{ticket.seriesName}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.16em] text-white">
                    <Check className="h-2.5 w-2.5 text-white" />
                    Aprobada
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_130px] border-b border-white/5 pb-4">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ["Titular", ticket.holderName],
                      ["Artistas", ticket.artist],
                      ["Fecha", ticket.date],
                      ["Lugar", ticket.venue],
                    ].map(([label, value]) => {
                      return (
                        <div key={String(label)} className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2 min-w-0">
                          <div className="min-w-0">
                            <p className="text-[7px] font-black uppercase tracking-[0.18em] text-zinc-500">{String(label)}</p>
                            <p className="mt-0.5 truncate text-[9px] font-black uppercase text-zinc-300">{String(value)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex flex-col justify-center text-left">
                    <p className="text-[7px] font-black uppercase tracking-[0.18em] text-zinc-500">Cantidad total</p>
                    <p className="mt-1 text-xl font-black text-white">{ticket.ticketCode.split(",").length} pase(s)</p>
                  </div>
                </div>

                {/* Individual passes list */}
                <div className="space-y-3 pt-2">
                  <p className="text-[8px] font-black uppercase tracking-[0.25em] text-zinc-500 text-left">Tus entradas individuales:</p>
                  {ticket.ticketCode.split(",").map((code, idx, arr) => {
                    const qrUrl = `/api/tickets/recovery/qr?token=${encodeURIComponent(token)}&serial=${encodeURIComponent(code)}`;
                    const downloadUrl = `/api/tickets/recovery/download?token=${encodeURIComponent(token)}&serial=${encodeURIComponent(code)}`;
                    
                    return (
                      <div key={code} className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-zinc-950/60 p-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-white p-0.5 shrink-0 flex items-center justify-center">
                            <img
                              src={qrUrl}
                              alt={`QR Pase ${idx + 1}`}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="min-w-0 text-left">
                            <span className="inline-flex rounded-full bg-white/10 px-2 py-0.5 text-[6px] font-black tracking-widest text-zinc-300">
                              PASE {idx + 1} DE {arr.length}
                            </span>
                            <p className="mt-1 font-mono text-[8px] font-bold text-white tracking-wider truncate">{code}</p>
                          </div>
                        </div>
                        
                        <a
                          href={downloadUrl}
                          download
                          className="shrink-0 inline-flex h-8 items-center justify-center rounded-xl bg-white px-4 text-[7px] font-black uppercase tracking-wider text-black transition hover:bg-zinc-200"
                        >
                          Descargar
                        </a>
                      </div>
                    );
                  })}
                </div>

                <p className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-[8px] font-bold leading-4 text-zinc-400">
                  Cada entrada es válida para un solo uso. No compartas capturas ni los códigos QR.
                </p>

                <div className="w-full">
                  <button
                    type="button"
                    disabled={resending}
                    onClick={resendTicket}
                    className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-white text-[8px] font-black uppercase tracking-[0.17em] text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {resending ? "Reenviando..." : "Reenviar todas al correo"}
                  </button>
                </div>
              </div>
            )}

            {(message || error) && (
              <p
                role={error ? "alert" : "status"}
                className={`mt-4 rounded-2xl border px-4 py-3 text-[10px] font-bold leading-5 transition-all ${error
                  ? "border-red-400/20 bg-red-500/10 text-red-300"
                  : "border-white/10 bg-white/5 text-zinc-200"
                  }`}
              >
                {error || message}
              </p>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
