/**
 * Autor: Brandon Medina
 * Fecha: 18/05/2026
 * Descripcion: Datos oficiales NENEZ para eventos, artistas y merch premium.
 */

import type { Artist, Event, MerchItem } from "@/frontend/types/domain";

export const artists: Artist[] = [
  {
    id: "yan-block",
    name: "YAN BLOCK",
    role: "TRAP LOUD EXPERIENCE",
    image: "/images/yan_block_artist_1779161408288.png",
    socials: { instagram: "https://instagram.com/yanblock" },
    description: "La nueva cara del trap latino oscuro. Letras crudas y flows inigualables.",
  },
  {
    id: "omar-courtz",
    name: "OMAR COURTZ",
    role: "LATIN LOUD",
    image: "/images/omar_courtz_artist_1779161689015.png",
    socials: { instagram: "https://instagram.com/omarcourtz" },
    description: "Voz unica y flows de la calle. Autenticidad reggaetonera premium.",
  },
  {
    id: "roa",
    name: "ROA",
    role: "TRAP LOUD",
    image: "/images/roa_artist_1779161704881.png",
    socials: { instagram: "https://instagram.com/roa" },
    description: "El futuro de la escena urbana. Versatilidad y melodias adictivas.",
  },
  {
    id: "anuel-aa",
    name: "ANUEL AA",
    role: "HEADLINER",
    image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80",
    socials: { instagram: "https://instagram.com/anuel" },
    description: "El lado mas agresivo del trap. Presencia dominante y energia imponente.",
  },
  {
    id: "brent-faiyaz",
    name: "BRENT FAIYAZ",
    role: "RNB LOUD",
    image: "https://images.unsplash.com/photo-1493225457124-a1a2a5fa36d1?auto=format&fit=crop&w=900&q=80",
    socials: { instagram: "https://instagram.com/brentfaiyaz" },
    description: "Voz hipnotica y atmosfera nocturna con textura R&B futurista.",
  },
  {
    id: "bad-bunny",
    name: "BAD BUNNY",
    role: "LATIN LOUD",
    image: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=900&q=80",
    socials: { instagram: "https://instagram.com/badbunnypr" },
    description: "Escala global, energia sin limites y shows visualmente devastadores.",
  },
];

export const events: Event[] = [];

export const merch: MerchItem[] = [
  {
    id: "hoodie-redline",
    name: "Redline Hoodie",
    price: "$65",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "oversized-tee",
    name: "Oversized Heavy Tee",
    price: "$40",
    image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "accessory-chain",
    name: "Underground Chain",
    price: "$30",
    image: "https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "tactical-jacket",
    name: "Signal Tactical Jacket",
    price: "$95",
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=85",
  },
];

export function getEvents(): Event[] {
  return events;
}
