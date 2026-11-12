"use client"

import * as React from "react"
import { animate } from "framer-motion"
import { cn } from "cn"

import { useReduced, useSeen, motionState } from "./hooks"
import { DURATION, EASE_COUNT, formatLike } from "./motion"
import "./instruments.css"

// Heavier dots at small sizes keep them legible; --ins-dot matches the dot diameter.
const sizes = {
  sm: { num: "text-[30px] [font-weight:900]", unit: "text-[13px]", gap: "ml-1", dot: "0.09em" },
  md: { num: "text-[48px] [font-weight:700]", unit: "text-[16px]", gap: "ml-1.5", dot: "0.078em" },
  lg: { num: "text-[clamp(64px,13vw,92px)] [font-weight:680] sm:[font-weight:600]", unit: "text-[20px]", gap: "ml-2", dot: "0.074em" },
  xl: { num: "text-[clamp(100px,26vw,148px)] [font-weight:620] sm:[font-weight:520]", unit: "text-[26px]", gap: "ml-2.5", dot: "0.07em" },
} as const

export type DotNumberSize = keyof typeof sizes

export type DotNumberProps = {
  /** A number, or a short string such as "75.2", "₱1,000", "2.3×" or "8". */
  value: number | string
  /** Small Geist suffix such as "°", "%" or "per ₱100". */
  unit?: React.ReactNode
  /** Small Geist prefix. Leading symbols like "₱" are split out of the value automatically. */
  prefix?: React.ReactNode
  size?: DotNumberSize
  /** Count up from 0 the first time it scrolls into view. */
  countUp?: boolean
  /** Seconds before the sweep starts. */
  delay?: number
  /** "top" sets the unit like a degree sign; "baseline" sits it on the line. */
  unitAlign?: "top" | "baseline"
  /** Digits stay paper; "accent" adds the one indigo glow behind the answer. */
  tone?: "default" | "accent"
  /** Screen reader text. Defaults to the value with its prefix and unit. */
  label?: string
  className?: string
}

type Parsed = {
  lead: string
  numeric: string | null
  target: number
  decimals: number
  grouping: boolean
  tail: string
}

function parse(value: number | string): Parsed {
  const text = typeof value === "number" ? String(value) : value.trim()
  const m = text.match(/^([^\d-]*?)(-?\d[\d,]*(?:\.\d+)?)(.*)$/)
  if (!m) return { lead: "", numeric: null, target: 0, decimals: 0, grouping: false, tail: text }
  const numeric = m[2]
  const decimals = numeric.includes(".") ? numeric.split(".")[1].length : 0
  return {
    lead: m[1],
    numeric,
    target: Number(numeric.replace(/,/g, "")),
    decimals,
    grouping: numeric.includes(","),
    tail: m[3],
  }
}

// Doto's period is a cross of dots; draw separators as single dots instead.
const SEP: Record<string, string> = { ".": "ins-sep", ",": "ins-sep ins-comma" }

function sepHtml(text: string) {
  return text.replace(/[.,]/g, (ch) => `<span class="${SEP[ch]}"></span>`)
}

function Glyphs({ text }: { text: string }) {
  return (
    <>
      {Array.from(text).map((ch, i) =>
        SEP[ch] ? <span key={i} className={SEP[ch]} /> : <React.Fragment key={i}>{ch}</React.Fragment>
      )}
    </>
  )
}

function DotNumber({
  value,
  unit,
  prefix,
  size = "md",
  countUp = true,
  delay = 0,
  unitAlign = "top",
  tone = "default",
  label,
  className,
}: DotNumberProps) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const liveRef = React.useRef<HTMLSpanElement>(null)
  const seen = useSeen(ref, 0.5)
  const reduced = useReduced()
  const p = React.useMemo(() => parse(value), [value])
  const s = sizes[size]
  const animated = countUp && !reduced && p.numeric !== null && p.target !== 0
  const zero = p.numeric ? formatLike(0, p.decimals, p.grouping) : ""
  const [counting, setCounting] = React.useState(animated)

  React.useEffect(() => {
    if (!animated || !seen) return
    const node = liveRef.current
    if (!node) return
    // Writes straight to the DOM; only digits and our own spans, no React renders per frame.
    const write = (v: number) => {
      node.innerHTML = sepHtml(formatLike(v, p.decimals, p.grouping))
    }
    write(0)
    const controls = animate(0, p.target, {
      duration: DURATION.count,
      ease: EASE_COUNT,
      delay: delay + 0.12,
      onUpdate: write,
      onComplete: () => setCounting(false),
    })
    // Lands on the real value even if frames stall (hidden tab, headless capture).
    const fallback = window.setTimeout(() => {
      controls.stop()
      setCounting(false)
    }, (delay + 0.12 + DURATION.count) * 1000 + 300)
    return () => {
      controls.stop()
      window.clearTimeout(fallback)
    }
  }, [animated, seen, p.target, p.decimals, p.grouping, delay])

  const lead = prefix ?? (p.lead ? p.lead.trim() : null)
  const tail = p.tail.trim()
  const showLive = animated && counting
  const spoken =
    label ??
    [
      `${typeof lead === "string" ? lead : ""}${p.numeric ?? ""}${tail}`,
      typeof unit === "string" ? unit : "",
    ]
      .filter(Boolean)
      .join(" ")

  const smallClass = cn(
    "font-sans font-medium tracking-normal",
    s.unit,
    "text-muted-foreground",
    unitAlign === "top" ? "self-start mt-[0.1em]" : "self-end mb-[0.04em]"
  )

  return (
    <span
      ref={ref}
      {...motionState(seen, reduced)}
      className={cn("ins-dotnum inline-flex items-end", tone === "accent" && "relative isolate", className)}
      style={{ "--ins-delay": `${delay}s` } as React.CSSProperties}
    >
      {tone === "accent" ? <span aria-hidden className="ins-dotglow" /> : null}
      <span className="sr-only">{spoken}</span>
      <span aria-hidden className="ins-sweep inline-flex items-end">
        {lead ? <span className={cn(smallClass, "mr-1")}>{lead}</span> : null}
        <span
          className={cn("ins-dotface text-foreground", s.num)}
          style={{ "--ins-dot": s.dot } as React.CSSProperties}
        >
          {p.numeric !== null ? (
            <span className="inline-grid">
              {/* Reserves the final width so nothing shifts while counting. */}
              <span className="invisible [grid-area:1/1]">
                <Glyphs text={p.numeric} />
              </span>
              {showLive ? (
                <span
                  ref={liveRef}
                  className="justify-self-end whitespace-nowrap [grid-area:1/1]"
                  dangerouslySetInnerHTML={{ __html: sepHtml(zero) }}
                />
              ) : (
                <span className="justify-self-end [grid-area:1/1]">
                  <Glyphs text={p.numeric} />
                </span>
              )}
            </span>
          ) : null}
          {tail ? <Glyphs text={tail} /> : null}
        </span>
        {unit ? <span className={cn(smallClass, s.gap)}>{unit}</span> : null}
      </span>
    </span>
  )
}

export { DotNumber }
