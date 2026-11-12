import type { Audience, ProductInput, SkepticDecision } from "../../types";
import { callAgent, type AgentResult, type ModelClient } from "./model";
import { SKEPTIC_SYSTEM, skepticPrompt } from "./prompts";
import { SkepticSchema } from "./schemas";
import { noDashes } from "./text";

export interface SkepticResult {
  decision: SkepticDecision;
  chosen: Audience[]; // kept, in code order, with code and keptReason
}

// Exactly 8 kept with reasons and 12 cut with a category; codes A1..A8 in kept order.
export async function runSkeptic(model: ModelClient, product: Omit<ProductInput, "photo">, candidates: Audience[]): Promise<AgentResult<SkepticResult>> {
  const byId = new Map(candidates.map((c) => [c.id, c]));
  return callAgent(
    model,
    { agent: "skeptic", schema: SkepticSchema, system: SKEPTIC_SYSTEM, prompt: skepticPrompt(product, candidates), effort: "medium" },
    (raw) => {
      const data = noDashes(raw);
      if (data.kept.length !== 8) return { ok: false, error: `Keep exactly 8, got ${data.kept.length}.` };
      if (data.cuts.length !== candidates.length - 8) return { ok: false, error: `Cut exactly ${candidates.length - 8}, got ${data.cuts.length}.` };
      const ids = [...data.kept.map((k) => k.id), ...data.cuts.map((c) => c.id)];
      const unknown = ids.filter((id) => !byId.has(id));
      if (unknown.length) return { ok: false, error: `Unknown ids: ${unknown.join(", ")}.` };
      if (new Set(ids).size !== candidates.length) return { ok: false, error: "Every candidate id must appear exactly once across kept and cuts." };
      const moments = new Set(data.kept.map((k) => byId.get(k.id)!.situation.trim().toLowerCase()));
      if (moments.size < 8) return { ok: false, error: "Two kept audiences share the same buying moment. Keep a different one." };
      if (data.kept.some((k) => !k.reason.trim()) || data.cuts.some((c) => !c.reason.trim())) return { ok: false, error: "Every kept and cut audience needs a one-sentence reason." };
      const keptReasons: Record<string, string> = {};
      for (const k of data.kept) keptReasons[k.id] = k.reason.trim();
      const chosen = data.kept.map((k, i) => ({ ...byId.get(k.id)!, code: `A${i + 1}`, keptReason: k.reason.trim() }));
      return { ok: true, value: { decision: { keptReasons, cuts: data.cuts.map((c) => ({ ...c, reason: c.reason.trim() })) }, chosen } };
    },
  );
}
