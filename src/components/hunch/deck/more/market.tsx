"use client"

import type { SlideProps } from "../types"
import { Count } from "./count"
import { Shell, Src, at, useOn } from "./parts"
import "./market.css"

/** Market: three numbers stepping down, each with its one line of math. */
export function Market({ active, still }: SlideProps) {
  const on = useOn(active, still)
  return (
    <Shell on={on} still={still} label="Market" className="mk">
      <div className="mk-row mk-r1" data-in>
        <b className="mo-num mk-n">
          <Count to={9.5} decimals={1} on={on} still={still} delay={0.15} />M
        </b>
        <div className="mk-say">
          <h2 className="mk-label">Filipinos sold online in 2024.</h2>
          <p className="mk-math">15.4% of 61.46 million internet users aged 10 and up</p>
        </div>
      </div>

      <div className="mk-row mk-r2" data-in style={at(0.35)}>
        <b className="mo-num mk-n">
          <Count to={500} on={on} still={still} delay={0.45} />K
        </b>
        <div className="mk-say">
          <p className="mk-label">small businesses already sell online.</p>
          <p className="mk-math">DTI E-Commerce Bureau estimate</p>
        </div>
      </div>

      <div className="mk-row mk-r3" data-in style={at(0.7)}>
        <b className="mo-num mk-n">
          <Count to={384} on={on} still={still} delay={0.8} />
        </b>
        <div className="mk-say">
          <p className="mk-label">paying sellers by month 12 in our draft model.</p>
          <p className="mk-math">6,415 free tests, 8% pay, 7% leave each month</p>
        </div>
      </div>

      <Src d={0.9}>PSA, 2024 ICT Household Survey, preliminary. DTI E-Commerce Bureau, 2025. Hunch draft model, Nov 2026.</Src>
    </Shell>
  )
}
