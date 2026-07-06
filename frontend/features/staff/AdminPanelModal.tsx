"use client";

import { useState, FormEvent, type CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";

import TurnstileWidget, { hasTurnstileSiteKey } from "@/frontend/components/TurnstileWidget";

type DeliveryChannel = "email";

export default function AdminPanelModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);

  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [quantity, setQuantity] = useState(1);
  const [deliveryChannel, setDeliveryChannel] = useState<DeliveryChannel>("email");
  const [success, setSuccess] = useState(false);
  const [lastSerial, setLastSerial] = useState("");

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (hasTurnstileSiteKey("invisible") && !turnstileToken) {
      setError("Verificacion segura cargando. Intenta otra vez.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, role: "admin", turnstileToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error de validación");
        setTurnstileToken("");
        setTurnstileResetKey((key) => key + 1);
        return;
      }

      setIsAuthenticated(true);
    } catch {
      setError("Error de red");
      setTurnstileToken("");
      setTurnstileResetKey((key) => key + 1);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/generate-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: "",
          quantity,
          deliveryChannel: "email",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo generar el ticket");
        return;
      }

      setLastSerial(data.serialNumber || "");
      setSuccess(true);
    } catch {
      setError("Error generando ticket");
    } finally {
      setLoading(false);
    }
  }

  const handleNext = () => {
    setSuccess(false);
    setLastSerial("");
    setForm({ firstName: "", lastName: "", email: "", phone: "" });
    setQuantity(1);
    setDeliveryChannel("email");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="relative flex w-full max-w-md flex-col items-center rounded-[34px] border border-[#C8FF00]/30 bg-black/80 p-6 shadow-[0_0_80px_rgba(200,255,0,0.15)] backdrop-blur-xl md:p-10"
          >
            <button
              onClick={() => {
                if (!isAuthenticated) onClose();
                else setIsAuthenticated(false);
              }}
              className="glass-pill absolute top-4 left-4"
            >
              VOLVER
            </button>

            {!isAuthenticated ? (
              <>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#C8FF00]/20 text-[#C8FF00]">

                </div>
                <h2 className="text-2xl font-black uppercase tracking-[0.15em] text-white">Tickets Admin</h2>
                <p className="mt-2 text-center text-xs text-zinc-400">
                  Panel privado. Genera tickets VIP gratis y envíalos por Gmail.
                </p>

                <form onSubmit={handleLogin} className="mt-8 w-full space-y-4">
                  <input
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="ADMIN PASSWORD"
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-center text-lg font-bold tracking-[0.2em] text-white outline-none focus:border-[#C8FF00]/50 focus:ring-1 focus:ring-[#C8FF00]/50"
                  />
                  <TurnstileWidget
                    action="admin_login"
                    variant="invisible"
                    resetKey={turnstileResetKey}
                    onVerify={setTurnstileToken}
                    onExpire={() => setTurnstileToken("")}
                    onError={() => setTurnstileToken("")}
                  />
                  {error && <p className="text-center text-xs font-bold text-red-400">{error}</p>}
                  <button
                    type="submit"
                    disabled={loading}
                    className="glass-action-lime w-full"
                    style={{ "--glass-action-height": "52px", "--glass-action-text": "0.65rem" } as CSSProperties}
                  >
                    {loading ? "VALIDANDO..." : "ENTRAR AL PANEL"}
                  </button>
                </form>
              </>
            ) : success ? (
              <div className="flex w-full flex-col items-center text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 text-green-500">

                </div>
                <h2 className="text-2xl font-black uppercase tracking-widest text-white">ENVIADO</h2>
                <p className="mt-2 text-[10px] leading-loose tracking-widest text-zinc-400 uppercase">
                  Ticket VIP para {form.firstName} {form.lastName} enviado por Gmail con la imagen del QR.
                </p>
                {lastSerial && (
                  <p className="mt-3 rounded-xl border border-[#C8FF00]/20 bg-[#C8FF00]/5 px-4 py-2 font-mono text-[11px] text-[#C8FF00]">
                    {lastSerial}
                  </p>
                )}
                <button
                  onClick={handleNext}
                  className="glass-action-quiet w-full mt-8"
                  style={{ "--glass-action-height": "52px", "--glass-action-text": "0.65rem" } as CSSProperties}
                >
                  ¿SEGUIR ENVIANDO ENTRADAS?
                </button>
              </div>
            ) : (
              <div className="w-full">
                <div className="mb-6 text-center">
                  <h2 className="flex items-center justify-center gap-2 text-xl font-black uppercase tracking-widest text-white">
                    TICKET GRATIS VIP
                  </h2>
                  <p className="mt-1 text-[9px] uppercase tracking-[0.2em] text-zinc-500">
                    Ingresa los datos y envía la foto del QR por Gmail
                  </p>
                </div>

                <form onSubmit={handleGenerate} className="w-full space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      required
                      type="text"
                      placeholder="NOMBRE"
                      className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-xs font-bold text-white placeholder-zinc-600 outline-none focus:border-[#C8FF00]/50"
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value.toUpperCase() })}
                    />
                    <input
                      required
                      type="text"
                      placeholder="APELLIDO"
                      className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-xs font-bold text-white placeholder-zinc-600 outline-none focus:border-[#C8FF00]/50"
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value.toUpperCase() })}
                    />
                  </div>

                  <input
                    required
                    type="email"
                    placeholder="CORREO (Gmail)"
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-xs font-bold text-white placeholder-zinc-600 outline-none focus:border-[#C8FF00]/50"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value.toLowerCase() })}
                  />

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 text-zinc-500 text-[9px] font-bold flex items-center pl-1 uppercase tracking-wider">
                      Se enviará por Gmail
                    </div>
                    <select
                      className="col-span-1 w-full rounded-xl border border-white/10 bg-black/50 px-2 py-3 text-xs font-bold text-white outline-none focus:border-[#C8FF00]/50"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                    >
                      {[1, 2, 3, 4, 5, 10, 15, 20, 50].map((n) => (
                        <option key={n} value={n} className="bg-black text-white text-center">
                          {n} Qty
                        </option>
                      ))}
                    </select>
                  </div>

                  {error && (
                    <p className="rounded border border-red-500/30 bg-red-950/40 p-2 text-[10px] font-bold text-red-400">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="glass-action-lime w-full mt-2"
                    style={{ "--glass-action-height": "52px", "--glass-action-text": "0.65rem" } as CSSProperties}
                  >
                    ENVIAR ACCESO
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
