"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react"
import { motion, useScroll, useTransform } from "framer-motion"

import { LetterRoll } from "./letter-roll"
import { useReveal } from "./proof/reveal"
import { easeOut, useFilm, useMoving } from "./scroll/film"
import "./proof/base.css"
import "./faq.css"


const QA: { q: string; lead: string; a: string }[] = [
  { q: "Does Hunch post or pay for me?", lead: "No.", a: "You post and promote on your own page. Hunch never logs in." },
  { q: "Do I connect my accounts?", lead: "No.", a: "Type in the numbers, or upload the results file from your ads." },
  { q: "Can the posts be in Tagalog?", lead: "Yes.", a: "Every post comes in Taglish, English and Tagalog." },
  { q: "Does it target by age or religion?", lead: "Never.", a: "Not by age, religion or health." },
]

type Phase = "wait" | "sent" | "typing" | "done"

const REDUCED = "(prefers-reduced-motion: reduce)"
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)"
// Wide screens: if nobody taps, Hunch takes the next question after this long.
const NEXT = 2400

function subscribeMotion(cb: () => void) {
  const mq = window.matchMedia(REDUCED)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}
// The thread plays only where motion is welcome. Everywhere else it is all there.
const canPlay = () => typeof IntersectionObserver !== "undefined" && !window.matchMedia(REDUCED).matches

// Answer bubbles hug their longest line: the narrowest width that keeps the same number of lines.
function hug(el: HTMLElement) {
  const room = el.closest<HTMLElement>(".fc-reply")?.clientWidth ?? 0
  if (!room || el.dataset.room === String(room)) return
  el.style.width = ""
  const h = el.offsetHeight
  let lo = 0
  // offsetWidth rounds, and a width a hair under the text's own would wrap it.
  let hi = el.offsetWidth + 2
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    el.style.width = `${mid}px`
    if (el.offsetHeight > h) lo = mid
    else hi = mid
  }
  el.style.width = `${hi}px`
  el.dataset.room = String(room)
}

/** The questions a seller sends before spending, as a chat with Hunch. */
export function Faq() {
  const ref = useRef<HTMLElement>(null)
  const thread = useRef<HTMLOListElement>(null)
  const tray = useRef<HTMLDivElement>(null)
  const app = useRef<HTMLDivElement>(null)
  const body = useRef<HTMLDivElement>(null)
  const pop = useRef<HTMLDivElement>(null)
  const tops = useRef(new Map<Element, number>())
  const timers = useRef<number[]>([])
  const refocus = useRef(false)
  // A chip that is sent flies into the thread and becomes the bubble; the chips left glide to their new places.
  const flight = useRef<{ id: number; from: DOMRect } | null>(null)
  const chipsAt = useRef(new Map<number, readonly [number, number]>())
  const flown = useRef(new Set<number>())
  const byUser = useRef(new Set<number>())
  const working = useRef(false)
  const auto = useRef(true)
  const started = useRef(false)
  const firstTimer = useRef(0)
  useReveal(ref, 10)
  // The band comes in on a slant that levels; the chat pops up from its tail corner like a message.
  const moving = useMoving()
  const film = useFilm()
  const { scrollYProgress: enter } = useScroll({ target: ref, offset: ["start end", "start 0.3"] })
  const { scrollYProgress: popped } = useScroll({ target: pop, offset: ["start end", "start 0.5"] })
  const slant = useTransform(enter, [0, 1], [4.6, 0])
  const edge = useTransform(enter, [0.2, 1], [1, 0])
  const popScale = useTransform(popped, [0, 1], [0.86, 1], { ease: easeOut })
  const popTurn = useTransform(popped, [0, 1], [-4, 0], { ease: easeOut })
  const popY = useTransform(popped, [0, 1], [70, 0], { ease: easeOut })

  const live = useSyncExternalStore(subscribeMotion, canPlay, () => false)
  const [asked, setAsked] = useState<number[]>([])
  const [phase, setPhase] = useState<Record<number, Phase>>({})
  // The first question is held for Hunch to send itself, until someone taps first.
  const [solo, setSolo] = useState(true)
  const [visible, setVisible] = useState(false)
  const [said, setSaid] = useState("")

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }, [])

  // A question is sent at once; Hunch answers them one at a time, in order.
  const ask = useCallback((id: number) => {
    setAsked((a) => (a.includes(id) ? a : [...a, id]))
    setPhase((p) => (p[id] ? p : { ...p, [id]: "sent" }))
  }, [])

  // Notes where every chip sits, so the one sent can fly and the rest can glide.
  const launch = useCallback((id: number) => {
    const box = tray.current
    if (!box) return
    chipsAt.current.clear()
    box.querySelectorAll<HTMLElement>("[data-chip]").forEach((el) => {
      const i = Number(el.dataset.chip)
      chipsAt.current.set(i, [el.offsetLeft, el.offsetTop])
      if (i === id) {
        flight.current = { id, from: el.getBoundingClientRect() }
        flown.current.add(id)
      }
    })
  }, [])

  useEffect(() => {
    const list = timers.current
    return () => {
      list.forEach((t) => window.clearTimeout(t))
      window.clearTimeout(firstTimer.current)
    }
  }, [])

  // The first question sends itself once the whole window is on screen.
  useEffect(() => {
    const el = app.current
    if (!live || !el) return
    const io = new IntersectionObserver(
      ([e]) => {
        const r = e?.intersectionRatio ?? 0
        setVisible(r >= 0.5)
        if (r < 0.9 || started.current) return
        started.current = true
        firstTimer.current = window.setTimeout(() => ask(0), 520)
      },
      { threshold: [0, 0.5, 0.9] }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [live, ask])

  // Hunch reads, types, answers. On wide screens it carries on with the next question if nobody taps.
  useEffect(() => {
    if (!live || working.current) return
    const id = asked.find((i) => phase[i] === "sent")
    if (id !== undefined) {
      working.current = true
      const read = 480 + Math.random() * 420
      const type = 760 + QA[id].a.length * 14 + Math.random() * 480
      later(() => setPhase((p) => ({ ...p, [id]: "typing" })), read)
      later(() => {
        working.current = false
        setPhase((p) => ({ ...p, [id]: "done" }))
        if (byUser.current.has(id)) setSaid(`${QA[id].lead} ${QA[id].a}`)
      }, read + type)
      return
    }
    const next = QA.findIndex((_, i) => !asked.includes(i))
    if (!auto.current || !film || !visible || !asked.length || next < 0) return
    const t = window.setTimeout(() => {
      if (!auto.current) return
      launch(next)
      ask(next)
    }, NEXT)
    return () => window.clearTimeout(t)
  }, [asked, phase, live, film, visible, later, launch, ask])

  const tap = (id: number) => {
    auto.current = false
    if (!asked.includes(0)) {
      started.current = true
      window.clearTimeout(firstTimer.current)
      setSolo(false)
    }
    byUser.current.add(id)
    refocus.current = true
    launch(id)
    ask(id)
  }

  // The window is only as tall as what has been said, and grows as messages land.
  // On wide screens the band keeps room for the whole thread, so nothing below it moves.
  useLayoutEffect(() => {
    const root = ref.current
    const win = app.current
    const inner = body.current
    const wrap = pop.current
    if (!root || !win || !inner || !wrap) return
    if (!live || typeof ResizeObserver === "undefined") {
      win.style.height = ""
      wrap.style.removeProperty("--full")
      return
    }
    const reserve = () => {
      root.setAttribute("data-measure", "")
      wrap.style.setProperty("--full", `${inner.offsetHeight}px`)
      root.removeAttribute("data-measure")
    }
    const fit = () => (win.style.height = `${inner.offsetHeight}px`)
    reserve()
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(inner)
    window.addEventListener("resize", reserve)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", reserve)
    }
  }, [live])

  // Answers hug their text, again when the window changes width or the face finishes loading.
  useEffect(() => {
    const again = (fresh?: boolean) =>
      thread.current?.querySelectorAll<HTMLElement>('.fc-pair[data-phase="done"] .fc-a').forEach((el) => {
        if (fresh) delete el.dataset.room
        hug(el)
      })
    const onResize = () => again()
    const onFonts = () => again(true)
    window.addEventListener("resize", onResize)
    document.fonts?.addEventListener("loadingdone", onFonts)
    void document.fonts?.ready.then(onFonts)
    return () => {
      window.removeEventListener("resize", onResize)
      document.fonts?.removeEventListener("loadingdone", onFonts)
    }
  }, [])

  useLayoutEffect(() => {
    const root = thread.current
    if (!root) return
    root.querySelectorAll<HTMLElement>('.fc-pair[data-phase="done"] .fc-a').forEach(hug)
    if (!live) return
    // Older messages slide up when a new one lands.
    const next = new Map<Element, number>()
    root.querySelectorAll<HTMLElement>("[data-flip]").forEach((el) => {
      const top = el.offsetTop
      const prev = tops.current.get(el)
      if (prev !== undefined && prev !== top) {
        el.animate([{ transform: `translateY(${prev - top}px)` }, { transform: "none" }], { duration: 480, easing: EASE })
      }
      next.set(el, top)
    })
    tops.current = next
    // The chips left glide to their new places.
    if (chipsAt.current.size) {
      tray.current?.querySelectorAll<HTMLElement>("[data-chip]").forEach((el) => {
        const was = chipsAt.current.get(Number(el.dataset.chip))
        if (!was) return
        const dx = was[0] - el.offsetLeft
        const dy = was[1] - el.offsetTop
        if (dx || dy) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: 480, easing: EASE })
      })
      chipsAt.current.clear()
    }
    // The chip that was sent turns ink and flies up into its place in the thread.
    const f = flight.current
    const win = app.current
    if (!f || !win) return
    flight.current = null
    const bub = root.querySelector<HTMLElement>(`[data-q="${f.id}"] .fc-bub`)
    if (!bub) return
    const row = bub.parentElement
    const to = bub.getBoundingClientRect()
    const k = win.getBoundingClientRect().width / win.offsetWidth || 1
    const from = `translate(${(f.from.right - to.right) / k}px, ${(f.from.bottom - to.bottom) / k}px) scale(${f.from.width / to.width}, ${f.from.height / to.height})`
    // The row rides above the tray while the bubble flies (the row itself may slide, so it carries the layer).
    if (row) row.style.cssText = "z-index: 3; pointer-events: none"
    bub.animate([{ transform: from }, { transform: "none" }], { duration: 560, easing: EASE })
    bub.animate([{ backgroundColor: "rgb(26 17 11 / 0.07)", color: "#1a110b" }, { backgroundColor: "#1a110b", color: "#fffcf5" }], { duration: 260, easing: "ease-out" })
    later(() => row && (row.style.cssText = ""), 720)
  })

  useEffect(() => {
    if (!refocus.current) return
    refocus.current = false
    tray.current?.querySelector<HTMLElement>("button, a")?.focus({ preventScroll: true })
  }, [asked.length])

  const left = QA.map((_, i) => i).filter((i) => !asked.includes(i) && (i > 0 || !solo))
  const busy = asked.some((i) => phase[i] !== "done")
  const finished = !live || (left.length === 0 && !busy)

  return (
    <section ref={ref} id="faq" aria-labelledby="faq-title" className="fc" data-live={live ? "" : undefined}>
      <motion.i aria-hidden className="fc-slant" style={moving ? ({ skewY: slant, "--edge": edge } as unknown as CSSProperties) : undefined} />
      <h2 id="faq-title" className="hh-title fc-title pf-rise" data-rise>
        Ask before you spend anything.
      </h2>
      <motion.div ref={pop} className="fc-pop" style={moving ? { scale: popScale, rotate: popTurn, y: popY } : undefined}>
      <div ref={app} className="fc-app pf-rise" data-rise style={{ "--rd": "0.1s" } as CSSProperties}>
        <div ref={body} className="fc-body">
        <p className="fc-head">
          <span aria-hidden className="fc-mark hh-grain" />
          Hunch
        </p>
        <ol ref={thread} className="fc-thread">
          {QA.map((item, i) => {
            const at = asked.indexOf(i)
            const ph: Phase = live ? (phase[i] ?? "wait") : "done"
            return (
              <li key={item.q} className="fc-pair" data-phase={ph} style={{ order: at < 0 ? -1 : at }}>
                <h3 className="fc-q" data-q={i} data-flew={flown.current.has(i) ? "" : undefined} data-flip={ph === "wait" ? undefined : ""}>
                  <span className="fc-bub">{item.q}</span>
                </h3>
                <div className="fc-reply" data-flip={ph === "typing" || ph === "done" ? "" : undefined}>
                  <span aria-hidden className="fc-mark hh-grain" />
                  <div className="fc-slot">
                    <p className="fc-a fc-bub">
                      <b>{item.lead}</b> {item.a}
                    </p>
                    <span aria-hidden className="fc-typing fc-bub">
                      <i />
                      <i />
                      <i />
                    </span>
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
        <div
          ref={tray}
          className="fc-tray"
          onFocusCapture={() => (auto.current = false)}
        >
          {live
            ? left.map((i) => (
                <button key={i} type="button" className="fc-chip" data-chip={i} onClick={() => tap(i)}>
                  {QA[i].q}
                </button>
              ))
            : null}
          {finished ? (
            <a href="#try" className="hh-pill fc-try group">
              <LetterRoll text="Try it free" />
            </a>
          ) : null}
        </div>
        </div>
      </div>
      </motion.div>
      <p role="status" className="sr-only">
        {said}
      </p>
    </section>
  )
}
