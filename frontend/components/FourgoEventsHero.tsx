"use client";

import { useRef } from "react";
import { MapPin, Sparkles } from "lucide-react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import FourgoDJScreen from "./FourgoDJScreen";
import styles from "./FourgoEventsHero.module.css";

gsap.registerPlugin(useGSAP);

export default function FourgoEventsHero() {
  const heroRef = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo("[data-events-enter]", { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .5, stagger: .06, ease: "power3.out" });
      gsap.to("[data-events-float]", { y: -10, rotation: 8, duration: 1.9, repeat: 1, yoyo: true, ease: "sine.inOut" });
    });
    return () => media.revert();
  }, { scope: heroRef });

  return (
    <div ref={heroRef} className={styles.hero} data-fourgo-events-hero>
      <div className={styles.copy}>
        <p className={styles.eyebrow} data-events-enter><MapPin size={12} aria-hidden="true" />Loja, Ecuador</p>
        <h1 data-events-enter>Eventos<Sparkles className={styles.headingStar} size={22} aria-hidden="true" /></h1>
        <p className={styles.description} data-events-enter>Tu próximo buen plan, aquí.</p>
      </div>
      <div className={styles.visual} data-events-enter>
        <div className={styles.orbit} aria-hidden="true" />
        <div className={styles.record} data-events-float aria-hidden="true"><span /></div>
        <Sparkles className={styles.spark} data-events-float size={31} aria-hidden="true" />
        <FourgoDJScreen variant="events" />
      </div>
    </div>
  );
}
