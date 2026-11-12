"use client"

import * as React from "react"
import { Check, Flag } from "lucide-react"
import { cn } from "cn"

import { Chip } from "@/components/ds"
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { LANGUAGE_LABEL } from "@/lib/hunch/language"
import type { Language, ReviewIssue, Version } from "@/lib/hunch/types"

import { issueLabel, reviewState, revisionText, useIsPhone } from "./review"

export interface ReviewedSheetProps {
  version: Version | null
  // Language to show before and after in, when the revision has it.
  lang: Language
  open: boolean
  onOpenChange: (open: boolean) => void
  code?: string
}

function Issue({ issue, tone }: { issue: ReviewIssue; tone: "warn" | "fail" }) {
  return (
    <li className="grid gap-2">
      <Chip size="sm" tone={tone}>
        {issueLabel(issue.type)}
      </Chip>
      {issue.quote ? (
        <blockquote className={cn("border-l pl-3 text-[15px] leading-snug text-ink", tone === "warn" ? "border-warn/50" : "border-fail/50")}>
          &ldquo;{issue.quote}&rdquo;
        </blockquote>
      ) : null}
      <p className="text-[14px] leading-relaxed text-mute">{issue.note}</p>
    </li>
  )
}

function Caption({ label, text, lang, struck }: { label: string; text: string; lang: Language; struck?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="flex items-baseline justify-between gap-3 text-[13px] text-mute">
        <span className="font-medium text-mute-strong">{label}</span>
        <span className="font-mono text-[11.5px] lowercase">{LANGUAGE_LABEL[lang]}</span>
      </p>
      <p
        className={cn(
          "mt-1.5 rounded-[12px] border border-hairline p-3.5 text-[14px] leading-relaxed whitespace-pre-line",
          struck ? "bg-ink/[0.02] text-mute" : "bg-ink/[0.04] text-ink"
        )}
      >
        {text}
      </p>
    </div>
  )
}

export function ReviewedSheet({ version, lang, open, onOpenChange, code }: ReviewedSheetProps) {
  const phone = useIsPhone()
  const v = version
  const state = v ? reviewState(v) : "approved"
  const revisions = v?.revisions ?? []

  return (
    <Sheet open={open && !!v} onOpenChange={onOpenChange}>
      <SheetContent side={phone ? "bottom" : "right"} className={phone ? undefined : "sm:w-[min(32rem,calc(100%-2rem))]"}>
        {v ? (
          <>
            <SheetHeader>
              <SheetTitle className="text-[17px] tracking-[-0.015em]">
                <span className="mr-2 font-mono text-[13px] font-normal text-mute-strong">{code ?? v.code}</span>
                What the Reviewer checked
              </SheetTitle>
              <SheetDescription className="text-[14px]">{v.audienceName}</SheetDescription>
            </SheetHeader>
            <SheetBody className="flex flex-col gap-8 pb-10 [&>*]:shrink-0">
              {state === "flagged" ? (
                <section aria-labelledby="open-title" className="rounded-[12px] border border-warn/30 bg-warn/10 p-4">
                  <h3 id="open-title" className="flex items-center gap-2 text-[15px] font-semibold text-warn">
                    <Flag aria-hidden className="size-4" strokeWidth={1.75} />
                    Needs your look
                  </h3>
                  <p className="mt-1 text-[14px] leading-relaxed text-ink/80">
                    The Reviewer still had a problem after 2 rewrites. Change the words in quotes before you post.
                  </p>
                  <ul className="mt-4 grid gap-5">
                    {(v.openIssues ?? []).map((issue, i) => (
                      <Issue key={i} issue={issue} tone="warn" />
                    ))}
                  </ul>
                </section>
              ) : null}

              {revisions.length ? (
                revisions.map((r, i) => {
                  const before = revisionText(r.before, lang)
                  const after = revisionText(r.after, lang)
                  return (
                    <section key={i} aria-labelledby={`round-${i}`} className="grid gap-5">
                      <div>
                        <p className="font-mono text-[11.5px] tracking-[0.04em] text-mute-strong lowercase">round {r.round}</p>
                        <h3 id={`round-${i}`} className="mt-1 text-[16px] font-semibold tracking-[-0.01em] text-ink">
                          Sent back to the Copywriter
                        </h3>
                      </div>
                      <ul className="grid gap-5">
                        {r.issues.map((issue, k) => (
                          <Issue key={k} issue={issue} tone="fail" />
                        ))}
                      </ul>
                      {before ? <Caption label="Before" text={before.text} lang={before.lang} struck /> : null}
                      {after ? <Caption label="After" text={after.text} lang={after.lang} /> : null}
                    </section>
                  )
                })
              ) : state !== "flagged" ? (
                <section className="grid gap-4">
                  <p className="flex items-center gap-2 text-[15px] font-semibold text-pass">
                    <Check aria-hidden className="size-4" strokeWidth={2} />
                    Approved on the first read
                  </p>
                  <p className="text-[14px] leading-relaxed text-mute">Nothing was sent back. These are the checks it passed.</p>
                </section>
              ) : null}

              {v.checks.length ? (
                <section aria-labelledby="checks-title">
                  <h3 id="checks-title" className="text-[13px] font-medium text-mute-strong">
                    Checks on the final post
                  </h3>
                  <ul className="mt-3 grid gap-3">
                    {v.checks.map((c, i) => (
                      <li key={i} className="grid grid-cols-[1.25rem_1fr] gap-2">
                        <Check aria-hidden className={cn("mt-0.5 size-4", c.passed ? "text-pass" : "text-warn")} strokeWidth={2} />
                        <div className="min-w-0">
                          <p className="text-[14px] font-medium text-ink">{c.rule ?? issueLabel(c.type)}</p>
                          <p className="text-[14px] leading-relaxed text-mute">{c.note}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </SheetBody>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
