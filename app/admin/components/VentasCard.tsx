"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, ArrowUpRight, Activity } from "lucide-react";

type VentasCardProps = {
  totalRevenue: number;
  totalTicketsSold: number;
  pendingCount: number;
  approvedCount: number;
};

export default function VentasCard({ totalRevenue, totalTicketsSold, pendingCount, approvedCount }: VentasCardProps) {
  const [displayRevenue, setDisplayRevenue] = useState(0);
  const [displayTickets, setDisplayTickets] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dur = 1800;
    const steps = 60;
    const revStep = totalRevenue / steps;
    const ticStep = totalTicketsSold / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      if (step >= steps) {
        setDisplayRevenue(totalRevenue);
        setDisplayTickets(totalTicketsSold);
        clearInterval(timer);
      } else {
        setDisplayRevenue(Math.floor(revStep * step));
        setDisplayTickets(Math.floor(ticStep * step));
      }
    }, dur / steps);
    return () => clearInterval(timer);
  }, [totalRevenue, totalTicketsSold]);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -5 }}
      className="relative col-span-full overflow-hidden rounded-[26px] border border-white/10 bg-[#18131d]/[0.62] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_24px_70px_rgba(0,0,0,0.2)] backdrop-blur-2xl lg:col-span-2"
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_38%,rgba(244,196,110,0.08))] pointer-events-none" />
      <div className="relative">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#ffd36a]/[0.28] bg-[#ffd36a]/[0.12]">
              <DollarSign className="h-6 w-6 text-[#ffd36a]" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/[0.42]">Ventas Totales</p>
              <p className="text-xs font-bold text-white/[0.48]">Ingresos del sistema</p>
            </div>
          </div>
          <div className="hidden items-center gap-1 rounded-full border border-[#ffd36a]/[0.28] bg-[#ffd36a]/[0.1] px-3 py-1.5 md:flex">
            <TrendingUp className="h-3 w-3 text-[#ffd36a]" />
            <span className="text-[8px] font-black uppercase tracking-[0.1em] text-[#ffd36a]">Live</span>
          </div>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <motion.p
              key={displayRevenue}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl font-black text-white md:text-6xl lg:text-7xl"
            >
              ${displayRevenue.toLocaleString()}
            </motion.p>
            <div className="mt-2 flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-[#8ff0aa]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#8ff0aa]">
                {totalTicketsSold} entradas vendidas
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.06] px-4 py-3">
              <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white/[0.38]">Aprobadas</p>
              <p className="mt-1 text-xl font-black text-[#8ff0aa]">{approvedCount}</p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.06] px-4 py-3">
              <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white/[0.38]">Pendientes</p>
              <p className="mt-1 text-xl font-black text-[#ffd36a]">{pendingCount}</p>
            </div>
            <div className="rounded-2xl border border-[#ffd36a]/[0.22] bg-[#ffd36a]/[0.08] px-4 py-3">
              <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white/[0.38]">Ticket</p>
              <p className="mt-1 text-xl font-black text-[#ffd36a]">${(totalRevenue / (totalTicketsSold || 1)).toFixed(0)}</p>
            </div>
          </div>
        </div>

        <div className="relative mt-6 h-px w-full overflow-hidden bg-gradient-to-r from-transparent via-[#ffd36a]/[0.3] to-transparent">
          <motion.div
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-[#ffd36a]/[0.6] to-transparent"
          />
        </div>

        <div className="mt-4 flex items-center gap-3 text-[8px] font-bold uppercase tracking-[0.1em] text-white/[0.38]">
          <Activity className="h-3 w-3" />
          <span>Actualizado en tiempo real</span>
        </div>
      </div>
    </motion.div>
  );
}
