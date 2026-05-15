/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * Descripción: Reglas de negocio para códigos únicos y Party Pass.
 */

import QRCode from "qrcode";
import { randomUUID } from "crypto";
import type { RewardRepository } from "../database/rewardRepository";

export class RewardService {
  constructor(private readonly repository: RewardRepository) {}

  async validateCode(code: string) {
    const cleanCode = this.normalize(code);
    const rewardCode = await this.repository.findCode(cleanCode);

    if (!rewardCode) return { valid: false, reason: "CODE_NOT_FOUND" };
    if (rewardCode.used) return { valid: false, reason: "CODE_ALREADY_USED" };
    if (new Date(rewardCode.expiresAt).getTime() < Date.now()) {
      return { valid: false, reason: "CODE_EXPIRED" };
    }

    return { valid: true, eventId: rewardCode.eventId, expiresAt: rewardCode.expiresAt };
  }

  async claimReward(code: string) {
    const cleanCode = this.normalize(code);
    const validation = await this.validateCode(cleanCode);

    if (!validation.valid || !validation.eventId) {
      return { ok: false, error: validation.reason ?? "INVALID_CODE" };
    }

    const passId = `DAWGS-${randomUUID().slice(0, 8).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 21).toISOString();
    const payload = JSON.stringify({ passId, code: cleanCode, eventId: validation.eventId, expiresAt });
    const qrDataUrl = await QRCode.toDataURL(payload, { margin: 1, width: 420 });

    await this.repository.markCodeUsed(cleanCode);
    const partyPass = await this.repository.savePartyPass({
      id: passId,
      code: cleanCode,
      eventId: validation.eventId,
      qrDataUrl,
      expiresAt,
      createdAt: new Date().toISOString(),
    });

    return { ok: true, partyPass };
  }

  async verifyExpiration(passId: string) {
    const pass = await this.repository.findPartyPass(passId);
    if (!pass) return { valid: false, reason: "PASS_NOT_FOUND" };

    const expired = new Date(pass.expiresAt).getTime() < Date.now();
    return { valid: !expired, expired, pass };
  }

  private normalize(code: string) {
    return code.trim().toUpperCase();
  }
}
