import { getMode } from "@/lib/hunch/engine/mode";
import { sampleFiles } from "@/lib/hunch/engine/sample/files";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// A sample seller's Meta export: Elle's candles, or Kaye's matcha with ?seller=matcha. ?file=breakdown gives the Age and Gender version.
function send(req: Request) {
  const params = new URL(req.url).searchParams;
  const breakdown = params.get("file") === "breakdown";
  const f = sampleFiles(params.get("seller") === "matcha" ? "matcha" : "candles");
  const name = breakdown ? f.breakdownName : f.resultsName;
  return new Response("﻿" + (breakdown ? f.breakdown : f.results), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "X-Hunch-Mode": getMode(),
      "X-Hunch-Sample": "1",
    },
  });
}

export const GET = send;
export const POST = send;
