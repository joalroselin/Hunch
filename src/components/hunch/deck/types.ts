import type { ComponentType } from "react"

// Slides are drawn on a 1920 x 1080 stage in design px. The deck scales it to the screen and letterboxes other shapes.
export const STAGE_W = 1920
export const STAGE_H = 1080

// Painted full screen behind the stage, so letterbox bars take the slide's own color. Fields get fine grain.
export type Ground = "cream" | "sheet" | "sili" | "dahon" | "mangga" | "gumamela" | "ink"

export type SlideProps = {
  // On screen and allowed to play. False while the slide is leaving.
  active: boolean
  // Build step, 0 based. Always 0 for a slide with one step.
  step: number
  // No motion (reduced motion or print): draw the finished state of `step`.
  still: boolean
  // Open a slide by id. The appendix index uses it for its topics.
  go: (id: string) => void
}

export type Slide = {
  // Hash and key, kebab case, unique. "market" opens at /deck#market.
  id: string
  // Plain name for the index and the tab title.
  title: string
  // Default "cream".
  ground?: Ground
  // Build steps. Next and back walk them before leaving the slide. Default 1.
  steps?: number
  // Intro only: ms each step holds before the film moves on by itself.
  hold?: number[]
  // Intro only: the page to open after the last step.
  then?: string
  Component: ComponentType<SlideProps>
}
