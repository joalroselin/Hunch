import type { HunchState } from "@/lib/hunch/store"

export type StepKey = "start" | "studio" | "audiences" | "posts" | "test" | "results" | "next-week"
// "focus" is the old name of next-week.
export type StepId = StepKey | "focus"

export type Step = { id: StepKey; n: number; label: string; href: string }

export const STEPS: Step[] = [
  { id: "start", n: 1, label: "Start", href: "/start" },
  { id: "studio", n: 2, label: "Studio", href: "/studio" },
  { id: "audiences", n: 3, label: "Your 8 hunches", href: "/audiences" },
  { id: "posts", n: 4, label: "Your 8 posts", href: "/posts" },
  { id: "test", n: 5, label: "Run the test", href: "/test" },
  { id: "results", n: 6, label: "Results", href: "/results" },
  { id: "next-week", n: 7, label: "Next week", href: "/next-week" },
]

export const stepKey = (id: StepId): StepKey => (id === "focus" ? "next-week" : id)
export const stepIndex = (id: StepId) => STEPS.findIndex((s) => s.id === stepKey(id))

type Data = Pick<HunchState, "product" | "run" | "studio" | "report" | "focus">

// A step can be opened once the data it shows exists.
export function canOpen(id: StepKey, s: Data) {
  switch (id) {
    case "start":
      return true
    case "studio":
      return !!(s.run || s.studio || s.product)
    case "next-week":
      return !!(s.report || s.focus)
    default:
      return !!s.run
  }
}

// Nothing saved yet: every step after Start sends the seller back to Start.
export const isEmpty = (s: Data) => !s.run && !s.studio && !s.product
