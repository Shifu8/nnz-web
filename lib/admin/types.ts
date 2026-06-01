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
  slug?: string;
  createdAt: string;
  updatedAt: string;
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
