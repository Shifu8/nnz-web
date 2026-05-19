/**
 * Autor: Brandon Medina
 * Fecha: 2026
 * Descripción: Panel flotante expandido por defecto en la derecha para visualización de merch, accesos y estudio.
 */

"use client";

import { useEffect, useState } from "react";
import { AudioLines, X, Ticket, Gift, ChevronRight, ShoppingBag } from "lucide-react";

import { merch } from "@/frontend/services/dawgsData";

export default function FloatingWhatsAppBubble() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const phone = "593988831372";
  const getWhatsAppLink = (text: string) => `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % merch.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const currentItem = merch[currentIndex];

  return (
    <>
      {/* Burbuja Flotante Minimalista */}
      <div 
        className="fixed bottom-6 right-6 z-[90] flex flex-col items-end gap-4"
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {isExpanded && (
          <div className="w-[200px] md:w-[260px] animate-in slide-in-from-bottom-4 fade-in duration-300 overflow-hidden rounded-[24px] border border-red-500/30 bg-black/90 p-3 md:p-4 shadow-[0_0_40px_rgba(255,0,24,0.3)] backdrop-blur-2xl">
            <p className="text-[10px] md:text-xs font-black uppercase text-red-500 tracking-widest text-center mb-3 animate-pulse">WEAR DROP</p>
            
            <a 
              key={currentItem.id}
              href={getWhatsAppLink(`Hola DAWGS, me interesa el articulo: ${currentItem.name}`)}
              target="_blank"
              rel="noreferrer"
              className="group relative flex w-full flex-col items-center overflow-hidden rounded-xl border border-white/5 bg-white/5 pb-3 transition hover:bg-white/10 hover:border-red-500/30"
            >
              <div className="relative h-32 md:h-40 w-full overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10" />
                 <img src={currentItem.image} alt={currentItem.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                 <p className="absolute bottom-2 left-0 w-full text-center text-sm md:text-base font-black text-white z-20 drop-shadow-md">{currentItem.price}</p>
              </div>
              <div className="px-3 mt-2 flex flex-col items-center w-full">
                <p className="text-xs font-bold text-zinc-300 text-center leading-tight line-clamp-2 min-h-[32px]">{currentItem.name}</p>
                <div className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-red-600/20 py-2 text-[10px] font-black uppercase text-red-400 group-hover:bg-red-600 group-hover:text-white transition">
                  <ShoppingBag className="h-3 w-3" /> Adquirir
                </div>
              </div>
            </a>
          </div>
        )}

        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-full border border-red-500/40 bg-black/80 text-white shadow-[0_0_30px_rgba(255,0,24,0.4)] backdrop-blur-xl transition hover:scale-110 hover:border-red-500 hover:shadow-[0_0_40px_rgba(255,0,24,0.6)] ${isExpanded ? 'rotate-45' : ''}`}
        >
          {isExpanded ? <X className="h-6 w-6 text-red-400" /> : <ShoppingBag className="h-6 w-6 text-red-400 animate-pulse" />}
        </button>
      </div>
    </>
  );
}
