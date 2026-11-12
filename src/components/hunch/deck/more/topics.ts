import type { Ground } from "../types"

// The appendix topics in order: the slide id, its plain title, the question a judge would ask, and the slide's ground.
export const TOPICS: { id: string; title: string; ask: string; ground: Ground }[] = [
  { id: "why-now", title: "Why now", ask: "Why now?", ground: "sili" },
  { id: "market", title: "Market", ask: "How big is the market?", ground: "mangga" },
  { id: "competition", title: "Competition", ask: "Who else does this?", ground: "cream" },
  { id: "pricing", title: "Pricing", ask: "How do you make money?", ground: "dahon" },
  { id: "unit-cost", title: "Cost per test", ask: "What does a test cost you?", ground: "cream" },
  { id: "financials", title: "Financials", ask: "When do you break even?", ground: "cream" },
  { id: "go-to-market", title: "Go to market", ask: "How do you reach sellers?", ground: "gumamela" },
  { id: "roadmap", title: "Roadmap", ask: "What comes next?", ground: "cream" },
  { id: "team", title: "Team", ask: "Who built this?", ground: "sili" },
  { id: "risks", title: "Risks", ask: "What could go wrong?", ground: "cream" },
  { id: "ask", title: "The ask", ask: "What do you need?", ground: "cream" },
]
