import { normalizeCode } from "./engine/results/match-rows";
import { channelsOf, normalizeLanguage } from "./language";
import type { FocusPlan, Language, ProductInput, RejectedDraft, Revision, ReviewIssue, TestRun, Version } from "./types";

// Brings saved or snapshot data up to the current types: Tagalog not Filipino, codes A1..A8,
// all three languages under copy, post status, revisions and Audience codes. Safe to run twice.

export function normalizeProduct<T extends Partial<Omit<ProductInput, "photo">>>(p: T): T & { language: Language } {
  const out = { ...p, language: normalizeLanguage(p.language) } as T & { language: Language };
  if (!out.channels?.length && (p.whereSold || p.channels)) out.channels = channelsOf(p);
  return out;
}

function issuesOf(r: RejectedDraft): ReviewIssue[] {
  return r.reasons
    .filter((x) => !x.passed)
    .map((x) => ({ type: x.type ?? (x.kind === "stereotype" ? "stereotype" : "ad_policy"), quote: x.quote ?? "", note: x.note }));
}

export function normalizeVersion<T extends Version>(v: T, lang: Language, rejected: RejectedDraft[] = []): T {
  const code = normalizeCode(v.code);
  const base = v.language ?? lang;
  const copy = { ...(v.copy ?? {}) };
  if (!copy[base]) copy[base] = { hook: v.hook, slides: v.slides, caption: v.caption, cta: v.cta };
  const mine = rejected.filter((r) => r.fixedVersionId === v.id);
  const revisions: Revision[] =
    v.revisions ??
    mine.map((r, i) => ({
      round: (Math.min(2, r.round ?? i + 1) as 1 | 2),
      issues: issuesOf(r),
      before: { [base]: r.draft.caption },
      after: { [base]: v.caption },
    }));
  return {
    ...v,
    code,
    language: base,
    copy,
    status: v.status ?? (v.openIssues?.length ? "needs_attention" : "approved"),
    revisions,
  };
}

export function normalizeRun(run: TestRun): TestRun {
  const product = normalizeProduct(run.product);
  const lang = product.language;
  const versions = run.versions.map((v) => normalizeVersion(v, lang, run.rejected));
  const codeOf = new Map(versions.map((v) => [v.audienceId, v.code]));
  const kept = run.keptReasons ?? {};
  const chosen = run.chosen.map((a) => ({ ...a, code: a.code ?? codeOf.get(a.id), keptReason: a.keptReason ?? kept[a.id] }));
  const keptOf = new Map(chosen.map((a) => [a.id, a]));
  const candidates = run.candidates.map((a) => keptOf.get(a.id) ?? a);
  return { ...run, product, versions, chosen, candidates, events: run.events ?? [] };
}

export function normalizeFocus(plan: FocusPlan, lang: Language): FocusPlan {
  return {
    ...plan,
    posts: plan.posts.map((p, i) => ({
      ...normalizeVersion(p, lang),
      dayNumber: p.dayNumber ?? i + 1,
      purpose: p.purpose ?? (i === 3 ? "runner_up_test" : "winner"),
    })),
    tests: plan.tests.map((t) => normalizeVersion(t, lang)),
  };
}

// True for data saved before the A1..A8 / Tagalog switch, or for the old Sili Mango and chili oil samples.
export function isStale(run: Pick<TestRun, "versions" | "product"> | null | undefined) {
  if (!run) return false;
  if (/sili mango|chili garlic oil/i.test(run.product?.name ?? "")) return true;
  return run.versions.some((v) => /^H\d$/i.test(v.code));
}
