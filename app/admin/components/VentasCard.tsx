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
      whileHover={{ y: -6, scale: 1.01 }}
      className="relative col-span-full lg:col-span-2 overflow-hidden rounded-3xl border border-[#C8FF00]/20 bg-gradient-to-br from-black via-zinc-950 to-black p-[1px]"
    >
      {/* Green neon glow border effect */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#C8FF00]/10 via-transparent to-[#C8FF00]/5 pointer-events-none" />

      {/* Animated glow orbs */}
      <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-[#C8FF00]/10 blur-[100px] animate-pulse" />
      <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-[#C8FF00]/5 blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />

      {/* Inner content */}
      <div className="relative rounded-3xl bg-black/80 backdrop-blur-2xl p-[1px]">
        <div className="rounded-3xl bg-gradient-to-b from-white/[0.03] to-transparent p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C8FF00]/10 border border-[#C8FF00]/20 shadow-[0_0_30px_rgba(200,255,0,0.1)]">
                <DollarSign className="h-6 w-6 text-[#C8FF00]" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#C8FF00]/70">Ventas Totales</p>
                <p className="text-xs font-bold text-zinc-500">Ingresos del sistema</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#C8FF00]/20 bg-[#C8FF00]/5">
              <TrendingUp className="h-3 w-3 text-[#C8FF00]" />
              <span className="text-[8px] font-black text-[#C8FF00] uppercase tracking-wider">En tiempo real</span>
            </div>
          </div>

          {/* Main metric */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <motion.p
                key={displayRevenue}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl md:text-6xl lg:text-7xl font-black text-white drop-shadow-[0_0_40px_rgba(200,255,0,0.15)]"
              >
                ${displayRevenue.toLocaleString()}
              </motion.p>
              <div className="flex items-center gap-2 mt-2">
                <ArrowUpRight className="h-4 w-4 text-green-400" />
                <p className="text-[10px] font-bold text-green-400 uppercase tracking-wider">
                  {totalTicketsSold} entradas vendidas
                </p>
              </div>
            </div>

            {/* Mini stats */}
            <div className="flex gap-3">
              <div className="px-4 py-3 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <p className="text-[8px] font-black uppercase tracking-wider text-zinc-600">Aprobadas</p>
                <p className="text-xl font-black text-green-400 mt-1">{approvedCount}</p>
              </div>
              <div className="px-4 py-3 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <p className="text-[8px] font-black uppercase tracking-wider text-zinc-600">Pendientes</p>
                <p className="text-xl font-black text-amber-400 mt-1">{pendingCount}</p>
              </div>
              <div className="px-4 py-3 rounded-2xl border border-[#C8FF00]/10 bg-[#C8FF00]/[0.02]">
                <p className="text-[8px] font-black uppercase tracking-wider text-[#C8FF00]/60">Ticket</p>
                <p className="text-xl font-black text-[#C8FF00] mt-1">${(totalRevenue / (totalTicketsSold || 1)).toFixed(0)}</p>
              </div>
            </div>
          </div>

          {/* Animated pulse line */}
          <div className="mt-6 h-[1px] w-full bg-gradient-to-r from-transparent via-[#C8FF00]/30 to-transparent relative overflow-hidden">
            <motion.div
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-[#C8FF00]/60 to-transparent"
            />
          </div>

          {/* Bottom stats */}
          <div className="mt-4 flex items-center gap-4 text-[8px] font-bold text-zinc-600 uppercase tracking-wider">
            <Activity className="h-3 w-3" />
            <span>Actualizado en tiempo real</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
