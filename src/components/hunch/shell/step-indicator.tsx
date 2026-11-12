"use client"

import { useLayoutEffect, useRef, useState } from "react"
import Link from "next/link"
import { ChevronDown } from "lucide-react"
import { cn } from "cn"

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useHunch } from "@/lib/hunch/store"

import { STEPS, canOpen, stepIndex, type StepId } from "./steps"

const LAST_KEY = "hunch.step.last"

// The step the seller came from, so the drop and the bar can travel from there.
let seen: { at: number; from: number } | null = null

export function useCameFrom(at: number) {
  const [from, setFrom] = useState<number | null>(null)
  useLayoutEffect(() => {
    if (seen?.at !== at) {
      let last = at
      try {
        const raw = window.sessionStorage.getItem(LAST_KEY)
        if (raw !== null && raw !== "" && Number.isInteger(Number(raw))) last = Number(raw)
        window.sessionStorage.setItem(LAST_KEY, String(at))
      } catch {}
      seen = { at, from: last }
    }
    setFrom(seen.from)
  }, [at])
  return from
}

// Desktop: the 7 step names in a row. One drop sits before the current step and travels there from the last one.
export function StepIndicator({ current, from, className }: { current: StepId; from: number | null; className?: string }) {
  const s = useHunch()
  const at = stepIndex(current)
  const items = useRef<(HTMLLIElement | null)[]>([])
  const [drop, setDrop] = useState<{ x: number; move: boolean } | null>(null)

  useLayoutEffect(() => {
    if (from === null) return
    const x = (i: number) => items.current[i]?.offsetLeft ?? 0
    setDrop({ x: x(from), move: false })
    if (from === at) return
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setDrop({ x: x(at), move: true })))
    return () => cancelAnimationFrame(id)
  }, [from, at])

  // Labels reflow when the font loads or the window changes.
  useLayoutEffect(() => {
    const place = () => setDrop((d) => (d ? { x: items.current[at]?.offsetLeft ?? 0, move: false } : d))
    window.addEventListener("resize", place)
    document.fonts?.ready.then(place).catch(() => {})
    return () => window.removeEventListener("resize", place)
  }, [at])

  return (
    <nav aria-label="Steps" className={className}>
      <ol className="ha-steps">
        {STEPS.map((step, i) => {
          const isCurrent = i === at
          const open = s.ready && canOpen(step.id, s)
          const done = open && i < at
          const note = <span className="sr-only">{isCurrent ? " (this step)" : done ? " (done)" : open ? "" : " (not yet)"}</span>
          return (
            <li
              key={step.id}
              ref={(el) => {
                items.current[i] = el
              }}
            >
              {open && !isCurrent ? (
                <Link href={step.href} className="ha-step group" data-open="true">
                  <span className="transition-opacity duration-300 group-hover:opacity-60">{step.label}</span>
                  {note}
                </Link>
              ) : (
                <span aria-current={isCurrent ? "step" : undefined} className="ha-step" data-open={isCurrent || open}>
                  {step.label}
                  {note}
                </span>
              )}
            </li>
          )
        })}
        <li aria-hidden className="ha-step-drop" data-on={drop ? "" : undefined} data-move={drop?.move ? "" : undefined} style={{ "--at": `${drop?.x ?? 0}px` } as React.CSSProperties} />
      </ol>
    </nav>
  )
}

// Narrow screens: the current step's name, opening the list of steps.
export function StepMenu({ current, note, className }: { current: StepId; note?: string | null; className?: string }) {
  const s = useHunch()
  const at = stepIndex(current)
  const step = STEPS[at] ?? STEPS[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "group flex h-11 min-w-0 items-center gap-2 text-left text-[15px] leading-none font-extrabold tracking-[-0.015em] text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink",
          className
        )}
        aria-label={`${step.label}. Show all steps`}
      >
        <span aria-hidden className="hh-drop size-[11px] shrink-0" />
        <span className="truncate">{step.label}</span>
        <ChevronDown aria-hidden className="size-4 shrink-0 transition-transform duration-300 ease-out group-data-[state=open]:rotate-180" strokeWidth={2.4} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="w-60">
        {STEPS.map((x, i) => {
          const isCurrent = i === at
          const open = s.ready && canOpen(x.id, s)
          const row = (
            <>
              <span aria-hidden className={cn("size-[11px] shrink-0", isCurrent && "hh-drop")} />
              <span className={cn("flex-1", isCurrent && "font-extrabold", !open && !isCurrent && "opacity-40")}>{x.label}</span>
            </>
          )
          return open && !isCurrent ? (
            <DropdownMenuItem key={x.id} asChild className="min-h-11 gap-2.5">
              <Link href={x.href}>{row}</Link>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem key={x.id} disabled={!isCurrent} aria-current={isCurrent ? "step" : undefined} className="min-h-11 gap-2.5 data-disabled:opacity-100">
              {row}
            </DropdownMenuItem>
          )
        })}
        {note ? <p className="ha-note px-3 pt-2 pb-2">{note}</p> : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Narrow screens: one thin line under the header, as long as the steps done so far.
export function StepBar({ current, from, className }: { current: StepId; from: number | null; className?: string }) {
  const at = stepIndex(current)
  const [shown, setShown] = useState<number | null>(null)
  useLayoutEffect(() => {
    if (from === null) return
    setShown(from)
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setShown(at)))
    return () => cancelAnimationFrame(id)
  }, [from, at])
  return (
    <div aria-hidden className={cn("ha-progress", className)}>
      <span style={{ scale: `${((shown ?? at) + 1) / STEPS.length} 1` }} />
    </div>
  )
}
