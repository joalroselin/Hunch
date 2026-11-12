import type { Audience, FocusPlan, FocusPost, Mode, ResultsReport, TestRun, Version } from "../types";
import { EventLog } from "./agents/events";
import type { ModelClient } from "./agents/model";
import { pool } from "./agents/model";
import { runPlanner } from "./agents/planner";
import { producePost, withChecks } from "./agents/post";
import { newId } from "./mode";
import { isSampleRun } from "./sample/elle";
import { nextSevenDays, sampleFocus } from "./sample/focus";
import { liveModel } from "./test-run";

export { nextSevenDays, sampleFocus };

export class FocusError extends Error {}

function audienceOf(run: TestRun, versionId?: string): Audience | undefined {
  const v = run.versions.find((x) => x.id === versionId);
  if (!v) return undefined;
  return run.chosen.find((a) => a.id === v.audienceId) ?? { id: v.audienceId, name: v.audienceName, who: "", situation: "", whyItFits: "", whereTheyAre: [], tone: "", code: v.code };
}

// Small side tests from posts already written: the runner-up's post, and the third place's.
function sideTests(run: TestRun, report: ResultsReport): FocusPlan["tests"] {
  const pick = (rank: number) => run.versions.find((v) => v.id === report.metrics.find((m) => m.rank === rank)?.versionId);
  const out: FocusPlan["tests"] = [];
  const second = pick(2);
  const third = pick(3);
  if (second) out.push({ ...second, id: `${second.id}_t1`, code: "T1", why: `${second.audienceName} came second. One more small boost shows if that was luck or a real second audience.` });
  if (third) out.push({ ...third, id: `${third.id}_t2`, code: "T2", why: `${third.audienceName} came third. One small boost now shows if it can grow with a new photo.` });
  return out;
}

// Planner picks 7 themes; each day goes through the Copywriter and Reviewer with the same rules.
export async function buildFocus(opts: { run: TestRun; report: ResultsReport; mode: Mode; model?: ModelClient }): Promise<FocusPlan> {
  const { run, report } = opts;
  if (opts.mode === "sample" || (isSampleRun(run) && report.isSample)) return sampleFocus(run, report);

  const model = opts.model ?? liveModel();
  const winner = audienceOf(run, report.winnerId);
  if (!winner) throw new FocusError("The winning post is missing from this test. Run the test again.");
  const runnerUp = audienceOf(run, report.runnerUpId);
  const plan = await runPlanner(model, { product: run.product, winner, runnerUp });
  if (!plan.ok) throw new FocusError(`The Planner could not finish. ${plan.reason} Try again.`);

  const dates = nextSevenDays();
  const log = new EventLog(() => {});
  const outcomes = await pool(plan.value, 4, async (d) => {
    const audience = d.purpose === "runner_up_test" && runnerUp ? runnerUp : winner;
    const code = `P${d.day}`;
    const out = await producePost({ model, log, product: run.product, audience, code, id: `v_${code.toLowerCase()}_${newId().slice(0, 8)}`, theme: d.theme });
    return { ...out.version, day: dates[d.day - 1], dayNumber: d.day, theme: d.theme, purpose: d.purpose } as FocusPost;
  });
  const checked = withChecks(outcomes as Version[]) as FocusPost[];
  const flagged = checked.filter((p) => p.status === "needs_attention").length;
  const notes = [
    runnerUp ? `Day 4 tests the runner-up, ${runnerUp.name}.` : "There was no runner-up, so every day is for the winner.",
    ...(flagged ? [`${flagged} ${flagged === 1 ? "post needs" : "posts need"} a look before you post.`] : []),
  ];
  return { mode: "live", audience: winner, posts: checked, tests: sideTests(run, report), notes };
}
