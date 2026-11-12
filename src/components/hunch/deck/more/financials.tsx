"use client"

import type { CSSProperties } from "react"

import type { SlideProps } from "../types"
import { Count } from "./count"
import { Shell, Src, at, useOn } from "./parts"
import "./financials.css"

// Joal's draft model (MVP Plan): signups in month 1, monthly signup growth, free to paid, monthly churn.
const SCENARIOS = {
  upside: [600, 0.12, 0.1, 0.05],
  conservative: [100, 0.08, 0.05, 0.1],
  base: [300, 0.1, 0.08, 0.07],
} as const
const MONTHS = 24
// From the same model, with the team and running costs in the MVP Plan.
const BREAK_EVEN = 14

function payingSellers([first, growth, pay, leave]: readonly number[]) {
  let p = 0
  return Array.from({ length: MONTHS }, (_, m) => (p = p * (1 - leave) + first * Math.pow(1 + growth, m) * pay))
}

// The plot, in stage px: 1,500 paying sellers at the top.
const W = 1520
const H = 430
const TOP = 1500
const x = (month: number) => ((month - 1) / (MONTHS - 1)) * W
const y = (n: number) => H - (n / TOP) * H
const pathOf = (series: number[]) => series.map((n, i) => `${i ? "L" : "M"}${x(i + 1).toFixed(1)} ${y(n).toFixed(1)}`).join("")

const series = Object.fromEntries(Object.entries(SCENARIOS).map(([k, v]) => [k, payingSellers(v)])) as Record<keyof typeof SCENARIOS, number[]>
const base = series.base
const at12 = Math.round(base[11] ?? 0)
const at24 = Math.round(base[MONTHS - 1] ?? 0)
const atBreak = base[BREAK_EVEN - 1] ?? 0
const low24 = Math.round(series.conservative[MONTHS - 1] ?? 0)

/** Financials: paying sellers over 24 months in the draft model; the base case breaks even in month 14. */
export function Financials({ active, still }: SlideProps) {
  const on = useOn(active, still)
  return (
    <Shell on={on} still={still} label="Financials" className="fn">
      <div className="fn-words">
        <h2 className="mo-h fn-h" data-in>
          Break-even in month {BREAK_EVEN}.
        </h2>
        <p className="mo-line" data-in style={at(0.08)}>
          Base case of our draft model.
        </p>
      </div>

      <div className="fn-cash" data-in style={at(0.2)}>
        <b className="mo-num">
          <span className="mo-peso">₱</span>1.3M
        </b>
        <span>cash needed before break-even</span>
      </div>

      <div className="fn-chart" style={{ "--w": `${W}px`, "--h": `${H}px` } as CSSProperties}>
        <svg className="fn-svg" viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden>
          <defs>
            <clipPath id="fn-clip">
              <rect x="-10" y="0" width={W + 20} height={H + 10} />
            </clipPath>
          </defs>
          {Array.from({ length: MONTHS }, (_, i) => (
            <line key={i} className="fn-tick" x1={x(i + 1)} x2={x(i + 1)} y1={H} y2={H + ((i + 1) % 6 === 0 || i === 0 ? 16 : 8)} />
          ))}
          <line className="fn-floor" x1={-24} x2={W + 24} y1={H} y2={H} />
          <g clipPath="url(#fn-clip)">
            <path className="fn-line fn-faint fn-up" d={pathOf(series.upside)} pathLength={1} />
            <path className="fn-line fn-faint fn-low" d={pathOf(series.conservative)} pathLength={1} />
            <path className="fn-line fn-base" d={pathOf(base)} pathLength={1} />
          </g>
          <circle className="fn-dot fn-dot-12" cx={x(12)} cy={y(at12)} r={9} />
          <circle className="fn-dot fn-dot-24" cx={x(MONTHS)} cy={y(at24)} r={11} />
          <circle className="fn-break" cx={x(BREAK_EVEN)} cy={y(atBreak)} r={17} />
        </svg>

        <p className="fn-m fn-m1" style={{ left: x(1) }}>
          Month 1
        </p>
        {[6, 12, 18, 24].map((m) => (
          <p key={m} className="fn-m" style={{ left: x(m) }}>
            {m}
          </p>
        ))}

        <p className="fn-tag fn-tag-up" data-in style={at(1.3, { left: x(13.2) + 26, top: 6 })}>
          Upside
        </p>
        <p className="fn-tag fn-tag-low" data-in style={at(1.3, { left: x(MONTHS) - 4, top: y(low24) - 44 })}>
          Conservative
        </p>
        <p className="fn-val fn-val-12" data-in style={at(1.5, { left: x(12) - 22, top: y(at12) - 22 })}>
          <b>
            <Count to={at12} on={on} still={still} delay={1.3} ms={900} />
          </b>
          <span>month 12</span>
        </p>
        <p className="fn-be" data-in style={at(1.75, { left: x(BREAK_EVEN) + 34, top: y(atBreak) + 14 })}>
          Break-even
        </p>
        <p className="fn-val fn-val-24" data-in style={at(2.0, { left: x(MONTHS), top: y(at24) })}>
          <b>
            <Count to={at24} on={on} still={still} delay={1.9} ms={1000} />
          </b>
          <span>paying sellers by month 24</span>
        </p>
      </div>

      <Src d={1.2}>Hunch draft model, Nov 2026. Assumptions, not a forecast. Base: 300 signups in month 1, up 10% a month, 8% pay, 7% leave a month.</Src>
    </Shell>
  )
}
