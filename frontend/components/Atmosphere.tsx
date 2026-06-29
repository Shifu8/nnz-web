/**
 * Autor: Brandon Medina
 * Fecha: 2026
 * Descripcion: Atmosfera global DAWGS - Estática, minimalista y monocromática.
 */

export default function Atmosphere() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black">
      {/* Soft static ambient background gradients */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, #030303 32%, rgba(255, 255, 255, 0.035) 68%, #050505 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 18% 28%, rgba(255, 255, 255, 0.038), transparent 48%), radial-gradient(circle at 82% 72%, rgba(255, 255, 255, 0.032), transparent 48%)",
        }}
      />
      
      {/* Gentle Vignette for cinematic framing */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_42%,rgba(0,0,0,0.88)_100%)] opacity-95" />
      
      {/* Quiet scanlines overlay for subtle texture */}
      <div className="scanlines absolute inset-0 opacity-[0.06]" />
      
      {/* Smooth side lighting boundaries */}
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black/60 to-transparent" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black/60 to-transparent" />
    </div>
  );
}
