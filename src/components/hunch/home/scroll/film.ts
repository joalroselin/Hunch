"use client"

import { useSyncExternalStore } from "react"

// The scroll film: full on wide screens, lighter on phones, off with reduced motion.
const WIDE = "(min-width: 900px) and (prefers-reduced-motion: no-preference)"
const MOVING = "(prefers-reduced-motion: no-preference)"

function useMedia(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query)
      mq.addEventListener("change", cb)
      return () => mq.removeEventListener("change", cb)
    },
    () => window.matchMedia(query).matches,
    () => false
  )
}

/** True where the pinned, wide-screen scenes play. Matches the `film` media query in scroll.css. */
export const useFilm = () => useMedia(WIDE)
/** True wherever scroll-linked motion is welcome. */
export const useMoving = () => useMedia(MOVING)

export const clamp01 = (n: number) => Math.min(1, Math.max(0, n))
// Slow start, slow stop.
export const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
