"use client"

import { useSyncExternalStore } from "react"

import { API_PHOTO_SIDE, downscaleDataUrl } from "@/components/hunch/post"
import { SAMPLE_PRODUCT } from "@/components/hunch/screens/demo"
import { HunchError, errorText, replaySample, retryPost, streamTest } from "@/lib/hunch/client"
import { normalizeRun } from "@/lib/hunch/normalize"
import { getHunch, hunchStore, type StoredProduct } from "@/lib/hunch/store"
import { emptyStudio, studioReduce, type StudioState } from "@/lib/hunch/studio"
import type { Audience, Mode, RejectedDraft, StudioEvent, TestEvent, TestRun, Version } from "@/lib/hunch/types"

// One Studio run per tab, kept outside React so it keeps going while the seller looks at other steps.

type Fix = { version: Version; rejected: RejectedDraft[]; events: StudioEvent[] }

interface Job {
  id: number
  ac: AbortController
  replay: boolean
  skip: (() => void) | null
  state: StudioState
  fixes: Map<string, Fix>
}

interface Meta {
  running: boolean
  replay: boolean
  mode: Mode | null
  retrying: string[]
}

let job: Job | null = null
let seq = 0
let meta: Meta = { running: false, replay: false, mode: null, retrying: [] }
const listeners = new Set<() => void>()

function setMeta(patch: Partial<Meta>) {
  meta = { ...meta, ...patch }
  listeners.forEach((l) => l())
}

const subscribe = (cb: () => void) => {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

const SERVER_META: Meta = { running: false, replay: false, mode: null, retrying: [] }

export function useRunner() {
  return useSyncExternalStore(subscribe, () => meta, () => SERVER_META)
}

// Everything after the product belongs to the old run, so a new run clears it.
function clearJourney() {
  hunchStore.fill({
    run: null,
    report: null,
    csv: null,
    breakdownCsv: null,
    focus: null,
    focusFor: null,
    grid: null,
    handedOff: {},
    postLanguage: {},
    language: null,
  })
}

function applyFixes(run: TestRun, fixes: Iterable<Fix>): TestRun {
  let out = run
  for (const f of fixes) {
    out = {
      ...out,
      versions: out.versions.map((v) => (v.code === f.version.code ? f.version : v)),
      rejected: [...out.rejected, ...f.rejected],
      events: [...(out.events ?? []), ...f.events],
    }
  }
  return normalizeRun(out)
}

async function apiPhoto() {
  const photo = getHunch().photo
  if (!photo) return undefined
  try {
    return await downscaleDataUrl(photo, API_PHOTO_SIDE, 0.8)
  } catch {
    return undefined
  }
}

export function isSampleSeller(p: StoredProduct | null | undefined) {
  return !!p && p.name === SAMPLE_PRODUCT.name && p.description === SAMPLE_PRODUCT.description
}

/**
 * Starts a run for the product. replay = a sample seller's saved run in the browser (Kaye's matcha when the
 * product mentions matcha, else Elle's candles); the seller's name and price are swapped in when they typed their own.
 */
export function startStudio(product: StoredProduct, opts: { replay: boolean }) {
  job?.ac.abort()
  clearJourney()
  hunchStore.setProduct(product)
  const id = ++seq
  const ac = new AbortController()
  const current: Job = { id, ac, replay: opts.replay, skip: null, state: emptyStudio(), fixes: new Map() }
  job = current
  hunchStore.setStudio(current.state)
  setMeta({ running: true, replay: opts.replay, mode: opts.replay ? "sample" : null, retrying: [] })

  const onEvent = (e: TestEvent) => {
    if (job !== current || ac.signal.aborted) return
    current.state = studioReduce(current.state, e)
    hunchStore.setStudio(current.state)
  }

  const finish = (run: TestRun) => {
    if (job !== current || ac.signal.aborted) return
    hunchStore.setRun(current.fixes.size ? applyFixes(run, current.fixes.values()) : run)
    job = null
    setMeta({ running: false })
  }

  const fail = (e: unknown) => {
    if (job !== current || ac.signal.aborted) return
    const message = errorText(e, "The run stopped before the posts were done. Try again.")
    current.state = { ...current.state, status: "failed", error: message, message }
    hunchStore.setStudio(current.state)
    job = null
    setMeta({ running: false })
  }

  ;(async () => {
    try {
      if (opts.replay) {
        const input = isSampleSeller(product) ? {} : { name: product.name, price: product.price, description: product.description }
        const handle = await replaySample(input, onEvent, { signal: ac.signal })
        if (job !== current) return handle.cancel()
        current.skip = handle.skip
        finish(await handle.done)
      } else {
        const photo = await apiPhoto()
        const run = await streamTest({ ...product, photo }, onEvent, {
          signal: ac.signal,
          onMode: (mode) => job === current && setMeta({ mode }),
        })
        finish(run)
      }
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return
      fail(e)
    }
  })()
}

export function skipStudio() {
  job?.skip?.()
}

export function stopStudio() {
  job?.ac.abort()
  job = null
  setMeta({ running: false })
}

export function studioAlive() {
  return !!job
}

// Retry one failed post (live runs only). The rest of the run is not touched.
export async function retryCard(code: string, audience: Audience) {
  const s = getHunch()
  const product = s.run?.product ?? s.product
  if (!product || meta.retrying.includes(code)) return
  setMeta({ retrying: [...meta.retrying, code] })
  try {
    const out = await retryPost({ product, audience, code })
    const base = job?.state.startedAt ?? (s.studio?.startedAt || Date.now())
    const at = Math.max(0, Date.now() - base)
    const tag = `${code.toLowerCase()}r${Date.now().toString(36)}`
    const events = out.events.map((e, i) => ({ ...e, id: `${tag}_${e.id}`, at: at + i }))
    const fix: Fix = { version: out.version, rejected: out.rejected, events }
    if (job) {
      job.fixes.set(code, fix)
      let st = job.state
      for (const e of events) st = studioReduce(st, { type: "event", event: e })
      for (const r of out.rejected) st = studioReduce(st, { type: "rejected", rejected: r })
      st = studioReduce(st, { type: "version", version: out.version })
      job.state = st
      hunchStore.setStudio(st)
    } else {
      const run = getHunch().run
      if (run) hunchStore.fill({ run: applyFixes(run, [fix]) })
    }
  } catch (e) {
    throw e instanceof HunchError ? e : new HunchError(errorText(e, "Could not write this post. Try again."))
  } finally {
    setMeta({ retrying: meta.retrying.filter((c) => c !== code) })
  }
}
