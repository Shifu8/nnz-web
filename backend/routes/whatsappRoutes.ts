import { Router } from "express";
import fs from "fs";
import * as whatsappService from "../services/whatsappService";
import { waLogger } from "../whatsapp/logger";

const ADMIN_KEY = process.env.WHATSAPP_API_KEY || process.env.ADMIN_API_KEY || "";

function requireApiKey(req: any, res: any, next: any) {
  const key = req.headers["x-api-key"] || req.query.api_key;
  if (!ADMIN_KEY) return next();
  if (key !== ADMIN_KEY) {
    return res.status(401).json({ error: "UNAUTHORIZED", message: "Invalid or missing API key" });
  }
  next();
}

function normalizeJid(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("593")) return `${digits}@s.whatsapp.net`;
  if (digits.startsWith("0")) return `593${digits.slice(1)}@s.whatsapp.net`;
  return `593${digits}@s.whatsapp.net`;
}

export function createWhatsAppRoutes() {
  const router = Router();

  router.get("/whatsapp/status", (_req, res) => {
    const status = whatsappService.getStatus();
    res.json({ success: true, ...status });
  });

  router.get("/whatsapp/qr", (_req, res) => {
    const status = whatsappService.getStatus();
    if (status.isConnected) {
      return res.json({ success: true, connected: true, message: "Already connected" });
    }
    res.json({ success: true, connected: false, qr: status.qr });
  });

  router.post("/whatsapp/send", requireApiKey, (req, res) => {
    const { phone, text, imageUrl, documentUrl, filePath, fileName } = req.body;
    if (!phone || !text) {
      return res.status(400).json({ error: "BAD_REQUEST", message: "phone and text required" });
    }
    if (!whatsappService.getConnectionReady()) {
      waLogger.warn("ROUTES", "Send rejected: connection not ready yet");
      return res.status(503).json({ error: "CONNECTION_NOT_READY", message: "WhatsApp connection still stabilizing. Try again in a moment." });
    }
    const jid = normalizeJid(phone as string);
    if (filePath) {
      try {
        const buffer = fs.readFileSync(filePath);
        whatsappService.sendTicketDocumentWithTextFirst(jid, buffer, fileName || "ticket.pdf", text);
      } catch (err) {
        return res.status(500).json({ error: "FILE_READ_ERROR", message: `Cannot read file: ${filePath}` });
      }
    } else if (documentUrl) {
      whatsappService.sendTicketDocument(jid, documentUrl, fileName || "ticket.pdf", text);
    } else if (imageUrl) {
      whatsappService.sendTicketImage(jid, imageUrl, text);
    } else {
      whatsappService.sendTicketMessage(jid, text);
    }
    res.json({ success: true, message: "Queued", queueLength: undefined });
  });

  router.post("/whatsapp/logout", requireApiKey, async (_req, res) => {
    await whatsappService.logout();
    res.json({ success: true, message: "Logged out and session cleared" });
  });

  router.post("/whatsapp/restart", requireApiKey, async (_req, res) => {
    await whatsappService.restart();
    res.json({ success: true, message: "WhatsApp reconnecting" });
  });

  return router;
}
