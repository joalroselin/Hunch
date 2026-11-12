"use client"

import { useEffect, useState, type CSSProperties, type ReactNode } from "react"

import { cn } from "@/lib/utils"

import "./more.css"

// True once the slide is on screen; resets after it leaves so a return plays again.
export function useOn(active: boolean, still: boolean) {
  const [on, setOn] = useState(false)
  useEffect(() => {
    if (still) return
    if (!active) {
      const t = window.setTimeout(() => setOn(false), 900)
      return () => window.clearTimeout(t)
    }
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => setOn(true))
    })
    return () => cancelAnimationFrame(raf)
  }, [active, still])
  return on
}

type ShellProps = {
  on: boolean
  still: boolean
  className?: string
  label: string
  children: ReactNode
}

/** The slide root: plays its entrance when active, shows the finished state when still. */
export function Shell({ on, still, className, label, children }: ShellProps) {
  return (
    <section aria-label={label} className={cn("mo", className)} data-on={on ? "" : undefined} data-still={still ? "" : undefined}>
      {children}
    </section>
  )
}

/** Delay for a staggered arrival, in seconds. */
export const at = (d: number, extra?: CSSProperties): CSSProperties => ({ "--d": `${d}s`, ...extra }) as CSSProperties

/** The quiet source line. */
export function Src({ children, d = 0.6 }: { children: ReactNode; d?: number }) {
  return (
    <p className="mo-src" data-in style={at(d)}>
      {children}
    </p>
  )
}

/** A peso amount with the sign a touch smaller, for big numbers. */
export function Pesos({ n, className }: { n: string; className?: string }) {
  return (
    <span className={className}>
      <span className="mo-peso">₱</span>
      {n}
    </span>
  )
}
