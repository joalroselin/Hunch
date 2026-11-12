"use client"

import { HANDOFF_KEY } from "@/components/hunch/home/hero/intro"
import { AnimatePresence, MotionConfig, motion, useIsPresent } from "framer-motion"
import { useRouter } from "next/navigation"
import { PrefetchKind } from "next/dist/client/components/router-reducer/router-reducer-types"
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react"
import { flushSync } from "react-dom"

import { useReduced } from "@/components/ds/instruments"
import { photoUrls } from "@/components/hunch/home/data"
import { useLoadedPhotos } from "@/components/hunch/post/sample-photos"
import { cn } from "@/lib/utils"

import { INTRO } from "./intro"
import { MORE } from "./more"
import { StageContext, fitStage, type StageBox } from "./stage"
import type { Ground, Slide, SlideProps } from "./types"
import "./deck.css"

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect

// Stands in at #more until the appendix has an index of its own.
function Waiting() {
  return <h2 className="hh-display dk-waiting">Questions</h2>
}
const FALLBACK: Slide = { id: "more", title: "Questions", Component: Waiting }

const APPENDIX = MORE.some((s) => s.id === "more") ? MORE : [FALLBACK, ...MORE]
const SLIDES: Slide[] = [...INTRO, ...APPENDIX]
const MORE_AT = INTRO.length
const LAST = SLIDES.length - 1

const stepsOf = (s: Slide) => Math.max(1, s.steps ?? 1)
const groupOf = (i: number): [number, number] => (i < MORE_AT ? [0, MORE_AT - 1] : [MORE_AT, LAST])
const indexOf = (id: string) => SLIDES.findIndex((s) => s.id === id)

type Pos = { i: number; step: number }

// "#market" or "#intro/3" (steps count from 1 in the hash).
function parseHash(hash: string): Pos | null {
  const [id = "", n] = decodeURIComponent(hash.replace(/^#/, "")).split("/")
  const i = indexOf(id)
  const slide = SLIDES[i]
  if (!slide) return null
  const step = Math.min(stepsOf(slide) - 1, Math.max(0, (parseInt(n ?? "1", 10) || 1) - 1))
  return { i, step }
}
const hashOf = ({ i, step }: Pos) => `#${SLIDES[i]?.id ?? ""}${step ? `/${step + 1}` : ""}`

const FIELD: Partial<Record<Ground, string>> = {
  sili: "hh-field hh-field-sili hh-grain",
  dahon: "hh-field hh-field-dahon hh-grain",
  mangga: "hh-field hh-field-mangga hh-grain",
  gumamela: "hh-field hh-field-gumamela hh-grain",
}

function GroundLayer({ ground }: { ground: Ground }) {
  return <div aria-hidden className={cn("dk-ground", FIELD[ground])} data-ground={ground} />
}

const EASE = [0.16, 1, 0.3, 1] as const
const noop = () => {}

function SlideLayer({ slide, step, live, still, go, box }: { slide: Slide; step: number; live: boolean; still: boolean; go: (id: string) => void; box: StageBox }) {
  const present = useIsPresent()
  const ground = slide.ground ?? "cream"
  const Component = slide.Component
  const props: SlideProps = { active: live && present, step, still, go }
  return (
    <motion.section
      className="dk-slide"
      data-ground={ground}
      aria-roledescription="slide"
      aria-label={slide.title}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: still ? 0.25 : 0.55, ease: "linear" }}
    >
      <GroundLayer ground={ground} />
      <div className="dk-stage" style={{ transform: `translate(${box.x}px, ${box.y}px) scale(${box.s})` }}>
        <motion.div
          className="dk-frame"
          initial={{ y: still ? 0 : 28 }}
          animate={{ y: 0 }}
          exit={{ y: still ? 0 : -18 }}
          transition={{ duration: still ? 0 : 0.8, ease: EASE }}
        >
          <Component {...props} />
        </motion.div>
      </div>
    </motion.section>
  )
}

// Every slide and build step as a finished page, for printing or saving as PDF.
function PrintDeck() {
  const ref = useRef<HTMLDivElement>(null)
  useIsoLayoutEffect(() => {
    const fit = () => ref.current?.style.setProperty("--fit", String(Math.min(1, window.innerWidth / 1920)))
    fit()
    window.addEventListener("resize", fit)
    return () => window.removeEventListener("resize", fit)
  }, [])
  const pages = SLIDES.flatMap((slide) =>
    Array.from({ length: slide.then ? Math.max(1, stepsOf(slide) - 1) : stepsOf(slide) }, (_, step) => ({ slide, step }))
  )
  return (
    <div ref={ref} className="hunch-home dk-print">
      {pages.map(({ slide, step }) => {
        const ground = slide.ground ?? "cream"
        const Component = slide.Component
        return (
          <section key={`${slide.id}/${step}`} className="dk-page" data-ground={ground} aria-label={slide.title}>
            <GroundLayer ground={ground} />
            <div className="dk-stage">
              <Component active step={step} still go={noop} />
            </div>
          </section>
        )
      })}
    </div>
  )
}

export function Deck() {
  const router = useRouter()
  const reduced = useReduced()
  const rootRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<Pos | null>(null)
  const [started, setStarted] = useState(false)
  const [paused, setPaused] = useState(false)
  const [print, setPrint] = useState(false)
  const [box, setBox] = useState<StageBox>(() => fitStage(1920, 1080))
  const leaving = useRef(false)
  const push = useRef(false)
  const live = useRef({ pos, started, paused })
  live.current = { pos, started, paused }

  useLoadedPhotos(photoUrls)

  // Where to start: the hash, else the first slide.
  useIsoLayoutEffect(() => {
    if (new URLSearchParams(window.location.search).has("print")) setPrint(true)
    setPos(parseHash(window.location.hash) ?? { i: 0, step: 0 })
    const fit = () => setBox(fitStage(window.innerWidth, window.innerHeight))
    fit()
    window.addEventListener("resize", fit)
    return () => window.removeEventListener("resize", fit)
  }, [])

  // The hash follows the slide. Opening a topic from the index adds a history entry, so Back returns to the index.
  useEffect(() => {
    if (!pos || leaving.current) return
    const want = hashOf(pos)
    if (window.location.hash === want) return
    const url = `${window.location.pathname}${window.location.search}${want}`
    // Null state lets the Next router pick up the new URL, so it never puts back an old one.
    if (push.current) window.history.pushState(null, "", url)
    else window.history.replaceState(null, "", url)
    push.current = false
  }, [pos])

  useEffect(() => {
    const follow = () => {
      const p = parseHash(window.location.hash)
      if (p) setPos(p)
    }
    // Back from the landing page can restore this page from the cache, mid handoff.
    const shown = (e: PageTransitionEvent) => {
      if (!e.persisted) return
      leaving.current = false
      setStarted(false)
      follow()
    }
    window.addEventListener("popstate", follow)
    window.addEventListener("hashchange", follow)
    window.addEventListener("pageshow", shown)
    return () => {
      window.removeEventListener("popstate", follow)
      window.removeEventListener("hashchange", follow)
      window.removeEventListener("pageshow", shown)
    }
  }, [])

  // Print from the browser menu prints every slide.
  useEffect(() => {
    const before = () => flushSync(() => setPrint(true))
    const after = () => {
      if (!new URLSearchParams(window.location.search).has("print")) setPrint(false)
    }
    window.addEventListener("beforeprint", before)
    window.addEventListener("afterprint", after)
    return () => {
      window.removeEventListener("beforeprint", before)
      window.removeEventListener("afterprint", after)
    }
  }, [])

  // Warm the clips and the landing page so the film and the handoff never wait.
  useEffect(() => {
    router.prefetch("/", { kind: PrefetchKind.FULL })
    const t = window.setTimeout(() => {
      for (const src of photoUrls) if (src) fetch(src.replace(/\.jpg$/, ".mp4")).catch(() => {})
    }, 400)
    return () => window.clearTimeout(t)
  }, [router])

  const handoff = useCallback(
    (path: string) => {
      if (leaving.current) return
      leaving.current = true
      // Back from the landing page lands on the appendix.
      window.history.replaceState(null, "", `${window.location.pathname}#more`)
      try {
        window.sessionStorage.setItem(HANDOFF_KEY, String(Date.now()))
      } catch {}
      router.push(path)
    },
    [router]
  )

  const next = useCallback(
    (auto = false) => {
      const { pos: p, started: on, paused: held } = live.current
      if (!p || leaving.current) return
      const slide = SLIDES[p.i]
      if (!slide) return
      // The first press starts the film.
      if (slide.hold && !on) return setStarted(true)
      if (p.step < stepsOf(slide) - 1) return setPos({ i: p.i, step: p.step + 1 })
      if (slide.then) {
        // The last step is the handoff itself; let it finish unless the film is held.
        if (!auto && on && !held) return
        return handoff(slide.then)
      }
      const [, end] = groupOf(p.i)
      if (p.i < end) setPos({ i: p.i + 1, step: 0 })
    },
    [handoff]
  )

  const prev = useCallback(() => {
    const p = live.current.pos
    if (!p || leaving.current) return
    if (p.step > 0) return setPos({ i: p.i, step: p.step - 1 })
    const [start] = groupOf(p.i)
    const before = SLIDES[p.i - 1]
    if (p.i > start && before) setPos({ i: p.i - 1, step: stepsOf(before) - 1 })
  }, [])

  const go = useCallback((id: string) => {
    const i = indexOf(id)
    const p = live.current.pos
    if (i < 0 || leaving.current) return
    if (p && SLIDES[p.i]?.id === "more" && id !== "more") push.current = true
    setPos({ i, step: 0 })
  }, [])

  const restart = useCallback(() => {
    if (leaving.current) return
    setStarted(false)
    setPaused(false)
    setPos({ i: 0, step: 0 })
  }, [])

  // The film moves on by itself; any key or click still steps it.
  useEffect(() => {
    if (!pos || print) return
    const ms = SLIDES[pos.i]?.hold?.[pos.step]
    if (!ms || !started || paused) return
    const t = window.setTimeout(() => next(true), ms)
    return () => window.clearTimeout(t)
  }, [pos, started, paused, print, next])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return
      const t = e.target instanceof Element ? e.target : null
      if (t?.closest("input, textarea, select, [contenteditable='true']")) return
      if ((e.key === "Enter" || e.key === " ") && t?.closest("a, button")) return
      const act = (fn: () => void) => {
        e.preventDefault()
        fn()
      }
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
        case "PageDown":
        case "Enter":
        case "n":
        case "N":
          return act(() => next())
        case " ":
          return act(() => (e.shiftKey ? prev() : next()))
        case "ArrowLeft":
        case "ArrowUp":
        case "PageUp":
        case "Backspace":
          return act(prev)
        case "Home":
        case "r":
        case "R":
          return act(restart)
        case "End":
        case "Escape":
        case "i":
        case "I":
        case "m":
        case "M":
          return act(() => go("more"))
        case "k":
        case "K":
        case "p":
        case "P":
          return act(() => setPaused((v) => !v))
        case "f":
        case "F":
          return act(() => {
            if (document.fullscreenElement) document.exitFullscreen?.().catch(noop)
            else document.documentElement.requestFullscreen?.().catch(noop)
          })
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [next, prev, go, restart])

  // The pointer hides while the deck is left alone.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let t = 0
    const wake = () => {
      root.removeAttribute("data-idle")
      window.clearTimeout(t)
      t = window.setTimeout(() => root.setAttribute("data-idle", ""), 1800)
    }
    wake()
    window.addEventListener("pointermove", wake, { passive: true })
    return () => {
      window.clearTimeout(t)
      window.removeEventListener("pointermove", wake)
    }
  }, [print])

  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 || e.defaultPrevented) return
    if (e.target instanceof Element && e.target.closest("a, button, input, textarea, select, label, [data-deck-stay]")) return
    next()
  }

  if (print) return <PrintDeck />

  const slide = pos ? SLIDES[pos.i] : undefined
  return (
    <StageContext.Provider value={box}>
      <MotionConfig reducedMotion="user">
        <div ref={rootRef} className="hunch-home dk-root" onClick={onClick}>
          <AnimatePresence initial={false}>
            {slide && pos ? (
              <SlideLayer
                key={slide.id}
                slide={slide}
                step={pos.step}
                live={slide.hold ? started : true}
                still={reduced}
                go={go}
                box={box}
              />
            ) : null}
          </AnimatePresence>
        </div>
      </MotionConfig>
    </StageContext.Provider>
  )
}
