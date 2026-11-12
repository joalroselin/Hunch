import { LANGUAGES } from "../../language";
import type { IssueType, Language, PostCopy, ReviewIssue } from "../../types";
import { lintText } from "../checks/policy";

// The guardrails table from the build spec. The same text goes into the Copywriter and Reviewer prompts.
export const GUARDRAILS = `Guardrails. Every post is checked against this list. Issue types:
- stereotype: the audience or copy leans on age, gender, region or class cliches instead of the buying moment. Flag: "Para sa mga nanay na laging nasa kusina".
- cringe: forced slang, stacked emoji, all caps, fake urgency, or hype words ("insane", "must-have"). Flag: "GRABE SOBRANG SARAP!!! 🔥🔥🔥".
- language: Taglish that reads machine-made, Tagalog that is formal or textbook, or English and Tagalog versions that say different things. Flag: literal word-for-word Tagalog.
- claim: health, weight, medical, or "best in the Philippines" claims; prices or discounts the seller didn't give. Flag: "Pampapayat", "cures colds".
- ad_policy: copy that asserts or implies the reader's personal attributes (health, religion, ethnicity, finances, sexuality, age); before-and-after; shocking or sensational wording. Flag: "Are you struggling with money this Christmas?"

Rules for every post:
- Talk about the situation and the product, never about who the reader is.
- Use only facts from the seller's input: product, price, channels. No invented ingredients, awards, stock limits, discounts, gift wrap or delivery promises.
- Hook 90 characters or fewer. Hook plus caption 600 characters or fewer. 3 to 6 hashtags, lowercase, no spaces, nothing banned or misleading.
- One CTA, matched to the channel: "Order on Shopee", "Message us", or "Comment 'order'". In Tagalog: "Mag-order sa Shopee", "Mag-message sa amin", "Mag-comment ng 'order'".
- The Taglish, English and Tagalog versions carry the same meaning and the same facts.
- At most one or two emoji, never stacked, the way real sellers post. No strings of exclamation marks, no em dashes, no all caps.`;

// Real posts use an emoji or two; only a stack of 3 or more reads forced.
const EMOJI = /(?:\p{Extended_Pictographic}\uFE0F?\s*){3,}/u;
const HYPE = /\b(insane|must[- ]have|grabe|sobrang sarap|best ever|limited stocks?|order na bago maubos|hurry|last chance|sulit na sulit)\b/i;
const BEST = /\b(best in the philippines|pinakamasarap sa pilipinas|number one in the philippines|#1 in the philippines)\b/i;
// Address terms that say who the reader is. Meta rejects these, and they read as a brand guessing.
const LABELS = /\b(hey gays|para sa mga beks|mga beks|hey titas|mga tita|mga mars|are you single|single ka ba)\b/i;
const CAPS = /\b[A-Z][A-Z'-]{2,}(?:[\s,]+[A-Z][A-Z'-]{2,}){2,}\b/;

function sentenceWith(text: string, at: number) {
  const start = Math.max(text.lastIndexOf(".", at - 1), text.lastIndexOf("?", at - 1), text.lastIndexOf("\n", at - 1)) + 1;
  return text.slice(start, at + 1).trim();
}

// Deterministic checks the Reviewer gets for free. Every quote is copied exactly from the post.
export function guardrailIssues(copy: Partial<Record<Language, PostCopy>>, opts: { price?: string } = {}): ReviewIssue[] {
  const out: ReviewIssue[] = [];
  const seen = new Set<string>();
  const push = (type: IssueType, quote: string, note: string, language: Language) => {
    const k = `${type}|${quote}`;
    if (!quote || seen.has(k)) return;
    seen.add(k);
    out.push({ type, quote, note, language });
  };
  for (const lang of LANGUAGES) {
    const c = copy[lang];
    if (!c) continue;
    const text = [c.hook, ...c.slides, c.caption, c.cta].join("\n");
    for (const hit of lintText(text)) push(hit.type ?? "ad_policy", hit.quote ?? "", hit.note, lang);
    const emoji = text.match(EMOJI);
    if (emoji) push("cringe", emoji[0].trim(), "One or two emoji at most. A row of them reads like an ad.", lang);
    const caps = text.match(CAPS);
    if (caps) push("cringe", caps[0], "All caps reads like shouting. Write it in sentence case.", lang);
    const hype = text.match(HYPE);
    if (hype) push("cringe", hype[0], "Hype words and fake urgency make a small seller sound pushy. Say what the moment is instead.", lang);
    const label = text.match(LABELS);
    if (label) push("ad_policy", label[0], "That says who the reader is. Meta does not allow it. Talk about the moment instead.", lang);
    const best = text.match(BEST);
    if (best) push("claim", best[0], "That is a claim the seller never made. Take it out.", lang);
    const bang = text.indexOf("!!");
    if (bang >= 0) push("cringe", sentenceWith(text, bang + 1), "One exclamation mark at most. A row of them reads pushy.", lang);
    if (!opts.price) {
      const amount = text.match(/₱\s?\d[\d,]*/);
      if (amount) push("claim", amount[0], "The seller gave no price, so the post can't name one.", lang);
    }
  }
  return out;
}
