import type { HomepageConfig } from "./types";

export const DEFAULT_HOMEPAGE_CONFIG: HomepageConfig = {
  hero: {
    tagline: "DAWGS presenta",
    artistNames: [
      { first: "Yan", second: "Block" },
      { first: "Omar", second: "Courtz" },
      { first: "ROA", second: "" },
    ],
    mobileDescription:
      "Trap latino, bajos pesados y una noche diseñada para sentirse cerca del artista.",
  },
  ticketCard: {
    badge: "Entrada oficial",
    badgeSub: "Proximo evento",
    price: 10,
    currency: "USD",
    eventTitle: "TRAP LOUD",
    eventSubtitle: "YAN BLOCK EXPERIENCE",
    description:
      "Tu entrada empieza aqui: diseno, registro, Gmail y pago. Si no llega, recuperala con tu correo.",
    sponsors: [
      { initials: "KS", name: "Kyoto Sushi" },
      { initials: "IA", name: "Iron Athletics" },
    ],
    daWgDj: { name: "DAWG DJ", instagram: "brandon.mdna" },
    verEventoText: "Ver evento",
    comprarEntradaText: "Comprar entrada",
    countdownLabel: "Tiempo para el evento",
  },
  accessSection: {
    badge: "Access info",
    headingLine1: "Acceso",
    headingLine2: "protegido.",
    qrSubtitle: "Un QR. Una entrada.",
    description:
      "Tu pase se valida una sola vez en puerta. No compartas capturas ni reenvíes el código antes del show.",
    steps: [
      {
        step: "01",
        title: "Compra",
        copy: "Completa el flujo y sube tu comprobante.",
      },
      {
        step: "02",
        title: "Recibe",
        copy: "Tu entrada llega por Gmail y WhatsApp confirma la compra.",
      },
      {
        step: "03",
        title: "Entra",
        copy: "El staff escanea tu QR oficial una sola vez. Usado = bloqueado, así evitamos fraudes y reventa.",
      },
    ],
  },
  nextSignals: {
    preHeading: "Después de Yan Block",
    heading: "Próximas señales",
  },
  footer: {
    brand: "DAWGS",
    tagline: "Live shows · official access · wear",
    email: "soporte.dawgs@gmail.com",
    copyright: "© 2026 DAWGS. Todos los derechos reservados.",
  },
};
