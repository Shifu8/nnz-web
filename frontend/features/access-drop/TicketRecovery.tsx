"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";

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
  "Si existe una entrada aprobada para este correo, enviaremos un codigo de recuperacion.";

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
      setError("Espera un momento y vuelve a intentar la verificacion.");
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
      setError("Escribe el codigo completo de 6 digitos.");
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
        throw new Error(data.error || "El codigo es incorrecto o expiro.");
      }

      setToken(data.token);
      setTicket(data.ticket);
      setPhase("done");
      setMessage("");
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "El codigo es incorrecto o expiro.");
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
        className={`relative grid gap-5 overflow-hidden rounded-[32px] border border-pink-300/15 bg-black/45 p-5 shadow-[0_24px_90px_rgba(255,0,102,0.12)] backdrop-blur-2xl md:grid-cols-[0.82fr_1.18fr] md:p-8 lg:p-10 ${
          pulse ? "recovery-card-pulse" : ""
        }`}
      >
        <div className="pointer-events-none absolute -right-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-pink-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-52 w-52 rounded-full bg-[#C8FF00]/5 blur-3xl" />

        <div className="relative flex flex-col justify-center">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-pink-300/20 bg-pink-500/[0.08] px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.28em] text-pink-200">
            Recuperar entrada
          </p>
          <h2 className="mt-4 text-3xl font-black uppercase leading-[0.9] tracking-[-0.04em] text-white sm:text-4xl">
            Tu entrada.
            <br />
            Sin vueltas.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-zinc-400">
            Validamos tu correo con un codigo privado y mostramos unicamente la entrada aprobada del evento actual.
          </p>
          <div className="mt-5 grid max-w-md grid-cols-3 gap-2">
            {[
              ["01", "Correo"],
              ["02", "Codigo"],
              ["03", "Entrada"],
            ].map(([number, label], index) => {
              const activeIndex = phase === "email" ? 0 : phase === "code" ? 1 : 2;
              return (
                <div
                  key={number}
                  className={`rounded-2xl border px-3 py-3 ${
                    index <= activeIndex
                      ? "border-pink-300/25 bg-pink-500/10"
                      : "border-white/[0.06] bg-white/[0.02]"
                  }`}
                >
                  <p className="text-[8px] font-black text-pink-200">{number}</p>
                  <p className="mt-1 text-[7px] font-black uppercase tracking-[0.16em] text-zinc-500">{label}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative rounded-[26px] border border-pink-300/15 bg-black/55 p-4 sm:p-5">
          {phase === "email" && (
            <form onSubmit={requestCode} className="space-y-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.26em] text-zinc-500">correo de compra</p>
                <div className="mt-2 flex items-center rounded-2xl border border-white/10 bg-black/45 px-4 transition focus-within:border-pink-300/45">
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
                    className="h-12 w-full bg-transparent px-4 text-sm font-bold text-white outline-none placeholder:text-zinc-700"
                  />
                </div>
                <datalist id="recovery-email-domains">
                  {emailDomains.map((domain) => {
                    const local = email.split("@")[0] || "tu";
                    return <option key={domain} value={`${local}@${domain}`} />;
                  })}
                </datalist>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <p
                    className={`text-[8px] font-bold uppercase tracking-wider ${
                      emailHint.tone === "ok"
                        ? "text-[#C8FF00]"
                        : emailHint.tone === "warn"
                          ? "text-pink-300"
                          : "text-zinc-600"
                    }`}
                  >
                    {emailHint.text}
                  </p>
                  {emailSuggestion && (
                    <button
                      type="button"
                      onClick={() => setEmail(applyEmailSuggestion(email))}
                      className="rounded-full border border-pink-300/20 bg-pink-500/10 px-2 py-1 text-[7px] font-black uppercase tracking-wider text-pink-100"
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
                className={`inline-flex h-12 w-full items-center justify-between rounded-2xl bg-white px-5 text-[9px] font-black uppercase tracking-[0.2em] text-black transition hover:bg-pink-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                  pulse ? "recovery-button-pulse" : ""
                }`}
              >
                {loading ? "Procesando..." : "Enviar codigo"}
              </button>
            </form>
          )}

          {phase === "code" && (
            <form onSubmit={verifyCode} className="space-y-4">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-600">verificando</p>
                <p className="mt-1 truncate text-xs font-bold text-zinc-300">{email}</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.26em] text-zinc-500">codigo de 6 digitos</p>
                <input
                  required
                  autoFocus
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="mt-2 h-14 w-full rounded-2xl border border-white/10 bg-black/45 px-5 text-center text-2xl font-black tracking-[0.34em] text-white outline-none transition placeholder:text-zinc-800 focus:border-pink-300/45"
                />
              </div>
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className={`inline-flex h-12 w-full items-center justify-between rounded-2xl bg-white px-5 text-[9px] font-black uppercase tracking-[0.2em] text-black transition hover:bg-pink-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                  pulse ? "recovery-button-pulse" : ""
                }`}
              >
                {loading ? "Validando..." : "Verificar codigo"}
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={resetRecovery}
                  className="h-10 rounded-2xl border border-white/10 bg-white/[0.04] text-[8px] font-black uppercase tracking-[0.15em] text-zinc-400 transition hover:border-pink-300/25 hover:text-white"
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
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] text-[8px] font-black uppercase tracking-[0.15em] text-zinc-400 transition hover:border-pink-300/25 hover:text-white"
                >
                  Nuevo codigo
                </button>
              </div>
            </form>
          )}

          {phase === "done" && ticket && (
            <div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.25em] text-[#C8FF00]">Entrada recuperada</p>
                  <h3 className="mt-1 text-2xl font-black uppercase leading-none text-white">{ticket.eventName}</h3>
                  <p className="mt-1 text-[8px] font-black uppercase tracking-[0.2em] text-pink-300">{ticket.seriesName}</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-[#C8FF00]/25 bg-[#C8FF00]/10 px-3 py-1.5 text-[7px] font-black uppercase tracking-[0.16em] text-[#C8FF00]">
                  Aprobada
                </span>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_156px]">
                <div className="space-y-2">
                  {[
                    ["Titular", ticket.holderName],
                    ["Artistas", ticket.artist],
                    ["Fecha", ticket.date],
                    ["Lugar", ticket.venue],
                  ].map(([label, value]) => {
                    return (
                      <div key={String(label)} className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5">
                        <div className="min-w-0">
                          <p className="text-[7px] font-black uppercase tracking-[0.18em] text-zinc-600">{String(label)}</p>
                          <p className="mt-0.5 truncate text-[10px] font-black uppercase text-zinc-200">{String(value)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-[22px] border border-pink-300/20 bg-[#050505] p-3 text-center">
                  <Image
                    src={ticket.qrUrl}
                    alt={`QR oficial ${ticket.ticketCode}`}
                    width={512}
                    height={512}
                    unoptimized
                    referrerPolicy="no-referrer"
                    className="mx-auto h-auto w-full rounded-xl border border-white/10 object-contain"
                  />
                  <p className="mt-2 text-[7px] font-black uppercase tracking-[0.16em] text-zinc-600">Codigo oficial</p>
                  <p className="mt-1 break-all font-mono text-[8px] font-bold text-white">{ticket.ticketCode}</p>
                </div>
              </div>

              <p className="mt-4 rounded-2xl border border-amber-300/15 bg-amber-300/[0.06] px-4 py-3 text-[9px] font-bold leading-5 text-amber-100/80">
                Entrada valida para un solo uso. No compartas capturas ni el codigo QR.
              </p>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <a
                  href={`/api/tickets/recovery/download?token=${encodeURIComponent(token)}`}
                  className={`inline-flex h-12 items-center justify-between rounded-2xl bg-white px-5 text-[9px] font-black uppercase tracking-[0.17em] text-black transition hover:bg-pink-200 ${
                    pulse ? "recovery-button-pulse" : ""
                  }`}
                >
                  Descargar entrada
                </a>
                <button
                  type="button"
                  disabled={resending}
                  onClick={resendTicket}
                  className="inline-flex h-12 items-center justify-between rounded-2xl border border-pink-300/20 bg-pink-500/10 px-5 text-[9px] font-black uppercase tracking-[0.17em] text-pink-100 transition hover:bg-pink-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {resending ? "Reenviando..." : "Reenviar al correo"}
                </button>
              </div>
            </div>
          )}

          {(message || error) && (
            <p
              role={error ? "alert" : "status"}
              className={`mt-4 rounded-2xl border px-4 py-3 text-[10px] font-bold leading-5 ${
                error
                  ? "border-red-400/20 bg-red-500/10 text-red-200"
                  : "border-pink-300/15 bg-pink-500/10 text-pink-100"
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
