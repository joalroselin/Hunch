import type { ProductInput } from "../../types";
import { SAMPLES, type SampleInfo } from "./catalog";

function priceOf(price?: string) {
  const m = price?.replace(/,/g, "").match(/\d+(?:\.\d+)?/);
  return m ? `₱${Math.round(Number(m[0])).toLocaleString("en-PH")}` : undefined;
}

export interface Swap {
  swapped: ("name" | "price")[];
  note?: string; // shown on screen when anything was swapped
  apply: <T>(x: T) => T;
}

// Sample mode only: swaps the sample seller's product name and price for the seller's. Nothing else changes,
// so the posts still describe the sample product; the note says so.
export function makeSwapper(product: Pick<ProductInput, "name" | "price">, info: SampleInfo = SAMPLES.candles): Swap {
  const name = product.name?.trim();
  const swapName = !!name && name.toLowerCase() !== info.name.toLowerCase();
  const price = priceOf(product.price);
  const swapPrice = !!price && price !== info.price;
  const swapped: Swap["swapped"] = [...(swapName ? (["name"] as const) : []), ...(swapPrice ? (["price"] as const) : [])];
  if (!swapped.length) return { swapped, apply: (x) => x };

  const pricePattern = new RegExp(`${info.price.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g");
  const swapString = (s: string) => {
    let out = s;
    if (swapName) out = out.split(info.name).join(name!);
    if (swapPrice) out = out.replace(pricePattern, price!);
    return out;
  };
  const walk = <T,>(x: T): T => {
    if (typeof x === "string") return swapString(x) as T;
    if (Array.isArray(x)) return x.map(walk) as T;
    if (x && typeof x === "object") {
      const o: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(x)) o[k] = k === "id" || k === "audienceId" || k === "code" || k === "refId" || k === "of" ? v : walk(v);
      return o as T;
    }
    return x;
  };
  const what = swapped.length === 2 ? "name and price" : swapped[0];
  return {
    swapped,
    note: `Sample run for ${info.name}, with your product ${what} swapped in. Only the ${what} changed, so the posts still describe ${info.describes}.`,
    apply: walk,
  };
}
