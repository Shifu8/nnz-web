/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * Descripción: Modal glass premium estilo DAWGS para artistas con GSAP.
 */

"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

import { gsap } from "@/frontend/animations/gsapSetup";
import type { Artist } from "@/frontend/types/domain";

type ArtistModalProps = {
  artist?: Artist;
  onClose: () => void;
};

export default function ArtistModal({ artist, onClose }: ArtistModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (artist) {
      document.body.style.overflow = "hidden";
      
      const tl = gsap.timeline();
      tl.to(overlayRef.current, { autoAlpha: 1, duration: 0.3, ease: "power2.out" })
        .fromTo(
          modalRef.current,
          { y: 80, scale: 0.94, autoAlpha: 0 },
          { y: 0, scale: 1, autoAlpha: 1, duration: 0.6, ease: "expo.out" },
          "<0.1"
        )
        .fromTo(
          ".artist-modal-item",
          { y: 20, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.4, stagger: 0.05, ease: "power2.out" },
          "-=0.3"
        );
    } else {
      document.body.style.overflow = "";
    }
  }, [artist]);

  const handleClose = () => {
    const tl = gsap.timeline({ onComplete: onClose });
    tl.to(modalRef.current, { y: 40, scale: 0.96, autoAlpha: 0, duration: 0.3, ease: "power2.in" })
      .to(overlayRef.current, { autoAlpha: 0, duration: 0.3, ease: "power2.in" }, "<0.1");
  };

  if (!artist) return null;

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[80] grid place-items-end bg-black/60 p-3 backdrop-blur-xl sm:place-items-center opacity-0 invisible">
      <section
        ref={modalRef}
        className="relative w-full max-w-md overflow-hidden rounded-[34px] border border-red-500/20 bg-zinc-950/80 p-4 shadow-[0_0_100px_rgba(255,0,24,.4)] backdrop-blur-3xl"
      >
        <button onClick={handleClose} className="absolute right-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-black/60 text-white backdrop-blur-xl transition hover:bg-white/20 hover:scale-110">

        </button>
        <div className="relative h-80 overflow-hidden rounded-[26px]">
          <Image src={artist.image} alt={artist.name} fill sizes="(max-width: 768px) 100vw, 420px" className="object-cover transition-transform duration-[3s] hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(255,0,24,0.3),transparent_70%)] mix-blend-overlay" />
        </div>
        <div className="-mt-16 relative z-10 px-3 pb-2">
          <p className="artist-modal-item text-[10px] font-black uppercase tracking-[0.42em] text-red-400 drop-shadow-[0_0_10px_red]">{artist.role}</p>
          <h2 className="artist-modal-item mt-2 text-4xl font-black tracking-tight text-white drop-shadow-[0_0_20px_rgba(255,0,24,0.6)]">{artist.name}</h2>
          
          {artist.description && (
            <p className="artist-modal-item mt-3 text-sm leading-6 text-zinc-300">{artist.description}</p>
          )}

          <div className="artist-modal-item mt-5 grid grid-cols-3 gap-2">
            {artist.socials.instagram && (
              <a href={artist.socials.instagram} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-white/10 bg-white/5 py-3 text-xs font-bold text-white transition hover:bg-red-500/20 hover:border-red-500/50 hover:shadow-[0_0_15px_rgba(255,0,24,0.3)]">
<span>IG</span>
              </a>
            )}
            {artist.socials.tiktok && (
              <a href={artist.socials.tiktok} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-white/10 bg-white/5 py-3 text-xs font-bold text-white transition hover:bg-red-500/20 hover:border-red-500/50 hover:shadow-[0_0_15px_rgba(255,0,24,0.3)]">
<span>TikTok</span>
              </a>
            )}
            {artist.socials.whatsapp && (
              <a href={artist.socials.whatsapp} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-white/10 bg-white/5 py-3 text-xs font-bold text-white transition hover:bg-red-500/20 hover:border-red-500/50 hover:shadow-[0_0_15px_rgba(255,0,24,0.3)]">
<span>WhatsApp</span>
              </a>
            )}
          </div>
          
          {artist.socials.whatsapp ? (
            <a href={artist.socials.whatsapp} target="_blank" rel="noopener noreferrer" className="artist-modal-item mt-4 flex h-14 items-center justify-center rounded-2xl bg-white text-xs font-black uppercase tracking-[0.24em] text-black shadow-[0_0_20px_rgba(255,255,255,0.2)] transition hover:scale-[1.02]">
              contactar
            </a>
          ) : (
            <a href={artist.socials.instagram} target="_blank" rel="noopener noreferrer" className="artist-modal-item mt-4 flex h-14 items-center justify-center rounded-2xl bg-white text-xs font-black uppercase tracking-[0.24em] text-black shadow-[0_0_20px_rgba(255,255,255,0.2)] transition hover:scale-[1.02]">
              ver perfil
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
