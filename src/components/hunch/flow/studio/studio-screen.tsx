"use client"

import * as React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"

import { useReduced } from "@/components/ds/instruments"
import { Button, GoLink } from "@/components/ui/button"
import { SAMPLE_PRODUCT, stripDemoParam } from "@/components/hunch/screens/demo"
import { EmptyScreen, LoadingScreen, Screen, ScreenTitle, StepAction } from "@/components/hunch/shell"
import { errorText } from "@/lib/hunch/client"
import { SAMPLES, sampleKeyFor } from "@/lib/hunch/engine/sample/catalog"
import { studioFromRun, type StudioState } from "@/lib/hunch/studio"
import { hunchStore, useHunch } from "@/lib/hunch/store"
import type { Mode } from "@/lib/hunch/types"

import { notifyError } from "../shared/share"
import { sampleNote, usePostLook } from "../posts/run-post"
import { Fan, Team, Thread } from "./chat-parts"
import { buildChat, landed, spoke, typingNow } from "./chat"
import { deriveView, liveLine } from "./derive"
import { isSampleSeller, retryCard, skipStudio, startStudio, studioAlive, useRunner } from "./runner"
import "./studio.css"

// The seller sees the agent's plain line, not the validation details behind it.
function plainError(studio: StudioState) {
  const step = [...studio.events].reverse().find((e) => e.kind === "step_failed" && !/^A\d$/.test(e.refId ?? ""))
  if (step) return `${step.text} Try again. If it keeps stopping, add a little more detail to the description.`
  const msg = studio.error?.trim()
  return msg && msg.length <= 160 ? msg : "Something broke while making the posts. Try again."
}

export function StudioScreen({ demo, serverMode }: { demo: boolean; serverMode: Mode }) {
  const s = useHunch()
  const runner = useRunner()
  const reduced = useReduced()
  const started = useRef(false)
  const [armed, setArmed] = useState(!demo)

  // ?demo=1 plays Elle's saved candle run from the top.
  useEffect(() => {
    if (!demo || started.current) return
    started.current = true
    hunchStore.fill({ photo: null })
    startStudio({ ...SAMPLE_PRODUCT }, { replay: true })
    stripDemoParam()
    setArmed(true)
  }, [demo])

  // Hidden shortcut for the stage: Shift + Right arrow jumps to the end of a replay.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.shiftKey || e.key !== "ArrowRight") return
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
      skipStudio()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const fromRun = useMemo(() => (s.run ? studioFromRun(s.run) : null), [s.run])
  const studio: StudioState | null = s.studio && s.studio.status !== "done" ? s.studio : (fromRun ?? s.studio)
  const view = useMemo(() => (studio ? deriveView(studio) : null), [studio])

  const product = s.product ?? s.run?.product ?? null
  const replay = (s.run?.mode ?? runner.mode) === "sample" || !!studio?.events[0]?.detail?.startsWith("Sample")
  const look = usePostLook(s, replay)
  const msgs = useMemo(() => (studio && view ? buildChat(studio, view, product?.description) : []), [studio, view, product?.description])
  const done = useMemo(() => (studio ? landed(studio.events) : []), [studio])
  const active = useMemo(() => spoke(studio?.events ?? []), [studio])

  const running = !!studio && studio.status === "running" && studioAlive()
  const typing = view ? typingNow(view, running) : []

  // The page follows the newest message until the seller scrolls away from it.
  const endRef = useRef<HTMLLIElement>(null)
  const follow = useRef(true)
  const auto = useRef(0)
  const wasRunning = useRef(false)
  useEffect(() => {
    const near = () => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 160
    const onScroll = () => {
      if (performance.now() < auto.current) return
      follow.current = near()
    }
    const onTouch = () => {
      auto.current = 0
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("wheel", onTouch, { passive: true })
    window.addEventListener("touchmove", onTouch, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("wheel", onTouch)
      window.removeEventListener("touchmove", onTouch)
    }
  }, [])
  const beat = `${msgs.length}:${view?.candidates.length ?? 0}:${typing.join()}:${done.length}`
  useEffect(() => {
    const live = running || wasRunning.current
    wasRunning.current = running
    const end = endRef.current
    if (!live || !follow.current || !end) return
    const top = Math.round(end.getBoundingClientRect().bottom + window.scrollY - window.innerHeight + 96)
    if (top <= window.scrollY + 4) return
    auto.current = performance.now() + 700
    window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" })
  }, [beat, running, reduced])

  // A finished run opened later is a transcript: it arrives once, in one stagger.
  const [settled] = useState(() => !demo && !studioAlive())

  if (!s.ready || !armed) return <LoadingScreen />
  if (!studio || !view) return <EmptyScreen title="No posts yet." line="Type what you sell to get 8 posts." href="/start" action="Go to Start" />

  const stopped = studio.status === "failed" || studio.status === "interrupted" || (studio.status === "running" && !studioAlive())
  const ready = !!s.run && view.ready && !stopped
  const line = stopped && studio.status === "running" ? "The run was cut short." : liveLine(studio, view)
  const canRetry = !replay && !stopped
  const sampleInfo = SAMPLES[sampleKeyFor(product ?? undefined)]
  const note = sampleNote(s.run) ?? (replay && product && !isSampleSeller(product) ? `Sample run of ${sampleInfo.name}. Your product's name and price go into it.` : null)
  const stopMessage = !stopped
    ? null
    : studio.status === "failed"
      ? plainError(studio)
      : "The page was refreshed before the posts were done. Your product is saved, so you can run it again."

  const restart = () => {
    if (!product) return
    follow.current = true
    startStudio(product, { replay: isSampleSeller(product) || serverMode === "sample" })
  }

  const onRetry = async (code: string) => {
    const w = view.writing.find((x) => x.code === code)
    const audience = w?.audience ?? s.run?.chosen.find((a) => a.code === code)
    if (!audience) return
    try {
      await retryCard(code, audience)
    } catch (e) {
      notifyError(errorText(e, "This post was not written. Try again."))
    }
  }

  return (
    <Screen aria-label="Studio">
      <div className="hc">
        <div className="hc-side">
          <div id="studio-line" className="hc-head" data-live={running ? "" : undefined}>
            <ScreenTitle key={line} title={line} />
            <p className="sr-only" aria-live="polite">
              {line}
            </p>
          </div>
          <Team active={active} typing={typing} />
          <Fan codes={done} look={look} />
          <div className="hc-next">
            {ready ? (
              <StepAction>
                <GoLink href="/audiences" className="w-full md:w-auto">
                  See your 8 hunches
                </GoLink>
              </StepAction>
            ) : stopped ? (
              <>
                <StepAction>
                  <Button size="lg" className="w-full md:w-auto" onClick={restart} disabled={!product}>
                    Try again
                  </Button>
                </StepAction>
                <Link href="/start" className="ha-link text-[15px]">
                  Change the product
                </Link>
              </>
            ) : null}
            {note && !stopped ? <p className="ha-note">{note}</p> : null}
          </div>
        </div>

        <Thread
          msgs={msgs}
          typing={typing}
          look={look}
          photo={s.photo}
          settled={settled}
          stopped={stopMessage}
          retry={{
            can: (code) => canRetry && view.writing.find((w) => w.code === code)?.status === "failed",
            busy: runner.retrying,
            run: onRetry,
          }}
          endRef={endRef}
        />
      </div>
    </Screen>
  )
}
