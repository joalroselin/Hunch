"use client"

import * as React from "react"
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Dialog } from "radix-ui"

import { EASE_OUT, useReduced } from "@/components/ds/instruments"
import { copyText } from "@/components/hunch/post"
import { LANGUAGES, LANGUAGE_LABEL, captionText, hasLanguage, inLanguage, normalizeLanguage } from "@/lib/hunch/language"
import type { Language, Version } from "@/lib/hunch/types"

import { photoUrlOf, resultsOf, run } from "../data"
import { homeFonts } from "../fonts"
import { LetterRoll } from "../letter-roll"
import { HomePost } from "../ugc-post"
import { Num } from "./num"
import { isRunnerUpDay, unitWord, type SheetItem } from "./data"
import "./sheet.css"

/** Where the opened post sat on the page: center, drawn width and tilt. */
export type Launch = { x: number; y: number; w: number; r: number }

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: SheetItem | null
  dir: number
  launch: Launch | null
  onStep: (delta: number) => void
  onCloseAutoFocus: (e: Event) => void
}

// One mood per post, so stepping through them changes the light.
const FIELDS = ["hh-field-mangga", "hh-field-gumamela", "hh-field-sili", "hh-field-dahon"]
const fieldOf = (item: SheetItem) => FIELDS[(item.index + (item.kind === "version" ? 2 : item.kind === "focus" ? 0 : 1)) % FIELDS.length]

const baseLanguage = normalizeLanguage(run.product.language)

function Arrow({ flip }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden className="ps-ico" style={flip ? { rotate: "180deg" } : undefined}>
      <path d="M11.5 4.5 6 10l5.5 5.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Lifts off gently, travels fast, settles long.
const LIFT = [0.3, 0, 0.1, 1] as const

// The post lifts off the page where it sat and settles into the sheet; the sheet's own phone takes over when it lands.
function Flyer({ launch, phone, version, boosted, onDone }: { launch: Launch; phone: RefObject<HTMLDivElement | null>; version: Version; boosted: boolean; onDone: () => void }) {
  const [box, setBox] = useState<{ left: number; top: number; w: number; x: number; y: number; s: number } | null>(null)
  const done = useRef(onDone)
  done.current = onDone
  useLayoutEffect(() => {
    const el = phone.current
    if (!el?.offsetWidth) return done.current()
    const b = el.getBoundingClientRect()
    const w = el.offsetWidth
    const cx = b.left + b.width / 2
    const cy = b.top + b.height / 2
    setBox({ left: cx - w / 2, top: cy - el.offsetHeight / 2, w, x: launch.x - cx, y: launch.y - cy, s: launch.w / w })
  }, [launch, phone])
  if (!box) return null
  return (
    <motion.div
      aria-hidden
      className="ps-flyer ps-post"
      style={{ left: box.left, top: box.top, width: box.w, "--wpx": `${box.w}px` } as CSSProperties}
      initial={{ x: box.x, y: box.y, scale: box.s, rotate: launch.r }}
      animate={{ x: 0, y: 0, scale: 1, rotate: -3 }}
      transition={{ duration: 0.62, ease: LIFT }}
      onAnimationComplete={() => done.current()}
    >
      <HomePost version={version} boosted={boosted} />
    </motion.div>
  )
}

export function PostSheet({ open, onOpenChange, item, dir, launch, onStep, onCloseAutoFocus }: Props) {
  const reduced = useReduced()
  const contentRef = useRef<HTMLDivElement>(null)
  const wordsRef = useRef<HTMLDivElement>(null)
  const phoneRef = useRef<HTMLDivElement>(null)
  const [lang, setLang] = useState<Language>(baseLanguage)
  const [said, setSaid] = useState("")
  const [landed, setLanded] = useState<Launch | null>(null)
  const id = item?.version.id
  // Opened from a post on the page: the sheet only fades, and the post flies in once; stepping or closing ends the flight.
  const flew = open && !!launch && !reduced
  const flying = flew && landed !== launch

  // A new post starts at its top: the words scroll on wide screens, the whole sheet on phones.
  useEffect(() => {
    wordsRef.current?.scrollTo({ top: 0 })
    contentRef.current?.scrollTo({ top: 0 })
  }, [id])

  useEffect(() => {
    if (!said) return
    const t = window.setTimeout(() => setSaid(""), 2600)
    return () => window.clearTimeout(t)
  }, [said])

  if (!item) return null
  const shownLang = hasLanguage(item.version, lang) ? lang : baseLanguage
  const v = inLanguage(item.version, shownLang)
  const m = item.metrics
  const n = m ? resultsOf(m) : 0
  const photo = photoUrlOf(item.version)
  const field = fieldOf(item)
  const dx = reduced ? 0 : 44
  const underPost = [item.day, item.kind === "focus" && isRunnerUpDay(item.version) ? "Testing the runner-up" : null].filter(Boolean).join(" · ")

  const copy = async () => {
    const ok = await copyText(captionText(v, shownLang))
    setSaid(ok ? "Caption copied." : "Copy blocked. Select the caption and copy it by hand.")
  }

  // Focus the sheet itself, so the arrow keys step posts straight away; the language switch is one Tab away.
  const onOpenAutoFocus = (e: Event) => {
    e.preventDefault()
    contentRef.current?.focus({ preventScroll: true })
  }

  const step = (delta: number) => {
    if (flying) setLanded(launch)
    onStep(delta)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.defaultPrevented || e.altKey || e.metaKey || e.ctrlKey) return
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
    if ((e.target as HTMLElement).closest("input, textarea, [contenteditable='true'], [role='radiogroup']")) return
    e.preventDefault()
    step(e.key === "ArrowRight" ? 1 : -1)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <div className={`hunch-home ps-scope ${homeFonts}`}>
          <Dialog.Overlay className="ps-overlay" />
          <Dialog.Content
            ref={contentRef}
            tabIndex={-1}
            className="ps"
            data-fly={flew ? "" : undefined}
            onKeyDown={onKeyDown}
            onOpenAutoFocus={onOpenAutoFocus}
            onCloseAutoFocus={onCloseAutoFocus}
            aria-describedby="ps-who"
          >
            <div className="ps-bar">
              <div role="radiogroup" aria-label="Language" className="ps-langs">
                {LANGUAGES.map((l) => (
                  <button
                    key={l}
                    type="button"
                    role="radio"
                    aria-checked={shownLang === l}
                    disabled={!hasLanguage(item.version, l)}
                    className="ps-lang"
                    data-label={LANGUAGE_LABEL[l]}
                    onClick={() => setLang(l)}
                  >
                    {LANGUAGE_LABEL[l]}
                  </button>
                ))}
              </div>
              <div className="ps-nav">
                <button type="button" className="ps-round" aria-label="Previous post" onClick={() => step(-1)}>
                  <Arrow />
                </button>
                <button type="button" className="ps-round" aria-label="Next post" onClick={() => step(1)}>
                  <Arrow flip />
                </button>
                <Dialog.Close className="ps-round ps-close" aria-label="Close">
                  <svg viewBox="0 0 20 20" aria-hidden className="ps-ico">
                    <path d="M5 5l10 10M15 5 5 15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                </Dialog.Close>
              </div>
            </div>

            {/* The post, on a field of its own. */}
            <div className="ps-stage">
              <AnimatePresence initial={false}>
                <motion.div
                  key={field}
                  aria-hidden
                  className={`ps-field hh-field hh-grain ${field}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduced ? 0.2 : 0.7, ease: "linear" }}
                />
              </AnimatePresence>
              <div ref={phoneRef} className="ps-phone" data-away={flying ? "" : undefined}>
                <AnimatePresence initial={false} custom={dir} mode="popLayout">
                  <motion.div
                    key={item.version.id}
                    custom={dir}
                    className="ps-post"
                    initial={{ opacity: 0, x: dir * dx, rotate: dir * 3 }}
                    animate={{ opacity: 1, x: 0, rotate: 0, transition: { duration: reduced ? 0.3 : 0.6, ease: EASE_OUT } }}
                    exit={{ opacity: 0, x: -dir * dx, transition: { duration: reduced ? 0.2 : 0.28, ease: EASE_OUT } }}
                  >
                    <HomePost version={v} boosted={item.kind === "version"} />
                  </motion.div>
                </AnimatePresence>
              </div>
              {underPost ? <p className="ps-day">{underPost}</p> : null}
            </div>

            <div ref={wordsRef} className="ps-words">
              <motion.div
                key={item.version.id}
                initial={{ opacity: 0, x: reduced ? 0 : dir * 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: reduced ? 0.3 : 0.5, ease: EASE_OUT, delay: flying ? 0.16 : 0 }}
              >
                <Dialog.Title className="hh-title ps-title">{item.audience.name}</Dialog.Title>
                <p id="ps-who" className="hh-line ps-who">
                  {item.audience.who}
                </p>

                {m ? (
                  <p className="ps-result">
                    <span>
                      <Num value={n > 0 ? n : "No"} /> {unitWord(n)}
                    </span>
                  </p>
                ) : null}

                <h3 className="ps-h">The caption</h3>
                <p className="ps-caption">{v.caption}</p>
                {v.hashtags.length ? <p className="ps-tags">{v.hashtags.join(" ")}</p> : null}

                <div className="ps-actions">
                  <button type="button" className="hh-pill group" onClick={copy}>
                    <LetterRoll text="Copy the caption" />
                  </button>
                  {photo ? (
                    <a className="ps-save" href={photo} download={`${run.product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${item.version.code}.jpg`}>
                      Save the image
                    </a>
                  ) : null}
                </div>

                {item.rejected ? (
                  <div className="ps-draft">
                    <h3 className="ps-h">First draft, sent back</h3>
                    <p className="ps-draft-hook">{item.rejected.draft.hook}</p>
                    {item.rejected.reasons.map((r, i) => (
                      <p key={i} className="ps-reason">
                        {r.note}
                      </p>
                    ))}
                  </div>
                ) : null}
              </motion.div>
            </div>

            <p role="status" aria-live="polite" className="ps-toast" data-on={said ? "" : undefined}>
              {said}
            </p>
          </Dialog.Content>
          {flying && launch ? (
            <Flyer launch={launch} phone={phoneRef} version={v} boosted={item.kind === "version"} onDone={() => setLanded(launch)} />
          ) : null}
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
