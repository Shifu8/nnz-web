"use client";

import { useRef } from "react";
import { MapPin } from "lucide-react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import FourgoCreatorFriends from "./FourgoCreatorFriends";
import styles from "./FourgoEventsHero.module.css";

gsap.registerPlugin(useGSAP);

export default function FourgoEventsHero() {
  const heroRef = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.timeline({ defaults: { duration: .65, ease: "power3.out" } })
        .from("[data-events-enter]", { y: 25, opacity: 0, stagger: .08 }, .15)
        .from("[data-creator-character]", { y: 35, rotation: -7, opacity: 0, stagger: .12, ease: "back.out(1.4)" }, .25)
        .from("[data-creator-sparkle]", { scale: 0, rotation: -30, ease: "back.out(1.6)" }, .5);
    });
    return () => media.revert();
  }, { scope: heroRef });

  return (
    <div ref={heroRef} className={styles.hero} data-fourgo-events-hero>
      <div className={styles.copy}>
        <p className={styles.eyebrow} data-events-enter><MapPin size={12} aria-hidden="true" />Loja, Ecuador</p>
        <h1 data-events-enter><span>Eventos</span><span className={styles.headingStar} aria-hidden="true">✳</span></h1>
        <p className={styles.description} data-events-enter>Tu próximo buen plan empieza aquí.</p>
      </div>
      <div className={styles.visual}>
        <FourgoCreatorFriends />
      </div>
    </div>
  );
}
