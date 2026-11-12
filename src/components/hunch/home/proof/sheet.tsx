"use client"

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Dialog } from "radix-ui"

import { EASE_OUT, useReduced } from "@/components/ds/instruments"
import { copyText } from "@/components/hunch/post"
import { LANGUAGES, LANGUAGE_LABEL, captionText, hasLanguage, inLanguage, normalizeLanguage } from "@/lib/hunch/language"
import type { Language } from "@/lib/hunch/types"

import { photoUrlOf, resultsOf, run } from "../data"
import { homeFonts } from "../fonts"
import { LetterRoll } from "../letter-roll"
import { HomePost } from "../ugc-post"
import { Num } from "./num"
import { isRunnerUpDay, unitWord, type SheetItem } from "./data"
import "./sheet.css"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: SheetItem | null
  dir: number
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

export function PostSheet({ open, onOpenChange, item, dir, onStep, onCloseAutoFocus }: Props) {
  const reduced = useReduced()
  const wordsRef = useRef<HTMLDivElement>(null)
  const [lang, setLang] = useState<Language>(baseLanguage)
  const [said, setSaid] = useState("")
  const id = item?.version.id

  useEffect(() => {
    wordsRef.current?.scrollTo({ top: 0 })
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

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.defaultPrevented || e.altKey || e.metaKey || e.ctrlKey) return
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
    if ((e.target as HTMLElement).closest("input, textarea, [contenteditable='true'], [role='radiogroup']")) return
    e.preventDefault()
    onStep(e.key === "ArrowRight" ? 1 : -1)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <div className={`hunch-home ps-scope ${homeFonts}`}>
          <Dialog.Overlay className="ps-overlay" />
          <Dialog.Content className="ps" onKeyDown={onKeyDown} onCloseAutoFocus={onCloseAutoFocus} aria-describedby="ps-who">
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
                    onClick={() => setLang(l)}
                  >
                    {LANGUAGE_LABEL[l]}
                  </button>
                ))}
              </div>
              <div className="ps-nav">
                <button type="button" className="ps-round" aria-label="Previous post" onClick={() => onStep(-1)}>
                  <Arrow />
                </button>
                <button type="button" className="ps-round" aria-label="Next post" onClick={() => onStep(1)}>
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
              <div className="ps-phone">
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
                transition={{ duration: reduced ? 0.3 : 0.5, ease: EASE_OUT }}
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
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
