import type { Channel, Language, PostCopy, Version } from "./types";

export const LANGUAGES: Language[] = ["taglish", "english", "tagalog"];

export const LANGUAGE_LABEL: Record<Language, string> = {
  taglish: "Taglish",
  english: "English",
  tagalog: "Tagalog",
};

// Reads old stored values ("filipino") and anything unknown as a valid Language.
export function normalizeLanguage(x: unknown, fallback: Language = "taglish"): Language {
  if (x === "taglish" || x === "english" || x === "tagalog") return x;
  if (x === "filipino" || x === "tl" || x === "fil") return "tagalog";
  if (x === "en") return "english";
  return fallback;
}

// Copy for one language, falling back to the base fields.
export function copyFor(v: Pick<Version, "hook" | "slides" | "caption" | "cta" | "copy" | "language">, lang: Language): PostCopy {
  const own = v.copy?.[lang];
  if (own) return own;
  return { hook: v.hook, slides: v.slides, caption: v.caption, cta: v.cta };
}

// The version with its base fields switched to one language, so older post components render it as is.
export function inLanguage<T extends Version>(v: T, lang: Language): T {
  const c = copyFor(v, lang);
  return { ...v, hook: c.hook, slides: c.slides, caption: c.caption, cta: c.cta, language: v.copy?.[lang] ? lang : v.language };
}

export function hasLanguage(v: Pick<Version, "copy" | "language">, lang: Language) {
  return !!v.copy?.[lang] || (v.language ?? "taglish") === lang;
}

// Hook, caption, hashtags, then the test code on its own line (share handoff and Copy caption).
export function captionText(v: Version, lang: Language, withCode = true) {
  const c = copyFor(v, lang);
  const caption = c.caption.startsWith(c.hook) ? c.caption : `${c.hook}\n\n${c.caption}`;
  const parts = [caption, v.hashtags.join(" ")].filter(Boolean);
  if (withCode && /^[AH]\d$/.test(v.code)) parts.push(v.code.replace(/^H/, "A"));
  return parts.join("\n\n");
}

const CHANNEL_WORDS: [Channel, RegExp][] = [
  ["shopee", /shopee/i],
  ["facebook", /facebook|\bfb\b|messenger|marketplace/i],
  ["instagram", /instagram|\big\b/i],
  ["tiktok", /tiktok|tik tok/i],
  ["offline", /offline|store|stall|market|bazaar|tindahan|palengke|in person/i],
];

export function channelsOf(p: { channels?: Channel[]; whereSold?: string }): Channel[] {
  if (p.channels?.length) return p.channels;
  const found = CHANNEL_WORDS.filter(([, re]) => re.test(p.whereSold ?? "")).map(([c]) => c);
  return found.length ? found : ["facebook"];
}

export const CHANNEL_LABEL: Record<Channel, string> = {
  shopee: "Shopee",
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  offline: "Offline",
};

// One CTA per channel, in each language.
export const CTA = {
  message: { taglish: "Message us", english: "Message us", tagalog: "Mag-message sa amin" },
  shopee: { taglish: "Order on Shopee", english: "Order on Shopee", tagalog: "Mag-order sa Shopee" },
  comment: { taglish: "Comment 'order'", english: "Comment 'order'", tagalog: "Mag-comment ng 'order'" },
} as const satisfies Record<string, Record<Language, string>>;

export const CTA_SET: Record<Language, Set<string>> = {
  taglish: new Set(Object.values(CTA).map((c) => c.taglish)),
  english: new Set(Object.values(CTA).map((c) => c.english)),
  tagalog: new Set(Object.values(CTA).map((c) => c.tagalog)),
};

// Maps an English or Taglish CTA to its Tagalog form.
export function tagalogCta(cta: string) {
  const hit = Object.values(CTA).find((c) => c.english === cta || c.taglish === cta);
  return hit?.tagalog;
}
