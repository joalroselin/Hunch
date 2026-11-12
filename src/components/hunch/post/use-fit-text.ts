"use client"

import { useEffect, useLayoutEffect, type RefObject } from "react"

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect

// Largest font size (px) at which `text` fits inside `box` without overflow.
export function fitText(box: HTMLElement, text: HTMLElement, min: number, max: number) {
  const fits = (size: number) => {
    text.style.fontSize = `${size}px`
    return (
      text.scrollHeight <= box.clientHeight + 1 &&
      text.scrollWidth <= text.clientWidth + 1
    )
  }
  let lo = min
  let hi = max
  let best = min
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (fits(mid)) {
      best = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  text.style.fontSize = `${best}px`
  return best
}

// Rough first guess so the server render is close before measuring.
export function estimateFontSize(
  chars: number,
  width: number,
  height: number,
  min: number,
  max: number,
  ratio = 0.62
) {
  const guess = Math.sqrt((width * height * 0.72) / (Math.max(chars, 1) * ratio))
  return Math.round(Math.min(max, Math.max(min, guess)))
}

export function useFitText(
  boxRef: RefObject<HTMLElement | null>,
  textRef: RefObject<HTMLElement | null>,
  min: number,
  max: number,
  key: string
) {
  useIsoLayoutEffect(() => {
    let alive = true
    const run = () => {
      if (alive && boxRef.current && textRef.current) {
        fitText(boxRef.current, textRef.current, min, max)
      }
    }
    run()
    document.fonts?.ready.then(run).catch(() => {})
    return () => {
      alive = false
    }
  }, [key, min, max])
}
