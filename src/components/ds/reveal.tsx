"use client"

import * as React from "react"
import { cn } from "cn"

// Shared motion language. CSS twins: ease-expo, animate-enter, stagger-*.
const ease = [0.16, 1, 0.3, 1] as const
const breathe = [0.45, 0, 0.55, 1] as const

const duration = { fast: 0.18, enter: 0.7, slow: 0.9, count: 1.1 } as const

// Soft springs for small interactive things. Needle allows one slight settle.
const spring = { type: "spring", stiffness: 250, damping: 30, mass: 1 } as const
const springNeedle = { type: "spring", stiffness: 220, damping: 22, mass: 1 } as const

const staggerStep = 0.07

// Rise from a slight blur. Use with initial="hidden" animate="show".
const enter = {
  hidden: { opacity: 0, y: 12, filter: "blur(6px)" },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: duration.enter, ease, delay: i * staggerStep },
  }),
}

const staggerChildren = (step = staggerStep, delayChildren = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren: step, delayChildren } },
})

const enterChild = {
  hidden: enter.hidden,
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: duration.enter, ease },
  },
}

const motionTokens = { ease, breathe, duration, spring, springNeedle, staggerStep, enter, enterChild, staggerChildren }

function subscribeVisibility(cb: () => void) {
  document.addEventListener("visibilitychange", cb)
  return () => document.removeEventListener("visibilitychange", cb)
}

// False while the tab is hidden, so JS loops can rest.
function useTabVisible() {
  return React.useSyncExternalStore(
    subscribeVisibility,
    () => !document.hidden,
    () => true
  )
}

// Hides only below-the-fold content, so no-JS and first paint stay visible.
function Reveal({
  delay = 0,
  className,
  style,
  ...props
}: React.ComponentProps<"div"> & { delay?: number }) {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === "undefined") return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    if (el.getBoundingClientRect().top < window.innerHeight * 0.95) return
    el.dataset.reveal = "out"
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          el.dataset.reveal = "in"
          io.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -5% 0px" }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      data-slot="reveal"
      className={cn(className)}
      style={{ ...style, "--reveal-delay": `${delay}ms` } as React.CSSProperties}
      {...props}
    />
  )
}

export { Reveal, motionTokens, useTabVisible }
