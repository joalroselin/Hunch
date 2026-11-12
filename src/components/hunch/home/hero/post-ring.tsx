"use client"

import * as React from "react"
import { useEffect, useRef } from "react"

import { lowerFirst } from "@/components/hunch/screens/shared"

import { run, winnerCode } from "../data"
import { usePostSheet } from "../post-sheet"
import { HomePost } from "../ugc-post"

const ordered = [...run.versions].sort((a, b) => Number(a.code.slice(1)) - Number(b.code.slice(1)))
const winner = ordered.find((v) => v.code === winnerCode) ?? ordered[0]
// The post that got the most messages takes the big slot; the rest keep their order.
const versions = winner ? [winner, ...ordered.filter((v) => v !== winner)] : ordered
// Entrance only: these rush past the viewer before the 8 land.
const flybys = [3, 5, 1, 6, 2, 4].flatMap((i) => (versions[i] ? [versions[i]] : []))

// Slots (positions live in hero.css). Near posts move more with the cursor.
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

export function PostBurst({ live, reduced }: { live: boolean; reduced: boolean }) {
  const sheet = usePostSheet()
  const ref = useRef<HTMLDivElement>(null)

  // After the entrance: posts follow the cursor by depth and fly outward as the hero scrolls away.
  useEffect(() => {
    const layer = ref.current
    const hero = layer?.closest<HTMLElement>(".hx-hero")
    if (!live || reduced || !layer || !hero) return
    const slots = Array.from(layer.querySelectorAll<HTMLElement>("[data-slot]"))
    const depth = slots.map((s) => SLOTS[Number(s.dataset.slot) - 1]?.depth ?? 1)
    const column = hero.querySelector<HTMLElement>('[data-hx-el="column"]')
    const mark = hero.querySelector<HTMLElement>(".hx-mark")
    let offsets: { x: number; y: number }[] = []
    // Cursor and scroll targets, eased each frame so nothing ever jumps.
    const target = { x: 0, y: 0, p: 0 }
    const now = { x: 0, y: 0, p: 0 }
    let frame = 0

    const measure = () => {
      const c = (mark ?? hero).getBoundingClientRect()
      const cx = c.left + c.width / 2
      const cy = c.top + c.height / 2
      offsets = slots.map((s) => {
        const r = s.getBoundingClientRect()
        return { x: r.left + r.width / 2 - cx, y: r.top + r.height / 2 - cy }
      })
    }

    const scrolled = () => {
      const h = hero.offsetHeight || window.innerHeight
      return Math.min(1, Math.max(0, window.scrollY / (h * 0.75)))
    }

    const paint = () => {
      frame = 0
      target.p = scrolled()
      now.x += (target.x - now.x) * 0.08
      now.y += (target.y - now.y) * 0.08
      now.p += (target.p - now.p) * 0.22
      if (Math.abs(target.p - now.p) < 0.0005) now.p = target.p
      const p = now.p
      slots.forEach((s, i) => {
        const d = depth[i] ?? 1
        const o = offsets[i] ?? { x: 0, y: 0 }
        const x = o.x * p * 0.9 - now.x * 9 * d
        const y = o.y * p * 0.9 - now.y * 7 * d
        s.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${(1 + p * 0.22).toFixed(4)})`
        s.style.opacity = p > 0 ? String(Math.max(0, 1 - p * 1.15)) : ""
      })
      if (column) column.style.transform = p > 0 ? `translate3d(0, ${(-p * 48).toFixed(2)}px, 0)` : ""
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
        s.style.opacity = ""
      })
      if (column) column.style.transform = ""
    }
  }, [live, reduced])

  return (
    <div ref={ref} className="hx-posts" data-hx-el="posts">
      {versions.map((v, i) => {
        const n = i + 1
        const slot = SLOTS[i] ?? SLOTS[0]
        const first = i === 0
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
            <div className="hx-fly hx-hide" data-hx-fly>
              <div className="hx-drift">
                <div className="hx-tilt">
                  <button
                    type="button"
                    className="hx-post"
                    aria-label={`Open the post for ${lowerFirst(v.audienceName)}`}
                    onClick={() => sheet.open(v.id)}
                  >
                    <HomePost version={v} boosted={first} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })}
      {flybys.map((v) => (
        <div key={v.id} aria-hidden className="hx-flyby" data-hx-flyby>
          <HomePost version={v} bare />
        </div>
      ))}
    </div>
  )
}
