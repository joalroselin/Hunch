import { personaOf } from "@/lib/hunch/engine/sample/catalog"
import { CONFIDENCE } from "@/lib/hunch/engine/results/constants"
import type { Audience, FocusPlan, RejectedDraft, Version, VersionMetrics } from "@/lib/hunch/types"

import { audienceById, confidence, costOf, focus, metricsByCode, metricsByVersion, peso, report, resultsOf, run, runnerUpCode, unit, units, verdict, versionByCode, versionById } from "../data"

export type FocusPost = FocusPlan["posts"][number]
export type SheetKind = "version" | "focus" | "test"
// Kept for callers that still pass a tab; the sheet has no tabs now.
export type SheetTab = "made" | "caption" | "checks" | "draft" | "results"
export type SheetTarget = { kind: SheetKind; id: string }

const codeNum = (code: string) => Number(code.replace(/\D/g, "")) || 0

export const versions = [...run.versions].sort((a, b) => codeNum(a.code) - codeNum(b.code))
export const focusPosts = focus.posts
export const focusTests = focus.tests
export const persona = personaOf(run)
export const isRunnerUpDay = (v: Version) => (v as FocusPost).purpose === "runner_up_test"

// id: version id, A1..A8, focus post id or P1..P7, test id or T1..T2, rejected draft id, or a chosen audience id.
export function resolvePost(raw: string): SheetTarget | null {
  const id = raw.trim()
  const code = id.toUpperCase()
  const v = versionById.get(id) ?? versionByCode.get(code)
  if (v) return { kind: "version", id: v.id }
  const rejected = run.rejected.find((r) => r.id === id)
  if (rejected?.fixedVersionId && versionById.has(rejected.fixedVersionId)) return { kind: "version", id: rejected.fixedVersionId }
  const post = focus.posts.find((p) => p.id === id || p.code.toUpperCase() === code)
  if (post) return { kind: "focus", id: post.id }
  const test = focus.tests.find((t) => t.id === id || t.code.toUpperCase() === code)
  if (test) return { kind: "test", id: test.id }
  const forAudience = run.versions.find((x) => x.audienceId === id)
  if (forAudience) return { kind: "version", id: forAudience.id }
  return null
}

export function listFor(kind: SheetKind): Version[] {
  return kind === "focus" ? focusPosts : kind === "test" ? focusTests : versions
}

export type SheetItem = {
  kind: SheetKind
  version: Version
  audience: Audience
  index: number
  count: number
  rejected?: RejectedDraft
  metrics?: VersionMetrics
  day?: string
}

export function itemFor(target: SheetTarget, days?: string[]): SheetItem | null {
  const list = listFor(target.kind)
  const index = list.findIndex((v) => v.id === target.id)
  if (index < 0) return null
  const version = list[index]
  const audience = audienceById.get(version.audienceId) ?? focus.audience
  const item: SheetItem = { kind: target.kind, version, audience, index, count: list.length }
  if (target.kind === "version") {
    item.rejected = run.rejected.find((r) => r.fixedVersionId === version.id)
    const m = metricsByVersion.get(version.id)
    if (m && m.matchedBy !== "none") item.metrics = m
  }
  if (target.kind === "focus") item.day = days?.[index]
  return item
}

// "14 messages", "1 message", "No messages".
export function messagesText(n: number) {
  return n > 0 ? `${n} ${n === 1 ? unit : units}` : `No ${units}`
}
export const unitWord = (n: number) => (n === 1 ? unit : units)
export const costPeso = (m: VersionMetrics) => {
  const c = costOf(m)
  return c == null ? null : peso(c)
}

// The test, best first.
export const ranked = report.metrics
  .filter((m) => m.matchedBy !== "none")
  .sort((a, b) => a.rank - b.rank)
  .map((m) => ({ m, v: versionById.get(m.versionId), n: resultsOf(m) }))
  .filter((r): r is { m: VersionMetrics; v: Version; n: number } => !!r.v)
export const winner = ranked[0]
export const runnerUp = ranked.find((r) => r.m.code === runnerUpCode) ?? ranked[1]

export const mostMessages = Math.max(1, ...ranked.map((r) => r.n))
export const winnerAudience = winner ? (audienceById.get(winner.v.audienceId) ?? focus.audience) : null

// How much less the winner paid per message than the next best, to one decimal.
export const cheaperBy = (() => {
  const w = winner ? costOf(winner.m) : null
  const r = runnerUp && runnerUp !== winner ? costOf(runnerUp.m) : null
  if (w == null || r == null || !(r > w)) return null
  return Math.round(((r - w) / r) * 1000) / 10
})()
// The count a clear lead needs, shown only when the verdict is high.
export const clearLeadAt = confidence === "high" ? (verdict.metric === "cost_per_link_click" ? CONFIDENCE.high.linkClicks : CONFIDENCE.high.results) : null

// One amount when every post got the same budget, else the average.
export const spendEach = (() => {
  const spends = [...new Set(ranked.map((r) => r.m.spend))]
  return spends.length === 1 ? spends[0] : report.totalSpend / Math.max(1, ranked.length)
})()

// Share of views by age band, both genders together; 45-54 and up fold into 45+.
export function agesOf(m: VersionMetrics) {
  const sums = new Map<string, number>()
  for (const c of m.breakdown) {
    if (c.impressions <= 0) continue
    const band = parseInt(c.age, 10) >= 45 ? "45+" : c.age
    sums.set(band, (sums.get(band) ?? 0) + c.impressions)
  }
  const total = [...sums.values()].reduce((s, n) => s + n, 0)
  return [...sums]
    .sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true }))
    .map(([band, n]) => ({ band, share: total ? Math.round((n / total) * 100) : 0 }))
}

export const isSample = report.mode === "sample"
export { metricsByCode }
