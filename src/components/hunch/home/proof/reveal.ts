"use client"

import { useEffect, type RefObject } from "react"

// Marks each [data-rise] inside the scope with data-seen as it scrolls in. CSS does the rest.
export function useReveal(scope: RefObject<HTMLElement | null>, inset = 14) {
  useEffect(() => {
    const root = scope.current
    if (!root) return
    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-rise]"))
    if (typeof IntersectionObserver === "undefined") {
      items.forEach((el) => el.setAttribute("data-seen", ""))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          e.target.setAttribute("data-seen", "")
          io.unobserve(e.target)
        }
      },
      { threshold: 0, rootMargin: `0px 0px -${inset}% 0px` }
    )
    items.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [scope, inset])
}
