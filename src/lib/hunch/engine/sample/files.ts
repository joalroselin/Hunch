import type { TestRun } from "../../types";
import { sampleKeyOf, type SampleKey } from "./catalog";
import { ELLE_BREAKDOWN_CSV, ELLE_BREAKDOWN_FILE, ELLE_RESULTS_CSV, ELLE_RESULTS_FILE } from "./elle-csv";
import { MATCHA_BREAKDOWN_CSV, MATCHA_BREAKDOWN_FILE, MATCHA_RESULTS_CSV, MATCHA_RESULTS_FILE } from "./matcha-csv";

// Each sample seller's Meta export, plain and by age and gender. Client-safe.
export interface SampleFiles {
  resultsName: string;
  results: string;
  breakdownName: string;
  breakdown: string;
}

const FILES: Record<SampleKey, SampleFiles> = {
  candles: { resultsName: ELLE_RESULTS_FILE, results: ELLE_RESULTS_CSV, breakdownName: ELLE_BREAKDOWN_FILE, breakdown: ELLE_BREAKDOWN_CSV },
  matcha: { resultsName: MATCHA_RESULTS_FILE, results: MATCHA_RESULTS_CSV, breakdownName: MATCHA_BREAKDOWN_FILE, breakdown: MATCHA_BREAKDOWN_CSV },
};

export const sampleFiles = (key: SampleKey) => FILES[key];
export const sampleFilesOf = (run: Pick<TestRun, "id" | "sample"> | null | undefined) => FILES[sampleKeyOf(run) ?? "candles"];

const flat = (t: string) => t.replace(/^﻿/, "").replace(/\r\n?/g, "\n").trim();
const ALL = Object.values(FILES).flatMap((f) => [flat(f.results), flat(f.breakdown)]);

// True when the text is one of the sample exports, as downloaded.
export const isSampleText = (text: string) => ALL.includes(flat(text));
