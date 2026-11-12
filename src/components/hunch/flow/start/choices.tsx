"use client"

import * as React from "react"
import { useRef } from "react"

import { CHANNEL_LABEL, LANGUAGE_LABEL } from "@/lib/hunch/language"
import type { Channel, Language } from "@/lib/hunch/types"

import { CHANNELS, START_LANGUAGES } from "./product"

// Multi-select channel pills. Each is a toggle button: tint when off, ink when on.
export function ChannelChips({
  value,
  onChange,
  labelId,
  firstId,
}: {
  value: Channel[]
  onChange: (next: Channel[]) => void
  labelId: string
  firstId?: string
}) {
  return (
    <div role="group" aria-labelledby={labelId} className="flex flex-wrap gap-2">
      {CHANNELS.map((c, i) => {
        const on = value.includes(c)
        return (
          <button
            key={c}
            id={i === 0 ? firstId : undefined}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((x) => x !== c) : [...value, c])}
            className="ha-chip"
          >
            {CHANNEL_LABEL[c]}
          </button>
        )
      })}
    </div>
  )
}

// Segmented radio group with arrow-key movement.
export function LanguageToggle({ value, onChange, labelId }: { value: Language; onChange: (next: Language) => void; labelId: string }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const move = (i: number) => {
    const n = (i + START_LANGUAGES.length) % START_LANGUAGES.length
    onChange(START_LANGUAGES[n])
    refs.current[n]?.focus()
  }
  return (
    <div role="radiogroup" aria-labelledby={labelId} className="ha-seg w-full sm:w-fit">
      {START_LANGUAGES.map((l, i) => {
        const on = value === l
        return (
          <button
            key={l}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(l)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault()
                move(i + 1)
              } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault()
                move(i - 1)
              }
            }}
          >
            {LANGUAGE_LABEL[l]}
          </button>
        )
      })}
    </div>
  )
}
