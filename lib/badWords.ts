/**
 * Autor: Brandon Medina
 * Fecha: 16/05/2026
 * Descripción: Lista de palabras prohibidas y función de validación para prevenir nombres ofensivos.
 */

export const badWords = [
  "pene", "verga", "careverga", "puta", "puto", "maricon", "mierda", "pendejo", 
  "culero", "mamaguevo", "hpta", "hijueputa", "chucha", "vergon", "pipi", 
  "sex", "xxx", "nazi", "nigga", "negro" // negro se bloquea si se usa como insulto, pero aquí lo bloqueamos preventivamente en nombres
];

/**
 * Valida si un texto contiene palabras prohibidas.
 * @param text Texto a validar
 * @returns true si contiene palabras prohibidas
 */
export function isBadWord(text: string): boolean {
  if (!text) return false;
  const normalizedText = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return badWords.some(word => normalizedText.includes(word));
}
