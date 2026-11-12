"use client"

import { useSyncExternalStore } from "react"

import { emptyGrid, normalizeCode } from "./engine/results/match-rows"
import { normalizeLanguage } from "./language"
import { isStale, normalizeProduct, normalizeRun } from "./normalize"
import { studioFromRun, type StudioState } from "./studio"
import type { BudgetPreset, FocusPlan, GridRow, Language, ProductInput, ResultsReport, TestRun, TestSetup, Version } from "./types"

export type StoredProduct = Omit<ProductInput, "photo">
export type StoredFile = { name: string; text: string }

export interface HunchState {
  ready: boolean
  product: StoredProduct | null
  // Post-size JPEG data URL.
  photo: string | null
  run: TestRun | null
  report: ResultsReport | null
  // Uploaded CSV, kept so unmatched rows can be fixed and the breakdown re-read without a new upload.
  csv: StoredFile | null
  breakdownCsv: StoredFile | null
  focus: FocusPlan | null
  // Which report the focus plan was made from.
  focusFor: string | null
  // Post language: one for all cards, plus per-card overrides by post id.
  language: Language | null
  postLanguage: Record<string, Language>
  setup: TestSetup
  // The typed 8-row results grid.
  grid: GridRow[] | null
  // Share handoff: post id -> handedOffAt.
  handedOff: Record<string, number>
  // Studio log of the current or last run.
  studio: StudioState | null
}

// Bump to clear data saved by older builds (Sili Mango, chili garlic oil, H codes, "filipino").
const VERSION = "4"

const KEYS = {
  version: "hunch.v",
  product: "hunch.product",
  photo: "hunch.photo",
  run: "hunch.run",
  report: "hunch.report",
  csv: "hunch.csv",
  breakdownCsv: "hunch.breakdownCsv",
  focus: "hunch.focus",
  prefs: "hunch.prefs",
  grid: "hunch.grid",
  handedOff: "hunch.handedOff",
  studio: "hunch.studio",
} as const

export function setupFor(perPost: BudgetPreset = 99): TestSetup {
  return { budget: perPost * 8, perPost, days: 3 }
}

const EMPTY: HunchState = {
  ready: false,
  product: null,
  photo: null,
  run: null,
  report: null,
  csv: null,
  breakdownCsv: null,
  focus: null,
  focusFor: null,
  language: null,
  postLanguage: {},
  setup: setupFor(99),
  grid: null,
  handedOff: {},
  studio: null,
}

let state: HunchState = EMPTY
let loaded = false
const listeners = new Set<() => void>()

function read<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  try {
    if (value == null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or blocked; the in-memory state still works.
  }
}

// Old builds: keep the seller's own product and photo, drop runs and results so nothing mixes.
function migrate() {
  if (read<string>(KEYS.version) === VERSION) return
  const product = read<StoredProduct>(KEYS.product)
  for (const k of Object.values(KEYS)) if (k !== KEYS.photo && k !== KEYS.product) write(k, null)
  // The old sample's photo goes with it; a photo with no product is dropped too.
  if (!product || /sili mango|chili garlic oil/i.test(product.name ?? "")) {
    write(KEYS.product, null)
    write(KEYS.photo, null)
  } else write(KEYS.product, normalizeProduct(product))
  write(KEYS.version, VERSION)
}

type Prefs = { language: Language | null; postLanguage: Record<string, Language>; budget: BudgetPreset }

function load() {
  if (loaded || typeof window === "undefined") return
  loaded = true
  migrate()
  const focus = read<{ plan: FocusPlan; forReport: string }>(KEYS.focus)
  const prefs = read<Prefs>(KEYS.prefs)
  const product = read<StoredProduct>(KEYS.product)
  let run = read<TestRun>(KEYS.run)
  if (run && isStale(run)) run = null
  let studio = read<StudioState>(KEYS.studio)
  if (studio?.status === "running") studio = { ...studio, status: "interrupted", message: "The page was refreshed before the posts were done." }
  state = {
    ready: true,
    product: product ? normalizeProduct(product) : null,
    photo: read<string>(KEYS.photo),
    run: run ? normalizeRun(run) : null,
    report: run ? read<ResultsReport>(KEYS.report) : null,
    csv: read<StoredFile>(KEYS.csv),
    breakdownCsv: read<StoredFile>(KEYS.breakdownCsv),
    focus: run ? (focus?.plan ?? null) : null,
    focusFor: run ? (focus?.forReport ?? null) : null,
    language: prefs?.language ? normalizeLanguage(prefs.language) : null,
    postLanguage: Object.fromEntries(Object.entries(prefs?.postLanguage ?? {}).map(([k, v]) => [k, normalizeLanguage(v)])),
    setup: setupFor(prefs?.budget === 49 || prefs?.budget === 199 ? prefs.budget : 99),
    grid: read<GridRow[]>(KEYS.grid),
    handedOff: read<Record<string, number>>(KEYS.handedOff) ?? {},
    studio,
  }
}

const big = (f: StoredFile | null) => (f && f.text.length < 1_500_000 ? f : null)

function set(patch: Partial<HunchState>) {
  load()
  state = { ...state, ...patch, ready: true }
  if ("product" in patch) write(KEYS.product, patch.product)
  if ("photo" in patch) write(KEYS.photo, patch.photo)
  if ("run" in patch) write(KEYS.run, patch.run)
  if ("report" in patch) write(KEYS.report, patch.report)
  if ("csv" in patch) write(KEYS.csv, big(patch.csv ?? null))
  if ("breakdownCsv" in patch) write(KEYS.breakdownCsv, big(patch.breakdownCsv ?? null))
  if ("grid" in patch) write(KEYS.grid, patch.grid)
  if ("handedOff" in patch) write(KEYS.handedOff, patch.handedOff)
  if ("studio" in patch) write(KEYS.studio, patch.studio)
  if ("language" in patch || "postLanguage" in patch || "setup" in patch) {
    write(KEYS.prefs, { language: state.language, postLanguage: state.postLanguage, budget: state.setup.perPost } satisfies Prefs)
  }
  if ("focus" in patch || "focusFor" in patch) {
    write(KEYS.focus, state.focus && state.focusFor ? { plan: state.focus, forReport: state.focusFor } : null)
  }
  listeners.forEach((l) => l())
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  const onStorage = (e: StorageEvent) => {
    if (e.key && !e.key.startsWith("hunch.")) return
    loaded = false
    load()
    cb()
  }
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(cb)
    window.removeEventListener("storage", onStorage)
  }
}

function getSnapshot() {
  load()
  return state
}

const getServerSnapshot = () => EMPTY

export function useHunch() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export function getHunch() {
  return getSnapshot()
}

export function reportKey(report: ResultsReport) {
  return `${report.runId}:${report.winnerId}:${report.totalSpend}:${report.metrics.length}:${report.verdict?.metric ?? ""}`
}

// Selected language for one post: its own override, else the global one, else the product default.
export function languageFor(s: Pick<HunchState, "language" | "postLanguage" | "product" | "run">, postId?: string): Language {
  return (postId && s.postLanguage[postId]) || s.language || s.run?.product.language || s.product?.language || "taglish"
}

// Studio to show: the in-flight or interrupted log, else the saved run's log.
export function studioOf(s: Pick<HunchState, "studio" | "run">): StudioState | null {
  if (s.studio && s.studio.status !== "done") return s.studio
  return s.run ? studioFromRun(s.run) : (s.studio ?? null)
}

export function withHandoff<T extends Version>(s: Pick<HunchState, "handedOff">, v: T): T {
  const at = s.handedOff[v.id]
  return at ? { ...v, handedOffAt: at } : v
}

// The grid to show: saved values, else empty rows for the run's codes.
export function gridFor(s: Pick<HunchState, "grid" | "run">): GridRow[] {
  const codes = s.run?.versions.map((v) => normalizeCode(v.code)) ?? undefined
  const base = emptyGrid(codes)
  if (!s.grid) return base
  return base.map((row) => s.grid!.find((g) => normalizeCode(g.code) === row.code) ?? row)
}

export const hunchStore = {
  setProduct(product: StoredProduct) {
    set({ product: normalizeProduct(product) })
  },
  setPhoto(photo: string | null) {
    set({ photo })
  },
  // A new run makes old results, plans, shares and per-post languages stale.
  setRun(run: TestRun) {
    const r = normalizeRun(run)
    set({
      run: r,
      report: null,
      csv: null,
      breakdownCsv: null,
      focus: null,
      focusFor: null,
      grid: null,
      handedOff: {},
      postLanguage: {},
      language: null,
      studio: null,
    })
  },
  setStudio(studio: StudioState | null) {
    set({ studio })
  },
  setReport(report: ResultsReport, csv: StoredFile | null, breakdownCsv: StoredFile | null = null) {
    set({ report, csv, breakdownCsv, focus: null, focusFor: null })
  },
  clearReport() {
    set({ report: null, focus: null, focusFor: null })
  },
  setFocus(focus: FocusPlan, report: ResultsReport) {
    set({ focus, focusFor: reportKey(report) })
  },
  // Global toggle: switches every card and clears per-card choices.
  setLanguage(language: Language) {
    set({ language, postLanguage: {} })
  },
  setPostLanguage(postId: string, language: Language) {
    set({ postLanguage: { ...getSnapshot().postLanguage, [postId]: language } })
  },
  setBudget(budget: BudgetPreset) {
    set({ setup: setupFor(budget) })
  },
  setGrid(grid: GridRow[] | null) {
    set({ grid })
  },
  setGridCell(code: string, field: keyof Omit<GridRow, "code">, value: number | null) {
    const grid = gridFor(getSnapshot()).map((g) => (g.code === normalizeCode(code) ? { ...g, [field]: value } : g))
    set({ grid })
  },
  setCsv(csv: StoredFile | null, breakdownCsv?: StoredFile | null) {
    set(breakdownCsv === undefined ? { csv } : { csv, breakdownCsv })
  },
  markHandedOff(postId: string, at = Date.now()) {
    set({ handedOff: { ...getSnapshot().handedOff, [postId]: at } })
  },
  fill(patch: Partial<Omit<HunchState, "ready">>) {
    set(patch)
  },
  reset() {
    set({ ...EMPTY })
  },
}
