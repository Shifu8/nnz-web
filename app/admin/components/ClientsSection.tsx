"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Users, Mail, Search, Ticket, DollarSign, Calendar, Trash2, ShieldAlert, Filter, UserX } from "lucide-react";
import { useToast } from "./Toast";
import type { ReceiptRecord } from "@/lib/access-drop/types";
import type { ClientInfo } from "@/lib/admin/types";

type ClientsSectionProps = {
  receipts: ReceiptRecord[];
};

export default function ClientsSection({ receipts }: ClientsSectionProps) {
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>("all");
  const [resettingEmail, setResettingEmail] = useState<string | null>(null);
  const [clearingEmail, setClearingEmail] = useState<string | null>(null);
  const [deletingEmail, setDeletingEmail] = useState<string | null>(null);
  const [confirmDeleteEmail, setConfirmDeleteEmail] = useState<string | null>(null);

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

  const handleClearTickets = async (email: string) => {
    if (
      !confirm(
        `¿Estás seguro de vaciar todas las entradas de ${email}? Esto rechazará sus comprobantes y eliminará sus pases.`
      )
    )
      return;
    setClearingEmail(email);

    try {
      const res = await fetch("/api/admin/clear-client-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo vaciar.");

      toast("success", "Entradas Vaciadas", `Las entradas para ${email} han sido eliminadas.`);
      window.location.reload();
    } catch (err: any) {
      toast("error", "Error", err.message || "Error al intentar vaciar entradas.");
    } finally {
      setClearingEmail(null);
    }
  };

  const handleDeleteClient = async (email: string) => {
    setDeletingEmail(email);

    try {
      const res = await fetch("/api/admin/delete-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo eliminar.");

      toast("success", "Cliente Eliminado", `El cliente ${email} ha sido borrado del sistema.`);
      setConfirmDeleteEmail(null);
      window.location.reload();
    } catch (err: any) {
      toast("error", "Error", err.message || "Error al intentar eliminar cliente.");
    } finally {
      setDeletingEmail(null);
    }
  };

  const clients = useMemo(() => {
    const map = new Map<string, ClientInfo & { tickets: Array<any> }>();
    for (const r of receipts) {
      if (!r.email) continue;
      const key = r.email.toLowerCase().trim();
      if (!map.has(key)) {
        map.set(key, {
          phone: r.phone || "",
          firstName: r.firstName,
          lastName: r.lastName,
          email: r.email,
          totalPurchases: 0,
          totalSpent: 0,
          lastPurchase: r.createdAt,
          status: "activo",
          tickets: [],
        });
      }
      const c = map.get(key)!;
      c.totalPurchases++;
      
      const eventId = r.eventId || "trap-loud";
      const eventTitle = r.status === "aprobado" 
        ? (eventId === "trap-loud" 
            ? "TRAP LOUD" 
            : eventId === "dawg-night" 
            ? "DAWG NIGHT" 
            : eventId === "trap-loud-anuel" 
            ? "TRAP LOUD (ANUEL)" 
            : eventId.toUpperCase()) 
        : "";

      if (r.status === "aprobado") {
        c.totalSpent += (r.quantity || 1) * (eventId === "trap-loud" ? 10 : eventId === "dawg-night" ? 15 : 20);
        c.tickets.push({
          eventId,
          eventTitle: eventTitle || "TRAP LOUD",
          quantity: r.quantity || 1,
          date: r.createdAt,
          serial: r.serialNumber || "",
        });
      }
      if (r.createdAt > c.lastPurchase) c.lastPurchase = r.createdAt;
    }
    return Array.from(map.values()).sort((a, b) => b.totalPurchases - a.totalPurchases);
  }, [receipts]);

  const filtered = useMemo(() => {
    let list = clients;
    if (selectedEventFilter !== "all") {
      list = list.filter((c) => c.tickets.some((t: any) => t.eventId === selectedEventFilter));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.firstName.toLowerCase().includes(q) ||
          c.lastName.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
      );
    }
    return list;
  }, [clients, search, selectedEventFilter]);

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

      <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between max-w-full">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/[0.35]" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-9 py-3 text-xs font-bold text-white placeholder-zinc-700 outline-none transition focus:border-red-500/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
            <Filter className="h-3 w-3" /> Filtrar Evento:
          </span>
          <select
            value={selectedEventFilter}
            onChange={(e) => setSelectedEventFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs font-bold text-white outline-none focus:border-red-500/50"
          >
            <option value="all">Todos los eventos</option>
            <option value="trap-loud">TRAP LOUD</option>
            <option value="dawg-night">DAWG NIGHT</option>
            <option value="trap-loud-anuel">TRAP LOUD (ANUEL)</option>
            <option value="latin-loud">LATIN LOUD</option>
          </select>
        </div>
      </div>

      <div className="grid gap-3">
        {filtered.map((client, i) => {
          const displayedTickets = selectedEventFilter === "all"
            ? client.tickets
            : client.tickets.filter((t: any) => t.eventId === selectedEventFilter);

          return (
            <motion.div
              key={client.email}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-4 hover:border-white/15 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                    <span className="text-lg font-black text-white">{client.firstName[0]}{client.lastName[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-black text-white tracking-wider">{client.firstName} {client.lastName}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {client.email && <span className="flex items-center gap-1 text-[8px] text-zinc-500"><Mail className="h-3 w-3" /> {client.email}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-black text-[#C8FF00]">${client.totalSpent}</p>
                    <p className="text-[8px] text-zinc-500">{client.totalPurchases} compra(s)</p>
                  </div>
                  
                  {/* Delete user button */}
                  {client.email && (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteEmail(client.email)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-500/20 text-red-500/80 hover:bg-red-500 hover:text-white transition"
                      title="Eliminar Cliente"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between flex-wrap gap-2">
                <div>
                  {displayedTickets.length > 0 && (
                    <div>
                      <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-wider mb-2">Entradas adquiridas</p>
                      <div className="flex flex-wrap gap-2">
                        {displayedTickets.map((t, i) => (
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
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={clearingEmail === client.email}
                      onClick={() => handleClearTickets(client.email)}
                      className="rounded-xl border border-orange-500/20 bg-orange-950/10 px-3 py-1.5 text-[8px] font-black uppercase tracking-wider text-orange-400 transition hover:bg-orange-950/30 active:scale-95 disabled:opacity-50"
                    >
                      {clearingEmail === client.email ? "Vaciando..." : "Vaciar Entradas"}
                    </button>
                    <button
                      type="button"
                      disabled={resettingEmail === client.email}
                      onClick={() => handleResetRecovery(client.email)}
                      className="rounded-xl border border-red-500/20 bg-red-950/10 px-3 py-1.5 text-[8px] font-black uppercase tracking-wider text-red-400 transition hover:bg-red-950/30 active:scale-95 disabled:opacity-50"
                    >
                      {resettingEmail === client.email ? "Reseteando..." : "Resetear OTP"}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Confirmation Modal for Delete User */}
      {confirmDeleteEmail && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl max-w-sm w-full flex flex-col items-center gap-5 text-center animate-in zoom-in-95 duration-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-950/20 border border-red-500/30 text-red-500">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-white">¿Eliminar Cliente?</h4>
              <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed">
                Esta acción eliminará de forma permanente al cliente <span className="text-white font-bold">{confirmDeleteEmail}</span>, incluyendo todo su historial de compras, comprobantes y entradas. Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full">
              <button
                type="button"
                disabled={deletingEmail === confirmDeleteEmail}
                onClick={() => setConfirmDeleteEmail(null)}
                className="h-11 rounded-2xl border border-white/10 bg-white/[0.03] text-[9px] font-black uppercase tracking-[0.15em] text-zinc-400 transition hover:border-white/20 hover:text-white disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deletingEmail === confirmDeleteEmail}
                onClick={() => handleDeleteClient(confirmDeleteEmail)}
                className="h-11 rounded-2xl bg-red-600 text-[9px] font-black uppercase tracking-[0.15em] text-white transition hover:bg-red-500 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {deletingEmail === confirmDeleteEmail ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
