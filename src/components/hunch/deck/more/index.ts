import type { ComponentType } from "react"

import type { Slide, SlideProps } from "../types"
import { Ask } from "./ask"
import { Competition } from "./competition"
import { Financials } from "./financials"
import { GoToMarket } from "./go-to-market"
import { Market } from "./market"
import { Pricing } from "./pricing"
import { Questions } from "./questions"
import { Risks } from "./risks"
import { Roadmap } from "./roadmap"
import { Team } from "./team"
import { TOPICS } from "./topics"
import { UnitCost } from "./unit-cost"
import { WhyNow } from "./why-now"

const SLIDES: Record<string, ComponentType<SlideProps>> = {
  "why-now": WhyNow,
  market: Market,
  competition: Competition,
  pricing: Pricing,
  "unit-cost": UnitCost,
  financials: Financials,
  "go-to-market": GoToMarket,
  roadmap: Roadmap,
  team: Team,
  risks: Risks,
  ask: Ask,
}

// The appendix: the index first (id "more"), then one slide per topic, in the order of the index.
export const MORE: Slide[] = [
  { id: "more", title: "Questions", ground: "cream", Component: Questions },
  ...TOPICS.flatMap((t) => {
    const Component = SLIDES[t.id]
    return Component ? [{ id: t.id, title: t.title, ground: t.ground, Component }] : []
  }),
]
