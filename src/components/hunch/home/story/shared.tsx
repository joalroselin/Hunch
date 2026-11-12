"use client"

import * as React from "react"
import { useInView } from "framer-motion"
import { cn } from "@/lib/utils"

import { useTabVisible } from "@/components/ds"
import { useReduced, useSeen } from "@/components/ds/instruments"
import { shortPrice } from "@/components/hunch/screens/shared"
import { report, run, versionById } from "../data"
import "./story.css"

export const brand = run.product.name
export const price = shortPrice(run.product.price)

// Drafts with the most broken rules first.
export const rejected = [...run.rejected].sort((a, b) => b.reasons.length - a.reasons.length)

export const winner = versionById.get(report.winnerId)!
export const winnerMetrics = report.metrics.find((m) => m.versionId === report.winnerId)!
export const perPost = report.totalSpend / run.versions.length

export function pesos(n: number) {
  return `₱${n.toLocaleString("en-PH", { maximumFractionDigits: 0 })}`
}

// Live in-view flag plus tab visibility and reduced motion, for loops.
export function useLoop<T extends Element>(ref: React.RefObject<T | null>, amount = 0.35) {
  const inView = useInView(ref, { amount })
  const visible = useTabVisible()
  const reduced = useReduced()
  return { on: inView && visible && !reduced, inView, reduced }
}

type Part = { text: string; className?: string }

// Heading that rises word by word the first time it scrolls into view.
export function RiseWords({
  parts,
  as: Tag = "h2",
  step = 0.07,
  delay = 0,
  className,
  id,
}: {
  parts: Part[]
  as?: "h1" | "h2" | "h3" | "p"
  step?: number
  delay?: number
  className?: string
  id?: string
}) {
  const ref = React.useRef<HTMLHeadingElement>(null)
  const seen = useSeen(ref, 0.5)
  const reduced = useReduced()
  let i = 0
  return (
    <Tag ref={ref} id={id} data-on={seen ? "" : undefined} data-reduced={reduced ? "" : undefined} className={cn("st-words", className)}>
      <span className="sr-only">{parts.map((p) => p.text).join(" ")}</span>
      <span aria-hidden>
        {parts.map((p, pi) => (
          <span key={pi} className={p.className}>
            {p.text.split(/[ \t\r\n]+/).filter(Boolean).map((w) => {
              const n = i++
              return (
                <React.Fragment key={n}>
                  <span className="st-word" style={{ transitionDelay: `${delay + n * step}s` }}>
                    {w}
                  </span>{" "}
                </React.Fragment>
              )
            })}
          </span>
        ))}
      </span>
    </Tag>
  )
}
