/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * Descripción: Rutas Express para validación, claim y pass.
 */

import { Router } from "express";
import type { RewardController } from "../controllers/rewardController";

export function createRewardRoutes(controller: RewardController) {
  const router = Router();

  router.post("/validate-code", controller.validateCode);
  router.post("/claim-reward", controller.claimReward);
  router.post("/party-pass", controller.generatePartyPass);
  router.get("/party-pass/:passId/expiration", controller.verifyExpiration);

  return router;
}
