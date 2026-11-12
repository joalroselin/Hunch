"use client"

import { MARK_PATH } from "@/components/hunch/home/mark"

import type { SlideProps } from "../types"
import { Count } from "./count"
import { Shell, Src, at, useOn } from "./parts"
import "./ask.css"

// Angel to choose the ask. The pilot with Parallel is the default; the money figure stays in the source line.
const SELLERS = 50

/** The ask: one big number and the mark. */
export function Ask({ active, still }: SlideProps) {
  const on = useOn(active, still)
  return (
    <Shell on={on} still={still} label="The ask" className="ak">
      <div aria-hidden className="ak-mark">
        <svg viewBox="0 0 100 100">
          <path d={MARK_PATH} pathLength={1} />
        </svg>
        <span className="ak-fill hh-drop hh-grain" />
      </div>

      <div className="ak-words">
        <h2 className="ak-lock" data-in>
          <span className="ak-small">Help us reach</span>
          <span className="mo-num ak-big">
            <Count to={SELLERS} on={on} still={still} delay={0.3} ms={1100} />
          </span>
          <span className="ak-small">sellers this December.</span>
        </h2>
        <p className="mo-line ak-line" data-in style={at(0.2)}>
          Run the pilot with Parallel’s traffic studio.
        </p>
      </div>

      <Src d={1}>Pilot proposal, Dec 2026 to Jan 2027. The draft model needs ₱1.3M to break even in month 14.</Src>
    </Shell>
  )
}
