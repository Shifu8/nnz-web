"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle, Download, KeyRound, Mail, ShieldCheck } from "lucide-react";

type RecoveryPhase = "email" | "code" | "done";

export default function TicketRecovery() {
  const [phase, setPhase] = useState<RecoveryPhase>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const requestCode = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/access-drop/recovery/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) throw new Error(data.error || "No pudimos enviar el codigo.");
      setPhase("code");
      setMessage("Te enviamos un codigo. Expira en 10 minutos.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos enviar el codigo.");
    } finally {
      setLoading(false);
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
      id="recuperar-entrada"
      className="relative z-10 mx-auto w-full max-w-[1600px] px-4 pb-20 sm:px-6 md:px-12 lg:px-16 lg:pb-28"
    >
      <div className="grid gap-5 rounded-[32px] border border-white/[0.08] bg-white/[0.025] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.38)] backdrop-blur-2xl md:grid-cols-[0.9fr_1.1fr] md:p-8 lg:p-10">
        <div className="flex flex-col justify-center">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-pink-300/20 bg-pink-500/[0.08] px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.28em] text-pink-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            Recuperar entrada
          </p>
          <h2 className="mt-4 text-3xl font-black uppercase leading-[0.9] tracking-[-0.04em] text-white sm:text-4xl">
            Valida tu
            <br />
            correo.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-zinc-400">
            Si no viste tu entrada en Gmail, recuperala con un codigo temporal. Maximo 3 intentos.
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
                    value={email}
                    onChange={(event) => setEmail(event.target.value.trim().toLowerCase())}
                    placeholder="tu@gmail.com"
                    className="h-12 w-full bg-transparent px-4 text-sm font-bold text-white outline-none placeholder:text-zinc-700"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-12 w-full items-center justify-between rounded-2xl bg-white px-5 text-[9px] font-black uppercase tracking-[0.2em] text-black transition hover:bg-pink-200 disabled:cursor-not-allowed disabled:opacity-60"
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
                className="inline-flex h-12 w-full items-center justify-between rounded-2xl bg-white px-5 text-[9px] font-black uppercase tracking-[0.2em] text-black transition hover:bg-pink-200 disabled:cursor-not-allowed disabled:opacity-60"
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
                className="mt-6 inline-flex h-12 w-full items-center justify-between rounded-2xl bg-white px-5 text-[9px] font-black uppercase tracking-[0.2em] text-black transition hover:bg-pink-200"
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
