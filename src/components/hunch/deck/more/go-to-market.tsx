"use client"

import type { SlideProps } from "../types"
import { Count } from "./count"
import { Shell, Src, at, useOn } from "./parts"
import "./go-to-market.css"

/** Go to market: our own groups first, then where DTI already reaches online sellers, then Parallel. */
export function GoToMarket({ active, still }: SlideProps) {
  const on = useOn(active, still)
  return (
    <Shell on={on} still={still} label="Go to market" className="mo-light gm">
      <div className="gm-words">
        <h2 className="mo-h gm-h" data-in>
          Start where sellers already gather.
        </h2>
        <p className="mo-line" data-in style={at(0.08)}>
          A free first test, this Christmas season.
        </p>
      </div>

      <span aria-hidden className="gm-track" />
      <ol className="gm-stops">
        <li className="gm-stop gm-s1" data-in style={at(0.35)}>
          <span aria-hidden className="gm-dot" />
          <p className="gm-when">First</p>
          <p className="gm-name">Creator friends</p>
          <p className="gm-say">and Facebook seller groups</p>
        </li>
        <li className="gm-stop gm-s2" data-in style={at(0.55)}>
          <span aria-hidden className="gm-dot" />
          <p className="gm-when">Then</p>
          <div className="gm-figs">
            <p className="gm-fig">
              <b className="mo-num">
                <Count to={10057} on={on} still={still} delay={0.6} ms={1300} />
              </b>
              <span>online businesses applied for DTI’s Trustmark</span>
            </p>
            <p className="gm-fig gm-fig-small">
              <b className="mo-num">
                <Count to={1400} on={on} still={still} delay={0.8} ms={1100} />
              </b>
              <span>DTI Negosyo Centers</span>
            </p>
          </div>
        </li>
        <li className="gm-stop gm-s3" data-in style={at(0.75)}>
          <span aria-hidden className="gm-dot gm-dot-last hh-grain" />
          <p className="gm-when">Next</p>
          <p className="gm-name gm-name-big">Parallel</p>
          <p className="gm-say">Its traffic studio. Our ask.</p>
        </li>
      </ol>

      <Src d={1}>DTI via PNA, Sep 2025. InsiderPH, Jan 2026. DTI and Parallel are partners we will ask; nothing is agreed yet.</Src>
    </Shell>
  )
}
