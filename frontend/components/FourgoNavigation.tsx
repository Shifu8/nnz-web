"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Search, UserRound } from "lucide-react";
import { FourgoWordmark } from "@/frontend/components/FourgoHeaderControls";
import type { StoryScreen } from "@/frontend/components/StoryLinesHeader";
import { useFourgoNavigation } from "./FourgoPageTransition";
import styles from "./FourgoNavigation.module.css";

interface FourgoNavigationProps {
  screens: StoryScreen[];
  activeScreen: number;
  onSelectScreen: (index: number) => void;
  onPublish: () => void;
  onSearch: () => void;
  onProfile: () => void;
  profileOpen: boolean;
  searchOpen: boolean;
  menu: ReactNode;
  loggedIn?: boolean;
}

export default function FourgoNavigation({ activeScreen, onSelectScreen, onPublish, onSearch, onProfile, profileOpen, searchOpen, menu, loggedIn = false }: FourgoNavigationProps) {
  const [hasScrolled, setHasScrolled] = useState(false);
  const pathname = usePathname();
  const navigate = useFourgoNavigation();
  const isLanding = pathname === "/" && activeScreen === 1;

  useEffect(() => {
    const update = () => setHasScrolled(window.scrollY > 40);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header className={`fourgo-header ${styles.header} ${!isLanding ? styles.light : ""} ${hasScrolled ? styles.scrolled : ""} ${searchOpen ? "fourgo-header--search" : ""}`}>
      <div className={styles.bar}>
        <FourgoWordmark onActivate={() => {
          if (pathname === "/") { onSelectScreen(1); window.scrollTo({ top: 0, behavior: "smooth" }); }
          else navigate("/");
        }} />
        <nav className={styles.links} aria-label="Navegación principal">
          {[
            { label: "Eventos", href: "/events" },
            { label: "Agenda", href: "/events#eventos" },
            { label: "Lugares", href: "/venues" },
            { label: "Sobre 4GO", href: "/about" },
          ].map((link) => (
            <Link key={link.label} href={link.href} className={`${styles.link} ${link.label === "Eventos" ? styles.active : ""}`} onClick={(event) => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              navigate(link.href);
            }}>{link.label}</Link>
          ))}
        </nav>
        <div className={styles.actions}>
          <button type="button" className={styles.search} onClick={onSearch} aria-label="Buscar eventos" aria-expanded={searchOpen}>
            <Search size={20} aria-hidden="true" /><span>Buscar eventos...</span>
          </button>
          <button type="button" className={styles.create} onClick={onPublish} aria-label="Publicar evento" title="Publicar evento"><Plus size={20} aria-hidden="true" /></button>
          <div className={styles.account}>
            <button type="button" className={styles.login} onClick={onProfile} aria-expanded={profileOpen}>
              <UserRound size={20} aria-hidden="true" /><span>{loggedIn ? "Mi cuenta" : "Iniciar sesión"}</span>
            </button>
            {menu}
          </div>
        </div>
      </div>
    </header>
  );
}
