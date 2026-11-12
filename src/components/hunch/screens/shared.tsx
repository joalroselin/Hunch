"use client"

import * as React from "react"
import { useCallback, useRef, useState } from "react"
import { toast } from "sonner"
import { cn } from "cn"

import { useReduced, useSeen } from "@/components/ds/instruments"
import { motionState } from "@/components/ds/instruments/hooks"
import "@/components/ds/instruments/instruments.css"
import { Button } from "@/components/ui/button"
import { EmptyScreen, LoadingScreen, ScreenTitle } from "@/components/hunch/shell/screen"
import { copyCaption, postFilename, usePostDownload, type PostCanvasProps } from "@/components/hunch/post"
import type { Version } from "@/lib/hunch/types"

// Seconds between siblings arriving in reading order.
export const STEP = 0.07

// Whole pesos in the UI; exact values only in tooltips.
export function peso(n: number) {
  return `₱${Math.round(n).toLocaleString("en-PH")}`
}

export function count(n: number) {
  return Math.round(n).toLocaleString("en-PH")
}

export function lowerFirst(s: string) {
  if (s.length > 1 && /[A-Z]/.test(s[1])) return s
  return s.charAt(0).toLowerCase() + s.slice(1)
}

// Short price for the post image, e.g. "₱149 per 100 g pouch" to "₱149 / 100 g".
export function shortPrice(price?: string | null) {
  const p = price?.trim()
  if (!p) return undefined
  if (/^\d[\d,.]*$/.test(p)) return `₱${p}`
  const m = p.match(/(₱\s?[\d,]+(?:\.\d+)?)\s*(?:per|\/|for|a)\s*(\d+(?:\.\d+)?)\s?(g|kg|ml|l|pcs?|pack|box|jar|bottle)\b/i)
  if (m) return `${m[1].replace(/\s/g, "")} / ${m[2]} ${m[3].toLowerCase()}`
  if (p.length <= 16) return p
  const n = p.match(/₱\s?[\d,]+(?:\.\d+)?/)
  return n ? n[0].replace(/\s/g, "") : undefined
}

// Keeps hyphenated words like "night-shift" from breaking at the hyphen.
export function keepWords(text: string) {
  return text.split(/(\S*-\S*)/).map((part, i) =>
    part.includes("-") ? (
      <span key={i} className="whitespace-nowrap">
        {part}
      </span>
    ) : (
      part
    )
  )
}

// Waits a few frames for the element to mount, then scrolls it under the top bar.
export function scrollToId(id: string, reduced: boolean | null, tries = 20) {
  requestAnimationFrame(() => {
    const el = document.getElementById(id)
    if (!el) {
      if (tries > 0) scrollToId(id, reduced, tries - 1)
      return
    }
    const top = el.getBoundingClientRect().top + window.scrollY - 104
    window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" })
  })
}

type AppearTag = "div" | "section" | "li" | "p" | "header" | "article" | "dl"

// Rises from a slight blur the first time it scrolls into view. CSS only, so it never stalls.
export function Appear({
  as: Tag = "div",
  delay = 0,
  className,
  style,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & { as?: AppearTag; delay?: number }) {
  const ref = useRef<HTMLElement>(null)
  const seen = useSeen(ref, 0.01)
  const reduced = useReduced()
  const [lag, setLag] = useState(0)
  // In the first view, lower things wait a little longer so the page arrives top to bottom.
  React.useLayoutEffect(() => {
    const top = ref.current?.getBoundingClientRect().top ?? 0
    const vh = window.innerHeight
    if (top > 0 && top < vh) setLag(Math.round((top / vh) * 45) / 100)
  }, [])
  return (
    <Tag
      ref={ref as React.Ref<never>}
      {...motionState(seen, reduced)}
      className={cn("ins-enter", className)}
      style={{ "--ins-delay": `${reduced ? 0 : Math.max(delay, lag)}s`, ...style } as React.CSSProperties}
      {...props}
    >
      {children}
    </Tag>
  )
}

// Old screen title. New screens use ScreenTitle from the shell.
export function ScreenHero({
  title,
  tail,
  sub,
  children,
}: {
  /** Retired: screens carry no kicker. */
  kicker?: string
  title: React.ReactNode
  tail?: React.ReactNode
  sub?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div>
      <ScreenTitle title={title} line={tail ?? sub} />
      {tail && sub ? <p className="ha-note ha-rise mt-3 max-w-[44ch]">{sub}</p> : null}
      {children}
    </div>
  )
}

// A block's heading with one line under it.
export function BlockHeader({
  id,
  title,
  sub,
  aside,
  className,
}: {
  id?: string
  title: React.ReactNode
  sub?: React.ReactNode
  aside?: React.ReactNode
  className?: string
}) {
  return (
    <Appear className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        <h2 id={id} className="hh-title ha-h2 scroll-mt-28">
          {title}
        </h2>
        {sub ? <p className="hh-line ha-line">{sub}</p> : null}
      </div>
      {aside ? <div className="shrink-0">{aside}</div> : null}
    </Appear>
  )
}

export function LabelPair({ title, sub, className }: { title: React.ReactNode; sub?: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="text-[15px] leading-[1.25] font-extrabold tracking-[-0.015em] text-ink">{title}</p>
      {sub ? <p className="text-[14px] leading-[1.3] font-medium text-ink">{sub}</p> : null}
    </div>
  )
}

// Three dots that breathe while something is working.
export function BusyDots({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("inline-flex items-center gap-[3px]", className)}>
      {[0, 1, 2].map((i) => (
        <span key={i} className="size-[5px] animate-dot-wave rounded-full bg-current" style={{ animationDelay: `${i * 0.16}s` }} />
      ))}
    </span>
  )
}

// Status mark: the drop for a pass, a chili dot for a stop.
export function StatusMark({ kind, className }: { kind: "x" | "check"; className?: string }) {
  return <span aria-hidden className={cn("size-3 shrink-0", kind === "x" ? "rounded-full bg-chili" : "hh-drop", className)} />
}

export function EmptyState({
  title,
  body,
  href,
  action,
}: {
  title: string
  body: string
  href: string
  action: string
}) {
  return <EmptyScreen title={title} line={body} href={href} action={action} />
}

// While the saved state loads.
export function ScreenLoading() {
  return <LoadingScreen />
}

export function Notes({ notes, className }: { notes?: string[]; className?: string }) {
  if (!notes?.length) return null
  return (
    <ul className={cn("grid gap-1", className)}>
      {notes.map((n) => (
        <li key={n} className="ha-note">
          {n}
        </li>
      ))}
    </ul>
  )
}

export type PostTools = ReturnType<typeof usePostTools>

export function usePostTools(opts: { brand?: string; price?: string; photo?: string | null; photoFor?: (v: Version) => string | undefined }) {
  const { download, canvas } = usePostDownload()
  const [saving, setSaving] = useState<string | null>(null)
  const { brand, price, photo, photoFor } = opts

  const propsFor = useCallback(
    (version: Version): Omit<PostCanvasProps, "ref"> => ({
      version,
      photo: photo ?? photoFor?.(version),
      brand,
      price,
    }),
    [brand, price, photo, photoFor]
  )

  const save = useCallback(
    async (version: Version) => {
      setSaving(version.id)
      try {
        const name = postFilename(version, version.style)
        await download(propsFor(version), name)
        toast.success("Image saved.", { description: name })
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "The image did not save. Try again.")
      } finally {
        setSaving(null)
      }
    },
    [download, propsFor]
  )

  const copy = useCallback(async (version: Version) => {
    const ok = await copyCaption(version)
    if (ok) toast.success("Caption copied.")
    else toast.error("Copy blocked. Select the caption and copy it by hand.")
  }, [])

  return { canvas, saving, save, copy, propsFor }
}

export function PostActions({ version, tools, className }: { version: Version; tools: PostTools; className?: string }) {
  const busy = tools.saving === version.id
  return (
    <div className={cn("grid gap-2 @[17rem]:grid-cols-2", className)}>
      <Button size="sm" variant="outline" className="w-full" onClick={() => tools.copy(version)}>
        Copy the caption
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="w-full"
        disabled={tools.saving !== null}
        aria-busy={busy || undefined}
        onClick={() => tools.save(version)}
      >
        {busy ? <BusyDots /> : null}
        {busy ? "Saving" : "Save the image"}
      </Button>
    </div>
  )
}

export function CaptionText({ version, clamp = 4, className }: { version: Version; clamp?: 3 | 4 | 5; className?: string }) {
  const [open, setOpen] = useState(false)
  const id = React.useId()
  return (
    <div className={className}>
      <p
        id={id}
        className={cn(
          "text-[15px] leading-[1.4] font-medium whitespace-pre-line text-ink",
          !open && (clamp === 3 ? "line-clamp-3" : clamp === 5 ? "line-clamp-5" : "line-clamp-4")
        )}
      >
        {version.caption}
      </p>
      {open && version.hashtags.length ? (
        <p className="mt-2 text-[14px] leading-[1.4] font-medium break-words text-ink">{version.hashtags.join(" ")}</p>
      ) : null}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="ha-link mt-1.5 text-[14px]"
      >
        {open ? "Show less" : "Show all"}
      </button>
    </div>
  )
}
