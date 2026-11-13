"use client"

import * as React from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { Button, GoLink } from "@/components/ui/button"
import { applyDemo, stripDemoParam } from "@/components/hunch/screens/demo"
import { Bubble, EmptyScreen, LoadingScreen, Screen, ScreenTitle, StepAction } from "@/components/hunch/shell"
import { fetchResults } from "@/lib/hunch/client"
import { personaOf } from "@/lib/hunch/engine/sample/catalog"
import { gridReady, normalizeCode } from "@/lib/hunch/engine/results/match-rows"
import { getHunch, gridFor, hunchStore, reportKey, useHunch } from "@/lib/hunch/store"
import type { GridRow, Mode, UnmatchedRow } from "@/lib/hunch/types"

import { CsvSheet, ResultsGrid, SyncSheet, UnmatchedList, cellId, type FileBusy } from "./grid"
import { Race, WinnerPoster } from "./verdict"
import { YourPeople } from "./your-people"
import { audienceName, isSampleFile, metricWords, rowReady } from "./words"
import "./results.css"

type Engine = typeof import("@/lib/hunch/engine/results")
let engine: Promise<Engine> | null = null
const loadEngine = () => (engine ??= import("@/lib/hunch/engine/results"))
const loadSamples = () => import("@/lib/hunch/engine/sample/files")

// Ad name -> code picks for unmatched rows, kept per run and file so a refresh does not add them twice.
const MAP_KEY = "hunch.resultsMatch"
function readMap(key: string): Record<string, string> {
  try {
    const raw = JSON.parse(window.localStorage.getItem(MAP_KEY) ?? "null") as { key: string; map: Record<string, string> } | null
    return raw?.key === key ? raw.map : {}
  } catch {
    return {}
  }
}
function writeMap(key: string, map: Record<string, string>) {
  try {
    window.localStorage.setItem(MAP_KEY, JSON.stringify({ key, map }))
  } catch {}
}

const add = (a: number | null, b: number | null) => (b == null ? a : Math.round(((a ?? 0) + b) * 100) / 100)

const usePrefersReduced = () => {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])
  return reduced
}

export function ResultsFlow({ demo, serverMode }: { demo: boolean; serverMode: Mode }) {
  const s = useHunch()
  const reduced = usePrefersReduced()
  const [demoPending, setDemoPending] = useState(demo)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState<FileBusy>(null)
  const [fileError, setFileError] = useState<{ text: string; hint?: string } | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [gridKey, setGridKey] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [over, setOver] = useState(false)
  const depth = useRef(0)
  const [writing, setWriting] = useState(false)
  const [, setFailed] = useState(false)
  const [unmatched, setUnmatched] = useState<UnmatchedRow[]>([])
  const [resultType, setResultType] = useState<string | null>(null)
  const [manualMap, setManualMap] = useState<Record<string, string>>({})
  const mapRef = useRef(manualMap)
  mapRef.current = manualMap
  const pickRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!demo) return
    let alive = true
    applyDemo("results").finally(() => {
      if (!alive) return
      setDemoPending(false)
      stripDemoParam()
    })
    return () => {
      alive = false
    }
  }, [demo])

  useEffect(() => () => abortRef.current?.abort(), [])

  const run = s.run
  const source = s.csv ?? s.breakdownCsv
  const mapKey = run ? `${run.id}|${source?.name ?? ""}` : ""

  useEffect(() => {
    if (!s.ready) return
    setManualMap(mapKey ? readMap(mapKey) : {})
  }, [mapKey, s.ready])

  // Unmatched rows and the result type come from the file in use.
  useEffect(() => {
    if (!run || !source) {
      setUnmatched([])
      setResultType(null)
      return
    }
    let alive = true
    loadEngine().then((e) => {
      if (!alive) return
      const r = e.readExport(source.text, run, manualMap)
      setUnmatched(r.unmatched)
      setResultType(r.parsed.rows.find((x) => x.resultType)?.resultType ?? null)
    })
    return () => {
      alive = false
    }
  }, [run, source, manualMap])

  const grid = useMemo(() => gridFor(s), [s])
  const report = run && s.report && s.report.runId === run.id ? s.report : null
  const showVerdict = !!report && !editing
  const sampleGrid = isSampleFile(s.csv) || (!s.csv && isSampleFile(s.breakdownCsv))

  const submit = useCallback(async () => {
    const st = getHunch()
    const r = st.run
    if (!r) return
    const g = gridFor(st)
    if (!gridReady(g)) {
      // Say what is missing in a bubble and go to the first gap.
      const gap = g.find((x) => !rowReady(x))
      setSubmitError("Add the amount spent, plus messages or link clicks, for every post.")
      if (gap) document.getElementById(cellId(gap.code, gap.spend == null ? "spend" : "results"))?.focus()
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    abortRef.current?.abort()
    const e = await loadEngine()
    // The full sample needs both files; one sample file alone still counts as sample data.
    const sample = isSampleFile(st.csv) && isSampleFile(st.breakdownCsv)
    const anySample = isSampleFile(st.csv) || isSampleFile(st.breakdownCsv)
    const csvText = st.csv?.text ?? st.breakdownCsv?.text
    const body = {
      run: r,
      grid: g,
      csvText,
      breakdownCsv: st.breakdownCsv?.text,
      manualMap: mapRef.current,
      days: csvText ? undefined : st.setup.days,
      sample,
    }
    let local
    try {
      local = e.computeReport({ ...body, mode: serverMode })
    } catch (err) {
      setSubmitError(err instanceof e.ResultsInputError ? err.message : "Could not work out the results. Check the numbers and try again.")
      setSubmitting(false)
      return
    }
    if (local.verdict.ranking[0]?.value == null) {
      setSubmitError("No post has messages or link clicks above zero yet. Check the numbers, or export again after another day.")
      setSubmitting(false)
      return
    }
    if (anySample && !local.isSample) local = { ...local, isSample: true, notes: ["Sample data. No real ads were run.", ...(local.notes ?? [])] }
    hunchStore.setReport(local, st.csv, st.breakdownCsv)
    setEditing(false)
    setFailed(false)
    setSubmitting(false)
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" })
    if (local.isSample || serverMode === "sample") return

    // Live: the Analyst explains the verdict computed above. It can't change it.
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setWriting(true)
    try {
      const full = await fetchResults(body, ctrl.signal)
      const now = getHunch()
      if (now.run?.id === r.id && now.report && reportKey(now.report) === reportKey(local)) hunchStore.setReport(full, now.csv, now.breakdownCsv)
    } catch {
      if (!ctrl.signal.aborted) setFailed(true)
    } finally {
      if (!ctrl.signal.aborted) setWriting(false)
    }
  }, [reduced, serverMode])

  const onFile = useCallback(
    async (file: File) => {
      const inVerdict = !!getHunch().report && !editing
      const fail = (text: string, hint?: string) => {
        if (inVerdict) toast.error(text, hint ? { description: hint } : undefined)
        else setFileError({ text, hint })
        setNote(null)
      }
      const r = getHunch().run
      if (!r) return
      setFileError(null)
      setSubmitError(null)
      if (/\.(xlsx|xls|numbers|ods)$/i.test(file.name)) return fail("That is a spreadsheet, not a CSV.", "Export the table as CSV in Ads Manager, or type the numbers in.")
      if (file.size > 5_000_000) return fail("File over 5 MB.", "Export only the ad rows, or type the numbers in.")
      setBusy("file")
      let text = ""
      try {
        text = await file.text()
      } catch {
        setBusy(null)
        return fail("The file did not open.", "Export it again, or type the numbers in.")
      }
      const [e, samples] = await Promise.all([loadEngine(), loadSamples()])
      const read = e.readExport(text, r)
      setBusy(null)
      if (!read.parsed.ok) {
        const empty = read.parsed.message === e.EMPTY_EXPORT
        return fail(read.parsed.message ?? e.UNREADABLE_EXPORT, empty ? "Export again after the ads have run for a day, or type your numbers into the grid." : undefined)
      }
      const isSample = samples.isSampleText(text)
      const stored = { name: isSample && !isSampleFile(file) ? `Sample data - ${file.name}` : file.name, text }
      const st = getHunch()
      const filled = read.grid.filter((g) => g.spend != null).length
      const gaps = read.missingCodes.length
      const loose = read.unmatched.length
      const missing = loose ? ` Match the other ${loose === 1 ? "ad" : `${loose} ads`} below.` : gaps ? ` Type in the other ${gaps === 1 ? "post" : gaps}.` : ""

      if (read.parsed.hasBreakdown && st.csv && st.grid?.some((g) => g.spend != null) && isSampleFile(st.csv) === isSample) {
        // Main numbers are already in; this file adds who each post reached.
        hunchStore.setCsv(st.csv, stored)
        setNote("Age and gender added.")
      } else {
        const keepBreakdown = !read.parsed.hasBreakdown && st.breakdownCsv && isSampleFile(st.breakdownCsv) === isSample ? st.breakdownCsv : null
        hunchStore.setCsv(read.parsed.hasBreakdown ? null : stored, read.parsed.hasBreakdown ? stored : keepBreakdown)
        hunchStore.setGrid(read.grid)
        setGridKey((k) => k + 1)
        setNote(`${filled === 1 ? "1 post" : `${filled} posts`} filled from the CSV.${missing}`)
      }
      if (inVerdict && gridReady(gridFor(getHunch()))) {
        await submit()
        toast.success(read.parsed.hasBreakdown ? "Age and gender added." : "Results updated.")
      }
    },
    [editing, submit]
  )

  const onSample = useCallback(async () => {
    const r = getHunch().run
    if (!r) return
    setBusy("sample")
    setFileError(null)
    setSubmitError(null)
    const [e, samples] = await Promise.all([loadEngine(), loadSamples()])
    const f = samples.sampleFilesOf(r)
    const read = e.readExport(f.results, r)
    hunchStore.setCsv({ name: f.resultsName, text: f.results }, { name: f.breakdownName, text: f.breakdown })
    hunchStore.setGrid(read.grid)
    setGridKey((k) => k + 1)
    setBusy(null)
    setNote(`${read.grid.filter((g) => g.spend != null).length} posts filled with ${personaOf(r)}'s numbers.`)
  }, [])

  const onClear = useCallback(() => {
    hunchStore.setGrid(null)
    hunchStore.setCsv(null, null)
    setManualMap({})
    setGridKey((k) => k + 1)
    setNote(null)
    setFileError(null)
    setSubmitError(null)
  }, [])

  const onCell = useCallback((code: string, field: keyof Omit<GridRow, "code">, value: number | null) => {
    hunchStore.setGridCell(code, field, value)
    setSubmitError(null)
  }, [])

  const onAssign = useCallback(
    (u: UnmatchedRow, code: string) => {
      const st = getHunch()
      const next = gridFor(st).map((g) =>
        g.code === normalizeCode(code)
          ? {
              ...g,
              spend: add(g.spend, u.spend),
              results: add(g.results, u.results),
              linkClicks: add(g.linkClicks, u.linkClicks),
              impressions: add(g.impressions, u.impressions),
            }
          : g
      )
      hunchStore.setGrid(next)
      setGridKey((k) => k + 1)
      const map = { ...mapRef.current, [u.adName]: normalizeCode(code) }
      setManualMap(map)
      writeMap(mapKey, map)
      setNote(`Numbers added to ${(st.run ? audienceName(st.run, code) : code).toLowerCase()}.`)
    },
    [mapKey]
  )

  // A short message clears itself; an error stays until the next try.
  useEffect(() => {
    if (!note) return
    const t = window.setTimeout(() => setNote(null), 6000)
    return () => window.clearTimeout(t)
  }, [note])
  useEffect(() => {
    if (!submitError) return
    const t = window.setTimeout(() => setSubmitError(null), 6000)
    return () => window.clearTimeout(t)
  }, [submitError])

  // The numbers arrive by themselves, a row at a time, as if Ads Manager sent them.
  const [shown, setShown] = useState<number | null>(null)
  const synced = useRef(false)
  const autoSync = !!run
  useEffect(() => {
    if (!s.ready || !autoSync || synced.current || report || editing) return
    if (getHunch().grid?.some((g) => g.spend != null)) return
    synced.current = true
    let alive = true
    let done = false
    let t = 0
    setShown(0)
    onSample().then(() => {
      if (!alive) return
      const total = getHunch().grid?.length ?? 8
      let n = 0
      const step = () => {
        n++
        setShown(n)
        if (n < total) t = window.setTimeout(step, 240)
        else {
          done = true
          t = window.setTimeout(() => alive && setShown(null), 500)
        }
      }
      t = window.setTimeout(step, 600)
    })
    return () => {
      alive = false
      window.clearTimeout(t)
      if (!done) {
        synced.current = false
        setShown(null)
      }
    }
  }, [s.ready, autoSync, report, editing, onSample])

  if (!s.ready || demoPending) return <LoadingScreen />
  if (!run) {
    return <EmptyScreen title="No test yet." line="Type what you sell to get 8 posts." href="/start" action="Go to Start" />
  }

  const words = report ? metricWords(report.verdict.metric, report.resultType ?? null) : metricWords("cost_per_result", resultType)
  const allReady = gridReady(grid)
  // The test asks for messages; another result type in the file keeps Ads Manager's own word.
  const messages = !resultType || /messag/i.test(resultType)
  const hidden = (
    <input
      ref={pickRef}
      type="file"
      accept=".csv,text/csv"
      tabIndex={-1}
      aria-hidden
      className="sr-only"
      onChange={(e) => {
        const f = e.target.files?.[0]
        if (f) onFile(f)
        e.target.value = ""
      }}
    />
  )

  if (showVerdict && report) {
    return (
      <Screen aria-label="Results" className="hr-v">
        <Race report={report} run={run} words={words} />
        {hidden}

        <div className="hr-send hr-send-v">
          <StepAction>
            <GoLink href="/next-week" className="w-full md:w-auto">{"Get next week's posts"}</GoLink>
          </StepAction>
          {report.notes?.filter((n) => !/sample|persona/i.test(n)).map((n) => (
            <p key={n} className="ha-note">
              {n}
            </p>
          ))}
        </div>

        <WinnerPoster report={report} run={run} words={words} breakdownBusy={busy === "file" || submitting} onAddBreakdown={() => pickRef.current?.click()} />
        <YourPeople report={report} writing={writing} />
      </Screen>
    )
  }

  const files = [s.csv, s.breakdownCsv && s.breakdownCsv.name !== s.csv?.name ? s.breakdownCsv : null].filter((f): f is NonNullable<typeof f> => !!f)
  const hasNumbers = grid.some((g) => g.spend != null || g.results != null || g.linkClicks != null || g.impressions != null)
  const tip = submitError
  const sampleName = sampleGrid ? null : personaOf(run)
  const syncing = shown !== null
  const view = shown === null ? grid : grid.map((g, i) => (i < shown ? g : { ...g, spend: null, results: null, linkClicks: null, impressions: null }))

  return (
    <Screen
      aria-label="Add your results"
      onDragEnter={(e) => {
        if (!e.dataTransfer.types.includes("Files")) return
        e.preventDefault()
        depth.current++
        setOver(true)
      }}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) e.preventDefault()
      }}
      onDragLeave={() => {
        depth.current = Math.max(0, depth.current - 1)
        if (!depth.current) setOver(false)
      }}
      onDrop={(e) => {
        if (!e.dataTransfer.types.includes("Files")) return
        e.preventDefault()
        depth.current = 0
        setOver(false)
        const f = e.dataTransfer.files?.[0]
        if (f) onFile(f)
      }}
    >
      <div className="hr-entry">
        {autoSync ? (
          <ScreenTitle className="hr-entry-head" title="Here are your numbers." line="Hunch pulls them from Ads Manager for you." />
        ) : (
          <ScreenTitle className="hr-entry-head" title="Bring back the numbers." line="Drop the Ads Manager CSV, or type what each post got." />
        )}

        {autoSync ? (
          <SyncSheet grid={view} syncing={syncing} />
        ) : (
          <CsvSheet
            busy={busy}
            over={over}
            grid={grid}
            files={files}
            sampleName={sampleName}
            canClear={files.length > 0 || hasNumbers}
            said={note}
            error={fileError}
            onPick={() => pickRef.current?.click()}
            onSample={onSample}
            onClear={onClear}
          />
        )}
        {hidden}

        <div className="hr-entry-grid">
          <ResultsGrid key={gridKey} run={run} grid={view} resultLabel={messages ? "Messages" : "Results"} onCell={onCell} />
          {unmatched.length ? <UnmatchedList rows={unmatched} run={run} resultWord={messages ? "messages" : "results"} onAssign={onAssign} /> : null}

          <div className="hr-send">
            <StepAction>
              <span className="hr-go">
                {tip ? (
                  <Bubble aria-hidden className="hr-go-tip md:hidden">
                    {tip}
                  </Bubble>
                ) : null}
                <Button variant="go" size="lg" className="w-full md:w-auto" disabled={submitting || syncing} aria-busy={submitting || syncing || undefined} onClick={submit}>
                  {submitting ? "Reading the numbers" : words.noun === "message" || messages ? "See who messaged" : "See who clicked"}
                </Button>
              </span>
            </StepAction>
            {report ? (
              <Button variant="secondary" size="lg" onClick={() => setEditing(false)}>
                Back to the result
              </Button>
            ) : null}
            {tip ? (
              <Bubble aria-hidden className="max-md:hidden">
                {tip}
              </Bubble>
            ) : !allReady && !autoSync ? (
              <p className="ha-note max-md:hidden">Every post needs its amount spent, plus messages or link clicks.</p>
            ) : null}
            <span role="status" aria-live="polite" className="sr-only">
              {tip ?? ""}
            </span>
          </div>
        </div>
      </div>
    </Screen>
  )
}
