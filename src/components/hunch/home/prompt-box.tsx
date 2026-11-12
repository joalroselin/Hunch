"use client"

import * as React from "react"
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useInView } from "framer-motion"
import { ArrowUpRight } from "lucide-react"

import { useTabVisible } from "@/components/ds"
import { useReduced } from "@/components/ds/instruments"
import { SAMPLE_PRODUCT } from "@/components/hunch/screens/demo"
import { BusyDots } from "@/components/hunch/screens/shared"
import type { StoredProduct } from "@/lib/hunch/store"
import type { Mode } from "@/lib/hunch/types"
import { cn } from "@/lib/utils"

import "./hero/prompt.css"

// Short enough to sit on one line in the box at every width.
const EXAMPLES = [
  "Soy candles, ₱350 a jar",
  "Matcha in 30 g tins, ₱480",
  "Calamansi soap, ₱120 a bar",
  "Chili garlic oil, ₱180 a jar",
  "Thrifted denim jackets",
]

const EMPTY_TIP = "Type what you sell first."

// Elle's sample candle run, opened on the Studio step.
const SAMPLE_HREF = "/start?demo=1"

const CUT = /\s+(?:from|made|in|delivered|for|with|sold|at|by|every|na|galing)\s+/i

function capital(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// One line to a product: a short name, the line as the description, and a price if there is one. Typing the sample name gives Elle's product.
export function toProduct(line: string): StoredProduct {
  const text = line.replace(/\s+/g, " ").trim()
  const head = text.split(/\s*(?:,|;|:|\(|\s[-–|]\s)\s*/)[0] ?? text
  const words = (head.split(CUT)[0] || head).replace(/[.!?]+$/, "").split(" ").filter(Boolean)
  const name = capital(words.slice(0, 6).join(" ")).slice(0, 80)
  if (name.toLowerCase() === SAMPLE_PRODUCT.name.toLowerCase()) return { ...SAMPLE_PRODUCT }
  const price = text.match(/(?:₱|php\s?|\bp(?=\d))\s?\d[\d,]*(?:\.\d+)?(?:\s(?:a|an|per|each|for)\s[^\s,;.]+(?:\s[^\s,;.]+)?)?/i)?.[0]
  return {
    name: name || capital(text).slice(0, 80),
    description: capital(text).slice(0, 200),
    price: price ? price.replace(/^php\s?|^p(?=\d)/i, "₱") : undefined,
    language: "taglish",
  }
}

type Tw = { i: number; n: number; phase: "type" | "hold" | "delete" | "gap" }

// Types and deletes the examples on a loop while `on`; starts on the first one, fully typed unless `empty`.
function useTypewriter(on: boolean, empty: boolean) {
  const [s, set] = useState<Tw>(empty ? { i: 0, n: 0, phase: "type" } : { i: 0, n: EXAMPLES[0].length, phase: "hold" })
  useEffect(() => {
    if (!on) return
    const line = EXAMPLES[s.i] ?? ""
    let ms = 55
    let next: Tw
    if (s.phase === "type") next = s.n + 1 >= line.length ? { ...s, n: line.length, phase: "hold" } : { ...s, n: s.n + 1 }
    else if (s.phase === "hold") {
      next = { ...s, phase: "delete" }
      ms = 1600
    } else if (s.phase === "delete") {
      next = s.n <= 1 ? { i: (s.i + 1) % EXAMPLES.length, n: 0, phase: "gap" } : { ...s, n: s.n - 1 }
      ms = 22
    } else {
      next = { ...s, phase: "type" }
      ms = 380
    }
    const t = window.setTimeout(() => set(next), ms)
    return () => window.clearTimeout(t)
  }, [on, s])
  return s
}

export function PromptBox({
  size = "lg",
  id,
  typing = true,
  startEmpty = false,
  className,
}: {
  serverMode: Mode
  size?: "lg" | "md"
  id?: string
  /** Holds the typewriter until the caller is ready, e.g. the end of the hero entrance. */
  typing?: boolean
  /** The box opens blank and types its first example. */
  startEmpty?: boolean
  className?: string
}) {
  const autoId = useId()
  const fieldId = id ?? `prompt-${autoId}`
  const hintId = `${fieldId}-hint`
  const router = useRouter()
  const reduced = useReduced()
  const visible = useTabVisible()
  const shellRef = useRef<HTMLDivElement>(null)
  const fieldRef = useRef<HTMLTextAreaElement>(null)
  const inView = useInView(shellRef, { amount: 0.4 })
  const [value, setValue] = useState("")
  const [focused, setFocused] = useState(false)
  const [tip, setTip] = useState(false)
  const [busy, setBusy] = useState(false)

  const on = typing && !focused && !value && visible && inView && !reduced
  const tw = useTypewriter(on, startEmpty)
  const example = EXAMPLES[tw.i] ?? EXAMPLES[0]
  const shown = focused || reduced ? example : example.slice(0, tw.n)

  useEffect(() => {
    if (!tip) return
    const t = window.setTimeout(() => setTip(false), 2600)
    return () => window.clearTimeout(t)
  }, [tip])

  // The field grows a line at a time, with a transition, when the typed text wraps.
  useLayoutEffect(() => {
    const el = fieldRef.current
    if (!el) return
    const fit = (smooth: boolean) => {
      if (!el.value) {
        el.style.height = ""
        return
      }
      const from = el.offsetHeight
      el.style.height = "auto"
      const to = el.scrollHeight
      if (smooth && to !== from) {
        el.style.height = `${from}px`
        void el.offsetHeight
      }
      el.style.height = `${to}px`
    }
    fit(true)
    const onResize = () => fit(false)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [value])

  const warm = () => router.prefetch("/start")

  function submit(e?: React.FormEvent) {
    e?.preventDefault()
    if (busy) return
    const line = value.replace(/\s+/g, " ").trim()
    if (!line) {
      setTip(true)
      fieldRef.current?.focus()
      return
    }
    setBusy(true)
    // Start reads ?d= into the description; the photo and channels are added there.
    router.push(`/start?d=${encodeURIComponent(line)}`)
  }


  return (
    <div className={cn("w-full", className)}>
      <form noValidate onSubmit={submit}>
        <div ref={shellRef} data-prompt-shell data-size={size} className="hx-pbox"
          onPointerEnter={warm}
          onClick={(e) => {
            if (!(e.target as HTMLElement).closest("button")) fieldRef.current?.focus()
          }}
        >
          <label htmlFor={fieldId} className="sr-only">
            What do you sell?
          </label>
          <div className="hx-write">
            <textarea
              ref={fieldRef}
              id={fieldId}
              rows={1}
              value={value}
              maxLength={200}
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="go"
              aria-describedby={hintId}
              disabled={busy}
              className="hx-field"
              onChange={(e) => {
                setValue(e.target.value.replace(/\s*\n\s*/g, " "))
                if (tip) setTip(false)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) submit(e)
              }}
              onFocus={() => {
                setFocused(true)
                warm()
              }}
              onBlur={() => setFocused(false)}
            />
            {!value ? (
              <span aria-hidden className="hx-ph">
                {shown}
                {on ? <span className="hx-caret" data-blink={tw.phase === "hold" || tw.phase === "gap" ? "" : undefined} /> : null}
              </span>
            ) : null}
          </div>
          <div className="hx-act">
            {tip ? (
              <span aria-hidden className="hx-tip">
                {EMPTY_TIP}
              </span>
            ) : null}
            <button type="submit" aria-label="Write my 8 posts" aria-busy={busy || undefined} className="hx-send hh-grain">
              {busy ? (
                <span data-busy>
                  <BusyDots />
                </span>
              ) : (
                <ArrowUpRight aria-hidden className="hx-send-arrow" strokeWidth={2.4} />
              )}
            </button>
          </div>
        </div>
      </form>
      <p data-prompt-hint id={hintId} className="hx-hint">
        <Link href={SAMPLE_HREF} aria-disabled={busy || undefined} className="hx-hint-link">
          Open Elle&rsquo;s test
        </Link>
      </p>
      <span role="status" aria-live="polite" className="sr-only">
        {tip ? EMPTY_TIP : ""}
      </span>
    </div>
  )
}
