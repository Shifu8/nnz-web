"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Pause, Play, Volume2, VolumeX } from "lucide-react";
import styles from "./PartnerCreateIntro.module.css";

interface PartnerCreateIntroProps {
  step: 1 | 2 | 3;
  canEditProfile: boolean;
  canCreateEvent: boolean;
  hasPublishedEvent: boolean;
  onSelectStep: (step: 1 | 2 | 3) => void;
}

const STEPS = [
  { number: 1, label: "Tu cuenta Partner" },
  { number: 2, label: "Crea tu evento" },
  { number: 3, label: "Publica" },
] as const;

export default function PartnerCreateIntro({ step, canEditProfile, canCreateEvent, hasPublishedEvent, onSelectStep }: PartnerCreateIntroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      if (!video) return;
      if (media.matches) video.pause();
      else video.play().catch(() => setIsPlaying(false));
    };
    update();
    media.addEventListener("change", update);
    return () => {
      media.removeEventListener("change", update);
      video?.pause();
    };
  }, []);

  const toggleVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => setIsPlaying(false));
    else video.pause();
  };

  return (
    <section className={styles.intro} aria-labelledby="partner-intro-title">
      <div className={styles.hero}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>TU IDEA MERECE UN ESCENARIO <ArrowUpRight size={15} aria-hidden="true" /></p>
          <h1 id="partner-intro-title" aria-label="Eleva tu cuenta a Partner 4GO"><span>Eleva tu</span><span>cuenta a</span><span className={styles.brand}>Partner 4GO<span className={styles.asterisk} aria-hidden="true">✳</span></span></h1>
          <p className={styles.description}>Crea tus eventos, vende entradas y reúne a tu gente.</p>
        </div>

        <figure className={styles.visual}>
          <span className={styles.sticker} aria-hidden="true">EL PRÓXIMO<br />PLAN ES TUYO ↗</span>
          <div className={styles.videoFrame}>
            <video
              ref={videoRef}
              loop
              muted={isMuted}
              playsInline
              poster="/videos/partner-create-poster.jpg"
              preload="metadata"
              width={720}
              height={1280}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              aria-label="Personas bailando y disfrutando de un evento"
            >
              <source media="(min-width: 768px)" src="/videos/subir_evento_left_video.mp4" type="video/mp4" />
              <source src="/videos/subir_evento_left_video_mobile.mp4" type="video/mp4" />
            </video>
            <div className={styles.controls}>
              <button type="button" onClick={toggleVideo} aria-label={isPlaying ? "Pausar video" : "Reproducir video"}>
                {isPlaying ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
              </button>
              <button type="button" onClick={() => setIsMuted((muted) => !muted)} aria-label={isMuted ? "Activar sonido del video" : "Silenciar video"} aria-pressed={!isMuted}>
                {isMuted ? <VolumeX size={16} aria-hidden="true" /> : <Volume2 size={16} aria-hidden="true" />}
              </button>
            </div>
          </div>
          <figcaption>Así empiezan los buenos recuerdos.</figcaption>
        </figure>
      </div>

      <ol className={styles.steps} aria-label="Pasos para publicar tu evento">
        {STEPS.map(({ number, label }) => {
          const available = number === 1 ? canEditProfile : number === 2 ? canCreateEvent : hasPublishedEvent;
          return (
            <li key={number} data-current={step === number}>
              <button type="button" disabled={!available} aria-current={step === number ? "step" : undefined} onClick={() => onSelectStep(number)}>
                <span className={styles.stepNumber}>{number.toString().padStart(2, "0")}</span>
                <span>{label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
