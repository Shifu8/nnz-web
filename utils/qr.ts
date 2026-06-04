import QRCode from "qrcode";

export async function generateTicketQrPng(data: string): Promise<Buffer> {
  return QRCode.toBuffer(data, {
    errorCorrectionLevel: "H",
    type: "png",
    width: 512,
    margin: 2,
    color: { dark: "#C8FF00", light: "#050505" },
  });
}

export async function generateTicketQrDataUri(data: string): Promise<string> {
  const png = await generateTicketQrPng(data);
  return `data:image/png;base64,${png.toString("base64")}`;
}
