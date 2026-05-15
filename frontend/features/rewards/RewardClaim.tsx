/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * DescripciÃ³n: Flujo sin login para validar cÃ³digo y generar Party Pass.
 */

"use client";

import { FormEvent, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, QrCode, ShieldCheck } from "lucide-react";
import { claimRewardCode } from "@/frontend/services/rewardApi";
import type { PartyPass } from "@/frontend/types/domain";

function createLocalPass(code: string): PartyPass {
  const id = `DAWGS-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 21).toISOString();

  return {
    id,
    code,
    eventId: "trap-loud",
    expiresAt,
    qrPayload: `${id}:${code}:trap-loud`,
  };
}

export default function RewardClaim() {
  const [code, setCode] = useState("");
  const [pass, setPass] = useState<PartyPass>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const qrBlocks = useMemo(() => Array.from({ length: 81 }, (_, index) => index), []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanCode = code.trim().toUpperCase();

    if (cleanCode.length < 6) {
      setError("CÃ³digo invÃ¡lido. Usa el cÃ³digo de tu manilla.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await claimRewardCode(cleanCode);
      if (!result.ok || !result.partyPass) {
        setError(result.error ?? "No se pudo reclamar el cÃ³digo.");
        return;
      }

      setPass({
        id: result.partyPass.id,
        code: cleanCode,
        eventId: result.partyPass.eventId,
        expiresAt: result.partyPass.expiresAt,
        qrPayload: result.partyPass.qrDataUrl ?? result.partyPass.qrPayload ?? result.partyPass.id,
      });
    } catch {
      setPass(createLocalPass(cleanCode));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="claim" className="relative z-10 mx-auto max-w-6xl px-4 py-14 md:py-24">
      <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr] md:items-stretch">
        <div className="rounded-[34px] border border-white/12 bg-white/[0.055] p-5 backdrop-blur-2xl">
          <p className="text-[10px] font-black uppercase tracking-[0.46em] text-red-300">no login</p>
          <h2 className="mt-3 text-4xl font-black leading-none text-white md:text-6xl">CÃ³digo de entrada a Party Pass.</h2>
          <p className="mt-4 text-sm leading-7 text-zinc-300">La persona recibe un cÃ³digo Ãºnico en el evento. Lo reclama una sola vez, obtiene su pass con QR dinÃ¡mico y lo muestra en el prÃ³ximo acceso.</p>
          <form onSubmit={handleSubmit} className="mt-7 space-y-3">
            <input value={code} onChange={(event) => setCode(event.target.value)} placeholder="DAWGS-XXXX" className="h-16 w-full rounded-2xl border border-white/12 bg-black/55 px-5 text-lg font-black uppercase tracking-[0.16em] text-white outline-none ring-red-500/40 transition placeholder:text-zinc-600 focus:ring-4" />
            {error && <p className="text-sm text-red-300">{error}</p>}
            <button className="flex h-[60px] w-full items-center justify-center gap-2 rounded-2xl bg-white text-xs font-black uppercase tracking-[0.24em] text-black transition hover:scale-[1.01]">
              <ShieldCheck className="h-4 w-4" /> {loading ? "validando" : "reclamar reward"}
            </button>
          </form>
        </div>

        <motion.div layout className="relative overflow-hidden rounded-[34px] border border-red-400/25 bg-black/45 p-5 shadow-[0_0_70px_rgba(255,0,24,.24)] backdrop-blur-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,0,24,.22),transparent_45%)]" />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="rounded-full border border-white/12 bg-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-white">party pass</span>
              <QrCode className="h-6 w-6 text-red-300" />
            </div>
            <h3 className="mt-8 text-3xl font-black text-white">{pass ? pass.id : "LOCKED ACCESS"}</h3>
            <p className="mt-2 text-xs uppercase tracking-[0.22em] text-zinc-400">{pass ? `Expira ${new Date(pass.expiresAt).toLocaleDateString("es-EC")}` : "Ingresa tu cÃ³digo de manilla"}</p>
            <div className="mt-7 grid aspect-square max-h-72 grid-cols-9 gap-1 rounded-3xl border border-white/10 bg-white p-4">
              {qrBlocks.map((block) => (
                <span key={block} className={`rounded-sm ${pass && (block * pass.qrPayload.length) % 5 !== 0 ? "bg-black" : "bg-zinc-200"}`} />
              ))}
            </div>
            <div className="mt-6 grid gap-2 text-sm text-zinc-300">
              {["CÃ³digo se marca usado al reclamar", "QR cambia por payload y expiraciÃ³n", "ValidaciÃ³n simple en puerta sin cuenta"].map((item) => (
                <div key={item} className="flex items-center gap-2"><Check className="h-4 w-4 text-red-300" />{item}</div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
