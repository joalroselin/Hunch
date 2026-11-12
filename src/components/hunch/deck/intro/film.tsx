"use client"

import { AnimatePresence, animate, motion, useMotionValue, useTransform, type Transition } from "framer-motion"
import { Fragment, useEffect, useRef, useState, type CSSProperties } from "react"

import { metricsByCode, versionByCode, winnerCode } from "@/components/hunch/home/data"
import { HomePost } from "@/components/hunch/home/ugc-post"

import { useStageBox } from "../stage"
import type { SlideProps } from "../types"
import "./film.css"

// Scenes: the candle, the guesses, the sellers, the test, the answer, then into the bubble and on to the landing page.
// 0 waits for the presenter's right arrow.
export const HOLD = [8000, 9000, 0, 0, 0, 10500, 6000, 1950]
// Steps 2 to 4 are one slide: the struggles, then the content stat, then the reach stat in its place.
const SCENE_OF = [0, 1, 2, 2, 2, 3, 4, 5]
const HANDOFF = SCENE_OF[SCENE_OF.length - 1]

const EASE = [0.16, 1, 0.3, 1] as const
const IN_OUT = [0.65, 0, 0.35, 1] as const
const ACCEL = [0.4, 0, 1, 1] as const
const W = 400
const H = (W * 16) / 9

const CODES = ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8"]
const WIN = CODES.includes(winnerCode) ? winnerCode : "A3"
const OPEN = WIN === "A2" ? "A1" : "A2"
// The guesses, one post at a time. The winner lands last.
const DEAL = [OPEN, ...CODES.filter((c) => c !== OPEN && c !== WIN), WIN]
const messages = metricsByCode.get(WIN)?.results ?? 0
const winName = versionByCode.get(WIN)?.audienceName ?? ""

type Spot = { cx: number; cy: number; w: number; r: number }

// Places on the 1920 x 1080 stage.
const PILE = { cx: 1400, cy: 548 }
const JIT = [
  { dx: 0, dy: 0, r: -3 },
  { dx: -34, dy: 18, r: 7 },
  { dx: 26, dy: -14, r: -8 },
  { dx: -16, dy: 26, r: 4 },
  { dx: 36, dy: -20, r: -5 },
  { dx: -28, dy: 8, r: 9 },
  { dx: 14, dy: -8, r: -6 },
  { dx: 0, dy: 0, r: 2 },
]
// The test: the 8 fanned out like a hand of cards, all one size.
const FAN = { cy: 604, w: 226, gap: 230, tilt: 2.4, drop: 5 }
// The bubble sits in front of the name, the way the logo does. The posts come out of it.
const BUB = { cx: 160, cy: 150, d: 92 }
const LEAD = { cx: 1404, cy: 548, w: 500, r: -4 }

const fanSpot = (j: number): Spot => {
  const o = j - 3.5
  return { cx: 960 + o * FAN.gap, cy: FAN.cy + o * o * FAN.drop, w: FAN.w, r: o * FAN.tilt }
}
const at = ({ cx, cy, w, r }: Spot) => ({ x: cx - W / 2, y: cy - H / 2, scale: w / W, rotate: r })

type Aim = {
  x: number | number[]
  y: number | number[]
  scale: number | number[]
  rotate: number | number[]
  opacity: number | number[]
  transition: Transition
  z: number
}

const fixed = (s: Spot, opacity: number, z: number, transition: Transition): Aim => ({ ...at(s), opacity, z, transition })

// Keyframes from one place to another; the post is hidden before it sets off.
function travel(from: Spot, to: Spot, z: number, transition: Transition): Aim {
  const a = at(from)
  const b = at(to)
  return { x: [a.x, b.x], y: [a.y, b.y], scale: [a.scale, b.scale], rotate: [a.rotate, b.rotate], opacity: [0, 1], z, transition }
}

function aimFor(code: string, scene: number, poised: boolean, dealt: number, still: boolean): Aim {
  const j = CODES.indexOf(code)
  const k = DEAL.indexOf(code)
  const jit = JIT[k] ?? { dx: 0, dy: 0, r: 0 }
  const pile: Spot = { cx: PILE.cx + jit.dx, cy: PILE.cy + jit.dy, w: 470, r: jit.r }
  const fan = fanSpot(j)
  const now: Transition = { duration: 0 }
  const fade: Transition = { duration: 0.45, ease: "linear" }

  if (scene === 0) {
    const spot: Spot = poised ? { cx: 960, cy: 540, w: 520, r: 0 } : { cx: 1404, cy: 592, w: 556, r: 4 }
    if (code === OPEN) return fixed(spot, 1, 10, still ? now : { duration: 2.1, ease: [0.5, 0, 0.12, 1] })
    return fixed({ ...spot, cx: 2300, cy: 1400, r: 24 }, 0, k, now)
  }

  if (scene === 1) {
    if (still) return fixed(pile, 1, k, fade)
    if (code === OPEN) return fixed(pile, 1, k, { duration: 1.1, ease: EASE })
    const start: Spot = { cx: 2280 + k * 10, cy: 1380, w: 470, r: 26 }
    if (k >= dealt) return fixed(start, 0, k, now)
    return travel(start, pile, k, { duration: 0.95, ease: [0.2, 0.85, 0.25, 1], opacity: { duration: 0.18, ease: "linear" } })
  }

  // The red field rises over the pile, then the pile is let go.
  if (scene === 2) return fixed(pile, 0, k, still ? now : { duration: 0, delay: 1.5 })

  if (scene === 3) {
    if (still) return fixed(fan, 1, j, fade)
    const out: Spot = { cx: BUB.cx, cy: BUB.cy, w: 16, r: j % 2 ? 18 : -18 }
    const delay = 1.0 + j * 0.08
    return travel(out, fan, j, { duration: 1.3, ease: [0.18, 0.9, 0.22, 1], delay, opacity: { duration: 0.2, delay, ease: "linear" } })
  }

  // The answer and the handoff: the winner comes forward, the rest fall away.
  if (code === WIN) return fixed(LEAD, 1, 30, still ? now : { duration: 1.35, ease: EASE })
  const fell: Spot = { ...fan, cy: fan.cy + 900, r: fan.r + (j % 2 ? 18 : -18) }
  const away = Math.abs(j - CODES.indexOf(WIN)) * 0.05
  return fixed(fell, 0, j, still ? now : { duration: 0.85, ease: [0.5, 0, 0.75, 0], delay: away, opacity: { duration: 0.3, delay: 0.45 + away } })
}

// 0 until `on`, then 1, 2 ... up to `count`, one beat every `every` ms.
function useBeats(on: boolean, count: number, every: number, first = 0) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!on) return
    let k = 0
    let t = 0
    const tick = () => {
      k += 1
      setN(k)
      if (k < count) t = window.setTimeout(tick, every)
    }
    t = window.setTimeout(tick, first)
    return () => {
      window.clearTimeout(t)
      setN(0)
    }
  }, [on, count, every, first])
  return n
}

function Count({ to, decimals = 0, delay = 0, duration = 1.6, still }: { to: number; decimals?: number; delay?: number; duration?: number; still: boolean }) {
  const value = useMotionValue(still ? to : 0)
  const text = useTransform(value, (v) => v.toFixed(decimals))
  useEffect(() => {
    if (still) {
      value.set(to)
      return
    }
    value.set(0)
    const run = animate(value, to, { duration, delay, ease: [0.2, 0.7, 0.3, 1] })
    return () => run.stop()
  }, [to, delay, duration, still, value])
  return <motion.span>{text}</motion.span>
}

// Words rise one by one, sharp from a blur.
function Rise({ text, delay = 0, gap = 0.085, still }: { text: string; delay?: number; gap?: number; still: boolean }) {
  const words = text.split(" ")
  return (
    <>
      {words.map((w, k) => (
        <Fragment key={k}>
          <motion.span
            className="ifl-w"
            initial={still ? false : { opacity: 0, y: "0.3em", filter: "blur(10px)" }}
            animate={{ opacity: 1, y: "0em", filter: "blur(0px)" }}
            transition={{ duration: 0.85, ease: EASE, delay: delay + k * gap }}
          >
            {w}
          </motion.span>
          {k < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </>
  )
}

const block = (still: boolean) => ({
  initial: { opacity: 1 },
  animate: { opacity: 1 },
  exit: { opacity: 0, y: still ? 0 : -24, transition: { duration: still ? 0.3 : 0.42, ease: ACCEL } },
})

function NameRoll({ n, still }: { n: number; still: boolean }) {
  const code = n > 0 ? DEAL[Math.min(DEAL.length, n) - 1] : undefined
  const name = code ? (versionByCode.get(code)?.audienceName ?? "") : ""
  return (
    <div className="ifl-roll">
      <AnimatePresence initial={false}>
        {code ? (
          <motion.p
            key={code}
            className="ifl-name hh-display"
            initial={still ? false : { y: "105%" }}
            animate={{ y: "0%" }}
            exit={{ y: "-105%", transition: { duration: 0.5, ease: [0.5, 0, 0.2, 1] } }}
            transition={{ duration: 0.62, ease: [0.3, 0, 0.1, 1] }}
          >
            {name}?
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function Words({ scene, beat, run, still }: { scene: number; beat: number; run: boolean; still: boolean; dealt: number }) {
  return (
    <AnimatePresence>
      {scene === 0 && run ? (
        <motion.div key="open" className="ifl-words" data-tone="ink" {...block(still)}>
          <h2 className="hh-display ifl-h-open">
            <span className="ifl-line">
              <Rise text="Everyone wants to be" delay={0.7} still={still} />
            </span>
            <span className="ifl-line">
              <Rise text="a content creator" delay={0.95} still={still} />
            </span>
            <span className="ifl-line">
              <Rise text="or an online seller now." delay={1.2} still={still} />
            </span>
          </h2>
        </motion.div>
      ) : null}
      {scene === 1 ? (
        <motion.div key="many" className="ifl-words" data-tone="ink" {...block(still)}>
          <p className="hh-display ifl-big ifl-big-many">
            <motion.span
              className="ifl-w"
              initial={still ? false : { opacity: 0, y: "0.2em", filter: "blur(14px)" }}
              animate={{ opacity: 1, y: "0em", filter: "blur(0px)" }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.7 }}
            >
              <Count to={9.5} decimals={1} delay={0.75} duration={1.7} still={still} />
            </motion.span>{" "}
            <Rise text="million" delay={0.9} still={still} />
          </p>
          <p className="hh-title ifl-sub ifl-sub-many">
            <Rise text="Filipinos sell online." delay={1.45} gap={0.07} still={still} />
          </p>
          <motion.p className="ifl-src" initial={still ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 2.2 }}>
            PSA, 2024 ICT Household Survey, preliminary
          </motion.p>
        </motion.div>
      ) : null}
      {scene === 2 ? (
        <motion.div key="reach" className="ifl-words" data-tone="sheet" {...block(still)}>
          <div className="ifl-scratch">
            <p className="hh-title ifl-scratch-lead">
              <Rise text="But many who start from scratch have" delay={0.3} gap={0.05} still={still} />
            </p>
            {[["no marketing team."], ["No ad budget."], ["No designer."], ["No idea who would consume", "what they make."]].map((lines, k) => (
              <p key={lines[0]} className="hh-display ifl-scratch-no" data-last={k === 3 ? "" : undefined}>
                {lines.map((t, n) => (
                  <span key={t} className="ifl-line">
                    <Rise text={t} delay={1 + k * 0.55 + n * 0.3} gap={0.05} still={still} />
                  </span>
                ))}
              </p>
            ))}
          </div>
          {/* Each stat waits for a press: the content stat, then the reach stat in its place. */}
          <AnimatePresence mode="wait" initial={false}>
            {beat === 1 ? (
              <motion.div key="make" exit={still ? undefined : { opacity: 0, filter: "blur(10px)", transition: { duration: 0.35 } }}>
                <p className="ifl-reach">
                  <span className="hh-title ifl-reach-line">
                    <Rise text="According to Ninja Van," delay={0.15} gap={0.04} still={still} />
                  </span>
                  <motion.span
                    className="hh-display ifl-reach-n"
                    initial={still ? false : { opacity: 0, y: "0.2em", filter: "blur(14px)" }}
                    animate={{ opacity: 1, y: "0em", filter: "blur(0px)" }}
                    transition={{ duration: 0.9, ease: EASE, delay: 0.55 }}
                  >
                    <Count to={46} delay={0.6} duration={1.4} still={still} />%
                  </motion.span>
                  <span className="hh-title ifl-reach-line">
                    <Rise text="of Filipino online sellers find it hard to make content that works." delay={1.35} gap={0.04} still={still} />
                  </span>
                </p>
                <motion.p className="ifl-src" initial={still ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.3 }}>
                  Ninja Van and Milieu Insight, “Behind the Rizz of Social Commerce,” 2024. 46% of Filipino social sellers say creating effective content is challenging. ninjavan.co/en-ph/social-commerce
                </motion.p>
              </motion.div>
            ) : beat === 2 ? (
              <motion.div key="reach" exit={still ? undefined : { opacity: 0, transition: { duration: 0.3 } }}>
                <p className="ifl-reach">
                  <span className="hh-title ifl-reach-line">
                    <Rise text="According to SocialInsider, only" delay={0.15} gap={0.04} still={still} />
                  </span>
                  <motion.span
                    className="hh-display ifl-reach-n"
                    initial={still ? false : { opacity: 0, y: "0.2em", filter: "blur(14px)" }}
                    animate={{ opacity: 1, y: "0em", filter: "blur(0px)" }}
                    transition={{ duration: 0.9, ease: EASE, delay: 0.55 }}
                  >
                    1 in <Count to={80} delay={0.6} duration={1.4} still={still} />
                  </motion.span>
                  <span className="hh-title ifl-reach-line">
                    <Rise text="followers are bound to see your Facebook post." delay={1.35} gap={0.04} still={still} />
                  </span>
                </p>
                <motion.p className="ifl-src" initial={still ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.3 }}>
                  Socialinsider, “Social Media Reach Statistics,” updated Nov 11, 2026. Average Facebook page post reach in August 2026: 1.25% of followers, from 67.6 million posts. socialinsider.io/blog/social-media-reach
                </motion.p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      ) : null}
      {scene === 3 ? (
        <motion.div key="dream" className="ifl-words" data-tone="ink" {...block(still)}>
          <h2 className="hh-title ifl-h-test ifl-h-doubt">
            <span className="ifl-line">
              <Rise text="Beginners don't know who their ideal customer is." delay={0.6} gap={0.05} still={still} />
            </span>
            <span className="ifl-line">
              <Rise text="They're not sure who would watch their content." delay={2.6} gap={0.05} still={still} />
            </span>
            <span className="ifl-line">
              <Rise text="They only have a…" delay={4.8} gap={0.09} still={still} />
            </span>
          </h2>
        </motion.div>
      ) : null}
      {scene >= 4 ? (
        <motion.div key="hunch" className="ifl-words" data-tone="ink" {...block(still)}>
          <motion.p
            className="hh-display ifl-lock"
            initial={false}
            animate={{ opacity: scene >= 5 && !still ? 0 : 1 }}
            transition={{ duration: 0.35, ease: "linear" }}
          >
            <Rise text="hunch" delay={0.55} still={still} />
          </motion.p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

function Posts({ scene, poised, dealt, days, still }: { scene: number; poised: boolean; dealt: number; days: number; still: boolean }) {
  return (
    <>
      {CODES.map((code) => {
        const v = versionByCode.get(code)
        if (!v) return null
        const { z, transition, ...target } = aimFor(code, scene, poised, dealt, still)
        return (
          <motion.div key={code} className="ifl-post" style={{ zIndex: z }} initial={false} animate={target} transition={transition}>
            <div className="ifl-drift" style={{ "--dl": `${-CODES.indexOf(code) * 1.3}s` } as CSSProperties}>
              <HomePost version={v} boosted={code === WIN} />
            </div>
          </motion.div>
        )
      })}
    </>
  )
}

type FieldKind = "gumamela" | "dahon" | "sili"

// A full-bleed color field that opens from a point (or rises from the bottom) and closes back.
function Field({ kind, scene, from, until, origin, z, still }: { kind: FieldKind; scene: number; from: number; until: number; origin: { x: number; y: number } | null; z: number; still: boolean }) {
  const state = scene < from ? "off" : scene <= until ? "on" : "covered"
  const shut = origin ? `circle(0px at ${origin.x}px ${origin.y}px)` : "ellipse(70% 0% at 50% 100%)"
  const open = origin ? `circle(3400px at ${origin.x}px ${origin.y}px)` : "ellipse(150% 165% at 50% 100%)"
  const target = still
    ? { clipPath: open, opacity: state === "on" ? 1 : 0 }
    : { clipPath: state === "off" ? shut : open, opacity: state === "covered" ? 0 : 1 }
  const transition: Transition = still
    ? { duration: 0.45, ease: "linear" }
    : state === "on"
      ? { clipPath: { duration: 1.2, ease: IN_OUT, delay: kind === "dahon" ? 0.3 : kind === "sili" ? 0.15 : 0 }, opacity: { duration: 0 } }
      : state === "off"
        ? { clipPath: { duration: 0.8, ease: IN_OUT }, opacity: { duration: 0 } }
        : { opacity: { duration: 0.7, ease: "linear" } }
  return (
    <motion.div
      aria-hidden
      className={`ifl-field hh-field hh-field-${kind} hh-grain`}
      style={{ zIndex: z }}
      initial={false}
      animate={target}
      transition={transition}
    />
  )
}

// Where the landing page draws its bubble, in screen px. Mirrors the hero's sizing in home/hero/hero.css.
function landingBubble(w: number, h: number) {
  if (w < 768) {
    const px = w / 390
    const d = 76 * px
    return { left: w / 2 - d / 2, top: 152 * px, d }
  }
  const px = Math.min(w, 1.6 * h) / 1440
  const heroH = Math.min(Math.max(h, 600), 0.92 * w)
  const d = 108 * px
  return { left: w / 2 - d / 2, top: heroH / 2 - 186 * px, d }
}

// The bubble as a clip inside a w x h box: a square with three round corners and a tight bottom left one.
function dropClip(w: number, h: number, x: number, y: number, d: number) {
  const n = (v: number) => `${v.toFixed(2)}px`
  const r = n(d / 2)
  return `inset(${n(y)} ${n(w - x - d)} ${n(h - y - d)} ${n(x)} round ${r} ${r} ${r} ${n(d * 0.09)})`
}

const TAIL = "9% 91%"
const FOLD = 1.15

export function Film({ active, step, still }: SlideProps) {
  const box = useStageBox()
  const at = Math.min(step, HOLD.length - 1)
  const scene = SCENE_OF[at]
  const beat = at === 3 ? 1 : at === 4 ? 2 : 0
  const poised = scene === 0 && !active && !still
  const run = active || still
  const dealt = useBeats(active && scene === 1 && !still, DEAL.length, 760, 380)
  const days = useBeats(active && scene === 3 && !still, 3, 820, 2800)

  // The film's frame is the whole screen, measured in stage px.
  const ox = box.x / box.s
  const oy = box.y / box.s
  const view = { left: -ox, top: -oy, width: box.w / box.s, height: box.h / box.s }
  const stage: CSSProperties = { left: ox, top: oy }

  // The handoff: the screen pushes in and closes into the bubble, where the landing page draws its own.
  const m = landingBubble(box.w, box.h)
  const L = m.left / box.s
  const T = m.top / box.s
  const D = m.d / box.s
  const R = Math.hypot(view.width / 2, view.height / 2) + 8
  const folding = scene === HANDOFF
  // The logo's bubble, large above the name, before it zooms out into the landing page's.
  const BIG = Math.min(view.width, view.height) * 0.34
  const big = { left: view.width / 2 - BIG / 2, top: view.height * 0.43 - BIG, width: BIG, height: BIG }
  const open = dropClip(view.width, view.height, view.width / 2 - R, view.height / 2 - R, 2 * R)
  const shut = dropClip(view.width, view.height, L, T, D)
  const lensRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef<HTMLDivElement>(null)

  // Web Animations, so the browser blends the two clips on its own clock.
  useEffect(() => {
    const lens = lensRef.current
    const zoom = zoomRef.current
    if (!folding || !lens || !zoom) return
    const ms = FOLD * 1000
    const runs = still
      ? [lens.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, fill: "forwards" })]
      : [
          lens.animate([{ clipPath: open }, { clipPath: shut }], { duration: ms, easing: "cubic-bezier(0.7, 0, 0.25, 1)", fill: "forwards" }),
          lens.animate([{ opacity: 1 }, { opacity: 1, offset: 0.99 }, { opacity: 0 }], { duration: ms + 60, fill: "forwards" }),
          zoom.animate([{ transform: "scale(1)" }, { transform: "scale(1.5)" }], { duration: ms, easing: "cubic-bezier(0.55, 0, 0.45, 1)", fill: "forwards" }),
        ]
    return () => runs.forEach((a) => a.cancel())
  }, [folding, still, open, shut])

  return (
    <div className="ifl" data-scene={scene}>
      <div className="ifl-view" style={view}>
        <div className="ifl-base" />
        <div ref={lensRef} className="ifl-lens">
          <div ref={zoomRef} className="ifl-zoom" style={{ transformOrigin: `${L + D / 2}px ${T + D / 2}px` }}>
            <Field kind="gumamela" scene={scene} from={2} until={3} origin={null} z={scene === 2 ? 3 : 0} still={still} />
            <Field kind="dahon" scene={scene} from={3} until={3} origin={{ x: BUB.cx + ox, y: BUB.cy + oy }} z={1} still={still} />
            <Field kind="sili" scene={scene} from={99} until={100} origin={{ x: LEAD.cx + ox, y: LEAD.cy + oy }} z={1} still={still} />
            <div className="ifl-stage ifl-stage-posts" style={stage}>
              <motion.div
                aria-hidden
                className="ifl-bubble hh-drop hh-grain"
                style={{ left: BUB.cx - BUB.d / 2, top: BUB.cy - BUB.d / 2, width: BUB.d, height: BUB.d }}
                initial={false}
                animate={scene === 3 ? (still ? { scale: 1, opacity: 1 } : { scale: [0, 1.1, 1, 0.9, 1.12, 1], opacity: 1 }) : { scale: 0.4, opacity: 0 }}
                transition={scene === 3 && !still ? { duration: 2.0, times: [0, 0.2, 0.36, 0.48, 0.64, 1], ease: "easeInOut" } : { duration: 0.4 }}
              />
              <Posts scene={scene} poised={poised} dealt={dealt} days={days} still={still} />
            </div>
            <div className="ifl-stage ifl-stage-words" style={stage}>
              <Words scene={scene} beat={beat} run={run} still={still} dealt={dealt} />
            </div>
          </div>
        </div>
        {scene >= 4 ? (
          <motion.div
            aria-hidden
            className="ifl-sun hh-drop hh-grain"
            initial={still ? false : { opacity: 0, scale: 0.5, ...big }}
            animate={folding && !still ? { opacity: 1, scale: 1, left: L, top: T, width: D, height: D } : { opacity: 1, scale: 1, ...big }}
            transition={folding && !still ? { duration: FOLD, ease: [0.7, 0, 0.25, 1] } : { duration: 0.9, ease: EASE }}
          />
        ) : null}
      </div>
    </div>
  )
}
