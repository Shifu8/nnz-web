"use client";

import React, { useEffect, useState, useRef } from "react";
import { X } from "lucide-react";
import { gsap } from "gsap";

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
    id: "cuba-eleva",
    name: "Cuba Elevá",
    category: "Cocteles Especiales",
    price: "$15",
    description: "Ron dorado, cola premium, toque de lima e infusión secreta NENEZ.",
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
  const [isClosing, setIsClosing] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Trigger single smooth GSAP entrance animation when isOpen changes to true
  useEffect(() => {
    if (isOpen && !isClosing && modalRef.current && backdropRef.current) {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      gsap.killTweensOf([modalRef.current, backdropRef.current]);
      
      gsap.fromTo(
        backdropRef.current,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: reduceMotion ? 0 : 0.24, ease: "power2.out" }
      );

      gsap.fromTo(
        modalRef.current,
        {
          opacity: 0,
          y: 18,
          scale: reduceMotion ? 1 : 1.14,
          filter: reduceMotion ? "none" : "blur(8px)",
          transformOrigin: "center bottom",
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: reduceMotion ? 0 : 0.48,
          ease: "power3.out",
        }
      );
    }
  }, [isOpen]);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (!isOpen && !isClosing) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isClosing]);

  // Handle GSAP exit animation (identical to AIChatbot)
  const handleClose = () => {
    if (isClosing) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !modalRef.current || !backdropRef.current) {
      setIsClosing(false);
      onClose();
      return;
    }

    setIsClosing(true);
    gsap.killTweensOf([modalRef.current, backdropRef.current]);

    gsap.to(backdropRef.current, {
      autoAlpha: 0,
      duration: 0.24,
      ease: "power2.inOut",
    });

    gsap.to(modalRef.current, {
      opacity: 0,
      y: 18,
      scale: 0.82,
      filter: "blur(8px)",
      transformOrigin: "center bottom",
      duration: 0.34,
      ease: "power3.in",
      onComplete: () => {
        setIsClosing(false);
        onClose();
      },
    });
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-black/80 backdrop-blur-md sm:backdrop-blur-lg"
        onClick={handleClose}
      />

      {/* Modal Container */}
      <div
        ref={modalRef}
        className="relative w-full max-w-[600px] max-h-[88vh] sm:max-h-[85vh] overflow-hidden flex flex-col rounded-t-[28px] sm:rounded-[32px] bg-[#060606] border border-white/10 shadow-[0_25px_80px_rgba(0,0,0,0.9)] z-10"
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
            onClick={handleClose}
            type="button"
            aria-label="Cerrar modal de bebidas"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/60 text-zinc-400 hover:text-white hover:border-white/30 transition-all duration-300 cursor-pointer active:scale-90"
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

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-1">
                {drinksList
                  .filter((d) => d.category === "Cocteles Especiales")
                  .map((drink) => (
                    <div
                      key={drink.id || drink.name}
                      className="group relative overflow-hidden rounded-2xl border border-pink-500/40 bg-gradient-to-br from-pink-950/40 via-zinc-950 to-black p-5 shadow-[0_0_35px_rgba(225,0,117,0.22)] transition-all duration-500 hover:border-pink-500/70 hover:shadow-[0_0_55px_rgba(225,0,117,0.45)]"
                    >
                      {/* Subtle ambient light sweep behind */}
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(225,0,117,0.28),transparent_65%)] pointer-events-none" />
                      
                      <div className="relative z-10 flex flex-col gap-2">
                        {drink.badge && (
                          <div className="self-start inline-flex items-center gap-1.5 rounded-full border border-pink-400/50 bg-pink-950/80 px-3 py-1 text-[7.5px] font-black uppercase tracking-[0.2em] text-pink-200 shadow-[0_0_18px_rgba(225,0,117,0.4)]">
                            <span className="h-1.5 w-1.5 rounded-full bg-pink-400 animate-pulse" />
                            {drink.badge}
                          </div>
                        )}

                        <div className="flex items-start justify-between gap-3 mt-1">
                          <div>
                            <h4 className="text-base font-black uppercase text-white tracking-wide group-hover:text-pink-100 transition-colors">
                              {drink.name}
                            </h4>
                            {drink.description && (
                              <p className="text-[10px] font-bold text-zinc-300 mt-1 leading-relaxed">
                                {drink.description}
                              </p>
                            )}
                          </div>
                          <span className="shrink-0 rounded-full border border-pink-300/60 bg-gradient-to-r from-pink-600 via-pink-500 to-rose-500 px-4 py-1.5 text-xs font-black text-white shadow-[0_0_22px_rgba(225,0,117,0.55)] tracking-wide">
                            {drink.price}
                          </span>
                        </div>
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
            onClick={handleClose}
            className="h-10 px-6 rounded-full border border-white/15 bg-white/5 text-[9px] font-black uppercase tracking-[0.2em] text-white hover:bg-white hover:text-black transition-all duration-300 cursor-pointer active:scale-95"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
