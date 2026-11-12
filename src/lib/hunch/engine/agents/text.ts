// Strips em dashes from model text; the product never shows one.
export function noDashes<T>(x: T): T {
  return JSON.parse(JSON.stringify(x).replace(/\s*\u2014\s*/g, ", ")) as T;
}

export const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
