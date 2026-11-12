import { focus, metricsByCode, peso, report, run } from "@/components/hunch/home/data";
import { captionText, normalizeLanguage } from "@/lib/hunch/language";
import type { Version, VersionMetrics } from "@/lib/hunch/types";
import { channelOfAudience, sampleWorkspacePosts, weekChannel } from "./demo-workspace";

export type ChatMessage = { role: string; text: string; draft?: string; platform?: string; channel?: string };

export const platformPrompt = "How did my posts do?";
export const roleActivity: Record<string, string> = {
  Hunch: "Typing",
  Instagram: "Pulling Instagram",
  TikTok: "Pulling TikTok",
  Facebook: "Pulling Facebook",
  Analyst: "Looking at the numbers",
  Strategist: "Planning next week",
  Copywriter: "Writing",
  Skeptic: "Double-checking",
  Reviewer: "Checking the post"
};

const language = normalizeLanguage(run.product.language);
const ranked = [...report.metrics].sort((a, b) => a.rank - b.rank);
const PLACES = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth"];
const place = (m: VersionMetrics) => PLACES[m.rank - 1] ?? `number ${m.rank}`;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const num = (n: number) => n.toLocaleString("en-US");
const count = (n: number, word: string) => `${num(n)} ${word}${n === 1 ? "" : "s"}`;
const got = (m: VersionMetrics) => m.results ?? 0;
const messages = (m: VersionMetrics) => count(got(m), "message");
const metricsOf = (audienceId: string) => metricsByCode.get(run.versions.find(v => v.audienceId === audienceId)?.code ?? "");
const draftOf = (post: Version) => captionText(post, language);

const winner = ranked[0];
const last = ranked[ranked.length - 1];
const spend = peso(winner.spend);
const week = focus.posts;
const testDay = Math.max(0, week.findIndex(post => post.purpose === "runner_up_test"));
const winnerDays = week.filter(post => post.purpose !== "runner_up_test").length;
const runnerUp = metricsOf(week[testDay].audienceId) ?? ranked[1];
const [sideTest, christmasTest] = focus.tests;
const side = metricsOf(sideTest.audienceId) ?? ranked[2];
const sideNext = ranked[side.rank];
const sideGap = sideNext ? got(side) - got(sideNext) : 0;
const mostShared = side.shares >= Math.max(...ranked.map(m => m.shares));
const fewest = ranked.every(m => m === last || got(m) > got(last));

export const scenarios = [
  {
    id: "enough",
    name: `Is ${messages(winner)} enough?`,
    evidence: `${winner.audienceName} got ${num(got(winner))}. ${runnerUp.audienceName} got ${num(got(runnerUp))}. Same ${spend} each.`,
    next: `Not yet. Post ${testDay + 1} next week gives ${lower(runnerUp.audienceName)} another shot.`,
    hook: week[testDay].hook,
    caveat: "Numbers this small can flip. Next week settles it.",
    check: "No gift wrap promised in it. Good to go.",
    draft: draftOf(week[testDay]),
    channel: weekChannel(testDay)
  },
  {
    id: "test-next",
    name: "What do I test next?",
    evidence: `${side.audienceName} came ${place(side)} with ${num(got(side))}${mostShared ? `, and got shared the most (${num(side.shares)})` : ""}.`,
    next: `One more ${spend} post for them. A watch party at the unit.`,
    hook: sideTest.hook,
    caveat: sideNext ? `${sideNext.audienceName} got ${num(got(sideNext))}${sideGap > 0 ? `, just ${sideGap === 1 ? "one" : num(sideGap)} less` : " too"}. ${cap(place(side))} is a toss-up.` : "It's one post. Give it a few days.",
    check: "It says where to put the candle and when to blow it out. Good to go.",
    draft: draftOf(sideTest),
    channel: channelOfAudience(sideTest.audienceId)
  },
  {
    id: "drop",
    name: "Which post should I drop?",
    evidence: `${last.audienceName} got ${messages(last)} for ${peso(last.spend)}${fewest ? ". The fewest" : ""}.`,
    next: "Skip them next week. Try a Christmas post for the night shift instead.",
    hook: christmasTest.hook,
    caveat: `It was one post for ${report.days} days. Worth another try later.`,
    check: "It says to blow it out before bed. Good to go.",
    draft: draftOf(christmasTest),
    channel: channelOfAudience(christmasTest.audienceId)
  }
];

function importLine(channel: string) {
  const posts = sampleWorkspacePosts().filter(post => post.status === "Posted" && post.channel === channel);
  const reach = posts.reduce((sum, post) => sum + (post.reach ?? 0), 0);
  const results = posts.reduce((sum, post) => sum + (metricsByCode.get(post.code ?? "")?.results ?? 0), 0);
  return `${count(posts.length, "post")}, ${num(reach)} people reached, ${count(results, "message")}.`;
}

// Scripted replies only; swap in a model endpoint for live chat.
export function demoReply(question: string): ChatMessage[] {
  const scenario = scenarios.find(item => item.name === question);
  if (!scenario && (question === platformPrompt || /\b(sync|import|platforms?|channels?|analytics|performance|results)\b/i.test(question))) return [
    { role: "Hunch", text: `Pulling in Elle's ${run.versions.length} posts from the last ${report.days} days.` },
    ...["Instagram", "TikTok", "Facebook"].map(platform => ({ role: platform, text: importLine(platform), platform })),
    { role: "Analyst", text: `The post for ${lower(winner.audienceName)} won. ${messages(winner)} from one ${spend} post.` },
    { role: "Strategist", text: `So next week is mostly them, ${winnerDays} posts. Post ${testDay + 1} gives ${lower(runnerUp.audienceName)} another shot. They got ${num(got(runnerUp))}.` },
    { role: "Copywriter", text: week[0].hook },
    { role: "Skeptic", text: `It's ${report.days} days and small numbers. Let's see if it holds next week.` },
    { role: "Reviewer", text: "Checked it. Only Elle's real facts. Sige, plan it.", draft: draftOf(week[0]), channel: weekChannel(0) }
  ];
  if (!scenario) return [{ role: "Hunch", text: "For now I can only answer the questions below." }];
  return [
    { role: "Hunch", text: "Let me check Elle's numbers." },
    { role: "Analyst", text: scenario.evidence },
    { role: "Strategist", text: scenario.next },
    { role: "Copywriter", text: scenario.hook },
    { role: "Skeptic", text: scenario.caveat },
    { role: "Reviewer", text: scenario.check, draft: scenario.draft, channel: scenario.channel }
  ];
}
