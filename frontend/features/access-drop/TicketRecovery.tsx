"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle, Download, KeyRound, Mail, ShieldCheck } from "lucide-react";
import TurnstileWidget, { hasTurnstileSiteKey } from "@/frontend/components/TurnstileWidget";
import {
  applyEmailSuggestion,
  cleanEmailInput,
  emailDomains,
  getEmailHint,
  getEmailSuggestion,
} from "@/frontend/utils/emailInput";

type RecoveryPhase = "email" | "code" | "done";

type TicketRecoveryProps = {
  embedded?: boolean;
  className?: string;
  pulse?: boolean;
};

export default function TicketRecovery({ embedded = false, className = "", pulse = false }: TicketRecoveryProps) {
  const [phase, setPhase] = useState<RecoveryPhase>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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
      const res = await fetch("/api/access-drop/recovery/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, turnstileToken }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) throw new Error(data.error || "No pudimos enviar el codigo.");
      setPhase("code");
      setMessage("Te enviamos un codigo. Expira en 10 minutos.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos enviar el codigo.");
    } finally {
      setLoading(false);
      resetTurnstile();
    }
  };

  const verifyCode = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/access-drop/recovery/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = (await res.json()) as { error?: string; downloadUrl?: string };
      if (!res.ok || !data.downloadUrl) throw new Error(data.error || "Codigo incorrecto.");
      setDownloadUrl(data.downloadUrl);
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Codigo incorrecto.");
    } finally {
      setLoading(false);
    }
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
        className={`relative grid gap-5 overflow-hidden rounded-[32px] border border-pink-300/15 bg-black/45 p-5 shadow-[0_24px_90px_rgba(255,0,102,0.12)] backdrop-blur-2xl md:grid-cols-[0.9fr_1.1fr] md:p-8 lg:p-10 ${
          pulse ? "recovery-card-pulse" : ""
        }`}
      >
        <div className="pointer-events-none absolute -right-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-pink-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-52 w-52 rounded-full bg-[#C8FF00]/5 blur-3xl" />
        <div className="flex flex-col justify-center">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-pink-300/20 bg-pink-500/[0.08] px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.28em] text-pink-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            Recuperar entrada
          </p>
          <h2 className="mt-4 text-3xl font-black uppercase leading-[0.9] tracking-[-0.04em] text-white sm:text-4xl">
            Inserta tu
            <br />
            correo.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-zinc-400">
            Te enviaremos un codigo si ese correo tiene una entrada aprobada para este evento.
            Si no existe en la compra, no llegara ningun correo.
          </p>
        </div>

        <div className="rounded-[26px] border border-pink-300/15 bg-black/45 p-4 sm:p-5">
          {phase === "email" && (
            <form onSubmit={requestCode} className="space-y-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.26em] text-zinc-500">correo</p>
                <div className="mt-2 flex items-center rounded-2xl border border-white/10 bg-black/45 px-4 transition focus-within:border-pink-300/45">
                  <Mail className="h-4 w-4 shrink-0 text-pink-300" />
                  <input
                    required
                    type="email"
                    maxLength={80}
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
                  <p className={`text-[8px] font-bold uppercase tracking-wider ${
                    emailHint.tone === "ok"
                      ? "text-[#C8FF00]"
                      : emailHint.tone === "warn"
                        ? "text-pink-300"
                        : "text-zinc-600"
                  }`}>
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
                {loading ? "Enviando..." : "Enviar codigo"}
                <KeyRound className="h-4 w-4" />
              </button>
            </form>
          )}

          {phase === "code" && (
            <form onSubmit={verifyCode} className="space-y-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.26em] text-zinc-500">codigo</p>
                <input
                  required
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="mt-2 h-14 w-full rounded-2xl border border-white/10 bg-black/45 px-5 text-center text-2xl font-black tracking-[0.34em] text-white outline-none transition placeholder:text-zinc-800 focus:border-pink-300/45"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`inline-flex h-12 w-full items-center justify-between rounded-2xl bg-white px-5 text-[9px] font-black uppercase tracking-[0.2em] text-black transition hover:bg-pink-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                  pulse ? "recovery-button-pulse" : ""
                }`}
              >
                {loading ? "Validando..." : "Validar codigo"}
                <ShieldCheck className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setPhase("email");
                  setCode("");
                  setMessage("");
                  setError("");
                }}
                className="h-10 w-full rounded-2xl border border-white/10 bg-white/[0.04] text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400 transition hover:border-pink-300/25 hover:text-white"
              >
                Cambiar correo
              </button>
            </form>
          )}

          {phase === "done" && (
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-pink-300/25 bg-pink-500/10 text-pink-200">
                <CheckCircle className="h-7 w-7" />
              </div>
              <h3 className="mt-5 text-2xl font-black uppercase text-white">Verificacion completada</h3>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-zinc-400">
                Tu entrada ha sido recuperada correctamente. Guarda este archivo PDF y presentalo el dia del evento.
              </p>
              <a
                href={downloadUrl}
                className={`mt-6 inline-flex h-12 w-full items-center justify-between rounded-2xl bg-white px-5 text-[9px] font-black uppercase tracking-[0.2em] text-black transition hover:bg-pink-200 ${
                  pulse ? "recovery-button-pulse" : ""
                }`}
              >
                Guardar entrada
                <Download className="h-4 w-4" />
              </a>
              <p className="mt-3 text-[8px] font-bold uppercase tracking-wider text-zinc-600">
                Link temporal activo por pocos minutos.
              </p>
            </div>
          )}

          {(message || error) && phase !== "done" && (
            <p className={`mt-4 rounded-2xl border px-4 py-3 text-[10px] font-bold leading-5 ${
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
