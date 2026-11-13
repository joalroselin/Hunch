import type { z } from "zod";

import type { AgentName } from "../../types";
import { askModel, type AskResult, type Effort, type ImageInput } from "../claude";
import { sleep } from "../mode";

export interface AskOpts<S extends z.ZodType> {
  agent: AgentName;
  schema: S;
  system: string;
  prompt: string;
  effort: Effort;
  image?: ImageInput;
}

// Every agent talks to the model through this, so tests and HUNCH_MODE=mock can swap in a fake.
export interface ModelClient {
  ask<S extends z.ZodType>(opts: AskOpts<S>): Promise<AskResult<z.infer<S>>>;
  retryDelayMs?: number;
}

export const claudeModel: ModelClient = {
  ask: (o) => askModel({ schema: o.schema, system: o.system, prompt: o.prompt, effort: o.effort, image: o.image }),
  retryDelayMs: 1000,
};

export type Checked<T> = { ok: true; value: T } | { ok: false; error: string };
export type AgentResult<T> = { ok: true; value: T } | { ok: false; reason: string };

// One call, validated with Zod and the agent's own rules; on failure, one retry with the error appended.
export async function callAgent<S extends z.ZodType, T>(
  model: ModelClient,
  opts: AskOpts<S>,
  check: (data: z.infer<S>) => Checked<T>,
): Promise<AgentResult<T>> {
  let prompt = opts.prompt;
  let reason = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await model.ask({ ...opts, prompt });
    if (res.ok) {
      const parsed = opts.schema.safeParse(res.data);
      const c: Checked<T> = parsed.success ? check(parsed.data) : { ok: false, error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
      if (c.ok) return c;
      reason = c.error;
      prompt = `${opts.prompt}\n\nYour last answer did not pass validation: ${c.error}\nFix that and answer again in the same format.`;
    } else {
      reason = res.reason;
      if (res.retryable === false) break;
      if (attempt === 0 && model.retryDelayMs) await sleep(model.retryDelayMs);
    }
  }
  return { ok: false, reason };
}

// Runs tasks with at most `limit` in flight; keeps input order in the output.
export async function pool<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}
