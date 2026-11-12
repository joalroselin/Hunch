"use client"

import { useEffect, useRef, useState, type CSSProperties } from "react"

import { lowerFirst } from "@/components/hunch/screens/shared"

import { run } from "../data"
import { perPost, pesos } from "../story/shared"
import { HomePost } from "../ugc-post"
import { mostMessages, persona, ranked, unitWord, winner } from "./data"
import { useReveal } from "./reveal"

// Seconds a bar takes to grow by one message. Every bar climbs at the same speed, so the winner arrives last.
const PER_MESSAGE = 0.13
const START = 0.35

// Counts up to `to` in step with its bar once `on` is set.
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
      setN(Math.max(p > 0 ? 1 : 0, Math.round(p * to)))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    setN(0)
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [on, to])
  return <>{n}</>
}

/** The test as a chart you can read from across the room: each post stands on its messages, best first. */
export function Results({ onOpen }: { onOpen: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const board = useRef<HTMLOListElement>(null)
  const [on, setOn] = useState(false)
  useReveal(ref)
  useEffect(() => {
    const el = board.current
    if (!el) return
    if (typeof IntersectionObserver === "undefined") {
      setOn(true)
      return
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return
        setOn(true)
        io.disconnect()
      },
      { threshold: 0, rootMargin: "0px 0px -30% 0px" }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} className="pr">
      <header className="pr-head" data-rise>
        <h2 id="your-people-title" className="hh-title pr-title">
          {`${pesos(perPost)} a post found ${persona}’s buyers.`}
        </h2>
        <p className="hh-line pr-line">{`See which of the ${run.versions.length} posts got people to message.`}</p>
      </header>
      <ol ref={board} className="pr-board" data-on={on ? "" : undefined} style={{ "--most": mostMessages } as CSSProperties}>
        {ranked.map(({ v, n }, i) => {
          const first = v.id === winner?.v.id
          return (
            <li
              key={v.id}
              className="pr-col"
              data-first={first ? "" : undefined}
              style={{ "--n": n, "--i": i, "--grow": `${(n * PER_MESSAGE).toFixed(2)}s`, "--wait": `${START}s` } as CSSProperties}
            >
              <p className="pr-count">
                <b className="pr-n">{n > 0 ? <Count to={n} on={on} /> : "No"}</b>
                <span className="pr-unit">{unitWord(n)}</span>
              </p>
              <button type="button" className="pr-post" aria-label={`Open the post for ${lowerFirst(v.audienceName)}`} onClick={() => onOpen(v.id)}>
                <HomePost version={v} boosted={first} />
              </button>
              <span aria-hidden className={first ? "pr-bar hh-grain" : "pr-bar"} />
              <p className="pr-name">{v.audienceName}</p>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
