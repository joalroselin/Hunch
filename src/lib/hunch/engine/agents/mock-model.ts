import type { AgentName, PostCopy, Version } from "../../types";
import { elleFocus, elleRun, elleSavedReport } from "../sample/elle";
import type { ModelClient } from "./model";

// Fixture-shaped model for tests and HUNCH_MODE=mock. Answers each agent from Elle's run, so the
// live pipeline can run end to end with no API key. Options inject failures to exercise retries and flags.
export interface MockOptions {
  failFirst?: AgentName[]; // first call to these agents fails (retryable)
  invalidFirst?: AgentName[]; // first call returns data that fails validation
  stubborn?: string[]; // audience names the Reviewer never approves
  delayMs?: number;
}

const field = (prompt: string, label: string) => prompt.match(new RegExp(`^${label}: (.+)$`, "m"))?.[1]?.trim();
const inPrompt = (prompt: string, text: string) => prompt.includes(JSON.stringify(text).slice(1, -1));

function langs(v: Version): { taglish: PostCopy; english: PostCopy; tagalog: PostCopy } {
  const base = { hook: v.hook, slides: v.slides, caption: v.caption, cta: v.cta };
  return { taglish: v.copy?.taglish ?? base, english: v.copy?.english ?? base, tagalog: v.copy?.tagalog ?? base };
}

export function createMockModel(opts: MockOptions = {}): ModelClient & { calls: Record<string, number> } {
  const run = elleRun();
  const focus = elleFocus();
  const saved = elleSavedReport();
  const calls: Record<string, number> = {};

  const answer = (agent: AgentName, prompt: string, n: number): unknown => {
    const bad = opts.invalidFirst?.includes(agent) && n === 1;
    if (agent === "strategist") {
      const candidates = run.candidates.map((c) => ({
        label: c.name,
        who: c.who,
        buyingMoment: c.situation,
        angle: c.whyItFits,
        motive: c.motive ?? "self_use",
        bestChannel: "facebook",
        whereTheyAre: c.whereTheyAre,
        tone: c.tone,
      }));
      return { candidates: bad ? candidates.slice(0, 12) : candidates };
    }
    if (agent === "skeptic") {
      const kept = run.chosen.map((a) => ({ id: a.id, reason: run.keptReasons?.[a.id] ?? "Distinct moment." }));
      return { kept: bad ? kept.slice(0, 7) : kept, cuts: run.cuts ?? [] };
    }
    if (agent === "copywriter") {
      const theme = field(prompt, "Theme for this post");
      const audience = field(prompt, "Audience");
      if (theme) {
        const p = focus.posts.find((x) => x.theme === theme) ?? focus.posts[0];
        return { ...langs(p), hashtags: p.hashtags, style: p.style };
      }
      const v = run.versions.find((x) => x.audienceName === audience) ?? run.versions[0];
      const draft = run.rejected.find((r) => r.audienceId === v.audienceId);
      const rewrite = /^Rewrite: yes/m.test(prompt);
      const out = { ...langs(v), hashtags: v.hashtags, style: v.style };
      if (draft && !rewrite) out.taglish = { hook: draft.draft.hook, slides: draft.draft.slides, caption: draft.draft.caption, cta: v.cta };
      if (bad) out.taglish = { ...out.taglish, hook: "x".repeat(120) };
      return out;
    }
    if (agent === "reviewer") {
      const audience = field(prompt, "Audience");
      if (audience && opts.stubborn?.includes(audience)) {
        const v = run.versions.find((x) => x.audienceName === audience);
        const quote = v && inPrompt(prompt, v.hook) ? v.hook : "";
        return { decision: "revise", issues: [{ type: "language", quote, note: "The English and Tagalog say different things." }] };
      }
      const v = run.versions.find((x) => x.audienceName === audience);
      const draft = v && run.rejected.find((r) => r.audienceId === v.audienceId);
      const issues = (draft?.reasons ?? [])
        .filter((r) => r.quote && inPrompt(prompt, r.quote))
        .map((r) => ({ type: r.type ?? "cringe", quote: r.quote!, note: r.note, language: "taglish" as const }));
      if (bad) return { decision: "revise", issues: [{ type: "claim", quote: "not in the post", note: "x" }] };
      return issues.length ? { decision: "revise", issues } : { decision: "approve", issues: [] };
    }
    if (agent === "analyst") {
      const winner = prompt.match(/"winnerCode":"(A\d)"/)?.[1] ?? "A1";
      const runnerUp = prompt.match(/"runnerUpCode":"(A\d)"/)?.[1];
      const name = (code: string) => field(prompt, code) ?? code;
      if (winner === saved.verdict.winnerCode && runnerUp === saved.verdict.runnerUpCode) return { explanation: saved.verdict.explanation, caveats: [] };
      return {
        explanation: `${name(winner)} won: ${winner} did best on this test. ${runnerUp ? `${name(runnerUp)} came second.` : "There was no clear second."} Next week, aim most posts at ${winner}.`,
        caveats: [],
      };
    }
    if (agent === "planner") {
      return { days: focus.posts.map((p, i) => ({ day: i + 1, purpose: p.purpose ?? "winner", theme: p.theme ?? `Day ${i + 1}` })) };
    }
    return {};
  };

  return {
    calls,
    retryDelayMs: 0,
    async ask(o) {
      const n = (calls[o.agent] = (calls[o.agent] ?? 0) + 1);
      if (opts.delayMs) await new Promise((r) => setTimeout(r, opts.delayMs));
      if (opts.failFirst?.includes(o.agent) && n === 1) return { ok: false, reason: "Claude is busy right now.", retryable: true };
      return { ok: true, data: answer(o.agent, o.prompt, n) as never };
    },
  };
}
