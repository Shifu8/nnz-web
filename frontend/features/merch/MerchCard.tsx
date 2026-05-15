/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * DescripciÃ³n: Tarjeta merch con autoplay, zoom cinematogrÃ¡fico y espacio de compra.
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
    const interval = window.setInterval(() => setActive((value) => (value + 1) % items.length), 3400);
    return () => window.clearInterval(interval);
  }, [items.length]);

  return (
    <aside id="merch" className="relative h-[72vh] min-h-[560px] w-[78vw] max-w-[390px] shrink-0 snap-center overflow-hidden rounded-[34px] border border-red-400/30 bg-red-950/20 shadow-[0_0_95px_rgba(255,0,24,.38)] backdrop-blur-2xl md:h-[680px] md:w-[360px]">
      <AnimatePresence mode="wait">
        <motion.div key={item.id} initial={{ opacity: 0, scale: 1.08 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.04 }} transition={{ duration: 0.9, ease: "easeInOut" }} className="absolute inset-0">
          <Image src={item.image} alt={item.name} fill sizes="(max-width: 768px) 78vw, 360px" className="object-cover" />
        </motion.div>
      </AnimatePresence>
      <motion.div key={`${item.id}-zoom`} className="absolute inset-0 bg-black/0" initial={{ scale: 1 }} animate={{ scale: 1.08 }} transition={{ duration: 3.4, ease: "linear" }} />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.12),rgba(0,0,0,.25)_32%,rgba(0,0,0,.96))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,0,24,.34),transparent_42%)]" />
      <div className="dawgs-lightning absolute left-[-30%] top-[18%] h-px w-[150%] rotate-[14deg] bg-gradient-to-r from-transparent via-red-400 to-transparent blur-[2px]" />

      <div className="relative z-10 flex h-full flex-col p-5">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-red-300/30 bg-black/45 px-3 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-red-100 backdrop-blur-xl">
          <Sparkles className="h-3 w-3" /> merch drop
        </span>
        <div className="mt-auto">
          <p className="text-[10px] font-black uppercase tracking-[0.46em] text-red-200">DAWGS campaign</p>
          <h2 className="mt-2 text-5xl font-black leading-[0.88] text-white">WEAR THE SIGNAL</h2>
          <div className="mt-5 rounded-3xl border border-white/12 bg-black/50 p-4 backdrop-blur-2xl">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h3 className="text-xl font-black text-white">{item.name}</h3>
                <p className="mt-1 text-xs uppercase tracking-[0.22em] text-zinc-400">future checkout slot</p>
              </div>
              <strong className="text-2xl font-black text-red-300">{item.price}</strong>
            </div>
            <button className="mt-4 flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-red-600 text-xs font-black uppercase tracking-[0.22em] text-white shadow-[0_0_32px_rgba(255,0,24,.42)] transition hover:bg-red-500">
              <ShoppingBag className="h-4 w-4" /> comprar
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
