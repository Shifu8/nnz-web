"use client";

import { ArrowDown, ArrowUpRight } from "lucide-react";

export default function FourgoHero({ onExplore }: { onExplore: () => void }) {
  return (
    <section className="fourgo-hero" aria-label="4go, eventos y experiencias">
      <picture className="fourgo-hero__art">
        <img src="/images/hd/4go-green-dj-desktop-v2.webp" alt="El DJ verde de 4go con sus audífonos y mezcladora, bajo los globos de 4go" width={1983} height={793} fetchPriority="high" decoding="async" />
      </picture>
      <div className="fourgo-hero__shade" />
      <h1 className="sr-only">4go · Eventos y experiencias</h1>
      <div className="fourgo-hero__bottom">
        <div className="fourgo-hero__caption"><span className="fourgo-live-dot" />Eventos · Entradas · Experiencias</div>
        <button type="button" onClick={onExplore} className="fourgo-hero__cta button-pulse-smooth">Ver eventos <ArrowUpRight size={18} /></button>
        <button type="button" onClick={onExplore} aria-label="Bajar a los eventos" className="fourgo-hero__down"><ArrowDown size={17} /></button>
      </div>
      <span className="fourgo-hero__side">4GO · ECUADOR</span>
    </section>
  );
}
