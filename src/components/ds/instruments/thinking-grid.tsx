"use client"

import * as React from "react"
import { cn } from "cn"

import { usePageVisible, useReduced, useWidth } from "./hooks"
import "./instruments.css"

export type ThinkingGridProps = {
  /** One row per step, e.g. ["Finding audiences", "Choosing 8", "Writing", "Checking", "Done"]. */
  steps: string[]
  /** How many steps are finished. Finished rows lock in place. */
  done: number
  /** Whether work is still happening. Defaults to done < steps.length. */
  active?: boolean
  /** Pixels between dots. */
  spacing?: number
  label?: string
  className?: string
}

const PERIOD = 3.2

function ThinkingGrid({ steps, done, active, spacing = 14, label = "Progress", className }: ThinkingGridProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const width = useWidth(ref, 280)
  const visible = usePageVisible()
  const reduced = useReduced()
  const working = active ?? done < steps.length

  const cols = Math.max(4, Math.floor((width - 4) / spacing) + 1)
  const used = (cols - 1) * spacing
  const left = (width - used) / 2
  const height = (steps.length - 1) * spacing + 8
  const current = Math.min(done, steps.length - 1)
  const status = done >= steps.length ? "Done" : steps[current]

  return (
    <div
      ref={ref}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={steps.length}
      aria-valuenow={Math.min(done, steps.length)}
      aria-valuetext={`${status}, step ${Math.min(done + 1, steps.length)} of ${steps.length}`}
      data-active={working && !reduced ? "" : undefined}
      data-paused={visible ? undefined : ""}
      className={cn("ins-think w-full", className)}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden className="block">
        {steps.map((step, row) => {
          const locked = row < done
          const upcoming = row > done
          return (
            <g key={step} opacity={upcoming ? 0.42 : 1}>
              {Array.from({ length: cols }, (_, col) => {
                const x = left + col * spacing
                const y = 4 + row * spacing
                // A diagonal wave: later columns and rows trail behind.
                const phase = -(PERIOD - ((col * 0.11 + row * 0.18) % PERIOD))
                const lockDelay = `${(col * 0.022).toFixed(3)}s`
                return (
                  <React.Fragment key={col}>
                    <circle
                      cx={x}
                      cy={y}
                      r={2}
                      className="ins-wave fill-primary"
                      data-off={locked ? "" : undefined}
                      style={{ "--d": locked ? lockDelay : `${phase.toFixed(3)}s` } as React.CSSProperties}
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r={1.6}
                      className="ins-lock fill-foreground/80"
                      data-on={locked ? "" : undefined}
                      style={{ "--d": lockDelay } as React.CSSProperties}
                    />
                  </React.Fragment>
                )
              })}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export { ThinkingGrid }
