"use client"

import * as React from "react"
import { cn } from "cn"

import { motionState, useReduced, useSeen, useWidth } from "./hooks"
import { px } from "./motion"
import "./instruments.css"

export type TickGaugeProps = {
  /** Numeric value, or the index into `levels` when levels are given. */
  value: number
  min?: number
  max?: number
  /** Named steps, e.g. ["Early", "Medium", "Strong"]. The marker sits in the middle of its step. */
  levels?: string[]
  /** Number of ticks across the dial. */
  ticks?: number
  startLabel?: React.ReactNode
  endLabel?: React.ReactNode
  /** Readout inside the dial, e.g. "Early". */
  valueLabel?: React.ReactNode
  valueCaption?: React.ReactNode
  /** What is measured, for screen readers, e.g. "Confidence". */
  label: string
  /** Spoken value. Defaults to the level name or the number. */
  valueText?: string
  delay?: number
  className?: string
}

const PAD = 14
const TOP = 12
const TICK = 7
const MAJOR = 11
const MAX_R = 150
// Seconds; matches the needle transition in instruments.css.
const SWEEP = 0.5
const NEEDLE_LAG = 0.22
const NEEDLE = 1.1

const sec = (n: number) => `${n.toFixed(3)}s`

function TickGauge({
  value,
  min = 0,
  max = 1,
  levels,
  ticks = 49,
  startLabel,
  endLabel,
  valueLabel,
  valueCaption,
  label,
  valueText,
  delay = 0,
  className,
}: TickGaugeProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const width = useWidth(ref, 300)
  const seen = useSeen(ref, 0.5)
  const reduced = useReduced()

  const r = Math.max(56, Math.min((width - PAD * 2) / 2, MAX_R))
  const cx = Math.round(width / 2)
  const cy = TOP + Math.round(r)
  const height = cy + 2

  const f = levels?.length
    ? (Math.min(levels.length - 1, Math.max(0, Math.round(value))) + 0.5) / levels.length
    : max === min
      ? 0.5
      : Math.min(1, Math.max(0, (value - min) / (max - min)))
  // Needle drawn pointing up; rotation is relative to that.
  const target = (f - 0.5) * 180
  const needleDelay = delay + NEEDLE_LAG

  // Gaps between named steps.
  const bounds = levels?.length ? levels.slice(1).map((_, k) => (k + 1) / levels.length) : []
  const half = 0.6 / (ticks - 1)
  const marks: { t: number; major: boolean }[] = []
  for (let i = 0; i < ticks; i++) {
    const t = i / (ticks - 1)
    if (bounds.some((b) => Math.abs(b - t) < half)) continue
    const major = i === 0 || i === ticks - 1 || (!levels?.length && i % 6 === 0)
    marks.push({ t, major })
  }

  const line = (t: number, major: boolean) => {
    const a = Math.PI + t * Math.PI
    const r1 = r - (major ? MAJOR : TICK)
    return {
      x1: px(cx + r1 * Math.cos(a)),
      y1: px(cy + r1 * Math.sin(a)),
      x2: px(cx + r * Math.cos(a)),
      y2: px(cy + r * Math.sin(a)),
    }
  }
  // When the needle passes a tick, assuming an ease-out cubic.
  const passAt = (t: number) => {
    const q = f > 0 ? Math.min(0.999, t / f) : 1
    return needleDelay + NEEDLE * 0.85 * (1 - Math.cbrt(1 - q))
  }

  const spoken = valueText ?? (levels?.length ? levels[Math.round(value)] : String(value))
  const firstLabel = startLabel ?? (levels?.length ? levels[0] : min)
  const lastLabel = endLabel ?? (levels?.length ? levels[levels.length - 1] : max)

  return (
    <div
      ref={ref}
      role="meter"
      aria-label={label}
      aria-valuemin={levels?.length ? 0 : min}
      aria-valuemax={levels?.length ? levels.length - 1 : max}
      aria-valuenow={value}
      aria-valuetext={spoken}
      {...motionState(seen, reduced)}
      className={cn("ins-gauge relative w-full", className)}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden className="block overflow-visible">
        {/* The dial fades in left to right, then ticks brighten as the needle passes them. */}
        {marks.map(({ t, major }) => (
          <line
            key={`b${t}`}
            {...line(t, major)}
            className="ins-gtick stroke-foreground/25"
            strokeWidth={1}
            style={{ "--d": sec(delay + t * SWEEP) } as React.CSSProperties}
          />
        ))}
        {marks
          .filter(({ t }) => t <= f)
          .map(({ t, major }) => (
            <line
              key={`l${t}`}
              {...line(t, major)}
              className="ins-gtick stroke-foreground/85"
              strokeWidth={1}
              style={{ "--d": sec(passAt(t)) } as React.CSSProperties}
            />
          ))}

        {/* The marker crosses the ring; a small dot rides just inside it. */}
        <g
          className="ins-needle"
          style={
            {
              transformOrigin: `${cx}px ${cy}px`,
              "--to": `${px(target)}deg`,
              "--d": sec(needleDelay),
            } as React.CSSProperties
          }
        >
          <line
            x1={cx}
            y1={cy - r - 5}
            x2={cx}
            y2={cy - r + MAJOR + 2}
            className="stroke-primary"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy - r + MAJOR + 9} r={2} className="fill-foreground" />
        </g>
        <line x1={cx - r} x2={cx + r} y1={cy + 0.5} y2={cy + 0.5} className="stroke-foreground/10" strokeWidth={1} />
      </svg>

      {valueLabel || valueCaption ? (
        <div aria-hidden className="absolute inset-x-0 text-center" style={{ bottom: `calc(100% - ${cy - 4}px)` }}>
          {valueLabel ? (
            <div className="text-[22px] leading-none font-semibold tracking-tight text-foreground">{valueLabel}</div>
          ) : null}
          {valueCaption ? <p className="mt-1.5 text-[13px] leading-tight text-muted-foreground">{valueCaption}</p> : null}
        </div>
      ) : null}

      <div aria-hidden className="mt-2 flex items-start justify-between" style={{ paddingInline: Math.max(0, cx - r) }}>
        <span className="font-mono text-[11px] leading-tight text-muted-foreground">{firstLabel}</span>
        <span className="font-mono text-[11px] leading-tight text-muted-foreground">{lastLabel}</span>
      </div>
    </div>
  )
}

export { TickGauge }
