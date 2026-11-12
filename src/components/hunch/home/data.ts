import snapshot from "@/components/hunch/screens/demo-snapshot.json"
import { photoIfLoaded } from "@/components/hunch/post/sample-photos"
import { samplePhotoFor } from "@/lib/hunch/engine/sample/catalog"
import type { Audience, Confidence, FocusPlan, ResultsReport, TestRun, Version, VersionMetrics } from "@/lib/hunch/types"

// Elle's sample candle run for the home page. Read only, never written to the store.
export const run = snapshot.run as unknown as TestRun
export const report = snapshot.report as unknown as ResultsReport
export const focus = snapshot.focus as unknown as FocusPlan

// Each post's own photo once it has loaded (HomeScreen checks them); the color block until then.
export const photoUrls = run.versions.map((v) => samplePhotoFor(run, v))
// The photo URL without waiting for it to load; post frames fade it in themselves.
export const photoUrlOf = (v: Pick<Version, "code" | "audienceId">) => samplePhotoFor(run, v)
export const photoOf = (v: Pick<Version, "code" | "audienceId">) => photoIfLoaded(samplePhotoFor(run, v))

export const chosenIds = new Set(run.chosen.map((a) => a.id))
export const audienceById = new Map<string, Audience>(run.candidates.map((a) => [a.id, a]))
export const versionById = new Map<string, Version>(run.versions.map((v) => [v.id, v]))
export const versionByCode = new Map<string, Version>(run.versions.map((v) => [v.code, v]))
export const versionByAudience = new Map<string, Version>(run.versions.map((v) => [v.audienceId, v]))
export const metricsByVersion = new Map<string, VersionMetrics>(report.metrics.map((m) => [m.versionId, m]))
export const metricsByCode = new Map<string, VersionMetrics>(report.metrics.map((m) => [m.code, m]))

// Pesos in the UI: no decimals.
export const peso = (n: number) => `₱${Math.round(n).toLocaleString("en-PH")}`
export const dayWord = (n: number) => `${n} ${n === 1 ? "day" : "days"}`

// The verdict is computed in code; the home page only reads it.
export const verdict = report.verdict
export const winnerCode = verdict.winnerCode
export const runnerUpCode = verdict.runnerUpCode
export const confidence: Confidence = verdict.confidence

// "Messaging conversations started" reads as messages.
const messages = /messag/i.test(report.resultType ?? "")
export const unit = verdict.metric === "cost_per_link_click" ? "link click" : messages ? "message" : "result"
export const units = `${unit}s`
export const resultsOf = (m: VersionMetrics) => (verdict.metric === "cost_per_link_click" ? (m.linkClicks ?? 0) : (m.results ?? 0))

// Cost per message from the verdict ranking, else spend over results.
const rankValue = new Map(verdict.ranking.map((r) => [r.code, r.value]))
export function costOf(m: VersionMetrics): number | null {
  const v = rankValue.get(m.code) ?? m.costPerResult
  if (v != null) return v
  const n = resultsOf(m)
  return n > 0 ? m.spend / n : null
}
export const costText = (m: VersionMetrics) => {
  const c = costOf(m)
  return c == null ? "No messages" : peso(c)
}

// Day labels for the 7 posts, starting tomorrow in Manila time.
export function nextSevenDays(from = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", weekday: "short", month: "short", day: "numeric" })
  return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(from.getTime() + (i + 1) * 86400000)))
}
