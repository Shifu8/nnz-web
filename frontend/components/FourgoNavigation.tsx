"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { FourgoHeaderActions, FourgoWordmark } from "@/frontend/components/FourgoHeaderControls";
import StoryLinesHeader, { type StoryScreen } from "@/frontend/components/StoryLinesHeader";
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
}

export default function FourgoNavigation({ screens, activeScreen, onSelectScreen, onPublish, onSearch, onProfile, profileOpen, searchOpen, menu }: FourgoNavigationProps) {
  const headerRef = useRef<HTMLElement>(null);
  const [hasScrolledPastHero, setHasScrolledPastHero] = useState(false);
  const showWordmark = activeScreen !== 1 || hasScrolledPastHero;

  useEffect(() => {
    setHasScrolledPastHero(false);
    if (activeScreen !== 1) return;
    const hero = document.querySelector(".fourgo-hero");
    if (!hero) return;

    let observer: IntersectionObserver | undefined;
    const observeHero = () => {
      observer?.disconnect();
      const headerBottom = Math.ceil(headerRef.current?.getBoundingClientRect().bottom ?? 0) + 16;
      observer = new IntersectionObserver(([entry]) => {
        setHasScrolledPastHero(entry.boundingClientRect.bottom <= headerBottom);
      }, { rootMargin: `-${headerBottom}px 0px 0px 0px`, threshold: 0 });
      observer.observe(hero);
    };

    observeHero();
    window.addEventListener("resize", observeHero);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", observeHero);
    };
  }, [activeScreen]);

  return (
    <header ref={headerRef} className={`fourgo-header ${searchOpen ? "fourgo-header--search" : ""}`}>
      <div className="fourgo-header__stories">
        <StoryLinesHeader screens={screens} activeScreen={activeScreen} onSelectScreen={onSelectScreen} />
      </div>
      <div className="fourgo-nav">
        <div className={`${styles.wordmark} ${showWordmark ? styles.visible : ""}`} aria-hidden={!showWordmark} inert={!showWordmark}>
          <FourgoWordmark onActivate={() => onSelectScreen(1)} />
        </div>
        <FourgoHeaderActions onCreate={onPublish} onSearch={onSearch} onMenu={onProfile} menuOpen={profileOpen} searchOpen={searchOpen}>
          {menu}
        </FourgoHeaderActions>
      </div>
    </header>
  );
}
