import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { computeReport, EMPTY_EXPORT, matchRows, NO_BREAKDOWN, parseCsv, parseNumber, pickWinner, readExport, ResultsInputError, sampleReport, UNREADABLE_EXPORT } from "../engine/results";
import { ELLE_BREAKDOWN_CSV, ELLE_RESULTS_CSV } from "../engine/sample/elle";
import { MATCHA_BREAKDOWN_CSV, MATCHA_RESULTS_CSV } from "../engine/sample/matcha-csv";
import { sampleFocus } from "../engine/sample/focus";
import { sampleRunFor } from "../engine/sample/run";
import type { GridRow } from "../types";

// The real header row from a PHP ad account's Ads-level export (Nov 2026).
const HEADER =
  '"Reporting starts","Reporting ends","Ad name","Ad delivery","Attribution setting",Results,"Result indicator","Cost per results","Ad set budget","Ad set budget type","Amount spent (PHP)",Impressions,Reach,Ends,Bid,"Bid type","Last significant edit","Quality ranking","Engagement rate ranking","Conversion rate ranking","Ad set name","Result rate","Results value","Result ROAS indicator","Results ROAS","Link clicks","Results (initial)","Results (initial) indicator"';
const IND = "actions:onsite_conversion.messaging_conversation_started_7d";

// One export row on the real headers. Results value and Results (initial) carry decoys that must not be read as Results.
function row(name: string, spend: string, results: string, clicks: string, impressions = "3000", opts: { starts?: string; ends?: string } = {}) {
  return [
    opts.starts ?? "2026-11-09", opts.ends ?? "2026-11-11", name, "not_delivering", "7-day click or 1-day view", results, IND, "", "100", "Lifetime",
    spend, impressions, "2500", "2026-11-11", "Highest volume", "ABSOLUTE_OCPM", "", "Average", "Average", "Average", `Set ${name}`, "0.2",
    "999", "", "777", clicks, "555", IND,
  ]
    .map((c) => (/[",]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c))
    .join(",");
}
const csv = (...rows: string[]) => [HEADER, ...rows].join("\n");
const g = (code: string, spend: number | null, results: number | null, linkClicks: number | null = null, impressions: number | null = null): GridRow => ({ code, spend, results, linkClicks, impressions });

describe("parseCsv", () => {
  it("reads the (PHP) headers exactly and never prefix-matches Results", () => {
    const p = parseCsv(csv(row("A1 Cubao Expo haul", "₱1,234.50", "6", "22")));
    expect(p.ok).toBe(true);
    expect(p.rows).toHaveLength(1);
    expect(p.rows[0]).toMatchObject({ rawName: "A1 Cubao Expo haul", spendPhp: 1234.5, results: 6, linkClicks: 22, impressions: 3000, reach: 2500 });
    expect(p.rows[0].resultType).toBe("Messaging conversations started");
    expect(p.days).toBe(3);
  });

  it("treats an em dash, a hyphen and empty cells as missing", () => {
    expect(parseNumber("\u2014")).toBeUndefined();
    expect(parseNumber("-")).toBeUndefined();
    expect(parseNumber("")).toBeUndefined();
    expect(parseNumber(" 1,200 ")).toBe(1200);
    const p = parseCsv(csv(row("A1 x", "100", "\u2014", "-")));
    expect(p.rows[0].results).toBeUndefined();
    expect(p.rows[0].linkClicks).toBeUndefined();
  });

  it("treats 'No data available.' as zero rows with the plain message", () => {
    const p = parseCsv(`${HEADER}\n"No data available."`);
    expect(p).toMatchObject({ ok: false, rows: [], message: EMPTY_EXPORT });
    expect(EMPTY_EXPORT).toBe("This export has no ad results yet.");
    expect(() => computeReport({ run: sampleRunFor(), csvText: `${HEADER}\nNo data available.` })).toThrow(EMPTY_EXPORT);
  });

  it("skips blank and total rows", () => {
    const totals = ['"2026-11-09","2026-11-11","","","",30,"","","","","800.00",25000,20000'].join("");
    const p = parseCsv(csv(row("A1 x", "100", "5", "20"), ",,,,,,,", totals, row("Total", "800", "30", "100")));
    expect(p.rows.map((r) => r.rawName)).toEqual(["A1 x"]);
  });

  it("says it can't read a file with no spend column", () => {
    expect(parseCsv("Ad name,Impressions\nA1 x,100")).toMatchObject({ ok: false, message: UNREADABLE_EXPORT });
  });

  it("counts reporting days inclusively", () => {
    const p = parseCsv(csv(row("A1 x", "100", "5", "20", "3000", { starts: "2026-11-09", ends: "2026-11-09" })));
    expect(p.days).toBe(1);
  });
});

describe("matchRows", () => {
  it("sums duplicate rows for one code", () => {
    const { byCode } = matchRows(parseCsv(csv(row("A2 Salcedo morning", "60", "3", "10"), row("A2 salcedo afternoon", "40.50", "2", "6"))).rows);
    expect(byCode.get("A2")).toMatchObject({ spend: 100.5, results: 5, linkClicks: 16, impressions: 6000, rows: 2 });
  });

  it("lists unmatched rows with their numbers", () => {
    const { byCode, unmatched } = matchRows(parseCsv(csv(row("A1 x", "100", "5", "20"), row("Boosted post from Tuesday", "50", "2", "9"))).rows);
    expect(byCode.size).toBe(1);
    expect(unmatched).toEqual([{ adName: "Boosted post from Tuesday", spend: 50, results: 2, linkClicks: 9, impressions: 3000 }]);
  });

  it("matches old H1..H8 exports and manual picks", () => {
    const rows = parseCsv(csv(row("H3 old export", "100", "5", "20"), row("My ad", "100", "1", "4"))).rows;
    const { byCode, unmatched } = matchRows(rows, { manualMap: { "My ad": "A5" } });
    expect([...byCode.keys()].sort()).toEqual(["A3", "A5"]);
    expect(unmatched).toHaveLength(0);
  });

  it("does not match codes outside A1..A8", () => {
    const { unmatched } = matchRows(parseCsv(csv(row("A9 extra", "100", "5", "20"), row("AA1 x", "100", "5", "20"))).rows);
    expect(unmatched).toHaveLength(2);
  });
});

describe("pickWinner", () => {
  it("calls a clear winner high", () => {
    const v = pickWinner([g("A1", 100, 10), g("A2", 100, 6), g("A3", 100, 20), g("A4", 100, 4), g("A5", 100, 3), g("A6", 100, 2), g("A7", 100, 1), g("A8", 100, 5)]);
    expect(v.metric).toBe("cost_per_result");
    expect(v.winnerCode).toBe("A3");
    expect(v.runnerUpCode).toBe("A1");
    expect(v.confidence).toBe("high");
    expect(v.ranking[0]).toEqual({ code: "A3", value: 5 });
    expect(v.caveats).toEqual([]);
  });

  it("calls a close race low and adds the caveat", () => {
    const v = pickWinner([g("A1", 100, 20), g("A2", 100, 19), g("A3", 100, 8), g("A4", 100, 5)]);
    expect(v.winnerCode).toBe("A1");
    expect(v.confidence).toBe("low");
    expect(v.caveats.some((c) => c.includes("within 10%"))).toBe(true);
  });

  it("needs volume for high: a big margin on few results is medium or low", () => {
    expect(pickWinner([g("A1", 100, 6), g("A2", 100, 2)]).confidence).toBe("medium");
    expect(pickWinner([g("A1", 100, 4), g("A2", 100, 1)]).confidence).toBe("low");
  });

  it("falls back to cost per link click when results are missing", () => {
    const v = pickWinner([g("A1", 100, null, 50), g("A2", 100, 3, 25), g("A3", 100, null, 80), g("A4", 100, 2, 20)]);
    expect(v.metric).toBe("cost_per_link_click");
    expect(v.winnerCode).toBe("A3");
    expect(v.runnerUpCode).toBe("A1");
    expect(v.confidence).toBe("high"); // 37.5% better, 80 clicks
  });

  it("falls back to cost per link click when result types differ", () => {
    const v = pickWinner([{ ...g("A1", 100, 5, 30), resultType: "Messaging conversations started" }, { ...g("A2", 100, 9, 20), resultType: "Link clicks" }]);
    expect(v.metric).toBe("cost_per_link_click");
  });

  it("falls back to CTR when link clicks are missing too", () => {
    const v = pickWinner([g("A1", 100, null, 30, 1000), g("A2", 100, null, null, 1000), g("A3", 100, null, 10, 1000)]);
    expect(v.metric).toBe("ctr");
    expect(v.winnerCode).toBe("A1");
    expect(v.ranking.at(-1)).toEqual({ code: "A2", value: null });
  });

  it("adds the low spend and uneven spend caveats", () => {
    const v = pickWinner([g("A1", 30, 10), g("A2", 50, 5), g("A3", 50, 2)]);
    expect(v.caveatChecks?.find((c) => c.rule.startsWith("Total spend"))?.fired).toBe(true);
    expect(v.caveatChecks?.find((c) => c.rule.startsWith("Spend differs"))?.fired).toBe(true);
    expect(v.caveats).toHaveLength(2);
    expect(v.caveats.join(" ")).not.toMatch(/₱\d+\.\d/);
  });
});

describe("Elle's sample export", () => {
  it("gives A3 high at ₱7.07 against A6 at ₱9.90", () => {
    const run = sampleRunFor();
    const r = computeReport({ run, csvText: ELLE_RESULTS_CSV, mode: "sample" });
    expect(r.verdict.metric).toBe("cost_per_result");
    expect(r.verdict.winnerCode).toBe("A3");
    expect(r.verdict.runnerUpCode).toBe("A6");
    expect(r.verdict.confidence).toBe("high");
    expect(r.verdict.ranking.slice(0, 2)).toEqual([{ code: "A3", value: 7.07 }, { code: "A6", value: 9.9 }]);
    expect(r.verdict.ranking.map((x) => x.code)).toEqual(["A3", "A6", "A5", "A4", "A2", "A7", "A1", "A8"]);
    expect(r.verdict.caveats).toEqual([]);
    expect(r.days).toBe(3);
    expect(r.totalSpend).toBe(792);
    expect(r.metrics[0]).toMatchObject({ code: "A3", rank: 1, results: 14, linkClicks: 31, costPerResult: 7.07, adName: "A3 Sala before guests" });
    expect(r.icp.reachedMostly).toBe(NO_BREAKDOWN);
    expect(NO_BREAKDOWN).toBe("No breakdown in this export");
  });

  it("breakdown rows sum to the plain export, code by code", () => {
    const run = sampleRunFor();
    const plain = readExport(ELLE_RESULTS_CSV, run);
    const split = readExport(ELLE_BREAKDOWN_CSV, run);
    expect(split.parsed.hasBreakdown).toBe(true);
    expect(split.parsed.rows).toHaveLength(144);
    for (const code of ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8"]) {
      const a = plain.byCode.get(code)!;
      const b = split.byCode.get(code)!;
      expect([b.spend, b.impressions, b.results, b.linkClicks, b.reach]).toEqual([a.spend, a.impressions, a.results, a.linkClicks, a.reach]);
      expect(b.breakdown.reduce((s, c) => s + c.impressions, 0)).toBe(a.impressions);
    }
    expect(computeReport({ run, csvText: ELLE_BREAKDOWN_CSV }).verdict.winnerCode).toBe("A3");
  });

  it("sample report keeps Elle's explanation and builds the card from the breakdown", () => {
    const r = sampleReport(sampleRunFor());
    expect(r.isSample).toBe(true);
    expect(r.hasBreakdown).toBe(true);
    expect(r.verdict.explanation).toMatch(/^Hosts getting the sala ready won: A3/);
    expect(r.icp.headline).toBe("Your people: hosts getting the sala ready.");
    expect(r.icp.confidence).toBe("strong");
    expect(r.icp.reachedMostly).not.toBe(NO_BREAKDOWN);
    expect(r.notes?.[0]).toBe("Sample data. No real ads were run.");
    expect(r.metrics.find((m) => m.code === "A3")?.engagementsPer100).toBe(135.4);
  });

  it("a typed grid is a first-class input", () => {
    const run = sampleRunFor();
    const grid = readExport(ELLE_RESULTS_CSV, run).grid.map((x) => (x.code === "A6" ? { ...x, results: 40 } : x));
    const r = computeReport({ run, grid, mode: "live" });
    expect(r.source).toBe("grid");
    expect(r.verdict.winnerCode).toBe("A6");
    expect(r.days).toBe(3);
    expect(r.verdict.explanation).toMatch(/A6/);
  });

  it("rejects a grid with no numbers", () => {
    expect(() => computeReport({ run: sampleRunFor(), grid: [g("A1", null, null)] })).toThrow(ResultsInputError);
  });

  it("embedded files match parallel/elle", () => {
    const dir = process.env.ELLE_DIR ?? join(__dirname, "../../../../../elle");
    if (!existsSync(dir)) return;
    expect(ELLE_RESULTS_CSV).toBe(readFileSync(join(dir, "sample-results.csv"), "utf8"));
    expect(ELLE_BREAKDOWN_CSV).toBe(readFileSync(join(dir, "sample-results-breakdown.csv"), "utf8"));
    expect(readFileSync(join(__dirname, "../../../components/hunch/screens/demo-snapshot.json"), "utf8")).toBe(readFileSync(join(dir, "elle-snapshot.json"), "utf8"));
    if (!existsSync(join(dir, "matcha"))) return;
    expect(MATCHA_RESULTS_CSV).toBe(readFileSync(join(dir, "matcha", "sample-results.csv"), "utf8"));
    expect(readFileSync(join(__dirname, "../../../components/hunch/screens/matcha-snapshot.json"), "utf8")).toBe(readFileSync(join(dir, "matcha", "matcha-snapshot.json"), "utf8"));
  });
});

describe("Kaye's matcha sample", () => {
  const matcha = () => sampleRunFor({ name: "Matcha latte powder", price: "₱480 a tin", description: "Matcha latte powder in tins" });

  it("plays when the product mentions matcha, with only the name swapped", () => {
    const run = matcha();
    expect(run.id).toBe("run_matcha_sample_name");
    expect(run.sample).toEqual({ of: "Kaye's Matcha", swapped: ["name"] });
    expect(run.notes?.[0]).toMatch(/still describe Kaye's matcha tins/);
    expect(JSON.stringify(run.versions)).not.toContain("Kaye's Matcha");
    expect(sampleRunFor({ description: "ceremonial matcha" }).id).toBe("run_matcha_sample");
    expect(sampleRunFor({ name: "Calamansi soap" }).sample?.of).toBe("Elle's Candles");
  });

  it("breakdown rows sum to the plain export, code by code", () => {
    const run = matcha();
    const plain = readExport(MATCHA_RESULTS_CSV, run);
    const split = readExport(MATCHA_BREAKDOWN_CSV, run);
    expect(split.parsed.rows).toHaveLength(144);
    for (const code of ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8"]) {
      const a = plain.byCode.get(code)!;
      const b = split.byCode.get(code)!;
      expect([b.spend, b.impressions, b.results, b.linkClicks, b.reach]).toEqual([a.spend, a.impressions, a.results, a.linkClicks, a.reach]);
    }
  });

  it("gives A6 high against A4 and keeps Kaye's text and plan", () => {
    const run = matcha();
    const r = sampleReport(run);
    expect(r.verdict.winnerCode).toBe("A6");
    expect(r.verdict.runnerUpCode).toBe("A4");
    expect(r.verdict.confidence).toBe("high");
    expect(r.verdict.ranking.slice(0, 2)).toEqual([{ code: "A6", value: 6.6 }, { code: "A4", value: 9 }]);
    expect(r.verdict.explanation).toMatch(/^Last-minute monthsary gifts won: A6/);
    expect(r.hasBreakdown).toBe(true);
    expect(r.icp.reachedMostly).not.toBe(NO_BREAKDOWN);
    expect(r.notes).toContain("Kaye is a persona made for this demo.");
    const plan = sampleFocus(run, r);
    expect(plan.audience.name).toBe("Last-minute monthsary gifts");
    expect(plan.posts).toHaveLength(7);
    expect(JSON.stringify(plan)).not.toMatch(/Elle/);
  });
});
