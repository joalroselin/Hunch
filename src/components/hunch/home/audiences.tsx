"use client"

import * as React from "react"
import { motion, useInView, useScroll, useTransform } from "framer-motion"

import { useReduced, useSeen } from "@/components/ds/instruments"
import { lowerFirst } from "@/components/hunch/screens/shared"

import { chosenIds, run, versionByAudience } from "./data"
import { LetterRoll } from "./letter-roll"
import { usePostSheet } from "./post-sheet"
import { easeOut, useMoving, useNarrow } from "./scroll/film"
import { RiseWords, useLoop } from "./story/shared"
import { HomePost } from "./ugc-post"

const picked = run.chosen.filter((a) => versionByAudience.has(a.id))
const everyone = run.candidates
const cutReason = new Map((run.cuts ?? []).map((c) => [c.id, c.reason]))
const cutCount = everyone.length - picked.length
// The data uses straight quotes; set them curly.
const curly = (s: string) => s.replace(/(\w)'(\w)/g, "$1’$2").replace(/'([^']*)'/g, "‘$1’").replace(/'/g, "’")

type Mode = "all" | "picked"
type Cut = { id: string; top: number; left: number; width: number }
type Snap = { names: Map<string, DOMRect>; font: number; pill: DOMRect | null; show: DOMRect | null; focus: boolean }

// The settle: the struck names fall away from the bottom up, then the 8 close ranks.
const FALL: KeyframeAnimationOptions = { duration: 300, easing: "cubic-bezier(0.5, 0, 0.75, 0)", fill: "forwards" }
const GLIDE: KeyframeAnimationOptions = { duration: 820, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }

const Phone = React.memo(function Phone({ id, front }: { id: string; front: boolean }) {
  const v = versionByAudience.get(id)
  return v ? <HomePost version={v} boosted={front} /> : null
})

export function Audiences() {
  const reduced = useReduced()
  const sheet = usePostSheet()
  const show = React.useRef<HTMLDivElement>(null)
  const list = React.useRef<HTMLDivElement>(null)
  const names = React.useRef<HTMLUListElement>(null)
  const pill = React.useRef<HTMLButtonElement>(null)
  const seen = useSeen(list, 0.06)
  const { on: live } = useLoop(show, 0.4)
  const reading = useInView(list, { amount: 0.5 })
  const listIn = useInView(list)
  const deckOn = useInView(show, { amount: 0.05 })
  const narrow = useNarrow()
  // The posts that flew out of the hero come back from in front and land as one deck, opaque from the first pixel.
  const moving = useMoving()
  const { scrollYProgress: gather } = useScroll({ target: show, offset: ["start end", "start 0.38"] })
  const deckScale = useTransform(gather, [0, 1], [1.5, 1], { ease: easeOut })
  const deckTurn = useTransform(gather, [0, 1], [12, 0], { ease: easeOut })
  const deckY = useTransform(gather, [0, 1], [150, 0], { ease: easeOut })
  const deckIn = useTransform(gather, [0, 0.12], [0, 1])
  const lineIn = useTransform(gather, [0.55, 0.95], [0, 1])
  const [mode, setMode] = React.useState<Mode>("all")
  const [settled, setSettled] = React.useState(false)
  const [sel, setSel] = React.useState(0)
  const [held, setHeld] = React.useState(false)
  const [hover, setHover] = React.useState(false)
  const [cut, setCut] = React.useState<Cut | null>(null)
  const touched = React.useRef(false)
  const busy = React.useRef(false)
  const first = React.useRef<Snap | null>(null)
  const peek = React.useRef(0)
  const shut = React.useRef(0)
  const anchor = React.useRef(0)
  const pointer = React.useRef("mouse")

  // Where things are now, so the next layout can glide from here.
  const snap = React.useCallback((): Snap | null => {
    const ul = names.current
    if (!ul) return null
    const m = new Map<string, DOMRect>()
    ul.querySelectorAll<HTMLElement>("li[data-id]:not([data-cut])").forEach((li) => m.set(li.dataset.id ?? "", li.getBoundingClientRect()))
    return {
      names: m,
      font: parseFloat(getComputedStyle(ul).fontSize),
      pill: pill.current?.getBoundingClientRect() ?? null,
      show: show.current?.getBoundingClientRect() ?? null,
      focus: !!list.current?.contains(document.activeElement),
    }
  }, [])

  const swap = React.useCallback(
    (next: Mode) => {
      setCut(null)
      const ul = names.current
      if (busy.current || !ul) return
      if (reduced) return setMode(next)
      const commit = () => {
        first.current = snap()
        // The page holds still while the list changes height; the glide does the moving.
        const root = document.documentElement
        root.style.overflowAnchor = "none"
        window.clearTimeout(anchor.current)
        anchor.current = window.setTimeout(() => (root.style.overflowAnchor = ""), 1500)
        setSettled(true)
        setMode(next)
      }
      if (next === "all") return commit()
      busy.current = true
      const gone = Array.from(ul.querySelectorAll<HTMLElement>("li[data-cut]"))
      const falls = gone.map((li, k) =>
        li.animate(
          [
            { opacity: 1, transform: "none", filter: "blur(0px)" },
            { opacity: 0, transform: "translate3d(0, 6px, 0)", filter: "blur(4px)" },
          ],
          { ...FALL, delay: (gone.length - 1 - k) * 22 }
        )
      )
      Promise.all(falls.map((a) => a.finished))
        .then(commit, commit)
        .finally(() => (busy.current = false))
    },
    [reduced, snap]
  )

  // The glide: every name that stays, the pill and the deck travel from where they were.
  React.useLayoutEffect(() => {
    const from = first.current
    first.current = null
    const ul = names.current
    if (!from || !ul) return
    const s = from.font / parseFloat(getComputedStyle(ul).fontSize)
    let k = 0
    ul.querySelectorAll<HTMLElement>("li[data-id]").forEach((li) => {
      const was = from.names.get(li.dataset.id ?? "")
      if (!was) return
      li.getAnimations().forEach((a) => a instanceof CSSAnimation || a.cancel())
      const now = li.getBoundingClientRect()
      li.animate([{ transform: `translate(${was.left - now.left}px, ${was.top - now.top}px) scale(${s})` }, { transform: "none" }], {
        ...GLIDE,
        delay: k++ * 18,
      })
    })
    const glide = (el: HTMLElement | null, was: DOMRect | null) => {
      if (!el || !was) return
      el.getAnimations().forEach((a) => a instanceof CSSAnimation || a.cancel())
      const now = el.getBoundingClientRect()
      const dx = was.left - now.left
      const dy = was.top - now.top
      if (Math.abs(dx) + Math.abs(dy) > 0.5) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], GLIDE)
    }
    glide(pill.current, from.pill)
    glide(show.current, from.show)
    // A name that had focus and left hands it to the pill.
    if (from.focus && !list.current?.contains(document.activeElement)) pill.current?.focus({ preventScroll: true })
  }, [mode])

  // The 8 grow as they settle, up to the size where the longest still fits on one line.
  const ruler = React.useRef<HTMLSpanElement>(null)
  const allSize = React.useRef(0)
  React.useLayoutEffect(() => {
    const box = list.current
    const ul = names.current
    const r = ruler.current
    if (!box || !ul || !r) return
    // Measured at the size itself: the font's optical sizing widens small text.
    const fit = () => {
      const room = box.clientWidth - 2
      const widest = () => Math.max(0, ...Array.from(r.children).map((c) => (c as HTMLElement).offsetWidth))
      let size = 52
      for (let n = 0; n < 3; n++) {
        r.style.fontSize = `${size}px`
        const w = widest()
        if (!w || w <= room) break
        size = Math.floor(((size * room) / w) * 4) / 4
      }
      if (mode === "all") allSize.current = parseFloat(getComputedStyle(ul).fontSize)
      box.style.setProperty("--sy-fit", `${Math.max(allSize.current, size)}px`)
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(box)
    document.fonts?.ready.then(fit)
    return () => ro.disconnect()
  }, [mode])

  // The struck names' full height, held while they show so the settle can ease the space closed.
  React.useLayoutEffect(() => {
    const box = list.current
    const ul = names.current
    if (!box || !ul || mode !== "all") return
    const fit = () => {
      const p = pill.current
      const h = ul.offsetHeight + (p ? p.offsetHeight + parseFloat(getComputedStyle(p).marginTop) : 0)
      box.style.setProperty("--sy-all", `${Math.ceil(h)}px`)
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(ul)
    return () => ro.disconnect()
  }, [mode])

  // Once the 12 are struck, the list settles on the 8 that stay. Never while someone is reading or pointing.
  React.useEffect(() => {
    if (!reading || reduced || cutCount === 0 || mode !== "all" || touched.current || hover || (narrow && deckOn)) return
    const t = window.setTimeout(() => {
      if (!touched.current) swap("picked")
    }, 5200)
    return () => window.clearTimeout(t)
  }, [reading, reduced, swap, mode, hover, narrow, deckOn])

  React.useEffect(() => {
    if (!live || held || hover || picked.length < 2) return
    const t = window.setInterval(() => setSel((s) => (s + 1) % picked.length), 3800)
    return () => window.clearInterval(t)
  }, [live, held, hover])

  // An open reason closes on a tap anywhere else, or once the list is gone.
  React.useEffect(() => {
    if (!cut) return
    const away = (e: PointerEvent) => {
      if (!(e.target instanceof Element && e.target.closest(".sy-name[data-cut]"))) setCut(null)
    }
    window.addEventListener("pointerdown", away)
    return () => window.removeEventListener("pointerdown", away)
  }, [cut])
  React.useEffect(() => {
    if (!listIn) setCut(null)
  }, [listIn])

  React.useEffect(
    () => () => {
      window.clearTimeout(peek.current)
      window.clearTimeout(shut.current)
      window.clearTimeout(anchor.current)
      document.documentElement.style.overflowAnchor = ""
    },
    []
  )

  if (picked.length === 0) {
    return (
      <section id="audiences" className="sy-buyers">
        <p className="hh-line sy-support">No buyers yet. Type what you sell.</p>
      </section>
    )
  }

  const shown = mode === "all" ? everyone : picked
  const active = picked[sel] ?? picked[0]

  const showCut = (id: string, el: HTMLElement) => {
    window.clearTimeout(shut.current)
    const box = list.current
    if (!box) return
    const r = el.getBoundingClientRect()
    const b = box.getBoundingClientRect()
    const width = Math.min(360, b.width)
    setCut({ id, top: r.bottom - b.top + 2, left: Math.max(0, Math.min(r.left - b.left, b.width - width)), width })
  }
  // Moving from one struck name to the next keeps the bubble, so the list does not flicker.
  const closeCut = () => {
    window.clearTimeout(shut.current)
    shut.current = window.setTimeout(() => setCut(null), 90)
  }

  return (
    <section id="audiences" aria-labelledby="audiences-title" className="sy-buyers">
      <div className="sy-buyers-head">
        <RiseWords
          id="audiences-title"
          parts={[
            { text: "Who buys scented candles?", className: "block" },
            { text: "Maybe…", className: "block" },
          ]}
          className="hh-title sy-h"
        />
      </div>

      <div className="sy-buyers-body">
        <div
          ref={list}
          className="sy-list"
          data-mode={mode}
          onPointerEnter={() => setHover(true)}
          onPointerLeave={() => setHover(false)}
          onPointerDownCapture={(e) => (pointer.current = e.pointerType)}
          onFocusCapture={() => (touched.current = true)}
        >
          <ul
            ref={names}
            className="sy-names"
            data-mode={mode}
            data-seen={seen ? "" : undefined}
            data-settled={settled ? "" : undefined}
          >
            {shown.map((a, i) => {
              const isCut = !chosenIds.has(a.id)
              const on = !isCut && a.id === active?.id
              return (
                <li key={a.id} data-id={a.id} data-cut={isCut ? "" : undefined} style={{ "--i": i } as React.CSSProperties}>
                  {isCut ? (
                    <button
                      type="button"
                      className="sy-name"
                      data-cut=""
                      aria-expanded={cut?.id === a.id}
                      aria-describedby={cut?.id === a.id ? "sy-cut" : undefined}
                      onPointerEnter={(e) => e.pointerType === "mouse" && showCut(a.id, e.currentTarget)}
                      onPointerLeave={(e) => e.pointerType === "mouse" && closeCut()}
                      onFocus={(e) => e.currentTarget.matches(":focus-visible") && showCut(a.id, e.currentTarget)}
                      onBlur={() => setCut(null)}
                      onClick={(e) => {
                        if (pointer.current !== "mouse" && cut?.id === a.id) setCut(null)
                        else showCut(a.id, e.currentTarget)
                      }}
                    >
                      <span className="sy-ink">{a.name}.</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="sy-name"
                      data-on={on ? "" : undefined}
                      aria-pressed={on}
                      onPointerEnter={(e) => {
                        if (e.pointerType !== "mouse") return
                        window.clearTimeout(peek.current)
                        const k = picked.findIndex((p) => p.id === a.id)
                        peek.current = window.setTimeout(() => setSel(k), 120)
                      }}
                      onPointerLeave={() => window.clearTimeout(peek.current)}
                      onClick={() => {
                        window.clearTimeout(peek.current)
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
          <span ref={ruler} aria-hidden className="sy-ruler">
            {picked.map((a) => (
              <span key={a.id}>{a.name}.</span>
            ))}
          </span>
          {cut ? (
            <p key={cut.id} id="sy-cut" role="status" className="sy-cut" style={{ top: cut.top, left: cut.left, width: cut.width }}>
              {curly(cutReason.get(cut.id) ?? "Not picked for this test.")}
            </p>
          ) : null}
          {cutCount > 0 ? (
            <button
              ref={pill}
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

        <div
          ref={show}
          className="sy-show"
          data-seen={seen || moving ? "" : undefined}
          onPointerEnter={() => setHover(true)}
          onPointerLeave={() => setHover(false)}
        >
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
          {/* The lit buyer's moment. All of them share one cell, so the deck never shifts. */}
          <motion.p className="hh-line sy-moment" aria-live={held ? "polite" : "off"} style={moving ? { opacity: lineIn } : undefined}>
            {picked.map((a) => (
              <span key={a.id} data-on={a.id === active?.id ? "" : undefined}>
                {curly(a.situation)}
              </span>
            ))}
          </motion.p>
        </div>
      </div>
    </section>
  )
}
