/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * Descripción: Adaptador Firebase preparado para escalar la persistencia.
 */

import type { Firestore } from "firebase-admin/firestore";
import type { RewardCode, RewardRepository, StoredPartyPass } from "./rewardRepository";

export class FirebaseRewardRepository implements RewardRepository {
  constructor(private readonly db: Firestore) {}

  async findCode(code: string): Promise<RewardCode | undefined> {
    const snapshot = await this.db.collection("rewardCodes").doc(code).get();
    return snapshot.exists ? (snapshot.data() as RewardCode) : undefined;
  }

  async markCodeUsed(code: string): Promise<void> {
    await this.db.collection("rewardCodes").doc(code).set({ used: true }, { merge: true });
  }

  async savePartyPass(pass: StoredPartyPass): Promise<StoredPartyPass> {
    await this.db.collection("partyPasses").doc(pass.id).set(pass);
    return pass;
  }

  async findPartyPass(passId: string): Promise<StoredPartyPass | undefined> {
    const snapshot = await this.db.collection("partyPasses").doc(passId).get();
    return snapshot.exists ? (snapshot.data() as StoredPartyPass) : undefined;
  }
}
