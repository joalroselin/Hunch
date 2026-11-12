"use client"

import * as React from "react"

import { useReduced } from "@/components/ds/instruments"
import Link from "next/link"

import { LetterRoll } from "./letter-roll"
import "./proof/base.css"
import "./proof/closing.css"

const PULL = 360
// A fling that lands on the bottom is not a pull: wait after arriving, and count only a gesture that starts there.
const SETTLE = 700
const FRESH = 250
const KEYS = ["ArrowDown", "PageDown", "End", " "]
const TYPING = "input, textarea, select, button, a, [contenteditable]"

// Past the footer: keep scrolling at the very bottom and a field of people rises.
export function HiddenEnding() {
  const [open, setOpen] = React.useState(false)
  const reduced = useReduced()

  React.useEffect(() => {
    if (open) return
    let acc = 0
    let reset = 0
    let arrived = 0
    let fresh = false
    let lastWheel = 0
    let touchY: number | null = null
    const atBottom = () => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
    const leave = () => {
      arrived = 0
      fresh = false
      acc = 0
    }
    // True once the page has rested on the bottom long enough to read a pull.
    const settled = () => {
      if (!atBottom()) return leave(), false
      const now = performance.now()
      if (!arrived) arrived = now
      return now - arrived >= SETTLE
    }
    const bump = (d: number) => {
      acc += d
      clearTimeout(reset)
      reset = window.setTimeout(() => (acc = 0), 900)
      if (acc > PULL) setOpen(true)
    }
    const onScroll = () => void settled()
    const onWheel = (e: WheelEvent) => {
      const now = performance.now()
      const start = now - lastWheel >= FRESH
      lastWheel = now
      if (start) fresh = atBottom()
      if (e.deltaY <= 0) return void (acc = 0)
      if (settled() && fresh) bump(e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY)
    }
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? null
      fresh = atBottom()
    }
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY
      if (touchY == null || y == null) return
      const d = touchY - y
      touchY = y
      if (d > 0 && settled() && fresh) bump(d * 2)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || !KEYS.includes(e.key)) return
      if ((e.target as Element | null)?.closest?.(TYPING)) return
      if (settled()) bump(90)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("wheel", onWheel, { passive: true })
    window.addEventListener("touchstart", onTouchStart, { passive: true })
    window.addEventListener("touchmove", onTouchMove, { passive: true })
    window.addEventListener("keydown", onKey)
    return () => {
      clearTimeout(reset)
      window.removeEventListener("scroll", onScroll)
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
    <section id="hidden-ending" aria-labelledby="he-title" className="he hh-field hh-field-gumamela hh-grain">
      <PeopleField reduced={reduced} />
      <div className="he-words">
        <h2 id="he-title" className="hh-display he-title">
          Go find your buyers.
        </h2>
        <Link href="/start" className="hh-pill hh-pill-light he-top group">
          <LetterRoll text="Try it free" />
        </Link>
      </div>
    </section>
  )
}

type Note = { x: number; y: number; t: number; r: number; drift: number }

// A crowd of paper dots. Near the pointer they slowly light up gold, and now and then one of them sends a message.
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
    let px = new Float32Array(0)
    let py = new Float32Array(0)
    let pr = new Float32Array(0)
    let lit = new Float32Array(0)
    const active = new Set<number>()
    const notes: Note[] = []
    let base: HTMLCanvasElement | null = null
    const ptr = { x: -9999, y: -9999, on: false, until: 0 }
    let raf = 0
    let last = 0
    let seen = true
    let wave = 0
    let waveRow = 0
    const R = 135
    const NOTE = 1.5

    // Seeded so the crowd looks the same on every visit.
    let s = 11
    const rand = () => (s = (s * 16807) % 2147483647) / 2147483647

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
      const n = cols * rows
      px = new Float32Array(n)
      py = new Float32Array(n)
      pr = new Float32Array(n)
      lit = new Float32Array(n)
      active.clear()
      s = 11
      const ox = (w - (cols - 1) * gap) / 2
      const oy = (h - (rows - 1) * gap) / 2
      for (let k = 0; k < n; k++) {
        px[k] = ox + (k % cols) * gap + (rand() - 0.5) * 6
        py[k] = oy + Math.floor(k / cols) * gap + (rand() - 0.5) * 6
        pr[k] = 0.8 + rand() * 0.5
      }
      base = document.createElement("canvas")
      base.width = canvas.width
      base.height = canvas.height
      const b = base.getContext("2d")!
      b.scale(dpr, dpr)
      b.fillStyle = "rgba(255,252,245,0.3)"
      b.beginPath()
      for (let k = 0; k < n; k++) {
        b.moveTo(px[k] + pr[k], py[k])
        b.arc(px[k], py[k], pr[k], 0, Math.PI * 2)
      }
      b.fill()
      draw()
    }

    const sun = (x: number, y: number, r: number) => {
      const g = ctx.createLinearGradient(x - r, y - r, x + r, y + r)
      g.addColorStop(0, "#ffd75e")
      g.addColorStop(0.55, "#ff6a1f")
      g.addColorStop(1, "#e63a1c")
      return g
    }

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (base) ctx.drawImage(base, 0, 0)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.globalAlpha = 1
      for (const k of active) {
        const l = lit[k]
        const x = px[k]
        const y = py[k]
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
        ctx.arc(x, y, pr[k] + 1.5 * l, 0, Math.PI * 2)
        ctx.fill()
      }
      // A message on its way up: the drop, small, rising and fading.
      for (const m of notes) {
        const q = m.t / NOTE
        const up = 1 - Math.pow(1 - q, 3)
        const r = m.r * (0.55 + 0.45 * Math.min(1, q * 4))
        const x = m.x + m.drift * up
        const y = m.y - 10 - 22 * up
        ctx.globalAlpha = Math.min(1, q * 6) * (1 - q) ** 1.6
        ctx.fillStyle = sun(x, y, r)
        ctx.beginPath()
        if (ctx.roundRect) ctx.roundRect(x - r, y - r, 2 * r, 2 * r, [r, r, r, 0.18 * r])
        else ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
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
        let pick = -1
        let count = 0
        for (let j = j0; j <= j1; j++)
          for (let i = i0; i <= i1; i++) {
            const k = j * cols + i
            const dx = px[k] - ptr.x
            const dy = py[k] - ptr.y
            const d = Math.sqrt(dx * dx + dy * dy)
            if (d > R) continue
            const t = (1 - d / R) ** 2
            if (t > lit[k]) lit[k] += (t - lit[k]) * rise
            near.add(k)
            active.add(k)
            // Pick one of the brightly lit people at random to send the next message.
            if (lit[k] > 0.42 && rand() * ++count < 1) pick = k
          }
        if (!reduced && pick >= 0 && notes.length < 9 && rand() < dt * 2.2)
          notes.push({ x: px[pick], y: py[pick], t: 0, r: 3.6 + rand() * 1.6, drift: (rand() - 0.5) * 8 })
      }
      // The arrival: one gold pass through the crowd, from the bottom row up.
      if (wave) {
        const due = Math.min(rows, Math.floor((now - wave) / 14))
        for (; waveRow < due; waveRow++) {
          const j = rows - 1 - waveRow
          for (let i = 0; i < cols; i++) {
            const k = j * cols + i
            const v = 0.18 + rand() * 0.42
            if (v > lit[k]) lit[k] = v
            active.add(k)
          }
        }
        if (waveRow >= rows) wave = 0
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
      for (let n = notes.length - 1; n >= 0; n--) {
        notes[n].t += dt
        if (notes[n].t >= NOTE) notes.splice(n, 1)
      }
      draw()
      if (ptr.on && now > ptr.until && ptr.until > 0) ptr.on = false
      if (seen && (ptr.on || active.size || notes.length || wave)) raf = requestAnimationFrame(tick)
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

    const ro = new ResizeObserver(() => {
      const r = canvas.getBoundingClientRect()
      if (Math.abs(r.width - w) > 1 || Math.abs(r.height - h) > 1) setup()
    })
    ro.observe(canvas)
    let waved = reduced
    const io = new IntersectionObserver(
      ([e]) => {
        seen = !!e?.isIntersecting
        if (!waved && (e?.intersectionRatio ?? 0) >= 0.6) {
          waved = true
          wave = performance.now()
          waveRow = 0
        }
        if (seen) wake()
      },
      { threshold: [0, 0.6] }
    )
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
