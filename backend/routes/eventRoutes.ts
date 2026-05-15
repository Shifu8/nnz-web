/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * Descripción: Rutas Express para catálogo de eventos.
 */

import { Router } from "express";
import type { EventController } from "../controllers/eventController";

export function createEventRoutes(controller: EventController) {
  const router = Router();

  router.get("/events", controller.getEvents);

  return router;
}
