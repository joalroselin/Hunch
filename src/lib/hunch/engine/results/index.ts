// Client-safe results engine: parse, match, pick the winner, build the report. No model calls here.
export * from "./constants";
export { parseCsv, parseNumber, mapHeaders, reportingDays, resultLabel, type ParsedExport } from "./parse-csv";
export { matchRows, toGrid, emptyGrid, gridReady, codeIn, normalizeCode, type MatchedCode, type MatchOutput } from "./match-rows";
export { pickWinner, chooseMetric, marginOf, formatMetric, peso, METRIC_LABEL, type WinnerInput, type ComputedVerdict } from "./pick-winner";
export { templateExplanation, buildIcp, reachedMostly, icpConfidence } from "./explain";
export { computeReport, readExport, sampleReport, ResultsInputError, type ReportInput, type ExportRead } from "./report";
