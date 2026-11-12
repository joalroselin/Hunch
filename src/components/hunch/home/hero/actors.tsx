"use client"

import { useEffect, useRef, useState, type CSSProperties } from "react"

import { photoUrlOf, run, winnerCode } from "../data"
import { MARK_PATH } from "../mark"

// Four post photos for the window, the winning post first.
const winner = run.versions.find((v) => v.code === winnerCode)
const rest = run.versions.filter((v) => v !== winner)
const shots = [winner, rest[1], rest[4], rest[6]].flatMap((v) => (v ? [photoUrlOf(v)] : []))

type Peek = { src: string; on: boolean } | null

// The mark as the hero's opening: the posts come out of it, then it shows their photos.
export function HeroMark() {
  const ref = useRef<HTMLDivElement>(null)
  const [peek, setPeek] = useState<Peek>(null)

  // A post the visitor points at opens in the window from the tail; leaving drains it.
  useEffect(() => {
    const hero = ref.current?.closest(".hx-hero")
    if (!hero) return
    let raf = 0
    const onPeek = (e: Event) => {
      const src = (e as CustomEvent<string | null>).detail
      cancelAnimationFrame(raf)
      if (!src) return setPeek((p) => (p ? { ...p, on: false } : p))
      setPeek((p) => (p?.src === src ? p : { src, on: false }))
      raf = requestAnimationFrame(() => {
        raf = requestAnimationFrame(() => setPeek((p) => (p?.src === src ? { src, on: true } : p)))
      })
    }
    hero.addEventListener("hx-peek", onPeek)
    return () => {
      cancelAnimationFrame(raf)
      hero.removeEventListener("hx-peek", onPeek)
    }
  }, [])

  return (
    <div ref={ref} aria-hidden className="hx-mark" data-peek={peek?.on ? "" : undefined} style={{ "--n": shots.length } as CSSProperties}>
      <svg className="hx-mark-line" viewBox="0 0 100 100">
        <path data-hx-el="mark-line" d={MARK_PATH} pathLength={1} strokeDasharray="1" />
      </svg>
      <div className="hx-mark-win">
        {shots.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src} src={src} alt="" draggable={false} className={i === 0 ? "hx-win-lead" : undefined} style={{ "--i": i } as CSSProperties} />
        ))}
        <span className="hx-mark-sun hh-grain" />
      </div>
      <div className="hx-mark-fill hh-drop hh-grain hx-hide" data-hx-el="mark-fill" />
      {peek ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={peek.src} className="hx-peek" src={peek.src} alt="" draggable={false} data-on={peek.on ? "" : undefined} />
      ) : null}
    </div>
  )
}
