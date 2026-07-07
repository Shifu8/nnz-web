import type { PaymentMethod, ReceiptClassification } from "./types";

type ProfileRule = {
  label: string;
  pattern: RegExp;
  weight: number;
};

export type ReceiptReferenceProfile = {
  id: "banco-loja" | "pichincha-deuna" | "deposito-fisico" | "transferencia-generica";
  name: string;
  classification: ReceiptClassification;
  expectedPaymentMethod?: PaymentMethod;
  minimumScore: number;
  description: string;
  rules: ProfileRule[];
};

export type ReceiptProfileMatch = {
  profile: ReceiptReferenceProfile;
  score: number;
  minimumScore: number;
  matchedLabels: string[];
  isStrongMatch: boolean;
};

export const RECEIPT_REFERENCE_PROFILES: ReceiptReferenceProfile[] = [
  {
    id: "banco-loja",
    name: "Banco de Loja - envio exitoso",
    classification: "bank_transfer",
    expectedPaymentMethod: "banco-loja",
    minimumScore: 6,
    description:
      "Comprobante blanco y verde con Envio exitoso, monto transferido, bloques Desde y Para, costo de transaccion y numero de comprobante.",
    rules: [
      { label: "Banco de Loja", pattern: /\bbanco\s+(?:de\s+)?loja\b/, weight: 2.5 },
      { label: "Envio exitoso", pattern: /\benvio\s+exitoso\b/, weight: 2 },
      { label: "Monto transferido", pattern: /\bmonto\s+transferido\b/, weight: 1.5 },
      { label: "Desde y para", pattern: /\bdesde\b[\s\S]{0,500}\bpara\b/, weight: 1 },
      { label: "Costo de transaccion", pattern: /\bcosto\s+de\s+transaccion\b/, weight: 1 },
      {
        label: "Numero de comprobante",
        pattern: /\b(?:nro|no|numero)\s*(?:de\s+)?comprobante\b/,
        weight: 1.5,
      },
      {
        label: "Cuenta de ahorros",
        pattern: /\bcuenta\s+de\s+ahorros?\b|\bcta\.?\s*ahorro\b/,
        weight: 0.75,
      },
    ],
  },
  {
    id: "pichincha-deuna",
    name: "Banco Pichincha - Deuna",
    classification: "banking_app_screenshot",
    expectedPaymentMethod: "banco-pichincha",
    minimumScore: 6,
    description:
      "Pantalla clara de Banco Pichincha o Deuna con Pago exitoso, monto, beneficiario, cuentas de origen y destino, numero de comprobante y, a veces, codigo QR.",
    rules: [
      { label: "Banco Pichincha", pattern: /\bbanco\s+pichincha\b|\bpichincha\b/, weight: 2 },
      { label: "Deuna", pattern: /\bdeuna\b/, weight: 2 },
      { label: "Pago exitoso", pattern: /\bpago\s+exitoso\b/, weight: 2 },
      { label: "Cuenta destino", pattern: /\bcuenta\s+destino\b/, weight: 1 },
      { label: "Cuenta origen", pattern: /\bcuenta\s+origen\b/, weight: 1 },
      { label: "Banco destino", pattern: /\bbanco\s+destino\b/, weight: 0.75 },
      {
        label: "Numero de comprobante",
        pattern: /\b(?:n|no|numero)\s*(?:de\s+)?comprobante\b/,
        weight: 1.5,
      },
      {
        label: "Verificacion QR",
        pattern: /\bverificar\s+la\s+transaccion\b|\bcodigo\s+qr\b|\bqr\b/,
        weight: 0.75,
      },
    ],
  },
  {
    id: "deposito-fisico",
    name: "Deposito fisico",
    classification: "bank_deposit",
    minimumScore: 5.5,
    description:
      "Foto de una papeleta, recibo de ventanilla o comprobante de cajero. Debe ser legible y mostrar banco o agencia, deposito, cuenta, fecha y monto o valor.",
    rules: [
      {
        label: "Deposito",
        pattern: /\bdeposito\b|\bdepositado\b|\bcomprobante\s+de\s+deposito\b/,
        weight: 2.5,
      },
      {
        label: "Documento fisico",
        pattern: /\bpapeleta\b|\bventanilla\b|\bcajero\b|\brecibo\b|\boficina\b|\bcontrol\b/,
        weight: 1.5,
      },
      { label: "Efectivo", pattern: /\befectivo\b/, weight: 1 },
      { label: "Depositante", pattern: /\bdepositante\b|\bdepositado\s+por\b/, weight: 1 },
      { label: "Cuenta", pattern: /\bcuenta\b|\bcta\.?\b/, weight: 1 },
      { label: "Monto o valor", pattern: /\bmonto\b|\bvalor\b|\btotal\b/, weight: 1 },
      { label: "Fecha", pattern: /\bfecha\b/, weight: 0.75 },
      { label: "Agencia o sello", pattern: /\bagencia\b|\bsucursal\b|\bsello\b|\btimbre\b/, weight: 0.75 },
    ],
  },
  {
    id: "transferencia-generica",
    name: "Transferencia o pago bancario",
    classification: "payment_receipt",
    minimumScore: 6,
    description:
      "Comprobante de otra entidad con banco o billetera, estado exitoso, monto, fecha y referencia, comprobante u operacion.",
    rules: [
      {
        label: "Operacion financiera",
        pattern: /\btransferencia\b|\btransferido\b|\bpago\b|\benvio\b/,
        weight: 2,
      },
      {
        label: "Estado exitoso",
        pattern: /\bexitos[oa]\b|\brealizad[oa]\b|\baprobado\b|\bcompletad[oa]\b/,
        weight: 1.5,
      },
      { label: "Banco", pattern: /\bbanco\b|\bcooperativa\b|\bbilletera\b/, weight: 1 },
      { label: "Monto o valor", pattern: /\bmonto\b|\bvalor\b|\btotal\b|\busd\b/, weight: 1 },
      {
        label: "Referencia",
        pattern: /\bcomprobante\b|\breferencia\b|\boperacion\b|\btransaccion\b/,
        weight: 1,
      },
      { label: "Fecha", pattern: /\bfecha\b|\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/, weight: 0.75 },
      { label: "Cuenta", pattern: /\bcuenta\b|\bcta\.?\b/, weight: 0.75 },
    ],
  },
];

export function normalizeReceiptText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}$.,:/\-\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchReceiptProfiles(
  text: string,
  expectedPaymentMethod?: PaymentMethod,
): ReceiptProfileMatch[] {
  const normalized = normalizeReceiptText(text);

  return RECEIPT_REFERENCE_PROFILES.map((profile) => {
    const matched = profile.rules.filter(({ pattern }) => pattern.test(normalized));
    const expectedBankBonus =
      expectedPaymentMethod &&
      profile.expectedPaymentMethod === expectedPaymentMethod
        ? 0.5
        : 0;
    const score =
      matched.reduce((total, rule) => total + rule.weight, 0) + expectedBankBonus;

    return {
      profile,
      score,
      minimumScore: profile.minimumScore,
      matchedLabels: matched.map(({ label }) => label),
      isStrongMatch: score >= profile.minimumScore,
    };
  }).sort((left, right) => right.score - left.score);
}

export function receiptProfilePrompt(): string {
  return RECEIPT_REFERENCE_PROFILES.map(
    (profile) => `${profile.name}: ${profile.description}`,
  ).join("\n");
}
