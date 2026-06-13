export interface HomepageConfig {
  hero: {
    tagline: string;
    artistNames: { first: string; second: string }[];
    mobileDescription: string;
  };
  ticketCard: {
    badge: string;
    badgeSub: string;
    price: number;
    currency: string;
    eventTitle: string;
    eventSubtitle: string;
    description: string;
    sponsors: { initials: string; name: string }[];
    daWgDj: { name: string; instagram: string };
    verEventoText: string;
    comprarEntradaText: string;
    countdownLabel: string;
  };
  accessSection: {
    badge: string;
    headingLine1: string;
    headingLine2: string;
    qrSubtitle: string;
    description: string;
    steps: { step: string; title: string; copy: string }[];
  };
  nextSignals: {
    preHeading: string;
    heading: string;
  };
  footer: {
    brand: string;
    tagline: string;
    email: string;
    copyright: string;
  };
}
