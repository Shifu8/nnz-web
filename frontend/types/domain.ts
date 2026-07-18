/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * Descripción: Tipos centrales para eventos, artistas, merch y rewards NENEZ.
 */

export type SocialLinks = {
  instagram?: string;
  tiktok?: string;
  whatsapp?: string;
  spotify?: string;
  appleMusic?: string;
  youtube?: string;
  website?: string;
};

export type Artist = {
  id: string;
  name: string;
  role: string;
  image: string;
  socials: SocialLinks;
  description?: string;
};

export type LineupArtist = {
  name: string;
  role: "Headliner" | "Supporting" | "Guest" | "DJ" | "Live Act" | "Surprise";
  image?: string;
};

export type ScheduleItem = {
  time: string;
  label: string;
};

export type InfoCard = {
  icon: string;
  title: string;
  description: string;
};

export type MerchProduct = {
  id: string;
  name: string;
  category: string;
  price: string;
  image?: string;
};

export type DrinkItem = {
  id: string;
  name: string;
  category: "Botellas" | "Cocteles Especiales" | "Bebidas & Mixers";
  price: string;
  description?: string;
  badge?: string;
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

  // Extended editorial fields
  organizer?: string;
  venue?: string;
  time?: string;
  category?: string;
  ageRestriction?: string;
  status?: "available" | "sold-out" | "coming-soon";
  about?: string[];
  detailedLineup?: LineupArtist[];
  schedule?: ScheduleItem[];
  importantInfo?: InfoCard[];
  socialLinks?: SocialLinks;
  merch?: MerchProduct[];
  drinks?: DrinkItem[];
  price?: number;
  currency?: string;
  onlineSalesCutoffTime?: string;
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
