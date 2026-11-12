"use client"

import { hunchStore, type StoredProduct } from "@/lib/hunch/store"

// Elle is a persona made for the demo; everything below is sample data. Matches demo-snapshot.json.
export const SAMPLE_PRODUCT: StoredProduct = {
  name: "Elle's Candles",
  description:
    "Soy wax candles poured at home in small batches. Three scents: Ilang-ilang, Calamansi Basil, Pandan Coconut. 180 g amber glass jar with a lid, about 35 hours of burn time.",
  price: "₱350 per 180 g jar",
  whereSold: "Shopee, Instagram and Facebook (orders by message)",
  goal: "Find out who to make content for this Christmas season.",
  language: "taglish",
  channels: ["shopee", "instagram", "facebook"],
}

export function nextSevenDays(from = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    weekday: "short",
    month: "short",
    day: "numeric",
  })
  return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(from.getTime() + (i + 1) * 86400000)))
}

// Steps before "results" fill the run only; "results" adds the report and the grid; "focus" adds the plan.
export type DemoStep = "studio" | "audiences" | "posts" | "test" | "results" | "focus" | "next-week"

// Fills the store from Elle's saved candle run so a step can be shown at once. No network.
export async function applyDemo(step: DemoStep) {
  const [{ sampleRunFor }, { sampleReport, readExport }, { sampleFocus }, { sampleFilesOf }] = await Promise.all([
    import("@/lib/hunch/engine/sample/run"),
    import("@/lib/hunch/engine/results"),
    import("@/lib/hunch/engine/sample/focus"),
    import("@/lib/hunch/engine/sample/files"),
  ])
  const run = sampleRunFor({})
  hunchStore.fill({ product: { ...SAMPLE_PRODUCT }, photo: null })
  hunchStore.setRun(run)
  if (step !== "results" && step !== "focus" && step !== "next-week") return
  const report = sampleReport(run)
  const f = sampleFilesOf(run)
  hunchStore.setReport(report, { name: f.resultsName, text: f.results }, { name: f.breakdownName, text: f.breakdown })
  hunchStore.setGrid(readExport(f.results, run).grid)
  if (step === "results") return
  hunchStore.setFocus(sampleFocus(run, report), report)
}

export function stripDemoParam() {
  try {
    const url = new URL(window.location.href)
    if (!url.searchParams.has("demo")) return
    url.searchParams.delete("demo")
    window.history.replaceState(null, "", url.pathname + url.search + url.hash)
  } catch {}
}
