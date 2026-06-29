/**
 * Autor: Brandon Medina
 * Fecha: 2026
 * Descripcion: Atmosfera global DAWGS - Luxury photography studio with ambient lighting depth.
 */

export default function Atmosphere() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#040404]">
      {/* Luxury studio floor & wall ambient backdrop blending */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #050505 0%, #0d0d0f 25%, #08080a 60%, #030303 100%)",
        }}
      />
      
      {/* Soft white-to-gray radial glows to add volumetric depth behind sections */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 15% 20%, rgba(255, 255, 255, 0.05) 0%, transparent 45%), radial-gradient(circle at 85% 55%, rgba(255, 255, 255, 0.045) 0%, transparent 48%), radial-gradient(circle at 50% 85%, rgba(255, 255, 255, 0.055) 0%, transparent 52%)",
        }}
      />
      
      {/* Soft spotlight overlay to mimic studio lighting setups */}
      <div 
        className="absolute left-1/4 top-1/3 w-[80vw] h-[70vh] rounded-full bg-white/[0.012] blur-[140px]" 
        style={{ transform: "translate3d(-20%, -20%, 0)" }}
      />
      
      {/* Vignette mask to maintain minimal cinematic framing */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,0.85)_100%)] opacity-95" />
      
      {/* Subtle scanline texture layer */}
      <div className="scanlines absolute inset-0 opacity-[0.05]" />
      
      {/* Grayscale room borders */}
      <div className="absolute inset-y-0 left-0 w-48 bg-gradient-to-r from-black/45 to-transparent" />
      <div className="absolute inset-y-0 right-0 w-48 bg-gradient-to-l from-black/45 to-transparent" />
    </div>
  );
}
