"use client"

import * as React from "react"
import { cn } from "cn"

import { motionState, useReduced, useSeen, useWidth } from "./hooks"
import { STAGGER, px } from "./motion"
import "./instruments.css"

export type ArcPoint = {
  value: number
  /** Short name for screen readers and the tooltip, e.g. "A3 · Coworkers". */
  label?: string
}

export type ArcDialProps = {
  points: ArcPoint[]
  /** Index of the highlighted point. Defaults to the highest value. */
  highlight?: number
  /** Range of the arc. Defaults to the lowest and highest values. */
  min?: number
  max?: number
  startLabel?: React.ReactNode
  startCaption?: React.ReactNode
  endLabel?: React.ReactNode
  endCaption?: React.ReactNode
  centerLabel?: React.ReactNode
  centerCaption?: React.ReactNode
  /** Thin baseline under the arc with a dotted extension to the edges. */
  baseline?: boolean
  format?: (n: number) => string
  /** What the values are, for screen readers, e.g. "Engagements per ₱100, all 8 posts". */
  label: string
  /** Seconds before the arc starts drawing. */
  delay?: number
  className?: string
}

const SIDE = 40
const TOP = 22
const MAX_R = 190

const defaultFormat = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 1 })
const sec = (n: number) => `${n.toFixed(3)}s`

function ArcDial({
  points,
  highlight,
  min,
  max,
  startLabel,
  startCaption,
  endLabel,
  endCaption,
  centerLabel,
  centerCaption,
  baseline = true,
  format = defaultFormat,
  label,
  delay = 0,
  className,
}: ArcDialProps) {
  const ref = React.useRef<HTMLElement>(null)
  const width = useWidth(ref, 340)
  const seen = useSeen(ref, 0.4)
  const reduced = useReduced()
  const gradId = React.useId().replace(/:/g, "")

  const values = points.map((p) => p.value)
  const lo = min ?? Math.min(...values)
  const hi = max ?? Math.max(...values)
  const hiIndex = highlight ?? values.indexOf(Math.max(...values))

  const r = Math.max(60, Math.min((width - SIDE * 2) / 2, MAX_R))
  const cx = width / 2
  const by = Math.round(TOP + r) + 0.5
  const height = by + 6

  const placed = points.map((p, i) => {
    const t = hi === lo ? 0.5 : Math.min(1, Math.max(0, (p.value - lo) / (hi - lo)))
    const phi = Math.PI * (1 - t)
    return {
      ...p,
      i,
      t,
      x: px(cx + r * Math.cos(phi)),
      y: px(by - r * Math.sin(phi)),
      nx: px(Math.cos(phi)),
      ny: px(-Math.sin(phi)),
      hot: i === hiIndex,
    }
  })
  // Left to right, the highlighted one arrives last.
  const order = [...placed].sort((a, b) => Number(a.hot) - Number(b.hot) || a.t - b.t)
  const hot = placed[hiIndex]

  const dotsStart = delay + 0.28
  const step = STAGGER.tight + 0.01
  const hotDelay = dotsStart + (order.length - 1) * step + 0.06

  // Dotted extension along the baseline, fading toward the edges.
  const ext: { x: number; o: number }[] = []
  const room = Math.max(1, cx - r - 6)
  for (let d = 9; d < room; d += 7) {
    const o = 0.55 * (1 - d / room)
    ext.push({ x: cx - r - d, o }, { x: cx + r + d, o })
  }

  const sorted = [...placed].sort((a, b) => b.value - a.value)
  const summary = `${label}. ${sorted
    .map((p) => `${p.label ? `${p.label}: ` : ""}${format(p.value)}${p.hot ? " (highlighted)" : ""}`)
    .join(", ")}.`

  return (
    <figure
      ref={ref}
      aria-label={label}
      {...motionState(seen, reduced)}
      className={cn("ins-arc relative w-full", className)}
      style={{ "--d": sec(delay) } as React.CSSProperties}
    >
      <figcaption className="sr-only">{summary}</figcaption>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden className="block overflow-visible">
        <defs>
          <radialGradient id={`${gradId}-halo`}>
            <stop offset="0%" style={{ stopColor: "var(--primary)", stopOpacity: 0.85 }} />
            <stop offset="45%" style={{ stopColor: "var(--primary)", stopOpacity: 0.32 }} />
            <stop offset="100%" style={{ stopColor: "var(--primary)", stopOpacity: 0 }} />
          </radialGradient>
        </defs>

        {baseline ? (
          <g className="ins-arc-fade" style={{ "--d": sec(delay + 0.1) } as React.CSSProperties}>
            <line x1={cx - r} x2={cx + r} y1={by} y2={by} className="stroke-foreground/14" strokeWidth={1} />
            {ext.map(({ x, o }) => (
              <circle key={x} cx={x} cy={by} r={1} className="fill-foreground" fillOpacity={px(o)} />
            ))}
          </g>
        ) : null}

        {/* The arc draws from the lowest value to the highest. */}
        <path
          d={`M ${cx - r} ${by} A ${r} ${r} 0 0 1 ${cx + r} ${by}`}
          pathLength={1}
          fill="none"
          className="ins-arc-path stroke-foreground/80"
          strokeWidth={1.25}
          strokeLinecap="round"
        />

        {/* Drop line from the highlighted point to the baseline. */}
        {hot && by - hot.y > 10 ? (
          <line
            x1={Math.round(hot.x) + 0.5}
            x2={Math.round(hot.x) + 0.5}
            y1={hot.y + 8}
            y2={by}
            className="ins-arc-fade stroke-foreground/30"
            strokeWidth={1}
            strokeDasharray="1 3"
            style={{ "--d": sec(hotDelay + 0.2) } as React.CSSProperties}
          />
        ) : null}

        {order.map((p, k) => {
          const d = p.hot ? hotDelay : dotsStart + k * step
          return (
            <g key={p.i} transform={`translate(${p.x} ${p.y})`}>
              {p.label ? <title>{`${p.label}: ${format(p.value)}`}</title> : null}
              {p.hot ? (
                <circle
                  r={24}
                  fill={`url(#${gradId}-halo)`}
                  className="ins-arc-halo"
                  style={{ "--d": sec(d + 0.12) } as React.CSSProperties}
                />
              ) : null}
              <g
                className="ins-arc-dot"
                style={{ "--dx": `${px(p.nx * 12)}px`, "--dy": `${px(p.ny * 12)}px`, "--d": sec(d) } as React.CSSProperties}
              >
                {p.hot ? (
                  <>
                    <circle r={5} className="fill-primary" />
                    <circle r={5.5} fill="none" className="stroke-foreground/90" strokeWidth={1.25} />
                  </>
                ) : (
                  <circle r={3} className="fill-foreground" />
                )}
              </g>
            </g>
          )
        })}
      </svg>

      {/* End and center labels sit under the arc ends and center. */}
      <div aria-hidden className="relative mt-3 h-[2.6rem] text-center">
        <ArcLabel x={cx - r} label={startLabel ?? format(lo)} caption={startCaption} />
        <ArcLabel x={cx} label={centerLabel} caption={centerCaption} />
        <ArcLabel x={cx + r} label={endLabel ?? format(hi)} caption={endCaption} />
      </div>
    </figure>
  )
}

function ArcLabel({ x, label, caption }: { x: number; label?: React.ReactNode; caption?: React.ReactNode }) {
  if (!label && !caption) return null
  return (
    <div className="absolute top-0 -translate-x-1/2 whitespace-nowrap" style={{ left: x }}>
      {label ? <p className="text-[15px] leading-tight font-semibold tracking-tight text-foreground">{label}</p> : null}
      {caption ? <p className="text-[13px] leading-tight text-muted-foreground">{caption}</p> : null}
    </div>
  )
}

export { ArcDial }
