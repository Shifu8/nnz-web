/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * Descripción: Controladores HTTP para rewards y Party Pass.
 */

import type { Request, Response } from "express";
import type { RewardService } from "../services/rewardService";

export class RewardController {
  constructor(private readonly rewardService: RewardService) {}

  validateCode = async (request: Request, response: Response) => {
    const result = await this.rewardService.validateCode(request.body.code ?? "");
    response.status(result.valid ? 200 : 422).json(result);
  };

  claimReward = async (request: Request, response: Response) => {
    const result = await this.rewardService.claimReward(request.body.code ?? "");
    response.status(result.ok ? 201 : 422).json(result);
  };

  generatePartyPass = async (request: Request, response: Response) => {
    const result = await this.rewardService.claimReward(request.body.code ?? "");
    response.status(result.ok ? 201 : 422).json(result);
  };

  verifyExpiration = async (request: Request, response: Response) => {
    const passId = Array.isArray(request.params.passId)
      ? request.params.passId[0]
      : request.params.passId;
    const result = await this.rewardService.verifyExpiration(passId);
    response.status(result.valid ? 200 : 404).json(result);
  };
}
