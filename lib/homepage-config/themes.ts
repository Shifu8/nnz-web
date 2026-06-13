export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  bgFrom: string;
  bgTo: string;
  glowRgba: string;
  glowIntense: string;
  borderRgba: string;
  btnFrom: string;
  btnTo: string;
  btnShadow: string;
  textAccent: string;
  badgeBg: string;
  cardBorder: string;
  cardShadow: string;
  hoverGlow: string;
  tagBg: string;
}

export interface ThemePreset {
  id: string;
  label: string;
  colors: ThemeColors;
}

export const THEMES: ThemePreset[] = [
  {
    id: "pink",
    label: "Pink DAWGS",
    colors: {
      primary: "#ff0066",
      primaryLight: "#ff3399",
      primaryDark: "#cc0052",
      bgFrom: "#ff0066",
      bgTo: "#cc0052",
      glowRgba: "rgba(255,0,102,0.5)",
      glowIntense: "rgba(255,0,102,0.8)",
      borderRgba: "rgba(255,0,102,0.3)",
      btnFrom: "#db2777",
      btnTo: "#e11d48",
      btnShadow: "rgba(236,72,153,0.4)",
      textAccent: "#fdf2f8",
      badgeBg: "#dc2626",
      cardBorder: "rgba(255,0,102,0.16)",
      cardShadow: "rgba(255,0,102,0.12)",
      hoverGlow: "rgba(236,72,153,0.4)",
      tagBg: "rgba(255,0,24,0.15)",
    },
  },
  {
    id: "red",
    label: "Red Fury",
    colors: {
      primary: "#dc2626",
      primaryLight: "#ef4444",
      primaryDark: "#b91c1c",
      bgFrom: "#dc2626",
      bgTo: "#991b1b",
      glowRgba: "rgba(220,38,38,0.5)",
      glowIntense: "rgba(220,38,38,0.8)",
      borderRgba: "rgba(220,38,38,0.3)",
      btnFrom: "#dc2626",
      btnTo: "#b91c1c",
      btnShadow: "rgba(220,38,38,0.4)",
      textAccent: "#fef2f2",
      badgeBg: "#dc2626",
      cardBorder: "rgba(220,38,38,0.16)",
      cardShadow: "rgba(220,38,38,0.12)",
      hoverGlow: "rgba(220,38,38,0.4)",
      tagBg: "rgba(220,38,38,0.15)",
    },
  },
  {
    id: "blue",
    label: "Blue Wave",
    colors: {
      primary: "#2563eb",
      primaryLight: "#3b82f6",
      primaryDark: "#1d4ed8",
      bgFrom: "#2563eb",
      bgTo: "#1e3a8a",
      glowRgba: "rgba(37,99,235,0.5)",
      glowIntense: "rgba(37,99,235,0.8)",
      borderRgba: "rgba(37,99,235,0.3)",
      btnFrom: "#2563eb",
      btnTo: "#1d4ed8",
      btnShadow: "rgba(59,130,246,0.4)",
      textAccent: "#eff6ff",
      badgeBg: "#2563eb",
      cardBorder: "rgba(37,99,235,0.16)",
      cardShadow: "rgba(37,99,235,0.12)",
      hoverGlow: "rgba(59,130,246,0.4)",
      tagBg: "rgba(37,99,235,0.15)",
    },
  },
  {
    id: "purple",
    label: "Purple Night",
    colors: {
      primary: "#9333ea",
      primaryLight: "#a855f7",
      primaryDark: "#7e22ce",
      bgFrom: "#9333ea",
      bgTo: "#581c87",
      glowRgba: "rgba(147,51,234,0.5)",
      glowIntense: "rgba(147,51,234,0.8)",
      borderRgba: "rgba(147,51,234,0.3)",
      btnFrom: "#9333ea",
      btnTo: "#7e22ce",
      btnShadow: "rgba(168,85,247,0.4)",
      textAccent: "#faf5ff",
      badgeBg: "#9333ea",
      cardBorder: "rgba(147,51,234,0.16)",
      cardShadow: "rgba(147,51,234,0.12)",
      hoverGlow: "rgba(168,85,247,0.4)",
      tagBg: "rgba(147,51,234,0.15)",
    },
  },
  {
    id: "green",
    label: "Neon Green",
    colors: {
      primary: "#16a34a",
      primaryLight: "#22c55e",
      primaryDark: "#15803d",
      bgFrom: "#16a34a",
      bgTo: "#14532d",
      glowRgba: "rgba(22,163,74,0.5)",
      glowIntense: "rgba(22,163,74,0.8)",
      borderRgba: "rgba(22,163,74,0.3)",
      btnFrom: "#16a34a",
      btnTo: "#15803d",
      btnShadow: "rgba(34,197,94,0.4)",
      textAccent: "#f0fdf4",
      badgeBg: "#16a34a",
      cardBorder: "rgba(22,163,74,0.16)",
      cardShadow: "rgba(22,163,74,0.12)",
      hoverGlow: "rgba(34,197,94,0.4)",
      tagBg: "rgba(22,163,74,0.15)",
    },
  },
  {
    id: "orange",
    label: "Fire Orange",
    colors: {
      primary: "#ea580c",
      primaryLight: "#f97316",
      primaryDark: "#c2410c",
      bgFrom: "#ea580c",
      bgTo: "#9a3412",
      glowRgba: "rgba(234,88,12,0.5)",
      glowIntense: "rgba(234,88,12,0.8)",
      borderRgba: "rgba(234,88,12,0.3)",
      btnFrom: "#ea580c",
      btnTo: "#c2410c",
      btnShadow: "rgba(249,115,22,0.4)",
      textAccent: "#fff7ed",
      badgeBg: "#ea580c",
      cardBorder: "rgba(234,88,12,0.16)",
      cardShadow: "rgba(234,88,12,0.12)",
      hoverGlow: "rgba(249,115,22,0.4)",
      tagBg: "rgba(234,88,12,0.15)",
    },
  },
];

export function getTheme(id: string): ThemeColors {
  return THEMES.find((t) => t.id === id)?.colors ?? THEMES[0].colors;
}

export function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "255,255,255";
  return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`;
}
