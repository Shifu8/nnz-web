"use client";

import { useEffect, useRef } from "react";
import { gsap, useGSAP } from "@/frontend/animations/gsapSetup";

interface PurchaseFarewellProps {
  name?: string;
  onComplete: () => void;
}

const COLORS = ["var(--theme-primary-light)", "#FFD700", "#FF6B6B", "#00E5FF", "#FF4081", "#FFFFFF", "#FFA500", "#C8FF00"];
const SIZES = [1.5, 2, 2.5, 3, 3.5];

const PARTICLES = Array.from({ length: 24 }, (_, i) => {
  const angle = (Math.PI * 2 * i) / 24 + (Math.random() - 0.5) * 0.3;
  const distance = 50 + Math.random() * 70;
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
    rotation: Math.random() * 360,
    scale: 0.6 + Math.random() * 0.8,
    color: COLORS[i % COLORS.length],
    size: SIZES[i % SIZES.length],
    shape: i % 4,
  };
});

export default function PurchaseFarewell({ name, onComplete }: PurchaseFarewellProps) {
  const scope = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          desktop: "(min-width: 640px)",
          reduceMotion: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          const { desktop, reduceMotion } = context.conditions as {
            desktop: boolean;
            reduceMotion: boolean;
          };
          const root = scope.current;
          if (!root) return;

          if (reduceMotion) {
            gsap.set(root, { autoAlpha: 1 });
            gsap.to(root, {
              autoAlpha: 0,
              delay: 2.4,
              duration: 0.2,
              onComplete: () => onCompleteRef.current(),
            });
            return;
          }

          const particles = gsap.utils.toArray<HTMLElement>(".farewell-particle");
          const timeline = gsap.timeline({
            defaults: { ease: "power3.out" },
            onComplete: () => onCompleteRef.current(),
          });

          timeline
            .set(root, { autoAlpha: 1 })
            .set(particles, { autoAlpha: 0, x: 0, y: 0, scale: 0 })
            .from(".farewell-card", {
              autoAlpha: 0,
              x: desktop ? 34 : 0,
              y: desktop ? 0 : -18,
              scale: 0.88,
              duration: 0.46,
              ease: "back.out(1.8)",
            })
            .from(
              ".farewell-accent",
              { scaleY: 0, transformOrigin: "50% 100%", duration: 0.32 },
              "-=0.28",
            )
            .from(".farewell-copy", { autoAlpha: 0, x: 10, duration: 0.25 }, "-=0.2")
            .fromTo(".farewell-glow-ring", { scale: 0.5, opacity: 0.6 }, { scale: 2, opacity: 0, duration: 0.6, ease: "power2.out" }, "-=0.15")
            .to(
              ".farewell-wink-eye",
              {
                scaleY: 0.08,
                rotation: -8,
                transformOrigin: "50% 55%",
                duration: 0.11,
                repeat: 1,
                yoyo: true,
                ease: "power2.inOut",
              },
              "+=0.5",
            )
            .to(
              ".farewell-smile",
              {
                y: -3,
                rotation: 10,
                duration: 0.16,
                repeat: 1,
                yoyo: true,
                ease: "power2.inOut",
              },
              "-=0.08",
            )
            .to(".farewell-card", { scale: 1.025, duration: 0.12 }, "+=0.4")
            .to(".farewell-card", {
              autoAlpha: 0,
              scale: 0.84,
              x: desktop ? 18 : 0,
              y: desktop ? 0 : -10,
              duration: 0.24,
              ease: "power2.in",
            })
            .fromTo(
              particles,
              { autoAlpha: 1, x: 0, y: 0, scale: 0.3, rotation: 0 },
              {
                autoAlpha: 0.7,
                x: (index) => PARTICLES[index].x,
                y: (index) => PARTICLES[index].y,
                rotation: (index) => PARTICLES[index].rotation,
                scale: (index) => PARTICLES[index].scale,
                duration: 0.5,
                stagger: 0.015,
                ease: "power2.out",
              },
              "-=0.16",
            )
            .to(particles, {
              autoAlpha: 0,
              duration: 0.3,
              stagger: 0.01,
              ease: "power2.in",
            });
        },
        scope.current ?? undefined,
      );

      return () => mm.revert();
    },
    { scope },
  );

  const displayName = name ? name.toUpperCase() : "";
  const message = displayName ? `GRACIAS ${displayName} POR TU COMPRA` : "GRACIAS POR TU COMPRA";

  return (
    <div
      ref={scope}
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 top-24 z-[220] flex justify-center opacity-0 sm:inset-x-auto sm:right-7 sm:top-24 sm:justify-end lg:right-12"
    >
      <div className="relative">
        <div
          className="farewell-card relative flex min-h-16 max-w-[380px] transform-gpu items-center overflow-hidden rounded-[22px] pr-5 shadow-2xl will-change-transform"
          style={{
            border: "1px solid rgba(var(--theme-primary-rgb), 0.35)",
            background:
              "linear-gradient(135deg, rgba(var(--theme-primary-rgb),0.18), rgba(6,6,10,0.96) 50%, rgba(var(--theme-primary-rgb),0.08))",
            boxShadow:
              "0 20px 50px rgba(0,0,0,0.7), 0 0 30px rgba(var(--theme-primary-rgb),0.18), inset 0 1px 0 rgba(255,255,255,0.06)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          <span
            className="farewell-accent self-stretch w-[3px] shrink-0"
            style={{
              background: `linear-gradient(180deg, var(--theme-primary-light), var(--theme-primary), var(--theme-primary-dark))`,
              boxShadow: "0 0 12px rgba(var(--theme-primary-rgb),0.5)",
            }}
          />
          <span
            aria-hidden
            className="mx-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
            style={{
              background: `radial-gradient(circle, rgba(var(--theme-primary-rgb),0.3), transparent)`,
            }}
          >
            <span className="farewell-glow-ring absolute h-7 w-7 rounded-full border border-[var(--theme-primary-light)] opacity-0" />
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{
                background: "var(--theme-primary-light)",
                boxShadow: "0 0 18px rgba(var(--theme-primary-rgb),0.8), 0 0 40px rgba(var(--theme-primary-rgb),0.3)",
              }}
            />
          </span>
          <p
            className="farewell-copy py-4 pr-1 text-sm font-black uppercase tracking-[0.06em] sm:text-[15px]"
            style={{
              background: `linear-gradient(90deg, var(--theme-primary-light), rgba(255,255,255,0.9))`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {message}{" "}
            <span className="ml-1 inline-flex items-center gap-px text-lg leading-none" style={{ WebkitTextFillColor: "var(--theme-primary-light)" }}>
              <span className="farewell-wink-eye inline-block">;</span>
              <span className="farewell-smile inline-block">)</span>
            </span>
          </p>
        </div>

        <div aria-hidden className="absolute right-[52px] top-1/2 -translate-y-1/2">
          {PARTICLES.map((particle, index) => (
            <span
              key={index}
              className={`farewell-particle absolute block will-change-transform`}
              style={{
                width: `${particle.size * 3}px`,
                height: `${particle.size * 3}px`,
                background: particle.color,
                boxShadow: `0 0 10px ${particle.color}`,
                left: "0",
                top: "0",
                borderRadius:
                  particle.shape === 0 ? "50%" : particle.shape === 1 ? "3px" : particle.shape === 2 ? "50% 0 50% 0" : "2px",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
