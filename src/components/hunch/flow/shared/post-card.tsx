"use client"

import * as React from "react"
import { useId, useState } from "react"
import { Flag, RotateCcw } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { PostPreview } from "@/components/hunch/post"
import { Appear } from "@/components/hunch/screens/shared"
import { copyFor, hasLanguage } from "@/lib/hunch/language"
import type { Language, Version } from "@/lib/hunch/types"

import { LanguageToggle, TOGGLE_LANGUAGES } from "./language-toggle"
import { BusyDots, PostActions, ReviewChip, SharedChip } from "./post-actions"
import { usePostKit } from "./post-kit"

export function availableLanguages(v: Version) {
  return TOGGLE_LANGUAGES.filter((l) => hasLanguage(v, l))
}

// Caption body without the hook when it repeats it.
export function captionBody(v: Version, lang: Language) {
  const c = copyFor(v, lang)
  const body = c.caption.startsWith(c.hook) ? c.caption.slice(c.hook.length).trim() : c.caption
  return { hook: c.hook, body, cta: c.cta }
}

export function ClampText({ text, lines = 3, className }: { text: string; lines?: 2 | 3 | 4; className?: string }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <div className={className}>
      <p
        id={id}
        className={cn(
          "text-[14px] leading-relaxed whitespace-pre-line text-ink/80",
          !open && (lines === 2 ? "line-clamp-2" : lines === 4 ? "line-clamp-4" : "line-clamp-3")
        )}
      >
        {text}
      </p>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="mt-1 text-[13px] font-medium text-mute-strong underline decoration-ink/25 underline-offset-4 transition-colors duration-200 hover:text-ink hover:decoration-ink/70"
      >
        {open ? "Show less" : "Show all"}
      </button>
    </div>
  )
}

export interface PostCardProps {
  version: Version
  lang: Language
  onLanguage: (lang: Language) => void
  onReview: () => void
  // Opens the full post; the image becomes a button.
  onOpen?: () => void
  handedOffAt?: number
  // Shown on a post whose step failed.
  onRetry?: () => void
  retrying?: boolean
  delay?: number
  className?: string
}

export function PostCard({ version: v, lang, onLanguage, onReview, onOpen, handedOffAt, onRetry, retrying, delay = 0, className }: PostCardProps) {
  const kit = usePostKit()
  const { hook, body, cta } = captionBody(v, lang)
  const titleId = useId()
  const flagged = v.status === "needs_attention" || (v.openIssues?.length ?? 0) > 0
  const issue = v.openIssues?.[0]

  if (v.error) {
    return (
      <Appear
        as="article"
        delay={delay}
        id={`post-${v.code}`}
        aria-labelledby={titleId}
        className={cn("flex min-w-0 scroll-mt-28 flex-col overflow-hidden rounded-[20px] border border-fail/25 surface-gradient", className)}
      >
        <div className="grid aspect-[4/5] w-full place-items-center dot-grid bg-ink/[0.02] p-6 text-center">
          <div>
            <p id={titleId} className="font-mono text-[12px] text-mute-strong">
              {v.code} · {v.audienceName}
            </p>
            <p className="mt-3 text-[16px] font-semibold text-fail">This post did not finish.</p>
            <p className="mt-1 text-[14px] leading-relaxed text-ink/80" role="alert">
              {v.error}
            </p>
          </div>
        </div>
        <div className="p-4">
          {onRetry ? (
            <Button variant="outline" className="w-full" onClick={onRetry} disabled={retrying} aria-busy={retrying || undefined}>
              {retrying ? <BusyDots /> : <RotateCcw aria-hidden />}
              {retrying ? "Writing it again" : "Try again"}
            </Button>
          ) : (
            <p className="text-[14px] text-mute">Run the test again from Start to rewrite it.</p>
          )}
        </div>
      </Appear>
    )
  }

  const image = <PostPreview {...kit.propsFor(v, lang)} />

  return (
    <Appear
      as="article"
      delay={delay}
      id={`post-${v.code}`}
      aria-labelledby={titleId}
      className={cn(
        "flex min-w-0 scroll-mt-28 flex-col overflow-hidden rounded-[20px] border surface-gradient",
        flagged ? "border-warn/35" : "border-hairline",
        className
      )}
    >
      {onOpen ? (
        <button
          type="button"
          onClick={onOpen}
          tabIndex={-1}
          aria-label={`Open ${v.code} full size`}
          className="group relative block w-full overflow-hidden focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink"
        >
          <span className="block transition-transform duration-500 ease-out group-hover:scale-[1.015]">{image}</span>
        </button>
      ) : (
        image
      )}
      <div className="flex flex-1 flex-col p-4">
        <p id={titleId} className="flex min-w-0 items-baseline gap-2">
          <span className="font-mono text-[12px] text-action-soft">{v.code}</span>
          <span className="truncate text-[13px] text-mute-strong" title={v.audienceName}>
            {v.audienceName}
          </span>
        </p>

        <LanguageToggle
          size="sm"
          value={lang}
          onChange={onLanguage}
          available={availableLanguages(v)}
          label={`Language for ${v.code}`}
          className="mt-3"
        />

        {flagged ? (
          <div className="mt-3 rounded-[12px] border border-warn/30 bg-warn/10 p-3">
            <p className="flex items-center gap-1.5 text-[13px] font-semibold text-warn">
              <Flag aria-hidden className="size-3.5" strokeWidth={1.75} />
              Check this before you post
            </p>
            {issue ? (
              <p className="mt-1 text-[13px] leading-snug text-ink/85">
                {issue.quote ? <>&ldquo;{issue.quote}&rdquo; </> : null}
                {issue.note}
              </p>
            ) : null}
          </div>
        ) : null}

        <h3 className="mt-3 line-clamp-4 text-[16px] leading-snug font-semibold tracking-[-0.01em] text-ink">{hook}</h3>
        {body ? <p className="mt-1.5 line-clamp-2 text-[14px] leading-relaxed text-ink/75">{body}</p> : null}
        {v.hashtags.length ? (
          <p className="mt-1.5 truncate text-[13px] leading-relaxed text-mute" title={v.hashtags.join(" ")}>
            {v.hashtags.join(" ")}
          </p>
        ) : null}
        {cta ? (
          <p className="text-[13px] leading-relaxed text-mute">
            Ends with <span className="text-ink">&ldquo;{cta}&rdquo;</span>
          </p>
        ) : null}

        <div className="mt-auto flex min-h-6 items-center justify-between gap-2 pt-3">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <ReviewChip version={v} onOpen={onReview} />
            <SharedChip at={handedOffAt} />
          </div>
          {onOpen ? (
            <button
              type="button"
              onClick={onOpen}
              className="relative shrink-0 text-[13px] font-medium text-mute-strong underline decoration-ink/25 underline-offset-4 transition-colors duration-200 after:absolute after:-inset-2.5 hover:text-ink hover:decoration-ink/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              Full post
            </button>
          ) : null}
        </div>

        <PostActions version={v} lang={lang} className="pt-3" />
      </div>
    </Appear>
  )
}
