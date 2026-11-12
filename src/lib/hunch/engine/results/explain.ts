import type { Audience, BreakdownCell, Confidence, IcpCard, RegionCell, Verdict, Version, VersionMetrics } from "../../types";
import { NO_BREAKDOWN } from "./constants";
import { peso } from "./pick-winner";

export function lowerFirst(s: string) {
  if (s.length > 1 && /[A-Z]/.test(s[1]) && s[1] === s[1].toUpperCase()) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}

// How to say a result type in a sentence.
function resultWords(resultType: string | null | undefined) {
  if (resultType && /messag/i.test(resultType)) return { verb: "started", one: "message conversation", many: "message conversations", per: "conversation" };
  if (resultType && /link click/i.test(resultType)) return { verb: "got", one: "link click", many: "link clicks", per: "click" };
  if (resultType && /purchase/i.test(resultType)) return { verb: "got", one: "purchase", many: "purchases", per: "purchase" };
  if (resultType && /lead/i.test(resultType)) return { verb: "got", one: "lead", many: "leads", per: "lead" };
  return { verb: "got", one: "result", many: "results", per: "result" };
}

const count = (n: number, one: string, many: string) => `${n.toLocaleString("en-PH")} ${n === 1 ? one : many}`;

type Row = Pick<VersionMetrics, "code" | "spend" | "results" | "linkClicks" | "impressions" | "resultType">;

// Plain 2-3 sentence explanation of a computed verdict. Used in sample mode and as the Analyst fallback.
export function templateExplanation(v: Omit<Verdict, "explanation">, rows: Row[], names: Record<string, string>): string {
  const w = rows.find((r) => r.code === v.winnerCode);
  const ru = rows.find((r) => r.code === v.runnerUpCode);
  if (!w) return "There was not enough data to pick a winner. Add spend and results for each post.";
  const wName = names[w.code] ?? w.code;
  const ruName = ru ? (names[ru.code] ?? ru.code) : "";
  const out: string[] = [];
  if (v.metric === "cost_per_result") {
    const words = resultWords(w.resultType);
    out.push(`${wName} won: ${w.code} ${words.verb} ${count(w.results ?? 0, words.one, words.many)} for ${peso(w.spend)}.`);
    if (ru) out.push(`${ruName} came second with ${(ru.results ?? 0).toLocaleString("en-PH")}.`);
  } else if (v.metric === "cost_per_link_click") {
    out.push(`${wName} won: ${w.code} got ${count(w.linkClicks ?? 0, "link click", "link clicks")} for ${peso(w.spend)}.`);
    if (ru) out.push(`${ruName} came second with ${(ru.linkClicks ?? 0).toLocaleString("en-PH")}.`);
  } else {
    const ctr = (r: Row) => (r.impressions ? ((r.linkClicks ?? 0) / r.impressions) * 100 : 0);
    out.push(`${wName} won: ${ctr(w).toFixed(1)}% of the people who saw ${w.code} clicked, the highest of the ${rows.length}.`);
    if (ru) out.push(`${ruName} came second at ${ctr(ru).toFixed(1)}%.`);
  }
  out.push(
    ru
      ? `Next week, aim six posts at ${lowerFirst(wName)} and keep day 4 to test ${lowerFirst(ruName)} again.`
      : `Next week, aim your posts at ${lowerFirst(wName)}.`,
  );
  return out.join(" ");
}

export function icpConfidence(c: Confidence): IcpCard["confidence"] {
  return c === "high" ? "strong" : c === "medium" ? "medium" : "early";
}

// "Women and men about equally, largest group 25-34, about half in Metro Manila", or "No breakdown in this export".
export function reachedMostly(breakdown: BreakdownCell[], regions?: RegionCell[]) {
  const cells = breakdown.filter((c) => c.impressions > 0);
  if (!cells.length) return NO_BREAKDOWN;
  const byAge = new Map<string, number>();
  let female = 0;
  let male = 0;
  for (const c of cells) {
    byAge.set(c.age, (byAge.get(c.age) ?? 0) + c.impressions);
    if (c.gender === "female") female += c.impressions;
    if (c.gender === "male") male += c.impressions;
  }
  const topAge = [...byAge.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const known = female + male || 1;
  const who = female / known >= 0.55 ? "Mostly women" : male / known >= 0.55 ? "Mostly men" : "Women and men about equally";
  let text = `${who}, largest group ${topAge}`;
  const total = (regions ?? []).reduce((s, r) => s + r.impressions, 0);
  const top = regions?.[0];
  if (top && total > 0) {
    const share = top.impressions / total;
    text += share >= 0.6 ? `, mostly in ${top.region}` : share >= 0.4 ? `, about half in ${top.region}` : `, most often in ${top.region}`;
  }
  return text;
}

// The Your people card, built from the winner plus the breakdown when present.
export function buildIcp(opts: {
  verdict: Verdict;
  winner: VersionMetrics;
  runnerUp?: VersionMetrics;
  audience?: Audience;
  version?: Version;
  productName: string;
  days: number;
}): IcpCard {
  const { verdict, winner, runnerUp, audience, version } = opts;
  const name = audience?.name ?? winner.audienceName;
  const words = resultWords(winner.resultType);
  const whatWorked: string[] = [];
  if (verdict.metric === "cost_per_result" && winner.results) {
    whatWorked.push(
      `${winner.code} ${words.verb} ${count(winner.results, words.one, words.many)} for ${peso(winner.spend)}.${
        runnerUp?.results ? ` ${runnerUp.code} came next with ${runnerUp.results}.` : ""
      }`,
    );
  } else if (winner.linkClicks) {
    whatWorked.push(`${winner.code} got ${count(winner.linkClicks, "link click", "link clicks")} for ${peso(winner.spend)}.`);
  }
  if (winner.impressions) whatWorked.push(`It was shown ${winner.impressions.toLocaleString("en-PH")} times for ${peso(winner.spend)}.`);
  if (version?.hook) whatWorked.push(`The hook named the moment, not the person: "${version.hook}"`);

  const moment = (audience?.situation ?? "").replace(/\.$/, "");
  const whatToPostNext = [
    moment ? `More posts about the same moment: ${lowerFirst(moment)}.` : `More posts like ${winner.code}, with a new photo each time.`,
    `Show ${opts.productName} in use at that moment, with the price.`,
    runnerUp ? `Keep day 4 for ${runnerUp.audienceName}, to see if second place holds.` : `Ask a question in one post, so people comment.`,
  ];

  const hasBreakdown = winner.breakdown.some((c) => c.impressions > 0);
  const avg = winner.spend;
  const caveat =
    verdict.confidence === "high"
      ? `Each audience got about ${peso(avg)} over ${opts.days} ${opts.days === 1 ? "day" : "days"}, so these are small numbers. The lead is clear, and next week's posts are the real check on whether it holds.`
      : verdict.confidence === "medium"
        ? `The lead is real but small, on about ${peso(avg)} per audience. Next week's posts will tell you if it holds.`
        : `This is an early signal. The numbers are too close or too small to be sure, so keep testing ${winner.code}${runnerUp ? ` and ${runnerUp.code}` : ""} next week.`;

  return {
    headline: `Your people: ${lowerFirst(name)}.`,
    audienceName: name,
    who: audience ? `${audience.who} ${audience.situation}`.trim() : name,
    reachedMostly: reachedMostly(winner.breakdown, winner.regions),
    whatWorked: whatWorked.slice(0, 3),
    whatToPostNext,
    confidence: icpConfidence(verdict.confidence),
    caveat,
    hasBreakdown,
  };
}
