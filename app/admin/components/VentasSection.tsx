"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, DollarSign, Ticket, Calendar, ArrowUp, ArrowDown } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import type { ReceiptRecord } from "@/lib/access-drop/types";

type VentasSectionProps = {
  receipts: ReceiptRecord[];
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

export default function VentasSection({ receipts }: VentasSectionProps) {
  const chartData = useMemo(() => computeSalesChart(receipts), [receipts]);

  const stats = useMemo(() => {
    const approved = receipts.filter((r) => r.status === "aprobado");
    const total = approved.reduce((s, r) => s + (r.quantity || 0) * 10, 0);
    const tickets = approved.reduce((s, r) => s + (r.quantity || 0), 0);
    const pendientes = receipts.filter((r) => r.status === "pendiente").length;
    const pendingRevenue = pendientes * 10;
    return { total, tickets, pendientes, pendingRevenue };
  }, [receipts]);

  if (receipts.length === 0) {
    return (
      <div className="m-4 flex flex-col items-center justify-center rounded-[26px] border border-white/10 bg-[#18131d]/[0.62] py-20 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_24px_70px_rgba(0,0,0,0.2)] backdrop-blur-2xl md:m-6">
        <TrendingUp className="mb-4 h-12 w-12 text-white/[0.28]" />
        <p className="text-sm font-bold text-white/[0.45]">Sin datos de ventas</p>
        <p className="text-[9px] text-zinc-700 mt-1">Las ventas aparecerán cuando hayas aprobado comprobantes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/[0.42]">Analytics</p>
        <p className="text-xl font-black text-white mt-1">Ventas</p>
      </div>

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
