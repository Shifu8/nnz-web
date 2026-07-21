"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, DollarSign, Ticket, Calendar, ArrowUp, ArrowDown, User } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import type { ReceiptRecord } from "@/lib/access-drop/types";

type VentasSectionProps = {
  receipts: ReceiptRecord[];
  posSales?: any;
  drinkSales?: any;
  onRefreshPosSales?: () => void;
};

function computeSalesChart(receipts: ReceiptRecord[]) {
  const approved = receipts.filter((r) => r.status === "aprobado" && r.createdAt);
  if (approved.length === 0) {
    return Array.from({ length: 8 }, (_, i) => ({ name: `Sem ${i + 1}`, tickets: 0, revenue: 0 }));
  }
  const dates = approved.map((r) => new Date(r.createdAt).getTime());
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const weekCount = Math.max(4, Math.ceil((maxDate - minDate) / weekMs) + 1);
  const buckets: { tickets: number; revenue: number }[] = Array.from({ length: weekCount }, () => ({ tickets: 0, revenue: 0 }));
  for (const r of approved) {
    const d = new Date(r.createdAt).getTime();
    const weekIdx = Math.min(Math.floor((d - minDate) / weekMs), weekCount - 1);
    buckets[weekIdx].tickets += r.quantity || 1;
    buckets[weekIdx].revenue += (r.quantity || 1) * 10;
  }
  return buckets.map((b, i) => ({ name: `Sem ${i + 1}`, tickets: b.tickets, revenue: b.revenue }));
}

function StockAdjusterCard({ id, item, onRefresh }: { id: string; item: any; onRefresh?: () => void }) {
  const [stockVal, setStockVal] = useState(item.stock !== undefined ? item.stock : 50);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (item.stock !== undefined) {
      setStockVal(item.stock);
    }
  }, [item.stock]);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/pos/drinks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "adjust_stock", drinkId: id, stock: Number(stockVal) }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
        if (onRefresh) onRefresh();
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleAdjust} className="flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-black/40 p-3">
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-bold text-zinc-400 truncate w-full uppercase">{item.name}</p>
        <p className="text-[10px] text-zinc-500 mt-0.5">Stock: <strong className="text-white">{item.stock !== undefined ? item.stock : 0}</strong></p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <input
          type="number"
          min="0"
          max="1000"
          value={stockVal}
          onChange={(e) => setStockVal(Number(e.target.value))}
          className="w-14 rounded-lg border border-white/15 bg-black text-center text-xs font-bold py-1 text-white outline-none focus:border-amber-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-2 py-1 text-[9px] font-black uppercase text-amber-300 hover:bg-amber-500 hover:text-black transition cursor-pointer"
        >
          {loading ? "..." : success ? "✓" : "Fijar"}
        </button>
      </div>
    </form>
  );
}

export default function VentasSection({ receipts, posSales, drinkSales, onRefreshPosSales }: VentasSectionProps) {
  const chartData = useMemo(() => computeSalesChart(receipts), [receipts]);

  const [cashierInput, setCashierInput] = useState(posSales?.cashierName || "Viviana Calva");
  const [savingCashier, setSavingCashier] = useState(false);
  const [cashierSavedToast, setCashierSavedToast] = useState(false);

  const [bartenderInput, setBartenderInput] = useState(drinkSales?.cashierName || "Viviana Calva");
  const [savingBartender, setSavingBartender] = useState(false);
  const [bartenderSavedToast, setBartenderSavedToast] = useState(false);

  useEffect(() => {
    if (posSales?.cashierName) {
      setCashierInput(posSales.cashierName);
    }
  }, [posSales?.cashierName]);

  useEffect(() => {
    if (drinkSales?.cashierName) {
      setBartenderInput(drinkSales.cashierName);
    }
  }, [drinkSales?.cashierName]);

  const handleSaveCashier = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCashier(true);
    try {
      const res = await fetch("/api/pos/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_cashier", cashierName: cashierInput }),
      });
      if (res.ok) {
        setCashierSavedToast(true);
        setTimeout(() => setCashierSavedToast(false), 3000);
        if (onRefreshPosSales) onRefreshPosSales();
      }
    } catch {
    } finally {
      setSavingCashier(false);
    }
  };

  const handleSaveBartender = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBartender(true);
    try {
      const res = await fetch("/api/pos/drinks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_cashier", cashierName: bartenderInput }),
      });
      if (res.ok) {
        setBartenderSavedToast(true);
        setTimeout(() => setBartenderSavedToast(false), 3000);
        if (onRefreshPosSales) onRefreshPosSales();
      }
    } catch {
    } finally {
      setSavingBartender(false);
    }
  };

  const stats = useMemo(() => {
    const approved = receipts.filter((r) => r.status === "aprobado");
    const total = approved.reduce((s, r) => s + (r.quantity || 0) * 10, 0);
    const tickets = approved.reduce((s, r) => s + (r.quantity || 0), 0);
    const pendientes = receipts.filter((r) => r.status === "pendiente").length;
    const pendingRevenue = pendientes * 10;
    return { total, tickets, pendientes, pendingRevenue };
  }, [receipts]);

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/[0.42]">Analytics</p>
        <p className="text-xl font-black text-white mt-1">Ventas & Taquilla</p>
      </div>

      {/* POS Taquilla Sales Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[26px] border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-zinc-950 to-black p-5 shadow-[0_10px_35px_rgba(16,185,129,0.15)]"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-500/40 bg-emerald-500/20 text-emerald-400">
              <Ticket className="h-5 w-5" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-950/60 px-2 py-0.5 text-[7.5px] font-black uppercase tracking-[0.2em] text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Ventas de Taquilla en Puerta (Hoy)
              </span>
              <h3 className="text-base sm:text-lg font-black uppercase text-white tracking-wide mt-0.5">
                Ventas en Vivo del Evento
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Recaudado en Puerta</p>
              <p className="text-2xl font-black text-emerald-400">${posSales?.totalRevenue || 0}.00</p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Entradas Vendidas</p>
              <p className="text-2xl font-black text-white">{posSales?.totalCount || 0}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <div className="flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-3.5">
            <div>
              <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">Carnet Universitario ($5)</span>
              <p className="text-sm font-black text-white mt-0.5">{posSales?.studentCount || 0} vendidas</p>
            </div>
            <span className="text-sm font-black text-emerald-300">${posSales?.studentRevenue || 0}</span>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-purple-500/20 bg-purple-950/20 p-3.5">
            <div>
              <span className="text-[8px] font-black uppercase tracking-widest text-purple-400">General Sin Carnet ($8)</span>
              <p className="text-sm font-black text-white mt-0.5">{posSales?.generalCount || 0} vendidas</p>
            </div>
            <span className="text-sm font-black text-purple-300">${posSales?.generalRevenue || 0}</span>
          </div>
        </div>

        {/* Taquillero / Encargado Manager Row */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Taquillero(a) a Cargo:
            </span>
          </div>

          <form onSubmit={handleSaveCashier} className="flex items-center gap-2">
            <input
              type="text"
              value={cashierInput}
              onChange={(e) => setCashierInput(e.target.value)}
              placeholder="Nombre de encargado"
              className="rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs font-bold text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 min-w-[200px]"
            />
            <button
              type="submit"
              disabled={savingCashier}
              className="rounded-xl border border-emerald-500/50 bg-emerald-500/20 px-4 py-2 text-xs font-black text-emerald-300 uppercase tracking-wider hover:bg-emerald-500 hover:text-black transition cursor-pointer disabled:opacity-50"
            >
              {savingCashier ? "Guardando..." : cashierSavedToast ? "✓ Guardado" : "Cambiar Nombre"}
            </button>
          </form>
        </div>
      </motion.div>

      {/* POS Drinks Sales Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[26px] border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-zinc-950 to-black p-5 shadow-[0_10px_35px_rgba(245,158,11,0.15)]"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/20 text-amber-400">
              <TrendingUp className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-950/60 px-2.5 py-0.5 text-[7.5px] font-black uppercase tracking-[0.2em] text-amber-300">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                Ventas de Barra en Vivo (Bebidas)
              </span>
              <h3 className="text-base sm:text-lg font-black uppercase text-white tracking-wide mt-0.5">
                Ventas en Barra del Evento
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Recaudado en Barra</p>
              <p className="text-2xl font-black text-amber-400">${drinkSales?.totalRevenue || 0}.00</p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Unidades Vendidas</p>
              <p className="text-2xl font-black text-white">{drinkSales?.totalCount || 0}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
          {Object.entries(drinkSales?.items || {}).map(([id, item]: [string, any]) => (
            <div key={id} className={`flex items-center justify-between rounded-2xl border p-3.5 ${item.category === "Cocteles Especiales" ? "border-amber-500/20 bg-amber-950/10" : "border-orange-500/20 bg-orange-950/10"}`}>
              <div>
                <span className={`text-[8px] font-black uppercase tracking-widest ${item.category === "Cocteles Especiales" ? "text-amber-400" : "text-orange-400"}`}>{item.name} (${item.price})</span>
                <p className="text-sm font-black text-white mt-0.5">{item.count || 0} vendidas</p>
                <p className="text-[9px] font-bold text-zinc-500 mt-0.5">Stock: {item.stock !== undefined ? item.stock : 0} / {item.initialStock || 0}</p>
              </div>
              <span className={`text-sm font-black ${item.category === "Cocteles Especiales" ? "text-amber-300" : "text-orange-300"}`}>${item.revenue || 0}</span>
            </div>
          ))}
        </div>

        {/* Bartenders Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4 border-t border-white/5 pt-4">
          {Object.entries(drinkSales?.bartenders || {
            "Viviana Calva": { count: 0, revenue: 0 },
            "Carlos Ruiz": { count: 0, revenue: 0 },
            "Mateo Gómez": { count: 0, revenue: 0 },
            "Sofía Vega": { count: 0, revenue: 0 }
          }).map(([name, stats]: [string, any]) => (
            <div key={name} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 p-3">
              <div>
                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Bartender: {name}</span>
                <p className="text-xs font-black text-white mt-0.5">{stats.count || 0} vendidas</p>
              </div>
              <span className="text-xs font-black text-amber-400 font-bold">${stats.revenue || 0}</span>
            </div>
          ))}
        </div>

        {/* Inventario & Recarga de Stock */}
        <div className="mt-4 border-t border-white/5 pt-4">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-3">
            Gestión de Inventario (Recargar Stock de Barra)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(drinkSales?.items || {}).map(([id, item]: [string, any]) => (
              <StockAdjusterCard key={id} id={id} item={item} onRefresh={onRefreshPosSales} />
            ))}
          </div>
        </div>

        {/* Bartender / Encargado Manager Row */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Bartender a Cargo:
            </span>
          </div>

          <form onSubmit={handleSaveBartender} className="flex items-center gap-2">
            <input
              type="text"
              value={bartenderInput}
              onChange={(e) => setBartenderInput(e.target.value)}
              placeholder="Nombre de bartender"
              className="rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs font-bold text-white outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 min-w-[200px]"
            />
            <button
              type="submit"
              disabled={savingBartender}
              className="rounded-xl border border-amber-500/50 bg-amber-500/20 px-4 py-2 text-xs font-black text-amber-300 uppercase tracking-wider hover:bg-amber-500 hover:text-black transition cursor-pointer disabled:opacity-50"
            >
              {savingBartender ? "Guardando..." : bartenderSavedToast ? "✓ Guardado" : "Cambiar Nombre"}
            </button>
          </form>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Ingresos Totales", value: `$${stats.total}`, icon: DollarSign, color: "text-[#ffd36a]" },
          { label: "Entradas Vendidas", value: stats.tickets, icon: Ticket, color: "text-[#8bb9ff]" },
          { label: "Pendientes de Pago", value: stats.pendientes, icon: Calendar, color: "text-[#ffb86f]" },
          { label: "Por Cobrar", value: `$${stats.pendingRevenue}`, icon: TrendingUp, color: "text-[#ff8a9d]" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-[22px] border border-white/10 bg-[#18131d]/[0.62] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_45px_rgba(0,0,0,0.16)] backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white/[0.38]">{s.label}</p>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="rounded-[26px] border border-white/10 bg-[#18131d]/[0.62] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_24px_70px_rgba(0,0,0,0.2)] backdrop-blur-2xl"
      >
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-4">Proyección Semanal</p>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="ventasRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C8FF00" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#C8FF00" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ventasTicketsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#52525b", fontSize: 9, fontWeight: 700 }} dy={8} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#52525b", fontSize: 9, fontWeight: 700 }} dx={-4} />
              <Tooltip content={({ active, payload, label }: any) =>
                active && payload?.length ? (
                  <div className="rounded-2xl border border-white/10 bg-black/80 backdrop-blur-xl px-4 py-3 shadow-xl">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">{label}</p>
                    {payload.map((p: any, i: number) => (
                      <p key={i} className={`text-xs font-black mt-1 ${p.name === "revenue" ? "text-[#C8FF00]" : "text-red-400"}`}>
                        {p.name === "revenue" ? `$${p.value}` : `${p.value} tickets`}
                      </p>
                    ))}
                  </div>
                ) : null
              } />
              <Area type="monotone" dataKey="revenue" stroke="#C8FF00" strokeWidth={2.5} fill="url(#ventasRevenueGrad)" dot={false} />
              <Area type="monotone" dataKey="tickets" stroke="#ef4444" strokeWidth={2} fill="url(#ventasTicketsGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
