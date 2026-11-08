"use client";

import type { ReactNode } from "react";
import { FourgoHeaderActions, FourgoWordmark } from "@/frontend/components/FourgoHeaderControls";
import StoryLinesHeader, { type StoryScreen } from "@/frontend/components/StoryLinesHeader";

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
  return (
    <header className={`fourgo-header ${searchOpen ? "fourgo-header--search" : ""}`}>
      <div className="fourgo-header__stories">
        <StoryLinesHeader screens={screens} activeScreen={activeScreen} onSelectScreen={onSelectScreen} />
      </div>
      <div className="fourgo-nav">
        <FourgoWordmark onActivate={() => onSelectScreen(1)} />
        <FourgoHeaderActions onCreate={onPublish} onSearch={onSearch} onMenu={onProfile} menuOpen={profileOpen} searchOpen={searchOpen}>
          {menu}
        </FourgoHeaderActions>
      </div>
    </header>
  );
}
