/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * Descripción: Servicio de eventos disponible para API y futura base de datos.
 */

const events = [
  {
    id: "trap-loud",
    title: "TRAP LOUD",
    city: "Cuenca",
    startsAt: "2026-06-18T21:00:00-05:00",
    lineup: ["DAWG", "YAN BLOCK", "ROA"],
  },
  {
    id: "after-dark",
    title: "AFTER DARK",
    city: "Guayaquil",
    startsAt: "2026-08-15T22:00:00-05:00",
    lineup: ["DAWG", "NOVA", "SOUTH"],
  },
];

export class EventService {
  async getEvents() {
    return events;
  }
}
