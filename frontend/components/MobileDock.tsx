/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * DescripciÃ³n: Floating dock mobile con navegaciÃ³n glassmorphism.
 */

"use client";

import { CalendarDays, Gem, Home, ScanLine, Shirt } from "lucide-react";

const items = [
  { href: "#home", icon: Home, label: "Inicio" },
  { href: "#events", icon: CalendarDays, label: "Eventos" },
  { href: "#merch", icon: Shirt, label: "Merch" },
  { href: "#claim", icon: ScanLine, label: "Pass" },
  { href: "#access", icon: Gem, label: "VIP" },
];

export default function MobileDock() {
  return (
    <nav className="fixed inset-x-3 bottom-4 z-50 mx-auto max-w-md rounded-[28px] border border-white/12 bg-black/45 px-3 py-3 shadow-[0_0_45px_rgba(255,0,24,.25)] backdrop-blur-2xl md:hidden">
      <div className="grid grid-cols-5 gap-1">
        {items.map(({ href, icon: Icon, label }) => (
          <a key={href} href={href} className="group flex h-12 items-center justify-center rounded-2xl text-zinc-400 transition hover:bg-red-500/15 hover:text-white">
            <Icon className="h-5 w-5 transition group-hover:scale-110" />
            <span className="sr-only">{label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}
