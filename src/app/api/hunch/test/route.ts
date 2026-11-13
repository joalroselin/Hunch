import type { ProductInput, TestEvent } from "@/lib/hunch/types";
import { PipelineError } from "@/lib/hunch/engine/agents/pipeline";
import { bad, productFrom, readJson } from "@/lib/hunch/engine/http";
import { getMode } from "@/lib/hunch/engine/mode";
import { ELLE_PRODUCT } from "@/lib/hunch/engine/sample/elle";
import { runTest } from "@/lib/hunch/engine/test-run";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// A public demo: each visitor gets a few live runs an hour (per server instance).
const RUNS_PER_HOUR = 6;
const recent = new Map<string, number[]>();
function overLimit(req: Request) {
  const who = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const times = (recent.get(who) ?? []).filter((t) => now - t < 3_600_000);
  if (times.length >= RUNS_PER_HOUR) return true;
  recent.set(who, [...times, now]);
  return false;
}

// NDJSON stream of TestEvent. Live: the agent pipeline. Sample: a sample seller's run replayed over 25-35 s.
export async function POST(req: Request) {
  const mode = getMode();
  const input = productFrom(await readJson<Partial<ProductInput>>(req)) ?? (mode === "sample" ? { ...ELLE_PRODUCT } : null);
  if (!input) return bad("Send the product as JSON with a name or a description.");
  if (mode === "live" && overLimit(req)) return bad("You've made a few tests in the last hour. Try again a little later.", 429);
  const enc = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const emit = (e: TestEvent) => {
        if (closed) return;
        try {
          controller.enqueue(enc.encode(JSON.stringify(e) + "\n"));
        } catch {
          closed = true;
        }
      };
      try {
        const run = await runTest(input, emit, mode, { replay: { signal: req.signal } });
        emit({ type: "done", run });
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") console.error("hunch test failed", err);
        emit({ type: "error", message: err instanceof PipelineError ? err.message : "Something broke while making the posts. Try again." });
      } finally {
        if (!closed) controller.close();
        closed = true;
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      "X-Hunch-Mode": mode,
    },
  });
}
