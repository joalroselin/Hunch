"use client"

import type { CSSProperties } from "react"

import { run } from "@/components/hunch/home/data"
import { HomePost } from "@/components/hunch/home/ugc-post"

import type { SlideProps } from "../types"
import { Shell, Src, at, useOn } from "./parts"
import "./why-now.css"

// Verbatim from DMs with two solo creators. Names kept private.
const CHAT = [
  { tag: "Creator A, on posting", lines: ["I just post everywhere. Some might work on some dont", "No aggregated platform. But that would be so helpful"] },
  { tag: "Creator A, on AI help", lines: ["this is bound to happen, might as well just embrace it"] },
  { tag: "Creator B, on selling", lines: ["w the rise of affiliate marketing", "even YT u can link products na"] },
]
// The winning post sits on top, just right of the middle.
const ORDER = ["A1", "A2", "A4", "A5", "A3", "A6", "A7", "A8"]
const posts = ORDER.flatMap((c) => run.versions.filter((v) => v.code === c))
const LEAD = 4
const SPREAD = 52

/** Why now: creators sell now and still guess who buys; the posts do the finding. */
export function WhyNow({ active, still }: SlideProps) {
  const on = useOn(active, still)
  return (
    <Shell on={on} still={still} label="Why now" className="mo-light wn">
      <div className="wn-words">
        <h2 className="mo-h wn-h" data-in>
          Creators sell now. They still guess.
        </h2>
        <p className="mo-line" data-in style={at(0.08)}>
          We asked solo creators this week.
        </p>
      </div>

      <div className="wn-chat" data-in style={at(0.2)}>
        {CHAT.map((g, k) => (
          <div key={g.tag} className="wn-group">
            <p className="wn-tag" data-in style={at(0.5 + k * 0.55)}>
              {g.tag}
            </p>
            {g.lines.map((l, n) => (
              <p key={l} className="wn-bub" data-in style={at(0.6 + k * 0.55 + n * 0.22)}>
                {l}
              </p>
            ))}
          </div>
        ))}
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

      <Src>DMs with two solo creators, Nov 2026. Names kept private.</Src>
    </Shell>
  )
}
