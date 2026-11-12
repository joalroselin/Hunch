"use client"

import * as React from "react"
import { useEffect, useRef } from "react"

import { lowerFirst } from "@/components/hunch/screens/shared"

import { photoUrlOf, run, winnerCode } from "../data"
import { usePostSheet } from "../post-sheet"
import { clamp01 } from "../scroll/film"
import { HomePost } from "../ugc-post"

const ordered = [...run.versions].sort((a, b) => Number(a.code.slice(1)) - Number(b.code.slice(1)))
const winner = ordered.find((v) => v.code === winnerCode) ?? ordered[0]
// The post that got the most messages takes the big slot; the rest keep their order.
const versions = winner ? [winner, ...ordered.filter((v) => v !== winner)] : ordered
// Entrance only: these rush past the viewer before the 8 land.
const flybys = [3, 5, 1, 6, 2, 4].flatMap((i) => (versions[i] ? [versions[i]] : []))

// Slots (positions live in hero.css). Near posts move more with the cursor and grow more as they leave.
const SLOTS = [
  { depth: 1, dd: 9, dl: -0.4, dx: -4, dy: 6 },
  { depth: 0.8, dd: 7.4, dl: -1.2, dx: 5, dy: -7 },
  { depth: 0.7, dd: 8.6, dl: -4.1, dx: -6, dy: -5 },
  { depth: 0.85, dd: 6.8, dl: -2.6, dx: 4, dy: 8 },
  { depth: 0.9, dd: 7.9, dl: -5.3, dx: 6, dy: 4 },
  { depth: 0.5, dd: 6.4, dl: -3.2, dx: -4, dy: -6 },
  { depth: 0.55, dd: 8.2, dl: -6.1, dx: 4, dy: -5 },
  { depth: 0.75, dd: 7.1, dl: -2.2, dx: -5, dy: 5 },
]
// Reading order for keyboards: the top row, then the bottom row, left to right.
const READING = [2, 6, 7, 3, 4, 5, 8, 1]
// Landing order: far to near, the winner last.
const LANDING = SLOTS.map((s, i) => ({ n: i + 1, depth: s.depth }))
  .sort((a, b) => a.depth - b.depth)
  .map((s) => s.n)

type Exit = { x: number; y: number; grow: number; from: number }

export function PostBurst({ live, reduced }: { live: boolean; reduced: boolean }) {
  const sheet = usePostSheet()
  const ref = useRef<HTMLDivElement>(null)

  // After the entrance: posts follow the cursor by depth and fly out past the sides as the hero scrolls away.
  useEffect(() => {
    const layer = ref.current
    const hero = layer?.closest<HTMLElement>(".hx-hero")
    if (!live || reduced || !layer || !hero) return
    const slots = Array.from(layer.querySelectorAll<HTMLElement>("[data-slot]"))
    const depth = slots.map((s) => SLOTS[Number(s.dataset.slot) - 1]?.depth ?? 1)
    const column = hero.querySelector<HTMLElement>('[data-hx-el="column"]')
    const mark = hero.querySelector<HTMLElement>(".hx-mark")
    let exits: Exit[] = []
    let span = window.innerHeight
    // Cursor and scroll targets, eased each frame so nothing ever jumps.
    const target = { x: 0, y: 0, p: 0 }
    const now = { x: 0, y: 0, p: 0 }
    let frame = 0

    const measure = () => {
      const c = (mark ?? hero).getBoundingClientRect()
      const cx = c.left + c.width / 2
      const cy = c.top + c.height / 2
      const vw = window.innerWidth
      span = hero.offsetHeight || window.innerHeight
      exits = slots.map((s, i) => {
        const r = s.getBoundingClientRect()
        const d = depth[i] ?? 1
        const ox = r.left + r.width / 2 - cx
        const oy = r.top + r.height / 2 - cy
        // Phone posts are already big for the screen, so they grow less on the way out.
        const grow = (0.2 + 0.5 * d) * (vw < 768 ? 0.4 : 1)
        const pad = 40 + r.width * 0.2 + (grow * Math.max(r.width, r.height)) / 2
        const side = ox < 0 ? -1 : 1
        // Clear the nearest side; posts above the mark also rise along their line, posts below only lift a little.
        const x = side < 0 ? -(r.right + pad) : vw - r.left + pad
        const y = oy < 0 ? Math.max(-1.2, oy / Math.max(1, Math.abs(ox))) * Math.abs(x) * 0.6 : -Math.abs(x) * 0.08
        return { x, y, grow, from: 0.03 + (1 - d) * 0.14 }
      })
    }

    const paint = () => {
      frame = 0
      target.p = clamp01(window.scrollY / span)
      now.x += (target.x - now.x) * 0.08
      now.y += (target.y - now.y) * 0.08
      now.p += (target.p - now.p) * 0.22
      if (Math.abs(target.p - now.p) < 0.0005) now.p = target.p
      const p = now.p
      slots.forEach((s, i) => {
        const d = depth[i] ?? 1
        const o = exits[i] ?? { x: 0, y: 0, grow: 0, from: 0 }
        const t = clamp01((p - o.from) / 0.7)
        const e = t * t * (1.6 - 0.6 * t)
        const x = o.x * e - now.x * 9 * d
        const y = o.y * e - now.y * 7 * d
        s.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${(1 + o.grow * e).toFixed(4)})`
        s.style.visibility = t >= 1 ? "hidden" : ""
      })
      if (column) column.style.transform = p > 0 ? `translate3d(0, ${(-p * 56).toFixed(2)}px, 0)` : ""
      const moving =
        Math.abs(target.x - now.x) > 0.001 || Math.abs(target.y - now.y) > 0.001 || target.p !== now.p
      if (moving) frame = requestAnimationFrame(paint)
    }
    const kick = () => {
      if (!frame) frame = requestAnimationFrame(paint)
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return
      target.x = (e.clientX / window.innerWidth) * 2 - 1
      target.y = (e.clientY / window.innerHeight) * 2 - 1
      kick()
    }
    const onResize = () => {
      slots.forEach((s) => (s.style.transform = ""))
      measure()
      kick()
    }

    slots.forEach((s) => (s.style.transform = ""))
    measure()
    kick()
    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("scroll", kick, { passive: true })
    window.addEventListener("resize", onResize)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("scroll", kick)
      window.removeEventListener("resize", onResize)
      slots.forEach((s) => {
        s.style.transform = ""
        s.style.visibility = ""
      })
      if (column) column.style.transform = ""
    }
  }, [live, reduced])

  // The winner's clip dissolves back to its first frame before it loops, so the push-in never cuts.
  useEffect(() => {
    const v = ref.current?.querySelector<HTMLVideoElement>('[data-slot="1"] video')
    if (!live || reduced || !v) return
    const onTime = () => {
      const left = (v.duration || 0) - v.currentTime
      if (left > 0 && left < 0.9) v.dataset.seam = ""
      else if (v.currentTime < 0.6) delete v.dataset.seam
    }
    v.addEventListener("timeupdate", onTime)
    return () => {
      v.removeEventListener("timeupdate", onTime)
      delete v.dataset.seam
    }
  }, [live, reduced])

  // Pointing at a post opens the mark on its photo.
  const peek = (src: string | null) => {
    ref.current?.closest(".hx-hero")?.dispatchEvent(new CustomEvent("hx-peek", { detail: src }))
  }

  return (
    <div ref={ref} className="hx-posts" data-hx-el="posts">
      {READING.map((n) => {
        const v = versions[n - 1]
        if (!v) return null
        const slot = SLOTS[n - 1] ?? SLOTS[0]
        const src = photoUrlOf(v) ?? null
        return (
          <div
            key={v.id}
            className="hx-slot"
            data-slot={n}
            style={
              {
                "--dd": `${slot.dd}s`,
                "--dl": `${slot.dl}s`,
                "--ddx": `${slot.dx}px`,
                "--ddy": `${slot.dy}px`,
              } as React.CSSProperties
            }
          >
            <div className="hx-fly hx-hide" data-hx-fly data-order={LANDING.indexOf(n)}>
              <div className="hx-drift">
                <div className="hx-tilt">
                  <button
                    type="button"
                    className="hx-post"
                    aria-label={`Open the post for ${lowerFirst(v.audienceName)}`}
                    onClick={() => sheet.open(v.id)}
                    onPointerEnter={(e) => e.pointerType === "mouse" && peek(src)}
                    onPointerLeave={() => peek(null)}
                    onFocus={() => peek(src)}
                    onBlur={() => peek(null)}
                  >
                    <HomePost version={v} boosted={n === 1} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** Entrance only: posts that rush out of the mark and past the viewer, in front of everything. */
export function FlyBys() {
  return (
    <div aria-hidden className="hx-flybys">
      {flybys.map((v) => (
        <div key={v.id} className="hx-flyby" data-hx-flyby>
          <HomePost version={v} bare />
        </div>
      ))}
    </div>
  )
}
