"use client";

import { createContext, useContext, useRef, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import styles from "./FourgoPageTransition.module.css";

gsap.registerPlugin(useGSAP);
const NavigationContext = createContext<(href: string) => void>(() => {});

export function useFourgoNavigation() { return useContext(NavigationContext); }

export default function FourgoPageTransition({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const destination = useRef<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { contextSafe } = useGSAP(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, { scope: rootRef });

  const navigate = contextSafe((href: string) => {
    if (destination.current) return;
    const targetPath = href.split(/[?#]/)[0];
    if (targetPath === pathname || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      router.push(href);
      return;
    }
    const overlay = overlayRef.current;
    if (!overlay) { router.push(href); return; }
    destination.current = targetPath;
    const panels = overlay.querySelectorAll("[data-transition-panel]");
    gsap.set(overlay, { autoAlpha: 1, pointerEvents: "auto" });
    gsap.set(panels, { yPercent: 100, y: 0 });
    gsap.timeline({ defaults: { ease: "power4.inOut" } })
      .to(panels, { yPercent: 0, duration: .52, stagger: .065 })
      .call(() => router.push(href, { scroll: true }));
    // Restore interaction if a network failure interrupts navigation.
    timeoutRef.current = setTimeout(() => {
      overlay.style.visibility = "hidden";
      overlay.style.opacity = "0";
      overlay.style.pointerEvents = "none";
      destination.current = null;
    }, 10000);
  });

  useGSAP(() => {
    if (!destination.current || destination.current !== pathname) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const overlay = overlayRef.current;
    if (!overlay) return;
    gsap.timeline({ defaults: { ease: "power4.inOut" }, onComplete: () => { destination.current = null; } })
      .to(overlay.querySelectorAll("[data-transition-panel]"), { yPercent: -100, duration: .52, stagger: .06 })
      .set(overlay, { autoAlpha: 0, pointerEvents: "none" });
  }, { scope: rootRef, dependencies: [pathname] });

  return (
    <NavigationContext.Provider value={navigate}>
      <div ref={rootRef} className={styles.root}>
        {children}
        <div ref={overlayRef} className={styles.overlay} aria-hidden="true" data-fourgo-transition>
          <div className={styles.panels}>
            {["#f8cf4b", "#f397b7", "#a889cd", "#fff5e2"].map((color) => <div key={color} data-transition-panel style={{ backgroundColor: color }} />)}
          </div>
        </div>
      </div>
    </NavigationContext.Provider>
  );
}
