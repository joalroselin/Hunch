import type { Metadata } from "next"

import { InstrumentsDemo } from "./demo"

export const metadata: Metadata = {
  title: "Instruments · Hunch",
  description: "Dot numbers, arcs, dials, tick strips and dot plots for the dark look, filled with the sample report.",
}

export default function InstrumentsDemoPage() {
  return <InstrumentsDemo />
}
