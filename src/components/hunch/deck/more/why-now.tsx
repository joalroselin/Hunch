"use client"

import type { CSSProperties } from "react"

import { run } from "@/components/hunch/home/data"
import { HomePost } from "@/components/hunch/home/ugc-post"

import type { SlideProps } from "../types"
import { Shell, Src, at, useOn } from "./parts"
import "./why-now.css"

// Example interests a candle seller would have ticked. Illustration only.
const INTERESTS = ["Scented candles", "Home decor", "Aromatherapy", "Gift shopping", "Interior design"]
// The winning post sits on top, just right of the middle.
const ORDER = ["A1", "A2", "A4", "A5", "A3", "A6", "A7", "A8"]
const posts = ORDER.flatMap((c) => run.versions.filter((v) => v.code === c))
const LEAD = 4
const SPREAD = 52

/** Why now: the targeting boxes stop mattering; the posts do the finding. */
export function WhyNow({ active, still }: SlideProps) {
  const on = useOn(active, still)
  return (
    <Shell on={on} still={still} label="Why now" className="mo-light wn">
      <div className="wn-words">
        <h2 className="mo-h wn-h" data-in>
          Meta now picks who sees ads.
        </h2>
        <p className="mo-line" data-in style={at(0.08)}>
          What the post says decides who sees it.
        </p>
      </div>

      <div className="wn-panel" data-in style={at(0.2)}>
        <p className="wn-title">Detailed targeting</p>
        <ul className="wn-rows">
          {INTERESTS.map((x, i) => (
            <li key={x} className="wn-row" style={{ "--s": `${0.75 + i * 0.13}s` } as CSSProperties}>
              <span aria-hidden className="wn-box" />
              <span className="wn-word">{x}</span>
            </li>
          ))}
        </ul>
        <p className="wn-note">Many options stopped working on Jan 15, 2026.</p>
      </div>

      <div aria-hidden className="wn-fan">
        {posts.map((v, i) => {
          const turn = -SPREAD / 2 + (SPREAD / (posts.length - 1)) * i
          return (
            <div
              key={v.id}
              className="wn-card"
              data-lead={i === LEAD ? "" : undefined}
              style={{ "--turn": `${turn}deg`, "--z": 20 - Math.abs(i - LEAD) * 2, "--s": `${1.15 + i * 0.06}s` } as CSSProperties}
            >
              <HomePost version={v} className="wn-post" />
            </div>
          )
        })}
      </div>

      <Src>Meta for Business, Apr 2025. Social Media Today, Aug 2025. Interests shown are examples.</Src>
    </Shell>
  )
}
