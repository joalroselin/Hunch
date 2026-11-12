import type { BreakdownCell, GridRow, ResultsRow, UnmatchedRow } from "../../types";
import { CODES } from "./constants";

// A1..A8 per the spec; H1..H8 from older exports map to the same slot.
const CODE_RE = /\b[AH]([1-8])\b/i;

export function codeIn(name: string): string | undefined {
  const m = name.match(CODE_RE);
  return m ? `A${m[1]}` : undefined;
}

// "H3" -> "A3"; anything else unchanged.
export function normalizeCode(code: string) {
  const m = code.trim().match(/^[AH]([1-8])$/i);
  return m ? `A${m[1]}` : code.trim().toUpperCase();
}

export interface MatchedCode {
  code: string;
  adNames: string[];
  spend: number;
  impressions: number | null;
  reach: number | null;
  results: number | null;
  linkClicks: number | null;
  resultTypes: string[];
  breakdown: BreakdownCell[];
  rows: number;
}

export interface MatchOutput {
  byCode: Map<string, MatchedCode>;
  unmatched: UnmatchedRow[];
}

// Present values add up; a field missing on every row stays null.
const add = (a: number | null, b: number | undefined) => (b === undefined ? a : (a ?? 0) + b);

export function matchRows(rows: ResultsRow[], opts: { manualMap?: Record<string, string>; codes?: readonly string[] } = {}): MatchOutput {
  const allowed = new Set((opts.codes ?? CODES).map(normalizeCode));
  const byCode = new Map<string, MatchedCode>();
  const unmatched = new Map<string, UnmatchedRow>();

  for (const r of rows) {
    const manual = opts.manualMap?.[r.rawName];
    const code = codeIn(r.rawName) ?? (manual ? normalizeCode(manual) : undefined);
    if (!code || !allowed.has(code)) {
      const u = unmatched.get(r.rawName) ?? { adName: r.rawName, spend: 0, results: null, linkClicks: null, impressions: null };
      u.spend = Math.round((u.spend + r.spendPhp) * 100) / 100;
      u.results = add(u.results, r.results);
      u.linkClicks = add(u.linkClicks, r.linkClicks);
      u.impressions = add(u.impressions, r.impressions);
      unmatched.set(r.rawName, u);
      continue;
    }
    r.audienceCode = code;
    const m =
      byCode.get(code) ??
      ({ code, adNames: [], spend: 0, impressions: null, reach: null, results: null, linkClicks: null, resultTypes: [], breakdown: [], rows: 0 } as MatchedCode);
    if (!m.adNames.includes(r.rawName)) m.adNames.push(r.rawName);
    m.rows++;
    m.spend = Math.round((m.spend + r.spendPhp) * 100) / 100;
    m.impressions = add(m.impressions, r.impressions);
    m.reach = add(m.reach, r.reach);
    m.results = add(m.results, r.results);
    m.linkClicks = add(m.linkClicks, r.linkClicks);
    if (r.resultType && !m.resultTypes.includes(r.resultType)) m.resultTypes.push(r.resultType);
    if (r.age || r.gender) {
      const age = r.age || "unknown";
      const gender = r.gender || "unknown";
      let c = m.breakdown.find((x) => x.age === age && x.gender === gender);
      if (!c) {
        c = { age, gender, impressions: 0, engagements: 0, results: 0, linkClicks: 0, spend: 0 };
        m.breakdown.push(c);
      }
      c.impressions += r.impressions ?? 0;
      c.results = (c.results ?? 0) + (r.results ?? 0);
      c.linkClicks = (c.linkClicks ?? 0) + (r.linkClicks ?? 0);
      c.spend = Math.round(((c.spend ?? 0) + r.spendPhp) * 100) / 100;
    }
    byCode.set(code, m);
  }
  for (const m of byCode.values()) m.breakdown.sort((a, b) => a.age.localeCompare(b.age) || a.gender.localeCompare(b.gender));
  return { byCode, unmatched: [...unmatched.values()] };
}

export function emptyGrid(codes: readonly string[] = CODES): GridRow[] {
  return codes.map((code) => ({ code: normalizeCode(code), spend: null, results: null, linkClicks: null, impressions: null }));
}

// Fills the 8-row grid from matched rows; codes with no rows stay empty for typing.
export function toGrid(byCode: Map<string, MatchedCode>, codes: readonly string[] = CODES): GridRow[] {
  return emptyGrid(codes).map((g) => {
    const m = byCode.get(g.code);
    return m ? { code: g.code, spend: m.spend, results: m.results, linkClicks: m.linkClicks, impressions: m.impressions } : g;
  });
}

// Continue is enabled when every row has spend and either results or link clicks.
export function gridReady(grid: GridRow[]) {
  return grid.length > 0 && grid.every((r) => r.spend != null && (r.results != null || r.linkClicks != null));
}
