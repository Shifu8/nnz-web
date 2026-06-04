"use client";

import { useRef, useEffect, useState } from "react";

type Props = {
  text: string;
  as?: "h1" | "h2" | "h3" | "span";
  className?: string;
  staggerMs?: number;
  durationMs?: number;
};

export default function AnimatedHeading({ text, as: Tag = "h1", className, staggerMs = 35, durationMs = 400 }: Props) {
  const [played, setPlayed] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !played) {
          setPlayed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [played]);

  const chars = text.split("").map((c, i) => {
    const delay = i * staggerMs;
    return (
      <span key={i} className="inline-block overflow-hidden align-bottom leading-[0.9]" style={{ height: "1em" }}>
        <span
          className="inline-block"
          style={{
            animation: played ? `diceReveal ${durationMs}ms cubic-bezier(0.39, 0.575, 0.565, 1) ${delay}ms both` : undefined,
            transform: played ? undefined : "translateY(100%)",
          }}
        >
          {c === " " ? "\u00A0" : c}
        </span>
      </span>
    );
  });

  return (
    <Tag ref={ref as any} className={className} suppressHydrationWarning>
      {chars}
    </Tag>
  );
}
