import { Router, type NextFunction, type Request, type Response } from "express";
import fs from "fs";
import * as whatsappService from "../services/whatsappService";
import { waLogger } from "../whatsapp/logger";
import { queueStats } from "../whatsapp/messageQueue";
import { normalizeEcuadorWhatsAppJid } from "../whatsapp/phone";

const ADMIN_KEY = process.env.WHATSAPP_API_KEY || process.env.ADMIN_API_KEY || "";

function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const key = req.headers["x-api-key"] || req.query.api_key;
  if (!ADMIN_KEY) return next();
  if (key !== ADMIN_KEY) {
    return res.status(401).json({ error: "UNAUTHORIZED", message: "Invalid or missing API key" });
  }
  next();
}

export function createWhatsAppRoutes() {
  const router = Router();

  router.get("/whatsapp/status", (_req, res) => {
    const status = whatsappService.getStatus();
    res.json({ success: true, ...status, queue: queueStats() });
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
    const jid = normalizeEcuadorWhatsAppJid(phone as string);
    if (!jid) {
      return res.status(400).json({
        error: "INVALID_ECUADOR_MOBILE",
        message: "Use un celular ecuatoriano como 0988831372 o +593988831372.",
      });
    }

    let queueId: string;
    if (filePath) {
      try {
        const buffer = fs.readFileSync(filePath);
        queueId = whatsappService.sendTicketDocumentWithTextFirst(
          jid,
          buffer,
          fileName || "ticket.pdf",
          text,
        );
      } catch {
        return res.status(500).json({ error: "FILE_READ_ERROR", message: `Cannot read file: ${filePath}` });
      }
    } else if (documentUrl) {
      queueId = whatsappService.sendTicketDocument(jid, documentUrl, fileName || "ticket.pdf", text);
    } else if (imageUrl) {
      queueId = whatsappService.sendTicketImage(jid, imageUrl, text);
    } else {
      queueId = whatsappService.sendTicketMessage(jid, text);
    }
    res.status(202).json({
      success: true,
      status: "queued",
      message: "Queued",
      queueId,
      normalizedPhone: jid.replace("@s.whatsapp.net", ""),
      queueLength: queueStats().pending,
    });
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
