"use client"

import * as React from "react"
import { useId, useRef } from "react"

import { UgcPost, type UgcStats } from "@/components/hunch/home/ugc-post"
import { useReveal } from "@/components/hunch/home/proof/reveal"
import { BusyDots, lowerFirst } from "@/components/hunch/screens/shared"
import type { ResultsReport, TestRun, Version, VersionMetrics } from "@/lib/hunch/types"

import { usePostFrame } from "../test/run-post"
import { CONFIDENCE_INDEX, CONFIDENCE_WORD, formatValue, leadPercent, type MetricWords } from "./words"

/** A result in the dot face. The peso sign is set in the display face, which has one. */
export function Num({ value, className }: { value: string | number; className?: string }) {
  const text = String(value)
  const hasPeso = text.startsWith("₱")
  return (
    <b className={className ? `hh-dot ${className}` : "hh-dot"}>
      {hasPeso ? <span className="hr-peso">₱</span> : null}
      {hasPeso ? text.slice(1) : text}
    </b>
  )
}

export type Ranked = { m: VersionMetrics; v: Version; n: number; value: number | null }

// What the test counted, and what one of it is called.
export function readTest(report: ResultsReport, run: TestRun, words: MetricWords) {
  const v = report.verdict
  const byResults = v.metric === "cost_per_result"
  const one = byResults ? words.noun : "link click"
  const many = byResults ? words.plural : "link clicks"
  const valueOf = new Map(v.ranking.map((r) => [r.code, r.value]))
  const ranked: Ranked[] = report.metrics
    .filter((m) => m.matchedBy !== "none")
    .sort((a, b) => a.rank - b.rank)
    .map((m) => ({ m, v: run.versions.find((x) => x.id === m.versionId), n: (byResults ? m.results : m.linkClicks) ?? 0, value: valueOf.get(m.code) ?? null }))
    .filter((r): r is Ranked => !!r.v)
  const winner = ranked.find((r) => r.m.code === v.winnerCode) ?? ranked[0]
  const runnerUp = v.runnerUpCode ? ranked.find((r) => r.m.code === v.runnerUpCode) : undefined
  const verb = one === "message" ? "messaged" : /click/.test(one) ? "clicked" : "answered"
  const unit = (n: number) => (n === 1 ? one : many)
  const count = (n: number) => (n > 0 ? `${n.toLocaleString("en-PH")} ${unit(n)}` : `No ${many}`)
  // "₱7" and "a message", or "2.4%" and "clicked".
  const cost = (value: number | null) => (value == null ? null : { n: formatValue(v.metric, value), of: v.metric === "ctr" ? "clicked" : `a ${one}` })
  return { ranked, winner, runnerUp, verb, unit, count, cost }
}

const statsOf = (m: VersionMetrics): UgcStats => ({ likes: m.reactions ?? 0, comments: m.comments ?? 0, saves: m.saves ?? 0, shares: m.shares ?? 0 })

const TICKS = 25

// Half a tick ring with a needle: how sure the result is.
function SureDial({ report, words }: { report: ResultsReport; words: MetricWords }) {
  const tip = useId()
  const v = report.verdict
  const level = CONFIDENCE_INDEX[v.confidence]
  const pct = leadPercent(v)
  const why =
    pct != null && v.runnerUpCode
      ? `${pct}% ${words.lower ? "cheaper than" : "ahead of"} the next best.`
      : `${report.days} ${report.days === 1 ? "day" : "days"} is a first signal.`
  return (
    <div className="hr-dial" tabIndex={0} aria-describedby={tip}>
      <svg viewBox="0 0 120 66" aria-hidden>
        {Array.from({ length: TICKS }, (_, i) => {
          const a = Math.PI * (1 - i / (TICKS - 1))
          const on = Math.floor((i / TICKS) * 3) <= level
          const r1 = i % 4 === 0 ? 44 : 48
          return (
            <line
              key={i}
              x1={(60 + Math.cos(a) * r1).toFixed(2)}
              y1={(60 - Math.sin(a) * r1).toFixed(2)}
              x2={(60 + Math.cos(a) * 54).toFixed(2)}
              y2={(60 - Math.sin(a) * 54).toFixed(2)}
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
              opacity={on ? 1 : 0.4}
            />
          )
        })}
        <g className="hr-needle" style={{ "--to": `${-60 + level * 60}deg` } as React.CSSProperties}>
          <line x1="60" y1="60" x2="60" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </g>
        <circle cx="60" cy="60" r="4" fill="currentColor" />
      </svg>
      <p className="hr-cap">
        How sure: <b>{CONFIDENCE_WORD[v.confidence]}</b>
      </p>
      <span id={tip} role="tooltip" className="hr-tip">
        {why}
      </span>
    </div>
  )
}

// Share of views by age band, both genders together; 45-54 and up fold into 45+.
function agesOf(m: VersionMetrics) {
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

// One dot for every 2% of views, by age.
function AgePlot({ m, caption }: { m: VersionMetrics; caption: string }) {
  const ages = agesOf(m)
  const top = Math.max(...ages.map((a) => a.share))
  return (
    <figure className="hr-ages">
      <div role="img" aria-label={`Who saw it, by age: ${ages.map((a) => `${a.band}, ${a.share}%`).join("; ")}`}>
        {ages.map((a, i) => (
          <span key={a.band} data-top={a.share === top ? "" : undefined}>
            <span>
              {Array.from({ length: Math.max(1, Math.round(a.share / 2)) }, (_, k) => (
                <i key={k} style={{ "--d": `${(0.5 + i * 0.08 + k * 0.025).toFixed(3)}s` } as React.CSSProperties} />
              ))}
            </span>
            <span>{a.band}</span>
          </span>
        ))}
      </div>
      <figcaption className="hr-cap">{caption}</figcaption>
    </figure>
  )
}

// Two-word names like "Noche Buena" or "Cubao Expo" never break across lines.
const keepNames = (name: string) => name.replace(/\b([A-Z][a-z]+) (?=[A-Z])/g, "$1\u00a0")

/** The answer on a field of its own: who messaged most, with the post that did it. */
export function WinnerPoster({
  report,
  run,
  words,
  breakdownBusy,
  onAddBreakdown,
}: {
  report: ResultsReport
  run: TestRun
  words: MetricWords
  breakdownBusy: boolean
  onAddBreakdown: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useReveal(ref, 0)
  const frame = usePostFrame(run)
  const t = readTest(report, run, words)
  const w = t.winner
  if (!w) return null
  const f = frame(w.v)
  const hasAges = w.m.breakdown.some((c) => c.impressions > 0)
  const ru = t.runnerUp && t.runnerUp.v.id !== w.v.id ? t.runnerUp : null

  return (
    <div ref={ref} className="hr-poster hh-field hh-field-sili hh-grain">
      <div className="hr-poster-in" data-rise>
        <div className="hr-words">
          <h2 className="hh-display hr-name">{`${keepNames(w.v.audienceName)} ${t.verb} most.`}</h2>
          {ru ? <p className="hh-line hr-next">{`Next best: ${lowerFirst(ru.v.audienceName)}, ${t.count(ru.n).toLowerCase()}`}</p> : null}
        </div>
        <div className="hr-tools">
          <SureDial report={report} words={words} />
          {hasAges ? (
            <AgePlot m={w.m} caption="Who saw it, by age" />
          ) : (
            <button type="button" className="hh-pill hh-pill-light hr-add" disabled={breakdownBusy} aria-busy={breakdownBusy || undefined} onClick={onAddBreakdown}>
              {breakdownBusy ? <BusyDots /> : null}
              Add the age and gender CSV
            </button>
          )}
        </div>
        <div className="hr-stage">
          <UgcPost version={f.version} photo={f.photo} avatar={f.avatar} handle={f.handle} price={f.sticker} stats={statsOf(w.m)} boosted />
          <p className="hr-bub hr-bub-a">
            <Num value={w.n.toLocaleString("en-PH")} />
            <span>{t.unit(w.n)}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

// Three sizes: the winner leads, the next two follow, the rest stay small.
const sizeOf = (i: number) => (i === 0 ? "lg" : i < 3 ? "md" : "sm")
const TILT = [3, -2.5, 2, -3, 2.5, -2, 3.5, -3]
// The tallest stack stays under this many drops.
const MOST = 24

/** The whole test: one drop per message, stacked over the post that got it. */
export function Race({ report, run, words }: { report: ResultsReport; run: TestRun; words: MetricWords }) {
  const ref = useRef<HTMLElement>(null)
  useReveal(ref)
  const frame = usePostFrame(run)
  const t = readTest(report, run, words)
  const per = Math.max(1, Math.ceil(Math.max(0, ...t.ranked.map((r) => r.n)) / MOST))
  const got = t.unit(2) === "messages" ? "message" : "click"

  return (
    <section ref={ref} className="hr-race" aria-labelledby="race-title">
      <header className="hr-race-head" data-rise>
        <h1 id="race-title" className="hh-title hr-h2">
          You’ve found your buyers.
        </h1>
        <p className="hh-line ha-line">{`See which of the ${t.ranked.length} posts got people to ${got}.`}</p>
      </header>
      <ol className="hr-cols" data-rise>
        {t.ranked.map(({ v, m, n }, i) => {
          const first = v.id === t.winner?.v.id
          const start = (t.ranked.length - 1 - i) * 0.08
          const f = frame(v)
          return (
            <li key={v.id} data-size={sizeOf(i)} data-first={first ? "" : undefined} style={{ "--i": t.ranked.length - 1 - i, "--tilt-z": `${TILT[i % TILT.length]}deg` } as React.CSSProperties}>
              <span aria-hidden className="hr-stack">
                {Array.from({ length: Math.round(n / per) }, (_, k) => (
                  <i key={k} className={first ? "hh-grain" : undefined} style={{ "--d": `${(0.4 + start + k * 0.035).toFixed(3)}s` } as React.CSSProperties} />
                ))}
              </span>
              <span aria-hidden className="hr-col-post">
                <UgcPost version={f.version} photo={f.photo} avatar={f.avatar} handle={f.handle} price={first ? f.sticker : undefined} stats={statsOf(m)} boosted={first} />
              </span>
              <p className="hr-col-cap">
                <b className="hh-dot">{n > 0 ? n.toLocaleString("en-PH") : "No"}</b> <span className="hr-unit">{t.unit(n)}</span>
                <span className="hr-col-name">{v.audienceName}</span>
              </p>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
