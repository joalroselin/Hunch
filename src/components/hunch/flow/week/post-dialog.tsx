"use client"

import * as React from "react"
import { useEffect, useRef } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { UgcPost } from "@/components/hunch/home/ugc-post"
import { LANGUAGE_LABEL, copyFor, hasLanguage } from "@/lib/hunch/language"
import type { Language, Version } from "@/lib/hunch/types"

import { usePostKit } from "../shared/post-kit"
import type { FrameProps } from "../test/run-post"

const LANGUAGES: Language[] = ["english", "taglish", "tagalog"]

/** One language for a post or for all of them. Arrow keys move between the choices. */
export function LanguageSeg({
  value,
  onChange,
  label,
  available,
  className,
}: {
  value: Language
  onChange: (l: Language) => void
  label: string
  available?: (l: Language) => boolean
  className?: string
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const can = (l: Language) => !available || available(l)
  const move = (from: number, dir: 1 | -1) => {
    for (let step = 1; step <= LANGUAGES.length; step++) {
      const i = (from + dir * step + LANGUAGES.length) % LANGUAGES.length
      if (can(LANGUAGES[i])) {
        onChange(LANGUAGES[i])
        refs.current[i]?.focus()
        return
      }
    }
  }
  return (
    <div role="radiogroup" aria-label={label} className={className ? `ha-seg hw-seg ${className}` : "ha-seg hw-seg"}>
      {LANGUAGES.map((l, i) => {
        const on = l === value
        return (
          <button
            key={l}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={!can(l)}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(l)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault()
                move(i, 1)
              } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault()
                move(i, -1)
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

export type OpenPost = {
  version: Version
  /** "Fri, Nov 13" for a day of the week; nothing for a side test. */
  day?: string
  title: string
  line?: string
  test?: boolean
  shared?: boolean
}

/** A post, opened: the phone on the left, the words and the buttons on the right. */
export function PostDialog({
  post,
  frame,
  lang,
  onLanguage,
  onClose,
  onStep,
}: {
  post: OpenPost | null
  frame: (v: Version, lang?: Language) => FrameProps
  lang: Language
  onLanguage: (l: Language) => void
  onClose: () => void
  /** Left and right arrows go to the day before and after. */
  onStep?: (dir: 1 | -1) => void
}) {
  const kit = usePostKit()
  const v = post?.version

  useEffect(() => {
    if (!v || !onStep) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
      const t = e.target as HTMLElement | null
      if (t?.closest("[role=radiogroup], input, textarea, select")) return
      e.preventDefault()
      onStep(e.key === "ArrowRight" ? 1 : -1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [v, onStep])

  const copy = v ? copyFor(v, lang) : null
  const body = copy ? (copy.caption.startsWith(copy.hook) ? copy.caption.slice(copy.hook.length).trim() : copy.caption) : ""
  const f = v ? frame(v, lang) : null
  const saving = v ? kit.saving === v.id : false
  const sentBack = v?.revisions?.flatMap((r) => r.issues.map((i) => i.note)).filter(Boolean) ?? []

  return (
    <Dialog open={!!post} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="hw-dialog sm:max-w-[53rem]">
        {post && v && copy && f ? (
          <div className="hw-open">
            <div className="hw-open-phone" key={v.id}>
              <UgcPost version={f.version} photo={f.photo} avatar={f.avatar} handle={f.handle} price={f.sticker} />
            </div>
            <div className="hw-open-words">
              {post.day || post.test ? (
                <p className="hw-open-day">
                  {post.day ? <span>{post.day}</span> : null}
                  {post.test ? <span className="hw-tag">Testing the runner-up</span> : null}
                  {post.shared ? <span className="hw-shared">Shared</span> : null}
                </p>
              ) : null}
              <DialogTitle className="hw-open-title">{post.title}</DialogTitle>
              <DialogDescription className={post.line ? "hw-open-line" : "sr-only"}>{post.line ?? "The post and its caption"}</DialogDescription>

              <LanguageSeg value={lang} onChange={onLanguage} label="Language for this post" available={(l) => hasLanguage(v, l)} className="hw-open-seg" />

              <div className="hw-caption" key={`${v.id}:${lang}`}>
                <p className="hw-caption-hook">{copy.hook}</p>
                {body ? <p>{body}</p> : null}
                {v.hashtags.length ? <p className="hw-caption-tags">{v.hashtags.join(" ")}</p> : null}
              </div>

              {sentBack.length ? (
                <div className="hw-sent">
                  <p className="ha-label">First draft, sent back</p>
                  {sentBack.map((n) => (
                    <p key={n}>{n}</p>
                  ))}
                </div>
              ) : null}

              <div className="hw-open-actions">
                <Button onClick={() => kit.copy(v, lang)}>Copy the caption</Button>
                <Button variant="secondary" disabled={kit.saving !== null} aria-busy={saving || undefined} onClick={() => kit.save(v, lang)}>
                  {saving ? "Saving" : "Save the image"}
                </Button>
                {kit.canShare ? (
                  <Button variant="secondary" aria-busy={!kit.isReady(v, lang) || undefined} onClick={() => kit.share(v, lang)}>
                    Share
                  </Button>
                ) : null}
              </div>
              {onStep ? (
                <div className="hw-open-step">
                  <Button variant="ghost" size="sm" onClick={() => onStep(-1)}>
                    Previous post
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onStep(1)}>
                    Next post
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
