/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * Descripción: Servidor Express modular para NENEZ rewards y eventos.
 */

import "dotenv/config";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { EventController } from "./controllers/eventController";
import { RewardController } from "./controllers/rewardController";
import { InMemoryRewardRepository } from "./database/inMemoryRewardRepository";
import { errorHandler } from "./middleware/errorHandler";
import { createEventRoutes } from "./routes/eventRoutes";
import { createRewardRoutes } from "./routes/rewardRoutes";
import { createWhatsAppRoutes } from "./routes/whatsappRoutes";
import { EventService } from "./services/eventService";
import { RewardService } from "./services/rewardService";
import { initWhatsApp } from "./services/whatsappService";

const app = express();
const port = Number(process.env.PORT ?? 4000);
const whatsappEnabled = process.env.WHATSAPP_ENABLED === "true";
const rewardRepository = new InMemoryRewardRepository();
const rewardService = new RewardService(rewardRepository);
const eventService = new EventService();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "same-site" },
  }),
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("CORS origin not allowed"));
    },
    credentials: true,
  }),
);
app.use(
  rateLimit({
    windowMs: 60_000,
    limit: 80,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
);
app.use(express.json({ limit: "16kb" }));

app.get("/health", (_request, response) => response.json({ ok: true, service: "nenez-backend" }));
app.use("/api", createRewardRoutes(new RewardController(rewardService)));
app.use("/api", createEventRoutes(new EventController(eventService)));
app.use("/api", createWhatsAppRoutes());
app.use(errorHandler);

app.listen(port, () => {
  console.log(`NENEZ backend running on http://localhost:${port}`);
  if (!whatsappEnabled) {
    console.log("[SERVER] WhatsApp/Baileys disabled. Set WHATSAPP_ENABLED=true to enable it.");
    return;
  }
  initWhatsApp().catch((err) => console.error("[SERVER] WhatsApp init failed:", err));
});
