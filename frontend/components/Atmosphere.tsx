/**
 * Autor: Brandon Medina
 * Fecha: 2026
 * Descripcion: Atmosfera global NENEZ - Luxury photography studio with ambient lighting depth.
 */

export default function Atmosphere() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#0c0c0e]">
      {/* Luxury studio floor & wall ambient backdrop blending */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #09090b 0%, #16161a 35%, #0f0f12 70%, #08080a 100%)",
        }}
      />
      
      {/* Soft white-to-gray radial glows to add volumetric depth behind sections */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 15% 25%, rgba(255, 255, 255, 0.08) 0%, transparent 50%), radial-gradient(circle at 85% 60%, rgba(255, 255, 255, 0.07) 0%, transparent 50%), radial-gradient(circle at 50% 85%, rgba(255, 255, 255, 0.09) 0%, transparent 55%)",
        }}
      />
      
      {/* Soft spotlight overlay to mimic studio lighting setups */}
      <div 
        className="absolute left-1/4 top-1/3 w-[80vw] h-[70vh] rounded-full bg-white/[0.02] blur-[150px]" 
        style={{ transform: "translate3d(-20%, -20%, 0)" }}
      />
      
      {/* Vignette mask to maintain minimal cinematic framing */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.9)_100%)] opacity-95" />
      
      {/* Subtle scanline texture layer */}
      <div className="scanlines absolute inset-0 opacity-[0.06]" />
      
      {/* Grayscale room borders */}
      <div className="absolute inset-y-0 left-0 w-48 bg-gradient-to-r from-[#050507]/60 to-transparent" />
      <div className="absolute inset-y-0 right-0 w-48 bg-gradient-to-l from-[#050507]/60 to-transparent" />
    </div>
  );
}
