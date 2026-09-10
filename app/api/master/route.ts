import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const MASTER_FILE = path.join(DATA_DIR, "master_data.json");

export interface ReceivableItem {
  id: string;
  organizerName: string;
  organizerType: "Discoteca" | "Organizador";
  organizerEmail: string;
  eventTitle: string;
  eventDate: string;
  totalSales: number;
  commissionRate: number;
  commissionAmount: number;
  currency: "S/" | "$";
  status: "pendiente" | "comprobante_subido" | "liquidado";
  receiptUrl?: string;
  receiptDate?: string;
  paidAt?: string;
  notes?: string;
}

export interface RoleChangeRequest {
  id: string;
  organizerId: string;
  organizerName: string;
  organizerEmail: string;
  phone: string;
  venueAddress: string;
  city: string;
  openingDays: string[];
  capacity?: string;
  proofDocumentUrl?: string;
  status: "pendiente" | "aprobado" | "rechazado";
  submittedAt: string;
  resolvedAt?: string;
  rejectionReason?: string;
  hasZeroDebt: boolean;
  pendingDebtAmount: number;
  completedEventsCount: number;
  isNewUser: boolean;
  physicalLocationVerified: boolean;
}

interface MasterData {
  receivables: ReceivableItem[];
  roleRequests: RoleChangeRequest[];
}

const DEFAULT_MASTER_DATA: MasterData = {
  receivables: [
    {
      id: "rec_cubic_001",
      organizerName: "Cubic Loja",
      organizerType: "Discoteca",
      organizerEmail: "mrshifu879@gmail.com",
      eventTitle: "TRAP LOUD",
      eventDate: "30 AGO 2026",
      totalSales: 18450,
      commissionRate: 0.06,
      commissionAmount: 1107,
      currency: "S/",
      status: "comprobante_subido",
      receiptUrl: "/images/now4go-hero-presentation-hd-v3.png",
      receiptDate: "01 SEP 2026",
      notes: "Transferencia Banco Pichincha ref #982341",
    },
    {
      id: "rec_sata_002",
      organizerName: "Sata Music",
      organizerType: "Organizador",
      organizerEmail: "contacto@satamusic.ec",
      eventTitle: "Kaskade: ORIGIN //",
      eventDate: "18 SEP 2026",
      totalSales: 24200,
      commissionRate: 0.06,
      commissionAmount: 1452,
      currency: "$",
      status: "pendiente",
      notes: "En venta activa. Liquidación al cierre del evento.",
    },
    {
      id: "rec_under_003",
      organizerName: "Underground Club",
      organizerType: "Discoteca",
      organizerEmail: "contacto@underground.ec",
      eventTitle: "NOCTURNE LOUD",
      eventDate: "31 OCT 2026",
      totalSales: 9600,
      commissionRate: 0.06,
      commissionAmount: 576,
      currency: "$",
      status: "liquidado",
      paidAt: "15 AGO 2026",
      receiptUrl: "/images/logo_4go_black_white.png",
      notes: "Liquidado y verificado por Master",
    },
  ],
  roleRequests: [
    {
      id: "req_sata_disc_01",
      organizerId: "sata",
      organizerName: "Sata Music",
      organizerEmail: "contacto@satamusic.ec",
      phone: "+593 98 765 4321",
      venueAddress: "Av. Salvador Bustamante Celi y Guayaquil, Loja",
      city: "Loja",
      openingDays: ["Jueves", "Viernes", "Sábado"],
      capacity: "650 personas",
      proofDocumentUrl: "/images/sata-official-logo.jpg",
      status: "pendiente",
      submittedAt: new Date().toISOString(),
      hasZeroDebt: true,
      pendingDebtAmount: 0,
      completedEventsCount: 2,
      isNewUser: false,
      physicalLocationVerified: true,
    },
  ],
};

function readMasterData(): MasterData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(MASTER_FILE)) {
      fs.writeFileSync(MASTER_FILE, JSON.stringify(DEFAULT_MASTER_DATA, null, 2), "utf-8");
      return DEFAULT_MASTER_DATA;
    }
    const content = fs.readFileSync(MASTER_FILE, "utf-8");
    return JSON.parse(content);
  } catch (err) {
    console.error("Error reading master data:", err);
    return DEFAULT_MASTER_DATA;
  }
}

function writeMasterData(data: MasterData) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(MASTER_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing master data:", err);
  }
}

export async function GET() {
  const data = readMasterData();
  const totalRecaudado = data.receivables.reduce((acc, r) => acc + r.totalSales, 0);
  const totalComisiones = data.receivables.reduce((acc, r) => acc + r.commissionAmount, 0);
  const totalPendiente = data.receivables
    .filter((r) => r.status === "pendiente" || r.status === "comprobante_subido")
    .reduce((acc, r) => acc + r.commissionAmount, 0);
  const totalCobrado = data.receivables
    .filter((r) => r.status === "liquidado")
    .reduce((acc, r) => acc + r.commissionAmount, 0);

  return NextResponse.json({
    ok: true,
    data,
    metrics: {
      totalRecaudado,
      totalComisiones,
      totalPendiente,
      totalCobrado,
      pendingRoleRequestsCount: data.roleRequests.filter((r) => r.status === "pendiente").length,
      pendingCommissionCount: data.receivables.filter((r) => r.status !== "liquidado").length,
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;
    const data = readMasterData();

    if (action === "approve_role_request") {
      const { requestId } = body;
      const reqIndex = data.roleRequests.findIndex((r) => r.id === requestId);
      if (reqIndex === -1) {
        return NextResponse.json({ ok: false, error: "Solicitud no encontrada" }, { status: 404 });
      }
      data.roleRequests[reqIndex].status = "aprobado";
      data.roleRequests[reqIndex].resolvedAt = new Date().toISOString();
      writeMasterData(data);
      return NextResponse.json({ ok: true, request: data.roleRequests[reqIndex] });
    }

    if (action === "reject_role_request") {
      const { requestId, reason } = body;
      const reqIndex = data.roleRequests.findIndex((r) => r.id === requestId);
      if (reqIndex === -1) {
        return NextResponse.json({ ok: false, error: "Solicitud no encontrada" }, { status: 404 });
      }
      data.roleRequests[reqIndex].status = "rechazado";
      data.roleRequests[reqIndex].rejectionReason = reason || "No cumple con todos los requisitos requeridos.";
      data.roleRequests[reqIndex].resolvedAt = new Date().toISOString();
      writeMasterData(data);
      return NextResponse.json({ ok: true, request: data.roleRequests[reqIndex] });
    }

    if (action === "submit_role_request") {
      const { organizerId, organizerName, organizerEmail, phone, venueAddress, city, openingDays, capacity, proofDocumentUrl } = body;
      
      const organizerReceivables = data.receivables.filter(
        (r) => r.organizerEmail.toLowerCase() === (organizerEmail || "").toLowerCase()
      );
      const pendingDebt = organizerReceivables
        .filter((r) => r.status === "pendiente")
        .reduce((acc, r) => acc + r.commissionAmount, 0);
      const completedEvents = organizerReceivables.filter((r) => r.status === "liquidado").length;

      const newRequest: RoleChangeRequest = {
        id: `req_${Date.now()}`,
        organizerId: organizerId || organizerEmail.split("@")[0],
        organizerName: organizerName || "Organizador",
        organizerEmail,
        phone: phone || "",
        venueAddress,
        city: city || "Loja",
        openingDays: openingDays || ["Jueves", "Viernes", "Sábado"],
        capacity: capacity || "500 personas",
        proofDocumentUrl: proofDocumentUrl || "",
        status: "pendiente",
        submittedAt: new Date().toISOString(),
        hasZeroDebt: pendingDebt === 0,
        pendingDebtAmount: pendingDebt,
        completedEventsCount: completedEvents,
        isNewUser: completedEvents === 0,
        physicalLocationVerified: Boolean(venueAddress && venueAddress.length > 5),
      };

      const existingIdx = data.roleRequests.findIndex(
        (r) => r.organizerEmail.toLowerCase() === (organizerEmail || "").toLowerCase() && r.status === "pendiente"
      );
      if (existingIdx !== -1) {
        data.roleRequests[existingIdx] = newRequest;
      } else {
        data.roleRequests.unshift(newRequest);
      }

      writeMasterData(data);
      return NextResponse.json({ ok: true, request: newRequest });
    }

    if (action === "approve_payout") {
      const { receivableId } = body;
      const index = data.receivables.findIndex((r) => r.id === receivableId);
      if (index === -1) {
        return NextResponse.json({ ok: false, error: "Liquidación no encontrada" }, { status: 404 });
      }
      data.receivables[index].status = "liquidado";
      data.receivables[index].paidAt = new Date().toISOString();
      writeMasterData(data);
      return NextResponse.json({ ok: true, item: data.receivables[index] });
    }

    if (action === "upload_receipt") {
      const { receivableId, receiptUrl, notes } = body;
      const index = data.receivables.findIndex((r) => r.id === receivableId);
      if (index === -1) {
        return NextResponse.json({ ok: false, error: "Liquidación no encontrada" }, { status: 404 });
      }
      data.receivables[index].status = "comprobante_subido";
      data.receivables[index].receiptUrl = receiptUrl || "/images/now4go-hero-presentation-hd-v3.png";
      data.receivables[index].receiptDate = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
      if (notes) data.receivables[index].notes = notes;
      writeMasterData(data);
      return NextResponse.json({ ok: true, item: data.receivables[index] });
    }

    return NextResponse.json({ ok: false, error: "Acción no reconocida" }, { status: 400 });
  } catch (err: any) {
    console.error("Master API error:", err);
    return NextResponse.json({ ok: false, error: err.message || "Internal server error" }, { status: 500 });
  }
}
