import type { Audience, ProductInput, RejectedDraft, TestRun, Version } from "../../types";
import { parseDataUrl } from "../claude";
import { newId, sleep } from "../mode";
import { CUT_PHRASE, EventLog, type Emit } from "./events";
import { pool, type ModelClient } from "./model";
import { producePost, withChecks } from "./post";
import { runSkeptic } from "./skeptic";
import { runStrategist } from "./strategist";

export class PipelineError extends Error {}

export interface PipelineDeps {
  model: ModelClient;
  pace?: (ms: number) => Promise<void>; // spacing between Studio events; no-op in tests
  now?: () => number;
}

const codeNum = (c: string) => Number(c.replace(/\D/g, "")) || 0;

// Strategist -> Skeptic -> Copywriter x8 (4 at a time) -> Reviewer per post, with StudioEvents for each step.
export async function runPipeline(input: ProductInput, emit: Emit, deps: PipelineDeps): Promise<TestRun> {
  const { model } = deps;
  const pace = deps.pace ?? sleep;
  const log = new EventLog(emit, deps.now);
  const product = { ...input };
  delete product.photo;

  await log.send({ type: "status", step: "audiences", message: `Strategist is thinking of 20 kinds of people who might buy ${product.name}` });
  await log.log("system", "run_started", `Hunch started a test for ${product.name}.`);

  const s = await runStrategist(model, product, parseDataUrl(input.photo));
  if (!s.ok) {
    await log.log("strategist", "step_failed", "Strategist could not finish the 20 audiences.", undefined, s.reason);
    throw new PipelineError(`The Strategist could not finish. ${s.reason} Try again.`);
  }
  const candidates = s.value;
  for (const c of candidates) {
    await log.send({ type: "candidate", candidate: c });
    await log.log("strategist", "candidate_proposed", `Strategist proposed '${c.name}'.`, c.id, c.situation);
    await pace(120);
  }

  await log.send({ type: "status", step: "choosing", message: "Skeptic is cutting 20 down to 8" });
  const k = await runSkeptic(model, product, candidates);
  if (!k.ok) {
    await log.log("skeptic", "step_failed", "Skeptic could not cut the list to 8.", undefined, k.reason);
    throw new PipelineError(`The Skeptic could not finish. ${k.reason} Try again.`);
  }
  const { decision, chosen } = k.value;
  const keptById = new Map(chosen.map((a) => [a.id, a]));
  const cutById = new Map(decision.cuts.map((c) => [c.id, c]));
  const named = new Map(candidates.map((c) => [c.id, c.name]));
  for (const c of candidates) {
    const kept = keptById.get(c.id);
    if (kept) await log.log("skeptic", "audience_kept", `Skeptic kept '${c.name}' as ${kept.code}.`, c.id, kept.keptReason);
    else {
      const cut = cutById.get(c.id)!;
      const phrase = cut.category === "duplicate" ? dupPhrase(cut.reason, named) : CUT_PHRASE[cut.category];
      await log.log("skeptic", "candidate_rejected", `Skeptic dropped '${c.name}': ${phrase}.`, c.id, cut.reason);
    }
    await pace(150);
  }
  const allCandidates: Audience[] = candidates.map((c) => keptById.get(c.id) ?? c);
  await log.send({ type: "audiences", candidates: allCandidates, chosen, skeptic: decision });

  await log.send({ type: "status", step: "writing", message: "Copywriter is writing 8 posts, Reviewer checks each one" });
  const rejected: RejectedDraft[] = [];
  const outcomes = await pool(chosen, 4, async (a) => {
    const out = await producePost({ model, log, product, audience: a, code: a.code!, id: `v_${a.code!.toLowerCase()}_${newId().slice(0, 8)}` });
    for (const r of out.rejected) {
      rejected.push(r);
      await log.send({ type: "rejected", rejected: r });
    }
    await log.send({ type: "version", version: out.version });
    return out;
  });

  const versions: Version[] = withChecks(outcomes.map((o) => o.version).sort((x, y) => codeNum(x.code) - codeNum(y.code)));
  const flagged = versions.filter((v) => v.status === "needs_attention").length;
  await log.log(
    "system",
    "run_ready",
    flagged ? `All 8 posts are done. ${flagged} ${flagged === 1 ? "needs" : "need"} a look. See your 8 hunches.` : "All 8 posts are ready. See your 8 hunches.",
  );
  await log.send({ type: "status", step: "done", message: `${versions.length} posts ready. ${rejected.length} ${rejected.length === 1 ? "draft was" : "drafts were"} sent back and fixed.` });

  return {
    id: newId("run"),
    createdAt: new Date().toISOString(),
    mode: "live",
    product,
    candidates: allCandidates,
    chosen,
    versions,
    rejected: rejected.sort((x, y) => x.id.localeCompare(y.id, "en", { numeric: true })),
    keptReasons: decision.keptReasons,
    cuts: decision.cuts,
    events: log.events,
  };
}

// "same moment as 'Office exchange gift draw'" when the reason names another candidate.
function dupPhrase(reason: string, names: Map<string, string>) {
  for (const name of names.values()) if (reason.includes(name)) return `same moment as '${name}'`;
  return CUT_PHRASE.duplicate;
}
