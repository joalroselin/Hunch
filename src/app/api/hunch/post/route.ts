import type { Audience, ProductInput, StudioEvent } from "@/lib/hunch/types";
import { EventLog } from "@/lib/hunch/engine/agents/events";
import { producePost, withChecks } from "@/lib/hunch/engine/agents/post";
import { bad, productFrom, readJson } from "@/lib/hunch/engine/http";
import { getMode, newId } from "@/lib/hunch/engine/mode";
import { liveModel } from "@/lib/hunch/engine/test-run";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Retry one post: Copywriter then Reviewer for one audience. Body { product, audience, code, theme? }.
export async function POST(req: Request) {
  const body = await readJson<{ product?: Partial<ProductInput>; audience?: Audience; code?: string; theme?: string }>(req);
  const product = productFrom(body?.product ?? null);
  const a = body?.audience;
  const code = body?.code?.trim();
  if (!product || !a?.id || !a.name || !code) return bad("Send { product, audience, code }.");
  if (getMode() !== "live") return bad("Retry needs a live run. The sample posts are already done.", 409);
  delete product.photo;
  const events: StudioEvent[] = [];
  const log = new EventLog((e) => {
    if (e.type === "event") events.push(e.event);
  });
  try {
    const out = await producePost({
      model: liveModel(),
      log,
      product,
      audience: { ...a, whereTheyAre: a.whereTheyAre ?? [], tone: a.tone ?? "", who: a.who ?? "", situation: a.situation ?? "", whyItFits: a.whyItFits ?? "" },
      code,
      id: `v_${code.toLowerCase()}_${newId().slice(0, 8)}`,
      theme: body?.theme,
    });
    return Response.json({ version: withChecks([out.version])[0], rejected: out.rejected, events });
  } catch (err) {
    console.error("hunch post retry failed", err);
    return bad("Could not write this post. Try again.", 500);
  }
}
