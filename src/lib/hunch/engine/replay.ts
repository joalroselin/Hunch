import type { StudioEvent, TestEvent, TestRun } from "../types";

// Replays a saved run's StudioEvents at the demo's pace (paceTimes), or compressed or stretched to fit minMs-maxMs,
// with the same NDJSON lines a live run sends. Works on the server and in the browser.

export const REPLAY_MIN_MS = 25_000;
export const REPLAY_MAX_MS = 35_000;

export function compressTimes(events: Pick<StudioEvent, "at">[], minMs = REPLAY_MIN_MS, maxMs = REPLAY_MAX_MS): number[] {
  const total = events.length ? events[events.length - 1].at : 0;
  if (total <= 0) return events.map(() => 0);
  const target = Math.min(maxMs, Math.max(minMs, total));
  const k = target / total;
  return events.map((e) => Math.round(e.at * k));
}

// The demo's own rhythm, about 11 s: the 20 guesses pour in, the cuts cascade, the posts come in steadily,
// and a post sent back holds long enough to read why.
export function paceTimes(events: Pick<StudioEvent, "agent" | "kind">[]): number[] {
  let t = 0;
  return events.map((e, i) => {
    const prev = events[i - 1];
    if (!prev) return 0;
    if (e.agent === "strategist") t += prev.agent === "strategist" ? 120 : 350;
    else if (e.agent === "skeptic") t += prev.agent === "skeptic" ? 95 : 500;
    else t += prev.agent === "skeptic" ? 500 : e.kind === "run_ready" ? 500 : 200;
    if (prev.kind === "revision_requested") t += 750;
    return t;
  });
}

export interface ReplayOptions {
  minMs?: number;
  maxMs?: number;
  signal?: AbortSignal;
  now?: () => number;
}

export interface ReplayHandle {
  done: Promise<TestRun>; // resolves with the final run after the last line
  skip(): void; // jump to run_ready (Shift + Right arrow in the Studio)
  cancel(): void;
}

type Emit = (e: TestEvent) => void | Promise<void>;

function abortError() {
  const e = new Error("Replay stopped");
  e.name = "AbortError";
  return e;
}

export function startReplay(run: TestRun, emit: Emit, opts: ReplayOptions = {}): ReplayHandle {
  const now = opts.now ?? (() => Date.now());
  const events = run.events ?? [];
  const times = opts.minMs != null || opts.maxMs != null ? compressTimes(events, opts.minMs, opts.maxMs) : paceTimes(events);
  let skipping = false;
  let cancelled = false;
  const wakers = new Set<() => void>();
  const wake = () => {
    for (const w of wakers) w();
    wakers.clear();
  };

  const wait = (ms: number) =>
    new Promise<void>((resolve, reject) => {
      if (cancelled || opts.signal?.aborted) return reject(abortError());
      if (skipping || ms <= 0) return resolve();
      const finish = () => {
        clearTimeout(t);
        wakers.delete(finish);
        if (cancelled || opts.signal?.aborted) reject(abortError());
        else resolve();
      };
      const t = setTimeout(finish, ms);
      wakers.add(finish);
    });
  opts.signal?.addEventListener("abort", wake, { once: true });

  const done = (async () => {
    const t0 = now();
    const byCode = new Map(run.versions.map((v) => [v.code, v]));
    const sentBack = new Map<string, number>();
    const phase = new Set<string>();
    const once = async (key: string, e: TestEvent) => {
      if (phase.has(key)) return;
      phase.add(key);
      await emit(e);
    };
    const lastSkeptic = events.map((e) => e.agent).lastIndexOf("skeptic");

    await emit({ type: "status", step: "audiences", message: `Strategist is thinking of 20 kinds of people who might buy ${run.product.name}` });
    for (let i = 0; i < events.length; i++) {
      await wait(times[i] - (now() - t0));
      const e = events[i];
      if (e.kind === "candidate_proposed") {
        const c = run.candidates.find((x) => x.id === e.refId);
        if (c) await emit({ type: "candidate", candidate: c });
      }
      if (e.agent === "skeptic") await once("choosing", { type: "status", step: "choosing", message: "Skeptic is cutting 20 down to 8" });
      if (e.kind === "post_drafted") await once("writing", { type: "status", step: "writing", message: "Copywriter is writing 8 posts, Reviewer checks each one" });
      if (e.agent === "reviewer") await once("checking", { type: "status", step: "checking", message: "Reviewer is checking each post against the guardrails" });
      await emit({ type: "event", event: { ...e, at: times[i] } });
      if (i === lastSkeptic) {
        await emit({
          type: "audiences",
          candidates: run.candidates,
          chosen: run.chosen,
          skeptic: run.keptReasons && run.cuts ? { keptReasons: run.keptReasons, cuts: run.cuts } : undefined,
        });
      }
      if (e.kind === "revision_requested" && e.refId) {
        const v = byCode.get(e.refId);
        const n = (sentBack.get(e.refId) ?? 0) + 1;
        sentBack.set(e.refId, n);
        const r = v && run.rejected.filter((x) => x.fixedVersionId === v.id || x.audienceId === v.audienceId)[n - 1];
        if (r) await emit({ type: "rejected", rejected: r });
        await emit({ type: "status", step: "rewriting", message: `Copywriter is rewriting ${e.refId}` });
      }
      if ((e.kind === "post_approved" || e.kind === "post_flagged") && e.refId) {
        const v = byCode.get(e.refId);
        if (v) await emit({ type: "version", version: v });
      }
    }
    const fixed = run.rejected.length;
    await emit({ type: "status", step: "done", message: `${run.versions.length} posts ready. ${fixed} ${fixed === 1 ? "draft was" : "drafts were"} sent back and fixed.` });
    return run;
  })();

  return {
    done,
    skip() {
      skipping = true;
      wake();
    },
    cancel() {
      cancelled = true;
      wake();
    },
  };
}

export function replayRun(run: TestRun, emit: Emit, opts: ReplayOptions = {}) {
  return startReplay(run, emit, opts).done;
}
