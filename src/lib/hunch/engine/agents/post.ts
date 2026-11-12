import { LANGUAGES } from "../../language";
import type { Audience, CheckResult, Language, ProductInput, RejectedDraft, Revision, ReviewIssue, Version } from "../../types";
import { duplicateCheck } from "../checks/similar";
import { policyCheck } from "../checks/policy";
import { runCopywriter, type Draft } from "./copywriter";
import { EventLog, ISSUE_RULE, issueSummary } from "./events";
import type { ModelClient } from "./model";
import { runReviewer } from "./reviewer";

export const MAX_REWRITES = 2;

export interface PostOutcome {
  version: Version;
  rejected: RejectedDraft[];
}

const captions = (d: Draft) => Object.fromEntries(LANGUAGES.map((l) => [l, d.copy[l].caption])) as Record<Language, string>;

function reasonsOf(issues: ReviewIssue[]): CheckResult[] {
  const used = new Map<string, number>();
  return issues.map((i) => {
    const base = ISSUE_RULE[i.type];
    const n = (used.get(base) ?? 0) + 1;
    used.set(base, n);
    return {
      kind: i.type === "stereotype" ? "stereotype" : "policy",
      passed: false,
      note: i.note,
      rule: n > 1 ? `${base} (${n})` : base,
      type: i.type,
      quote: i.quote,
    };
  });
}

function toVersion(opts: {
  id: string;
  code: string;
  audience: Audience;
  draft: Draft;
  lang: Language;
  rounds: number;
  revisions: Revision[];
  openIssues: ReviewIssue[];
  error?: string;
}): Version {
  const base = opts.draft.copy[opts.lang];
  const flagged = opts.openIssues.length > 0 || !!opts.error;
  return {
    id: opts.id,
    code: opts.code,
    audienceId: opts.audience.id,
    audienceName: opts.audience.name,
    hook: base.hook,
    slides: base.slides,
    caption: base.caption,
    hashtags: opts.draft.hashtags,
    cta: base.cta,
    style: opts.draft.style,
    checks: [],
    round: opts.rounds + 1,
    language: opts.lang,
    copy: opts.draft.copy,
    status: flagged ? "needs_attention" : "approved",
    revisions: opts.revisions,
    openIssues: opts.openIssues,
    ...(opts.error ? { error: opts.error } : {}),
  };
}

// Plain fallback content so a failed card still renders; it is flagged and offers Retry.
function placeholder(product: Omit<ProductInput, "photo">, audience: Audience): Draft {
  const price = product.price ? ` ${product.price}.` : "";
  const line = (hook: string, caption: string, cta: string) => ({ hook, slides: [hook], caption, cta });
  return {
    copy: {
      taglish: line(`${product.name}, para sa ${audience.situation.replace(/\.$/, "").toLowerCase()}`, `${product.description}${price}`, "Message us"),
      english: line(`${product.name}, for ${audience.situation.replace(/\.$/, "").toLowerCase()}`, `${product.description}${price}`, "Message us"),
      tagalog: line(`${product.name}, para sa ${audience.situation.replace(/\.$/, "").toLowerCase()}`, `${product.description}${price}`, "Mag-message sa amin"),
    },
    hashtags: [],
    style: "note",
  };
}

// Copywriter, then Reviewer, with at most 2 rewrite rounds. Leftover issues flag the post instead of blocking.
export async function producePost(opts: {
  model: ModelClient;
  log: EventLog;
  product: Omit<ProductInput, "photo">;
  audience: Audience;
  code: string;
  id: string;
  theme?: string;
}): Promise<PostOutcome> {
  const { model, log, product, audience, code } = opts;
  const lang = product.language;
  const rejected: RejectedDraft[] = [];
  const revisions: Revision[] = [];

  const first = await runCopywriter(model, { product, audience, theme: opts.theme });
  if (!first.ok) {
    await log.log("copywriter", "step_failed", `Copywriter could not finish ${code}.`, code, `${first.reason} Try this post again.`);
    const version = toVersion({ id: opts.id, code, audience, draft: placeholder(product, audience), lang, rounds: 0, revisions, openIssues: [], error: first.reason });
    return { version, rejected };
  }
  let draft = first.value;
  await log.log("copywriter", "post_drafted", `Copywriter drafted ${code} for '${audience.name}'.`, code, draft.copy[lang].hook);

  let rounds = 0;
  let openIssues: ReviewIssue[] = [];
  let error: string | undefined;
  for (;;) {
    const review = await runReviewer(model, { product, audience, draft });
    if (!review.ok) {
      error = review.reason;
      await log.log("reviewer", "step_failed", `Reviewer could not check ${code}.`, code, `${review.reason} Check this post yourself or try again.`);
      break;
    }
    const issues = review.value;
    if (!issues.length) {
      await log.log(
        "reviewer",
        "post_approved",
        rounds ? `Reviewer approved ${code} on the ${rounds === 1 ? "second" : "third"} round.` : `Reviewer approved ${code}.`,
        code,
        "Passed the guardrail checks.",
      );
      break;
    }
    if (rounds >= MAX_REWRITES) {
      openIssues = issues;
      await log.log("reviewer", "post_flagged", `Reviewer flagged ${code} for you to check: ${issueSummary(issues.map((i) => i.type))}.`, code, issues[0].note);
      break;
    }
    rounds++;
    const base = draft.copy[lang];
    rejected.push({
      id: `r_${code.toLowerCase()}_${rounds}`,
      audienceId: audience.id,
      audienceName: audience.name,
      draft: { hook: base.hook, caption: base.caption, slides: base.slides },
      reasons: reasonsOf(issues),
      fixedVersionId: opts.id,
      round: rounds,
    });
    await log.log("reviewer", "revision_requested", `Reviewer sent ${code} back: ${issueSummary(issues.map((i) => i.type))}.`, code, issues[0].note);
    const fixed = await runCopywriter(model, { product, audience, theme: opts.theme, fix: { issues, previous: draft } });
    if (!fixed.ok) {
      openIssues = issues;
      error = fixed.reason;
      await log.log("copywriter", "step_failed", `Copywriter could not rewrite ${code}.`, code, `${fixed.reason} Try this post again.`);
      break;
    }
    revisions.push({ round: rounds as 1 | 2, issues, before: captions(draft), after: captions(fixed.value) });
    draft = fixed.value;
    await log.log("copywriter", "post_revised", `Copywriter rewrote ${code}.`, code, draft.copy[lang].hook);
  }
  const version = toVersion({ id: opts.id, code, audience, draft, lang, rounds, revisions, openIssues, error });
  return { version, rejected };
}

// Policy, stereotype and duplicate results for the older check badges.
export function withChecks(versions: Version[]): Version[] {
  const done: Version[] = [];
  for (const v of versions) {
    const policy = policyCheck(v);
    const stereo = (v.openIssues ?? []).find((i) => i.type === "stereotype");
    const stereotype: CheckResult = stereo
      ? { kind: "stereotype", passed: false, rule: "No stereotypes", note: stereo.note, type: "stereotype", quote: stereo.quote }
      : { kind: "stereotype", passed: true, rule: "Stereotype check", note: "Talks about the moment and the product, not about who people are." };
    const duplicate = duplicateCheck(v, done);
    const out = { ...v, checks: [policy, stereotype, duplicate] };
    done.push(out);
  }
  return done;
}
