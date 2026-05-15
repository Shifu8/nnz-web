/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * DescripciÃ³n: Cliente API para validar cÃ³digos y reclamar Party Pass.
 */

import type { PartyPass } from "@/frontend/types/domain";

type ClaimResponse = {
  ok: boolean;
  error?: string;
  partyPass?: PartyPass & { qrDataUrl?: string };
};

const API_URL = process.env.NEXT_PUBLIC_DAWGS_API_URL ?? "http://localhost:4000/api";

export async function claimRewardCode(code: string): Promise<ClaimResponse> {
  const response = await fetch(`${API_URL}/claim-reward`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });

  return response.json();
}
