"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowUpRight, Pause, Play } from "lucide-react";
import type { Event } from "@/frontend/types/domain";
import styles from "./FourgoEventMarquees.module.css";

interface FourgoEventMarqueesProps {
  events: Event[];
  onSelectEvent: (event: Event) => void;
  compact?: boolean;
}

export default function FourgoEventMarquees({ events, onSelectEvent, compact = false }: FourgoEventMarqueesProps) {
  const [isPaused, setIsPaused] = useState(false);
  const featured = events.slice(0, 12);

  if (featured.length === 0) return null;

  // Identical groups keep the loop seamless, including with a small catalogue.
  const cards = Array.from({ length: Math.max(8, featured.length) }, (_, index) => featured[index % featured.length]);

  return (
    <section className={`${styles.section}${compact ? ` ${styles.compact}` : ""}`} aria-label="Carruseles de eventos destacados" data-paused={isPaused}>
      <div className={styles.header}>
        <p>En el radar <span aria-hidden="true">↗</span></p>
        <button
          type="button"
          className={styles.pause}
          onClick={() => setIsPaused((paused) => !paused)}
          aria-label={isPaused ? "Reanudar carruseles" : "Pausar carruseles"}
          aria-pressed={isPaused}
          title={isPaused ? "Reanudar carruseles" : "Pausar carruseles"}
        >
          {isPaused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
        </button>
      </div>
      {["right", "left"].map((direction, row) => (
        <div key={direction} className={styles.row} data-direction={direction}>
          <div className={styles.track}>
            {[0, 1].map((copy) => (
              <div key={copy} className={styles.group} aria-hidden={copy === 1 ? true : undefined}>
                {cards.map((_, index) => {
                  const event = cards[(index + row * Math.ceil(cards.length / 2)) % cards.length];
                  return (
                    <button
                      key={`${event.id}-${index}`}
                      type="button"
                      className={styles.card}
                      onClick={() => onSelectEvent(event)}
                      tabIndex={copy === 1 ? -1 : 0}
                      aria-label={`Ver evento ${event.title}, ${event.dateLabel}, ${event.city}`}
                    >
                      <div className={styles.artwork}>
                        <Image
                          src={event.poster || "/images/now4go-hero-presentation-hd-v3.png"}
                          alt=""
                          fill
                          sizes={compact ? "56px" : "(max-width: 767px) 150px, 230px"}
                          className={styles.poster}
                          draggable={false}
                        />
                        {event.isDemo && <span className={styles.badge}>Ejemplo</span>}
                      </div>
                      <div className={styles.info}>
                        <span className={styles.title}>{event.title}</span>
                        <span className={styles.details}>{event.dateLabel} · {event.city}</span>
                        <ArrowUpRight size={17} className={styles.arrow} aria-hidden="true" />
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
