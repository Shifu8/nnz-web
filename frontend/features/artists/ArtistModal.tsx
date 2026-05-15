/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * DescripciÃ³n: Modal glass estilo Dynamic Island para artistas.
 */

"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { AtSign, MessageCircle, Music2, X } from "lucide-react";
import type { Artist } from "@/frontend/types/domain";

type ArtistModalProps = {
  artist?: Artist;
  onClose: () => void;
};

export default function ArtistModal({ artist, onClose }: ArtistModalProps) {
  return (
    <AnimatePresence>
      {artist && (
        <motion.div className="fixed inset-0 z-[80] grid place-items-end bg-black/50 p-3 backdrop-blur-xl sm:place-items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.section
            initial={{ y: 80, scale: 0.94, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 80, scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 24, stiffness: 220 }}
            className="relative w-full max-w-md overflow-hidden rounded-[34px] border border-white/14 bg-zinc-950/70 p-4 shadow-[0_0_80px_rgba(255,0,24,.35)] backdrop-blur-2xl"
          >
            <button onClick={onClose} className="absolute right-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-black/45 text-white backdrop-blur-xl">
              <X className="h-4 w-4" />
            </button>
            <div className="relative h-80 overflow-hidden rounded-[26px]">
              <Image src={artist.image} alt={artist.name} fill sizes="(max-width: 768px) 100vw, 420px" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            </div>
            <div className="-mt-16 relative z-10 px-3 pb-2">
              <p className="text-[10px] font-black uppercase tracking-[0.42em] text-red-300">{artist.role}</p>
              <h2 className="mt-2 text-4xl font-black tracking-tight text-white">{artist.name}</h2>
              <div className="mt-5 grid grid-cols-3 gap-2">
                <a href={artist.socials.instagram} className="glass-action"><AtSign className="h-5 w-5" /><span>IG</span></a>
                <a href={artist.socials.tiktok} className="glass-action"><Music2 className="h-5 w-5" /><span>TikTok</span></a>
                <a href={artist.socials.whatsapp} className="glass-action"><MessageCircle className="h-5 w-5" /><span>WhatsApp</span></a>
              </div>
              <a href={artist.socials.whatsapp} className="mt-4 flex h-14 items-center justify-center rounded-2xl bg-white text-xs font-black uppercase tracking-[0.24em] text-black transition hover:scale-[1.01]">
                contactar
              </a>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
