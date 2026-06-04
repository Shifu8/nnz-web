"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface Props {
  data: string;
  size?: number;
  dark?: string;
  light?: string;
}

export default function QRGenerator({ data, size = 256, dark = "#C8FF00", light = "#050505" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, data, {
      width: size,
      margin: 2,
      color: { dark, light },
      errorCorrectionLevel: "H",
    });
  }, [data, size, dark, light]);

  return <canvas ref={canvasRef} className="rounded-2xl" />;
}
