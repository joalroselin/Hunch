import snapshot from "@/components/hunch/screens/demo-snapshot.json"

// Figures from Elle's sample candle report (8 posts, ₱100 each, 3 days). Sample data.
const metrics = snapshot.report.metrics
const nameOf = new Map(snapshot.run.versions.map((v) => [v.code, v.audienceName]))

export const brand = snapshot.run.product.name

export const posts = metrics
  .map((m) => ({ code: m.code, audience: nameOf.get(m.code) ?? m.audienceName, score: m.engagementsPer100, savesShares: m.savesSharesPer1k, views: m.impressions }))
  .sort((a, b) => b.score - a.score)

export const report = {
  days: snapshot.report.days,
  totalSpend: snapshot.report.totalSpend,
  perPost: Math.round(snapshot.report.totalSpend / metrics.length),
  confidence: snapshot.report.icp.confidence as "early" | "medium" | "strong",
}

export const winner = posts[0]
export const runnerUp = posts[1]

// Average score of the other seven posts, and how many times the winner beat it.
export const othersAverage = posts.slice(1).reduce((s, p) => s + p.score, 0) / (posts.length - 1)
export const winnerLead = winner.score / othersAverage

export const totalViews = posts.reduce((s, p) => s + p.views, 0)

// Winner views by age and gender. 45 and up are folded into 45+.
export const ageBands = ["18-24", "25-34", "35-44", "45+"] as const
export const genders = ["Women", "Men"] as const
const band = (age: string) => {
  const i = (ageBands as readonly string[]).indexOf(age)
  return i === -1 ? 3 : i
}
const cells = metrics.find((m) => m.code === winner.code)?.breakdown ?? []
export const winnerBreakdown = genders.flatMap((_, gender) =>
  ageBands.map((_, age) => ({
    age,
    gender,
    views: cells.filter((c) => c.gender === (gender ? "male" : "female") && band(c.age) === age).reduce((s, c) => s + c.impressions, 0),
  }))
)

export const steps = [
  "Finding 20 audiences",
  "Choosing the 8 most different",
  "Writing 8 posts",
  "Checking each post",
  "Fixing the ones that failed",
]
