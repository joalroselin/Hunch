"use client"

import * as React from "react"
import { useEffect, useMemo, useState } from "react"

import { GoLink } from "@/components/ui/button"
import { UgcPost } from "@/components/hunch/home/ugc-post"
import { applyDemo, stripDemoParam } from "@/components/hunch/screens/demo"
import { EmptyScreen, LoadingScreen, Screen, ScreenTitle, StepAction } from "@/components/hunch/shell"
import { useHunch } from "@/lib/hunch/store"
import type { TestRun } from "@/lib/hunch/types"

import { usePostFrame } from "./run-post"
import "./test.css"


const peso = (n: number) => `₱${Math.round(n).toLocaleString("en-PH")}`
const codeNum = (code: string) => Number(code.replace(/\D/g, "")) || 0

type Step = { id: string; text: string }

function stepsFor(count: number, days: number): Step[] {
  return [
    { id: "post", text: `Post all ${count} on your Facebook page or Instagram. Keep the code on each caption's last line.` },
    { id: "boost", text: "Tap Boost post on each one and copy the slip." },
    { id: "wait", text: `Let all ${count} run for ${days} days.` },
    { id: "export", text: "Hunch pulls the results from Ads Manager for you." },
  ]
}

// Ticked steps, per run. Browser only, so a refresh keeps them.
function useChecklist(runId: string) {
  const key = `hunch-checklist:${runId}`
  const [done, setDone] = useState<string[]>([])
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key)
      setDone(raw ? (JSON.parse(raw) as string[]) : [])
    } catch {
      setDone([])
    }
  }, [key])
  const toggle = (id: string) =>
    setDone((cur) => {
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
      try {
        window.localStorage.setItem(key, JSON.stringify(next))
      } catch {}
      return next
    })
  return { done, toggle }
}

// Where each of the 8 sits in the hand: angle in degrees and one of 3 sizes. The fourth leads.
const HAND = [
  { a: -25, size: "sm" },
  { a: -18, size: "sm" },
  { a: -10.5, size: "md" },
  { a: -1.5, size: "lg" },
  { a: 8, size: "md" },
  { a: 15.5, size: "sm" },
  { a: 21.5, size: "sm" },
  { a: 27.5, size: "sm" },
]

// The 8 posts held like a hand of cards, each with the same budget on it.
function Hand({ run, perPost }: { run: TestRun; perPost: number }) {
  const frame = usePostFrame(run)
  const posts = useMemo(() => [...run.versions].sort((a, b) => codeNum(a.code) - codeNum(b.code)).slice(0, HAND.length), [run.versions])
  // Center the hand on however many posts there are.
  const from = Math.max(0, Math.floor((HAND.length - posts.length) / 2))
  return (
    <div className="ht-hand" role="img" aria-label={`Your ${posts.length} posts, ${peso(perPost)} each`}>
      <div className="ht-fan" aria-hidden>
        {posts.map((v, i) => {
          const h = HAND[from + i] ?? HAND[0]
          const f = frame(v)
          return (
            <div key={v.id} className="ht-card" data-size={h.size} style={{ "--a": `${h.a}deg`, "--k": Math.abs(from + i - 3) } as React.CSSProperties}>
              <UgcPost version={f.version} photo={f.photo} avatar={f.avatar} handle={f.handle} price={h.size === "lg" ? f.sticker : undefined} boosted={h.size === "lg"} />
              <b key={perPost} className="ht-tag">
                {peso(perPost)}
              </b>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// The settings to copy into every boost, on a slip of paper.
function Slip({ perPost, days, code }: { perPost: number; days: number; code: string }) {
  return (
    <div className="ht-slip ha-sheet">
      <p className="ha-label">Each post</p>
      <p key={perPost} className="hh-title ht-slip-n">
        {peso(perPost)}
      </p>
      <dl className="ht-slip-rows">
        <div>
          <dt>Goal</dt>
          <dd>Messages</dd>
        </div>
        <div>
          <dt>Days</dt>
          <dd>{days}</dd>
        </div>
        <div>
          <dt>Audience</dt>
          <dd>Automatic</dd>
        </div>
        <div>
          <dt>Ad name</dt>
          <dd>{`The post's code, like ${code}`}</dd>
        </div>
      </dl>
    </div>
  )
}

function Steps({ steps, done, toggle }: { steps: Step[]; done: string[]; toggle: (id: string) => void }) {
  return (
    <ol className="ht-steps" aria-label="What to do">
      {steps.map((s, i) => {
        const on = done.includes(s.id)
        return (
          <li key={s.id} className="ha-rise" style={{ "--i": 8 + i } as React.CSSProperties}>
            <button type="button" role="checkbox" aria-checked={on} onClick={() => toggle(s.id)} className="ht-step">
              <span aria-hidden className="ht-tick hh-grain" />
              <span>{s.text}</span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

function RunTestView({ run }: { run: TestRun }) {
  const s = useHunch()
  const { perPost, days } = s.setup
  const count = run.versions.length
  const firstCode = useMemo(() => [...run.versions].map((v) => v.code).sort((a, b) => codeNum(a) - codeNum(b))[0] ?? "A1", [run.versions])
  const steps = useMemo(() => stepsFor(count, days), [count, days])
  const { done, toggle } = useChecklist(run.id)
  const sample = run.mode === "sample"

  return (
    <Screen aria-label="Run the test">
      <div className="ht">
        <ScreenTitle className="ht-head" title={`Promote all ${count} the same.`} line={`₱${perPost} each, for ${days} days, with the same goal.`} />

        <div className="ht-stage">
          <Hand run={run} perPost={perPost} />
          <Slip perPost={perPost} days={days} code={firstCode} />
        </div>

        <Steps steps={steps} done={done} toggle={toggle} />

        <div className="ht-send ha-rise" style={{ "--i": 12 } as React.CSSProperties}>
          <StepAction>
            <GoLink href="/results" className="w-full md:w-auto">
              See who reacted
            </GoLink>
          </StepAction>
          {sample ? null : <p className="ha-note">{`Come back after ${days} days with the CSV or the numbers.`}</p>}
        </div>
      </div>
    </Screen>
  )
}

export function RunTestScreen({ demo }: { demo: boolean }) {
  const s = useHunch()
  const [demoPending, setDemoPending] = useState(demo)

  useEffect(() => {
    if (!demo) return
    let alive = true
    applyDemo("test").finally(() => {
      if (!alive) return
      setDemoPending(false)
      stripDemoParam()
    })
    return () => {
      alive = false
    }
  }, [demo])

  if (!s.ready || demoPending) return <LoadingScreen />
  const run = s.run
  if (!run || !run.versions.length) {
    return <EmptyScreen title="No posts yet." line="Type what you sell to get 8 posts." href="/start" action="Go to Start" />
  }
  return <RunTestView run={run} />
}
