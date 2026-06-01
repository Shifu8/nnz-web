import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const phone = formData.get("phone") as string | null;
    const name = formData.get("name") as string | null;

    if (!file || !phone || !name) {
      return NextResponse.json({ error: "Faltan datos: archivo, teléfono y nombre requeridos." }, { status: 400 });
    }

    const fileName = `ticket-${uuidv4()}.pdf`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "tickets");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, fileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    const { sendTicketPdfViaWhatsApp } = await import("@/lib/whatsapp");
    const result = await sendTicketPdfViaWhatsApp(phone, name, fileName, filePath);

    return NextResponse.json({
      success: result.success,
      error: result.error,
      messageId: result.messageId,
      fileName,
    });
  } catch (err) {
    console.error("[SEND-TICKET-WA] Error:", err);
    return NextResponse.json({ error: "Error interno al enviar ticket." }, { status: 500 });
  }
}
