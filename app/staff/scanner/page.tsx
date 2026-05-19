/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * Descripción: Escáner QR para STAFF con validación en vivo y glow cinematográfico.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { useRouter } from "next/navigation";
import { ShieldCheck, ShieldAlert, LogOut, Camera, RefreshCw } from "lucide-react";
import { gsap } from "gsap";

export default function ScannerPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanResult, setScanResult] = useState<{ valid: boolean; message: string } | null>(null);
  const [scanning, setScanning] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const session = localStorage.getItem("dawgs_staff_session");
    if (!session) {
      router.push("/");
      return;
    }
    startCamera();
    return () => stopCamera();
  }, [router]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.play();
        requestAnimationFrame(tick);
      }
    } catch (err) {
      console.error("Error accessing camera", err);
      setScanResult({ valid: false, message: "No se pudo acceder a la cámara" });
      setScanning(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    }
  };

  const tick = () => {
    if (!scanning) return;
    
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return;

      canvas.height = videoRef.current.videoHeight;
      canvas.width = videoRef.current.videoWidth;
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code) {
        console.log("Found QR code data:", code.data);
        handleScan(code.data);
      }
    }
    if (scanning) {
      requestAnimationFrame(tick);
    }
  };

  const handleScan = async (data: string) => {
    setScanning(false);
    console.log("Processing scanned payload:", data);
    
    try {
      const audio = new Audio("data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq");
      audio.play().catch(() => {});
    } catch(e) {}
    
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]); // Stronger vibration pattern

    try {
      const res = await fetch("/api/passes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrPayload: data })
      });
      const result = await res.json();
      console.log("Validation result:", result);

      setScanResult({
        valid: result.valid,
        message: result.valid ? "ACCESO PERMITIDO" : result.error || "QR INVÁLIDO"
      });

      // Intense Glow Animation
      const color = result.valid ? "rgba(0,255,0,0.8)" : "rgba(255,0,24,0.8)";
      gsap.fromTo(
        ".scanner-container",
        { boxShadow: `0 0 100px ${color}` },
        { boxShadow: "0 0 30px rgba(0,0,0,0.5)", duration: 2, ease: "power2.out" }
      );

    } catch (err) {
      console.error("Fetch validation error", err);
      setScanResult({ valid: false, message: "ERROR DE RED" });
      gsap.fromTo(
        ".scanner-container",
        { boxShadow: "0 0 100px rgba(255,0,24,0.8)" },
        { boxShadow: "0 0 30px rgba(0,0,0,0.5)", duration: 2, ease: "power2.out" }
      );
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setScanning(true);
    requestAnimationFrame(tick);
  };

  const handleLogout = () => {
    localStorage.removeItem("dawgs_staff_session");
    router.push("/");
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-black p-4 text-white">
      <div className="absolute top-6 flex w-full max-w-md items-center justify-between px-6 z-10">
        <h1 className="text-xl font-black uppercase tracking-[0.2em] text-white">Staff Mode</h1>
        <button onClick={handleLogout} className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      <div className="scanner-container relative mt-12 aspect-[3/4] w-full max-w-sm overflow-hidden rounded-3xl border border-white/20 bg-zinc-900 shadow-[0_0_50px_rgba(255,0,24,.1)]">
        <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />

        {/* Scanner Overlay */}
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="relative h-64 w-64 border-2 border-white/30">
            <div className="absolute -left-1 -top-1 h-6 w-6 border-l-4 border-t-4 border-red-500"></div>
            <div className="absolute -right-1 -top-1 h-6 w-6 border-r-4 border-t-4 border-red-500"></div>
            <div className="absolute -bottom-1 -left-1 h-6 w-6 border-b-4 border-l-4 border-red-500"></div>
            <div className="absolute -bottom-1 -right-1 h-6 w-6 border-b-4 border-r-4 border-red-500"></div>
            {scanning && <div className="absolute left-0 top-0 h-1 w-full bg-red-500/80 shadow-[0_0_15px_red] animate-scan-line"></div>}
          </div>
        </div>

        {/* Result Overlay */}
        {scanResult && (
          <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center p-6 backdrop-blur-md ${scanResult.valid ? 'bg-green-950/80' : 'bg-red-950/80'}`}>
            <div className={`flex h-24 w-24 items-center justify-center rounded-full ${scanResult.valid ? 'bg-green-500/20 text-green-400 shadow-[0_0_30px_rgba(0,255,0,0.5)]' : 'bg-red-500/20 text-red-400 shadow-[0_0_30px_rgba(255,0,0,0.5)]'}`}>
              {scanResult.valid ? <ShieldCheck className="h-12 w-12" /> : <ShieldAlert className="h-12 w-12" />}
            </div>
            <h2 className={`mt-6 text-center text-2xl font-black uppercase tracking-[0.1em] drop-shadow-md ${scanResult.valid ? 'text-green-400' : 'text-red-400'}`}>
              {scanResult.message}
            </h2>
            
            <button 
              onClick={resetScanner} 
              className="mt-12 flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-black uppercase tracking-widest text-black shadow-xl transition hover:scale-105 active:scale-95"
            >
              <RefreshCw className="h-5 w-5" /> SCAN AGAIN
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 text-center text-xs tracking-widest text-zinc-500">
        <Camera className="inline-block mr-2 h-4 w-4" /> POINT AT PASS QR CODE
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .animate-scan-line {
          animation: scan 2.5s infinite linear;
        }
      `}} />
    </div>
  );
}
