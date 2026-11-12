import type { FocusPlan, ResultsReport, TestRun } from "../../types";
import { makeSwapper } from "./personalize";
import { sampleSet, sampleSetOf } from "./sets";

export function nextSevenDays(from = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", weekday: "short", month: "short", day: "numeric" });
  return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(from.getTime() + (i + 1) * 86400000)));
}

// The sample seller's saved plan, dated from tomorrow. Client-safe.
export function sampleFocus(run: TestRun, report?: ResultsReport): FocusPlan {
  const days = nextSevenDays();
  const set = sampleSetOf(run) ?? sampleSet("candles");
  const plan = makeSwapper(run.product, set).apply(set.focus());
  const winner = run.versions.find((v) => v.id === report?.winnerId);
  const notes = [...(plan.notes ?? [])];
  if (winner && winner.audienceId !== plan.audience.id) {
    notes.push(`Sample plan for ${set.persona}'s winner, ${plan.audience.name.toLowerCase()}. Your numbers picked ${winner.code}; a live run writes the plan for ${winner.code}.`);
  } else if (report?.runnerUpId) {
    const runnerUp = run.versions.find((v) => v.id === report.runnerUpId);
    const day4 = plan.posts.find((p) => p.purpose === "runner_up_test");
    const planned = day4 && run.versions.find((v) => v.audienceId === day4.audienceId);
    if (runnerUp && planned && runnerUp.audienceId !== planned.audienceId) {
      notes.push(`Day 4 is ${set.persona}'s sample test of ${planned.code}. Your numbers put ${runnerUp.code} second; a live run tests ${runnerUp.code} on day 4.`);
    }
  }
  return { ...plan, mode: "sample", notes, posts: plan.posts.map((p, i) => ({ ...p, day: days[i] ?? p.day })) };
}
