import { describe, expect, it } from "vitest";

import { createMockModel } from "../engine/agents/mock-model";
import { contradicts } from "../engine/agents/analyst";
import { guardrailIssues } from "../engine/agents/guardrails";
import { PipelineError, runPipeline } from "../engine/agents/pipeline";
import { buildFocus } from "../engine/focus";
import { buildReport } from "../engine/results/build";
import { ELLE_PRODUCT, ELLE_RESULTS_CSV, elleRun } from "../engine/sample/elle";
import { sampleRunFor } from "../engine/sample/run";
import { compressTimes, startReplay } from "../engine/replay";
import { LANGUAGES, normalizeLanguage } from "../language";
import { normalizeRun } from "../normalize";
import { studioReduce, emptyStudio, postProgress } from "../studio";
import type { AgentName, StudioEvent, StudioEventKind, TestEvent, TestRun } from "../types";

const AGENTS: AgentName[] = ["strategist", "skeptic", "copywriter", "reviewer", "analyst", "planner", "system"];
const KINDS: StudioEventKind[] = [
  "run_started", "candidate_proposed", "candidate_rejected", "audience_kept", "post_drafted", "revision_requested",
  "post_revised", "post_approved", "post_flagged", "step_failed", "run_ready",
];

function expectValidEvents(events: StudioEvent[]) {
  expect(new Set(events.map((e) => e.id)).size).toBe(events.length);
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    expect(AGENTS).toContain(e.agent);
    expect(KINDS).toContain(e.kind);
    expect(typeof e.at).toBe("number");
    if (i) expect(e.at).toBeGreaterThanOrEqual(events[i - 1].at);
    expect(e.text.length).toBeGreaterThan(0);
    if (e.agent !== "system") expect(e.text).toContain(e.agent.charAt(0).toUpperCase() + e.agent.slice(1));
    expect(`${e.text} ${e.detail ?? ""}`).not.toMatch(/\u2014/);
    expect(e.text).not.toMatch(/!/);
  }
}

const count = (events: StudioEvent[]) => events.reduce<Record<string, number>>((m, e) => ((m[e.kind] = (m[e.kind] ?? 0) + 1), m), {});

async function live(opts: Parameters<typeof createMockModel>[0] = {}) {
  const model = createMockModel(opts);
  const lines: TestEvent[] = [];
  const run = await runPipeline({ ...ELLE_PRODUCT }, (e) => void lines.push(e), { model, pace: async () => {} });
  return { run, lines, model };
}

describe("guardrails", () => {
  it("pass every final Elle post and catch both bad drafts", () => {
    const run = elleRun();
    for (const v of run.versions) expect(guardrailIssues(v.copy!, { price: run.product.price })).toEqual([]);
    const a1 = run.rejected.find((r) => r.audienceName.startsWith("Cubao Expo art kids"))!;
    const issues = guardrailIssues({ taglish: { ...a1.draft, cta: "Message us" } }, { price: "₱350" });
    expect(issues.length).toBeGreaterThan(0);
    for (const i of issues) expect([a1.draft.hook, ...a1.draft.slides, a1.draft.caption, "Message us"].join("\n")).toContain(i.quote);
  });
});

describe("live pipeline on the mocked model", () => {
  it("runs end to end and emits valid StudioEvents", async () => {
    const { run, lines, model } = await live();
    const events = run.events!;
    expectValidEvents(events);
    const c = count(events);
    expect(c).toMatchObject({ run_started: 1, candidate_proposed: 20, audience_kept: 8, candidate_rejected: 12, post_drafted: 8, post_approved: 8, run_ready: 1 });
    expect(c.revision_requested).toBe(2);
    expect(c.post_revised).toBe(2);
    expect(c.post_flagged ?? 0).toBe(0);
    expect(events[0].kind).toBe("run_started");
    expect(events.at(-1)!.kind).toBe("run_ready");

    expect(run.versions.map((v) => v.code)).toEqual(["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8"]);
    expect(run.chosen.map((a) => a.code)).toEqual(["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8"]);
    expect(run.versions.map((v) => v.audienceId)).toEqual(run.chosen.map((a) => a.id));
    expect(run.cuts).toHaveLength(12);
    expect(Object.keys(run.keptReasons!)).toHaveLength(8);
    for (const v of run.versions) {
      expect(v.status).toBe("approved");
      for (const l of LANGUAGES) expect(v.copy?.[l]?.hook).toBeTruthy();
      expect(v.hook).toBe(v.copy!.taglish!.hook);
      expect(v.checks.map((x) => x.kind)).toEqual(["policy", "stereotype", "duplicate"]);
    }
    const a1 = run.versions.find((v) => v.code === "A1")!;
    expect(a1.round).toBe(2);
    expect(a1.revisions).toHaveLength(1);
    expect(a1.revisions![0].issues.some((i) => i.quote === "Hey gays!" && i.type === "ad_policy")).toBe(true);
    expect(run.rejected).toHaveLength(2);
    for (const r of run.rejected) {
      expect(new Set(r.reasons.map((x) => x.rule)).size).toBe(r.reasons.length);
      for (const x of r.reasons) expect([r.draft.hook, ...r.draft.slides, r.draft.caption].join("\n") + "\nMessage us").toContain(x.quote!);
    }

    const kinds = new Set(lines.map((l) => l.type));
    for (const k of ["status", "event", "candidate", "audiences", "version", "rejected"]) expect(kinds).toContain(k);
    expect(lines.filter((l) => l.type === "candidate")).toHaveLength(20);
    expect(lines.filter((l) => l.type === "version")).toHaveLength(8);
    expect(model.calls).toMatchObject({ strategist: 1, skeptic: 1, copywriter: 10, reviewer: 10 });

    // The Studio reducer rebuilds the same picture from the lines.
    const studio = lines.reduce(studioReduce, emptyStudio(0));
    expect(studio.candidates).toHaveLength(20);
    expect(studio.chosen).toHaveLength(8);
    expect(Object.values(postProgress(studio.events, run.versions.map((v) => v.code))).every((p) => p.status === "approved")).toBe(true);
  });

  it("retries a failed call and a call that fails validation", async () => {
    const { run, model } = await live({ failFirst: ["skeptic"], invalidFirst: ["strategist", "reviewer"] });
    expect(model.calls.skeptic).toBe(2);
    expect(model.calls.strategist).toBe(2);
    expect(run.versions).toHaveLength(8);
  });

  it("flags a post after 2 rewrite rounds instead of blocking the run", async () => {
    const { run } = await live({ stubborn: ["Café and salon owners"] });
    const a8 = run.versions.find((v) => v.code === "A8")!;
    expect(a8.status).toBe("needs_attention");
    expect(a8.openIssues?.length).toBeGreaterThan(0);
    expect(a8.round).toBe(3);
    const c = count(run.events!);
    expect(c.post_flagged).toBe(1);
    expect(c.post_approved).toBe(7);
    expect(run.events!.at(-1)!.text).toMatch(/1 needs a look/);
  });

  it("fails with step_failed when the Strategist fails twice", async () => {
    const lines: TestEvent[] = [];
    const model = createMockModel();
    const broken = { ...model, ask: async () => ({ ok: false as const, reason: "Claude is busy right now.", retryable: true }) };
    await expect(runPipeline({ ...ELLE_PRODUCT }, (e) => void lines.push(e), { model: broken, pace: async () => {} })).rejects.toThrow(PipelineError);
    const failed = lines.find((l) => l.type === "event" && l.event.kind === "step_failed");
    expect(failed).toBeTruthy();
  });
});

describe("Analyst and Planner on the mocked model", () => {
  it("explains the computed verdict and never changes it", async () => {
    const run = { ...elleRun(), id: "run_live_test", sample: undefined, mode: "live" as const };
    const r = await buildReport({ run, csvText: ELLE_RESULTS_CSV, mode: "live", model: createMockModel() });
    expect(r.verdict.winnerCode).toBe("A3");
    expect(r.verdict.explanation).toMatch(/A3/);
    expect(r.isSample).toBe(false);
  });

  it("catches an explanation that contradicts the verdict", () => {
    const v = { metric: "cost_per_result" as const, ranking: [], winnerCode: "A3", runnerUpCode: "A4", confidence: "high" as const, caveats: [] };
    const names = { A3: "Hosts getting the sala ready", A4: "Night shift workers coming home" };
    expect(contradicts("A4 won this test. It was close.", v, names)).toBeTruthy();
    expect(contradicts("A3 won with low confidence. It was close.", v, names)).toBeTruthy();
    expect(contradicts("A3 won at about ₱7 a message. A4 came second at ₱10.", v, names)).toBeNull();
  });

  it("plans 7 days with day 4 testing the runner-up", async () => {
    const run = { ...elleRun(), id: "run_live_test", sample: undefined, mode: "live" as const };
    const report = await buildReport({ run, csvText: ELLE_RESULTS_CSV, mode: "live", model: createMockModel() });
    const plan = await buildFocus({ run, report, mode: "live", model: createMockModel() });
    expect(plan.posts).toHaveLength(7);
    expect(plan.posts.map((p) => p.purpose)).toEqual(["winner", "winner", "winner", "runner_up_test", "winner", "winner", "winner"]);
    expect(new Set(plan.posts.map((p) => p.theme)).size).toBe(7);
    expect(plan.posts[3].audienceName).toBe("Officemates buying an exchange gift");
    expect(plan.posts.every((p) => p.status === "approved")).toBe(true);
  });
});

describe("sample replay", () => {
  it("compresses timings to 25-35 s", () => {
    expect(compressTimes([{ at: 0 }, { at: 120_000 }]).at(-1)).toBe(35_000);
    expect(compressTimes([{ at: 0 }, { at: 5_000 }]).at(-1)).toBe(25_000);
    const elle = elleRun().events!;
    const t = compressTimes(elle);
    expect(t.at(-1)).toBeGreaterThanOrEqual(25_000);
    expect(t.at(-1)).toBeLessThanOrEqual(35_000);
  });

  it("replays Elle's events and ends in the snapshot run; skip jumps to the end", async () => {
    const lines: TestEvent[] = [];
    const run = sampleRunFor();
    const h = startReplay(run, (e) => void lines.push(e));
    setTimeout(() => h.skip(), 20);
    const done: TestRun = await h.done;
    expect(done).toBe(run);
    const events = lines.filter((l): l is Extract<TestEvent, { type: "event" }> => l.type === "event").map((l) => l.event);
    expect(events).toHaveLength(62);
    expectValidEvents(events);
    expect(events.at(-1)!.kind).toBe("run_ready");
    expect(lines.filter((l) => l.type === "version")).toHaveLength(8);
    expect(lines.filter((l) => l.type === "rejected")).toHaveLength(2);
    expect(lines.filter((l) => l.type === "candidate")).toHaveLength(20);
    expect(done.versions.map((v) => v.code)).toEqual(elleRun().versions.map((v) => v.code));
  });

  it("swaps only the name and price for another product, and says so", () => {
    const run = sampleRunFor({ name: "Calamansi soap", price: "₱120 a bar" });
    expect(run.product.name).toBe("Calamansi soap");
    expect(run.sample?.swapped).toEqual(["name", "price"]);
    expect(run.notes?.[0]).toMatch(/still describe Elle's soy candles/);
    const text = JSON.stringify(run.versions);
    expect(text).not.toContain("Elle's Candles");
    expect(text).not.toMatch(/₱350\b/);
    expect(text).toContain("soy wax");
  });
});

describe("normalize", () => {
  it("reads old Filipino and H codes", () => {
    expect(normalizeLanguage("filipino")).toBe("tagalog");
    const old = elleRun();
    const legacy = { ...old, product: { ...old.product, language: "filipino" as never }, versions: old.versions.map((v) => ({ ...v, code: v.code.replace("A", "H") })) };
    const n = normalizeRun(legacy);
    expect(n.product.language).toBe("tagalog");
    expect(n.versions.map((v) => v.code)).toEqual(["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8"]);
  });
});
