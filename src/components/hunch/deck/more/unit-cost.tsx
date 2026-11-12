"use client"

import type { CSSProperties } from "react"

import type { SlideProps } from "../types"
import { Count } from "./count"
import { Pesos, Shell, Src, at, useOn } from "./parts"
import "./unit-cost.css"

// One ₱299 plan (2 tests a month). Model cost from our estimate; fees are PayMongo's GCash rate with VAT.
const PLAN = 299
const PLANNED = { model: 26, fees: 7 }
const OPUS = { low: 130, high: 283 }
const h = (n: number) => `${(n / PLAN) * 100}%`

/** Cost per test: about ₱13 on the planned model mix, so most of each ₱299 is left. */
export function UnitCost({ active, still }: SlideProps) {
  const on = useOn(active, still)
  const left = PLAN - PLANNED.model - PLANNED.fees
  return (
    <Shell on={on} still={still} label="Cost per test" className="uc">
      <div className="uc-words">
        <h2 className="uc-lock" data-in>
          <span className="uc-small">About</span>
          <span className="mo-num uc-big">
            <span className="mo-peso">₱</span>
            <Count to={13} on={on} still={still} delay={0.2} ms={900} />
          </span>
          <span className="uc-small">to run a test.</span>
        </h2>
        <p className="mo-line uc-line" data-in style={at(0.12)}>
          Planned model mix. On Opus 5.5 alone, ₱65 to ₱142.
        </p>
      </div>

      <div className="uc-chart" style={{ "--model": h(PLANNED.model), "--fees": h(PLANNED.fees), "--low": h(OPUS.low), "--high": h(OPUS.high) } as CSSProperties}>
        <p className="uc-top" data-in style={at(0.3)}>
          Each ₱{PLAN} a month, 2 tests
        </p>
        <span aria-hidden className="uc-floor" />

        <div className="uc-col uc-opus">
          <div className="uc-bar uc-ghost">
            <span className="uc-seg uc-sure" />
            <span className="uc-seg uc-maybe" />
          </div>
          <p className="uc-say uc-say-opus" data-in style={at(1.0)}>
            <b>
              ₱{OPUS.low} to ₱{OPUS.high}
            </b>
            <span>models</span>
          </p>
          <p className="uc-name" data-in style={at(0.4)}>
            Opus 5.5 only
          </p>
        </div>

        <div className="uc-col uc-plan">
          <div className="uc-bar">
            <span className="uc-seg uc-left hh-grain" />
            <span className="uc-seg uc-fees" />
            <span className="uc-seg uc-model" />
          </div>
          <p className="uc-say uc-say-left" data-in style={at(1.25)}>
            <Pesos n={String(left)} className="mo-num" />
            <span>left</span>
          </p>
          <p className="uc-say uc-say-fees" data-in style={at(1.35)}>
            <b>₱{PLANNED.fees}</b> fees
          </p>
          <p className="uc-say uc-say-model" data-in style={at(1.4)}>
            <b>₱{PLANNED.model}</b> models
          </p>
          <p className="uc-name" data-in style={at(0.45)}>
            Planned mix
          </p>
        </div>
      </div>

      <Src d={1.3}>Anthropic API pricing, Nov 2026. Our estimate from the app’s own prompts, 42 calls a test. PayMongo GCash fee with VAT.</Src>
    </Shell>
  )
}
