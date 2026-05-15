/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * DescripciÃ³n: Carrusel horizontal mobile-first para evento principal y merch visible.
 */

"use client";

import { useMemo, useState } from "react";
import ArtistModal from "@/frontend/features/artists/ArtistModal";
import EventCard from "@/frontend/features/events/EventCard";
import MerchCard from "@/frontend/features/merch/MerchCard";
import { artists, events, merch } from "@/frontend/services/dawgsData";

export default function EventCarousel() {
  const [activeArtist, setActiveArtist] = useState<string | undefined>();
  const artist = useMemo(() => artists.find((item) => item.name === activeArtist), [activeArtist]);

  return (
    <section id="events" className="relative z-10 py-8 md:py-14">
      <div className="mx-auto max-w-6xl px-4">
        <p className="text-[10px] font-black uppercase tracking-[0.46em] text-red-300">next signal</p>
        <h2 className="mt-2 max-w-xl text-4xl font-black leading-none text-white md:text-6xl">Evento, drop y acceso en un solo gesto.</h2>
      </div>
      <div className="mt-7 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-8 no-scrollbar md:justify-center">
        <EventCard event={events[0]} onArtistClick={setActiveArtist} />
        <MerchCard items={merch} />
        {events.slice(1).map((event) => (
          <EventCard key={event.id} event={event} onArtistClick={setActiveArtist} />
        ))}
      </div>
      <ArtistModal artist={artist} onClose={() => setActiveArtist(undefined)} />
    </section>
  );
}
