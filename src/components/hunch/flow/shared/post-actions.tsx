"use client"

import * as React from "react"
import { Check, Copy, Download, Flag, Send, ShieldCheck, Smartphone } from "lucide-react"
import { cn } from "cn"

import { Chip } from "@/components/ds"
import { Button } from "@/components/ui/button"
import type { Language, Version } from "@/lib/hunch/types"

import { usePostKit } from "./post-kit"
import { reviewState } from "./review"
import { SHARE_HINT } from "./share"

// Three breathing dots for a button that is working.
export function BusyDots({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("inline-flex items-center gap-[3px]", className)}>
      {[0, 1, 2].map((i) => (
        <span key={i} className="size-[5px] animate-dot-wave rounded-full bg-current" style={{ animationDelay: `${i * 0.16}s` }} />
      ))}
    </span>
  )
}

export interface ShareButtonProps {
  version: Version
  lang: Language
  className?: string
}

// Phones only. Renders nothing where the browser cannot share files.
export function ShareButton({ version, lang, className }: ShareButtonProps) {
  const kit = usePostKit()
  if (!kit.canShare) return null
  const ready = kit.isReady(version, lang)
  return (
    <Button
      variant="secondary"
      className={cn("w-full", className)}
      aria-busy={!ready || undefined}
      onClick={() => kit.share(version, lang)}
    >
      {ready ? <Send aria-hidden /> : <BusyDots />}
      {ready ? "Share" : "Getting the image ready"}
    </Button>
  )
}

export interface PostActionsProps {
  version: Version
  lang: Language
  // "card" puts Copy and Save side by side; "stack" gives each a full row.
  layout?: "card" | "stack"
  className?: string
}

export function PostActions({ version, lang, layout = "card", className }: PostActionsProps) {
  const kit = usePostKit()
  const busy = kit.saving === version.id
  return (
    <div className={cn("grid gap-2", className)}>
      <ShareButton version={version} lang={lang} />
      <div className={cn("grid gap-2", layout === "card" ? "grid-cols-2" : "sm:grid-cols-2")}>
        <Button size="sm" variant="outline" className="h-11 w-full px-2 md:h-9" onClick={() => kit.copy(version, lang)}>
          <Copy aria-hidden /> Copy caption
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-11 w-full px-2 md:h-9"
          disabled={kit.saving !== null}
          aria-busy={busy || undefined}
          onClick={() => kit.save(version, lang)}
        >
          {busy ? <BusyDots /> : <Download aria-hidden />}
          {busy ? "Saving" : "Save image"}
        </Button>
      </div>
    </div>
  )
}

// Desktop hint where Share is hidden.
export function ShareHint({ className }: { className?: string }) {
  const kit = usePostKit()
  if (kit.canShare !== false) return null
  return (
    <p className={cn("flex items-center gap-2 text-[14px] leading-snug text-mute", className)}>
      <Smartphone aria-hidden className="size-4 shrink-0" strokeWidth={1.5} />
      {SHARE_HINT}
    </p>
  )
}

export function SharedChip({ at }: { at?: number }) {
  if (!at) return null
  return (
    <Chip size="sm" tone="pass" title={`Shared ${new Date(at).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}`}>
      <Check aria-hidden strokeWidth={2} />
      Shared
    </Chip>
  )
}

// Opens the Reviewed sheet. Amber when the post still needs a look.
export function ReviewChip({ version, onOpen, className }: { version: Version; onOpen: () => void; className?: string }) {
  const state = reviewState(version)
  const label = state === "flagged" ? "Needs a look" : state === "fixed" ? "Fixed in review" : "Reviewed"
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-label={`${label}. See what the Reviewer checked for ${version.code}`}
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1.5 px-2 text-[12px] leading-none font-medium whitespace-nowrap transition-colors duration-200",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
        "relative after:absolute after:-inset-2.5 after:content-['']",
        state === "flagged"
          ? "bg-warn/14 text-warn hover:bg-warn/22"
          : state === "fixed"
            ? "bg-action-soft/12 text-action-soft hover:bg-action-soft/20"
            : "border border-hairline-strong text-fog/85 hover:border-ink/40 hover:text-ink",
        className
      )}
    >
      {state === "flagged" ? (
        <Flag aria-hidden className="size-3.5" strokeWidth={1.75} />
      ) : (
        <ShieldCheck aria-hidden className="size-3.5" strokeWidth={1.75} />
      )}
      {label}
    </button>
  )
}
