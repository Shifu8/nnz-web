"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Users, Phone, Mail, Search, Ticket, DollarSign, Calendar } from "lucide-react";
import { useToast } from "./Toast";
import type { ReceiptRecord } from "@/lib/access-drop/types";
import type { ClientInfo } from "@/lib/admin/types";

type ClientsSectionProps = {
  receipts: ReceiptRecord[];
};

export default function ClientsSection({ receipts }: ClientsSectionProps) {
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const [resettingEmail, setResettingEmail] = useState<string | null>(null);

  const handleResetRecovery = async (email: string) => {
    if (resettingEmail) return;
    setResettingEmail(email);

    try {
      const res = await fetch("/api/admin/reset-recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo resetear.");

      toast("success", "Límite Reseteado", `Las solicitudes para ${email} se han restablecido a 0.`);
    } catch (err: any) {
      toast("error", "Error", err.message || "Error al intentar resetear.");
    } finally {
      setResettingEmail(null);
    }
  };

  const clients = useMemo(() => {
    const map = new Map<string, ClientInfo>();
    for (const r of receipts) {
      const key = r.phone;
      if (!map.has(key)) {
        map.set(key, {
          phone: r.phone,
          firstName: r.firstName,
          lastName: r.lastName,
          email: r.email,
          totalPurchases: 0,
          totalSpent: 0,
          lastPurchase: r.createdAt,
          status: "inactivo",
          tickets: [],
        });
      }
      const c = map.get(key)!;
      c.totalPurchases++;
      if (r.status === "aprobado") {
        c.totalSpent += (r.quantity || 1) * 10;
        c.tickets.push({
          eventTitle: "TRAP LOUD",
          quantity: r.quantity || 1,
          date: r.createdAt,
          serial: r.serialNumber || "",
        });
      }
      if (r.createdAt > c.lastPurchase) c.lastPurchase = r.createdAt;
      if (r.status === "aprobado") c.status = "activo";
    }
    return Array.from(map.values()).sort((a, b) => b.totalPurchases - a.totalPurchases);
  }, [receipts]);

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter(
      (c) =>
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }, [clients, search]);

  if (clients.length === 0) {
    return (
      <div className="m-4 flex flex-col items-center justify-center rounded-[26px] border border-white/10 bg-[#18131d]/[0.62] py-20 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_24px_70px_rgba(0,0,0,0.2)] backdrop-blur-2xl md:m-6">
        <Users className="mb-4 h-12 w-12 text-white/[0.28]" />
        <p className="text-sm font-bold text-white/[0.45]">No hay clientes</p>
        <p className="text-[9px] text-zinc-700 mt-1">Los clientes aparecerán cuando haya comprobantes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/[0.42]">CRM</p>
        <p className="text-xl font-black text-white mt-1">Clientes</p>
        <p className="text-[9px] text-white/[0.42] mt-1">{clients.length} clientes registrados</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/[0.35]" />
        <input type="text" placeholder="Buscar por nombre, teléfono o email..." className="w-full rounded-2xl border border-white/10 bg-black/40 px-9 py-3 text-xs font-bold text-white placeholder-zinc-700 outline-none transition focus:border-red-500/50" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid gap-3">
        {filtered.map((client, i) => (
          <motion.div
            key={client.phone}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-4 hover:border-white/15 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${
                  client.status === "activo" ? "border-green-500/20 bg-green-950/20" : "border-zinc-500/20 bg-zinc-950/20"
                }`}>
                  <span className="text-lg font-black text-white">{client.firstName[0]}{client.lastName[0]}</span>
                </div>
                <div>
                  <p className="text-sm font-black text-white tracking-wider">{client.firstName} {client.lastName}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-[8px] text-zinc-500"><Phone className="h-3 w-3" /> {client.phone}</span>
                    {client.email && <span className="flex items-center gap-1 text-[8px] text-zinc-500"><Mail className="h-3 w-3" /> {client.email}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-black text-[#C8FF00]">${client.totalSpent}</p>
                  <p className="text-[8px] text-zinc-500">{client.totalPurchases} compra(s)</p>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-[7px] font-black uppercase tracking-wider ${
                  client.status === "activo"
                    ? "border-green-500/30 bg-green-950/30 text-green-400"
                    : "border-zinc-500/30 bg-zinc-950/30 text-zinc-500"
                }`}>
                  {client.status}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between flex-wrap gap-2">
              <div>
                {client.tickets.length > 0 && (
                  <div>
                    <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-wider mb-2">Entradas adquiridas</p>
                    <div className="flex flex-wrap gap-2">
                      {client.tickets.map((t, i) => (
                        <div key={i} className="flex items-center gap-2 rounded-lg border border-white/[0.04] bg-black/30 px-2.5 py-1.5">
                          <Ticket className="h-3 w-3 text-zinc-500" />
                          <span className="text-[7px] text-zinc-400">{t.eventTitle} x{t.quantity}</span>
                          {t.serial && <span className="text-[7px] text-green-400 font-bold">{t.serial}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {client.email && (
                <button
                  type="button"
                  disabled={resettingEmail === client.email}
                  onClick={() => handleResetRecovery(client.email)}
                  className="rounded-xl border border-red-500/20 bg-red-950/10 px-3 py-1.5 text-[8px] font-black uppercase tracking-wider text-red-400 transition hover:bg-red-950/30 active:scale-95 disabled:opacity-50"
                >
                  {resettingEmail === client.email ? "Reseteando..." : "Resetear OTP"}
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
