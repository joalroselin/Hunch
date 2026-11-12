"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react"
import { motion, useScroll, useTransform } from "framer-motion"

import { LetterRoll } from "./letter-roll"
import { useReveal } from "./proof/reveal"
import { easeOut, useMoving } from "./scroll/film"
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

function subscribeMotion(cb: () => void) {
  const mq = window.matchMedia(REDUCED)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}
// The thread plays only where motion is welcome. Everywhere else it is all there.
const canPlay = () => typeof IntersectionObserver !== "undefined" && !window.matchMedia(REDUCED).matches

/** The questions a seller sends before spending, as a chat with Hunch. */
export function Faq() {
  const ref = useRef<HTMLElement>(null)
  const thread = useRef<HTMLOListElement>(null)
  const tray = useRef<HTMLDivElement>(null)
  const tops = useRef(new Map<Element, number>())
  const timers = useRef<number[]>([])
  const refocus = useRef(false)
  useReveal(ref, 10)
  // The band comes in on a slant that levels; the chat pops up from its tail corner like a message.
  const moving = useMoving()
  const pop = useRef<HTMLDivElement>(null)
  const { scrollYProgress: enter } = useScroll({ target: ref, offset: ["start end", "start 0.3"] })
  const { scrollYProgress: popped } = useScroll({ target: pop, offset: ["start end", "start 0.5"] })
  const slant = useTransform(enter, [0, 1], [4.6, 0])
  const popScale = useTransform(popped, [0, 1], [0.86, 1], { ease: easeOut })
  const popTurn = useTransform(popped, [0, 1], [-4, 0], { ease: easeOut })
  const popY = useTransform(popped, [0, 1], [70, 0], { ease: easeOut })

  const live = useSyncExternalStore(subscribeMotion, canPlay, () => false)
  const [asked, setAsked] = useState<number[]>([])
  const [phase, setPhase] = useState<Record<number, Phase>>({})
  const [busy, setBusy] = useState(true)
  const app = useRef<HTMLDivElement>(null)
  const body = useRef<HTMLDivElement>(null)

  const ask = useCallback((id: number) => {
    const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms))
    const read = 480 + Math.random() * 420
    const type = 760 + QA[id].a.length * 14 + Math.random() * 480
    setBusy(true)
    setAsked((a) => (a.includes(id) ? a : [...a, id]))
    setPhase((p) => ({ ...p, [id]: "sent" }))
    later(() => {
      setPhase((p) => ({ ...p, [id]: "typing" }))
    }, read)
    later(() => {
      setPhase((p) => ({ ...p, [id]: "done" }))
      setBusy(false)
    }, read + type)
  }, [])

  useEffect(() => {
    const list = timers.current
    return () => list.forEach((t) => window.clearTimeout(t))
  }, [])

  // The first question sends itself once the bottom of the chat is on screen.
  useEffect(() => {
    const el = tray.current
    if (!live || !el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return
        io.disconnect()
        timers.current.push(window.setTimeout(() => ask(0), 520))
      },
      { threshold: 0.6 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [live, ask])

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

  // Older messages slide up when a new one lands.
  useLayoutEffect(() => {
    const root = thread.current
    if (!root || !live) return
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
  })

  useEffect(() => {
    if (!refocus.current) return
    refocus.current = false
    tray.current?.querySelector<HTMLElement>("button, a")?.focus({ preventScroll: true })
  }, [asked.length])

  const left = QA.map((_, i) => i).filter((i) => i > 0 && !asked.includes(i))
  const finished = !live || (left.length === 0 && !busy)

  return (
    <section ref={ref} id="faq" aria-labelledby="faq-title" className="fc" data-live={live ? "" : undefined}>
      <motion.i aria-hidden className="fc-slant" style={moving ? { skewY: slant } : undefined} />
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
                <h3 className="fc-q" data-flip={ph === "wait" ? undefined : ""}>
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
        <div ref={tray} className="fc-tray" data-busy={busy ? "" : undefined}>
          {live
            ? left.map((i) => (
                <button
                  key={i}
                  type="button"
                  className="fc-chip"
                  aria-disabled={busy}
                  onClick={() => {
                    if (busy) return
                    refocus.current = true
                    ask(i)
                  }}
                >
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
    </section>
  )
}
