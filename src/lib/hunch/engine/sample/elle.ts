import type { FocusPlan, ProductInput, ResultsReport, TestRun } from "../../types";
import { SAMPLES, sampleKeyOf } from "./catalog";
import { sampleSet } from "./sets";

export { ELLE_BREAKDOWN_CSV, ELLE_BREAKDOWN_FILE, ELLE_RESULTS_CSV, ELLE_RESULTS_FILE } from "./elle-csv";

// Elle is a persona made for the demo. Her candle run, report and plan are sample data.
export const ELLE_NAME = SAMPLES.candles.name;
export const ELLE_RUN_ID = SAMPLES.candles.runId;

const elle = sampleSet("candles");

export const ELLE_PRODUCT: Omit<ProductInput, "photo"> = elle.product;

// Fresh, normalized copies so callers can change them.
export const elleRun = (): TestRun => elle.run();
export const elleFocus = (): FocusPlan => elle.focus();
export const elleSavedReport = (): ResultsReport => elle.savedReport();

// Any sample seller's run (Elle's candles or Kaye's matcha).
export function isSampleRun(run: Pick<TestRun, "id" | "sample">) {
  return !!sampleKeyOf(run);
}
