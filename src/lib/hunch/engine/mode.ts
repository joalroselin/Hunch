import type { Mode } from "../types";

// Live with an Anthropic or a Google AI Studio key. HUNCH_MODE=sample forces the sample replay (Elle's candles, or Kaye's matcha);
// HUNCH_MODE=mock runs the live pipeline on the mocked model (no API key needed).
export function getMode(): Mode {
  if (process.env.HUNCH_MODE === "mock") return "live";
  const key = process.env.ANTHROPIC_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim();
  return key && process.env.HUNCH_MODE !== "sample" ? "live" : "sample";
}

export function isMockModel() {
  return process.env.HUNCH_MODE === "mock";
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function jitter(min = 300, max = 800) {
  return sleep(min + Math.floor(Math.random() * (max - min)));
}

export function newId(prefix = "") {
  const raw = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
  return prefix ? `${prefix}_${raw}` : raw;
}

export function lowerFirst(s: string) {
  if (s.length > 1 && s[1] === s[1].toUpperCase() && /[A-Z]/.test(s[1])) return s;
  // Names like "Noche Buena hosts", "Cubao Expo art kids" or "TikTok" keep their capital.
  if (/^\S+\s+[A-Z]/.test(s) || /^[A-Z][a-z]+[A-Z]/.test(s)) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}

// Pesos for UI text: no decimals.
export function peso(n: number) {
  return `₱${Math.round(n).toLocaleString("en-PH")}`;
}
