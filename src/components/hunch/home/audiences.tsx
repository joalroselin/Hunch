"use client"

import * as React from "react"
import { motion, useInView, useScroll, useTransform } from "framer-motion"

import { useReduced, useSeen } from "@/components/ds/instruments"
import { lowerFirst } from "@/components/hunch/screens/shared"

import { chosenIds, run, versionByAudience } from "./data"
import { LetterRoll } from "./letter-roll"
import { usePostSheet } from "./post-sheet"
import { easeOut, useMoving } from "./scroll/film"
import { RiseWords, useLoop } from "./story/shared"
import { HomePost } from "./ugc-post"

const picked = run.chosen.filter((a) => versionByAudience.has(a.id))
const everyone = run.candidates
const cutReason = new Map((run.cuts ?? []).map((c) => [c.id, c.reason]))
const cutCount = everyone.length - picked.length

type Mode = "all" | "picked"
type Cut = { id: string; top: number; left: number; width: number }

const Phone = React.memo(function Phone({ id, front }: { id: string; front: boolean }) {
  const v = versionByAudience.get(id)
  return v ? <HomePost version={v} boosted={front} /> : null
})

export function Audiences() {
  const reduced = useReduced()
  const sheet = usePostSheet()
  const show = React.useRef<HTMLDivElement>(null)
  const list = React.useRef<HTMLDivElement>(null)
  const seen = useSeen(list, 0.06)
  const { on: live } = useLoop(show, 0.4)
  const reading = useInView(list, { amount: 0.5 })
  // The posts that flew out of the hero come back from in front and land as one deck.
  const moving = useMoving()
  const { scrollYProgress: gather } = useScroll({ target: show, offset: ["start end", "start 0.38"] })
  const deckScale = useTransform(gather, [0, 1], [1.5, 1], { ease: easeOut })
  const deckTurn = useTransform(gather, [0, 1], [12, 0], { ease: easeOut })
  const deckY = useTransform(gather, [0, 1], [150, 0], { ease: easeOut })
  const deckIn = useTransform(gather, [0.05, 0.5], [0, 1])
  const [mode, setMode] = React.useState<Mode>("all")
  const [leaving, setLeaving] = React.useState(false)
  const [sel, setSel] = React.useState(0)
  const [held, setHeld] = React.useState(false)
  const [hover, setHover] = React.useState(false)
  const [cut, setCut] = React.useState<Cut | null>(null)
  const touched = React.useRef(false)

  const swap = React.useCallback(
    (next: Mode) => {
      setCut(null)
      if (reduced) return setMode(next)
      setLeaving(true)
      window.setTimeout(() => {
        setMode(next)
        setLeaving(false)
      }, 260)
    },
    [reduced]
  )

  // Once the 12 are struck, the list settles on the 8 that stay.
  React.useEffect(() => {
    if (!reading || reduced || cutCount === 0 || mode !== "all" || touched.current) return
    const t = window.setTimeout(() => {
      if (!touched.current) swap("picked")
    }, 5200)
    return () => window.clearTimeout(t)
  }, [reading, reduced, swap, mode])

  React.useEffect(() => {
    if (!live || held || hover || picked.length < 2) return
    const t = window.setInterval(() => setSel((s) => (s + 1) % picked.length), 3800)
    return () => window.clearInterval(t)
  }, [live, held, hover])

  if (picked.length === 0) {
    return (
      <section id="audiences" className="sy-buyers">
        <p className="hh-line sy-support">No buyers yet. Type what you sell.</p>
      </section>
    )
  }

  const names = mode === "all" ? everyone : picked
  const active = picked[sel] ?? picked[0]

  const showCut = (id: string, el: HTMLElement) => {
    const box = list.current
    if (!box) return
    const r = el.getBoundingClientRect()
    const b = box.getBoundingClientRect()
    const width = Math.min(360, b.width)
    setCut({ id, top: r.bottom - b.top + 10, left: Math.max(0, Math.min(r.left - b.left, b.width - width)), width })
  }

  return (
    <section id="audiences" aria-labelledby="audiences-title" className="sy-buyers">
      <div className="sy-buyers-head">
        <RiseWords id="audiences-title" parts={[{ text: "Who buys scented candles? Maybe…" }]} className="hh-title sy-h" />
      </div>

      <div className="sy-buyers-body">
        <div ref={list} className="sy-list" onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)}>
          <ul key={mode} className="sy-names" data-mode={mode} data-seen={seen ? "" : undefined} data-leaving={leaving ? "" : undefined}>
            {names.map((a, i) => {
              const isCut = !chosenIds.has(a.id)
              const on = !isCut && a.id === active?.id
              return (
                <li key={a.id} style={{ "--i": i } as React.CSSProperties}>
                  {isCut ? (
                    <button
                      type="button"
                      className="sy-name"
                      data-cut=""
                      aria-expanded={cut?.id === a.id}
                      aria-describedby={cut?.id === a.id ? "sy-cut" : undefined}
                      onPointerEnter={(e) => e.pointerType === "mouse" && showCut(a.id, e.currentTarget)}
                      onPointerLeave={(e) => e.pointerType === "mouse" && setCut(null)}
                      onFocus={(e) => showCut(a.id, e.currentTarget)}
                      onBlur={() => setCut(null)}
                      onClick={(e) => showCut(a.id, e.currentTarget)}
                    >
                      <span className="sy-ink">{a.name}.</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="sy-name"
                      data-on={on ? "" : undefined}
                      aria-pressed={on}
                      onClick={() => {
                        touched.current = true
                        setHeld(true)
                        setSel(picked.findIndex((p) => p.id === a.id))
                      }}
                    >
                      <span className="sy-ink">{a.name}.</span>
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
          {cut ? (
            <p key={cut.id} id="sy-cut" role="status" className="sy-cut" style={{ top: cut.top, left: cut.left, width: cut.width }}>
              {cutReason.get(cut.id) ?? "Not picked for this test."}
            </p>
          ) : null}
          {cutCount > 0 ? (
            <button
              type="button"
              className="hh-pill sy-toggle group"
              onClick={() => {
                touched.current = true
                swap(mode === "all" ? "picked" : "all")
              }}
            >
              <LetterRoll text={mode === "all" ? `Show the ${picked.length}` : `Show all ${everyone.length}`} />
            </button>
          ) : null}
        </div>

        <div ref={show} className="sy-show" data-seen={seen ? "" : undefined} onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)}>
          <motion.div className="sy-deck" style={moving ? { scale: deckScale, rotate: deckTurn, y: deckY, opacity: deckIn } : undefined}>
            {picked.map((a, i) => {
              const d = (i - sel + picked.length) % picked.length
              const role = d === 0 ? "front" : d === 1 ? "next" : d === picked.length - 1 ? "prev" : "rest"
              const front = role === "front"
              return (
                <button
                  key={a.id}
                  type="button"
                  className="sy-card"
                  data-role={role}
                  tabIndex={front ? 0 : -1}
                  aria-hidden={front ? undefined : true}
                  aria-label={`Open the post for ${lowerFirst(a.name)}`}
                  onClick={() => {
                    if (front) return sheet.open(versionByAudience.get(a.id)?.id ?? a.id)
                    touched.current = true
                    setHeld(true)
                    setSel(i)
                  }}
                >
                  <Phone id={a.id} front={front} />
                </button>
              )
            })}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
