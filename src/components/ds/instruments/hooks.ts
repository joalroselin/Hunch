"use client"

import * as React from "react"
import { useInView, usePageInView } from "framer-motion"

// True once the element has scrolled into view; stays true.
export function useSeen<T extends Element>(ref: React.RefObject<T | null>, amount = 0.3) {
  return useInView(ref, { once: true, amount, margin: "0px 0px -8% 0px" })
}

const REDUCED = "(prefers-reduced-motion: reduce)"

function subscribeReduced(onChange: () => void) {
  const mq = window.matchMedia(REDUCED)
  mq.addEventListener("change", onChange)
  return () => mq.removeEventListener("change", onChange)
}

// False on the server and during hydration, then the real setting, so markup always matches.
export function useReduced() {
  return React.useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED).matches,
    () => false
  )
}

// False while the tab is hidden, so ambient loops can pause.
export function usePageVisible() {
  return usePageInView()
}

// Element width in CSS pixels, so SVG geometry stays 1:1 and lines stay crisp.
export function useWidth<T extends Element>(ref: React.RefObject<T | null>, fallback: number) {
  const [width, setWidth] = React.useState(fallback)
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const read = () => {
      const w = Math.round(el.getBoundingClientRect().width)
      if (w > 0) setWidth((prev) => (prev === w ? prev : w))
    }
    read()
    if (typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return width
}

// Shorthand for the data attributes the instrument CSS keys off.
export function motionState(seen: boolean, reduced: boolean) {
  return {
    "data-seen": seen ? "" : undefined,
    "data-reduced": reduced ? "" : undefined,
  } as const
}
