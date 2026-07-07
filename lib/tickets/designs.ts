export type TicketDesign = {
  id?: string;
  eventId?: string;
  name: string;
  photo: string;
  accentColor: string;
  shadowColor: string;
  badge: string;
};

export const TICKET_DESIGNS: Record<string, TicketDesign[]> = {
  "trap-loud": [
    {
      name: "YAN BLOCK",
      photo: "/images/yan_block_artist_1779161408288.png",
      accentColor: "#C8FF00",
      shadowColor: "rgba(200, 255, 0, 0.25)",
      badge: "VIP ACCESS",
    },
    {
      name: "ROA",
      photo: "/images/roa_artist_1779161704881.png",
      accentColor: "#00E5FF",
      shadowColor: "rgba(0, 229, 255, 0.25)",
      badge: "SPECIAL PASS",
    },
    {
      name: "TICKET ELEVA",
      photo: "/uploads/ticket-designs/800bce3f-e65f-4289-a308-d648d1b2bb30.png",
      accentColor: "#ff0000",
      shadowColor: "#ff000040",
      badge: "HOLA",
    },
  ],
  "trap-loud-anuel": [
    {
      name: "ANUEL AA",
      photo: "/images/trap_loud_anuel_1778966415162.png",
      accentColor: "#FF2E2E",
      shadowColor: "rgba(255, 46, 46, 0.25)",
      badge: "VIP ACCESS",
    },
    {
      name: "YAN BLOCK",
      photo: "/images/yan_block_artist_1779161408288.png",
      accentColor: "#C8FF00",
      shadowColor: "rgba(200, 255, 0, 0.25)",
      badge: "SPECIAL PASS",
    },
  ],
  "rnb-loud": [
    {
      name: "BRENT FAIYAZ",
      photo: "/images/rnb_loud_brent_1778966427864.png",
      accentColor: "#FF00FF",
      shadowColor: "rgba(255, 0, 255, 0.25)",
      badge: "VIP ACCESS",
    },
    {
      name: "ROA",
      photo: "/images/roa_artist_1779161704881.png",
      accentColor: "#00E5FF",
      shadowColor: "rgba(0, 229, 255, 0.25)",
      badge: "SPECIAL PASS",
    },
  ],
  "latin-loud": [
    {
      name: "BAD BUNNY",
      photo: "/images/latin_loud_bad_bunny_1778966469259.png",
      accentColor: "#00E5FF",
      shadowColor: "rgba(0, 229, 255, 0.25)",
      badge: "VIP ACCESS",
    },
    {
      name: "RAUW ALEJANDRO",
      photo: "/images/rauw_alejandro_card_bg.png",
      accentColor: "#FFA500",
      shadowColor: "rgba(255, 165, 0, 0.25)",
      badge: "SPECIAL PASS",
    },
  ],
  "dawg-night": [
    {
      name: "OMAR COURTZ",
      photo: "/images/omar_courtz_artist_1779161689015.png",
      accentColor: "#C8FF00",
      shadowColor: "rgba(200, 255, 0, 0.25)",
      badge: "VIP ACCESS",
    },
    {
      name: "ANUEL AA",
      photo: "/images/trap_loud_anuel_1778966415162.png",
      accentColor: "#FF2E2E",
      shadowColor: "rgba(255, 46, 46, 0.25)",
      badge: "SPECIAL PASS",
    },
  ],
};

export function getEventDesigns(eventId: string): TicketDesign[] {
  return TICKET_DESIGNS[eventId] || TICKET_DESIGNS["trap-loud"];
}
