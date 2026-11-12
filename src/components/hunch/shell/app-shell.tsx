"use client"

import * as React from "react"
import { Suspense, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { MotionConfig } from "framer-motion"

import { useHunch, type HunchState } from "@/lib/hunch/store"
import type { Mode } from "@/lib/hunch/types"

import { StepBarSlot } from "./step-action"
import { StepBar, StepIndicator, StepMenu, useCameFrom } from "./step-indicator"
import { isEmpty, stepIndex, stepKey, type StepId, type StepKey } from "./steps"
import { Wordmark } from "./wordmark"

type Badge = "Sample data" | "Sample run" | null

// Latched in render: screens strip ?demo=1 in their own effects, which run before the shell's.
function DemoLatch({ latch }: { latch: { current: boolean } }) {
  const params = useSearchParams()
  if (params?.has("demo")) latch.current = true
  return null
}

// Sample results on screen read "Sample data"; a sample seller's replayed run reads "Sample run".
function badgeFor(step: StepKey, s: HunchState, serverMode: Mode): Badge {
  if (!s.ready) return serverMode === "sample" ? "Sample run" : null
  // Typed numbers on a sample run are the seller's own, so only sample files count as sample data.
  const sampleReport = !!s.report?.isSample
  if (step === "results" || step === "next-week") {
    if (sampleReport || (step === "next-week" && s.focus?.mode === "sample")) return "Sample data"
    return s.run?.mode === "sample" ? "Sample run" : null
  }
  if (s.run) return s.run.mode === "sample" ? "Sample run" : null
  return serverMode === "sample" ? "Sample run" : null
}

function badgeTitle(badge: Exclude<Badge, null>) {
  return badge === "Sample data" ? "Sample data. No real ads were run." : "Sample run."
}

export function AppShell({
  step,
  serverMode = "live",
  children,
}: {
  step: StepId
  serverMode?: Mode
  children: React.ReactNode
}) {
  const s = useHunch()
  const router = useRouter()
  const key = stepKey(step)
  const [scrolled, setScrolled] = useState(false)
  const [slot, setSlot] = useState<HTMLElement | null>(null)
  const demo = useRef(false)
  const from = useCameFrom(stepIndex(step))

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Nothing saved and no ?demo=1: go back to Start.
  const empty = s.ready && isEmpty(s)
  useEffect(() => {
    if (!empty || key === "start" || demo.current) return
    router.replace("/start")
  }, [empty, key, router])

  const badge = badgeFor(key, s, serverMode)

  return (
    <MotionConfig reducedMotion="user">
      <StepBarSlot.Provider value={slot}>
        {/* Plain first node so Next scrolls to top on navigation. */}
        <div className="min-h-dvh">
          <a href="#main" className="skip-link">
            Skip to content
          </a>
          <header data-solid={scrolled} className="ha-bar">
            <div className="ha-bar-row">
              <Link href="/" aria-label="Hunch, home" className="shrink-0">
                <Wordmark className="ha-wordmark" />
              </Link>
              <StepIndicator current={step} from={from} className="ml-auto hidden lg:block" />
              {badge ? (
                <p title={badgeTitle(badge)} className="ha-label hidden shrink-0 xl:block">
                  {badge}
                </p>
              ) : null}
              <StepMenu current={step} note={badge ? badgeTitle(badge) : null} className="ml-auto lg:hidden" />
            </div>
            <StepBar current={step} from={from} className="lg:hidden" />
          </header>
          <Suspense fallback={null}>
            <DemoLatch latch={demo} />
          </Suspense>
          <main id="main" className="min-h-[calc(100dvh-var(--bar))] pb-36 md:pb-28">
            <div className="animate-route">{children}</div>
          </main>
          {/* Phones: the screen's primary button (see StepAction). Hidden while empty. */}
          <div ref={setSlot} data-step-bar className="ha-dock md:hidden" />
        </div>
      </StepBarSlot.Provider>
    </MotionConfig>
  )
}
