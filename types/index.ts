export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt?: string;
}

export interface Ticket {
  id: string;
  ticketCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  eventId: string;
  status: "valid" | "used" | "revoked";
  qrCode: string;
  createdAt: string;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  location: string;
  active: boolean;
  createdAt?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DeliveryResult {
  success: boolean;
  email?: { sent: boolean; error?: string };
  whatsapp?: { sent: boolean; error?: string };
  warnings: string[];
}
