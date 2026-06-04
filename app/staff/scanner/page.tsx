"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import jsQR, { type QRCode } from "jsqr";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Camera,
  GraduationCap,
  Loader2,
  LogOut,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  TicketCheck,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { gsap } from "gsap";

type ScanType = "ticket" | "student";
type ScanKind = "ticket" | "student";
type ScanStatus = "allowed" | "review" | "rejected";

type StudentInfo = {
  fullName?: string;
  documentNumber?: string;
  career?: string;
  modality?: string;
  gender?: "female" | "male" | "unknown";
};

type ScanResult = {
  valid: boolean;
  kind: ScanKind;
  status: ScanStatus;
  message: string;
  serialNumber?: string;
  scannedAt?: string;
  holderName?: string;
  quantity?: number;
  scanNumber?: number;
  remainingUses?: number;
  student?: StudentInfo;
  reason?: string;
  requiresVisualCardCheck?: boolean;
};

type ApiScanResponse = {
  valid: boolean;
  kind?: ScanKind;
  status?: ScanStatus;
  message?: string;
  error?: string;
  reason?: string;
  scannedAt?: string;
  passInfo?: {
    serialNumber?: string;
    scannedAt?: string;
    holderName?: string;
    quantity?: number;
    scanNumber?: number;
    remainingUses?: number;
  };
  student?: StudentInfo;
  requiresVisualCardCheck?: boolean;
};

type OcrResponse = {
  text?: string;
};

const SCAN_MODES: {
  id: ScanType;
  label: string;
  hint: string;
  Icon: LucideIcon;
}[] = [
  { id: "ticket", label: "Entrada", hint: "QR compra", Icon: TicketCheck },
  { id: "student", label: "Carnet", hint: "Lee carrera", Icon: GraduationCap },
];

const SCAN_INTERVAL_MS = 80;
const MAX_SCAN_WIDTH = 640;
const MAX_SCAN_HEIGHT = 800;
const OCR_MAX_WIDTH = 760;
const OCR_IMAGE_QUALITY = 0.72;

function resolveScanResult(payload: ApiScanResponse, fallbackType: ScanType): ScanResult {
  const valid = Boolean(payload.valid);
  const kind: ScanKind = payload.kind || (fallbackType === "student" ? "student" : "ticket");
  const status: ScanStatus = payload.status || (valid ? "allowed" : "rejected");
  const passInfo = payload.passInfo;
  const student = payload.student;
  let message = payload.message || payload.error || "QR INVALIDO";

  if (valid && kind === "ticket") {
    if (passInfo?.quantity && passInfo.quantity > 1) {
      message = `ACCESO ${passInfo.scanNumber || 1}/${passInfo.quantity}`;
    } else {
      message = "ACCESO PERMITIDO";
    }
  }

  if (valid && kind === "student" && student?.career) {
    message = `VALIDADO: ${student.career}`;
  }

  if (!valid && payload.error === "CARNET YA REGISTRADO") {
    message = "CARNET YA REGISTRADO";
  }

  if (!valid && payload.error === "SOLO ACCESO FEMENINO") {
    message = "SOLO ACCESO FEMENINO";
  }

  return {
    valid,
    kind,
    status,
    message,
    serialNumber: passInfo?.serialNumber,
    scannedAt: passInfo?.scannedAt || payload.scannedAt || new Date().toISOString(),
    holderName: passInfo?.holderName,
    quantity: passInfo?.quantity,
    scanNumber: passInfo?.scanNumber,
    remainingUses: passInfo?.remainingUses,
    student,
    reason: payload.reason,
    requiresVisualCardCheck: payload.requiresVisualCardCheck,
  };
}

function getTone(status: ScanStatus) {
  if (status === "allowed") {
    return {
      panel: "bg-green-950/85",
      icon: "bg-green-500/20 text-green-300 shadow-[0_0_30px_rgba(34,197,94,0.55)]",
      text: "text-green-300",
      glow: "rgba(34,197,94,0.85)",
      label: "permitido",
    };
  }

  if (status === "review") {
    return {
      panel: "bg-amber-950/85",
      icon: "bg-amber-400/20 text-amber-200 shadow-[0_0_30px_rgba(251,191,36,0.45)]",
      text: "text-amber-200",
      glow: "rgba(251,191,36,0.8)",
      label: "revision",
    };
  }

  return {
    panel: "bg-red-950/85",
    icon: "bg-red-500/20 text-red-300 shadow-[0_0_30px_rgba(255,0,0,0.5)]",
    text: "text-red-300",
    glow: "rgba(255,0,24,0.85)",
    label: "rechazado",
  };
}

function cameraErrorMessage(error: unknown): string {
  const name = error instanceof DOMException ? error.name : "";
  if (window.isSecureContext === false) return "CAMARA REQUIERE HTTPS O LOCALHOST";
  if (name === "NotAllowedError") return "PERMISO DE CAMARA DENEGADO";
  if (name === "NotFoundError") return "NO HAY CAMARA DISPONIBLE";
  return "NO SE PUDO ABRIR LA CAMARA";
}

function prepareOcrCanvas(source: HTMLCanvasElement, qr: QRCode): HTMLCanvasElement {
  const corners = [
    qr.location.topLeftCorner,
    qr.location.topRightCorner,
    qr.location.bottomLeftCorner,
    qr.location.bottomRightCorner,
  ];
  const qrWidth = Math.max(...corners.map((point) => point.x)) - Math.min(...corners.map((point) => point.x));
  const qrHeight = Math.max(...corners.map((point) => point.y)) - Math.min(...corners.map((point) => point.y));
  const qrSize = Math.max(qrWidth, qrHeight, 120);
  const sidePadding = Math.round(qrSize * 0.25);
  const minX = Math.max(0, Math.floor(Math.min(...corners.map((point) => point.x)) - sidePadding));
  const maxX = Math.min(source.width, Math.ceil(Math.max(...corners.map((point) => point.x)) + sidePadding));
  const qrBottom = Math.max(...corners.map((point) => point.y));
  const top = Math.max(0, Math.floor(qrBottom + qrSize * 0.08));
  const bottom = Math.min(source.height, Math.ceil(qrBottom + qrSize * 1.05));
  const width = Math.max(80, maxX - minX);
  const height = Math.max(80, bottom - top);
  const scale = Math.min(1.45, OCR_MAX_WIDTH / width);
  const target = document.createElement("canvas");
  target.width = Math.max(120, Math.round(width * scale));
  target.height = Math.max(120, Math.round(height * scale));

  const ctx = target.getContext("2d", { willReadFrequently: true });
  if (!ctx) return source;

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(source, minX, top, width, height, 0, 0, target.width, target.height);

  const imageData = ctx.getImageData(0, 0, target.width, target.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    const value = gray < 170 ? 0 : 255;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
  }
  ctx.putImageData(imageData, 0, 0);
  return target;
}

export default function ScannerPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const scanFrameRef = useRef<(() => void) | null>(null);
  const scanningRef = useRef(true);
  const processingRef = useRef(false);
  const scanTypeRef = useRef<ScanType>("ticket");
  const lastPayloadRef = useRef<string | null>(null);
  const lastScanAtRef = useRef(0);
  const lastFrameAtRef = useRef(0);
  const csrfTokenRef = useRef("");
  const [scanType, setScanType] = useState<ScanType>("ticket");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(true);
  const [processingLabel, setProcessingLabel] = useState("");
  const [confirmedCareer, setConfirmedCareer] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const CAREER_LABELS: Record<string, string> = {
    psicologia: "PSICOLOGIA CLINICA",
    fisioterapia: "FISIOTERAPIA",
    nutricion: "NUTRICION Y DIETETICA",
    derecho: "DERECHO",
  };

  const CAREER_OPTIONS = Object.entries(CAREER_LABELS).map(([id, label]) => ({ id, label }));
  const [csrfToken, setCsrfToken] = useState("");
  const [sessionReady, setSessionReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    scanTypeRef.current = scanType;
  }, [scanType]);

  useEffect(() => {
    csrfTokenRef.current = csrfToken;
  }, [csrfToken]);

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    setScanning(false);
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const readVisibleCardText = useCallback(
    async (source: HTMLCanvasElement, qr: QRCode) => {
      setProcessingLabel("Leyendo carnet...");
      try {
        const ocrCanvas = prepareOcrCanvas(source, qr);
        const imageData = ocrCanvas.toDataURL("image/jpeg", OCR_IMAGE_QUALITY);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        const res = await fetch("/api/staff/ocr-card", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": csrfTokenRef.current,
          },
          body: JSON.stringify({ imageData }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) return "";
        const result = (await res.json()) as OcrResponse;
        return result.text || "";
      } catch {
        return "";
      }
    },
    [],
  );

  const submitScan = useCallback(
    async (qrPayload: string, activeType: ScanType, visualText = "") => {
      const res = await fetch("/api/passes/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfTokenRef.current,
        },
        body: JSON.stringify({ qrPayload, scanType: activeType, visualText }),
      });
      const result = (await res.json()) as ApiScanResponse;
      const nextResult = resolveScanResult(result, activeType);
      setScanResult(nextResult);

      gsap.fromTo(
        ".scanner-container",
        { boxShadow: `0 0 110px ${getTone(nextResult.status).glow}` },
        { boxShadow: "0 0 32px rgba(0,0,0,0.55)", duration: 2, ease: "power2.out" },
      );
    },
    [],
  );

  const processQr = useCallback(
    async (qrPayload: string, qr: QRCode, frame: HTMLCanvasElement) => {
      const now = Date.now();
      if (processingRef.current || (lastPayloadRef.current === qrPayload && now - lastScanAtRef.current < 3000)) return;
      processingRef.current = true;
      lastPayloadRef.current = qrPayload;
      lastScanAtRef.current = now;
      const activeType = scanTypeRef.current;

      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      stopCamera();

      // OCR runs in background (not blocking) - data comes from QR itself
      if (activeType === "student") {
        readVisibleCardText(frame, qr).catch(() => {});
      }

      try {
        setProcessingLabel(activeType === "student" ? "Validando carnet..." : "Validando entrada...");
        await submitScan(qrPayload, activeType, "");
      } catch {
        setScanResult({
          valid: false,
          kind: activeType === "student" ? "student" : "ticket",
          status: "rejected",
          message: "ERROR DE RED",
          scannedAt: new Date().toISOString(),
        });
      } finally {
        setProcessingLabel("");
        processingRef.current = false;
      }
    },
    [readVisibleCardText, stopCamera, submitScan],
  );

  const scanFrame = useCallback(() => {
    if (!scanningRef.current || processingRef.current) return;

    const now = performance.now();
    if (now - lastFrameAtRef.current < SCAN_INTERVAL_MS) {
      frameRef.current = requestAnimationFrame(() => scanFrameRef.current?.());
      return;
    }
    lastFrameAtRef.current = now;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });

    if (video && canvas && context && video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
      const scale = Math.min(1, MAX_SCAN_WIDTH / video.videoWidth, MAX_SCAN_HEIGHT / video.videoHeight);
      canvas.width = Math.max(240, Math.round(video.videoWidth * scale));
      canvas.height = Math.max(320, Math.round(video.videoHeight * scale));
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const qr = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });
      if (qr) {
        void processQr(qr.data, qr, canvas);
        return;
      }
    }

    frameRef.current = requestAnimationFrame(() => scanFrameRef.current?.());
  }, [processQr]);

  useEffect(() => {
    scanFrameRef.current = scanFrame;
  }, [scanFrame]);

  const startCamera = useCallback(async () => {
    setScanResult(null);
    setProcessingLabel("");
    processingRef.current = false;
    lastFrameAtRef.current = 0;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 640 },
          height: { ideal: 800 },
          frameRate: { ideal: 20 },
        },
        audio: false,
      });

      streamRef.current = stream;
      scanningRef.current = true;
      setScanning(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
      }

      frameRef.current = requestAnimationFrame(() => scanFrameRef.current?.());
    } catch (error) {
      setScanResult({
        valid: false,
        kind: scanTypeRef.current === "student" ? "student" : "ticket",
        status: "rejected",
        message: cameraErrorMessage(error),
      });
      setScanning(false);
      scanningRef.current = false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function verifySession() {
      try {
        const res = await fetch("/api/staff/session", { cache: "no-store" });
        if (!res.ok) {
          router.push("/");
          return;
        }
        const data = await res.json();
        if (!mounted) return;
        if (data.role !== "staff" && data.role !== "admin") {
          router.push("/");
          return;
        }
        csrfTokenRef.current = data.csrfToken;
        setCsrfToken(data.csrfToken);
        setSessionReady(true);
        await startCamera();
      } catch {
        router.push("/");
      }
    }

    verifySession();
    return () => {
      mounted = false;
      stopCamera();
    };
  }, [router, startCamera, stopCamera]);

  const resetScanner = async () => {
    resetConfirmState();
    lastPayloadRef.current = null;
    await startCamera();
  };

  const handleConfirm = async () => {
    if (!scanResult?.student || !confirmedCareer) return;
    setSaving(true);
    try {
      const res = await fetch("/api/passes/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfTokenRef.current,
        },
        body: JSON.stringify({
          qrPayload: lastPayloadRef.current,
          careerId: confirmedCareer,
          student: {
            fullName: scanResult.student.fullName,
            documentNumber: scanResult.student.documentNumber,
            modality: scanResult.student.modality,
            gender: scanResult.student.gender || "unknown",
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => resetScanner(), 1500);
      } else {
        setScanResult((prev) => {
          if (!prev) return null;
          const errMsg = data.error || "ERROR AL GUARDAR";
          return { ...prev, valid: false, status: "rejected", message: errMsg, reason: data.reason };
        });
      }
    } catch {
      setScanResult((prev) => prev ? { ...prev, status: "rejected", message: "ERROR DE RED" } : null);
    } finally {
      setSaving(false);
    }
  };

  const resetConfirmState = () => {
    setConfirmedCareer("");
    setSaved(false);
  };

  const handleLogout = async () => {
    await fetch("/api/staff/session", { method: "DELETE" }).catch(() => {});
    stopCamera();
    router.push("/");
  };

  const currentMode = SCAN_MODES.find((mode) => mode.id === scanType) || SCAN_MODES[0];
  const resultTone = scanResult ? getTone(scanResult.status) : null;
  const ResultIcon = scanResult?.status === "review" ? AlertTriangle : scanResult?.valid ? ShieldCheck : ShieldAlert;

  return (
    <div className="relative min-h-screen overflow-hidden bg-black px-4 py-5 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(200,255,0,0.11),transparent_34%),linear-gradient(180deg,rgba(255,0,24,0.08),transparent_42%)]" />
      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black uppercase tracking-[0.2em] text-white">Staff Mode</h1>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.25em] text-zinc-500">
              {sessionReady ? "Scanner activo" : "Verificando sesion"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Salir"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition hover:bg-white/20"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-[22px] border border-white/10 bg-zinc-950/80 p-2 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          {SCAN_MODES.map(({ id, label, hint, Icon }) => {
            const active = scanType === id;
            return (
              <button
                key={id}
                type="button"
                title={hint}
                onClick={() => {
                  scanTypeRef.current = id;
                  setScanType(id);
                }}
                className={`flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-2xl border px-2 text-center transition active:scale-[0.98] ${
                  active
                    ? "border-[#C8FF00]/50 bg-[#C8FF00]/15 text-[#C8FF00] shadow-[0_0_26px_rgba(200,255,0,0.08)]"
                    : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-black uppercase tracking-[0.12em]">{label}</span>
                <span className="text-[7px] font-bold uppercase tracking-[0.12em] text-zinc-500">{hint}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-[#C8FF00]">
              <currentMode.Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">{currentMode.label}</p>
              <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                {scanType === "ticket" ? "Uso unico" : "OCR de carnet"}
              </p>
            </div>
          </div>
          <div className={`h-2.5 w-2.5 rounded-full ${scanning ? "bg-green-400 shadow-[0_0_14px_rgba(74,222,128,0.8)]" : "bg-zinc-600"}`} />
        </div>

        <div className="scanner-container relative mt-5 aspect-[3/4] w-full overflow-hidden rounded-[28px] border border-white/20 bg-zinc-900 shadow-[0_0_32px_rgba(0,0,0,.55)]">
          <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" muted playsInline />
          <canvas ref={canvasRef} className="hidden" />

          <div className="pointer-events-none absolute inset-6 rounded-[22px] border border-white/25 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.45)]">
            <div className="absolute left-0 right-0 top-1/2 h-px bg-[#C8FF00]/70 shadow-[0_0_18px_rgba(200,255,0,0.6)]" />
          </div>

          {processingLabel && !scanResult && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 p-6 text-center backdrop-blur-md">
              <div className="h-14 w-14 animate-spin rounded-full border-2 border-[#C8FF00]/20 border-t-[#C8FF00]" />
              <p className="mt-5 text-[10px] font-black uppercase tracking-[0.24em] text-[#C8FF00]">{processingLabel}</p>
            </div>
          )}

          {scanResult && resultTone && (
            <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center backdrop-blur-md ${resultTone.panel} ${scanResult.valid && scanResult.kind === "student" && !saved ? "overflow-y-auto" : ""}`}>
              {saved ? (
                <>
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-500/20 text-green-300 shadow-[0_0_30px_rgba(34,197,94,0.55)]">
                    <CheckCircle2 className="h-12 w-12" />
                  </div>
                  <h2 className="mt-6 text-3xl font-black uppercase tracking-[0.08em] text-green-300">GUARDADO</h2>
                </>
              ) : (
                <>
                  <div className={`flex h-24 w-24 items-center justify-center rounded-full ${resultTone.icon}`}>
                    <ResultIcon className="h-12 w-12" />
                  </div>

                  <div className="mt-5 flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1">
                    {scanResult.kind === "ticket" ? <TicketCheck className="h-3.5 w-3.5" /> : <GraduationCap className="h-3.5 w-3.5" />}
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-200">
                      {scanResult.kind === "ticket" ? "entrada" : "carnet utpl"} / {resultTone.label}
                    </span>
                  </div>

                  <h2 className={`mt-4 max-w-[290px] text-balance text-2xl font-black uppercase tracking-[0.08em] ${resultTone.text}`}>
                    {scanResult.message}
                  </h2>

                  {scanResult.serialNumber && (
                    <p className="mt-3 rounded-full border border-white/10 bg-black/35 px-4 py-2 font-mono text-[10px] text-zinc-200">
                      {scanResult.serialNumber}
                    </p>
                  )}

                  {scanResult.student && scanResult.valid && scanResult.kind === "student" && (
                    <div className="mt-4 flex flex-col items-center gap-3 w-full max-w-[300px]">
                      <div className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-left space-y-2">
                        {scanResult.student.fullName && (
                          <div>
                            <p className="text-[7px] font-black uppercase tracking-[0.24em] text-zinc-500">nombre</p>
                            <p className="mt-0.5 text-xs font-black uppercase tracking-[0.08em] text-white">{scanResult.student.fullName}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-[7px] font-black uppercase tracking-[0.24em] text-zinc-500">carrera detectada</p>
                          <p className="mt-0.5 text-sm font-black uppercase tracking-[0.08em] text-white">{scanResult.student.career || "No detectada"}</p>
                        </div>
                      </div>

                      <p className="text-[7px] font-black uppercase tracking-[0.3em] text-zinc-400 mt-1">SELECCIONA LA CARRERA QUE VISTE EN EL CARNET</p>
                      <div className="grid grid-cols-2 gap-3 w-full">
                        {CAREER_OPTIONS.map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => setConfirmedCareer(opt.id)}
                            className={`rounded-2xl border-2 px-4 py-4 text-center text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 ${
                              confirmedCareer === opt.id
                                ? "border-[#C8FF00] bg-[#C8FF00]/20 text-[#C8FF00] shadow-[0_0_30px_rgba(200,255,0,0.25)] scale-105"
                                : "border-white/20 bg-white/[0.08] text-white hover:bg-white/[0.14] hover:border-white/40 hover:scale-[1.02]"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={handleConfirm}
                        disabled={saving || !confirmedCareer}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-[#C8FF00] px-6 py-4 w-full text-xs font-black uppercase tracking-wider text-black transition hover:bg-[#daff33] active:scale-95 disabled:opacity-40 shadow-[0_0_40px_rgba(200,255,0,0.3)]"
                      >
                        {saving ? <><Loader2 className="h-5 w-5 animate-spin" /> GUARDANDO...</> : <><CheckCircle2 className="h-5 w-5" /> GUARDAR</>}
                      </button>
                    </div>
                  )}

                  {scanResult.student && !scanResult.valid && scanResult.kind === "student" && (
                    <div className="mt-4 w-full max-w-[280px] rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-left space-y-2">
                      {scanResult.student.fullName && (
                        <div>
                          <p className="text-[7px] font-black uppercase tracking-[0.24em] text-zinc-500">nombre</p>
                          <p className="mt-0.5 text-xs font-black uppercase tracking-[0.08em] text-white">{scanResult.student.fullName}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-[7px] font-black uppercase tracking-[0.24em] text-zinc-500">carrera</p>
                        <p className="mt-0.5 text-sm font-black uppercase tracking-[0.08em] text-white">{scanResult.student.career || "No detectada"}</p>
                      </div>
                    </div>
                  )}

                  {scanResult.kind === "student" && !scanResult.valid && (
                    <p className="mt-4 max-w-[280px] text-[9px] font-bold uppercase leading-4 tracking-[0.08em] text-zinc-200/85">
                      {scanResult.reason === "duplicate" ? "ESTE QR YA FUE REGISTRADO." : ""}
                    </p>
                  )}

                  {scanResult.quantity && scanResult.quantity > 1 && (
                    <div className="mt-3 grid w-full max-w-[230px] grid-cols-2 gap-2">
                      <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                        <p className="text-[7px] font-black uppercase tracking-[0.2em] text-zinc-500">uso</p>
                        <p className="mt-1 text-lg font-black text-white">{scanResult.scanNumber}/{scanResult.quantity}</p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                        <p className="text-[7px] font-black uppercase tracking-[0.2em] text-zinc-500">quedan</p>
                        <p className="mt-1 text-lg font-black text-[#C8FF00]">{scanResult.remainingUses ?? 0}</p>
                      </div>
                    </div>
                  )}

                  <button onClick={resetScanner} className="mt-8 flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-black uppercase tracking-widest text-black shadow-xl transition hover:scale-105 active:scale-95">
                    <RefreshCw className="h-5 w-5" /> Escanear otro
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="mt-5 text-center text-xs tracking-widest text-zinc-500">
          <Camera className="mr-2 inline-block h-4 w-4" /> APUNTA AL QR Y AL TEXTO DEL CARNET
        </div>
      </div>
    </div>
  );
}
