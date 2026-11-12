"use client"

import type { SlideProps } from "../types"
import { Shell, at, useOn } from "./parts"
import "./risks.css"

// The landing page's chat: a judge's question, then an answer that leads with Yes, No or Never, and its source.
const QA = [
  {
    q: "Does Hunch break Facebook’s rules?",
    lead: "No.",
    a: "You post and promote on your own page. Hunch never logs in.",
    src: "Meta for Developers, Automated Data Collection",
  },
  {
    q: "Does it target by age or religion?",
    lead: "Never.",
    a: "Not by age, religion or health.",
    src: "RA 10173, Sec. 3(l). Meta Advertising Standards.",
  },
  {
    q: "Is ₱99 a post enough to know?",
    lead: "Yes,",
    a: "enough to see who leads. Next week tests the lead again.",
    src: "Our check on Elle’s sample data, p about 0.006 across the 8 posts",
  },
  {
    q: "Can you run it for ₱299?",
    lead: "Yes.",
    a: "About ₱13 a test on the planned model mix.",
    src: "Anthropic API pricing, Nov 2026. Our estimate.",
  },
]

/** Risks: four questions as a chat with Hunch, each answer one line with its source. */
export function Risks({ active, still }: SlideProps) {
  const on = useOn(active, still)
  return (
    <Shell on={on} still={still} label="Risks" className="rk">
      <div className="rk-words">
        <h2 className="mo-h rk-h" data-in>
          Four risks we planned for.
        </h2>
      </div>

      <div className="rk-app" data-in style={at(0.15)}>
        <p className="rk-head">
          <span aria-hidden className="rk-mark hh-grain" />
          Hunch
        </p>
        <ol className="rk-thread">
          {QA.map((x, i) => (
            <li key={x.q} className="rk-pair">
              <p className="rk-q">
                <span className="rk-bub" style={at(0.45 + i * 0.42)}>
                  {x.q}
                </span>
              </p>
              <div className="rk-reply">
                <span aria-hidden className="rk-mark rk-mark-small hh-grain" style={at(0.62 + i * 0.42)} />
                <div className="rk-slot">
                  <p className="rk-bub rk-a" style={at(0.62 + i * 0.42)}>
                    <b>{x.lead}</b> {x.a}
                  </p>
                  <p className="rk-src" style={at(0.72 + i * 0.42)}>
                    {x.src}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Shell>
  )
}
