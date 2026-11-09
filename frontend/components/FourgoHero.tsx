"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";

export default function FourgoHero({ onExplore }: { onExplore: () => void }) {
  const heroRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasVideoError, setHasVideoError] = useState(false);

  useEffect(() => {
    const hero = heroRef.current;
    const video = videoRef.current;
    if (!hero || !video) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = hero.getBoundingClientRect().bottom > 0;
    const syncPlayback = () => {
      if (!inView || document.hidden || reducedMotion.matches) {
        video.pause();
      } else {
        void video.play().catch(() => {});
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      syncPlayback();
    }, { threshold: 0.15 });

    observer.observe(hero);
    document.addEventListener("visibilitychange", syncPlayback);
    reducedMotion.addEventListener("change", syncPlayback);
    syncPlayback();
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", syncPlayback);
      reducedMotion.removeEventListener("change", syncPlayback);
      video.pause();
    };
  }, []);

  return (
    <section ref={heroRef} className="fourgo-hero" aria-label="4go, eventos y experiencias">
      <video
        ref={videoRef}
        className="fourgo-hero__video"
        src="/videos/4go-home-radio.mp4?v=four-go-title"
        poster="/videos/4go-home-radio-poster.webp?v=four-go-title"
        width={720}
        height={1280}
        muted
        loop
        playsInline
        preload="metadata"
        disablePictureInPicture
        aria-hidden="true"
        onError={() => setHasVideoError(true)}
        onLoadedData={() => setHasVideoError(false)}
      />
      <h1 className="sr-only">4go · Eventos y experiencias</h1>
      <div className="fourgo-hero__bottom">
        <button type="button" onClick={onExplore} className="fourgo-hero__cta">Ver eventos <ArrowUpRight size={18} /></button>
        <button type="button" onClick={onExplore} aria-label="Bajar a los eventos" className="fourgo-hero__down"><ArrowDown size={17} /></button>
        {hasVideoError && <p className="fourgo-hero__status" role="status">El video no está disponible en este momento.</p>}
      </div>
    </section>
  );
}
