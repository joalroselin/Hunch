import type { AgentName, Audience, PostStatus, RejectedDraft, SkepticDecision, StudioEvent, TestEvent, TestRun, Version } from "./types";

// Pure Studio state, driven by the NDJSON lines (live or replay) and saved in the store so a refresh can show it.

export type StudioStatus = "running" | "done" | "failed" | "interrupted";

export interface StudioState {
  startedAt: number;
  status: StudioStatus;
  message: string; // live line, e.g. "Skeptic is cutting 20 down to 8"
  events: StudioEvent[];
  candidates: Audience[]; // in proposal order
  chosen: Audience[];
  skeptic?: SkepticDecision;
  versions: Version[]; // final posts so far
  rejected: RejectedDraft[];
  error?: string;
  run?: TestRun; // set on done
}

export function emptyStudio(startedAt = Date.now()): StudioState {
  return { startedAt, status: "running", message: "Starting", events: [], candidates: [], chosen: [], versions: [], rejected: [] };
}

export function studioReduce(s: StudioState, e: TestEvent): StudioState {
  switch (e.type) {
    case "status":
      return { ...s, message: e.message };
    case "event":
      return { ...s, events: [...s.events.filter((x) => x.id !== e.event.id), e.event] };
    case "candidate":
      return s.candidates.some((c) => c.id === e.candidate.id) ? s : { ...s, candidates: [...s.candidates, e.candidate] };
    case "audiences":
      return { ...s, candidates: e.candidates, chosen: e.chosen, skeptic: e.skeptic };
    case "version":
      return { ...s, versions: [...s.versions.filter((v) => v.code !== e.version.code), e.version] };
    case "rejected":
      return { ...s, rejected: [...s.rejected.filter((r) => r.id !== e.rejected.id), e.rejected] };
    case "done":
      return { ...studioFromRun(e.run), startedAt: s.startedAt };
    case "error":
      return { ...s, status: "failed", error: e.message, message: e.message };
    default:
      return s;
  }
}

export function studioFromRun(run: TestRun): StudioState {
  return {
    startedAt: Date.parse(run.createdAt) || Date.now(),
    status: "done",
    message: "All 8 posts are ready.",
    events: run.events ?? [],
    candidates: run.candidates,
    chosen: run.chosen,
    skeptic: run.keptReasons && run.cuts ? { keptReasons: run.keptReasons, cuts: run.cuts } : undefined,
    versions: run.versions,
    rejected: run.rejected,
    run,
  };
}

export interface PostProgress {
  code: string;
  status: PostStatus;
  rounds: number; // times the Reviewer sent it back
  hook?: string; // latest drafted hook
  failed: boolean;
}

// Status per code from the log: drafting -> in_review -> approved | needs_attention, with send-back count.
export function postProgress(events: StudioEvent[], codes: string[]): Record<string, PostProgress> {
  const out: Record<string, PostProgress> = Object.fromEntries(codes.map((c) => [c, { code: c, status: "drafting" as PostStatus, rounds: 0, failed: false }]));
  for (const e of events) {
    if (!e.refId || !out[e.refId]) continue;
    const p = out[e.refId];
    if (e.kind === "post_drafted" || e.kind === "post_revised") {
      p.status = "in_review";
      p.hook = e.detail ?? p.hook;
    } else if (e.kind === "revision_requested") {
      p.status = "drafting";
      p.rounds++;
    } else if (e.kind === "post_approved") p.status = "approved";
    else if (e.kind === "post_flagged") p.status = "needs_attention";
    else if (e.kind === "step_failed") {
      p.status = "needs_attention";
      p.failed = true;
    }
  }
  return out;
}

export type CandidateFate = "proposed" | "kept" | "cut";

export function candidateFates(events: StudioEvent[]): Record<string, { fate: CandidateFate; code?: string; reason?: string }> {
  const out: Record<string, { fate: CandidateFate; code?: string; reason?: string }> = {};
  for (const e of events) {
    if (!e.refId) continue;
    if (e.kind === "candidate_proposed") out[e.refId] = { fate: "proposed" };
    if (e.kind === "audience_kept") out[e.refId] = { fate: "kept", code: e.text.match(/\bas (A\d)\b/)?.[1], reason: e.detail };
    if (e.kind === "candidate_rejected") out[e.refId] = { fate: "cut", reason: e.detail };
  }
  return out;
}

const STEP_LINE: Partial<Record<AgentName, string>> = {
  strategist: "Strategist is proposing 20 audiences",
  skeptic: "Skeptic is cutting 20 down to 8",
  copywriter: "Copywriter is writing the 8 posts",
  reviewer: "Reviewer is checking each post",
};

// The live line at the top of the Studio, from the last event.
export function currentStep(events: StudioEvent[]): string {
  const last = events[events.length - 1];
  if (!last) return "Starting";
  if (last.kind === "run_ready") return last.text;
  if (last.kind === "run_started") return STEP_LINE.strategist!;
  if (last.agent === "copywriter" || last.agent === "reviewer") {
    const done = events.filter((e) => e.kind === "post_approved" || e.kind === "post_flagged").length;
    return `Copywriter and Reviewer are on the posts, ${done} of 8 done`;
  }
  return STEP_LINE[last.agent] ?? last.text;
}
