/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * Descripcion: Atmosfera global DAWGS con textura, luces y scanlines.
 */

export default function Atmosphere() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(var(--theme-primary-rgb), 0.22) 0%, #030303 18%, rgba(var(--theme-primary-rgb), 0.3) 48%, #050505 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 14% 23%, rgba(var(--theme-primary-rgb), 0.44), transparent 34%), radial-gradient(circle at 86% 68%, rgba(var(--theme-primary-rgb), 0.38), transparent 38%), linear-gradient(112deg, rgba(var(--theme-primary-rgb), 0.36) 0%, transparent 30%, transparent 58%, rgba(var(--theme-primary-rgb), 0.25) 100%)",
        }}
      />
      <div
        className="dawgs-theme-breathe absolute inset-[-18%] mix-blend-screen"
        style={{
          background:
            "radial-gradient(ellipse at 50% 16%, rgba(var(--theme-primary-rgb), 0.36), transparent 42%), radial-gradient(ellipse at 50% 78%, rgba(var(--theme-primary-rgb), 0.28), transparent 48%)",
        }}
      />

      <div
        className="dawgs-signal-sweep absolute left-[-12%] top-[16%] h-32 w-[140%] rotate-[-9deg] blur-xl mix-blend-screen"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(var(--theme-primary-rgb), 0.72), rgba(255,255,255,0.16), transparent)",
        }}
      />
      <div
        className="dawgs-signal-sweep absolute left-[-18%] top-[58%] h-24 w-[150%] rotate-[7deg] blur-xl mix-blend-screen [animation-delay:1.6s]"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(var(--theme-primary-rgb), 0.52), rgba(255,255,255,0.12), transparent)",
        }}
      />

      <div
        className="dawgs-lightning absolute left-[-20%] top-[22%] h-[3px] w-[150%] rotate-[-10deg] blur-[2px]"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--theme-primary-light), transparent)",
          filter: "drop-shadow(0 0 20px var(--theme-primary))",
        }}
      />
      <div
        className="dawgs-lightning absolute left-[-25%] top-[63%] h-[2px] w-[150%] rotate-[8deg] opacity-70 blur-[2px] [animation-delay:1.1s]"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--theme-primary), transparent)",
          filter: "drop-shadow(0 0 16px var(--theme-primary))",
        }}
      />

      <div className="scanlines absolute inset-0 opacity-25" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.38),transparent_18%,transparent_82%,rgba(0,0,0,0.42))]" />
    </div>
  );
}
