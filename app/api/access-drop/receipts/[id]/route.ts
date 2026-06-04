import { NextRequest, NextResponse } from "next/server";
import { getReceiptById, getFileBuffer } from "@/lib/access-drop/storage";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const receipt = getReceiptById(id);

    if (!receipt) {
      return NextResponse.json({ error: "COMPROBANTE NO ENCONTRADO." }, { status: 404 });
    }

    if (_request.nextUrl.searchParams.get("file") === "true") {
      const buffer = getFileBuffer(receipt.filePath);
      if (!buffer) {
        return NextResponse.json({ error: "ARCHIVO NO ENCONTRADO." }, { status: 404 });
      }

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": receipt.mimeType || "image/png",
          "Content-Disposition": `inline; filename="${receipt.originalFileName}"`,
          "Cache-Control": "no-cache",
        },
      });
    }

    return NextResponse.json({ receipt });
  } catch (err) {
    console.error("Error fetching receipt:", err);
    return NextResponse.json({ error: "ERROR INTERNO." }, { status: 500 });
  }
}
