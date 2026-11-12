// Shared motion language for Hunch. Pure values only, safe to import from server components.
import type { Transition, Variants } from "framer-motion"

// Expo ease-out for every entrance.
export const EASE_OUT = [0.16, 1, 0.3, 1] as const
export const EASE_OUT_CSS = "cubic-bezier(0.16, 1, 0.3, 1)"
// Count-ups: settles without a long crawl through the last digits.
export const EASE_COUNT = [0.25, 1, 0.5, 1] as const
// Symmetric ease for the slow ambient loops.
export const EASE_BREATHE = [0.45, 0, 0.55, 1] as const

// Seconds.
export const DURATION = {
  press: 0.16,
  hover: 0.18,
  fade: 0.4,
  enter: 0.7,
  enterSlow: 0.9,
  draw: 0.9,
  count: 1.1,
  bloom: 1.6,
  breathe: 10,
  drift: 26,
} as const

// Seconds between siblings arriving in reading order.
export const STAGGER = {
  tight: 0.05,
  base: 0.07,
  loose: 0.09,
} as const

// Upper bound for a screen's whole entrance choreography.
export const MAX_ENTRANCE = 1.6

// Soft spring for small interactive things. No visible overshoot.
export const SPRING: Transition = { type: "spring", stiffness: 260, damping: 30, mass: 1 }
// Gauge needles get one slight settle.
export const NEEDLE_SPRING: Transition = { type: "spring", visualDuration: 1.05, bounce: 0.16 }
export const NEEDLE_EASE_CSS = "cubic-bezier(0.34, 1.16, 0.5, 1)"

// Rise distance and starting blur for entrances.
export const RISE = { y: 12, blur: 6 } as const

// Delay for item i in a staggered list, capped so long lists never drag.
export function stagger(i: number, step: number = STAGGER.base, base = 0, cap = MAX_ENTRANCE - DURATION.enter) {
  return base + Math.min(i * step, cap)
}

// Reduced motion: opacity fades, anything that moves jumps straight to its end.
export function fadeOnly(delay = 0): Transition {
  return {
    duration: DURATION.fade,
    ease: "linear",
    delay,
    x: { duration: 0 },
    y: { duration: 0 },
    scale: { duration: 0 },
    filter: { duration: 0 },
    pathLength: { duration: 0 },
  }
}

export function enter(delay = 0, duration: number = DURATION.enter): Transition {
  return { duration, ease: EASE_OUT, delay }
}

// Rise from a slight blur. Use with initial="hidden" animate="show" and custom={index}.
export const riseVariants: Variants = {
  hidden: { opacity: 0, y: RISE.y, filter: `blur(${RISE.blur}px)` },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: enter(stagger(i)),
  }),
}

// Reduced motion: fades only.
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  show: (i: number = 0) => ({
    opacity: 1,
    transition: { duration: DURATION.fade, ease: "linear", delay: stagger(i, 0.03) },
  }),
}

export function entranceVariants(reduced: boolean | null | undefined): Variants {
  return reduced ? fadeVariants : riseVariants
}

// Parent that staggers its children's "show".
export function staggerParent(step: number = STAGGER.base, delayChildren = 0): Variants {
  return {
    hidden: {},
    show: { transition: { staggerChildren: step, delayChildren } },
  }
}

// Hover lift and press for cards and tiles.
export const hoverLift = {
  whileHover: { y: -2 },
  whileTap: { scale: 0.97 },
  transition: { type: "spring", stiffness: 280, damping: 30 } as Transition,
}

// Route change: a short crossfade with a rise.
export const routeVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: enter(0, 0.5) },
  exit: { opacity: 0, transition: { duration: 0.18, ease: "linear" } },
}

// Rounds SVG coordinates so server and client trig agree.
export function px(n: number) {
  return Math.round(n * 100) / 100
}

// Formats a number like a template string: same decimals and grouping.
export function formatLike(n: number, decimals: number, grouping: boolean) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: grouping,
  })
}
