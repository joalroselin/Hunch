import type { Audience, DayPurpose, ProductInput } from "../../types";
import { callAgent, type AgentResult, type ModelClient } from "./model";
import { PLANNER_SYSTEM, plannerPrompt } from "./prompts";
import { PlannerSchema } from "./schemas";
import { noDashes } from "./text";

export interface PlanDay {
  day: number;
  purpose: DayPurpose;
  theme: string;
}

// 7 days: 6 for the winner, day 4 tests the runner-up, a distinct theme each day.
export async function runPlanner(
  model: ModelClient,
  opts: { product: Omit<ProductInput, "photo">; winner: Audience; runnerUp?: Audience },
): Promise<AgentResult<PlanDay[]>> {
  return callAgent(
    model,
    { agent: "planner", schema: PlannerSchema, system: PLANNER_SYSTEM, prompt: plannerPrompt(opts.product, opts.winner, opts.runnerUp), effort: "low" },
    (raw) => {
      const days = noDashes(raw).days.map((d) => ({ ...d, theme: d.theme.trim() })).sort((a, b) => a.day - b.day);
      if (days.length !== 7 || days.some((d, i) => d.day !== i + 1)) return { ok: false, error: "Give exactly 7 days, numbered 1 to 7." };
      if (new Set(days.map((d) => d.theme.toLowerCase())).size !== 7) return { ok: false, error: "Each day needs a different theme." };
      const fixed = days.map((d) => ({ ...d, purpose: (d.day === 4 && opts.runnerUp ? "runner_up_test" : "winner") as DayPurpose }));
      return { ok: true, value: fixed };
    },
  );
}
