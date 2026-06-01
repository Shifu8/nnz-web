import QRCode from "qrcode";

export async function generateTicketQrPng(qrPayload: string): Promise<Buffer> {
  return QRCode.toBuffer(qrPayload, {
    errorCorrectionLevel: "H",
    type: "png",
    width: 512,
    margin: 2,
    color: { dark: "#C8FF00", light: "#050505" },
  });
}
