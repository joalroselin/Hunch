"use client"

import { useSyncExternalStore } from "react"

import type { IssueType, Language, Revision, Version } from "@/lib/hunch/types"

export const ISSUE_LABEL: Record<IssueType, string> = {
  cringe: "Hard sell",
  stereotype: "Stereotype",
  ad_policy: "Ad rules",
  language: "Language",
  claim: "Claim",
}

export function issueLabel(t?: string) {
  return (t && ISSUE_LABEL[t as IssueType]) || "Check"
}

export type ReviewState = "approved" | "fixed" | "flagged"

// approved: passed the first read; fixed: sent back and rewritten; flagged: still needs the seller's look.
export function reviewState(v: Pick<Version, "status" | "revisions" | "openIssues" | "round">): ReviewState {
  if (v.status === "needs_attention" || (v.openIssues?.length ?? 0) > 0) return "flagged"
  if ((v.revisions?.length ?? 0) > 0 || v.round > 1) return "fixed"
  return "approved"
}

// The revision text in the chosen language, else the first one saved.
export function revisionText(side: Revision["before"], lang: Language): { text: string; lang: Language } | null {
  const own = side[lang]
  if (own) return { text: own, lang }
  const first = (Object.entries(side) as [Language, string | undefined][]).find(([, t]) => !!t)
  return first ? { text: first[1]!, lang: first[0] } : null
}

const PHONE = "(max-width: 767px)"

function subscribePhone(cb: () => void) {
  const mq = window.matchMedia(PHONE)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}

export function useIsPhone() {
  return useSyncExternalStore(
    subscribePhone,
    () => window.matchMedia(PHONE).matches,
    () => false
  )
}
