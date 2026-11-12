import type { StudioState } from "@/lib/hunch/studio"
import type { AgentName, StudioEvent } from "@/lib/hunch/types"

import { afterColon, type Candidate, type StudioView } from "./derive"

// The Studio as a group chat. Every message is read from the StudioEvent log.

export type Speaker = Exclude<AgentName, "system">

export const TEAM: { id: Speaker; name: string }[] = [
  { id: "strategist", name: "Strategist" },
  { id: "skeptic", name: "Skeptic" },
  { id: "copywriter", name: "Copywriter" },
  { id: "reviewer", name: "Reviewer" },
  { id: "analyst", name: "Analyst" },
  { id: "planner", name: "Planner" },
]

export const NAME_OF = Object.fromEntries(TEAM.map((t) => [t.id, t.name])) as Record<Speaker, string>

// sent: waiting for the Reviewer; back: sent back; ok: approved; flag: left for the seller to check.
export type DraftFate = "sent" | "back" | "ok" | "flag"

export type ChatMsg =
  | { kind: "ask"; id: string; text: string }
  | { kind: "names"; id: string; agent: "strategist"; names: Candidate[] }
  | { kind: "cut"; id: string; agent: "skeptic"; name: string; reason: string }
  | { kind: "draft"; id: string; agent: "copywriter"; code: string; label: string; hook?: string; say?: string; quote?: string; fate: DraftFate }
  | { kind: "back"; id: string; agent: "reviewer"; code: string; label: string; hook?: string; quote?: string; reason: string }
  | { kind: "flag"; id: string; agent: "reviewer"; code: string; label: string; reason: string }
  | { kind: "fail"; id: string; agent: Speaker | null; code?: string; text: string }

type Draft = Extract<ChatMsg, { kind: "draft" }>

export function sentence(text: string) {
  const t = text.trim()
  if (!t) return t
  const c = t.charAt(0).toUpperCase() + t.slice(1)
  return /[.?!]$/.test(c) ? c : `${c}.`
}

// "Copywriter rewrote A1 around the thrift haul." -> "Rewrote it around the thrift haul."
function rewriteLine(text: string) {
  const rest = text.replace(/^Copywriter rewrote \S+?(?=[\s.]|$)/, "").trim()
  return rest && rest !== "." ? sentence(`Rewrote it ${rest}`) : "Rewrote it."
}

const isCode = (id?: string): id is string => !!id && /^A\d$/.test(id)

export function buildChat(s: StudioState, v: StudioView, ask?: string): ChatMsg[] {
  const out: ChatMsg[] = []
  if (ask?.trim()) out.push({ kind: "ask", id: "ask", text: ask.trim() })
  const candidate = new Map(v.candidates.map((c) => [c.id, c]))
  const card = new Map(v.writing.map((w) => [w.code, w]))
  const last = new Map<string, Draft>()
  const rounds = new Map<string, number>()
  let names: Extract<ChatMsg, { kind: "names" }> | null = null

  for (const e of s.events) {
    const code = isCode(e.refId) ? e.refId : undefined
    const label = code ? (card.get(code)?.label ?? code) : ""
    switch (e.kind) {
      case "candidate_proposed": {
        const c = e.refId ? candidate.get(e.refId) : undefined
        if (!c) break
        if (!names) {
          names = { kind: "names", id: "names", agent: "strategist", names: [] }
          out.push(names)
        }
        names.names.push(c)
        break
      }
      case "candidate_rejected": {
        const c = e.refId ? candidate.get(e.refId) : undefined
        out.push({ kind: "cut", id: e.id, agent: "skeptic", name: c?.label ?? "", reason: sentence(c?.short ?? afterColon(e.text) ?? e.detail ?? "Cut") })
        break
      }
      case "post_drafted":
      case "post_revised": {
        if (!code) break
        const m: Draft = { kind: "draft", id: e.id, agent: "copywriter", code, label, hook: e.detail, say: e.kind === "post_revised" ? rewriteLine(e.text) : undefined, fate: "sent" }
        last.set(code, m)
        out.push(m)
        break
      }
      case "revision_requested": {
        if (!code) break
        const n = (rounds.get(code) ?? 0) + 1
        rounds.set(code, n)
        const audience = card.get(code)?.audience
        const drafts = audience ? s.rejected.filter((r) => r.audienceId === audience.id).sort((a, b) => (a.round ?? 0) - (b.round ?? 0)) : []
        const quote = (drafts[n - 1] ?? drafts[drafts.length - 1])?.reasons.find((r) => r.quote)?.quote
        const d = last.get(code)
        if (d) {
          d.fate = "back"
          d.quote = quote
        }
        out.push({ kind: "back", id: e.id, agent: "reviewer", code, label, hook: d?.hook, quote, reason: sentence(afterColon(e.text) ?? e.detail ?? e.text) })
        break
      }
      case "post_approved": {
        const d = code ? last.get(code) : undefined
        if (d) d.fate = "ok"
        break
      }
      case "post_flagged": {
        if (!code) break
        const d = last.get(code)
        if (d) d.fate = "flag"
        out.push({ kind: "flag", id: e.id, agent: "reviewer", code, label, reason: sentence(e.detail ?? afterColon(e.text) ?? e.text) })
        break
      }
      case "step_failed":
        out.push({ kind: "fail", id: e.id, agent: e.agent === "system" ? null : e.agent, code, text: e.text })
        break
    }
  }
  return out
}

// Who is writing right now, guessed from where the run is.
export function typingNow(v: StudioView, running: boolean): Speaker[] {
  if (!running || v.ready) return []
  if (!v.skepticDone) return v.candidates.length >= 20 || v.phase >= 1 ? ["skeptic"] : ["strategist"]
  const out: Speaker[] = []
  if (v.writing.some((w) => w.status === "waiting" || w.status === "drafting")) out.push("copywriter")
  if (v.writing.some((w) => w.status === "in_review")) out.push("reviewer")
  return out
}

// Post codes in the order the Reviewer let them through.
export function landed(events: StudioEvent[]) {
  const out: string[] = []
  for (const e of events) {
    if ((e.kind === "post_approved" || e.kind === "post_flagged") && isCode(e.refId) && !out.includes(e.refId)) out.push(e.refId)
  }
  return out
}

export function spoke(events: StudioEvent[]) {
  return new Set<AgentName>(events.map((e) => e.agent))
}
