"use client"

import { Fragment, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { cubicBezier, motion, useScroll, useTransform, type MotionStyle, type MotionValue } from "framer-motion"

import { lowerFirst } from "@/components/hunch/screens/shared"

import { run } from "../data"
import { easeOut, useFilm, useNarrow } from "../scroll/film"
import { RiseWords, perPost, pesos } from "../story/shared"
import { HomePost } from "../ugc-post"
import { mostMessages, persona, ranked, unitWord, winner } from "./data"
import { useReveal } from "./reveal"

// Seconds a bar takes to grow by one message. Every bar climbs at the same speed, so the winner arrives last.
const PER_MESSAGE = 0.13
const START = 0.35
// The bars' curve (--climb in results.css), so each count reads what its bar shows.
const climb = cubicBezier(0.2, 0.2, 0.4, 1)

// Non-breaking spaces keep "₱99 a post" on one line on phones.
const TITLE = `${pesos(perPost)} a post found ${persona}’s buyers.`
const LINE = `See which of the ${run.versions.length} posts got people to message.`

// Counts up to `to` in step with its bar once `on` is set. The hidden final number holds the width.
function Count({ to, on }: { to: number; on: boolean }) {
  const [n, setN] = useState(to)
  useEffect(() => {
    if (!on || to < 1) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const total = to * PER_MESSAGE * 1000
    let raf = 0
    let t0 = 0
    const tick = (t: number) => {
      if (!t0) t0 = t + START * 1000
      const p = Math.min(1, Math.max(0, (t - t0) / total))
      setN(Math.max(p > 0 ? 1 : 0, Math.round(climb(p) * to)))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    setN(0)
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [on, to])
  return (
    <>
      <span aria-hidden className="pr-n-room">
        {to}
      </span>
      <span>{n}</span>
    </>
  )
}

function ScrollWord({ p, k, n, children }: { p: MotionValue<number>; k: number; n: number; children: ReactNode }) {
  const span = 0.42
  const from = n > 1 ? (k * (0.86 - span)) / (n - 1) : 0
  const opacity = useTransform(p, [from, from + span], [0, 1])
  const y = useTransform(p, [from, from + span], ["0.32em", "0em"], { ease: easeOut })
  return (
    <motion.span className="pr-w" style={{ opacity, y }}>
      {children}
    </motion.span>
  )
}

// Wide screens: the heading rises word by word with the scroll, so it is gone again before the results window on the way back up.
function ScrollHead() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start 0.86", "start 0.56"] })
  const lineOpacity = useTransform(p, [0.62, 1], [0, 1])
  const lineY = useTransform(p, [0.62, 1], [12, 0], { ease: easeOut })
  const words = TITLE.split(/\s+/)
  return (
    <header ref={ref} className="pr-head">
      <h2 id="your-people-title" className="hh-title pr-title">
        <span className="sr-only">{TITLE}</span>
        <span aria-hidden>
          {words.map((w, k) => (
            <Fragment key={k}>
              <ScrollWord p={p} k={k} n={words.length}>
                {w}
              </ScrollWord>{" "}
            </Fragment>
          ))}
        </span>
      </h2>
      <motion.p className="hh-line pr-line" style={{ opacity: lineOpacity, y: lineY }}>
        {LINE}
      </motion.p>
    </header>
  )
}

/** The test as a chart you can read from across the room: each post stands on its messages, best first. */
export function Results({ onOpen }: { onOpen: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const board = useRef<HTMLOListElement>(null)
  const base = useRef<HTMLSpanElement>(null)
  const film = useFilm()
  const narrow = useNarrow()
  // One bit per row: wide screens start together once the bars’ baseline is on screen, phones row by row.
  const [on, setOn] = useState(0)
  useReveal(ref, 14, film)
  // Leaving, the other seven step back and the winner holds, so the eye is on it when the red field rises.
  const { scrollYProgress: hand } = useScroll({ target: ref, offset: ["end 0.98", "end 0.6"] })
  const dim = useTransform(hand, [0, 1], [1, 0.28])
  const sink = useTransform(hand, [0, 1], [0, 18], { ease: easeOut })
  const lift = useTransform(hand, [0, 1], [0, -10], { ease: easeOut })
  useEffect(() => {
    const ol = board.current
    const mark = base.current
    if (!ol || !mark) return
    const rows = Array.from(ol.children)
    const all = (1 << rows.length) - 1
    if (typeof IntersectionObserver === "undefined") {
      setOn(all)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          io.unobserve(e.target)
          const i = rows.indexOf(e.target)
          setOn((m) => (i < 0 ? all : m | (1 << i)))
        }
      },
      { threshold: 0, rootMargin: narrow ? "0px 0px -12% 0px" : "0px 0px 6% 0px" }
    )
    if (narrow) rows.forEach((r) => io.observe(r))
    else io.observe(mark)
    return () => io.disconnect()
  }, [narrow])

  const words = TITLE.split(/[ \t\r\n]+/).length

  return (
    <div ref={ref} className="pr">
      {film ? (
        <ScrollHead />
      ) : (
        <header className="pr-head" data-rise>
          <RiseWords id="your-people-title" parts={[{ text: TITLE }]} className="hh-title pr-title" />
          <p className="hh-line pr-line pf-rise" style={{ "--rd": `${(words * 0.07 + 0.08).toFixed(2)}s` } as CSSProperties}>
            {LINE}
          </p>
        </header>
      )}
      <ol ref={board} className="pr-board" style={{ "--most": mostMessages } as CSSProperties}>
        {ranked.map(({ v, n }, i) => {
          const first = v.id === winner?.v.id
          const lit = (on & (1 << i)) !== 0
          return (
            <motion.li
              key={v.id}
              className="pr-col"
              data-first={first ? "" : undefined}
              data-on={lit ? "" : undefined}
              style={
                {
                  "--n": n,
                  "--i": i,
                  "--grow": `${(n * PER_MESSAGE).toFixed(2)}s`,
                  "--wait": `${START}s`,
                  ...(film ? (first ? { y: lift } : { opacity: dim, y: sink }) : null),
                } as unknown as MotionStyle
              }
            >
              <p className="pr-count">
                <b className="pr-n">{n > 0 ? <Count to={n} on={lit} /> : "No"}</b>
                <span className="pr-unit">{unitWord(n)}</span>
              </p>
              <button type="button" className="pr-post" aria-label={`Open the post for ${lowerFirst(v.audienceName)}`} onClick={() => onOpen(v.id)}>
                <HomePost version={v} boosted />
              </button>
              <span aria-hidden className={first ? "pr-bar hh-grain" : "pr-bar"} />
              <p className="pr-name">{v.audienceName}</p>
            </motion.li>
          )
        })}
      </ol>
      <span ref={base} aria-hidden className="pr-base" />
    </div>
  )
}
