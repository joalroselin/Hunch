import { channelsOf } from "../../language";
import type { Audience, ProductInput } from "../../types";
import type { ImageInput } from "../claude";
import { callAgent, type AgentResult, type ModelClient } from "./model";
import { STRATEGIST_SYSTEM, strategistPrompt } from "./prompts";
import { StrategistSchema } from "./schemas";
import { noDashes, words } from "./text";

// 20 candidates, at least 4 motives, only the seller's channels. Ids c01..c20.
export async function runStrategist(model: ModelClient, product: Omit<ProductInput, "photo">, image?: ImageInput): Promise<AgentResult<Audience[]>> {
  const channels = new Set(channelsOf(product));
  return callAgent(
    model,
    { agent: "strategist", schema: StrategistSchema, system: STRATEGIST_SYSTEM, prompt: strategistPrompt(product), effort: "medium", image },
    (data) => {
      const list = noDashes(data.candidates);
      if (list.length < 20) return { ok: false, error: `Need exactly 20 candidates, got ${list.length}.` };
      const top = list.slice(0, 20);
      const motives = new Set(top.map((c) => c.motive));
      if (motives.size < 4) return { ok: false, error: `Cover at least 4 motives, got ${motives.size} (${[...motives].join(", ")}).` };
      const off = top.filter((c) => !channels.has(c.bestChannel));
      if (off.length) return { ok: false, error: `bestChannel must be one of ${[...channels].join(", ")}. Wrong on: ${off.map((c) => c.label).join(", ")}.` };
      const long = top.filter((c) => words(c.label) > 6);
      if (long.length) return { ok: false, error: `Labels must be 6 words or fewer: ${long.map((c) => c.label).join(", ")}.` };
      const labels = new Set(top.map((c) => c.label.toLowerCase()));
      if (labels.size < 20) return { ok: false, error: "Two candidates share a label. Make all 20 different." };
      return {
        ok: true,
        value: top.map((c, i) => ({
          id: `c${String(i + 1).padStart(2, "0")}`,
          name: c.label.trim(),
          who: c.who.trim(),
          situation: c.buyingMoment.trim(),
          whyItFits: c.angle.trim(),
          whereTheyAre: c.whereTheyAre.slice(0, 4),
          tone: c.tone.trim(),
          motive: c.motive,
          bestChannel: c.bestChannel,
        })),
      };
    },
  );
}
