"use client";

import { useRef, type MouseEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { useFourgoNavigation } from "@/frontend/components/FourgoPageTransition";
import CreatorFriends from "@/frontend/components/FourgoCreatorFriends";
import styles from "./CreateEventWelcome.module.css";

gsap.registerPlugin(useGSAP);

export default function CreateEventWelcome() {
  const rootRef = useRef<HTMLElement>(null);
  const navigate = useFourgoNavigation();

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.timeline({ defaults: { duration: 0.7, ease: "power3.out" } })
        .from("[data-welcome-copy]", { y: 35, opacity: 0, stagger: 0.09 }, 0.2)
        .from("[data-creator-character]", { y: 70, opacity: 0, rotation: -8, stagger: 0.16, ease: "back.out(1.3)" }, 0.35)
        .from("[data-creator-sparkle]", { scale: 0, rotation: -45, ease: "back.out(1.6)" }, 0.65);
    });
    return () => media.revert();
  }, { scope: rootRef });

  const follow = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(href);
  };

  return (
    <main ref={rootRef} className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.wordmark} aria-label="4GO, ir al inicio" onClick={(event) => follow(event, "/")}>4go<span>®</span></Link>
        <Link href="/events" className={styles.back} onClick={(event) => follow(event, "/events")}><ArrowLeft size={16} aria-hidden="true" /> Volver a explorar</Link>
      </header>

      <section className={styles.hero} aria-labelledby="create-event-title">
        <div className={styles.copy}>
          <p className={styles.eyebrow} data-welcome-copy>DA VIDA A TU PRÓXIMA IDEA</p>
          <h1 id="create-event-title" className={styles.title} data-welcome-copy>
            <span>CREA <span className={styles.asterisk} aria-hidden="true">✳</span></span>
            <span className={styles.underlined}>EVENTOS</span>
            <span>HOY.</span>
          </h1>
          <p className={styles.description} data-welcome-copy>El próximo gran plan empieza contigo.</p>
          <div className={styles.action} data-welcome-copy>
            <Link href="/?action=create_event" className={styles.start} onClick={(event) => follow(event, "/?action=create_event")}>
              Empezar <ArrowUpRight size={23} strokeWidth={2.5} aria-hidden="true" />
            </Link>
            <p>Tu cuenta Partner 4GO, en unos pasos.</p>
          </div>
        </div>
        <CreatorFriends className={styles.friends} />
      </section>

      <footer className={styles.footer}><span>TÚ PONES LA IDEA. NOSOTROS, EL ESCENARIO.</span><span>PARTNER 4GO ↗</span></footer>
    </main>
  );
}
