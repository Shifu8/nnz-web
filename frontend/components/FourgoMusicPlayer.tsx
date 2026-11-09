"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Volume2, VolumeX } from "lucide-react";
import styles from "./FourgoMusicPlayer.module.css";

export default function FourgoMusicPlayer() {
  const pathname = usePathname();
  const hasInlineScreen = pathname === "/" || /^\/(events?|shows|storm)(\/|$)/.test(pathname);
  const audioRef = useRef<HTMLAudioElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const autoplayPending = useRef(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasAudioError, setHasAudioError] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || hasInlineScreen) return;

    let disposed = false;
    autoplayPending.current = true;
    audio.volume = 0.6;

    const removeListeners = () => {
      document.removeEventListener("pointerdown", startMusic, true);
      document.removeEventListener("touchend", startMusic, true);
      document.removeEventListener("keydown", startMusic, true);
    };
    const onStarted = () => {
      autoplayPending.current = false;
      removeListeners();
      setIsPlaying(true);
      setHasAudioError(false);
    };
    function startMusic(event?: globalThis.Event) {
      if (!audio || !autoplayPending.current) return;
      // Let the music button handle its own click without toggling twice.
      if (event?.target instanceof Node && toggleRef.current?.contains(event.target)) return;

      void audio.play().then(() => {
        // Native autoplay may begin before React attaches its event handlers.
        if (!disposed && !audio.paused) onStarted();
      }).catch((error: unknown) => {
        if (disposed) return;
        if (error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "AbortError")) return;
        autoplayPending.current = false;
        removeListeners();
        setHasAudioError(true);
      });
    }

    audio.addEventListener("play", onStarted);
    document.addEventListener("pointerdown", startMusic, { capture: true, passive: true });
    document.addEventListener("touchend", startMusic, { capture: true, passive: true });
    document.addEventListener("keydown", startMusic, true);
    startMusic();

    return () => {
      disposed = true;
      removeListeners();
      audio.removeEventListener("play", onStarted);
      audio.pause();
    };
  }, [hasInlineScreen]);

  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;
    autoplayPending.current = false;
    if (!audio.paused) {
      audio.pause();
      return;
    }

    setHasAudioError(false);
    if (audio.error) audio.load();
    audio.volume = 0.6;
    void audio.play().catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setIsPlaying(false);
      setHasAudioError(true);
    });
  };

  const label = hasAudioError ? "Reintentar activar música" : isPlaying ? "Desactivar música" : "Activar música";

  if (hasInlineScreen) return null;

  return (
    <>
      <audio
        ref={audioRef}
        src="/audio/4go-home-radio.m4a"
        autoPlay
        loop
        preload="auto"
        hidden
        onPlay={() => { setIsPlaying(true); setHasAudioError(false); }}
        onPause={() => setIsPlaying(false)}
        onError={() => { setIsPlaying(false); setHasAudioError(true); }}
      />
      <button
        ref={toggleRef}
        type="button"
        className={styles.toggle}
        onClick={toggleMusic}
        aria-label={label}
        aria-pressed={isPlaying}
        title={label}
      >
        {isPlaying ? <Volume2 size={20} aria-hidden="true" /> : <VolumeX size={20} aria-hidden="true" />}
        {hasAudioError && <span className="sr-only" role="status">No se pudo reproducir la música. Vuelve a intentarlo.</span>}
      </button>
    </>
  );
}
