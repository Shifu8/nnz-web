/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * Descripción: Contrato de persistencia para códigos y Party Pass.
 */

export type RewardCode = {
  code: string;
  eventId: string;
  used: boolean;
  expiresAt: string;
};

export type StoredPartyPass = {
  id: string;
  code: string;
  eventId: string;
  qrDataUrl: string;
  expiresAt: string;
  createdAt: string;
};

export interface RewardRepository {
  findCode(code: string): Promise<RewardCode | undefined>;
  markCodeUsed(code: string): Promise<void>;
  savePartyPass(pass: StoredPartyPass): Promise<StoredPartyPass>;
  findPartyPass(passId: string): Promise<StoredPartyPass | undefined>;
}
