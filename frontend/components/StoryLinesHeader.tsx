"use client";

import React from "react";

export interface StoryScreen {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface StoryLinesHeaderProps {
  screens: StoryScreen[];
  activeScreen: number;
  onSelectScreen: (index: number) => void;
}

export default function StoryLinesHeader({
  screens,
  activeScreen,
  onSelectScreen,
}: StoryLinesHeaderProps) {
  return (
    <div className="w-full flex flex-col items-center select-none z-30">
      {/* ─── TOP STORIES-STYLE PROGRESS SEGMENT LINES (Directly floating on top of photo) ─── */}
      <div className="w-full flex items-center justify-between gap-1.5 py-0.5">
        {screens.map((screen, idx) => {
          const isActive = idx === activeScreen;

          return (
            <button
              key={`story-line-${screen.id}`}
              type="button"
              onClick={() => onSelectScreen(idx)}
              aria-label={`Ir a pantalla ${screen.label}`}
              aria-current={isActive ? "page" : undefined}
              title={screen.label}
              className="flex-1 py-1.5 group cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white border-none"
            >
              {/* Line Bar Container */}
              <div className="story-line-track relative h-1.5 w-full rounded-full bg-white/25 overflow-hidden transition-colors duration-300 group-hover:bg-white/40">
                <div
                  style={{
                    width: isActive ? "100%" : "0%",
                    opacity: isActive ? 1 : 0,
                  }}
                  className="story-line-fill h-full rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] transition-[width,opacity] duration-300 ease-out"
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
