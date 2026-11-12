"use client"

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLoadedPhotos } from "@/components/hunch/post/sample-photos"
import { SAMPLE_PRODUCT, applyDemo, stripDemoParam } from "@/components/hunch/screens/demo"
import { Bubble, LoadingScreen, Screen, ScreenTitle, StepAction } from "@/components/hunch/shell"
import { SAMPLES, sampleKeyFor } from "@/lib/hunch/engine/sample/catalog"
import { getHunch, hunchStore, useHunch } from "@/lib/hunch/store"
import type { Mode } from "@/lib/hunch/types"

import { startStudio } from "../studio/runner"
import { ChannelChips, LanguageToggle } from "./choices"
import { PhotoDrop } from "./photo-drop"
import {
  EMPTY_DRAFT,
  MAX_DESCRIPTION,
  MIN_DESCRIPTION,
  SAMPLE_DRAFT,
  draftFrom,
  isSampleDraft,
  isSampleProduct,
  listWords,
  missing,
  nameFrom,
  toProduct,
  type Draft,
} from "./product"
import "./start.css"

const DRAFT_KEY = "hunch.start.draft"

// Elle's photo, shown in the phone while her sample fills the form.
const SAMPLE_PHOTO = `${SAMPLES.candles.photoDir}/${SAMPLES.candles.photos.A3}`

const handleOf = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20) || "yourshop"
const firstSentence = (text: string) => text.split(/(?<=[.!?])\s+/)[0]?.trim() ?? ""

function readDraft(): Draft | null {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY)
    return raw ? { ...EMPTY_DRAFT, ...(JSON.parse(raw) as Partial<Draft>) } : null
  } catch {
    return null
  }
}

function saveDraft(d: Draft | null) {
  try {
    if (d) window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d))
    else window.sessionStorage.removeItem(DRAFT_KEY)
  } catch {}
}

export function StartScreen({ prefill, demo, serverMode }: { prefill?: string; demo: boolean; serverMode: Mode }) {
  const s = useHunch()
  const [armed, setArmed] = useState(!demo)

  useEffect(() => {
    if (!demo) return
    let alive = true
    applyDemo("studio").finally(() => {
      if (!alive) return
      stripDemoParam()
      setArmed(true)
    })
    return () => {
      alive = false
    }
  }, [demo])

  if (!s.ready || !armed) return <LoadingScreen />
  return <StartForm prefill={prefill} demo={demo} serverMode={serverMode} />
}

function initialDraft(prefill: string | undefined, demo: boolean): Draft {
  if (demo) return SAMPLE_DRAFT
  const draft = readDraft()
  // A blank draft never hides a saved product.
  const saved = draft && (draft.description.trim() || draft.channels.length || draft.price) ? draft : null
  const product = getHunch().product
  const base = saved ?? (product && !isSampleProduct(product) ? draftFrom(product) : EMPTY_DRAFT)
  const d = prefill?.replace(/\s+/g, " ").trim()
  return d ? { ...base, description: d.slice(0, MAX_DESCRIPTION) } : base
}

function StartForm({ prefill, demo, serverMode }: { prefill?: string; demo: boolean; serverMode: Mode }) {
  const router = useRouter()
  const { photo } = useHunch()
  const [draft, setDraft] = useState<Draft>(() => initialDraft(prefill, demo))
  const [sending, setSending] = useState(false)
  const [tip, setTip] = useState<string | null>(null)
  const whatRef = useRef<HTMLTextAreaElement>(null)
  useLoadedPhotos([SAMPLE_PHOTO])

  // The front page box hands its line over as ?d=; after reading it, the draft carries it across refreshes.
  useEffect(() => {
    if (!prefill) return
    try {
      const url = new URL(window.location.href)
      url.searchParams.delete("d")
      window.history.replaceState(null, "", url.pathname + url.search + url.hash)
    } catch {}
  }, [prefill])

  useEffect(() => {
    saveDraft(draft)
  }, [draft])

  useEffect(() => {
    router.prefetch("/studio")
  }, [router])

  useEffect(() => {
    if (!tip) return
    const t = window.setTimeout(() => setTip(null), 3200)
    return () => window.clearTimeout(t)
  }, [tip])

  const sample = isSampleDraft(draft)
  const needs = missing(draft, !!photo)
  const ready = sample || needs.length === 0
  const left = MAX_DESCRIPTION - draft.description.length
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setDraft((d) => ({ ...d, [k]: v }))
    if (tip) setTip(null)
  }

  function trySample() {
    if (sending) return
    setSending(true)
    hunchStore.fill({ photo: null })
    startStudio({ ...SAMPLE_PRODUCT }, { replay: true })
    router.push("/studio")
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (sending) return
    if (!ready) {
      // Say what is missing in a bubble over the button and go to the first gap.
      setTip(`Add ${listWords(needs)} first.`)
      if (draft.description.trim().length < MIN_DESCRIPTION) whatRef.current?.focus()
      else document.getElementById(photo ? "start-channel" : "start-photo")?.focus()
      return
    }
    if (sample) return trySample()
    setSending(true)
    startStudio(toProduct(draft), { replay: serverMode === "sample" })
    saveDraft(null)
    router.push("/studio")
  }

  const note = sample
    ? "Elle's sample. It runs without your photo."
    : serverMode === "sample"
      ? `Sample run of ${SAMPLES[sampleKeyFor({ description: draft.description })].name}. Your product's name and price go into it.`
      : "Nothing is posted for you."

  const what = draft.description.replace(/\s+/g, " ").trim()
  const post = {
    handle: handleOf(sample ? SAMPLE_PRODUCT.name : what ? nameFrom(what) : ""),
    caption: firstSentence(what) || "Your caption goes here.",
    price: draft.price ? `₱${Number(draft.price).toLocaleString("en-PH")}` : undefined,
  }

  return (
    <Screen aria-label="Your product">
      <div className="hs">
        <div className="hs-main">
          <ScreenTitle title="Type what you sell." line="Add a photo, a price and where you sell." />

          <form id="start-form" noValidate onSubmit={submit} className="hs-form">
            <div className="hs-what ha-rise" style={{ "--i": 5 } as React.CSSProperties}>
              <label htmlFor="start-description" className="sr-only">
                What do you sell?
              </label>
              <textarea
                ref={whatRef}
                id="start-description"
                value={draft.description}
                onChange={(e) => set("description", e.target.value.slice(0, MAX_DESCRIPTION))}
                maxLength={MAX_DESCRIPTION}
                enterKeyHint="go"
                onKeyDown={(e) => {
                  // Enter sends, like the box on the front page. Shift+Enter adds a line.
                  if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return
                  e.preventDefault()
                  e.currentTarget.form?.requestSubmit()
                }}
                rows={2}
                placeholder="Soy candles poured at home, ₱350 a jar"
                aria-describedby={left <= 40 ? "start-description-left" : undefined}
                className="ha-field ha-field-lg"
              />
              {left <= 40 ? (
                <span id="start-description-left" aria-live="polite" className="hs-left">
                  {left} left<span className="sr-only"> of {MAX_DESCRIPTION} characters</span>
                </span>
              ) : null}
            </div>

            <div className="hs-group ha-rise" style={{ "--i": 6 } as React.CSSProperties}>
              <p id="start-channels" className="ha-label">
                Where you sell
              </p>
              <ChannelChips value={draft.channels} onChange={(v) => set("channels", v)} labelId="start-channels" firstId="start-channel" />
            </div>

            <div className="hs-pair ha-rise" style={{ "--i": 7 } as React.CSSProperties}>
              <div className="hs-group">
                <label htmlFor="start-price" className="ha-label">
                  Price per piece
                </label>
                <div className="hs-price">
                  <span aria-hidden>₱</span>
                  <Input
                    id="start-price"
                    inputMode="numeric"
                    autoComplete="off"
                    value={draft.price}
                    onChange={(e) => set("price", e.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 6))}
                    placeholder="350"
                  />
                </div>
              </div>
              <div className="hs-group">
                <p id="start-language" className="ha-label">
                  Post language
                </p>
                <LanguageToggle value={draft.language} onChange={(v) => set("language", v)} labelId="start-language" />
              </div>
            </div>

            <div className="hs-send ha-rise" style={{ "--i": 8 } as React.CSSProperties}>
              <StepAction>
                <span className="hs-go">
                  {tip ? (
                    <Bubble aria-hidden className="hs-tip md:hidden">
                      {tip}
                    </Bubble>
                  ) : null}
                  <Button type="submit" form="start-form" variant="go" size="lg" className="w-full md:w-auto" disabled={sending} aria-busy={sending || undefined}>
                    Write my 8 posts
                  </Button>
                </span>
              </StepAction>
              {tip ? (
                <Bubble aria-hidden className="max-md:hidden">
                  {tip}
                </Bubble>
              ) : null}
              <p className={tip ? "ha-note md:hidden" : "ha-note"}>
                {note}
                {sample ? null : (
                  <>
                    {" "}
                    <button type="button" onClick={trySample} disabled={sending} className="ha-link">
                      Run Elle&rsquo;s sample
                    </button>
                  </>
                )}
              </p>
            </div>
            <span role="status" aria-live="polite" className="sr-only">
              {tip ?? ""}
            </span>
          </form>
        </div>

        <PhotoDrop id="start-photo" photo={photo} onPhoto={(url) => hunchStore.setPhoto(url)} post={post} sample={sample ? SAMPLE_PHOTO : undefined} />
      </div>
    </Screen>
  )
}
