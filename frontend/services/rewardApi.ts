/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * Descripción: Cliente API para validar códigos y reclamar Party Pass.
 */

import type { PartyPass } from "@/frontend/types/domain";

type ClaimResponse = {
  ok: boolean;
  error?: string;
  partyPass?: PartyPass & { qrDataUrl?: string };
};

export async function claimRewardCode(code: string): Promise<ClaimResponse> {
  try {
    const response = await fetch(`/api/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    const data = await response.json();
    
    if (!response.ok || !data.success) {
      return { ok: false, error: data.error || "No se pudo reclamar el código." };
    }

    return { ok: true, partyPass: data.partyPass };
  } catch (error) {
    return { ok: false, error: "Error de red" };
  }
}
