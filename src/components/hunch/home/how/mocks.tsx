"use client"

import * as React from "react"

import { audienceById, dayWord, metricsByCode, photoUrlOf, report, resultsOf, run, units } from "../data"
import { perPost, pesos } from "../story/shared"
import { HomePost } from "../ugc-post"

const posts = [...run.versions].sort((a, b) => Number(a.code.slice(1)) - Number(b.code.slice(1)))
const nameOf = (audienceId: string) => audienceById.get(audienceId)?.name ?? ""
const count = (code: string) => {
  const m = metricsByCode.get(code)
  return m ? resultsOf(m) : 0
}
// Most messages first.
const ranked = [...posts].sort((a, b) => count(b.code) - count(a.code))
const lead = ranked[0]

export const TYPED = "Soy candles poured at home"
const price = (run.product.price ?? "").split(" ")[0]
const channels = (run.product.whereSold ?? "")
  .split(" (")[0]
  .split(/,\s*|\s+and\s+/)
  .filter(Boolean)

const clamp = (n: number) => Math.min(1, Math.max(0, n))
const on = (b: boolean) => (b ? "" : undefined)

const Phone = React.memo(function Phone({ i, boosted }: { i: number; boosted?: boolean }) {
  const v = posts[i]
  return v ? <HomePost version={v} boosted={boosted} /> : null
})

/** Step 1: the start screen, being filled in. */
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
        <div className="hw-photo" data-on={on(t >= 1500)}>
          <span className="hw-cap">Add a photo</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoUrlOf(posts[2] ?? posts[0])} alt="" draggable={false} />
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

/** Steps 2 and 3: the 8 posts with who each one is for, then the same 8 boosted. */
export const PostsMock = React.memo(function PostsMock({ t, boost }: { t: number; boost?: boolean }) {
  const p = boost ? clamp((t - 900) / 3000) : 0
  const day = Math.min(report.days, 1 + Math.floor(p * report.days))
  return (
    <div className="hw-win hw-posts" data-boost={on(!!boost)} style={{ "--hw-run": p } as React.CSSProperties}>
      <div className="hw-bar">
        <b>{boost ? "Promoted" : `Your ${posts.length} posts`}</b>
        {boost ? (
          <span>
            Day {day} of {report.days}
          </span>
        ) : (
          <span>One for each kind of buyer</span>
        )}
      </div>
      <div className="hw-grid">
        <div className="hw-track">
          {posts.map((v, i) => (
            <div key={v.id} className="hw-cell" style={{ "--k": i } as React.CSSProperties}>
              <Phone i={i} boosted={boost} />
              {boost ? (
                <span className="hw-spend">
                  <b>{pesos(perPost)}</b>
                  <span className="hw-meter">
                    {Array.from({ length: report.days }, (_, d) => (
                      <i key={d} style={{ "--d": d } as React.CSSProperties} />
                    ))}
                  </span>
                </span>
              ) : (
                <span className="hw-name">{nameOf(v.audienceId)}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

/** Step 4: the 8 ranked by messages, the winner first and large. */
export const ResultsMock = React.memo(function ResultsMock({ t }: { t: number }) {
  const p = clamp((t - 700) / 1300)
  const top = lead ? count(lead.code) : 0
  return (
    <div className="hw-win hw-res">
      <div className="hw-res-post">{lead ? <Phone i={posts.indexOf(lead)} boosted /> : null}</div>
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
