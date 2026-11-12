import type { ResultsReport } from "@/lib/hunch/types";
import { buildFocus, FocusError } from "@/lib/hunch/engine/focus";
import { bad, readJson, runFrom } from "@/lib/hunch/engine/http";
import { getMode } from "@/lib/hunch/engine/mode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request) {
  const body = await readJson<{ run?: unknown; report?: ResultsReport }>(req);
  const run = runFrom(body?.run);
  if (!run) return bad("Send the test run as { run, report }.");
  if (!body?.report?.winnerId || !body.report.verdict) return bad("Send the results report as { run, report }.");
  try {
    return Response.json(await buildFocus({ run, report: body.report, mode: getMode() }));
  } catch (err) {
    if (err instanceof FocusError) return bad(err.message, 502);
    console.error("hunch focus failed", err);
    return bad("Could not make next week's posts. Try again.", 500);
  }
}
