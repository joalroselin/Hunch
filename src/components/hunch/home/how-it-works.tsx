"use client"

import * as React from "react"
import { motion, useMotionValue, useScroll, useTransform } from "framer-motion"

import { HOW, PostsMock, ResultsMock, StartMock } from "./how/mocks"
import { ease, easeOut, useFilm, useMoving } from "./scroll/film"
import { RiseWords, useLoop } from "./story/shared"
import "./how/how.css"

const STEPS = [
  { title: "Type in your product.", line: "Name, photo, price. Done in a minute." },
  { title: `Hunch makes ${HOW.posts} personalized posts.`, line: "One for each kind of buyer." },
  { title: `Reach new people for ${HOW.perPost} a post.`, line: `Each post runs for ${HOW.days}.` },
  { title: "See who reacts.", line: "Likes, comments, shares and messages, all counted." },
]
const LAST = STEPS.length - 1
// The step clock stops once every mock has finished playing.
const CLOCK_END = 60
const DONE = 1e9
// Wide screens: after the last step the page zooms into the results window. Screen heights; keep in step with how.css.
const STEPS_TRAVEL = 2.4
const EXIT = 0.7
const ZOOM = 3.3

type Play = { step: number; prev: number; tick: number }

export function HowItWorks() {
  const section = React.useRef<HTMLElement>(null)
  const pin = React.useRef<HTMLDivElement>(null)
  const mark = React.useRef<HTMLSpanElement>(null)
  const play = React.useRef<HTMLDivElement>(null)
  const stage = React.useRef<HTMLDivElement>(null)
  const { on: playing, reduced } = useLoop(stage, 0.4)
  const [s, set] = React.useState<Play>({ step: 0, prev: 0, tick: 0 })
  const film = useFilm()
  const moving = useMoving()

  // Arriving, the stage is laid down like a sheet. Leaving, the page goes through the results window into the real results.
  const { scrollYProgress: arrive } = useScroll({ target: section, offset: ["start end", "start start"] })
  const { scrollYProgress: near } = useScroll({ target: stage, offset: ["start end", "start 0.6"] })
  const { scrollYProgress: pinned } = useScroll({ target: section, offset: ["start start", "end end"] })
  const through = useTransform(pinned, [STEPS_TRAVEL / (STEPS_TRAVEL + EXIT), 1], [0, 1])
  const toCenter = useMotionValue(0)
  const wideScale = useTransform([arrive, through], ([a, z]: number[]) => (0.84 + 0.16 * easeOut(a)) * (1 + (ZOOM - 1) * ease(z)))
  const wideTurn = useTransform(arrive, [0, 1], [7, 0], { ease: easeOut })
  const wideY = useTransform(arrive, [0, 1], [120, 0], { ease: easeOut })
  const wideX = useTransform(through, (z) => toCenter.get() * ease(z))
  // Phones: the stage is set down as it arrives and lifted off as the section ends.
  const { scrollYProgress: away } = useScroll({ target: section, offset: ["end 0.95", "end 0.35"] })
  const smallScale = useTransform([near, away], ([n, a]: number[]) => (0.9 + 0.1 * easeOut(n)) * (1 - 0.1 * a))
  const smallTurn = useTransform([near, away], ([n, a]: number[]) => 4 * (1 - easeOut(n)) - 5 * a)
  const smallFade = useTransform(away, [0.2, 1], [1, 0.25])
  const aside = useTransform(through, [0, 0.3], [0, -80])
  const asideFade = useTransform(through, [0, 0.28], [1, 0])
  const cream = useTransform(through, [0.34, 0.66], [0, 1])
  const stageStyle = film
    ? { scale: wideScale, rotate: wideTurn, y: wideY, x: wideX }
    : moving
      ? { scale: smallScale, rotate: smallTurn, opacity: smallFade }
      : undefined
  const asideStyle = film ? { x: aside, opacity: asideFade } : undefined

  React.useEffect(() => {
    if (!film) return
    const read = () => {
      const st = stage.current
      const p = pin.current
      if (st && p) toCenter.set(p.clientWidth / 2 - (st.offsetLeft + st.offsetWidth / 2))
    }
    read()
    window.addEventListener("resize", read)
    return () => window.removeEventListener("resize", read)
  }, [film, toCenter])

  // Where the pinned part starts and how far it travels, in page pixels.
  const measure = React.useCallback(() => {
    const sec = section.current
    const p = pin.current
    const m = mark.current
    const pl = play.current
    if (!sec || !p || !m || !pl) return null
    if (getComputedStyle(p).position === "sticky") {
      const r = sec.getBoundingClientRect()
      const exit = parseFloat(getComputedStyle(sec).getPropertyValue("--exit")) || 0
      return { start: r.top + window.scrollY, travel: r.height - p.offsetHeight - (exit / 100) * window.innerHeight }
    }
    const top = m.getBoundingClientRect().top
    const stick = parseFloat(getComputedStyle(pl).top) || 0
    return { start: top + window.scrollY - stick, travel: p.getBoundingClientRect().bottom - top - pl.offsetHeight }
  }, [])

  // The page's scroll picks the step.
  React.useEffect(() => {
    let raf = 0
    const read = () => {
      raf = 0
      const m = measure()
      if (!m || m.travel <= 0) return
      const at = (window.scrollY - m.start) / m.travel
      const step = Math.min(LAST, Math.max(0, Math.floor(at * STEPS.length)))
      set((cur) => (cur.step === step ? cur : { step, prev: cur.step, tick: 0 }))
    }
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(read)
    }
    read()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (raf) window.cancelAnimationFrame(raf)
    }
  }, [measure])

  // One clock per step, in tenths of a second.
  const ticking = playing && s.tick < CLOCK_END
  React.useEffect(() => {
    if (!ticking) return
    const t = window.setInterval(() => set((cur) => ({ ...cur, tick: cur.tick + 1 })), 100)
    return () => window.clearInterval(t)
  }, [ticking])

  const go = (i: number) => {
    const m = measure()
    if (!m) return
    window.scrollTo({ top: m.start + (m.travel * (i + 0.35)) / STEPS.length, behavior: reduced ? "auto" : "smooth" })
  }

  const t = (i: number) => (reduced || i !== s.step ? DONE : s.tick * 100)
  const shot = (i: number) => ({
    className: "hw-shot",
    "data-on": i === s.step ? "" : undefined,
    "data-out": i === s.prev && i !== s.step ? "" : undefined,
  })

  return (
    <section ref={section} id="how-it-works" aria-labelledby="how-it-works-title" className="hw">
      <div ref={pin} className="hw-pin">
        <motion.div className="hw-head" style={asideStyle}>
          <RiseWords
            id="how-it-works-title"
            parts={[{ text: "Know who would buy", className: "block" }, { text: `your product in ${HOW.days}.`, className: "block" }]}
            className="hh-title sy-h hw-title"
          />
        </motion.div>
        <span ref={mark} className="hw-mark" />
        <div ref={play} className="hw-play">
          <motion.div ref={stage} className="hw-stage" data-step={s.step} aria-hidden style={stageStyle}>
            <div {...shot(0)}>
              <StartMock t={t(0)} />
            </div>
            <div {...shot(1)}>
              <PostsMock t={t(1)} />
            </div>
            <div {...shot(2)}>
              <PostsMock t={t(2)} boost />
            </div>
            <div {...shot(3)}>
              <ResultsMock t={t(3)} />
            </div>
            <i key={s.step} className="hw-wash" />
          </motion.div>
          <motion.ol className="hw-steps" style={{ ...asideStyle, "--hw-done": (s.step + 1) / STEPS.length } as React.CSSProperties}>
            {STEPS.map((step, i) => (
              <li key={step.title} data-on={i === s.step ? "" : undefined}>
                <button type="button" className="hw-step" aria-current={i === s.step ? "step" : undefined} onClick={() => go(i)}>
                  <span className="hw-step-t">
                    <span>{step.title}</span>
                  </span>
                  <span className="hw-step-l">
                    <span className="hh-line">{step.line}</span>
                  </span>
                </button>
              </li>
            ))}
          </motion.ol>
        </div>
        <motion.i aria-hidden className="hw-through" style={film ? { opacity: cream } : undefined} />
      </div>
    </section>
  )
}
