/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * Descripción: Controlador HTTP para obtener eventos NENEZ.
 */

import type { Request, Response } from "express";
import type { EventService } from "../services/eventService";

export class EventController {
  constructor(private readonly eventService: EventService) {}

  getEvents = async (_request: Request, response: Response) => {
    response.json({ events: await this.eventService.getEvents() });
  };
}
