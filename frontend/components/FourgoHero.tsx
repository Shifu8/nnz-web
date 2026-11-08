"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUpRight, Pause, Play, Volume2, VolumeX } from "lucide-react";

export default function FourgoHero({ onExplore }: { onExplore: () => void }) {
  const heroRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const userPausedRef = useRef(false);
  const manualPlaybackRef = useRef(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);

  useEffect(() => {
    const hero = heroRef.current;
    const video = videoRef.current;
    if (!hero || !video) return;

    video.volume = 0.6;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = hero.getBoundingClientRect().bottom > 0;
    const syncPlayback = () => {
      if (!inView || document.hidden || userPausedRef.current || (reducedMotion.matches && !manualPlaybackRef.current)) {
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

  const playVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    userPausedRef.current = false;
    manualPlaybackRef.current = true;
    if (video.error) video.load();
    setHasVideoError(false);
    void video.play().catch(() => setIsPlaying(false));
  };

  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
    if (!video.muted) playVideo();
  };

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) playVideo();
    else {
      userPausedRef.current = true;
      video.pause();
    }
  };

  return (
    <section ref={heroRef} className="fourgo-hero" aria-label="4go, eventos y experiencias">
      <video
        ref={videoRef}
        className="fourgo-hero__video"
        src="/videos/4go-home-radio.mp4"
        poster="/videos/4go-home-radio-poster.webp"
        width={720}
        height={1280}
        muted={isMuted}
        loop
        playsInline
        preload="metadata"
        disablePictureInPicture
        aria-hidden="true"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onVolumeChange={(event) => setIsMuted(event.currentTarget.muted)}
        onError={() => { setHasVideoError(true); setIsPlaying(false); }}
        onLoadedData={() => setHasVideoError(false)}
      />
      <h1 className="sr-only">4go · Eventos y experiencias</h1>
      <div className="fourgo-hero__bottom">
        <div className="fourgo-hero__controls" role="group" aria-label="Controles del video">
          <button type="button" onClick={toggleSound} className="fourgo-hero__control" aria-label={isMuted ? "Activar música" : "Silenciar música"} aria-pressed={!isMuted}>
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            <span>{isMuted ? "Activar música" : "Silenciar"}</span>
          </button>
          <button type="button" onClick={togglePlayback} className="fourgo-hero__control" aria-label={isPlaying ? "Pausar video" : "Reproducir video"} aria-pressed={isPlaying}>
            {isPlaying ? <Pause size={15} /> : <Play size={15} />}
            <span>{isPlaying ? "Pausar" : "Reproducir"}</span>
          </button>
        </div>
        <button type="button" onClick={onExplore} className="fourgo-hero__cta">Ver eventos <ArrowUpRight size={18} /></button>
        <button type="button" onClick={onExplore} aria-label="Bajar a los eventos" className="fourgo-hero__down"><ArrowDown size={17} /></button>
        {hasVideoError && <p className="fourgo-hero__status" role="status">No se pudo cargar el video. Pulsa reproducir para volver a intentarlo.</p>}
      </div>
      <span className="fourgo-hero__side">4GO · ECUADOR</span>
    </section>
  );
}
