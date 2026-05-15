/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * DescripciÃ³n: Tipos centrales para eventos, artistas, merch y rewards DAWGS.
 */

export type SocialLinks = {
  instagram: string;
  tiktok: string;
  whatsapp: string;
};

export type Artist = {
  id: string;
  name: string;
  role: string;
  image: string;
  socials: SocialLinks;
};

export type Event = {
  id: string;
  title: string;
  subtitle: string;
  city: string;
  dateLabel: string;
  startsAt: string;
  poster: string;
  lineup: string[];
  description: string;
};

export type MerchItem = {
  id: string;
  name: string;
  price: string;
  image: string;
};

export type PartyPass = {
  id: string;
  code: string;
  eventId: string;
  expiresAt: string;
  qrPayload: string;
};
