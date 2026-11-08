import type { Event } from "@/frontend/types/domain";

const examples = [
  {
    id: "demo-orbita", title: "ÓRBITA", subtitle: "House, techno y una noche fuera de este mundo",
    date: "2026-11-13", dateLabel: "13 NOV 2026", time: "21:00", price: 8,
    category: "Fiesta / DJ", venue: "Club Órbita · Espacio de ejemplo", ageRestriction: "18+",
    description: "Una sesión electrónica entre luces verdes, bajos profundos y una pista que se queda despierta hasta tarde.",
    lineup: ["Colectivo Órbita", "4go DJ set"],
  },
  {
    id: "demo-ritmo-local", title: "RITMO LOCAL", subtitle: "Bandas de casa. Volumen arriba.",
    date: "2026-11-14", dateLabel: "14 NOV 2026", time: "20:00", price: 12,
    category: "Concierto / Live", venue: "Escenario 4go · Espacio de ejemplo", ageRestriction: "Todo público",
    description: "Guitarras, voces nuevas y canciones para cantar juntos. Una noche de bandas independientes y música en vivo.",
    lineup: ["Los del Patio", "Banda Horizonte"],
  },
  {
    id: "demo-neon-club", title: "NEÓN CLUB", subtitle: "Una pista. Todos tus ritmos.",
    date: "2026-11-20", dateLabel: "20 NOV 2026", time: "22:00", price: 10,
    category: "Fiesta / Club", venue: "Sala Neón · Espacio de ejemplo", ageRestriction: "18+",
    description: "Una fiesta de ritmos latinos, disco y clásicos que vuelven a sonar. Ven con tu gente y encuentra tu lugar en la pista.",
    lineup: ["Neón Selectors", "La Mezcla"],
  },
  {
    id: "demo-patio-sonoro", title: "PATIO SONORO", subtitle: "Comida rica, vinilos y buenas conversaciones",
    date: "2026-11-21", dateLabel: "21 NOV 2026", time: "16:00", price: 0,
    category: "Food / Gastronomía", venue: "Patio 4go · Espacio de ejemplo", ageRestriction: "Todo público",
    description: "Una tarde de emprendimientos, sabores locales y música seleccionada en vinilo. Un plan para recorrer sin apuro.",
    lineup: ["Selección en Vinilo", "Cocinas del Patio"],
  },
  {
    id: "demo-luz-color", title: "LUZ & COLOR", subtitle: "Arte que se mira, música que se siente",
    date: "2026-11-28", dateLabel: "28 NOV 2026", time: "17:00", price: 5,
    category: "Arte / Cultura", venue: "Galería 4go · Espacio de ejemplo", ageRestriction: "Todo público",
    description: "Ilustración, proyecciones y una selección musical para descubrir nuevos talentos y compartir una tarde de arte.",
    lineup: ["Estudio Prisma", "Sesión Ambiental"],
  },
  {
    id: "demo-beat-lab", title: "BEAT LAB", subtitle: "Tu primer beat empieza aquí",
    date: "2026-12-05", dateLabel: "05 DIC 2026", time: "15:00", price: 15,
    category: "Talleres / Música", venue: "Estudio 4go · Espacio de ejemplo", ageRestriction: "16+",
    description: "Un taller para experimentar con ritmos, aprender a mezclar y producir tu primera idea musical. No necesitas experiencia previa.",
    lineup: ["Equipo Beat Lab"],
  },
];

export const demoEvents: Event[] = examples.map((example) => ({
  ...example,
  city: "Loja",
  startsAt: `${example.date}T${example.time}:00-05:00`,
  poster: `/images/events/${example.id}.svg`,
  organizer: "4go · Eventos de ejemplo",
  organizers: ["4go · Eventos de ejemplo"],
  currency: "USD",
  status: "coming-soon",
  isDemo: true,
  about: [example.description, "Evento ficticio creado para mostrar el diseño de la cartelera. Las entradas no están a la venta."],
  importantInfo: [{ icon: "✦", title: "Evento de ejemplo", description: "Fecha, lugar, artistas y precios ilustrativos." }],
}));
