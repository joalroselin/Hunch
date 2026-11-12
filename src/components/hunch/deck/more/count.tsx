"use client"

import { useEffect, useState } from "react"

type CountProps = {
  to: number
  on: boolean
  still: boolean
  decimals?: number
  delay?: number
  ms?: number
  format?: (n: number) => string
}

const plain = (d: number) => (n: number) => n.toLocaleString("en-PH", { minimumFractionDigits: d, maximumFractionDigits: d })

/** A number that counts up once its slide is on. The final value holds the width, so nothing beside it moves. */
export function Count({ to, on, still, decimals = 0, delay = 0, ms = 1200, format }: CountProps) {
  const show = format ?? plain(decimals)
  const [n, setN] = useState<number | null>(null)
  useEffect(() => {
    if (!on || still) return
    let raf = 0
    let t0 = 0
    const tick = (t: number) => {
      if (!t0) t0 = t + delay * 1000
      const p = Math.min(1, Math.max(0, (t - t0) / ms))
      const eased = 1 - Math.pow(1 - p, 3)
      setN(to * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [on, still, to, delay, ms])
  const final = show(to)
  const now = still ? final : on && n !== null ? show(n) : show(0)
  return (
    <span className="mo-count">
      <span aria-hidden className="mo-count-hold">
        {final}
      </span>
      <span className="mo-count-now">{now}</span>
    </span>
  )
}
