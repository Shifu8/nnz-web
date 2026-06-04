/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * Descripción: Modal oculto de inicio de sesión para STAFF.
 */

"use client";

import { useState, FormEvent, type CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";

export default function StaffModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, role: "staff" })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error de validación");
        return;
      }

      // La sesion real queda en una cookie HttpOnly; el front no guarda JWT.
      router.push("/staff/scanner");
    } catch (err) {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="relative w-full max-w-sm rounded-[34px] border border-red-500/30 bg-black/60 p-6 shadow-[0_0_80px_rgba(255,0,24,.15)] backdrop-blur-xl"
          >
            <button onClick={onClose} className="glass-pill absolute top-4 left-4">
              <ChevronLeft className="h-3 w-3" /> VOLVER
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 text-red-500">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-2xl font-black uppercase tracking-[0.15em] text-white">Staff Access</h2>
              <p className="mt-2 text-xs text-zinc-400">Zona de validacion. Cada QR aprobado queda usado al instante.</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="PASSWORD"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-center text-lg font-bold tracking-[0.2em] text-white outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50"
              />
              {error && <p className="text-center text-xs font-bold text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="glass-action-primary w-full"
                style={{ "--glass-action-height": "52px", "--glass-action-text": "0.65rem" } as CSSProperties}
              >
                {loading ? "Validating..." : "Enter"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
