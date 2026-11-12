"use client"

// Temporary preview for the appendix slides. Delete before handing over.
import { useEffect, useState } from "react"

import { MORE } from "@/components/hunch/deck/more"
import { STAGE_H, STAGE_W, type Ground } from "@/components/hunch/deck/types"

const FIELD: Partial<Record<Ground, string>> = {
  sili: "hh-field hh-field-sili hh-grain",
  dahon: "hh-field hh-field-dahon hh-grain",
  mangga: "hh-field hh-field-mangga hh-grain",
  gumamela: "hh-field hh-field-gumamela hh-grain",
}
const FLAT: Partial<Record<Ground, string>> = { cream: "#f4ecdd", sheet: "#fffcf5", ink: "#1a110b" }

export default function Preview() {
  const [i, setI] = useState(0)
  const [still, setStill] = useState(false)
  const [active, setActive] = useState(false)
  const [box, setBox] = useState({ s: 1, x: 0, y: 0 })

  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const at = MORE.findIndex((s) => s.id === q.get("s"))
    setI(Math.max(0, at))
    setStill(q.get("still") === "1" || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    const fit = () => {
      const s = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H)
      setBox({ s, x: (window.innerWidth - STAGE_W * s) / 2, y: (window.innerHeight - STAGE_H * s) / 2 })
    }
    fit()
    window.addEventListener("resize", fit)
    const t = window.setTimeout(() => setActive(true), 300)
    return () => {
      window.removeEventListener("resize", fit)
      window.clearTimeout(t)
    }
  }, [])

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setI((n) => Math.min(MORE.length - 1, n + 1))
      if (e.key === "ArrowLeft") setI((n) => Math.max(0, n - 1))
    }
    window.addEventListener("keydown", key)
    return () => window.removeEventListener("keydown", key)
  }, [])

  const slide = MORE[i]
  if (!slide) return null
  const ground = slide.ground ?? "cream"
  const Comp = slide.Component
  return (
    <div className="hunch-home" style={{ position: "fixed", inset: 0, minHeight: 0, overflow: "hidden" }}>
      <div className={FIELD[ground]} style={{ position: "absolute", inset: 0, background: FLAT[ground] }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: STAGE_W,
          height: STAGE_H,
          transformOrigin: "0 0",
          transform: `translate(${box.x}px, ${box.y}px) scale(${box.s})`,
        }}
      >
        <Comp key={slide.id} active={active} step={0} still={still} go={(id) => setI(Math.max(0, MORE.findIndex((s) => s.id === id)))} />
      </div>
    </div>
  )
}
