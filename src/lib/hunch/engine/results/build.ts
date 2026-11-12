import type { ResultsReport } from "../../types";
import { runAnalyst } from "../agents/analyst";
import type { ModelClient } from "../agents/model";
import { liveModel } from "../test-run";
import { computeReport, type ReportInput } from "./report";

// Server side: the computed report, then the Analyst explains it in live mode. It can never change the verdict.
export async function buildReport(input: ReportInput & { model?: ModelClient }): Promise<ResultsReport> {
  const report = computeReport(input);
  if (report.mode !== "live" || report.isSample) return report;
  const names = Object.fromEntries(report.metrics.map((m) => [m.code, m.audienceName]));
  const { explanation: _template, ...verdict } = report.verdict;
  void _template;
  const res = await runAnalyst(input.model ?? liveModel(), { product: input.run.product, verdict, metrics: report.metrics, names });
  if (!res.ok) return { ...report, notes: [...(report.notes ?? []), "The Analyst could not write the summary, so Hunch wrote a plain one."] };
  const caveats = [...report.verdict.caveats, ...res.value.caveats.filter((c) => !report.verdict.caveats.includes(c))].slice(0, 3);
  return { ...report, verdict: { ...report.verdict, explanation: res.value.explanation, caveats } };
}
