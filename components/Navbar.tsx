"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const NAV_ITEMS = [
  { label: "Inicio", href: "/" },
  { label: "Tienda", href: "/#merch" },
  { label: "Giveaway", href: "/giveaway" },
  { label: "Acceso", href: "/#access" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-[1600px] w-full items-center justify-between px-6 md:px-12 lg:px-16 py-4">
        <Link href="/" className="text-sm font-black tracking-[0.38em] text-white uppercase outline-none select-none transition hover:text-red-400">
          DAWGS
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-400 hover:text-white transition-all duration-300"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-full bg-white/5 p-2 border border-white/10 text-white md:hidden hover:bg-white/10 active:scale-95 transition"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden border-t border-white/10 bg-black/95 backdrop-blur-3xl">
          <div className="flex flex-col gap-4 px-6 py-6">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="text-lg font-black uppercase tracking-[0.3em] text-zinc-400 hover:text-white transition"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
