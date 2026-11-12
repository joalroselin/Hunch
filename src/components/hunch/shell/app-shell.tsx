"use client"

import * as React from "react"
import { Suspense, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { MotionConfig } from "framer-motion"

import { useHunch } from "@/lib/hunch/store"
import type { Mode } from "@/lib/hunch/types"

import { StepBarSlot } from "./step-action"
import { StepBar, StepIndicator, StepMenu, useCameFrom } from "./step-indicator"
import { isEmpty, stepIndex, stepKey, type StepId } from "./steps"
import { Wordmark } from "./wordmark"

// Latched in render: screens strip ?demo=1 in their own effects, which run before the shell's.
function DemoLatch({ latch }: { latch: { current: boolean } }) {
  const params = useSearchParams()
  if (params?.has("demo")) latch.current = true
  return null
}

export function AppShell({
  step,
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
              <StepMenu current={step} note={null} className="ml-auto lg:hidden" />
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
