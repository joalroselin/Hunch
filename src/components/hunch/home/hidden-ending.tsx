"use client"

import * as React from "react"

import { useReduced } from "@/components/ds/instruments"
import Link from "next/link"

import { LetterRoll } from "./letter-roll"
import "./proof/base.css"
import "./proof/closing.css"

const PULL = 240

// Past the footer: keep scrolling at the very bottom and a field of people rises.
export function HiddenEnding() {
  const [open, setOpen] = React.useState(false)
  const reduced = useReduced()

  React.useEffect(() => {
    if (open) return
    let acc = 0
    let reset = 0
    let touchY: number | null = null
    const atBottom = () => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
    const bump = (d: number) => {
      if (!atBottom()) {
        acc = 0
        return
      }
      acc += d
      clearTimeout(reset)
      reset = window.setTimeout(() => (acc = 0), 900)
      if (acc > PULL) setOpen(true)
    }
    const onWheel = (e: WheelEvent) => e.deltaY > 0 && bump(e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY)
    const onTouchStart = (e: TouchEvent) => (touchY = e.touches[0]?.clientY ?? null)
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY
      if (touchY == null || y == null) return
      const d = touchY - y
      touchY = y
      if (d > 0) bump(d * 2)
    }
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowDown", "PageDown", "End", " "].includes(e.key)) bump(90)
    }
    window.addEventListener("wheel", onWheel, { passive: true })
    window.addEventListener("touchstart", onTouchStart, { passive: true })
    window.addEventListener("touchmove", onTouchMove, { passive: true })
    window.addEventListener("keydown", onKey)
    return () => {
      clearTimeout(reset)
      window.removeEventListener("wheel", onWheel)
      window.removeEventListener("touchstart", onTouchStart)
      window.removeEventListener("touchmove", onTouchMove)
      window.removeEventListener("keydown", onKey)
    }
  }, [open])

  React.useEffect(() => {
    if (!open) return
    const id = requestAnimationFrame(() =>
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: reduced ? "auto" : "smooth" })
    )
    return () => cancelAnimationFrame(id)
  }, [open, reduced])

  if (!open) return <div id="hidden-ending" aria-hidden className="h-0" />

  return (
    <section id="hidden-ending" aria-label="The end of the page" className="he hh-field hh-field-gumamela hh-grain">
      <PeopleField reduced={reduced} />
      <div className="he-words">
        <h2 className="hh-display he-title">Go find your buyers.</h2>
        <Link href="/start" className="hh-pill hh-pill-light he-top group">
          <LetterRoll text="Try it free" />
        </Link>
      </div>
    </section>
  )
}

// Paper dots; the ones near the pointer slowly light up gold and fade after it leaves.
function PeopleField({ reduced }: { reduced: boolean }) {
  const ref = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    let w = 0
    let h = 0
    let dpr = 1
    let gap = 20
    let cols = 0
    let rows = 0
    let lit = new Float32Array(0)
    const active = new Set<number>()
    let base: HTMLCanvasElement | null = null
    const ptr = { x: -9999, y: -9999, on: false, until: 0 }
    let raf = 0
    let last = 0
    let seen = true
    const R = 135

    const setup = () => {
      const r = canvas.getBoundingClientRect()
      w = r.width
      h = r.height
      dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      gap = w < 640 ? 17 : 21
      cols = Math.ceil(w / gap) + 1
      rows = Math.ceil(h / gap) + 1
      lit = new Float32Array(cols * rows)
      active.clear()
      base = document.createElement("canvas")
      base.width = canvas.width
      base.height = canvas.height
      const b = base.getContext("2d")!
      b.scale(dpr, dpr)
      b.fillStyle = "rgba(255,252,245,0.3)"
      b.beginPath()
      const ox = (w - (cols - 1) * gap) / 2
      const oy = (h - (rows - 1) * gap) / 2
      for (let j = 0; j < rows; j++)
        for (let i = 0; i < cols; i++) {
          const x = ox + i * gap
          const y = oy + j * gap
          b.moveTo(x + 1, y)
          b.arc(x, y, 1, 0, Math.PI * 2)
        }
      b.fill()
      draw()
    }

    const xy = (k: number) => {
      const ox = (w - (cols - 1) * gap) / 2
      const oy = (h - (rows - 1) * gap) / 2
      return [ox + (k % cols) * gap, oy + Math.floor(k / cols) * gap] as const
    }

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (base) ctx.drawImage(base, 0, 0)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      for (const k of active) {
        const l = lit[k]
        const [x, y] = xy(k)
        if (l > 0.18) {
          ctx.fillStyle = `rgba(255,194,51,${(0.26 * l).toFixed(3)})`
          ctx.beginPath()
          ctx.arc(x, y, 2.5 + 7 * l, 0, Math.PI * 2)
          ctx.fill()
        }
        const g = Math.round(252 + (206 - 252) * l)
        const b = Math.round(245 + (72 - 245) * l)
        ctx.fillStyle = `rgba(255,${g},${b},${Math.min(1, 0.3 + 1.2 * l).toFixed(3)})`
        ctx.beginPath()
        ctx.arc(x, y, 1 + 1.5 * l, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const tick = (now: number) => {
      raf = 0
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016)
      last = now
      const near = new Set<number>()
      if (ptr.on) {
        const ox = (w - (cols - 1) * gap) / 2
        const oy = (h - (rows - 1) * gap) / 2
        const i0 = Math.max(0, Math.floor((ptr.x - R - ox) / gap))
        const i1 = Math.min(cols - 1, Math.ceil((ptr.x + R - ox) / gap))
        const j0 = Math.max(0, Math.floor((ptr.y - R - oy) / gap))
        const j1 = Math.min(rows - 1, Math.ceil((ptr.y + R - oy) / gap))
        const rise = 1 - Math.exp(-dt / 0.55)
        for (let j = j0; j <= j1; j++)
          for (let i = i0; i <= i1; i++) {
            const dx = ox + i * gap - ptr.x
            const dy = oy + j * gap - ptr.y
            const d = Math.sqrt(dx * dx + dy * dy)
            if (d > R) continue
            const k = j * cols + i
            const t = (1 - d / R) ** 2
            if (t > lit[k]) lit[k] += (t - lit[k]) * rise
            near.add(k)
            active.add(k)
          }
      }
      const fall = Math.exp(-dt / 1.7)
      for (const k of active) {
        if (near.has(k)) continue
        lit[k] *= fall
        if (lit[k] < 0.01) {
          lit[k] = 0
          active.delete(k)
        }
      }
      draw()
      if (ptr.on && now > ptr.until && ptr.until > 0) ptr.on = false
      if (seen && (ptr.on || active.size)) raf = requestAnimationFrame(tick)
      else last = 0
    }
    const wake = () => {
      if (!raf && seen) raf = requestAnimationFrame(tick)
    }

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      ptr.x = e.clientX - r.left
      ptr.y = e.clientY - r.top
      ptr.on = true
      ptr.until = e.pointerType === "mouse" ? 0 : performance.now() + 1400
      wake()
    }
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType === "mouse") ptr.on = false
    }

    setup()
    // A few people light up on arrival, so the field invites a look.
    if (!reduced) {
      let s = 7
      const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647)
      for (let n = 0; n < 16; n++) {
        const k = Math.floor(rand() * lit.length)
        lit[k] = 0.55 + rand() * 0.4
        active.add(k)
      }
      wake()
    }

    const ro = new ResizeObserver(() => {
      const r = canvas.getBoundingClientRect()
      if (Math.abs(r.width - w) > 1 || Math.abs(r.height - h) > 1) setup()
    })
    ro.observe(canvas)
    const io = new IntersectionObserver(([e]) => {
      seen = !!e?.isIntersecting
      if (seen) wake()
    })
    io.observe(canvas)
    canvas.addEventListener("pointermove", onMove)
    canvas.addEventListener("pointerdown", onMove)
    canvas.addEventListener("pointerleave", onLeave)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      canvas.removeEventListener("pointermove", onMove)
      canvas.removeEventListener("pointerdown", onMove)
      canvas.removeEventListener("pointerleave", onLeave)
    }
  }, [reduced])

  return <canvas ref={ref} aria-hidden className="he-field" />
}
