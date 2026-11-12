"use client"

import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react"
import { motion, useScroll, useTransform } from "framer-motion"

import { copyText } from "@/components/hunch/post"
import { lowerFirst } from "@/components/hunch/screens/shared"
import { captionText, normalizeLanguage } from "@/lib/hunch/language"
import type { Version } from "@/lib/hunch/types"

import { focus, nextSevenDays, peso, run } from "./data"
import { LetterRoll } from "./letter-roll"
import { usePostSheet } from "./post-sheet"
import { isRunnerUpDay, spendEach } from "./proof/data"
import { useReveal } from "./proof/reveal"
import { easeOut, useFilm } from "./scroll/film"
import { RiseWords } from "./story/shared"
import { HomePost } from "./ugc-post"
import "./proof/base.css"
import "./proof/week.css"

const posts = focus.posts
const tests = focus.tests
const runnerUpName = posts.find(isRunnerUpDay)?.audienceName
const language = normalizeLanguage(run.product.language)

const TITLE = "Next week, post to your suki."
const TESTS = `Try ${tests.length} small tests.`
// A support line comes up just after its heading's last word.
const after = (text: string) => `${(text.split(/\s+/).length * 0.07 + 0.08).toFixed(2)}s`

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

// Dealt from the left like cards, each one as it scrolls into view.
function Deal({ i, at, children }: { i: number; at: RefObject<HTMLElement | null>; children: ReactNode }) {
  const { scrollYProgress: p } = useScroll({ target: at, offset: ["start 1", "start 0.55"] })
  const from = i * 0.06
  const to = Math.min(1, from + 0.56)
  const x = useTransform(p, [from, to], [`${-(5 + i * 3.4)}vw`, "0vw"], { ease: easeOut })
  const rotate = useTransform(p, [from, to], [-12 - i, 0], { ease: easeOut })
  const opacity = useTransform(p, [from, from + 0.16], [0, 1])
  return <motion.div style={{ x, rotate, opacity }}>{children}</motion.div>
}

type DayProps = { p: Version; i: number; day?: string; film: boolean; onOpen: (id: string) => void; children?: ReactNode }

function Day({ p, i, day, film, onOpen, children }: DayProps) {
  const ref = useRef<HTMLLIElement>(null)
  const h = HANG[i % HANG.length] ?? HANG[0]
  const post = (
    <button
      type="button"
      className={film ? "nw-post" : "nw-post pf-rise"}
      aria-label={`${day ? `${day}. ` : ""}Open the post for ${lowerFirst(p.audienceName)}`}
      onClick={() => onOpen(p.id)}
    >
      <HomePost version={p} />
    </button>
  )
  return (
    <li
      ref={ref}
      className="nw-day"
      data-lead={i === 0 ? "" : undefined}
      data-rise={film ? "" : undefined}
      style={{ "--w": h.w, "--up": h.up, "--r": `${h.r}deg`, "--rd": `${i * 0.07}s` } as CSSProperties}
    >
      {film ? (
        <Deal i={i} at={ref}>
          {post}
        </Deal>
      ) : (
        post
      )}
      <p className="nw-when pf-rise">
        <span>{day ?? " "}</span>
        {isRunnerUpDay(p) ? <span className="nw-tag">Testing the runner-up</span> : null}
      </p>
      {children}
    </li>
  )
}

export function NextWeek() {
  const sheet = usePostSheet()
  const ref = useRef<HTMLElement>(null)
  const film = useFilm()
  // Wide screens reveal each day as it arrives; elsewhere the whole row comes up together.
  useReveal(ref, 14, film)
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
          <RiseWords id="next-week-title" parts={[{ text: "Next week,", className: "nw-l" }, { text: "post to your suki.", className: "nw-l" }]} className="hh-title nw-title" />
          <p className="hh-line nw-line pf-rise" style={{ "--rd": after(TITLE) } as CSSProperties}>
            {runnerUpName
              ? `${focus.audience.name} messaged you the most, so most posts are for them. One more try for ${lowerFirst(runnerUpName)}.`
              : `${focus.audience.name} messaged you the most, so every post is for them.`}
          </p>
        </header>
        <ol className="nw-week" data-rise={film ? undefined : ""}>
          {posts.map((p, i) => (
            <Day key={p.id} p={p} i={i} day={days?.[i]} film={film} onOpen={sheet.open}>
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
            </Day>
          ))}
        </ol>
      </div>

      {tests.length ? (
        <div className="nw-tests" data-rise>
          <div className="nw-tests-words">
            <RiseWords as="h3" parts={[{ text: TESTS }]} className="hh-title nw-tests-title" />
            <p className="hh-line nw-tests-line pf-rise" style={{ "--rd": after(TESTS) } as CSSProperties}>
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
