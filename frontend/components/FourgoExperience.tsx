"use client";

import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

export default function FourgoExperience({ onExplore, onPublish }: { onExplore: () => void; onPublish: () => void }) {
  const moments = [
    { number: "I", tag: "EL ENCUENTRO", title: "La música.", image: "/images/4go_dj_green_alien_hero_2k.webp", position: "center", action: onExplore, label: "Explorar eventos" },
    { number: "II", tag: "LA COMUNIDAD", title: "Tu gente.", image: "/images/subir_evento_party_showcase.jpg", position: "center 40%", action: onExplore, label: "Ver la cartelera" },
    { number: "III", tag: "TU PRÓXIMO EVENTO", title: "Tu historia.", image: "/images/4go_red_girl_showcase.jpg", position: "center", action: onPublish, label: "Crear mi evento" },
  ];
  return (
    <section id="experiencia" className="fourgo-experience">
      <div className="fourgo-section-intro">
        <h2><span>01</span>LA EXPERIENCIA</h2>
        <div className="fourgo-section-intro__copy"><p>La música, el lugar, las personas. Todo lo que hace que quieras estar ahí.</p><p>Encuentra tu próximo evento en 4go o crea uno propio. Conciertos, cultura, ferias y mucho más, en un solo lugar.</p></div>
      </div>
      <div className="fourgo-experience__grid">
        {moments.map((moment) => (
          <div key={moment.number} className="fourgo-moment">
            <div className="fourgo-moment__eyebrow"><span>Acto {moment.number}</span><small>{moment.tag}</small><i /></div>
            <button type="button" onClick={moment.action} className="fourgo-moment__image" aria-label={moment.label}>
              <Image src={moment.image} alt={moment.title} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" style={{ objectPosition: moment.position }} />
              <div className="fourgo-moment__shade" />
              <div className="fourgo-moment__text"><h3>{moment.title}</h3><span>{moment.label}<ArrowUpRight size={18} /></span></div>
              <span className="fourgo-moment__corner"><ArrowUpRight size={23} /></span>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
