"use client"

import * as React from "react"
import { useRef } from "react"
import { cn } from "cn"

import { LANGUAGE_LABEL } from "@/lib/hunch/language"
import type { Language } from "@/lib/hunch/types"

// Spec order.
export const TOGGLE_LANGUAGES: Language[] = ["taglish", "tagalog", "english"]

export interface LanguageToggleProps {
  value: Language
  onChange: (lang: Language) => void
  // Languages this post has copy for; others are disabled.
  available?: Language[]
  size?: "md" | "sm"
  // Accessible name, e.g. "Language for all posts".
  label: string
  className?: string
}

// Segmented radio group. Arrow keys move between options.
export function LanguageToggle({ value, onChange, available, size = "md", label, className }: LanguageToggleProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const index = Math.max(0, TOGGLE_LANGUAGES.indexOf(value))
  const can = (l: Language) => !available || available.includes(l)

  const move = (from: number, dir: 1 | -1) => {
    for (let step = 1; step <= TOGGLE_LANGUAGES.length; step++) {
      const i = (from + dir * step + TOGGLE_LANGUAGES.length) % TOGGLE_LANGUAGES.length
      const l = TOGGLE_LANGUAGES[i]
      if (can(l)) {
        onChange(l)
        refs.current[i]?.focus()
        return
      }
    }
  }

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault()
      move(i, 1)
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault()
      move(i, -1)
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "relative grid w-full grid-cols-3 bg-ink/5 p-1 shadow-[inset_0_0_0_1px_var(--hairline)]",
        size === "md" ? "h-11 max-w-[22rem]" : "h-11 md:h-9",
        className
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute top-1 bottom-1 left-1 bg-navy-3 shadow-[inset_0_0_0_1px_var(--hairline),inset_0_1px_0_rgb(251_246_239/0.06)] transition-transform duration-300 ease-out"
        style={{ width: "calc((100% - 0.5rem) / 3)", transform: `translateX(${index * 100}%)` }}
      />
      {TOGGLE_LANGUAGES.map((l, i) => {
        const on = l === value
        const ok = can(l)
        return (
          <button
            key={l}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={!ok}
            tabIndex={on ? 0 : -1}
            title={ok ? undefined : "Not written in this language"}
            onClick={() => onChange(l)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "relative z-[1] inline-flex min-w-0 items-center justify-center px-1 font-medium tracking-[-0.005em] whitespace-nowrap transition-colors duration-200",
              "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-40",
              size === "md" ? "text-[14px]" : "text-[13px]",
              on ? "text-ink" : "text-mute hover:text-ink"
            )}
          >
            {LANGUAGE_LABEL[l]}
          </button>
        )
      })}
    </div>
  )
}
