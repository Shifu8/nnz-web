/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * Descripción: Servidor Express modular para DAWGS rewards y eventos.
 */

import "dotenv/config";
import cors from "cors";
import express from "express";
import { EventController } from "./controllers/eventController";
import { RewardController } from "./controllers/rewardController";
import { InMemoryRewardRepository } from "./database/inMemoryRewardRepository";
import { errorHandler } from "./middleware/errorHandler";
import { createEventRoutes } from "./routes/eventRoutes";
import { createRewardRoutes } from "./routes/rewardRoutes";
import { EventService } from "./services/eventService";
import { RewardService } from "./services/rewardService";

const app = express();
const port = Number(process.env.PORT ?? 4000);
const rewardRepository = new InMemoryRewardRepository();
const rewardService = new RewardService(rewardRepository);
const eventService = new EventService();

app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:3000" }));
app.use(express.json());

app.get("/health", (_request, response) => response.json({ ok: true, service: "dawgs-backend" }));
app.use("/api", createRewardRoutes(new RewardController(rewardService)));
app.use("/api", createEventRoutes(new EventController(eventService)));
app.use(errorHandler);

app.listen(port, () => {
  console.log(`DAWGS backend running on http://localhost:${port}`);
});
