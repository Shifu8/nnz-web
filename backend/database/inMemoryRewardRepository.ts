/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * Descripción: Repositorio local para desarrollo antes de conectar Firebase.
 */

import type { RewardCode, RewardRepository, StoredPartyPass } from "./rewardRepository";

export class InMemoryRewardRepository implements RewardRepository {
  private codes = new Map<string, RewardCode>([
    [
      "DAWGS-2026",
      {
        code: "DAWGS-2026",
        eventId: "trap-loud",
        used: false,
        expiresAt: "2026-12-31T23:59:59-05:00",
      },
    ],
    [
      "LOUD-ACCESS",
      {
        code: "LOUD-ACCESS",
        eventId: "trap-loud",
        used: false,
        expiresAt: "2026-12-31T23:59:59-05:00",
      },
    ],
  ]);

  private passes = new Map<string, StoredPartyPass>();

  async findCode(code: string) {
    return this.codes.get(code);
  }

  async markCodeUsed(code: string) {
    const current = this.codes.get(code);
    if (current) this.codes.set(code, { ...current, used: true });
  }

  async savePartyPass(pass: StoredPartyPass) {
    this.passes.set(pass.id, pass);
    return pass;
  }

  async findPartyPass(passId: string) {
    return this.passes.get(passId);
  }
}
