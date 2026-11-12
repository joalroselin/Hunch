import { LANGUAGES } from "../../language";
import type { Audience, ProductInput, ReviewIssue } from "../../types";
import type { Draft } from "./copywriter";
import { guardrailIssues } from "./guardrails";
import { callAgent, type AgentResult, type ModelClient } from "./model";
import { REVIEWER_SYSTEM, reviewerPrompt } from "./prompts";
import { ReviewerSchema } from "./schemas";
import { noDashes } from "./text";

const postText = (d: Draft) => LANGUAGES.map((l) => [d.copy[l].hook, ...d.copy[l].slides, d.copy[l].caption, d.copy[l].cta].join("\n")).join("\n");

// Approve, or typed issues with the exact quote. Code guardrails run first and are merged in.
export async function runReviewer(
  model: ModelClient,
  opts: { product: Omit<ProductInput, "photo">; audience: Audience; draft: Draft },
): Promise<AgentResult<ReviewIssue[]>> {
  const text = postText(opts.draft);
  const res = await callAgent(
    model,
    {
      agent: "reviewer",
      schema: ReviewerSchema,
      system: REVIEWER_SYSTEM,
      prompt: reviewerPrompt(opts.product, opts.audience, { ...opts.draft.copy, hashtags: opts.draft.hashtags }),
      effort: "low",
    },
    (raw) => {
      const data = noDashes(raw);
      if (data.decision === "approve") return { ok: true, value: [] as ReviewIssue[] };
      const found = data.issues.filter((i) => i.quote.trim() && text.includes(i.quote.trim())).map((i) => ({ ...i, quote: i.quote.trim(), note: i.note.trim() }));
      if (!found.length) return { ok: false, error: "Each issue's quote must be copied exactly from the post." };
      return { ok: true, value: found };
    },
  );
  if (!res.ok) return res;
  const coded = guardrailIssues(opts.draft.copy, { price: opts.product.price });
  const all = [...res.value];
  for (const c of coded) if (!all.some((i) => i.quote === c.quote || i.quote.includes(c.quote) || c.quote.includes(i.quote))) all.push(c);
  return { ok: true, value: all };
}
