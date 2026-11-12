import type { StudioState } from "@/lib/hunch/studio"
import type { Audience, CutCategory, StudioEvent } from "@/lib/hunch/types"

// Everything the Studio shows is read from the event log; the stream's other lines only add names and categories.

export type Fate = "proposed" | "kept" | "cut"

export interface Candidate {
  id: string
  label: string
  moment?: string
  fate: Fate
  code?: string
  keptReason?: string
  short?: string // the Skeptic's short reason, from the event line
  reason?: string // the full reason
  category?: CutCategory
}

export type CardStatus = "waiting" | "drafting" | "in_review" | "approved" | "needs_attention" | "failed"

export interface WritingCard {
  code: string
  label: string
  audience?: Audience
  status: CardStatus
  rounds: number
  hook?: string
  sentBack?: { note?: string; quote?: string; summary: string }
  flag?: string
  failNote?: string // the agent's plain line
  failDetail?: string // the technical reason, kept for the tooltip
}

export interface StudioView {
  candidates: Candidate[] // proposal order
  kept: Candidate[] // kept order, A1..A8
  writing: WritingCard[]
  phase: number // 0 propose, 1 cut, 2 write, 3 review, 4 ready
  skepticDone: boolean
  ready: boolean
  approved: number
  flagged: number
  failed: number
  latest?: StudioEvent
}

const quoted = (text: string) => text.match(/'(.+?)'(?=[:.\s]|$)/)?.[1]

// "Skeptic dropped 'X': too broad, it fits everyone." -> "too broad, it fits everyone"
export function afterColon(text: string) {
  const i = text.indexOf("': ")
  const j = i >= 0 ? i + 3 : text.indexOf(": ") + 2
  return j > 1 ? text.slice(j).replace(/\.$/, "") : undefined
}

function inferCategory(short?: string): CutCategory | undefined {
  if (!short) return undefined
  if (/stereotype/i.test(short)) return "stereotype"
  if (/too broad/i.test(short)) return "too_broad"
  if (/^same moment/i.test(short)) return "duplicate"
  if (/can't buy where|doesn't sell on|doesn't sell in|not where/i.test(short)) return "off_channel"
  return undefined
}

const codeNum = (c?: string) => Number(c?.replace(/\D/g, "")) || 0

export function deriveView(s: StudioState): StudioView {
  const byId = new Map(s.candidates.map((c) => [c.id, c]))
  const cutOf = new Map((s.skeptic?.cuts ?? []).map((c) => [c.id, c]))
  const out = new Map<string, Candidate>()
  const keptOrder: string[] = []
  const cards = new Map<string, WritingCard>()
  let latest: StudioEvent | undefined
  let ready = false

  for (const e of s.events) {
    latest = e
    if (e.kind === "run_ready") ready = true
    if (e.kind === "candidate_proposed" && e.refId) {
      const c = byId.get(e.refId)
      out.set(e.refId, { id: e.refId, label: c?.name ?? quoted(e.text) ?? e.refId, moment: c?.situation ?? e.detail, fate: "proposed" })
      continue
    }
    if (e.kind === "audience_kept" && e.refId) {
      const prev = out.get(e.refId) ?? { id: e.refId, label: quoted(e.text) ?? e.refId, fate: "proposed" as Fate }
      const code = e.text.match(/\bas (A\d)\b/)?.[1] ?? byId.get(e.refId)?.code
      out.set(e.refId, { ...prev, fate: "kept", code, keptReason: e.detail ?? byId.get(e.refId)?.keptReason })
      keptOrder.push(e.refId)
      continue
    }
    if (e.kind === "candidate_rejected" && e.refId) {
      const prev = out.get(e.refId) ?? { id: e.refId, label: quoted(e.text) ?? e.refId, fate: "proposed" as Fate }
      const short = afterColon(e.text)
      const cut = cutOf.get(e.refId)
      out.set(e.refId, { ...prev, fate: "cut", short, reason: e.detail ?? cut?.reason, category: cut?.category ?? inferCategory(short) })
      continue
    }
    const code = e.refId
    if (!code || !/^A\d$/.test(code)) continue
    const card = cards.get(code) ?? { code, label: code, status: "drafting" as CardStatus, rounds: 0 }
    switch (e.kind) {
      case "post_drafted":
      case "post_revised":
        card.status = "in_review"
        card.hook = e.detail ?? card.hook
        card.failNote = undefined
        break
      case "revision_requested":
        card.status = "drafting"
        card.rounds++
        card.sentBack = { note: e.detail, summary: afterColon(e.text) ?? e.text }
        break
      case "post_approved":
        card.status = "approved"
        card.flag = undefined
        card.failNote = undefined
        break
      case "post_flagged":
        card.status = "needs_attention"
        card.flag = e.detail ?? afterColon(e.text)
        break
      case "step_failed":
        card.status = "failed"
        card.failNote = e.text
        card.failDetail = e.detail
        break
    }
    cards.set(code, card)
  }

  // Categories land with the Skeptic's decision line; fill any the event text could not name.
  for (const c of out.values()) if (c.fate === "cut" && !c.category) c.category = cutOf.get(c.id)?.category

  const candidates = [...out.values()]
  const kept = keptOrder.map((id) => out.get(id)!).sort((a, b) => codeNum(a.code) - codeNum(b.code))
  const decided = candidates.filter((c) => c.fate !== "proposed").length
  const skepticDone = kept.length >= 8 || (candidates.length >= 20 && decided >= candidates.length) || cards.size > 0

  const chosenByCode = new Map(s.chosen.map((a) => [a.code, a]))
  const keptByCode = new Map(kept.map((k) => [k.code, k]))
  const codes = kept.map((k) => k.code).filter((c): c is string => !!c)
  for (const c of cards.keys()) if (!codes.includes(c)) codes.push(c)
  codes.sort((a, b) => codeNum(a) - codeNum(b))

  const writing: WritingCard[] = skepticDone
    ? codes.map((code) => {
        const k = keptByCode.get(code)
        const audience = chosenByCode.get(code) ?? (k ? byId.get(k.id) : undefined)
        const card = cards.get(code) ?? { code, label: code, status: (cards.size ? "drafting" : "waiting") as CardStatus, rounds: 0 }
        const label = audience?.name ?? k?.label ?? card.label
        let sentBack = card.sentBack
        if (sentBack && audience) {
          const drafts = s.rejected.filter((r) => r.audienceId === audience.id).sort((a, b) => (a.round ?? 0) - (b.round ?? 0))
          const r = drafts[card.rounds - 1] ?? drafts[drafts.length - 1]
          const quote = r?.reasons.find((x) => x.quote)?.quote
          if (quote) sentBack = { ...sentBack, quote }
        }
        return { ...card, label, audience, sentBack }
      })
    : []

  const approved = writing.filter((w) => w.status === "approved").length
  const flagged = writing.filter((w) => w.status === "needs_attention").length
  const failed = writing.filter((w) => w.status === "failed").length
  const drafted = writing.filter((w) => w.hook).length
  const settled = approved + flagged + writing.filter((w) => w.status === "failed").length

  let phase = 0
  if (candidates.some((c) => c.fate !== "proposed") || (latest?.agent === "skeptic")) phase = 1
  if (skepticDone) phase = 2
  if (writing.length && drafted >= writing.length) phase = 3
  if (ready || (writing.length >= 8 && settled >= writing.length)) phase = 4

  return { candidates, kept, writing, phase, skepticDone, ready, approved, flagged, failed, latest }
}

// The big live line at the top of the Studio.
export function liveLine(s: StudioState, v: StudioView) {
  if (s.status === "failed") return "The run stopped."
  if (s.status === "interrupted") return "The run was cut short."
  const look = v.flagged + v.failed
  if (v.ready) return look ? `All 8 posts are done. ${look} ${look === 1 ? "needs" : "need"} a look.` : "All 8 posts are ready."
  if (v.phase === 0) return "Strategist is listing 20 kinds of buyers"
  if (v.phase === 1) return "Skeptic is cutting 20 down to 8"
  if (v.phase === 2) return "Copywriter is writing the 8 posts"
  return "Reviewer is checking the last posts"
}
