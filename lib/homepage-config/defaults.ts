import type { HomepageConfig } from "./types";

const COVER_POSITIONS = [
  "left-[1%] top-[12%] w-[4.95rem] sm:w-[6.35rem] lg:-left-[10%] lg:top-[16%] lg:w-[7.35rem]",
  "right-[1%] top-[20%] w-[4.65rem] sm:w-[6.35rem] lg:-right-[6%] lg:top-[12%] lg:w-[7.35rem]",
  "right-[3%] top-[52%] w-[5.25rem] sm:w-[6.35rem] lg:-right-[11%] lg:top-[48%] lg:w-[8.4rem]",
  "left-[2%] top-[55%] w-[4.65rem] sm:w-[6.35rem] lg:-left-[13%] lg:top-[50%] lg:w-[7.35rem]",
  "right-[19%] bottom-[4%] w-[4.65rem] sm:w-[5.35rem] lg:right-[4%] lg:bottom-[1%] lg:w-[6.35rem]",
  "left-[18%] bottom-[5%] w-[4.65rem] sm:w-[5.35rem] lg:left-[2%] lg:bottom-[3%] lg:w-[6.35rem]",
];

const DEFAULT_COVERS = [
  { src: "/images/covers/que-vas-hacer-hoy.jpg", label: "Qué Vas Hacer Hoy", className: COVER_POSITIONS[0], rotation: -12, delay: 0 },
  { src: "/images/covers/me-gustas-cc.jpg", label: "Me Gustas CC", className: COVER_POSITIONS[1], rotation: 10, delay: 0.3 },
  { src: "/images/covers/666.jpg", label: "666", className: COVER_POSITIONS[2], rotation: 13, delay: 0.55 },
  { src: "/images/covers/talento.jpg", label: "Talento", className: COVER_POSITIONS[3], rotation: -8, delay: 0.8 },
  { src: "/images/covers/444.jpg", label: "444", className: COVER_POSITIONS[4], rotation: -9, delay: 1.05 },
  { src: "/images/covers/vacile.jpg", label: "Vacile", className: COVER_POSITIONS[5], rotation: 11, delay: 1.3 },
];

export { COVER_POSITIONS };

export const DEFAULT_HOMEPAGE_CONFIG: HomepageConfig = {
  theme: "pink",
  hero: {
    tagline: "NENEZ presenta",
    artistNames: [
      { first: "Yan", second: "Block" },
      { first: "Omar", second: "Courtz" },
      { first: "ROA", second: "" },
    ],
    mobileDescription:
      "Trap latino, bajos pesados y una noche diseñada para sentirse cerca del artista.",
  },
  covers: DEFAULT_COVERS,
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
  footer: {
    brand: "NENEZ",
    tagline: "Live shows · official access · wear",
    email: "soporte.nenez@gmail.com",
    copyright: "© 2026 NENEZ. Todos los derechos reservados.",
  },
};
