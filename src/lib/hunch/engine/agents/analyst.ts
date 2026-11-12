import type { ProductInput, Verdict, VersionMetrics } from "../../types";
import { callAgent, type AgentResult, type ModelClient } from "./model";
import { ANALYST_SYSTEM, analystPrompt } from "./prompts";
import { AnalystSchema } from "./schemas";
import { noDashes } from "./text";

const LEVELS = ["high", "medium", "low"] as const;

// The explanation must name the computed winner and may not claim another winner or confidence.
export function contradicts(text: string, verdict: Omit<Verdict, "explanation">, names: Record<string, string>) {
  const t = text.toLowerCase();
  const winnerName = (names[verdict.winnerCode] ?? "").toLowerCase();
  if (!t.includes(verdict.winnerCode.toLowerCase()) && !(winnerName && t.includes(winnerName))) return "It must name the winner, " + verdict.winnerCode + ".";
  for (const code of Object.keys(names)) {
    if (code === verdict.winnerCode) continue;
    if (new RegExp(`\\b${code}\\b[^.]*\\b(won|wins|is the winner|came first)\\b`, "i").test(text)) return `It says ${code} won, but ${verdict.winnerCode} won.`;
  }
  for (const lvl of LEVELS) {
    if (lvl !== verdict.confidence && new RegExp(`\\b${lvl} confidence\\b`, "i").test(text)) return `Confidence is ${verdict.confidence}, not ${lvl}.`;
  }
  if (/\u2014|!/.test(text)) return "No em dashes or exclamation marks.";
  const sentences = text.split(/(?<=[.?])\s+/).filter((s) => s.trim());
  if (sentences.length < 2 || sentences.length > 3) return "Write 2 to 3 sentences.";
  return null;
}

export async function runAnalyst(
  model: ModelClient,
  opts: { product: Omit<ProductInput, "photo">; verdict: Omit<Verdict, "explanation">; metrics: VersionMetrics[]; names: Record<string, string> },
): Promise<AgentResult<{ explanation: string; caveats: string[] }>> {
  const rows = opts.metrics
    .filter((m) => m.matchedBy !== "none")
    .map((m) => ({ code: m.code, spend: m.spend, results: m.results, resultType: m.resultType, linkClicks: m.linkClicks, impressions: m.impressions }));
  return callAgent(
    model,
    {
      agent: "analyst",
      schema: AnalystSchema,
      system: ANALYST_SYSTEM,
      prompt: analystPrompt({ product: opts.product, verdict: opts.verdict, rows, names: opts.names }),
      effort: "low",
    },
    (raw) => {
      const data = noDashes(raw);
      const explanation = data.explanation.trim();
      const bad = contradicts(explanation, opts.verdict, opts.names);
      if (bad) return { ok: false, error: bad };
      const caveats = data.caveats.map((c) => c.trim()).filter((c) => c && !/!|\u2014/.test(c)).slice(0, 3);
      return { ok: true, value: { explanation, caveats } };
    },
  );
}
