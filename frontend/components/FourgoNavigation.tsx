"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { ArrowUpRight, Search, User } from "lucide-react";
import StoryLinesHeader, { type StoryScreen } from "@/frontend/components/StoryLinesHeader";

interface FourgoNavigationProps {
  screens: StoryScreen[];
  activeScreen: number;
  onSelectScreen: (index: number) => void;
  onExplore: () => void;
  onSection: (section: string) => void;
  onPublish: () => void;
  onSearch: () => void;
  onProfile: () => void;
  loggedIn: boolean;
  profileOpen: boolean;
  searchOpen: boolean;
  menu: ReactNode;
}

export default function FourgoNavigation({ screens, activeScreen, onSelectScreen, onExplore, onSection, onPublish, onSearch, onProfile, loggedIn, profileOpen, searchOpen, menu }: FourgoNavigationProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 40);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header className={`fourgo-header ${scrolled || activeScreen === 0 ? "fourgo-header--solid" : ""} ${searchOpen ? "fourgo-header--search" : ""}`}>
      <div className="fourgo-header__stories">
        <StoryLinesHeader screens={screens} activeScreen={activeScreen} onSelectScreen={onSelectScreen} />
      </div>
      <div className="fourgo-nav">
        <button type="button" onClick={() => onSelectScreen(1)} aria-label="4go, ir al inicio" className="fourgo-wordmark">
          <Image src="/images/4go-balloon-wordmark.webp" alt="4go" width={112} height={53} priority />
        </button>
        <nav aria-label="Navegación principal" className="fourgo-nav__links">
          <button type="button" onClick={onExplore}>Eventos</button>
          <button type="button" onClick={() => onSection("experiencia")}>La experiencia</button>
          <button type="button" onClick={() => onSection("comprar-features-section")}>Cómo comprar</button>
        </nav>
        <div className="fourgo-nav__actions">
          <button type="button" onClick={onPublish} className="fourgo-nav__publish">Crear evento <ArrowUpRight size={15} /></button>
          <button type="button" onClick={onSearch} aria-label="Buscar eventos" aria-expanded={searchOpen} className="fourgo-nav__icon"><Search size={18} /></button>
          <div className="relative">
            <button type="button" onClick={onProfile} aria-label="Mi cuenta" aria-expanded={profileOpen} className="fourgo-nav__account"><User size={17} /><span>{loggedIn ? "Mi cuenta" : "Entrar"}</span></button>
            {menu}
          </div>
        </div>
      </div>
    </header>
  );
}
