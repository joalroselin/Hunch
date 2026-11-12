"use client"

import type {
  Audience,
  FocusPlan,
  GridRow,
  Mode,
  ProductInput,
  RejectedDraft,
  ResultsReport,
  StudioEvent,
  TestEvent,
  TestRun,
  UnmatchedRow,
  Version,
} from "./types"

export class HunchError extends Error {
  constructor(
    message: string,
    readonly unmatched: UnmatchedRow[] = [],
  ) {
    super(message)
  }
}

const OFFLINE = "Could not reach Hunch. Check your connection and try again."

async function failure(res: Response, fallback: string) {
  try {
    const body = (await res.json()) as { message?: string; unmatched?: UnmatchedRow[] }
    return new HunchError(body?.message || fallback, body?.unmatched ?? [])
  } catch {
    return new HunchError(fallback)
  }
}

async function post(path: string, body: unknown, signal?: AbortSignal) {
  try {
    return await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    })
  } catch (e) {
    if (signal?.aborted) throw e
    throw new HunchError(OFFLINE)
  }
}

function modeOf(res: Response): Mode | null {
  const m = res.headers.get("X-Hunch-Mode")
  return m === "live" || m === "sample" ? m : null
}

// Reads the NDJSON stream from /api/hunch/test and calls onEvent for each line (see TestEvent).
export async function streamTest(
  input: ProductInput,
  onEvent: (e: TestEvent) => void,
  opts: { signal?: AbortSignal; onMode?: (mode: Mode) => void } = {}
): Promise<TestRun> {
  const res = await post("/api/hunch/test", input, opts.signal)
  if (!res.ok || !res.body) throw await failure(res, "The test did not start. Try again.")
  const mode = modeOf(res)
  if (mode) opts.onMode?.(mode)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  const got: { run: TestRun | null; failure: string | null } = { run: null, failure: null }

  const handle = (line: string) => {
    const text = line.trim()
    if (!text) return
    let event: TestEvent
    try {
      event = JSON.parse(text) as TestEvent
    } catch {
      return
    }
    if (event.type === "done") got.run = event.run
    if (event.type === "error") got.failure = event.message
    onEvent(event)
  }

  try {
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      let nl = buffer.indexOf("\n")
      while (nl >= 0) {
        handle(buffer.slice(0, nl))
        buffer = buffer.slice(nl + 1)
        nl = buffer.indexOf("\n")
      }
    }
    buffer += decoder.decode()
    handle(buffer)
  } catch (e) {
    if (opts.signal?.aborted) throw e
    throw new HunchError("The connection dropped before the posts were done. Try again.")
  }

  if (got.failure) throw new HunchError(got.failure)
  if (!got.run) throw new HunchError("The test stopped before it finished. Try again.")
  return got.run
}

// Demo mode: replays a sample seller's saved run in the browser, no network. skip() jumps to run_ready (Shift + Right arrow).
export async function replaySample(
  input: Partial<Pick<ProductInput, "name" | "price" | "description">>,
  onEvent: (e: TestEvent) => void,
  opts: { signal?: AbortSignal } = {}
) {
  const [{ startReplay }, { sampleRunFor }] = await Promise.all([import("./engine/replay"), import("./engine/sample/run")])
  const handle = startReplay(sampleRunFor(input), onEvent, { signal: opts.signal })
  const done = handle.done.then((run) => {
    onEvent({ type: "done", run })
    return run
  })
  return { done, skip: handle.skip, cancel: handle.cancel }
}

export interface ResultsRequest {
  run: TestRun
  grid?: GridRow[] // typed or edited numbers; these win over the CSV totals
  csvText?: string // Meta export: dates, ad names and the breakdown
  breakdownCsv?: string // optional second export with Age and Gender
  manualMap?: Record<string, string> // ad name -> code for unmatched rows
  days?: number // test length when there is no CSV (default 3)
  sample?: boolean // use the sample seller's export for this run
}

// Server builds the report and, in live mode, asks the Analyst to explain the computed verdict.
export async function fetchResults(body: ResultsRequest, signal?: AbortSignal): Promise<ResultsReport> {
  const res = await post("/api/hunch/results", body, signal)
  if (!res.ok) throw await failure(res, "Could not read the results. Try again.")
  return (await res.json()) as ResultsReport
}

export async function fetchFocus(body: { run: TestRun; report: ResultsReport }, signal?: AbortSignal): Promise<FocusPlan> {
  const res = await post("/api/hunch/focus", body, signal)
  if (!res.ok) throw await failure(res, "Could not make next week's posts. Try again.")
  return (await res.json()) as FocusPlan
}

// A sample seller's export as text (Elle's candles unless seller is "matcha"). file "breakdown" gives the Age and Gender version.
export async function fetchSampleCsv(
  file: "results" | "breakdown" = "results",
  signal?: AbortSignal,
  seller: "candles" | "matcha" = "candles"
): Promise<{ name: string; text: string }> {
  const q = new URLSearchParams({ ...(file === "breakdown" ? { file } : {}), ...(seller === "matcha" ? { seller } : {}) }).toString()
  let res: Response
  try {
    res = await fetch(`/api/hunch/sample-csv${q ? `?${q}` : ""}`, { signal })
  } catch (e) {
    if (signal?.aborted) throw e
    throw new HunchError(OFFLINE)
  }
  if (!res.ok) throw await failure(res, "Could not get the sample file. Try again.")
  const name = res.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ?? "Sample data.csv"
  return { name, text: (await res.text()).replace(/^\uFEFF/, "") }
}

// Retry one failed or flagged post (live mode only).
export async function retryPost(
  body: { product: Omit<ProductInput, "photo">; audience: Audience; code: string; theme?: string },
  signal?: AbortSignal
): Promise<{ version: Version; rejected: RejectedDraft[]; events: StudioEvent[] }> {
  const res = await post("/api/hunch/post", body, signal)
  if (!res.ok) throw await failure(res, "Could not write this post. Try again.")
  return (await res.json()) as { version: Version; rejected: RejectedDraft[]; events: StudioEvent[] }
}

export function errorText(e: unknown, fallback = "Something went wrong. Try again.") {
  if (e instanceof HunchError) return e.message
  if (e instanceof Error && e.name === "AbortError") return ""
  return fallback
}
