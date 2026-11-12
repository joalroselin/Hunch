import { focus, metricsByCode, run } from "@/components/hunch/home/data";
import { captionText, copyFor } from "@/lib/hunch/language";
import type { Language, Version } from "@/lib/hunch/types";
import { mergeDemoPlatform, sampleWorkspacePosts, weekChannel, type Post } from "./demo-workspace";

export type ChatDraft = { text: string; channel: string; code: string; language: Language; postId?: string };
export type ChatMessage = {
  role: "Hunch" | "You";
  text: string;
  draft?: ChatDraft;
  platform?: string;
  planDate?: string;
  evidence?: { postId: string; label: string };
};
export const platformPrompt = "What worked?";
export const importPrompt = "Replay Elle's results";
export const scenarios = [
  { id: "next", name: "What should I post?" },
  { id: "enough", name: "Is that enough data?" },
];
const versions: Version[] = [...focus.posts, ...focus.tests, ...run.versions];
const reply = (text: string): ChatMessage[] => [{ role: "Hunch", text }];
const num = (n: number) => n.toLocaleString("en-US");

export function manilaToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(now);
}

// shortcut: day-level dates only; add time parsing when timed scheduling exists.
export function requestedDay(question: string, now = new Date()): string | null {
  const today = manilaToday(now);
  const date = new Date(`${today}T12:00:00Z`);
  const explicit = question.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0];
  if (explicit) {
    const parsed = new Date(`${explicit}T12:00:00Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === explicit && explicit >= today ? explicit : null;
  }
  if (/\btoday\b/i.test(question)) return today;
  if (/\btomorrow\b/i.test(question)) date.setUTCDate(date.getUTCDate() + 1);
  else {
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const day = days.findIndex(day => new RegExp(`\\b${day}\\b`, "i").test(question));
    if (day < 0) return null;
    date.setUTCDate(date.getUTCDate() + ((day - date.getUTCDay() + 7) % 7 || 7));
  }
  return date.toISOString().slice(0, 10);
}

function draftFor(version: Version, posts: Post[], language: Language = "english"): ChatDraft {
  const existing = posts.find(post => post.status !== "Posted" && post.code === version.code);
  const index = focus.posts.findIndex(post => post.code === version.code);
  return { text: captionText(version, language), channel: existing?.channel ?? weekChannel(Math.max(0, index)), code: version.code, language, postId: existing?.id };
}

function performance(posts: Post[]): ChatMessage[] {
  const measured = posts.filter(post => post.status === "Posted" && Number.isFinite(post.reach) && (post.reach ?? 0) > 0 && Number.isFinite(post.engagements));
  if (!measured.length) return reply("There aren’t recorded results to compare yet. Add reach and engagements to a posted item, or replay Elle’s sample results.");
  const sampleMetric = (post: Post) => {
    const metric = post.sample ? metricsByCode.get(post.code ?? "") : undefined;
    return metric && metric.reach === post.reach && metric.engagements === post.engagements ? metric : undefined;
  };
  const byMessages = measured.every(post => sampleMetric(post)?.results !== undefined);
  const score = (post: Post) => byMessages ? sampleMetric(post)?.results ?? 0 : (post.engagements ?? 0) / post.reach!;
  const ranked = [...measured].sort((a, b) => score(b) - score(a));
  const best = ranked[0];
  const tied = ranked.length > 1 && score(best) === score(ranked[1]);
  const value = byMessages ? `${num(score(best))} messages` : `${(score(best) * 100).toFixed(1)}% engagement`;
  const label = best.audience ?? best.text.split("\n")[0];
  const count = measured.length;
  const text = `${label} ${count === 1 ? "has" : tied ? "is tied for the lead with" : "leads with"} ${value} on ${best.channel}${best.sample ? " in Elle’s sample" : ""}.\n\n${num(best.reach!)} reached, ${num(best.engagements!)} engagements. ${count === 1 ? "One post isn’t enough to call a winner." : `That’s ${count} recorded posts. This is a direction to test again, not proof of what caused the result.`}`;
  return [{ role: "Hunch", text, evidence: { postId: best.id, label: `See ${label}` } }];
}

// shortcut: bounded demo intents and prepared copy; use a model for open-ended requests.
export function demoReply(question: string, posts: Post[] = sampleWorkspacePosts(), draft?: ChatDraft, now = new Date()): ChatMessage[] {
  const q = question.trim().toLowerCase().replace(/[’]/g, "'");
  if (q === importPrompt.toLowerCase() || /\b(sync|import|reload|replay)\b/.test(q)) {
    const platforms = ["Instagram", "TikTok", "Facebook"];
    const projected = platforms.reduce((current, platform) => mergeDemoPlatform(current, platform), mergeDemoPlatform(posts, null));
    return [...platforms.map(platform => ({ role: "Hunch" as const, text: `Loading ${platform} sample results…`, platform })), ...performance(projected)];
  }
  if (/\b(plan|schedule|add|move)\b/.test(q) && !/\b(what|which)\b/.test(q)) {
    if (!draft) return reply("Let’s write a caption first. Ask “What should I post?” and we can put it on a day.");
    const date = requestedDay(q, now);
    if (!date) return reply("Which day? Try “Plan this for Friday” or give a future date as YYYY-MM-DD. This adds it to your week; publishing stays with you.");
    const label = new Date(`${date}T12:00:00+08:00`).toLocaleDateString("en-US", { timeZone: "Asia/Manila", weekday: "long", month: "short", day: "numeric" });
    return [{ role: "Hunch", text: `Planned for ${label} on ${draft.channel}. It’s in your week, ready for you to publish.`, draft, planDate: date }];
  }
  const language: Language | undefined = /\btaglish\b/.test(q) ? "taglish" : /\btagalog\b/.test(q) ? "tagalog" : /\benglish\b/.test(q) ? "english" : undefined;
  if (language || /\b(shorter|shorten|concise)\b/.test(q)) {
    if (!draft) return reply("Ask for a post idea first, then I can change its language or make the caption shorter.");
    const version = versions.find(version => version.code === draft.code);
    if (!version) return reply("Open this caption in the editor to revise it.");
    const nextLanguage = language ?? draft.language;
    const full = captionText(version, nextLanguage);
    const copy = copyFor(version, nextLanguage);
    const shortened = copy.caption;
    return [{ role: "Hunch", text: language ? `Here’s the ${language === "taglish" ? "Taglish" : language === "tagalog" ? "Tagalog" : "English"} version. Same post and product details.` : "Shortened it, keeping the product details.", draft: { ...draft, language: nextLanguage, text: language ? full : shortened } }];
  }
  if (/\b(enough|sure|confidence|prove|reliable)\b/.test(q)) return reply(`This workspace has ${posts.filter(post => post.status === "Posted" && post.reach !== undefined).length} posts with reach recorded. A few posts can suggest a direction, but they don’t prove an audience or format caused the result. Repeat the test before changing the whole plan.`);
  if (/\b(next|caption|draft|write|idea|test)\b/.test(q) || /what.*post/.test(q)) {
    const best = performance(posts)[0];
    if (!best.evidence) return [best];
    const source = posts.find(post => post.id === best.evidence?.postId)!;
    const version = focus.posts.find(post => post.audienceId === run.versions.find(version => version.code === source.code)?.audienceId);
    if (!version) return [{ ...best, text: `${best.text}\n\nFor a new caption, open Create a post. Prepared caption examples currently cover Elle’s candle posts.` }];
    const suggestion = draftFor(version, posts);
    return [{ role: "Hunch", text: `Try another post for ${version.audienceName.toLowerCase()}.\n\n${best.text}\n\nHere’s a caption you can revise before planning it.`, evidence: best.evidence, draft: suggestion }];
  }
  if (/\b(worked|best|better|winning|winner|posts? do|numbers|results?|performance|analytics|channels?|platforms?)\b/.test(q) || /how.*posts?/.test(q)) return performance(posts);
  return reply("I can compare the results here, suggest a candle post, change its language, or put a draft on a day. Try “What worked?” or “What should I post?”");
}
