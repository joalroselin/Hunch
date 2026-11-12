"use client"

import * as React from "react"

import { PostPreview } from "@/components/hunch/post"
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import type { Language, Version } from "@/lib/hunch/types"

import { LanguageToggle } from "./language-toggle"
import { PostActions, ReviewChip, ShareHint, SharedChip } from "./post-actions"
import { availableLanguages, captionBody } from "./post-card"
import { usePostKit } from "./post-kit"
import { useIsPhone } from "./review"

export interface PostSheetProps {
  version: Version | null
  lang: Language
  onLanguage: (lang: Language) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  // Small line above the title, e.g. "Day 4 · Mon, Nov 16".
  kicker?: React.ReactNode
  // Defaults to the audience name.
  title?: React.ReactNode
  // Next to the kicker, e.g. a "Testing runner-up" chip.
  badge?: React.ReactNode
  handedOffAt?: number
  // Shows the Reviewed chip when given.
  onReview?: () => void
  // Audience code to show when the post's own code is internal (plan days are P1..P7).
  code?: string
}

export function PostSheet({ version: v, lang, onLanguage, open, onOpenChange, kicker, title, badge, handedOffAt, onReview, code }: PostSheetProps) {
  const kit = usePostKit()
  const phone = useIsPhone()
  const copy = v ? captionBody(v, lang) : null

  return (
    <Sheet open={open && !!v} onOpenChange={onOpenChange}>
      <SheetContent side={phone ? "bottom" : "right"} className={phone ? undefined : "sm:w-[min(34rem,calc(100%-2rem))]"}>
        {v && copy ? (
          <>
            <SheetHeader>
              {kicker || badge ? (
                <div className="flex flex-wrap items-center gap-2">
                  {kicker ? <span className="font-mono text-[12px] text-mute-strong">{kicker}</span> : null}
                  {badge}
                </div>
              ) : null}
              <SheetTitle className="text-[17px] leading-snug tracking-[-0.015em]">{title ?? v.audienceName}</SheetTitle>
              <SheetDescription className="text-[14px]">
                <span className="font-mono text-[12px] text-action-soft">{code ?? v.code}</span> · {title ? v.audienceName : "Full post and caption"}
              </SheetDescription>
            </SheetHeader>
            <SheetBody className="flex flex-col gap-5 pb-10 [&>*]:shrink-0">
              <div className="mx-auto w-full max-w-[20rem] overflow-hidden rounded-[12px] border border-hairline">
                <PostPreview {...kit.propsFor(v, lang)} />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <LanguageToggle size="sm" value={lang} onChange={onLanguage} available={availableLanguages(v)} label={`Language for ${code ?? v.code}`} className="max-w-[20rem]" />
                <div className="flex items-center gap-1.5">
                  <SharedChip at={handedOffAt} />
                  {onReview ? <ReviewChip version={v} onOpen={onReview} /> : null}
                </div>
              </div>
              <div>
                <h3 className="text-[18px] leading-snug font-semibold tracking-[-0.015em] text-ink">{copy.hook}</h3>
                {copy.body ? <p className="mt-2 text-[15px] leading-relaxed whitespace-pre-line text-ink/85">{copy.body}</p> : null}
                {v.hashtags.length ? <p className="mt-3 text-[14px] leading-relaxed break-words text-mute">{v.hashtags.join(" ")}</p> : null}
                {copy.cta ? (
                  <p className="mt-2 text-[14px] text-mute">
                    Ends with <span className="text-ink">&ldquo;{copy.cta}&rdquo;</span>
                  </p>
                ) : null}
              </div>
              <PostActions version={v} lang={lang} layout="stack" />
              <ShareHint />
            </SheetBody>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
