import { peso } from "@/lib/hunch/engine/results/pick-winner"
import { CONFIDENCE } from "@/lib/hunch/engine/results/constants"
import { normalizeCode } from "@/lib/hunch/engine/results/match-rows"
import type { Confidence, GridRow, ResultsReport, TestRun, Verdict, VerdictMetric } from "@/lib/hunch/types"

export { peso }

export type MetricWords = {
  title: string
  noun: string
  plural: string
  better: string
  bar: string
  lower: boolean
}

function nounFor(resultType?: string | null) {
  const t = resultType ?? ""
  if (/messag/i.test(t)) return ["message", "messages"]
  if (/link click/i.test(t)) return ["link click", "link clicks"]
  if (/landing page/i.test(t)) return ["page view", "page views"]
  if (/purchase/i.test(t)) return ["purchase", "purchases"]
  if (/lead/i.test(t)) return ["lead", "leads"]
  return ["result", "results"]
}

export function metricWords(metric: VerdictMetric, resultType?: string | null): MetricWords {
  if (metric === "ctr")
    return {
      title: "Click rate",
      noun: "click",
      plural: "clicks",
      better: "Higher is better",
      bar: "A longer bar means more of the people who saw it clicked.",
      lower: false,
    }
  const [noun, plural] = metric === "cost_per_link_click" ? ["link click", "link clicks"] : nounFor(resultType)
  return {
    title: `Cost per ${noun}`,
    noun,
    plural,
    better: "Lower is better",
    bar: `A shorter bar means a cheaper ${noun}.`,
    lower: true,
  }
}

export function formatValue(metric: VerdictMetric, value: number | null) {
  if (value == null) return "No data"
  return metric === "ctr" ? `${(value * 100).toFixed(1)}%` : peso(value)
}

// Exact value for tooltips only.
export function exactValue(metric: VerdictMetric, value: number | null) {
  if (value == null) return "No data"
  return metric === "ctr" ? `${(value * 100).toFixed(2)}%` : `₱${value.toFixed(2)}`
}

export const CONFIDENCE_WORD: Record<Confidence, string> = { high: "High", medium: "Medium", low: "Low" }
export const CONFIDENCE_LEVELS = ["Low", "Medium", "High"]
export const CONFIDENCE_INDEX: Record<Confidence, number> = { low: 0, medium: 1, high: 2 }

// Lead of the winner over the runner-up, as a whole percent.
export function leadPercent(v: Verdict) {
  const w = v.ranking.find((r) => r.code === v.winnerCode)?.value ?? null
  const ru = v.ranking.find((r) => r.code === v.runnerUpCode)?.value ?? null
  if (w == null || ru == null) return null
  const hi = Math.max(Math.abs(w), Math.abs(ru))
  return hi > 0 ? Math.round((Math.abs(w - ru) / hi) * 100) : 0
}

export function winnerVolume(report: ResultsReport) {
  const m = report.metrics.find((x) => x.code === report.verdict.winnerCode)
  if (!m) return 0
  return report.verdict.metric === "cost_per_result" ? (m.results ?? 0) : (m.linkClicks ?? 0)
}

// Why the confidence is what it is, in plain words with the real numbers.
export function confidenceWhy(report: ResultsReport, words: MetricWords) {
  const v = report.verdict
  const pct = leadPercent(v)
  const vol = winnerVolume(report)
  const unit = v.metric === "cost_per_result" ? words.plural : "link clicks"
  const need = (lvl: "high" | "medium") => (v.metric === "cost_per_result" ? CONFIDENCE[lvl].results : CONFIDENCE[lvl].linkClicks)
  const fact =
    pct == null || !v.runnerUpCode
      ? `Only ${v.winnerCode} had numbers to compare.`
      : `${v.winnerCode} was ${pct}% ${words.lower ? "cheaper than" : "ahead of"} ${v.runnerUpCode}, with ${vol.toLocaleString("en-PH")} ${unit}.`
  const rule =
    v.confidence === "high"
      ? `High needs a lead of ${CONFIDENCE.high.margin * 100}% or more and at least ${need("high")} ${unit}.`
      : v.confidence === "medium"
        ? `High needs a ${CONFIDENCE.high.margin * 100}% lead and ${need("high")} ${unit}. Medium needs ${CONFIDENCE.medium.margin * 100}% and ${need("medium")}.`
        : `Medium needs a lead of ${CONFIDENCE.medium.margin * 100}% or more and at least ${need("medium")} ${unit}.`
  return { fact, rule }
}

export function isSampleFile(f?: { name: string } | null) {
  return !!f && /^sample data/i.test(f.name)
}

export function audienceName(run: TestRun, code: string) {
  return run.versions.find((v) => normalizeCode(v.code) === normalizeCode(code))?.audienceName ?? code
}

export function rowReady(r: GridRow) {
  return r.spend != null && (r.results != null || r.linkClicks != null)
}

// "100", "3,762", "12.5"; blank for missing.
export function cellText(n: number | null) {
  if (n == null) return ""
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 })
}

// Accepts "₱1,200", "1200", "12.5". Returns undefined when it is not a number.
export function parseCell(raw: string): number | null | undefined {
  const s = raw.replace(/₱|php|,|\s/gi, "")
  if (!s) return null
  if (!/^\d*\.?\d+$/.test(s) && !/^\d+\.$/.test(s)) return undefined
  const n = Number(s)
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

export function plural(n: number, one: string, many: string) {
  return `${n.toLocaleString("en-PH")} ${n === 1 ? one : many}`
}
