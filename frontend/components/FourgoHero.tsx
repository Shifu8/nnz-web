"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useFourgoNavigation } from "./FourgoPageTransition";
import FourgoDJScreen from "./FourgoDJScreen";
import styles from "./FourgoHero.module.css";

export default function FourgoHero() {
  const navigate = useFourgoNavigation();

  return (
    <section className={`fourgo-hero ${styles.hero}`} aria-label="4go, música y eventos en Loja">
      <Image src="/images/fourgo-retro-hero.webp" alt="" fill priority sizes="100vw" className={styles.backdrop} />
      <div className={styles.stage}>
        <div className={styles.copy}>
          <h1>4go</h1>
          <p>Música, cultura,<br />fiestas y más<br />en un solo lugar.</p>
          <Link href="/events" className={styles.cta} onClick={(event) => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            navigate("/events");
          }}>
            Ver eventos <ArrowRight size={25} aria-hidden="true" />
          </Link>
          <a className={styles.instagram} href="https://www.instagram.com/4go.ec/" target="_blank" rel="noopener noreferrer">@4go.ec</a>
        </div>
        <FourgoDJScreen />
      </div>
      <svg className={styles.wave} viewBox="0 0 1440 70" preserveAspectRatio="none" aria-hidden="true"><path d="M0 42C190 61 350 4 550 27S850 59 1060 26 1260 24 1440 42V70H0Z" fill="#fff5e2" /><path d="M0 42C190 61 350 4 550 27S850 59 1060 26 1260 24 1440 42" fill="none" stroke="#bca48d" strokeWidth="1" /></svg>
    </section>
  );
}
