"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { Mail, KeyRound, Check, ArrowRight } from "lucide-react";

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
  "Si existe una entrada aprobada para este correo, enviaremos un código de recuperación.";

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
      setMessage(data.message || "La entrada fue reenviada a tu correo.");
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
          : `relative z-10 mx-auto w-full max-w-[1600px] px-4 pb-20 sm:px-6 md:px-12 lg:px-16 lg:pb-28 ${className}`
      }
    >
      <div
        className={`relative grid gap-10 overflow-hidden rounded-[32px] border border-white/10 bg-black/45 p-6 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-2xl md:grid-cols-[0.9fr_1.1fr] md:items-center ${
          pulse ? "recovery-card-pulse" : ""
        }`}
        style={{ boxShadow: "0 24px 90px rgba(255, 255, 255, 0.01)" }}
      >
        {/* Soft static monochrome lighting vignette details */}
        <div className="pointer-events-none absolute -right-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-white/[0.01] blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-52 w-52 rounded-full bg-white/[0.005] blur-3xl" />

        {/* Left Column: Info, Badges, steps */}
        <div className="relative flex flex-col justify-center">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.3em] text-white">
            Recuperar entrada
          </p>
          <h2 className="mt-4 text-4xl font-black uppercase leading-[0.9] tracking-[-0.05em] text-white sm:text-5xl">
            Tu entrada.
            <br />
            Sin vueltas.
          </h2>
          <p className="mt-5 max-w-md text-sm leading-7 text-zinc-400">
            Validamos tu correo con un código privado y mostramos únicamente la entrada aprobada del evento actual.
          </p>
          
          {/* Step Cards identical in style to Acceso section */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              ["01", "Correo"],
              ["02", "Código"],
              ["03", "Entrada"],
            ].map(([number, label], index) => {
              const activeIndex = phase === "email" ? 0 : phase === "code" ? 1 : 2;
              const isPassed = index <= activeIndex;
              return (
                <div
                  key={number}
                  className={`rounded-[24px] border p-5 shadow-[0_16px_46px_rgba(0,0,0,0.4)] transition duration-300 hover:border-white/20 hover:bg-white/[0.02] ${
                    isPassed
                      ? "border-white/20 bg-white/5"
                      : "border-white/[0.06] bg-white/[0.01]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[8px] font-black tracking-[0.24em] transition ${isPassed ? "text-white" : "text-zinc-600"}`}>
                      {number}
                    </span>
                  </div>
                  <h3 className="mt-8 text-xs font-black uppercase text-white tracking-wide">
                    {label}
                  </h3>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Premium Form Component */}
        <div className="relative rounded-[32px] border border-white/10 bg-black/60 p-6 sm:p-8 backdrop-blur-2xl shadow-xl">
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
                    className={`text-[8px] font-bold uppercase tracking-wider ${
                      emailHint.tone === "ok"
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
            </form>
          )}

          {phase === "code" && (
            <form onSubmit={verifyCode} className="space-y-6">
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
                  Cambiar correo
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
                  Nuevo código
                </button>
              </div>
            </form>
          )}

          {phase === "done" && ticket && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.25em] text-zinc-400">Entrada recuperada</p>
                  <h3 className="mt-1 text-2xl font-black uppercase leading-none text-white">{ticket.eventName}</h3>
                  <p className="mt-1 text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500">{ticket.seriesName}</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.16em] text-white">
                  <Check className="h-3 w-3 text-white" />
                  Aprobada
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-[1fr_156px]">
                <div className="space-y-2">
                  {[
                    ["Titular", ticket.holderName],
                    ["Artistas", ticket.artist],
                    ["Fecha", ticket.date],
                    ["Lugar", ticket.venue],
                  ].map(([label, value]) => {
                    return (
                      <div key={String(label)} className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                        <div className="min-w-0">
                          <p className="text-[7px] font-black uppercase tracking-[0.18em] text-zinc-500">{String(label)}</p>
                          <p className="mt-0.5 truncate text-[10px] font-black uppercase text-zinc-300">{String(value)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-[22px] border border-white/10 bg-zinc-950 p-3 text-center flex flex-col justify-center items-center shadow-inner">
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-white p-1">
                    <Image
                      src={ticket.qrUrl}
                      alt={`QR oficial ${ticket.ticketCode}`}
                      fill
                      unoptimized
                      referrerPolicy="no-referrer"
                      className="object-contain"
                    />
                  </div>
                  <p className="mt-3 text-[7px] font-black uppercase tracking-[0.16em] text-zinc-500">Código oficial</p>
                  <p className="mt-1 break-all font-mono text-[8px] font-bold text-white tracking-widest">{ticket.ticketCode}</p>
                </div>
              </div>

              <p className="rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3 text-[9px] font-bold leading-5 text-zinc-400">
                Entrada válida para un solo uso. No compartas capturas ni el código QR.
              </p>

              <div className="grid gap-2 sm:grid-cols-2">
                <a
                  href={`/api/tickets/recovery/download?token=${encodeURIComponent(token)}`}
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-white text-[9px] font-black uppercase tracking-[0.17em] text-black transition hover:bg-zinc-200"
                >
                  Descargar entrada
                </a>
                <button
                  type="button"
                  disabled={resending}
                  onClick={resendTicket}
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[9px] font-black uppercase tracking-[0.17em] text-zinc-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {resending ? "Reenviando..." : "Reenviar al correo"}
                </button>
              </div>
            </div>
          )}

          {(message || error) && (
            <p
              role={error ? "alert" : "status"}
              className={`mt-4 rounded-2xl border px-4 py-3 text-[10px] font-bold leading-5 transition-all ${
                error
                  ? "border-red-400/20 bg-red-500/10 text-red-300"
                  : "border-white/10 bg-white/5 text-zinc-200"
              }`}
            >
              {error || message}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
