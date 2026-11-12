"use client"

import type { CSSProperties } from "react"

import type { SlideProps } from "../types"
import { Shell, Src, at, useOn } from "./parts"
import "./roadmap.css"

// The seller's own steps today. Each phase takes some off her hands.
const CHORES = ["Copy the caption", "Post it", "Promote it", "Type the results"]

// Which chores are gone by each phase. Timings are estimates; the reviews set the pace.
const PHASES = [
  { name: "Now", when: "Today", gone: [] as number[] },
  { name: "Pilot", when: "Dec to Jan, proposed", gone: [] as number[] },
  { name: "Results come in", when: "After Meta’s app review", gone: [3] },
  { name: "Posts from Hunch", when: "After Meta and TikTok approve", gone: [0, 1, 2, 3] },
]

/** Roadmap: the same loop, with less copy and paste at each step. */
export function Roadmap({ active, still }: SlideProps) {
  const on = useOn(active, still)
  return (
    <Shell on={on} still={still} label="Roadmap" className="rm">
      <div className="rm-words">
        <h2 className="mo-h rm-h" data-in>
          Less work for sellers each step.
        </h2>
        <p className="mo-line" data-in style={at(0.08)}>
          Official APIs replace the copy and paste, once approved.
        </p>
      </div>

      <span aria-hidden className="rm-track" />
      <ol className="rm-phases">
        {PHASES.map((p, i) => {
          const last = i === PHASES.length - 1
          return (
            <li key={p.name} className="rm-phase" data-last={last ? "" : undefined} style={{ "--i": i } as CSSProperties}>
              <span aria-hidden className={last ? "rm-dot rm-dot-last hh-grain" : "rm-dot"} data-in style={at(0.3 + i * 0.16)} />
              <p className="rm-name" data-in style={at(0.34 + i * 0.16)}>
                {p.name}
              </p>
              <p className="rm-when" data-in style={at(0.38 + i * 0.16)}>
                {p.when}
              </p>
              <ul className="rm-chores">
                {CHORES.map((c, j) => {
                  const gone = p.gone.includes(j)
                  return (
                    <li
                      key={c}
                      className="rm-chore"
                      data-gone={gone ? "" : undefined}
                      data-in
                      style={at(0.45 + i * 0.16 + j * 0.04, { "--s": `${1.2 + i * 0.22 + j * 0.06}s` } as CSSProperties)}
                    >
                      <span>{c}</span>
                    </li>
                  )
                })}
              </ul>
              {last ? (
                <p className="rm-button" data-in style={at(2.2)}>
                  Post for me
                </p>
              ) : null}
            </li>
          )
        })}
      </ol>

      <Src d={1}>Hunch MVP Plan, Nov 2026. Timings are estimates; Meta’s app review and TikTok’s posting audit set the pace.</Src>
    </Shell>
  )
}
