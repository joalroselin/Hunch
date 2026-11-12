import type { CaveatCheck, Confidence, Verdict, VerdictMetric } from "../../types";
import { CAVEAT, CONFIDENCE } from "./constants";

// Pesos for UI text: no decimals.
export function peso(n: number) {
  return `₱${Math.round(n).toLocaleString("en-PH")}`;
}

export interface WinnerInput {
  code: string;
  spend: number | null;
  results: number | null;
  linkClicks: number | null;
  impressions: number | null;
  resultType?: string | null;
}

export interface Scored {
  code: string;
  value: number | null; // raw value on the metric
  volume: number; // results on cost_per_result, link clicks otherwise
}

export type ComputedVerdict = Omit<Verdict, "explanation"> & { scored: Scored[]; totalSpend: number };

const r2 = (n: number) => Math.round(n * 100) / 100;
const r4 = (n: number) => Math.round(n * 10000) / 10000;

export function chooseMetric(rows: WinnerInput[]): VerdictMetric {
  const types = new Set(rows.map((r) => r.resultType ?? ""));
  if (rows.length && rows.every((r) => r.results != null && r.results >= 1) && types.size <= 1) return "cost_per_result";
  if (rows.length && rows.every((r) => r.linkClicks != null)) return "cost_per_link_click";
  return "ctr";
}

export const lowerIsBetter = (m: VerdictMetric) => m !== "ctr";

function valueOf(r: WinnerInput, metric: VerdictMetric): number | null {
  const spend = r.spend ?? 0;
  if (metric === "cost_per_result") return r.results && r.results > 0 ? spend / r.results : null;
  if (metric === "cost_per_link_click") return r.linkClicks && r.linkClicks > 0 ? spend / r.linkClicks : null;
  return r.impressions && r.impressions > 0 && r.linkClicks != null ? r.linkClicks / r.impressions : null;
}

// DECISION: margin = |winner - runner-up| / the larger of the two, so "beats by 25%" reads the same way for costs and for CTR.
export function marginOf(w: number | null, ru: number | null) {
  if (w == null || ru == null) return w != null ? 1 : 0;
  const hi = Math.max(Math.abs(w), Math.abs(ru));
  return hi > 0 ? Math.abs(w - ru) / hi : 0;
}

const codeNum = (c: string) => Number(c.replace(/\D/g, "")) || 0;

// Ranks audiences that have spend and picks the winner, runner-up, confidence and automatic caveats.
export function pickWinner(input: WinnerInput[]): ComputedVerdict {
  const rows = input.filter((r) => r.spend != null);
  const metric = chooseMetric(rows);
  const low = lowerIsBetter(metric);
  const scored: Scored[] = rows.map((r) => ({
    code: r.code,
    value: valueOf(r, metric),
    volume: metric === "cost_per_result" ? (r.results ?? 0) : (r.linkClicks ?? 0),
  }));
  scored.sort((a, b) => {
    if (a.value == null || b.value == null) return a.value == null && b.value == null ? codeNum(a.code) - codeNum(b.code) : a.value == null ? 1 : -1;
    if (a.value !== b.value) return low ? a.value - b.value : b.value - a.value;
    return b.volume - a.volume || codeNum(a.code) - codeNum(b.code);
  });

  const w = scored[0];
  const ru = scored[1];
  const margin = w && ru ? marginOf(w.value, ru.value) : 0;
  const unit: "results" | "link clicks" = metric === "cost_per_result" ? "results" : "link clicks";
  const need = (lvl: "high" | "medium") => (unit === "results" ? CONFIDENCE[lvl].results : CONFIDENCE[lvl].linkClicks);
  let confidence: Confidence = "low";
  if (w && ru && w.value != null) {
    if (margin >= CONFIDENCE.high.margin && w.volume >= need("high")) confidence = "high";
    else if (margin >= CONFIDENCE.medium.margin && w.volume >= need("medium")) confidence = "medium";
  }

  const spends = rows.map((r) => r.spend ?? 0);
  const totalSpend = r2(spends.reduce((a, b) => a + b, 0));
  const minSpend = spends.length ? Math.min(...spends) : 0;
  const maxSpend = spends.length ? Math.max(...spends) : 0;
  const uneven = spends.length > 1 && maxSpend > minSpend * (1 + CAVEAT.spendSpread);
  const close = !!ru && margin < CAVEAT.closeRunnerUp;
  const lowSpend = totalSpend < CAVEAT.minTotalSpend;

  const caveatChecks: CaveatCheck[] = [
    { rule: `Total spend under ${peso(CAVEAT.minTotalSpend)}`, fired: lowSpend, value: `${peso(totalSpend)} total` },
    { rule: "Runner-up within 10%", fired: close, value: ru ? `${(margin * 100).toFixed(1)}% behind` : "No runner-up" },
    {
      rule: "Spend differs by more than 20% between audiences",
      fired: uneven,
      value: minSpend === maxSpend ? `${peso(minSpend)} each` : `${peso(minSpend)} to ${peso(maxSpend)}`,
    },
  ];
  const caveats: string[] = [];
  if (lowSpend) caveats.push(`You spent ${peso(totalSpend)} in total. Under ${peso(CAVEAT.minTotalSpend)} the numbers are small, so treat this as an early signal.`);
  if (close && w && ru) caveats.push(`${ru.code} was within 10% of ${w.code}, so the order could change with more spend.`);
  if (uneven) caveats.push(`Spend was not even, from ${peso(minSpend)} to ${peso(maxSpend)} per post, so posts with more spend had more chances.`);

  const round = (v: number | null) => (v == null ? null : metric === "ctr" ? r4(v) : r2(v));
  return {
    metric,
    ranking: scored.map((s) => ({ code: s.code, value: round(s.value) })),
    winnerCode: w?.code ?? "",
    runnerUpCode: ru?.code ?? "",
    confidence,
    caveats: caveats.slice(0, CAVEAT.max),
    caveatChecks,
    margin: {
      percent: Math.round(margin * 1000) / 10,
      winnerValue: round(w?.value ?? null),
      runnerUpValue: round(ru?.value ?? null),
      winnerVolume: w?.volume ?? 0,
      volumeUnit: unit,
    },
    scored,
    totalSpend,
  };
}

export const METRIC_LABEL: Record<VerdictMetric, string> = {
  cost_per_result: "Cost per result",
  cost_per_link_click: "Cost per link click",
  ctr: "Click rate",
};

// "₱7" for costs, "1.2%" for CTR. Exact values belong in tooltips only.
export function formatMetric(metric: VerdictMetric, value: number | null) {
  if (value == null) return "No data";
  return metric === "ctr" ? `${(value * 100).toFixed(1)}%` : peso(value);
}
