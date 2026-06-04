/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * Descripción: Tarjeta merch con autoplay, zoom cinematográfico, flotación 3D y hover premium.
 */

"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Sparkles } from "lucide-react";
import type { MerchItem } from "@/frontend/types/domain";

export default function MerchCard({ items }: { items: MerchItem[] }) {
  const [active, setActive] = useState(0);
  const item = items[active];

  useEffect(() => {
    const interval = window.setInterval(() => setActive((value) => (value + 1) % items.length), 4000);
    return () => window.clearInterval(interval);
  }, [items.length]);

  return (
    <motion.aside 
      id="merch" 
      animate={{ y: [0, -20, 0], rotateZ: [0, 0.5, -0.5, 0] }} 
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      whileHover={{ scale: 1.03, rotateY: 5, rotateX: 5, boxShadow: "0 0 150px rgba(255,0,24,.7)" }}
      className="group relative h-[72vh] min-h-[560px] w-[78vw] max-w-[390px] shrink-0 snap-center overflow-hidden rounded-[34px] border border-red-500/40 bg-red-950/20 shadow-[0_0_80px_rgba(255,0,24,.4)] backdrop-blur-2xl md:h-[680px] md:w-[360px] perspective-1000"
    >
      <div className="absolute inset-0" style={{ transformStyle: "preserve-3d", transform: "translateZ(-20px)" }}>
        <AnimatePresence mode="wait">
          <motion.div 
            key={item.id} 
            initial={{ opacity: 0, scale: 1.15, filter: "blur(10px)" }} 
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} 
            exit={{ opacity: 0, scale: 1.05, filter: "blur(5px)" }} 
            transition={{ duration: 1.2, ease: "circOut" }} 
            className="absolute inset-0"
          >
            <Image src={item.image} alt={item.name} fill sizes="(max-width: 768px) 78vw, 360px" className="object-cover transition-transform duration-[3s] group-hover:scale-110" />
          </motion.div>
        </AnimatePresence>
        <motion.div key={`${item.id}-zoom`} className="absolute inset-0 bg-black/0" initial={{ scale: 1 }} animate={{ scale: 1.12 }} transition={{ duration: 4, ease: "linear" }} />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.15),rgba(0,0,0,.3)_35%,rgba(0,0,0,.96))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,0,24,.4),transparent_45%)] opacity-80 mix-blend-overlay transition-opacity duration-700 group-hover:opacity-100" />
        <div className="dawgs-lightning absolute left-[-30%] top-[18%] h-px w-[150%] rotate-[14deg] bg-gradient-to-r from-transparent via-red-500 to-transparent blur-[2px] transition-all duration-300 group-hover:blur-[5px] group-hover:opacity-100" />
      </div>

      <div className="relative z-10 flex h-full flex-col p-5" style={{ transform: "translateZ(30px)" }}>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-red-400/40 bg-black/50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-red-100 backdrop-blur-xl shadow-[0_0_20px_rgba(255,0,24,0.5)]">
          <Sparkles className="h-3 w-3 text-red-400" /> exclusive merch
        </span>
        <div className="mt-auto transition-transform duration-700 group-hover:-translate-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.46em] text-red-300 drop-shadow-[0_0_10px_red]">DAWGS campaign</p>
          <h2 className="mt-2 text-5xl font-black leading-[0.88] text-white drop-shadow-[0_0_30px_rgba(255,0,24,0.8)]">WEAR THE SIGNAL</h2>
          <div className="mt-5 rounded-3xl border border-white/15 bg-black/70 p-4 backdrop-blur-2xl shadow-[0_15px_40px_rgba(0,0,0,0.6)]">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h3 className="text-xl font-black text-white">{item.name}</h3>
                <p className="mt-1 text-[9px] uppercase tracking-[0.25em] text-zinc-400">future checkout slot</p>
              </div>
              <strong className="text-2xl font-black text-red-400 drop-shadow-[0_0_15px_red]">{item.price}</strong>
            </div>
            <button 
              onClick={() => alert("PRE-ORDER reservado. Se habilitará en el próximo DROP.")} 
              className="mt-4 flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-red-600 text-xs font-black uppercase tracking-[0.22em] text-white shadow-[0_0_40px_rgba(255,0,24,.6)] transition hover:bg-white hover:text-red-700 hover:scale-[1.02]"
            >
              <ShoppingBag className="h-4 w-4" /> PRE-ORDER
            </button>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
