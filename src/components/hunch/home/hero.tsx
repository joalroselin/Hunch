"use client"

import * as React from "react"
import { useEffect, useLayoutEffect, useRef, useState } from "react"

import { useReduced } from "@/components/ds/instruments"
import type { Mode } from "@/lib/hunch/types"

import { HeroMark } from "./hero/actors"
import { HeroHeadline, SUPPORT } from "./hero/headline"
import { decideMode, markSeen, playIntro, type IntroMode, type Timeline } from "./hero/intro"
import { PostBurst } from "./hero/post-ring"
import { PromptBox } from "./prompt-box"
import "./hero/hero.css"

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect

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
    if (mode !== "intro" && mode !== "fade" && mode !== "done") {
      mode = decideMode()
      root.setAttribute("data-hx", mode)
    }

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

    markSeen()
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
    const skip = () => tl?.rush()
    const events = ["wheel", "keydown", "pointerdown", "touchstart"] as const
    const quiet = () => events.forEach((e) => window.removeEventListener(e, skip))

    const begin = () => {
      document.removeEventListener("visibilitychange", onShow)
      if (!alive) return
      tl = playIntro(root, hero, () => alive && setTyping(true))
      events.forEach((e) => window.addEventListener(e, skip, { passive: true }))
      tl.finished.then(
        () => {
          if (!alive) return
          quiet()
          root.setAttribute("data-hx", "done")
          tl?.cancel()
          setLive(true)
        },
        () => {}
      )
    }
    // A tab opened in the background waits until it is seen.
    const onShow = () => {
      if (!document.hidden) begin()
    }
    if (document.hidden) document.addEventListener("visibilitychange", onShow)
    else begin()

    return () => {
      alive = false
      document.removeEventListener("visibilitychange", onShow)
      quiet()
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

  return (
    <section ref={heroRef} id="hero" aria-labelledby="hero-title" className="hx-hero">
      <div className="hx-stage">
        <PostBurst live={live} reduced={reduced} />
      </div>
      <div className="hx-content" data-hx-el="column">
        <HeroMark />
        <HeroHeadline />
        <p className="hx-support hh-line hx-hide" data-hx-el="support">
          {SUPPORT}
        </p>
        <div className="hx-ask">
          <PromptBox serverMode={serverMode} size="lg" id="hero-prompt" typing={typing} startEmpty />
        </div>
      </div>
    </section>
  )
}
