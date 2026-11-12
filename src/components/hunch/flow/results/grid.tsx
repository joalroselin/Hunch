"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { NativeSelect } from "@/components/ui/native-select"
import { UgcPost } from "@/components/hunch/home/ugc-post"
import { Bubble } from "@/components/hunch/shell"
import { normalizeCode } from "@/lib/hunch/engine/results/match-rows"
import type { GridRow, TestRun, UnmatchedRow } from "@/lib/hunch/types"

import { usePostFrame } from "../test/run-post"
import { cellText, parseCell, peso, plural, rowReady } from "./words"

export type FileBusy = "file" | "sample" | null
type StoredFile = { name: string; text: string }
type Field = keyof Omit<GridRow, "code">

const FIELDS: Field[] = ["spend", "results", "linkClicks", "impressions"]
export const cellId = (code: string, field: Field) => `res-${code}-${field}`

/** The CSV as a sheet of paper. It takes a dropped file, opens the picker, and fills in as the numbers arrive. */
export function CsvSheet({
  busy,
  over,
  grid,
  files,
  sampleName,
  canClear,
  said,
  error,
  onPick,
  onSample,
  onClear,
}: {
  busy: FileBusy
  over: boolean
  grid: GridRow[]
  files: StoredFile[]
  /** "Elle" when the run has sample numbers to offer. */
  sampleName: string | null
  canClear: boolean
  said: string | null
  error: { text: string; hint?: string } | null
  onPick: () => void
  onSample: () => void
  onClear: () => void
}) {
  const ask = busy === "file" ? "Reading the file" : over ? "Drop it here" : files.length ? "Drop another CSV" : "Drop the CSV here"
  return (
    <div className="hr-csv">
      <button type="button" className="hr-paper" data-over={over || undefined} disabled={busy !== null} onClick={onPick} aria-describedby="res-paper-hint">
        <span className="hr-paper-in">
          <span className="hr-paper-name">
            {files.length ? files.map((f) => <span key={f.name}>{f.name}</span>) : <span>Ads Manager export</span>}
          </span>
          <span className="hr-paper-map" aria-hidden>
            {grid.map((row, r) => (
              <span key={row.code} data-ready={rowReady(row) || undefined} style={{ "--r": r } as React.CSSProperties}>
                {FIELDS.map((f) => (
                  <i key={f} data-on={row[f] != null || undefined} />
                ))}
                <b className="hh-grain" />
              </span>
            ))}
          </span>
          <span className="hr-paper-ask">{ask}</span>
          <span id="res-paper-hint" className="hr-paper-hint">
            <span className="pointer-coarse:hidden">or click to choose it</span>
            <span className="hidden pointer-coarse:inline">Tap to choose it</span>
          </span>
        </span>
      </button>
      {sampleName || canClear ? (
        <div className="hr-csv-tools">
          {sampleName ? (
            <Button variant="secondary" size="sm" disabled={busy !== null} aria-busy={busy === "sample" || undefined} onClick={onSample}>
              {`Use ${sampleName}'s numbers`}
            </Button>
          ) : null}
          {canClear ? (
            <Button variant="ghost" size="sm" onClick={onClear}>
              Clear the numbers
            </Button>
          ) : null}
        </div>
      ) : null}
      <div aria-live="polite" className="hr-csv-said">
        {error ? (
          <Bubble key={error.text} role="alert">
            {error.text}
            {error.hint ? ` ${error.hint}` : ""}
          </Bubble>
        ) : said ? (
          <Bubble key={said}>{said}</Bubble>
        ) : null}
      </div>
    </div>
  )
}

/** Ads Manager, connected: a sample run's numbers arrive by themselves, row by row. */
export function SyncSheet({ grid, syncing }: { grid: GridRow[]; syncing: boolean }) {
  const total = grid.length
  return (
    <div className="hr-csv">
      <div className="hr-paper hr-sync" data-syncing={syncing || undefined}>
        <span className="hr-paper-in">
          <span className="hr-paper-name">
            <span>Ads Manager</span>
          </span>
          <span className="hr-sync-status">
            <i aria-hidden />
            {syncing ? "Syncing" : "Connected"}
          </span>
          <span className="hr-paper-map" aria-hidden>
            {grid.map((row, r) => (
              <span key={row.code} data-ready={rowReady(row) || undefined} style={{ "--r": r } as React.CSSProperties}>
                {FIELDS.map((f) => (
                  <i key={f} data-on={row[f] != null || undefined} />
                ))}
                <b className="hh-grain" />
              </span>
            ))}
          </span>
          <span className="hr-paper-ask">{syncing ? `Pulling ${total} ads` : `${total} ads synced`}</span>
          <span className="hr-paper-hint">{syncing ? "From your ad account" : "Updated just now"}</span>
        </span>
      </div>
    </div>
  )
}

function Cell({
  id,
  label,
  value,
  prefix,
  onCommit,
  onMove,
  onPasteBlock,
}: {
  id: string
  label: string
  value: number | null
  prefix?: string
  onCommit: (v: number | null) => void
  onMove: (dir: 1 | -1) => void
  onPasteBlock: (rows: string[][]) => void
}) {
  const [draft, setDraft] = React.useState<string | null>(null)
  const shown = draft ?? cellText(value)
  const bad = draft != null && parseCell(draft) === undefined
  return (
    <label className="hr-cell" data-prefix={prefix ? "" : undefined}>
      <span className="ha-label hr-cell-label">{label}</span>
      {prefix ? <span aria-hidden>{prefix}</span> : null}
      <input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="next"
        value={shown}
        aria-invalid={bad || undefined}
        title={bad ? "Numbers only" : undefined}
        onChange={(e) => {
          setDraft(e.target.value)
          const n = parseCell(e.target.value)
          onCommit(n === undefined ? null : n)
        }}
        onBlur={() => {
          if (!bad) setDraft(null)
        }}
        onFocus={(e) => e.currentTarget.select()}
        onKeyDown={(e) => {
          // Enter and the arrows move down and up the column, like a spreadsheet.
          if (e.nativeEvent.isComposing) return
          if (e.key === "Enter" || e.key === "ArrowDown") {
            e.preventDefault()
            onMove(1)
          } else if (e.key === "ArrowUp") {
            e.preventDefault()
            onMove(-1)
          }
        }}
        onPaste={(e) => {
          // A block copied from a spreadsheet or the Ads Manager table fills across and down.
          const text = e.clipboardData.getData("text/plain")
          if (!/[\t\n]/.test(text.trim())) return
          e.preventDefault()
          setDraft(null)
          onPasteBlock(
            text
              .replace(/\r/g, "")
              .split("\n")
              .filter((l) => l.trim())
              .map((l) => l.split("\t"))
          )
        }}
        className="ha-field"
      />
    </label>
  )
}

/** The 8 posts, one row each. Typing is the main path on phones. */
export function ResultsGrid({
  run,
  grid,
  resultLabel,
  onCell,
}: {
  run: TestRun
  grid: GridRow[]
  resultLabel: string
  onCell: (code: string, field: Field, value: number | null) => void
}) {
  const frame = usePostFrame(run)
  const versionOf = (code: string) => run.versions.find((v) => normalizeCode(v.code) === code)
  const labels: Record<Field, string> = { spend: "Amount spent", results: resultLabel, linkClicks: "Link clicks", impressions: "Impressions" }

  const move = (r: number, f: Field, dir: 1 | -1) => {
    const next = grid[r + dir]
    if (next) document.getElementById(cellId(next.code, f))?.focus()
    else if (dir === 1) (document.activeElement as HTMLElement | null)?.blur()
  }
  const pasteBlock = (r: number, f: Field, rows: string[][]) => {
    const c0 = FIELDS.indexOf(f)
    rows.forEach((cells, dr) => {
      const row = grid[r + dr]
      if (!row) return
      cells.forEach((raw, dc) => {
        const field = FIELDS[c0 + dc]
        const n = parseCell(raw)
        if (field && n !== undefined) onCell(row.code, field, n)
      })
    })
  }

  return (
    <div className="hr-grid">
      <div aria-hidden className="hr-grid-head">
        <span />
        {FIELDS.map((f) => (
          <span key={f} className="ha-label">
            {labels[f]}
          </span>
        ))}
        <span />
      </div>
      <ul>
        {grid.map((row, r) => {
          const v = versionOf(row.code)
          const ready = rowReady(row)
          const name = v?.audienceName ?? row.code
          const f0 = v ? frame(v) : null
          return (
            <li key={row.code} role="group" aria-label={name} className="hr-row ha-rise" style={{ "--i": 6 + r * 0.6 } as React.CSSProperties}>
              <div className="hr-row-post">
                <span aria-hidden className="hr-thumb" style={{ rotate: `${r % 2 ? 3 : -3}deg` }}>
                  {f0 ? <UgcPost version={f0.version} photo={f0.photo} handle={f0.handle} bare /> : null}
                </span>
                <p>{name}</p>
              </div>
              {FIELDS.map((f) => (
                <Cell
                  key={f}
                  id={cellId(row.code, f)}
                  label={labels[f]}
                  prefix={f === "spend" ? "₱" : undefined}
                  value={row[f]}
                  onCommit={(n) => onCell(row.code, f, n)}
                  onMove={(dir) => move(r, f, dir)}
                  onPasteBlock={(rows) => pasteBlock(r, f, rows)}
                />
              ))}
              <span className="hr-ready hh-grain" data-on={ready || undefined}>
                <span className="sr-only">{ready ? "Ready" : "Needs numbers"}</span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function numbersOf(u: UnmatchedRow, resultWord: string) {
  return [
    `${peso(u.spend)} spent`,
    u.results != null ? plural(u.results, resultWord.replace(/s$/, ""), resultWord) : null,
    u.linkClicks != null ? plural(u.linkClicks, "link click", "link clicks") : null,
    u.impressions != null ? plural(u.impressions, "impression", "impressions") : null,
  ]
    .filter(Boolean)
    .join(", ")
}

/** Ads with no post code in their name. Picking a post adds the ad's numbers to it. */
export function UnmatchedList({
  rows,
  run,
  resultWord = "results",
  onAssign,
}: {
  rows: UnmatchedRow[]
  run: TestRun
  resultWord?: string
  onAssign: (row: UnmatchedRow, code: string) => void
}) {
  if (!rows.length) return null
  return (
    <section aria-labelledby="unmatched-title" className="hr-unmatched">
      <h2 id="unmatched-title" className="hh-title hr-h3">
        {rows.length === 1 ? "Match 1 ad to its post." : `Match ${rows.length} ads to their posts.`}
      </h2>
      <ul>
        {rows.map((u) => (
          <li key={u.adName}>
            <p>
              <b title={u.adName}>{u.adName}</b>
              <span>{numbersOf(u, resultWord)}</span>
            </p>
            <NativeSelect
              aria-label={`Add the numbers for ${u.adName} to a post`}
              value=""
              onChange={(e) => {
                if (e.target.value) onAssign(u, e.target.value)
              }}
            >
              <option value="">Choose its post</option>
              {run.versions.map((v) => (
                <option key={v.id} value={normalizeCode(v.code)}>
                  {v.audienceName}
                </option>
              ))}
            </NativeSelect>
          </li>
        ))}
      </ul>
    </section>
  )
}
