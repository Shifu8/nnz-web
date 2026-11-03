import { z } from "zod";

export const eventPublicationSchema = z.object({
  title: z.string().trim().min(3, "Escribe un título de al menos 3 caracteres.").max(160),
  date: z.iso.date("Selecciona una fecha válida."),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Selecciona una hora válida.").default("20:00"),
  city: z.string().trim().min(1).max(80).default("Loja"),
  venue: z.string().trim().min(1, "Indica el lugar del evento.").max(180),
  organizer: z.string().trim().min(1).max(160),
  category: z.string().trim().min(1).max(100).default("Comunidad"),
  price: z.coerce.number().finite().min(0, "El precio no puede ser negativo.").max(10000),
  subtitle: z.string().trim().max(200).default(""),
  description: z.string().trim().max(10000).default(""),
  address: z.string().trim().max(300).default(""),
  ageRestriction: z.string().trim().max(200).default("Todo público"),
  poster: z.string().max(8 * 1024 * 1024).optional(),
  imageUrl: z.string().max(8 * 1024 * 1024).optional(),
  lineup: z.array(z.string().trim().max(160)).max(100).default([]),
  organizers: z.array(z.string().trim().max(160)).max(30).default([]),
  presales: z.array(z.object({
    id: z.union([z.string(), z.number()]),
    name: z.string().trim().min(1).max(100),
    price: z.coerce.number().finite().min(0).max(10000),
    duration: z.string().max(80).optional(),
    customEndDate: z.string().max(30).optional(),
    capacity: z.union([z.string().max(10), z.number().nonnegative()]).optional(),
  })).max(30).default([]),
  importantInfo: z.array(z.object({
    icon: z.string().max(40), title: z.string().max(120), description: z.string().max(1000),
  })).max(30).default([]),
});
