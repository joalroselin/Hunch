"use client"

import * as React from "react"
import { cn } from "cn"

import { motionState, useReduced, useSeen, useWidth } from "./hooks"
import { px } from "./motion"
import "./instruments.css"

export type ScatterCell = {
  /** Column index, e.g. the age band. */
  x: number
  /** Row index, e.g. the gender. */
  y: number
  /** Raw amount, e.g. views. Dots are drawn in proportion to the total. */
  value: number
  /** Spoken name of the cell, e.g. "Women 25-34". */
  label: string
  highlight?: boolean
}

export type DotScatterProps = {
  cells: ScatterCell[]
  /** Column names left to right, e.g. ["18-24", "25-34", "35-44", "45+"]. */
  columns: string[]
  /** Row names top to bottom, e.g. ["Women", "Men"]. */
  rows?: string[]
  /** How much of the total one dot stands for. Defaults to 1%. */
  perDot?: number
  /** "ends" shows only the first and last column names. */
  columnLabels?: "ends" | "all"
  /** What the dots count, for screen readers, e.g. "Views of A3 by age and gender". */
  label: string
  height?: number
  delay?: number
  className?: string
}

const GOLDEN = Math.PI * (3 - Math.sqrt(5))
const DOT = 1.7

function DotScatter({
  cells,
  columns,
  rows = [""],
  perDot = 0.01,
  columnLabels = "ends",
  label,
  height = 132,
  delay = 0,
  className,
}: DotScatterProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const width = useWidth(ref, 300)
  const seen = useSeen(ref, 0.45)
  const reduced = useReduced()

  const gutter = rows.some(Boolean) ? 44 : 0
  const plotW = Math.max(40, width - gutter)
  const colW = plotW / columns.length
  const rowH = height / rows.length
  const total = cells.reduce((s, c) => s + c.value, 0) || 1

  const counted = cells.map((c) => {
    const share = c.value / total
    const n = c.value > 0 ? Math.max(1, Math.round(share / perDot)) : 0
    return { ...c, share, n }
  })
  const maxN = Math.max(1, ...counted.map((c) => c.n))
  // Spiral spacing so the fullest cell fits its slot.
  const c = Math.min(3.3, (0.47 * Math.min(colW, rowH)) / Math.sqrt(maxN + 0.5))

  const order = [...counted].sort(
    (a, b) => Number(!!a.highlight) - Number(!!b.highlight) || a.y - b.y || a.x - b.x
  )
  const cellStep = 0.06

  const pct = (s: number) => `${Math.round(s * 100)}%`
  const summary = `${label}. ${[...counted]
    .sort((a, b) => b.share - a.share)
    .map((cell) => `${cell.label} ${pct(cell.share)}${cell.highlight ? " (highlighted)" : ""}`)
    .join(", ")}.`

  return (
    <figure ref={ref} aria-label={label} {...motionState(seen, reduced)} className={cn("ins-scatter relative w-full", className)}>
      <figcaption className="sr-only">{summary}</figcaption>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden className="block overflow-visible">
        {/* Faint crosshair and a pinpoint at every cell center. */}
        <line x1={gutter} x2={width} y1={Math.round(height / 2) + 0.5} y2={Math.round(height / 2) + 0.5} className="stroke-foreground/10" strokeWidth={1} />
        <line x1={Math.round(gutter + plotW / 2) + 0.5} x2={Math.round(gutter + plotW / 2) + 0.5} y1={0} y2={height} className="stroke-foreground/10" strokeWidth={1} />
        {columns.map((_, xi) =>
          rows.map((__, yi) => (
            <circle
              key={`${xi}-${yi}`}
              cx={gutter + (xi + 0.5) * colW}
              cy={(yi + 0.5) * rowH}
              r={0.9}
              className="fill-foreground/30"
            />
          ))
        )}

        {order.map((cell, ci) => {
          const cx = gutter + (cell.x + 0.5) * colW
          const cy = (cell.y + 0.5) * rowH
          const perDotDelay = Math.min(0.014, 0.36 / Math.max(1, cell.n))
          const base = delay + ci * cellStep
          const ringR = c * Math.sqrt(cell.n) + DOT + 4.5
          return (
            <g key={`${cell.x}-${cell.y}`}>
              {Array.from({ length: cell.n }, (_, k) => {
                const rr = c * Math.sqrt(k + 0.5)
                const th = k * GOLDEN
                const ox = rr * Math.cos(th)
                const oy = rr * Math.sin(th)
                return (
                  <circle
                    key={k}
                    cx={px(cx + ox)}
                    cy={px(cy + oy)}
                    r={cell.highlight ? DOT + 0.2 : DOT}
                    className={cn("ins-sdot", cell.highlight ? "fill-primary" : "fill-foreground/85")}
                    style={
                      {
                        "--dx": `${(-ox * 0.9).toFixed(2)}px`,
                        "--dy": `${(-oy * 0.9).toFixed(2)}px`,
                        "--d": `${(base + k * perDotDelay).toFixed(3)}s`,
                      } as React.CSSProperties
                    }
                  />
                )
              })}
              {cell.highlight && cell.n > 0 ? (
                <circle
                  cx={cx}
                  cy={cy}
                  r={px(ringR)}
                  fill="none"
                  strokeWidth={1}
                  className="ins-sring stroke-primary"
                  style={{ "--d": `${(base + cell.n * perDotDelay + 0.05).toFixed(3)}s` } as React.CSSProperties}
                />
              ) : null}
            </g>
          )
        })}
      </svg>

      {rows.some(Boolean) ? (
        <div aria-hidden className="absolute top-0 left-0" style={{ width: gutter, height }}>
          {rows.map((row, yi) => (
            <span
              key={row}
              className="absolute left-0 -translate-y-1/2 font-mono text-[11px] leading-none text-muted-foreground"
              style={{ top: (yi + 0.5) * rowH }}
            >
              {row}
            </span>
          ))}
        </div>
      ) : null}

      <div aria-hidden className="relative mt-2 h-3.5 font-mono text-[11px] leading-tight text-muted-foreground" style={{ marginLeft: gutter }}>
        {columns.map((col, xi) => {
          const show = columnLabels === "all" || xi === 0 || xi === columns.length - 1
          if (!show) return null
          const edge = xi === 0 ? "left" : xi === columns.length - 1 ? "right" : "center"
          return (
            <span
              key={col}
              className={cn("absolute top-0 whitespace-nowrap", edge === "center" && "-translate-x-1/2")}
              style={
                edge === "left"
                  ? { left: Math.max(0, (xi + 0.5) * colW - 16) }
                  : edge === "right"
                    ? { right: Math.max(0, (columns.length - xi - 0.5) * colW - 16) }
                    : { left: (xi + 0.5) * colW }
              }
            >
              {col}
            </span>
          )
        })}
      </div>
    </figure>
  )
}

export { DotScatter }
