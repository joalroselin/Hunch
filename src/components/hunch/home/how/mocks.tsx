"use client"

import * as React from "react"

import { audienceById, dayWord, metricsByCode, photoUrlOf, report, resultsOf, run, units } from "../data"
import { perPost, pesos } from "../story/shared"

export const posts = [...run.versions].sort((a, b) => Number(a.code.slice(1)) - Number(b.code.slice(1)))
const nameOf = (audienceId: string) => audienceById.get(audienceId)?.name ?? ""
const count = (code: string) => {
  const m = metricsByCode.get(code)
  return m ? resultsOf(m) : 0
}
// Most messages first.
const ranked = [...posts].sort((a, b) => count(b.code) - count(a.code))
const lead = ranked[0]
/** The winner's place in `posts`. Its photo is the one added in step 1. */
export const LEAD = Math.max(0, lead ? posts.indexOf(lead) : 0)
/** Lead first, then the rest in order: who moves first when the posts travel. */
export const ORDER = [LEAD, ...posts.map((_, i) => i).filter((i) => i !== LEAD)]

export const TYPED = "Soy candles poured at home"
const price = (run.product.price ?? "").split(" ")[0]
const channels = (run.product.whereSold ?? "")
  .split(" (")[0]
  .split(/,\s*|\s+and\s+/)
  .filter(Boolean)

const clamp = (n: number) => Math.min(1, Math.max(0, n))
const on = (b: boolean) => (b ? "" : undefined)
const ALL = posts.map((_, i) => i).join(" ")

// Where each post lands, as [left, top, width, tilt] in stage cqw. Wide, then phone.
type Spot = readonly [number, number, number, number]
const MADE: { wide: Spot[]; narrow: Spot[] } = {
  wide: [
    [6, 14, 29, -3],
    [41, 14, 14, 3],
    [59, 11.5, 13.5, -2],
    [77.5, 15, 15, 4],
    [40, 52, 11.5, -3],
    [54.6, 49.5, 11.5, 2],
    [69.2, 53, 11.5, -2],
    [83.8, 50, 11.5, 3],
  ],
  narrow: [
    [5, 15, 39, -3],
    [52, 13, 19, 3],
    [75, 17, 19, -2],
    [51, 52, 19, -3],
    [74, 53, 19, 2],
    [50, 90, 13.5, -3],
    [66, 88, 13.5, 2],
    [82, 90.5, 13.5, 4],
  ],
}
const RUN: { wide: Spot[]; narrow: Spot[] } = {
  wide: [0, 1, 2, 3, 4, 5, 6, 7].map((i) => [i < 4 ? 5 + i * 22 : 14 + (i - 4) * 22, i < 4 ? 15 : 50, 15, 0] as const),
  narrow: [0, 1, 2, 3, 4, 5, 6, 7].map((i) => [5.5 + (i % 4) * 23, (i < 4 ? 19 : 66) + (i % 2) * 2.4, 20, 0] as const),
}
const spotVars = (w: Spot, n: Spot, k: number) =>
  ({
    "--cx": `${w[0]}cqw`,
    "--cy": `${w[1]}cqw`,
    "--cw": `${w[2]}cqw`,
    "--cr": `${w[3]}deg`,
    "--nx": `${n[0]}cqw`,
    "--ny": `${n[1]}cqw`,
    "--nw": `${n[2]}cqw`,
    "--nr": `${n[3]}deg`,
    "--k": k,
  }) as React.CSSProperties

/** Step 1: the start screen, being filled in. The photo is where the posts come from. */
export const StartMock = React.memo(function StartMock({ t }: { t: number }) {
  const typed = Math.min(TYPED.length, Math.floor(t / 42))
  return (
    <div className="hw-win hw-start">
      <span className="hw-cap">What do you sell?</span>
      <span className="hw-typed">
        {TYPED.slice(0, typed)}
        <i className="hw-caret" data-blink={on(typed === TYPED.length)} />
      </span>
      <div className="hw-start-row">
        <div className="hw-photo" data-on={on(t >= 1500)} data-slot={ALL} style={{ "--r": "-3deg" } as React.CSSProperties}>
          <span className="hw-cap">Add a photo</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoUrlOf(posts[LEAD])} alt="" draggable={false} />
        </div>
        <div className="hw-facts">
          <div className="hw-fact" data-on={on(t >= 1950)}>
            <span className="hw-cap">Price</span>
            <span className="hw-well">
              <b>{price}</b>
            </span>
          </div>
          <div className="hw-fact">
            <span className="hw-cap">Where you sell</span>
            <span className="hw-where">
              {channels.map((c, i) => (
                <span key={c} data-on={on(t >= 2400 + i * 240)}>
                  <i />
                  {c}
                </span>
              ))}
            </span>
          </div>
        </div>
      </div>
      <span className="hh-pill hw-go" data-press={on(t >= 3500 && t < 3900)}>
        Write my {posts.length} posts
      </span>
    </div>
  )
})

/** Step 2: the 8 posts on the field, the lead large, each over the buyer it was written for. */
export const MadeMock = React.memo(function MadeMock() {
  return (
    <div className="hw-made">
      <div className="hw-bar">
        <b>
          <span>Your {posts.length} posts</span>
        </b>
        <span>
          <span>One for each kind of buyer</span>
        </span>
      </div>
      {ORDER.map((i, k) => {
        const v = posts[i]
        return (
          <div key={v.id} className="hw-cell" data-lead={on(i === LEAD)} style={spotVars(MADE.wide[k], MADE.narrow[k], k)}>
            <i className="hw-slot" data-slot={i} />
            <span className="hw-name">{nameOf(v.audienceId)}</span>
          </div>
        )
      })}
    </div>
  )
})

/** Step 3: the same 8 lined up and promoted, each with its ₱99 and its days. */
export const BoostMock = React.memo(function BoostMock({ t }: { t: number }) {
  const p = clamp((t - 900) / 3000)
  const day = Math.min(report.days, 1 + Math.floor(p * report.days))
  return (
    <div className="hw-made hw-boost" style={{ "--hw-run": p } as React.CSSProperties}>
      <div className="hw-bar">
        <b>
          <span>Promoted</span>
        </b>
        <span>
          <span>
            Day <b key={day}>{day}</b> of {report.days}
          </span>
        </span>
      </div>
      {posts.map((v, i) => (
        <div key={v.id} className="hw-cell" style={spotVars(RUN.wide[i], RUN.narrow[i], i)}>
          <i className="hw-slot" data-slot={i} />
          <span className="hw-spend">
            <b>{pesos(perPost)}</b>
            <span className="hw-meter">
              {Array.from({ length: report.days }, (_, d) => (
                <i key={d} style={{ "--d": d } as React.CSSProperties} />
              ))}
            </span>
          </span>
        </div>
      ))}
    </div>
  )
})

/** Step 4: the winner large, then all 8 by messages. One dot is one message. */
export const ResultsMock = React.memo(function ResultsMock({ t }: { t: number }) {
  const p = clamp((t - 700) / 1300)
  const top = lead ? count(lead.code) : 0
  return (
    <div className="hw-win hw-res">
      <i className="hw-res-post hw-slot" data-slot={LEAD} />
      <div className="hw-res-say">
        <span className="hw-cap">Most {units}</span>
        <b className="hw-res-name">{lead ? nameOf(lead.audienceId) : ""}</b>
        <span className="hw-res-n">
          <b className="hh-dot">{Math.round(top * p)}</b>
          <span>
            <b>{units}</b>
          </span>
        </span>
      </div>
      <ol className="hw-rank">
        {ranked.map((v, k) => {
          const n = count(v.code)
          return (
            <li key={v.id} data-lead={on(k === 0)} style={{ "--k": k } as React.CSSProperties}>
              {k === 0 ? (
                // The winner itself stands large on the left; its row keeps a still of it.
                // eslint-disable-next-line @next/next/no-img-element
                <img className="hw-row-thumb" src={photoUrlOf(v)} alt="" draggable={false} />
              ) : (
                <i className="hw-row-slot" data-slot={posts.indexOf(v)} />
              )}
              <span className="hw-rank-name">{nameOf(v.audienceId)}</span>
              <span className="hw-rank-dots">
                {Array.from({ length: n }, (_, j) => (
                  <i key={j} style={{ "--j": j } as React.CSSProperties} />
                ))}
              </span>
              <b>{Math.round(n * p)}</b>
            </li>
          )
        })}
      </ol>
    </div>
  )
})

export const HOW = { posts: posts.length, perPost: pesos(perPost), days: dayWord(report.days), units }
