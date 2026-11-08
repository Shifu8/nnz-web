"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { Menu, Plus, Search } from "lucide-react";

export function FourgoWordmark({ onActivate }: { onActivate: () => void }) {
  return (
    <button
      type="button"
      className="fourgo-wordmark"
      aria-label="4go, ir al inicio"
      onClick={(event) => { event.stopPropagation(); onActivate(); }}
    >
      <Image src="/images/4go-balloon-wordmark.webp" alt="4go" width={112} height={53} priority />
    </button>
  );
}

interface FourgoHeaderActionsProps {
  onCreate?: () => void;
  onSearch?: () => void;
  onMenu: () => void;
  menuOpen?: boolean;
  searchOpen?: boolean;
  children?: ReactNode;
}

export function FourgoHeaderActions({ onCreate, onSearch, onMenu, menuOpen = false, searchOpen = false, children }: FourgoHeaderActionsProps) {
  return (
    <div className="fourgo-nav__actions relative flex shrink-0 flex-row items-center gap-2 sm:gap-2.5">
      <button
        type="button"
        onClick={(event) => { event.stopPropagation(); onCreate?.(); }}
        className="fourgo-nav__publish flex h-10 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border border-white/20 bg-white/10 px-3.5 text-xs font-bold text-white shadow-lg backdrop-blur-xl transition-all hover:bg-white/20 active:scale-95 sm:px-4 sm:text-sm"
        aria-label="Crear evento"
      >
        <Plus className="h-4 w-4 stroke-[2.5]" />
        <span>Crear</span>
      </button>
      <button
        type="button"
        onClick={(event) => { event.stopPropagation(); onSearch?.(); }}
        className="fourgo-nav__icon flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-lg backdrop-blur-xl transition-all hover:bg-white/20 active:scale-95"
        aria-label="Buscar eventos"
        aria-expanded={searchOpen}
      >
        <Search className="h-5 w-5" />
      </button>
      <div className="relative flex items-center justify-center">
        <button
          type="button"
          onClick={(event) => { event.stopPropagation(); onMenu(); }}
          className="fourgo-nav__menu relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-white/20 bg-zinc-800/90 text-white shadow-lg backdrop-blur-xl transition-all hover:bg-zinc-700/90 active:scale-95"
          aria-label="Abrir menú"
          aria-expanded={menuOpen}
        >
          <Menu className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>
  );
}
