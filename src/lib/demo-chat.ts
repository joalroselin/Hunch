import { focus, metricsByCode, peso, report, run } from "@/components/hunch/home/data";
import { captionText, normalizeLanguage } from "@/lib/hunch/language";
import type { Version, VersionMetrics } from "@/lib/hunch/types";
import { channelOfAudience, sampleWorkspacePosts, weekChannel } from "./demo-workspace";

export type ChatMessage = { role: string; text: string; draft?: string; platform?: string; channel?: string };

export const platformPrompt = "How did my posts do?";
export const roleActivity: Record<string, string> = {
  Hunch: "Writing a reply",
  Instagram: "Loading Instagram posts",
  TikTok: "Loading TikTok posts",
  Facebook: "Loading Facebook posts",
  Analyst: "Reading the results",
  Strategist: "Choosing what to post",
  Copywriter: "Writing the post",
  Skeptic: "Checking the numbers",
  Reviewer: "Reviewing the post"
};

const language = normalizeLanguage(run.product.language);
const ranked = [...report.metrics].sort((a, b) => a.rank - b.rank);
const PLACES = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth"];
const place = (m: VersionMetrics) => PLACES[m.rank - 1] ?? `number ${m.rank}`;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
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
    evidence: `${winner.audienceName} got ${messages(winner)}. ${runnerUp.audienceName} got ${num(got(runnerUp))}, from the same ${spend}.`,
    next: `Check it next week. Day ${testDay + 1} tests the runner-up again.`,
    hook: week[testDay].hook,
    caveat: "With numbers this small, a few messages can change the order. Next week's posts are the real check.",
    check: "It doesn't promise gift wrap. It's ready to plan.",
    draft: draftOf(week[testDay]),
    channel: weekChannel(testDay)
  },
  {
    id: "test-next",
    name: "What do I test next?",
    evidence: `${side.audienceName} came ${place(side)} with ${messages(side)}.${mostShared ? ` It also got the most shares, ${num(side.shares)}.` : ""}`,
    next: `Try one more ${spend} post for them. Make it about hosting a watch party.`,
    hook: sideTest.hook,
    caveat: sideNext ? `${sideNext.audienceName} got ${num(got(sideNext))}, ${sideGap > 0 ? `just ${sideGap === 1 ? "one" : num(sideGap)} less` : "the same"}. ${cap(place(side))} place could go either way.` : "One post is a small test. Give it a few days.",
    check: `It says where to put the candle and when to blow it out. Plan it as a ${spend} test.`,
    draft: draftOf(sideTest),
    channel: channelOfAudience(sideTest.audienceId)
  },
  {
    id: "drop",
    name: "Which post should I drop?",
    evidence: `${last.audienceName} got ${messages(last)} for ${peso(last.spend)}${fewest ? `, the fewest of all ${ranked.length}` : ""}.`,
    next: "Leave them out next week. Try a Christmas post for the night shift instead.",
    hook: christmasTest.hook,
    caveat: `One post over ${report.days} days is a short test. You can try them again later.`,
    check: `It says to blow it out before bed. Plan it as a ${spend} test.`,
    draft: draftOf(christmasTest),
    channel: channelOfAudience(christmasTest.audienceId)
  }
];

function importLine(channel: string) {
  const posts = sampleWorkspacePosts().filter(post => post.status === "Posted" && post.channel === channel);
  const reach = posts.reduce((sum, post) => sum + (post.reach ?? 0), 0);
  const results = posts.reduce((sum, post) => sum + (metricsByCode.get(post.code ?? "")?.results ?? 0), 0);
  return `Got ${count(posts.length, "test post")}. They reached ${num(reach)} people and got ${count(results, "message")}.`;
}

// Scripted replies only; swap in a model endpoint for live chat.
export function demoReply(question: string): ChatMessage[] {
  const scenario = scenarios.find(item => item.name === question);
  if (!scenario && (question === platformPrompt || /\b(sync|import|platforms?|channels?|analytics|performance|results)\b/i.test(question))) return [
    { role: "Hunch", text: `This is a replay of Elle's sample. Her ${run.versions.length} test posts come in first.` },
    ...["Instagram", "TikTok", "Facebook"].map(platform => ({ role: platform, text: importLine(platform), platform })),
    { role: "Analyst", text: `${winner.audienceName} reacted most. Their ${spend} post got ${messages(winner)} and ${num(winner.engagements)} engagements.` },
    { role: "Strategist", text: `Next week, give them ${winnerDays} posts. Save day ${testDay + 1} for ${runnerUp.audienceName}, which came ${place(runnerUp)} with ${messages(runnerUp)}.` },
    { role: "Copywriter", text: week[0].hook },
    { role: "Skeptic", text: `${messages(winner)} in ${report.days} days is still a small number. Treat it as a first sign.` },
    { role: "Reviewer", text: "It only uses Elle's facts. It's ready to plan.", draft: draftOf(week[0]), channel: weekChannel(0) }
  ];
  if (!scenario) return [{ role: "Hunch", text: "I can't answer typed questions yet. Tap a question below to see Elle's sample." }];
  return [
    { role: "Hunch", text: "Here's what Elle's sample shows." },
    { role: "Analyst", text: scenario.evidence },
    { role: "Strategist", text: scenario.next },
    { role: "Copywriter", text: scenario.hook },
    { role: "Skeptic", text: scenario.caveat },
    { role: "Reviewer", text: scenario.check, draft: scenario.draft, channel: scenario.channel }
  ];
}
