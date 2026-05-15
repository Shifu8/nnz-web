/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * Descripción: Middleware centralizado para errores Express.
 */

import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  void _next;

  response.status(500).json({
    error: "INTERNAL_SERVER_ERROR",
    message: error instanceof Error ? error.message : "Unexpected backend error",
  });
};
