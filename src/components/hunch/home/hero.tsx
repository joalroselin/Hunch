"use client"

import * as React from "react"
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"

import { useReduced } from "@/components/ds/instruments"
import type { Mode } from "@/lib/hunch/types"

import { HeroMark } from "./hero/actors"
import { HeroHeadline, SUPPORT } from "./hero/headline"
import { decideMode, playIntro, playSend, type IntroMode, type Timeline } from "./hero/intro"
import { FlyBys, PostBurst } from "./hero/post-ring"
import { PromptBox } from "./prompt-box"
import "./hero/hero.css"

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect

// The page's own work settles first, so the entrance starts on a quiet main thread with its face and photos ready.
function quiet(hero: HTMLElement): Promise<void> {
  const photos = Array.from(hero.querySelectorAll<HTMLImageElement>(".hx-fly img.ugc-photo, img.hx-win-lead"))
  const loaded = document.readyState === "complete" ? null : new Promise((r) => window.addEventListener("load", r, { once: true }))
  const ready = Promise.all([document.fonts?.ready, loaded, ...photos.map((img) => img.decode?.().catch(() => {}))])
  const settled = Promise.race([ready, new Promise((r) => window.setTimeout(r, 1200))])
  const idle = () =>
    new Promise<void>((r) => {
      if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(() => r(), { timeout: 450 })
      else window.setTimeout(r, 160)
    })
  return settled.then(idle).then(() => new Promise<void>((r) => requestAnimationFrame(() => r())))
}

export function Hero({ serverMode }: { serverMode: Mode }) {
  const heroRef = useRef<HTMLElement>(null)
  const reduced = useReduced()
  const [live, setLive] = useState(false)
  const [typing, setTyping] = useState(false)

  useIsoLayoutEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    const root = hero.closest<HTMLElement>("[data-hx-root]") ?? hero
    let mode = root.getAttribute("data-hx") as IntroMode | null
    if (mode !== "intro" && mode !== "fade" && mode !== "done") mode = decideMode()
    // Nobody would see it: the hero is already scrolled away, or the failsafe has shown the page.
    if (mode === "intro" && (hero.getBoundingClientRect().bottom < window.innerHeight * 0.5 || performance.now() > 5500)) mode = "done"
    root.setAttribute("data-hx", mode)

    // The posts fly out of the mark, so its center is the origin.
    const place = () => {
      const mark = hero.querySelector<HTMLElement>(".hx-mark")
      if (!mark) return
      const h = hero.getBoundingClientRect()
      const c = mark.getBoundingClientRect()
      hero.style.setProperty("--cx", `${c.left + c.width / 2 - h.left}px`)
      hero.style.setProperty("--cy", `${c.top + c.height / 2 - h.top}px`)
    }
    window.addEventListener("resize", place)
    const stop = () => window.removeEventListener("resize", place)

    if (mode === "done") {
      place()
      setLive(true)
      setTyping(true)
      return stop
    }

    if (mode === "fade") {
      place()
      setTyping(true)
      const t = window.setTimeout(() => {
        root.setAttribute("data-hx", "done")
        setLive(true)
      }, 420)
      return () => {
        window.clearTimeout(t)
        stop()
      }
    }

    let tl: Timeline | null = null
    let alive = true
    let skipped = false
    const skip = () => {
      skipped = true
      tl?.rush()
    }
    const events = ["wheel", "keydown", "pointerdown", "touchstart"] as const
    events.forEach((e) => window.addEventListener(e, skip, { passive: true }))
    const unlisten = () => events.forEach((e) => window.removeEventListener(e, skip))

    const begin = (seen: boolean) => {
      document.removeEventListener("visibilitychange", onShow)
      if (!alive) return
      // A tab that was in the background starts at once, before its first visible frame.
      ;(seen ? quiet(hero) : Promise.resolve()).then(() => {
        if (!alive) return
        // Too late to start: the failsafe is about to show the page.
        if (seen && performance.now() > 5600) {
          unlisten()
          root.setAttribute("data-hx", "done")
          place()
          setLive(true)
          setTyping(true)
          return
        }
        tl = playIntro(root, hero, () => alive && setTyping(true))
        if (skipped) tl.rush()
        tl.finished.then(
          () => {
            if (!alive) return
            unlisten()
            root.setAttribute("data-hx", "done")
            tl?.cancel()
            setLive(true)
          },
          () => {}
        )
      })
    }
    // A tab opened in the background waits until it is seen.
    const onShow = () => {
      if (!document.hidden) begin(false)
    }
    if (document.hidden) document.addEventListener("visibilitychange", onShow)
    else begin(true)

    return () => {
      alive = false
      document.removeEventListener("visibilitychange", onShow)
      unlisten()
      tl?.cancel()
      stop()
    }
  }, [])

  // Ambient loops rest while the hero is offscreen.
  useEffect(() => {
    const hero = heroRef.current
    if (!hero || typeof IntersectionObserver === "undefined") return
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) delete hero.dataset.off
      else hero.dataset.off = ""
    })
    io.observe(hero)
    return () => io.disconnect()
  }, [])

  // The mark fills with light as the visitor types, full at about 22 characters.
  const onLength = useCallback((n: number) => {
    const mark = heroRef.current?.querySelector<HTMLElement>(".hx-mark")
    if (!mark) return
    mark.style.setProperty("--level", Math.min(1, n / 22).toFixed(3))
    if (n > 0) mark.dataset.typing = ""
    else delete mark.dataset.typing
  }, [])

  const onSend = useCallback((line: string, from: HTMLElement | null) => {
    const hero = heroRef.current
    return hero ? playSend(hero, from, line) : Promise.resolve()
  }, [])

  return (
    <section ref={heroRef} id="hero" aria-labelledby="hero-title" className="hx-hero">
      <div className="hx-content" data-hx-el="column">
        <HeroMark />
        <HeroHeadline />
        <p className="hx-support hh-line hx-hide" data-hx-el="support">
          {SUPPORT}
        </p>
        <div className="hx-ask">
          <PromptBox
            serverMode={serverMode}
            size="lg"
            id="hero-prompt"
            typing={typing}
            startEmpty
            onLength={onLength}
            onSend={onSend}
          />
        </div>
      </div>
      <div className="hx-stage">
        <PostBurst live={live} reduced={reduced} />
      </div>
      <FlyBys />
    </section>
  )
}
