import candles from "@/components/hunch/screens/demo-snapshot.json";
import matcha from "@/components/hunch/screens/matcha-snapshot.json";

import { normalizeFocus, normalizeProduct, normalizeRun } from "../../normalize";
import type { FocusPlan, ProductInput, ResultsReport, TestRun } from "../../types";
import { SAMPLES, sampleKeyFor, sampleKeyOf, type SampleInfo, type SampleKey } from "./catalog";
import { sampleFiles, type SampleFiles } from "./files";

// Elle (candles) and Kaye (matcha) are personas made for the demo. Their runs, reports and plans are sample data.
type Snapshot = { run: TestRun; report: ResultsReport; focus: FocusPlan };

export interface SampleSet extends SampleInfo {
  product: Omit<ProductInput, "photo">;
  files: SampleFiles;
  run: () => TestRun;
  focus: () => FocusPlan;
  savedReport: () => ResultsReport; // as written by hand: explanation, card text, engagement fields
}

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

function makeSet(info: SampleInfo, raw: Snapshot, channels: ProductInput["channels"]): SampleSet {
  const product = normalizeProduct({ ...raw.run.product, channels });
  return {
    ...info,
    product,
    files: sampleFiles(info.key),
    run: () => ({ ...normalizeRun(clone(raw.run)), product: { ...product }, sample: { of: info.name, swapped: [] } }),
    focus: () => normalizeFocus(clone(raw.focus), product.language),
    savedReport: () => clone(raw.report),
  };
}

const SETS: Record<SampleKey, SampleSet> = {
  candles: makeSet(SAMPLES.candles, candles as unknown as Snapshot, ["shopee", "instagram", "facebook"]),
  matcha: makeSet(SAMPLES.matcha, matcha as unknown as Snapshot, ["shopee", "instagram"]),
};

export const sampleSet = (key: SampleKey) => SETS[key];
export const sampleSetFor = (p?: { name?: string | null; description?: string | null }) => SETS[sampleKeyFor(p)];
export function sampleSetOf(run: Pick<TestRun, "id" | "sample"> | null | undefined): SampleSet | null {
  const key = sampleKeyOf(run);
  return key ? SETS[key] : null;
}
