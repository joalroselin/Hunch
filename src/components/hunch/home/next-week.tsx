"use client"

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion"

import { copyText } from "@/components/hunch/post"
import { lowerFirst } from "@/components/hunch/screens/shared"
import { captionText, normalizeLanguage } from "@/lib/hunch/language"

import { focus, nextSevenDays, peso, run } from "./data"
import { LetterRoll } from "./letter-roll"
import { usePostSheet } from "./post-sheet"
import { isRunnerUpDay, spendEach } from "./proof/data"
import { useReveal } from "./proof/reveal"
import { easeOut, useFilm } from "./scroll/film"
import { HomePost } from "./ugc-post"
import "./proof/base.css"
import "./proof/week.css"

const posts = focus.posts
const tests = focus.tests
const forWinner = posts.filter((p) => !isRunnerUpDay(p)).length
const language = normalizeLanguage(run.product.language)

// Where each day hangs: width in design pixels, lift and tilt.
const HANG = [
  { w: 330, up: 0, r: -3 },
  { w: 150, up: 26, r: 3 },
  { w: 132, up: 0, r: -2 },
  { w: 176, up: 44, r: 4 },
  { w: 132, up: 6, r: -3 },
  { w: 150, up: 30, r: 2 },
  { w: 132, up: 0, r: -2.5 },
]

// Dealt from the left like cards as the week scrolls in.
function Deal({ i, p, on, children }: { i: number; p: MotionValue<number>; on: boolean; children: ReactNode }) {
  const from = i * 0.06
  const to = Math.min(1, from + 0.56)
  const x = useTransform(p, [from, to], [`${-(5 + i * 3.4)}vw`, "0vw"], { ease: easeOut })
  const rotate = useTransform(p, [from, to], [-12 - i, 0], { ease: easeOut })
  const opacity = useTransform(p, [from, from + 0.16], [0, 1])
  return <motion.div style={on ? { x, rotate, opacity } : undefined}>{children}</motion.div>
}

export function NextWeek() {
  const sheet = usePostSheet()
  const ref = useRef<HTMLElement>(null)
  useReveal(ref)
  const film = useFilm()
  const week = useRef<HTMLOListElement>(null)
  const { scrollYProgress: dealt } = useScroll({ target: week, offset: ["start 0.95", "start 0.28"] })
  // The real next 7 days, known only in the browser.
  const [days, setDays] = useState<string[] | null>(null)
  const [said, setSaid] = useState("")
  useEffect(() => setDays(nextSevenDays()), [])
  useEffect(() => {
    if (!said) return
    const t = window.setTimeout(() => setSaid(""), 2600)
    return () => window.clearTimeout(t)
  }, [said])

  const first = posts[0]
  const copy = async () => {
    if (!first) return
    const ok = await copyText(captionText(first, language))
    setSaid(ok ? "Caption copied." : "Copy blocked. Select the caption and copy it by hand.")
  }

  return (
    <section ref={ref} id="next-week" aria-labelledby="next-week-title" className="nw">
      <div className="nw-top">
        <header className="nw-head" data-rise>
          <h2 id="next-week-title" className="hh-title nw-title pf-rise">
            Post to them next week.
          </h2>
          <p className="hh-line nw-line pf-rise" style={{ "--rd": "0.08s" } as CSSProperties}>
            {`Get ${posts.length} new posts, ${forWinner} for the buyers who messaged.`}
          </p>
        </header>
        <ol ref={week} className="nw-week" data-rise>
          {posts.map((p, i) => {
            const h = HANG[i % HANG.length] ?? HANG[0]
            const day = days?.[i]
            const test = isRunnerUpDay(p)
            return (
              <li
                key={p.id}
                className="nw-day"
                data-lead={i === 0 ? "" : undefined}
                style={{ "--w": h.w, "--up": h.up, "--r": `${h.r}deg`, "--rd": `${i * 0.07}s` } as CSSProperties}
              >
                <Deal i={i} p={dealt} on={film}>
                  <button
                    type="button"
                    className="nw-post pf-rise"
                    aria-label={`${day ? `${day}. ` : ""}Open the post for ${lowerFirst(p.audienceName)}`}
                    onClick={() => sheet.open(p.id)}
                  >
                    <HomePost version={p} />
                  </button>
                </Deal>
                <p className="nw-when pf-rise">
                  <span>{day ?? " "}</span>
                  {test ? <span className="nw-tag">Testing the runner-up</span> : null}
                </p>
                {i === 0 ? (
                  <div className="nw-copy pf-rise">
                    <button type="button" className="hh-pill group" onClick={copy}>
                      <LetterRoll text="Copy the caption" />
                    </button>
                    <span role="status" aria-live="polite" className="nw-said" data-on={said ? "" : undefined}>
                      {said}
                    </span>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ol>
      </div>

      {tests.length ? (
        <div className="nw-tests" data-rise>
          <div className="nw-tests-words">
            <h3 className="hh-title nw-tests-title pf-rise">{`Try ${tests.length} small tests.`}</h3>
            <p className="hh-line nw-tests-line pf-rise" style={{ "--rd": "0.08s" } as CSSProperties}>
              {`Spend ${peso(spendEach)} on each to check a second hunch.`}
            </p>
          </div>
          <ul className="nw-tests-posts">
            {tests.map((t, i) => (
              <li key={t.id} className="nw-test" style={{ "--rd": `${0.1 + i * 0.09}s` } as CSSProperties}>
                <button
                  type="button"
                  className="nw-post pf-rise"
                  aria-label={`Open the post for ${lowerFirst(t.audienceName)}`}
                  onClick={() => sheet.open(t.id)}
                >
                  <HomePost version={t} />
                </button>
                <p className="nw-when pf-rise">{t.audienceName}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
