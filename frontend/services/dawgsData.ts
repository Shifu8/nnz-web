/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * DescripciÃ³n: Datos iniciales desacoplados para alimentar la experiencia DAWGS.
 */

import type { Artist, Event, MerchItem } from "@/frontend/types/domain";

export const artists: Artist[] = [
  {
    id: "dawg",
    name: "DAWG",
    role: "Host / curator",
    image:
      "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80",
    socials: {
      instagram: "https://instagram.com/dawgs",
      tiktok: "https://tiktok.com/@dawgs",
      whatsapp: "https://wa.me/593999999999",
    },
  },
  {
    id: "yan-block",
    name: "YAN BLOCK",
    role: "Latin trap set",
    image:
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=80",
    socials: {
      instagram: "https://instagram.com/yanblock",
      tiktok: "https://tiktok.com/@yanblock",
      whatsapp: "https://wa.me/593999999999",
    },
  },
  {
    id: "roa",
    name: "ROA",
    role: "Underground live",
    image:
      "https://images.unsplash.com/photo-1499364615650-ec38552f4f34?auto=format&fit=crop&w=900&q=80",
    socials: {
      instagram: "https://instagram.com/roa",
      tiktok: "https://tiktok.com/@roa",
      whatsapp: "https://wa.me/593999999999",
    },
  },
];

export const events: Event[] = [
  {
    id: "trap-loud",
    title: "TRAP LOUD",
    subtitle: "YAN BLOCK x ROA",
    city: "Cuenca",
    dateLabel: "18 JUN 2026",
    startsAt: "2026-06-18T21:00:00-05:00",
    poster:
      "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1100&q=85",
    lineup: ["DAWG", "YAN BLOCK", "ROA"],
    description: "Luces rojas, bajo pesado y acceso limitado para la primera fila.",
  },
  {
    id: "after-dark",
    title: "AFTER DARK",
    subtitle: "Club signal",
    city: "Guayaquil",
    dateLabel: "15 AGO 2026",
    startsAt: "2026-08-15T22:00:00-05:00",
    poster:
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1100&q=85",
    lineup: ["DAWG", "NOVA", "SOUTH"],
    description: "SesiÃ³n nocturna con visuales densos, humo y drop exclusivo.",
  },
  {
    id: "red-frequency",
    title: "RED FREQ",
    subtitle: "Warehouse wave",
    city: "Quito",
    dateLabel: "30 JUL 2026",
    startsAt: "2026-07-30T21:30:00-05:00",
    poster:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1100&q=85",
    lineup: ["ROA", "KIDD", "VALENT"],
    description: "Festival compacto, energÃ­a futurista y campaÃ±a visual DAWGS.",
  },
];

export const merch: MerchItem[] = [
  {
    id: "hoodie-redline",
    name: "Redline Hoodie",
    price: "$48",
    image:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "tee-after",
    name: "After Hours Tee",
    price: "$28",
    image:
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "cap-signal",
    name: "Signal Cap",
    price: "$22",
    image:
      "https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=900&q=85",
  },
];
