"use client"

import { useEffect } from "react"

// Marks <html> while the tab is hidden so CSS pauses ambient loops.
export function TabVisibility() {
  useEffect(() => {
    const root = document.documentElement
    const sync = () => {
      if (document.hidden) root.dataset.tabHidden = ""
      else delete root.dataset.tabHidden
    }
    sync()
    document.addEventListener("visibilitychange", sync)
    return () => document.removeEventListener("visibilitychange", sync)
  }, [])
  return null
}
