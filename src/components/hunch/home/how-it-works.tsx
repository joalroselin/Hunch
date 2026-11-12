"use client"

import * as React from "react"
import { motion, useMotionValue, useScroll, useTransform } from "framer-motion"

import { BoostMock, HOW, LEAD, MadeMock, ORDER, ResultsMock, StartMock, posts } from "./how/mocks"
import { ease, easeOut, useFilm, useMoving, useNarrow } from "./scroll/film"
import { RiseWords, useLoop } from "./story/shared"
import { HomePost } from "./ugc-post"
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
// Wide screens: after the last step the page goes through the results window. Screen heights; keep in step with how.css.
const STEPS_TRAVEL = 2.4
const EXIT = 0.7
// Share of the exit the zoom takes; the window covers the screen about halfway through the exit.
const ZOOM_SPAN = 0.72
// Past the cover the window grows a little more, so its corners are well clear.
const OVERSHOOT = 1.08
// Then the cream lifts off the results waiting underneath, whose heading starts rising right there (see how.css).
const REVEAL: [number, number] = [0.5, 0.58]

type Play = { step: number; prev: number; tick: number }
// Where a post sits in one step: center and width in stage cqw, tilt in degrees.
type Pos = { cx: number; cy: number; w: number; r: number }
// Posts render at this width and scale down to their spot, so they stay sharp.
const BASE = 30

// Offset from the stage, ignoring transforms, so the spots hold while the stage moves.
function spotOf(el: HTMLElement, stage: HTMLElement): Pos {
  let x = 0
  let y = 0
  let n: HTMLElement | null = el
  while (n && n !== stage) {
    x += n.offsetLeft
    y += n.offsetTop
    n = n.offsetParent as HTMLElement | null
  }
  const W = stage.offsetWidth / 100
  const r = parseFloat(getComputedStyle(el).getPropertyValue("--r")) || 0
  return { cx: (x + el.offsetWidth / 2) / W, cy: (y + el.offsetHeight / 2) / W, w: el.offsetWidth / W, r }
}

const Actor = React.memo(function Actor({ i, boosted }: { i: number; boosted: boolean }) {
  const v = posts[i]
  return v ? <HomePost version={v} boosted={boosted} /> : null
})

export function HowItWorks() {
  const section = React.useRef<HTMLElement>(null)
  const pin = React.useRef<HTMLDivElement>(null)
  const mark = React.useRef<HTMLSpanElement>(null)
  const play = React.useRef<HTMLDivElement>(null)
  const stage = React.useRef<HTMLDivElement>(null)
  const steps = React.useRef<HTMLOListElement>(null)
  const { on: playing, reduced } = useLoop(stage, 0.4)
  const [s, set] = React.useState<Play>({ step: 0, prev: 0, tick: 0 })
  const film = useFilm()
  const moving = useMoving()
  const narrow = useNarrow()
  const [spots, setSpots] = React.useState<(Pos | null)[][] | null>(null)
  const [ready, setReady] = React.useState(false)
  // How far through the four steps the page is, 0 to 1.
  const run = useMotionValue(0)
  const rail = useTransform(run, (v) => 0.12 + 0.88 * v)
  const light = useTransform(run, [0, 1], ["-14%", "14%"])

  // Arriving, the stage is laid down like a sheet. Leaving, the page goes through the results window into the real results.
  const { scrollYProgress: arrive } = useScroll({ target: section, offset: ["start end", "start start"] })
  const { scrollYProgress: near } = useScroll({ target: stage, offset: ["start end", "start 0.6"] })
  const { scrollYProgress: pinned } = useScroll({ target: section, offset: ["start start", "end end"] })
  const through = useTransform(pinned, [STEPS_TRAVEL / (STEPS_TRAVEL + EXIT), 1], [0, 1])
  // The window's center travels to the screen's center while it grows past every edge.
  const toCenter = useMotionValue(0)
  const fill = useMotionValue(2.2)
  const cover = React.useRef(2)
  const zoom = useTransform(through, (z) => ease(Math.min(1, z / ZOOM_SPAN)))
  const wideScale = useTransform([arrive, zoom], ([a, k]: number[]) => (0.84 + 0.16 * easeOut(a)) * (1 + (fill.get() - 1) * k))
  const wideTurn = useTransform(arrive, [0, 1], [7, 0], { ease: easeOut })
  const wideY = useTransform(arrive, [0, 1], [120, 0], { ease: easeOut })
  const wideX = useTransform(zoom, (k) => toCenter.get() * k)
  // Phones: the stage is set down as it arrives and lifted off as the section ends; its step leaves with it.
  const { scrollYProgress: away } = useScroll({ target: section, offset: ["end 0.95", "end 0.35"] })
  const smallScale = useTransform([near, away], ([n, a]: number[]) => (0.9 + 0.1 * easeOut(n)) * (1 - 0.1 * a))
  const smallTurn = useTransform([near, away], ([n, a]: number[]) => 4 * (1 - easeOut(n)) - 5 * a)
  const smallFade = useTransform(away, [0.2, 1], [1, 0.25])
  const stepsFade = useTransform(away, [0, 0.55], [1, 0])
  const stepsLift = useTransform(away, [0, 0.55], [0, -24])
  const aside = useTransform(through, [0, 0.3], [0, -80])
  const asideFade = useTransform(through, [0, 0.28], [1, 0])
  const paper = useTransform(through, REVEAL, [1, 0])
  const stageStyle = film
    ? { scale: wideScale, rotate: wideTurn, y: wideY, x: wideX, "--z": through }
    : moving
      ? { scale: smallScale, rotate: smallTurn, opacity: smallFade }
      : undefined
  const headStyle = film ? { x: aside, opacity: asideFade } : undefined
  const stepsStyle = { ...(film ? headStyle : moving && narrow ? { y: stepsLift, opacity: stepsFade } : undefined), "--hw-done": rail }

  // How far the window must grow to cover the screen, read without transforms.
  React.useEffect(() => {
    if (!film) return
    const read = () => {
      const st = stage.current
      const p = pin.current
      const win = st?.querySelector<HTMLElement>(".hw-res")
      if (!st || !p || !win) return
      const cx = st.offsetLeft + st.offsetWidth / 2
      const cy = st.offsetTop + win.offsetTop + win.offsetHeight / 2
      const W = p.clientWidth
      const H = window.innerHeight
      // 40 px past each edge clears the rounded corners.
      cover.current = Math.max((W / 2 + 40) / (win.offsetWidth / 2), (Math.max(cy, H - cy) + 40) / (win.offsetHeight / 2))
      fill.set(cover.current * OVERSHOOT)
      toCenter.set(W / 2 - cx)
    }
    read()
    const ro = new ResizeObserver(read)
    if (stage.current) ro.observe(stage.current)
    window.addEventListener("resize", read)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", read)
    }
  }, [film, toCenter, fill])

  // Once the window covers the screen, the cream behind it takes over and the stage stops painting.
  React.useEffect(() => {
    const sec = section.current
    if (!film || !sec) return
    const sync = () => sec.toggleAttribute("data-through", wideScale.get() >= cover.current * 1.02)
    sync()
    const off = wideScale.on("change", sync)
    return () => {
      off()
      sec.removeAttribute("data-through")
    }
  }, [film, wideScale])

  // Each step lays out empty slots; the posts travel between them.
  React.useEffect(() => {
    const st = stage.current
    if (!st) return
    let raf = 0
    const read = () => {
      raf = 0
      if (!st.offsetWidth) return
      setSpots(
        [0, 1, 2, 3].map((k) => {
          const scene = st.querySelector(`[data-scene="${k}"]`)
          return posts.map((_, i) => {
            const el = scene?.querySelector<HTMLElement>(`[data-slot~="${i}"]`)
            if (!el) return null
            const p = spotOf(el, st)
            // The photo is square; the posts start a little smaller inside it.
            return k === 0 ? { ...p, w: p.w * 0.56 } : p
          })
        })
      )
    }
    const soon = () => {
      if (!raf) raf = window.requestAnimationFrame(read)
    }
    read()
    const ro = new ResizeObserver(soon)
    ro.observe(st)
    document.fonts?.ready.then(soon)
    return () => {
      ro.disconnect()
      if (raf) window.cancelAnimationFrame(raf)
    }
  }, [narrow])
  React.useEffect(() => {
    if (!spots || ready) return
    const r = window.requestAnimationFrame(() => setReady(true))
    return () => window.cancelAnimationFrame(r)
  }, [spots, ready])

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
      run.set(Math.min(1, Math.max(0, at)))
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
  }, [measure, run])

  // The step list keeps its tallest height, so opening a step only moves the steps under it.
  const tall = React.useRef({ w: 0, h: 0 })
  React.useLayoutEffect(() => {
    const ol = steps.current
    if (!ol || narrow) return
    const fit = () => {
      let h = 0
      let line = 0
      for (const li of Array.from(ol.children) as HTMLElement[]) {
        const l = li.querySelector<HTMLElement>(".hw-step-l")
        h += li.offsetHeight - (l?.offsetHeight ?? 0)
        line = Math.max(line, (l?.firstElementChild as HTMLElement | null)?.scrollHeight ?? 0)
      }
      const w = ol.offsetWidth
      if (w !== tall.current.w) tall.current = { w, h: 0 }
      tall.current.h = Math.max(tall.current.h, Math.ceil(h + line))
      ol.style.setProperty("--hw-tall", `${tall.current.h}px`)
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(ol)
    document.fonts?.ready.then(fit)
    return () => ro.disconnect()
  }, [narrow, s.step])

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
    "data-scene": i,
    "data-on": i === s.step ? "" : undefined,
    "data-out": i === s.prev && i !== s.step ? "" : undefined,
  })
  const actor = (i: number) => {
    const p = spots?.[s.step]?.[i]
    // On wide screens the rest land in their rows; phone rows are too small, so they bow out.
    const hide = !p || s.step === 0 || (s.step === LAST && i !== LEAD && narrow)
    return {
      "data-hide": hide ? "" : undefined,
      "data-lead": i === LEAD ? "" : undefined,
      style: {
        "--k": ORDER.indexOf(i),
        transform: p ? `translate(${p.cx - BASE / 2}cqw, ${p.cy - (BASE * 8) / 9}cqw) rotate(${p.r}deg) scale(${p.w / BASE})` : undefined,
      } as React.CSSProperties,
    }
  }

  return (
    <section ref={section} id="how-it-works" aria-labelledby="how-it-works-title" className="hw">
      <div ref={pin} className="hw-pin">
        <motion.div className="hw-head" style={headStyle}>
          <RiseWords
            id="how-it-works-title"
            parts={[{ text: "Know who would buy", className: "block" }, { text: `your product in ${HOW.days}.`, className: "block" }]}
            className="hh-title sy-h hw-title"
          />
        </motion.div>
        <span ref={mark} className="hw-mark" />
        <div ref={play} className="hw-play">
          <motion.div
            ref={stage}
            className="hw-stage"
            data-step={s.step}
            data-back={s.step < s.prev ? "" : undefined}
            aria-hidden
            style={stageStyle as React.ComponentProps<typeof motion.div>["style"]}
          >
            <motion.i className="hw-light" style={moving ? { x: light } : undefined} />
            <i key={s.step} className="hw-sheen" />
            <div {...shot(0)}>
              <StartMock t={t(0)} />
            </div>
            <div {...shot(1)}>
              <MadeMock />
            </div>
            <div {...shot(2)}>
              <BoostMock t={t(2)} />
            </div>
            <div {...shot(3)}>
              <ResultsMock t={t(3)} />
            </div>
            <div className="hw-cast" data-ready={ready ? "" : undefined}>
              {posts.map((v, i) => (
                <span key={v.id} className="hw-actor" {...actor(i)}>
                  <Actor i={i} boosted={s.step >= 2} />
                </span>
              ))}
            </div>
          </motion.div>
          <motion.ol ref={steps} className="hw-steps" style={stepsStyle as unknown as React.ComponentProps<typeof motion.ol>["style"]}>
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
        <motion.i aria-hidden className="hw-through" style={film ? { opacity: paper } : undefined} />
      </div>
    </section>
  )
}
