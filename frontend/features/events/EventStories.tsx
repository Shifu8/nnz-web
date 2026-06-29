import React, { useEffect, useRef } from "react";
import { gsap } from "@/frontend/animations/gsapSetup";
import Image from "next/image";
import { getEvents } from "@/frontend/services/nenezData";

/**
 * Autor: Brandon Medina
 * Fecha: 18/05/2026
 * Descripción: Carrusel horizontal de eventos tipo stories para mobile con snap scrolling y animación GSAP.
 */
export default function EventStories() {
  const containerRef = useRef<HTMLDivElement>(null);
  const events = getEvents();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    gsap.fromTo(
      el.querySelectorAll(".story-card"),
      { xPercent: 100, opacity: 0 },
      {
        xPercent: 0,
        opacity: 1,
        stagger: 0.2,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: () => `+=${el.scrollWidth}`,
          scrub: true,
          pin: true,
          anticipatePin: 1,
          horizontal: true,
        },
      }
    );
  }, []);

  return (
    <section className="md:hidden py-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide">
      <div ref={containerRef} className="flex gap-4 px-4">
        {events.map((event) => (
          <div
            key={event.id}
            className="story-card min-w-full snap-center rounded-[24px] relative bg-black/80 backdrop-blur-xl border border-red-400/30 p-4 text-center"
          >
            <Image
              src={event.poster}
              alt={event.title}
              width={360}
              height={640}
              className="rounded-[16px] mb-4 object-cover w-full h-80 animate-pulse"
            />
            <h2 className="text-2xl font-black text-white drop-shadow-[0_0_8px_rgba(255,0,24,.8)]">
              {event.title}
            </h2>
            <p className="text-sm text-zinc-300 mt-2">{event.dateLabel} – {event.city}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
