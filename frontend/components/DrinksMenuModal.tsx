"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import type { DrinkItem } from "@/frontend/types/domain";
export type { DrinkItem };

export const DRINKS_LIST: DrinkItem[] = [
  {
    id: "mojito-eleva",
    name: "Mojito Eleva",
    category: "Cocteles Especiales",
    price: "Vaso $2",
    description: "Ron blanco, menta fresca, soda de lima e infusión secreta NENEZ.",
    badge: "ESPECIAL DE LA NOCHE",
  },
  {
    id: "gran-malo",
    name: "Gran Malo Tequila (750ml)",
    category: "Botellas",
    price: "$35",
    description: "Tequila especiado con infusión sabor horchata.",
    badge: "POPULAR",
  },
  {
    id: "jagger",
    name: "Jägermeister (750ml)",
    category: "Botellas",
    price: "$45",
    description: "Servido helado a -18°C con 4 energizantes.",
  },
  {
    id: "black-label",
    name: "Black Label Whisky (750ml)",
    category: "Botellas",
    price: "$75",
    description: "Johnnie Walker Black Label 12 Años.",
  },
  {
    id: "absolut",
    name: "Absolut Vodka (750ml)",
    category: "Botellas",
    price: "$40",
    description: "Vodka sueco ultra refinado con mixers.",
  },
  {
    id: "don-julio",
    name: "Don Julio Reposado (750ml)",
    category: "Botellas",
    price: "$95",
    description: "Tequila 100% agave azul de la casa.",
  },
];

interface DrinksMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventName?: string;
  venueName?: string;
  drinks?: DrinkItem[];
}

export default function DrinksMenuModal({
  isOpen,
  onClose,
  eventName = "DAWG NIGHT",
  venueName = "Mónaco Nightclub",
  drinks: propDrinks,
}: DrinksMenuModalProps) {
  const drinksList = propDrinks && propDrinks.length > 0 ? propDrinks : DRINKS_LIST;

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="drinks-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4"
          style={{ backdropFilter: "blur(28px)", background: "rgba(0,0,0,0.88)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col rounded-[32px] bg-[#060606] border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.95)]"
          >
            {/* Header */}
            <div className="relative p-6 sm:p-8 border-b border-white/[0.06] flex items-start justify-between bg-gradient-to-b from-zinc-900/40 to-transparent">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-[8px] font-black uppercase tracking-[0.25em] text-zinc-300">
                  Carta Oficial de Barra
                </span>
                <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-3">
                  Bar & Bebidas
                </h3>
              </div>

              <button
                onClick={onClose}
                type="button"
                aria-label="Cerrar modal de bebidas"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/60 text-zinc-400 hover:text-white hover:border-white/30 transition duration-200 cursor-pointer active:scale-90"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable drinks content */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 no-scrollbar">
              {/* Especiales de la Noche */}
              {drinksList.some((d) => d.category === "Cocteles Especiales") && (
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.35em] text-zinc-500 mb-4">
                    Especiales de la Noche
                  </p>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {drinksList
                      .filter((d) => d.category === "Cocteles Especiales")
                      .map((drink) => (
                        <div
                          key={drink.id || drink.name}
                          className="group relative overflow-hidden rounded-2xl border border-white/[0.1] bg-zinc-950/80 p-4 shadow-lg transition-all duration-300 hover:border-white/30 hover:bg-white/[0.03]"
                        >
                          {drink.badge && (
                            <div className="inline-flex items-center rounded-full border border-white/20 bg-white/[0.06] px-2.5 py-0.5 text-[7px] font-black uppercase tracking-wider text-zinc-200 mb-2">
                              {drink.badge}
                            </div>
                          )}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-sm font-black uppercase text-white tracking-wide">
                                {drink.name}
                              </h4>
                              {drink.description && (
                                <p className="text-[9px] font-medium text-zinc-400 mt-1 leading-relaxed">
                                  {drink.description}
                                </p>
                              )}
                            </div>
                            <span className="shrink-0 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-black text-white backdrop-blur-md">
                              {drink.price}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Botellas & Servicio de Mesa */}
              {drinksList.some((d) => d.category === "Botellas") && (
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.35em] text-zinc-500 mb-4">
                    Botellas & Servicio de Mesa (750ml)
                  </p>

                  <div className="space-y-2.5">
                    {drinksList
                      .filter((d) => d.category === "Botellas")
                      .map((drink) => (
                        <div
                          key={drink.id || drink.name}
                          className="group flex items-center justify-between rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3.5 transition-all duration-300 hover:border-white/[0.18] hover:bg-white/[0.05]"
                        >
                          <div className="min-w-0 flex-1 pr-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] sm:text-xs font-black text-white uppercase tracking-wide truncate">
                                {drink.name}
                              </span>
                              {drink.badge && (
                                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[7px] font-black uppercase tracking-wider text-zinc-400">
                                  {drink.badge}
                                </span>
                              )}
                            </div>
                            {drink.description && (
                              <p className="text-[8px] sm:text-[9px] font-medium text-zinc-500 mt-0.5 truncate">
                                {drink.description}
                              </p>
                            )}
                          </div>
                          <span className="shrink-0 text-xs sm:text-sm font-black text-white">
                            {drink.price}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer CTA */}
            <div className="p-4 sm:p-6 border-t border-white/[0.06] bg-[#040404] flex items-center justify-between">
              <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">
                Venta exclusiva dentro del Local
              </span>
              <button
                type="button"
                onClick={onClose}
                className="h-10 px-6 rounded-full border border-white/15 bg-white/5 text-[9px] font-black uppercase tracking-[0.2em] text-white hover:bg-white hover:text-black transition duration-300 cursor-pointer active:scale-95"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
