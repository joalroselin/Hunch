import type { GridRow } from "@/lib/hunch/types";
import { bad, readJson, runFrom } from "@/lib/hunch/engine/http";
import { getMode } from "@/lib/hunch/engine/mode";
import { buildReport } from "@/lib/hunch/engine/results/build";
import { ResultsInputError } from "@/lib/hunch/engine/results/report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Body = {
  run?: unknown;
  csvText?: string;
  breakdownCsv?: string;
  grid?: GridRow[];
  manualMap?: Record<string, string>;
  days?: number;
  sample?: boolean;
};

const num = (x: unknown) => (typeof x === "number" && Number.isFinite(x) && x >= 0 ? x : null);

export async function POST(req: Request) {
  const body = await readJson<Body>(req);
  const run = runFrom(body?.run);
  if (!body || !run) return bad("Send the test run as { run }.");
  if ((body.csvText?.length ?? 0) > 5_000_000 || (body.breakdownCsv?.length ?? 0) > 5_000_000) return bad("That file is too big. Export fewer columns and try again.");
  const grid = Array.isArray(body.grid)
    ? body.grid.map((g) => ({ code: String(g.code ?? ""), spend: num(g.spend), results: num(g.results), linkClicks: num(g.linkClicks), impressions: num(g.impressions) }))
    : undefined;
  try {
    const report = await buildReport({
      run,
      csvText: body.csvText,
      breakdownCsv: body.breakdownCsv,
      grid,
      manualMap: body.manualMap,
      days: num(body.days) ?? undefined,
      sample: !!body.sample,
      mode: getMode(),
    });
    return Response.json(report);
  } catch (err) {
    if (err instanceof ResultsInputError) return bad(err.message, 422, { unmatched: err.unmatched });
    console.error("hunch results failed", err);
    return bad("Could not read the results. Try again.", 500);
  }
}
