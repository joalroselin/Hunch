import type { GridRow, Mode, ResultsReport, TestRun, Verdict, VersionMetrics } from "../../types";
import { makeSwapper } from "../sample/personalize";
import { sampleSet, sampleSetOf, type SampleSet } from "../sample/sets";
import { buildIcp, templateExplanation } from "./explain";
import { gridReady, matchRows, normalizeCode, toGrid, type MatchedCode } from "./match-rows";
import { parseCsv, type ParsedExport } from "./parse-csv";
import { pickWinner } from "./pick-winner";

export class ResultsInputError extends Error {
  constructor(
    message: string,
    readonly unmatched: ResultsReport["unmatched"] = [],
  ) {
    super(message);
  }
}

export interface ReportInput {
  run: TestRun;
  csvText?: string; // Meta export; fills the grid and gives dates, ad names and the breakdown
  breakdownCsv?: string; // optional second export with Age and Gender
  grid?: GridRow[]; // typed or edited numbers; wins over the CSV totals
  manualMap?: Record<string, string>; // ad name -> code, for rows without a code
  days?: number; // when there is no CSV with dates (default 3)
  sample?: boolean; // use the sample seller's export for this run
  mode?: Mode;
}

export interface ExportRead {
  parsed: ParsedExport;
  grid: GridRow[];
  byCode: Map<string, MatchedCode>;
  unmatched: NonNullable<ResultsReport["unmatched"]>;
  missingCodes: string[];
}

const codesOf = (run: TestRun) => run.versions.map((v) => normalizeCode(v.code));

// Client-side: reads an export into the 8-row grid, with unmatched rows and the empty-export message.
export function readExport(text: string, run: TestRun, manualMap?: Record<string, string>): ExportRead {
  const parsed = parseCsv(text);
  const codes = codesOf(run);
  const { byCode, unmatched } = matchRows(parsed.rows, { manualMap, codes });
  const grid = toGrid(byCode, codes);
  return { parsed, grid, byCode, unmatched, missingCodes: codes.filter((c) => !byCode.has(c)) };
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

// Builds the report with a template explanation. Throws ResultsInputError for files that can't be used.
export function computeReport(input: ReportInput): ResultsReport {
  const { run } = input;
  const sample = !!input.sample || (!input.csvText?.trim() && !input.grid?.length);
  const set = sampleSetOf(run);
  const files = sample ? (set ?? sampleSet("candles")).files : null;
  const csvText = files ? files.results : input.csvText;
  const breakdownCsv = files ? files.breakdown : input.breakdownCsv;
  const codes = codesOf(run);
  const notes: string[] = [];

  let read: ExportRead | null = null;
  if (csvText?.trim()) {
    read = readExport(csvText, run, input.manualMap);
    if (!read.parsed.ok && !input.grid?.length) throw new ResultsInputError(read.parsed.message ?? "We couldn't read this file.");
  }
  let breakdownBy = read?.parsed.hasBreakdown ? read.byCode : undefined;
  if (!breakdownBy && breakdownCsv?.trim()) {
    const b = readExport(breakdownCsv, run, input.manualMap);
    if (b.parsed.ok && b.parsed.hasBreakdown) breakdownBy = b.byCode;
  }

  const grid = input.grid?.length ? input.grid.map((g) => ({ ...g, code: normalizeCode(g.code) })) : (read?.grid ?? []);
  const withData = grid.filter((g) => g.spend != null && (g.results != null || g.linkClicks != null || g.impressions != null));
  if (!withData.length) {
    throw new ResultsInputError(
      read?.unmatched.length
        ? "None of the rows have a code from A1 to A8. Match them below, or type your numbers into the grid."
        : "Add spend and results for each post first.",
      read?.unmatched ?? [],
    );
  }
  if (!gridReady(grid.filter((g) => codes.includes(g.code)))) notes.push("Some posts have no numbers yet, so they are left out of the ranking.");

  const resultTypeOf = (code: string) => read?.byCode.get(code)?.resultTypes[0] ?? null;
  const computed = pickWinner(withData.map((g) => ({ ...g, resultType: resultTypeOf(g.code) })));
  const valueOf = new Map(computed.ranking.map((r, i) => [r.code, { value: r.value, rank: i + 1 }]));

  const metrics: VersionMetrics[] = run.versions.map((v) => {
    const code = normalizeCode(v.code);
    const g = grid.find((x) => x.code === code);
    const m = read?.byCode.get(code);
    const b = breakdownBy?.get(code)?.breakdown ?? [];
    const spend = g?.spend ?? 0;
    const results = g?.results ?? null;
    const linkClicks = g?.linkClicks ?? null;
    const impressions = g?.impressions ?? 0;
    const ranked = valueOf.get(code);
    return {
      versionId: v.id,
      code,
      audienceName: v.audienceName,
      matchedBy: !ranked ? "none" : m ? "code" : "grid",
      spend,
      impressions,
      reach: m?.reach ?? 0,
      clicks: linkClicks ?? 0,
      saves: 0,
      shares: 0,
      comments: 0,
      reactions: 0,
      engagements: linkClicks ?? 0,
      engagementsPer100: spend > 0 ? Math.round(((linkClicks ?? 0) / spend) * 1000) / 10 : 0,
      savesSharesPer1k: 0,
      breakdown: b,
      rank: ranked?.rank ?? 99,
      results,
      resultType: resultTypeOf(code),
      linkClicks,
      costPerResult: results && results > 0 ? Math.round((spend / results) * 100) / 100 : null,
      adName: m?.adNames[0] ?? "",
      value: ranked?.value ?? null,
    };
  });
  metrics.sort((a, b) => a.rank - b.rank || a.code.localeCompare(b.code, "en", { numeric: true }));
  let n = 0;
  for (const m of metrics) m.rank = ++n;

  const names = Object.fromEntries(run.versions.map((v) => [normalizeCode(v.code), v.audienceName]));
  const { scored: _scored, totalSpend, ...rest } = computed;
  void _scored;
  const verdict: Verdict = { ...rest, explanation: templateExplanation(rest, metrics, names) };

  const winner = metrics.find((m) => m.code === verdict.winnerCode)!;
  const runnerUp = metrics.find((m) => m.code === verdict.runnerUpCode);
  const wv = run.versions.find((v) => v.id === winner.versionId);
  const audience = run.chosen.find((a) => a.id === wv?.audienceId);
  const days = read?.parsed.days ?? input.days ?? 3;
  const resultType = metrics.find((m) => m.resultType)?.resultType ?? undefined;

  const report: ResultsReport = {
    runId: run.id,
    mode: input.mode ?? run.mode,
    days,
    totalSpend,
    metrics,
    winnerId: winner.versionId,
    runnerUpId: runnerUp?.versionId,
    icp: buildIcp({ verdict, winner, runnerUp, audience, version: wv, productName: run.product.name, days }),
    unmatchedRows: (read?.unmatched ?? []).map((u) => u.adName),
    notes: notes.length ? notes : undefined,
    verdict,
    resultType,
    source: sample ? "sample" : input.grid?.length && !read ? "grid" : "csv",
    isSample: sample,
    hasBreakdown: !!breakdownBy,
    unmatched: read?.unmatched ?? [],
    missingCodes: codes.filter((c) => !valueOf.has(c)),
  };
  if (sample) report.notes = ["Sample data. No real ads were run.", ...(report.notes ?? [])];
  return sample && set ? withSavedText(report, run, set) : report;
}

// On a sample seller's run, the hand-written parts of the saved report replace the templates when the numbers agree.
function withSavedText(report: ResultsReport, run: TestRun, set: SampleSet): ResultsReport {
  const saved = makeSwapper(run.product, set).apply(set.savedReport());
  const sv = saved.verdict;
  const same =
    sv.winnerCode === report.verdict.winnerCode &&
    sv.runnerUpCode === report.verdict.runnerUpCode &&
    sv.metric === report.verdict.metric &&
    sv.confidence === report.verdict.confidence &&
    report.metrics.every((m) => {
      const s = saved.metrics.find((x) => x.code === m.code);
      return s && s.spend === m.spend && s.impressions === m.impressions && s.results === m.results && s.linkClicks === m.linkClicks;
    });
  if (!same) return report;
  const metrics = report.metrics.map((m) => {
    const s = saved.metrics.find((x) => x.code === m.code)!;
    const breakdown = m.breakdown.map((c) => ({ ...c, engagements: s.breakdown.find((x) => x.age === c.age && x.gender === c.gender)?.engagements ?? 0 }));
    return {
      ...m,
      reach: s.reach,
      saves: s.saves,
      shares: s.shares,
      comments: s.comments,
      reactions: s.reactions,
      engagements: s.engagements,
      engagementsPer100: s.engagementsPer100,
      savesSharesPer1k: s.savesSharesPer1k,
      breakdown,
      regions: s.regions,
    };
  });
  return {
    ...report,
    metrics,
    verdict: { ...report.verdict, explanation: sv.explanation },
    icp: { ...saved.icp, hasBreakdown: report.hasBreakdown },
    notes: [...(report.notes ?? []), ...(saved.notes ?? []).filter((x) => !/^Using sample results/i.test(x)), ...(run.notes ?? [])].filter(
      (x, i, a) => a.indexOf(x) === i,
    ),
  };
}

// The sample seller's report, computed from the sample CSVs. No network.
export function sampleReport(run: TestRun): ResultsReport {
  return computeReport({ run, sample: true, mode: "sample" });
}

export const totalOf = (grid: GridRow[]) => sum(grid.map((g) => g.spend ?? 0));
