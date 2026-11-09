"use client";

import { useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import styles from "./FourgoMusicPlayer.module.css";

export default function FourgoMusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasAudioError, setHasAudioError] = useState(false);

  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;
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

  return (
    <>
      <audio
        ref={audioRef}
        src="/audio/4go-home-radio.m4a"
        loop
        preload="none"
        hidden
        onPlay={() => { setIsPlaying(true); setHasAudioError(false); }}
        onPause={() => setIsPlaying(false)}
        onError={() => { setIsPlaying(false); setHasAudioError(true); }}
      />
      <button
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
