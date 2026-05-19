/**
 * Autor: Brandon Medina
 * Fecha: 18/05/2026
 * Descripcion: Floating dock mobile glassmorphism con navegacion tipo app premium.
 */

"use client";

import { AudioLines, CalendarDays, Gift, Gem, Shirt } from "lucide-react";

export type MobileTab = "events" | "merch" | "services" | "giveaway" | "access";

type DockItem = {
  tab: MobileTab;
  icon: typeof CalendarDays;
  label: string;
};

const items: DockItem[] = [
  { tab: "events", icon: CalendarDays, label: "Eventos" },
  { tab: "merch", icon: Shirt, label: "Merch" },
  { tab: "services", icon: AudioLines, label: "Services" },
  { tab: "giveaway", icon: Gift, label: "Giveaway" },
  { tab: "access", icon: Gem, label: "Access" },
];

type MobileDockProps = {
  activeTab?: MobileTab;
  onTabChange?: (tab: MobileTab) => void;
};

export default function MobileDock({ activeTab, onTabChange }: MobileDockProps) {
  return (
    <nav className="fixed inset-x-3 bottom-4 z-[70] mx-auto max-w-md rounded-[28px] border border-white/12 bg-black/52 px-3 py-3 shadow-[0_0_55px_rgba(255,0,24,.25)] backdrop-blur-2xl md:hidden">
      <div className="grid grid-cols-5 gap-1">
        {items.map(({ tab, icon: Icon, label }) => {
          const isActive = activeTab === tab;

          return (
            <button
              key={tab}
              onClick={() => onTabChange?.(tab)}
              className={`group flex h-12 items-center justify-center rounded-2xl transition ${
                isActive
                  ? "bg-red-500/20 text-white shadow-[0_0_20px_rgba(255,0,24,.45)]"
                  : "text-zinc-400 hover:bg-red-500/12 hover:text-white"
              }`}
              aria-label={label}
            >
              <Icon className={`h-5 w-5 transition ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
            </button>
          );
        })}
      </div>
    </nav>
  );
}

