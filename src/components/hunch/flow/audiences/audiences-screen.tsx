"use client"

import * as React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { useReduced } from "@/components/ds/instruments"
import { Button, GoLink } from "@/components/ui/button"
import { applyDemo, stripDemoParam } from "@/components/hunch/screens/demo"
import { lowerFirst } from "@/components/hunch/screens/shared"
import { EmptyScreen, LoadingScreen, Screen, ScreenTitle, StepAction } from "@/components/hunch/shell"
import { inLanguage } from "@/lib/hunch/language"
import { languageFor, useHunch } from "@/lib/hunch/store"
import { sampleKeyOf } from "@/lib/hunch/engine/sample/catalog"
import type { TestRun } from "@/lib/hunch/types"

import { RunPost, sampleNote, usePostLook } from "../posts/run-post"
import { studioAlive } from "../studio/runner"
import "./audiences.css"

// What the heading calls the product: the sample's plain words, or the name the seller typed.
const SAMPLE_WORDS = { candles: "scented candles", matcha: "matcha" } as const
function productWords(run: TestRun) {
  const key = sampleKeyOf(run)
  return key && !run.sample?.swapped.length ? SAMPLE_WORDS[key] : lowerFirst(run.product.name)
}

const codeNum = (c?: string) => Number(c?.replace(/\D/g, "")) || 0

type Mode = "picked" | "all"
type Cut = { id: string; top: number; left: number; width: number }

function Buyers({ run }: { run: TestRun }) {
  const s = useHunch()
  const router = useRouter()
  const reduced = useReduced()
  const look = usePostLook(s)
  const lang = languageFor(s)
  const list = useRef<HTMLDivElement>(null)
  const show = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<Mode>("picked")
  const [leaving, setLeaving] = useState(false)
  const [sel, setSel] = useState(0)
  const [held, setHeld] = useState(false)
  const [hover, setHover] = useState(false)
  const [cut, setCut] = useState<Cut | null>(null)

  const versionOf = useMemo(() => new Map(run.versions.map((v) => [v.audienceId, v])), [run.versions])
  const picked = useMemo(
    () => [...run.chosen].sort((a, b) => codeNum(a.code) - codeNum(b.code)).filter((a) => versionOf.has(a.id)),
    [run.chosen, versionOf]
  )
  const chosen = useMemo(() => new Set(run.chosen.map((a) => a.id)), [run.chosen])
  const reasonOf = useMemo(() => new Map((run.cuts ?? []).map((c) => [c.id, c.reason])), [run.cuts])
  const everyone = run.candidates
  const cutCount = everyone.filter((a) => !chosen.has(a.id)).length

  useEffect(() => {
    router.prefetch("/posts")
  }, [router])

  // The deck turns by itself until the seller picks a name.
  useEffect(() => {
    if (reduced || held || hover || picked.length < 2) return
    const t = window.setInterval(() => {
      if (!document.hidden) setSel((n) => (n + 1) % picked.length)
    }, 4600)
    return () => window.clearInterval(t)
  }, [reduced, held, hover, picked.length])

  const swap = (next: Mode) => {
    setCut(null)
    if (reduced) return setMode(next)
    setLeaving(true)
    window.setTimeout(() => {
      setMode(next)
      setLeaving(false)
    }, 260)
  }

  const pick = (i: number) => {
    setHeld(true)
    setSel(i)
    // Phones: the post sits above the names, so bring it back into view.
    const el = show.current
    if (el && el.getBoundingClientRect().bottom < 120) el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" })
  }

  const showCut = (id: string, el: HTMLElement) => {
    const box = list.current
    if (!box) return
    const r = el.getBoundingClientRect()
    const b = box.getBoundingClientRect()
    const width = Math.min(360, b.width)
    setCut({ id, top: r.bottom - b.top + 10, left: Math.max(0, Math.min(r.left - b.left, b.width - width)), width })
  }

  const note = sampleNote(run)
  const names = mode === "all" ? everyone : picked
  const active = picked[sel] ?? picked[0]

  return (
    <Screen aria-label="Your 8 hunches">
      <ScreenTitle title={`Here’s who might buy your ${productWords(run)}.`} className="hb-title" />

      <div className="hb">
        <div ref={list} className="hb-list" onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)}>
          <ul key={mode} className="hb-names" data-mode={mode} data-leaving={leaving ? "" : undefined}>
            {names.map((a, i) => {
              const isCut = !chosen.has(a.id)
              const on = !isCut && a.id === active?.id
              return (
                <li key={a.id} style={{ "--i": i } as React.CSSProperties}>
                  {isCut ? (
                    <button
                      type="button"
                      className="hb-name"
                      data-cut=""
                      aria-expanded={cut?.id === a.id}
                      aria-describedby={cut?.id === a.id ? "hb-cut" : undefined}
                      onPointerEnter={(e) => e.pointerType === "mouse" && showCut(a.id, e.currentTarget)}
                      onPointerLeave={(e) => e.pointerType === "mouse" && setCut(null)}
                      onFocus={(e) => showCut(a.id, e.currentTarget)}
                      onBlur={() => setCut(null)}
                      onClick={(e) => showCut(a.id, e.currentTarget)}
                    >
                      <span className="hb-ink">{a.name}.</span>
                    </button>
                  ) : (
                    <button type="button" className="hb-name" data-on={on ? "" : undefined} aria-pressed={on} onClick={() => pick(picked.findIndex((p) => p.id === a.id))}>
                      <span className="hb-ink">{a.name}.</span>
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
          {cut ? (
            <p key={cut.id} id="hb-cut" role="status" className="hb-cut" style={{ top: cut.top, left: cut.left, width: cut.width }}>
              {reasonOf.get(cut.id) ?? "Not picked for this test."}
            </p>
          ) : null}

          <div className="hb-next ha-rise" style={{ "--i": 12 } as React.CSSProperties}>
            <StepAction>
              <GoLink href="/posts" className="w-full md:w-auto">
                {`See your ${picked.length} posts`}
              </GoLink>
            </StepAction>
            {cutCount > 0 ? (
              <Button variant="secondary" size="lg" className="hb-toggle" onClick={() => swap(mode === "all" ? "picked" : "all")}>
                {mode === "all" ? `Show the ${picked.length}` : `Show all ${everyone.length}`}
              </Button>
            ) : null}
            {note ? <p className="ha-note">{note}</p> : null}
          </div>
        </div>

        <div ref={show} className="hb-show" onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)}>
          <div className="hb-deck">
            {picked.map((a, i) => {
              const d = (i - sel + picked.length) % picked.length
              const role = d === 0 ? "front" : d === 1 ? "next" : d === picked.length - 1 ? "prev" : "rest"
              const front = role === "front"
              const v = versionOf.get(a.id)
              if (!v) return null
              return (
                <button
                  key={a.id}
                  type="button"
                  className="hb-card"
                  data-role={role}
                  tabIndex={front ? 0 : -1}
                  aria-hidden={front ? undefined : true}
                  aria-label={`Open the post for ${lowerFirst(a.name)}`}
                  onClick={() => (front ? router.push(`/posts#${v.code}`) : pick(i))}
                >
                  <RunPost look={look} version={inLanguage(v, lang)} boosted={front} sticker={front} />
                </button>
              )
            })}
          </div>
          <p key={active?.id} className="hh-line hb-moment">
            {active?.situation}
          </p>
        </div>
      </div>
    </Screen>
  )
}

export function AudiencesScreen({ demo }: { demo: boolean }) {
  const s = useHunch()
  const [armed, setArmed] = useState(!demo)

  useEffect(() => {
    if (!demo) return
    let alive = true
    applyDemo("audiences").finally(() => {
      if (!alive) return
      stripDemoParam()
      setArmed(true)
    })
    return () => {
      alive = false
    }
  }, [demo])

  if (!s.ready || !armed) return <LoadingScreen />

  const run = s.run
  if (!run || !run.chosen.length) {
    const working = s.studio?.status === "running" && studioAlive()
    return working ? (
      <EmptyScreen title="Still picking your 8." line="Watch 20 kinds of buyers get cut to 8." href="/studio" action="Open the Studio" />
    ) : (
      <EmptyScreen title="No hunches yet." line="Type what you sell to get 8 kinds of buyers." href="/start" action="Go to Start" />
    )
  }

  return <Buyers run={run} />
}
