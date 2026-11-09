"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import styles from "./FourgoDJScreen.module.css";

export default function FourgoDJScreen({ variant = "hero" }: { variant?: "hero" | "events" }) {
  const screenRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const manuallyPaused = useRef(false);
  const manuallyStarted = useRef(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);

  useEffect(() => {
    const screen = screenRef.current;
    const video = videoRef.current;
    if (!screen || !video) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = screen.getBoundingClientRect().top < window.innerHeight;
    const syncPlayback = () => {
      if (!inView || document.hidden || manuallyPaused.current || (reducedMotion.matches && !manuallyStarted.current)) video.pause();
      else void video.play().catch(() => {});
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      syncPlayback();
    }, { threshold: .15 });
    observer.observe(screen);
    document.addEventListener("visibilitychange", syncPlayback);
    reducedMotion.addEventListener("change", syncPlayback);
    video.volume = .6;
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
    manuallyPaused.current = false;
    manuallyStarted.current = true;
    void video.play().catch(() => {
      video.muted = true;
      setIsMuted(true);
    });
  };

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) playVideo();
    else { manuallyPaused.current = true; video.pause(); }
  };

  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
    if (!video.muted && video.paused) playVideo();
  };

  return (
    <div ref={screenRef} className={`${styles.frame} ${variant === "events" ? styles.events : ""}`} data-fourgo-dj-screen data-playing={isPlaying}>
      <div className={styles.window}>
        <video
          ref={videoRef}
          className={styles.video}
          poster="/videos/4go-home-radio-poster.webp?v=four-go-title"
          width={720}
          height={1280}
          muted={isMuted}
          loop
          playsInline
          preload="metadata"
          disablePictureInPicture
          aria-label="Sesión de DJ en 4go"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onVolumeChange={(event) => setIsMuted(event.currentTarget.muted)}
          onError={() => setHasVideoError(true)}
          onLoadedData={() => setHasVideoError(false)}
        >
          <source src="/videos/4go-home-radio-hq.mp4?v=crisp" type="video/mp4" media="(min-width: 1024px)" />
          <source src="/videos/4go-home-radio.mp4?v=four-go-title" type="video/mp4" />
        </video>
        <div className={styles.topLabel} aria-hidden="true"><span />4go sessions</div>
        <div className={styles.controls}>
          <button type="button" onClick={togglePlayback} aria-label={isPlaying ? "Pausar video" : "Reproducir video"} title={isPlaying ? "Pausar video" : "Reproducir video"}>
            {isPlaying ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
          </button>
          <button type="button" className={styles.volume} onClick={toggleSound} aria-label={isMuted ? "Activar sonido del video" : "Silenciar video"} aria-pressed={!isMuted} title={isMuted ? "Activar sonido del video" : "Silenciar video"}>
            {isMuted ? <VolumeX size={19} aria-hidden="true" /> : <Volume2 size={19} aria-hidden="true" />}
          </button>
        </div>
        {hasVideoError && <p className={styles.status} role="status">La sesión volverá a sonar pronto.</p>}
      </div>
    </div>
  );
}
