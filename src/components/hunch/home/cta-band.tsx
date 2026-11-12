"use client"

import { useRef, type CSSProperties, type ReactNode } from "react"
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion"

import type { Mode } from "@/lib/hunch/types"

import { run } from "./data"
import { PromptBox } from "./prompt-box"
import { useReveal } from "./proof/reveal"
import { clamp01, ease, easeOut, useFilm, useMoving } from "./scroll/film"
import "./proof/base.css"
import "./proof/closing.css"

// The mark at rest, as a share of its full size (it grows to cover the screen).
const SEED = 0.036

// Rises into place over a stretch of the pinned scroll.
function Rise({ p, from, on, as = "div", className, children }: { p: MotionValue<number>; from: number; on: boolean; as?: "div" | "span"; className?: string; children: ReactNode }) {
  const y = useTransform(p, [from, from + 0.2], ["0.42em", "0em"], { ease: easeOut })
  const opacity = useTransform(p, [from, from + 0.12], [0, 1])
  const Tag = as === "span" ? motion.span : motion.div
  return (
    <Tag className={className} style={on ? { y, opacity } : undefined}>
      {children}
    </Tag>
  )
}

/** The closing scene: the mark rises, swells into the field, and the same try box is inside it. Phones get it without the pin. */
export function CtaBand({ serverMode }: { serverMode: Mode }) {
  const ref = useRef<HTMLElement>(null)
  useReveal(ref, 20)
  const film = useFilm()
  const moving = useMoving()
  const { scrollYProgress: near } = useScroll({ target: ref, offset: ["start end", "start start"] })
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] })
  const grow = useTransform([near, p], ([n, v]: number[]) => SEED * (0.3 + 0.7 * easeOut(n)) + (1 - SEED) * ease(clamp01(v / 0.5)))
  const ripen = useTransform(p, [0.04, 0.3], [0, 1])
  const day = useTransform(p, [0.38, 0.5], [0, 1])
  const touch = useTransform(p, (v) => (v > 0.44 ? "auto" : "none"))
  // Phones: no pin. The mark swells into the field as the scene comes up.
  const { scrollYProgress: up } = useScroll({ target: ref, offset: ["start end", "start 0.45"] })
  const growFlow = useTransform(up, (v) => 0.1 + 0.9 * ease(clamp01(v / 0.8)))
  const ripenFlow = useTransform(up, [0.25, 0.7], [0, 1])
  const dayFlow = useTransform(up, [0.72, 0.98], [0, 1])
  const flow = moving && !film
  // Keyboard focus landing in the pinned scene before it has opened goes to where it is open.
  const settle = () => {
    if (film && p.get() < 0.85) document.getElementById("try")?.scrollIntoView({ block: "start" })
  }
  return (
    <section ref={ref} aria-labelledby="try-title" className="ct-scene">
      <span id="try" className="ct-anchor" />
      <div className="ct-pin">
        <motion.i aria-hidden className="ct-drop" style={film ? { scale: grow } : flow ? { scale: growFlow } : undefined}>
          <motion.i className="ct-drop-day" style={film ? { opacity: ripen } : flow ? { opacity: ripenFlow } : undefined} />
        </motion.i>
        <motion.div className="ct hh-field hh-field-mangga hh-grain" onFocusCapture={settle} style={film ? { opacity: day, pointerEvents: touch } : flow ? { opacity: dayFlow } : undefined}>
          <div className="ct-in" data-rise>
            <h2 id="try-title" className="hh-display ct-title">
              {["Test", "your", "hunch."].map((w, i) => (
                <Rise key={w} as="span" p={p} from={0.44 + i * 0.06} on={film} className="ct-w">
                  <span className="pf-rise" style={{ "--rd": `${i * 0.08}s` } as CSSProperties}>
                    {w}
                  </span>
                </Rise>
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
