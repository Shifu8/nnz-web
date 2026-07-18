export type AdminEvent = {
  id: string;
  title: string;
  subtitle: string;
  location: string;
  date: string;
  time: string;
  countdownDate: string;
  price: number;
  imageUrl: string;
  description: string;
  lineup: string[];
  position: number;
  status: "active" | "inactive";
  isFeatured: boolean;
  isAvailable?: boolean;
  slug?: string;
  createdAt: string;
  updatedAt: string;

  // Extended detail fields
  badge?: string;
  accentColor?: string;
  miniImage?: string;
  organizer?: string;
  venue?: string;
  category?: string;
  ageRestriction?: string;
  about?: string[];
  detailedLineup?: { name: string; role: string; image?: string }[];
  schedule?: { time: string; label: string }[];
  importantInfo?: { icon: string; title: string; description: string }[];
  socialLinks?: {
    instagram?: string;
    tiktok?: string;
    whatsapp?: string;
    spotify?: string;
    appleMusic?: string;
    youtube?: string;
    website?: string;
  };
  merch?: {
    id: string;
    name: string;
    category: string;
    price: string;
    image?: string;
  }[];
  drinks?: {
    id: string;
    name: string;
    category: string;
    price: string;
    description?: string;
    badge?: string;
  }[];
};

export type AdminStats = {
  totalReceipts: number;
  pendientes: number;
  aprobados: number;
  rechazados: number;
  totalRevenue: number;
  totalTicketsSold: number;
  totalEvents: number;
  totalClients: number;
};

export type ClientInfo = {
  phone: string;
  firstName: string;
  lastName: string;
  email: string;
  totalPurchases: number;
  totalSpent: number;
  lastPurchase: string;
  status: "activo" | "inactivo";
  tickets: { eventTitle: string; quantity: number; date: string; serial: string }[];
};

export type SalesRecord = {
  date: string;
  ticketsSold: number;
  revenue: number;
  pendingAmount: number;
};

export type AdminLog = {
  id: string;
  action: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};
