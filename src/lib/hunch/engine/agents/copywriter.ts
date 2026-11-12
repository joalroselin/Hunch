import { CTA_SET, LANGUAGES, LANGUAGE_LABEL, channelsOf, tagalogCta } from "../../language";
import type { Audience, Language, PostCopy, PostStyle, ProductInput, ReviewIssue } from "../../types";
import { callAgent, type AgentResult, type ModelClient } from "./model";
import { COPYWRITER_SYSTEM, copywriterPrompt } from "./prompts";
import { CopywriterSchema } from "./schemas";
import { noDashes } from "./text";

export interface Draft {
  copy: Record<Language, PostCopy>;
  hashtags: string[];
  style: PostStyle;
}

function tag(t: string) {
  const s = t.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
  return s ? `#${s}` : "";
}

// Mechanical fixes first (dashes, slide 1, hashtag shape), then the rules that need a rewrite.
export function checkDraft(raw: unknown, product: Omit<ProductInput, "photo">): { ok: true; value: Draft } | { ok: false; error: string } {
  const d = noDashes(raw as { taglish: PostCopy; english: PostCopy; tagalog: PostCopy; hashtags: string[]; style: PostStyle });
  const errors: string[] = [];
  const copy = {} as Record<Language, PostCopy>;
  const shopee = channelsOf(product).includes("shopee");
  for (const lang of LANGUAGES) {
    const c = d[lang];
    const hook = c.hook.trim();
    let slides = c.slides.map((s) => s.trim()).filter(Boolean);
    if (slides[0] !== hook) slides = [hook, ...slides.filter((s) => s !== hook)];
    slides = slides.slice(0, 3);
    let cta = c.cta.trim();
    if (lang === "tagalog" && !CTA_SET.tagalog.has(cta)) cta = tagalogCta(cta) ?? tagalogCta(d.english.cta.trim()) ?? cta;
    const caption = c.caption.trim();
    if (hook.length > 90) errors.push(`${LANGUAGE_LABEL[lang]} hook is ${hook.length} characters; keep it to 90.`);
    if (hook.length + 1 + caption.length > 600) errors.push(`${LANGUAGE_LABEL[lang]} hook plus caption is over 600 characters.`);
    if (!CTA_SET[lang].has(cta)) errors.push(`${LANGUAGE_LABEL[lang]} CTA "${cta}" must be one of: ${[...CTA_SET[lang]].join(", ")}.`);
    if (!shopee && /shopee/i.test(cta)) errors.push("The seller doesn't sell on Shopee, so don't use the Shopee CTA.");
    copy[lang] = { hook, slides, caption, cta };
  }
  const hashtags = [...new Set(d.hashtags.map(tag).filter(Boolean))].slice(0, 6);
  if (hashtags.length < 3) errors.push("Give 3 to 6 hashtags.");
  if (errors.length) return { ok: false, error: errors.join(" ") };
  return { ok: true, value: { copy, hashtags, style: d.style } };
}

export async function runCopywriter(
  model: ModelClient,
  opts: { product: Omit<ProductInput, "photo">; audience: Audience; theme?: string; fix?: { issues: ReviewIssue[]; previous: Draft } },
): Promise<AgentResult<Draft>> {
  const previous = opts.fix ? { ...opts.fix.previous.copy, hashtags: opts.fix.previous.hashtags, style: opts.fix.previous.style } : undefined;
  return callAgent(
    model,
    {
      agent: "copywriter",
      schema: CopywriterSchema,
      system: COPYWRITER_SYSTEM,
      prompt: copywriterPrompt({ product: opts.product, audience: opts.audience, theme: opts.theme, fix: opts.fix && { issues: opts.fix.issues, previous } }),
      effort: "medium",
    },
    (data) => checkDraft(data, opts.product),
  );
}
