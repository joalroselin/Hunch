"use client"

import { useCallback, useEffect, useRef, type CSSProperties, type ReactNode } from "react"
import { motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "framer-motion"

import type { Mode } from "@/lib/hunch/types"

import { run } from "./data"
import { PromptBox } from "./prompt-box"
import { useReveal } from "./proof/reveal"
import { clamp01, easeOut, useFilm, useMoving } from "./scroll/film"
import "./proof/base.css"
import "./proof/closing.css"

// The seed's size in px. The drop is drawn at 150vmax and scaled down to it, so its edge stays sharp as it grows.
const SEED_WIDE = 84
const SEED_NARROW = 60
// Phones: the seed's center below the scene's top edge, as in closing.css.
const SEED_TOP = 140

const seedOf = (px: number) =>
  typeof window === "undefined" ? 0.04 : px / (1.5 * Math.max(window.innerWidth, window.innerHeight))

// Eases in, then grows by the same factor for every step of scroll, so the swell reads as steady.
function swell(t: number, seed: number) {
  const c = clamp01(t)
  const e = (c < 0.2 ? (c * c) / 0.4 : c - 0.1) / 0.9
  return seed * Math.pow(1 / seed, e)
}

// Rises into place over a stretch of the pinned scroll. A slot word comes up through its own baseline, with no fade.
function Rise({ p, from, on, slot, as = "div", className, children }: { p: MotionValue<number>; from: number; on: boolean; slot?: boolean; as?: "div" | "span"; className?: string; children: ReactNode }) {
  const y = useTransform(p, [from, from + (slot ? 0.16 : 0.2)], [slot ? "1.3em" : "0.42em", "0em"], { ease: easeOut })
  const opacity = useTransform(p, [from, from + 0.06], [0, 1])
  const Tag = as === "span" ? motion.span : motion.div
  return (
    <Tag className={className} style={on ? (slot ? { y } : { y, opacity }) : undefined}>
      {children}
    </Tag>
  )
}

/** The closing scene: Hunch types one more message, the bubble swells into the field, and the same try box is inside it. Phones get it without the pin. */
export function CtaBand({ serverMode }: { serverMode: Mode }) {
  const ref = useRef<HTMLElement>(null)
  const field = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const timers = useRef<number[]>([])
  const greeted = useRef(false)
  const lastP = useRef(0)
  useReveal(ref, 20)
  const film = useFilm()
  const moving = useMoving()
  const flow = moving && !film
  // near: the scene's top edge travels from the bottom of the screen to the top. p: the pinned stretch.
  const { scrollYProgress: near } = useScroll({ target: ref, offset: ["start end", "start start"] })
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] })

  // Wide: one track in screen heights, the approach and then the pin (110svh of scroll).
  const z = useTransform([near, p], ([n, v]: number[]) => (v > 0 ? 1.1 * v : n - 1))
  const grow = useTransform(z, (v) => swell((v + 0.07) / 0.53, seedOf(SEED_WIDE)))
  const dots = useTransform(z, [-0.06, 0.03], [1, 0])
  const ripen = useTransform(z, [0.06, 0.4], [0, 1])
  const day = useTransform(p, [0.4, 0.47], [0, 1])
  const touch = useTransform(p, (v) => (v > 0.44 ? "auto" : "none"))
  // Phones: no pin. Timed to the scene itself, so it has finished by the time the whole scene is on screen.
  const { scrollYProgress: shown } = useScroll({ target: ref, offset: ["start end", "end end"] })
  const growFlow = useTransform(shown, (v) => swell((v - 0.42) / 0.38, seedOf(SEED_NARROW)))
  const dotsFlow = useTransform(shown, [0.42, 0.5], [1, 0])
  const ripenFlow = useTransform(shown, [0.5, 0.78], [0, 1])
  const dayFlow = useTransform(shown, [0.8, 0.9], [0, 1])
  // The swell rose behind the questions; once the field has formed, what is left of it above settles away.
  const skyFlow = useTransform(shown, [0.86, 1], [1, 0])

  useEffect(() => {
    const list = timers.current
    return () => list.forEach((t) => window.clearTimeout(t))
  }, [])

  // Once the box has arrived, the send drop turns its tail up and back, one time.
  const greet = useCallback((delay: number) => {
    const el = field.current
    if (!el || greeted.current) return
    greeted.current = true
    timers.current.push(
      window.setTimeout(() => {
        el.setAttribute("data-greet", "")
        timers.current.push(window.setTimeout(() => el.removeAttribute("data-greet"), 1200))
      }, delay)
    )
  }, [])

  // The seed pops in like a message once it is on screen, and leaves the same way when scrolled back.
  const seat = useCallback(
    (v: number) => {
      const el = ref.current
      if (!el) return
      const at = film ? 1.5 - v : 1 - v + SEED_TOP / window.innerHeight
      if (at < 0.92) el.setAttribute("data-seed", "")
      else if (at > 0.97) el.removeAttribute("data-seed")
    },
    [film]
  )
  // Phones: the words rise once the field has formed, and sink back with it.
  const lift = useCallback(
    (v: number) => {
      const el = inner.current
      if (!el || !flow) return
      if (v > 0.85) {
        if (el.hasAttribute("data-up")) return
        el.setAttribute("data-up", "")
        greet(1100)
      } else if (v < 0.5) el.removeAttribute("data-up")
    },
    [flow, greet]
  )
  useMotionValueEvent(near, "change", seat)
  useMotionValueEvent(dayFlow, "change", lift)
  useMotionValueEvent(p, "change", (v) => {
    if (film && lastP.current < 0.86 && v >= 0.86) greet(0)
    lastP.current = v
  })
  useEffect(() => {
    seat(near.get())
    lift(dayFlow.get())
  }, [seat, lift, near, dayFlow])

  // Keyboard focus landing in the pinned scene before it has opened goes to where it is open.
  const settle = () => {
    if (film && p.get() < 0.85) document.getElementById("try")?.scrollIntoView({ block: "start" })
  }
  return (
    <section ref={ref} aria-labelledby="try-title" className="ct-scene">
      <span id="try" className="ct-anchor" />
      <div className="ct-pin">
        <motion.i aria-hidden className="ct-sky" style={flow ? { opacity: skyFlow } : undefined}>
          <motion.i className="ct-drop" style={film ? { scale: grow } : flow ? { scale: growFlow } : undefined}>
            <motion.i className="ct-drop-day" style={film ? { opacity: ripen } : flow ? { opacity: ripenFlow } : undefined} />
            <motion.i className="ct-dots" style={film ? { opacity: dots } : flow ? { opacity: dotsFlow } : undefined}>
              <b />
              <b />
              <b />
            </motion.i>
          </motion.i>
        </motion.i>
        <motion.div ref={field} className="ct hh-field hh-field-mangga hh-grain" onFocusCapture={settle} style={film ? { opacity: day, pointerEvents: touch } : flow ? { opacity: dayFlow } : undefined}>
          <div ref={inner} className="ct-in" data-rise>
            <h2 id="try-title" className="hh-display ct-title">
              {["Test", "your", "hunch."].map((w, i) => (
                <span key={w} className="ct-w">
                  <Rise as="span" p={p} from={0.46 + i * 0.05} on={film} slot>
                    <span className="pf-rise" style={{ "--rd": `${i * 0.08}s` } as CSSProperties}>
                      {w}
                    </span>
                  </Rise>
                </span>
              ))}
            </h2>
            <div className="ct-ask">
              <Rise p={p} from={0.62} on={film} className="ct-box">
                <div className="pf-rise" style={{ "--rd": "0.26s" } as CSSProperties}>
                  <PromptBox serverMode={serverMode} size="lg" id="try-box" />
                </div>
              </Rise>
              <Rise p={p} from={0.67} on={film}>
                <p className="hh-line ct-line pf-rise" style={{ "--rd": "0.34s" } as CSSProperties}>
                  {`Type what you sell and get your ${run.versions.length} posts.`}
                </p>
              </Rise>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
