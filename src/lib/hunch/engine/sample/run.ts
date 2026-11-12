import type { ProductInput, TestRun } from "../../types";
import { makeSwapper } from "./personalize";
import { sampleSetFor } from "./sets";

// A sample seller's saved run (Kaye's matcha when the product mentions matcha, else Elle's candles),
// with only the product name and price swapped when the seller typed their own. Client-safe.
export function sampleRunFor(input: Partial<Pick<ProductInput, "name" | "price" | "description">> = {}): TestRun {
  const set = sampleSetFor(input);
  const swap = makeSwapper({ name: input.name || set.name, price: input.price }, set);
  const run = swap.apply(set.run());
  const product = {
    ...run.product,
    name: swap.swapped.includes("name") ? input.name!.trim() : run.product.name,
    price: swap.swapped.includes("price") ? input.price!.trim() : run.product.price,
  };
  return {
    ...run,
    product,
    id: swap.swapped.length ? `${run.id}_${swap.swapped.join("_")}` : run.id,
    createdAt: new Date().toISOString(),
    sample: { of: set.name, swapped: swap.swapped },
    notes: swap.note ? [swap.note] : [],
  };
}
