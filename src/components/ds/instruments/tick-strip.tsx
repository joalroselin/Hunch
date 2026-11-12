"use client"

import * as React from "react"
import { cn } from "cn"

import { motionState, useReduced, useSeen, useWidth } from "./hooks"
import "./instruments.css"

export type TickStripProps = {
  /** The value to emphasize. */
  value: number
  min: number
  max: number
  /** Other data points in the same range, drawn as slightly taller ticks. */
  marks?: number[]
  startLabel?: React.ReactNode
  endLabel?: React.ReactNode
  /** What is measured, for screen readers, e.g. "Saves and shares per 1,000 views". */
  label: string
  format?: (n: number) => string
  /** Strip height in pixels. */
  height?: number
  /** Pixels between ticks. */
  spacing?: number
  delay?: number
  className?: string
}

const defaultFormat = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 1 })

function TickStrip({
  value,
  min,
  max,
  marks = [],
  startLabel,
  endLabel,
  label,
  format = defaultFormat,
  height = 52,
  spacing = 6,
  delay = 0,
  className,
}: TickStripProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const width = useWidth(ref, 300)
  const seen = useSeen(ref, 0.6)
  const reduced = useReduced()

  const pad = 2
  const span = Math.max(1, width - pad * 2)
  const count = Math.max(2, Math.floor(span / spacing) + 1)
  const used = (count - 1) * spacing
  const left = Math.round((width - used) / 2)
  const pos = (v: number) => left + (max === min ? 0.5 : Math.min(1, Math.max(0, (v - min) / (max - min)))) * used
  const xv = Math.round(pos(value))
  const markX = marks.map((m) => Math.round(pos(m)))
  const mid = height / 2
  const sigma = Math.max(16, used * 0.075)
  const base = 9
  const swell = height * 0.6

  const ticks: { x: number; h: number; mark: boolean }[] = []
  for (let i = 0; i < count; i++) {
    const x = left + i * spacing
    if (Math.abs(x - xv) < spacing * 0.75) continue
    const mark = markX.some((m) => Math.abs(m - x) <= spacing / 2)
    const g = Math.exp(-(((x - xv) / sigma) ** 2))
    const h = Math.round(base + swell * g + (mark ? 6 : 0))
    ticks.push({ x, h, mark })
  }
  const stepDelay = Math.min(0.009, 0.42 / ticks.length)

  return (
    <div
      ref={ref}
      role="meter"
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={`${format(value)}, in a range of ${format(min)} to ${format(max)}`}
      {...motionState(seen, reduced)}
      className={cn("ins-strip relative w-full", className)}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden className="block">
        {ticks.map((t, i) => (
          <rect
            key={t.x}
            x={t.x}
            y={Math.round(mid - t.h / 2)}
            width={1}
            height={t.h}
            className={cn("ins-tick", t.mark ? "fill-foreground/70" : "fill-foreground/28")}
            style={{ "--d": `${delay + i * stepDelay}s` } as React.CSSProperties}
          />
        ))}
        <rect
          x={xv - 1}
          y={2}
          width={2}
          height={height - 4}
          rx={1}
          className="ins-tick fill-primary"
          style={{ "--d": `${delay + ticks.length * stepDelay * 0.6}s` } as React.CSSProperties}
        />
      </svg>
      {startLabel || endLabel ? (
        <div aria-hidden className="mt-2 flex justify-between font-mono text-[11px] leading-tight text-muted-foreground">
          <span>{startLabel}</span>
          <span>{endLabel}</span>
        </div>
      ) : null}
    </div>
  )
}

export { TickStrip }
