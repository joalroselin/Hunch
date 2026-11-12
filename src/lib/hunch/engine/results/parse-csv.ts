import type { ResultsRow } from "../../types";
import { readTable } from "../csv";
import { EMPTY_EXPORT, UNREADABLE_EXPORT } from "./constants";

type Field = "rawName" | "spend" | "impressions" | "reach" | "results" | "resultType" | "linkClicks" | "starts" | "ends" | "age" | "gender";

// Exact Meta headers first, then the spec's fallbacks. Matching is exact after trim + lowercase.
const EXACT: Record<Field, string[]> = {
  rawName: ["Ad name", "Ad set name", "Campaign name"],
  spend: ["Amount spent (PHP)"],
  impressions: ["Impressions"],
  reach: ["Reach"],
  results: ["Results"], // never by prefix: Results value, Results ROAS, Results (initial) are other columns
  resultType: ["Result indicator"],
  linkClicks: ["Link clicks", "Clicks (all)"],
  starts: ["Reporting starts"],
  ends: ["Reporting ends"],
  age: ["Age"],
  gender: ["Gender"],
};

const key = (h: string) => h.replace(/^\uFEFF/, "").trim().toLowerCase();

export function mapHeaders(header: string[]): Partial<Record<Field, number>> {
  const norm = header.map(key);
  const idx: Partial<Record<Field, number>> = {};
  for (const f of Object.keys(EXACT) as Field[]) {
    for (const name of EXACT[f]) {
      const i = norm.indexOf(key(name));
      if (i >= 0) {
        idx[f] = i;
        break;
      }
    }
  }
  // Spend fallback: any header starting "Amount spent".
  if (idx.spend === undefined) {
    const i = norm.findIndex((h) => h.startsWith("amount spent"));
    if (i >= 0) idx.spend = i;
  }
  return idx;
}

const MISSING = new Set(["", "-", "\u2014", "\u2013", "n/a", "na", "--"]);

// Strips ₱, PHP, commas, spaces and thousands separators. A dash or an empty cell is missing.
export function parseNumber(raw: string | undefined): number | undefined {
  if (raw == null) return undefined;
  const s = raw.trim();
  if (MISSING.has(s.toLowerCase())) return undefined;
  const cleaned = s.replace(/₱|php|\s|,|\u00a0/gi, "").replace(/%$/, "");
  if (!cleaned || !/^-?\d*\.?\d+$/.test(cleaned)) return undefined;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

const INDICATORS: [RegExp, string][] = [
  [/messaging_conversation_started/i, "Messaging conversations started"],
  [/landing_page_view/i, "Landing page views"],
  [/link_click/i, "Link clicks"],
  [/post_engagement/i, "Post engagements"],
  [/thruplay|video_view/i, "ThruPlays"],
  [/purchase/i, "Purchases"],
  [/\blead\b|leadgen|\.lead/i, "Leads"],
  [/page_like|\blike\b/i, "Page likes"],
  [/^reach$|:reach$/i, "Reach"],
];

// "actions:onsite_conversion.messaging_conversation_started_7d" -> "Messaging conversations started".
export function resultLabel(indicator: string | undefined): string | undefined {
  const s = indicator?.trim();
  if (!s) return undefined;
  const hit = INDICATORS.find(([re]) => re.test(s));
  if (hit) return hit[1];
  const tail = s.split(/[:.]/).pop() ?? s;
  const words = tail.replace(/_\d+d$/, "").replace(/_/g, " ").trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : s;
}

const SKIP_NAME = /^(total|totals|summary|grand total)\b|^results from \d+/i;
const NO_DATA = /^no data available\.?$/i;

function isoDay(s: string | undefined) {
  const m = s?.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3]);
  const t = s ? Date.parse(s) : NaN;
  return Number.isFinite(t) ? t : undefined;
}

// Reporting days, inclusive: Nov 9 to Nov 11 is 3 days.
export function reportingDays(rows: Pick<ResultsRow, "starts" | "ends">[]): number | undefined {
  const starts = rows.map((r) => isoDay(r.starts)).filter((x): x is number => x !== undefined);
  const ends = rows.map((r) => isoDay(r.ends)).filter((x): x is number => x !== undefined);
  if (!starts.length || !ends.length) return undefined;
  return Math.max(1, Math.round((Math.max(...ends) - Math.min(...starts)) / 86_400_000) + 1);
}

export interface ParsedExport {
  ok: boolean; // false when the file can't fill the grid; see message
  rows: ResultsRow[];
  message?: string; // EMPTY_EXPORT or UNREADABLE_EXPORT
  hasBreakdown: boolean; // has an Age or Gender column
  days?: number;
}

export function parseCsv(text: string): ParsedExport {
  const table = readTable(text ?? "");
  if (!table.length) return { ok: false, rows: [], message: UNREADABLE_EXPORT, hasBreakdown: false };
  const idx = mapHeaders(table[0]);
  if (idx.spend === undefined) return { ok: false, rows: [], message: UNREADABLE_EXPORT, hasBreakdown: false };
  const hasBreakdown = idx.age !== undefined || idx.gender !== undefined;
  const get = (r: string[], f: Field) => (idx[f] === undefined ? undefined : r[idx[f]!]?.trim());

  const rows: ResultsRow[] = [];
  for (const r of table.slice(1)) {
    const filled = r.map((c) => c.trim()).filter(Boolean);
    if (!filled.length) continue;
    if (filled.length === 1 && NO_DATA.test(filled[0])) continue;
    const rawName = get(r, "rawName") ?? "";
    if (!rawName || SKIP_NAME.test(rawName) || NO_DATA.test(rawName)) continue;
    const spend = parseNumber(get(r, "spend"));
    rows.push({
      rawName,
      spendPhp: spend ?? 0,
      impressions: parseNumber(get(r, "impressions")),
      reach: parseNumber(get(r, "reach")),
      results: parseNumber(get(r, "results")),
      resultType: resultLabel(get(r, "resultType")),
      linkClicks: parseNumber(get(r, "linkClicks")),
      age: get(r, "age") || undefined,
      gender: get(r, "gender") ? genderOf(get(r, "gender")!) : undefined,
      starts: get(r, "starts") || undefined,
      ends: get(r, "ends") || undefined,
    });
  }
  if (!rows.length) return { ok: false, rows, message: EMPTY_EXPORT, hasBreakdown };
  return { ok: true, rows, hasBreakdown, days: reportingDays(rows) };
}

export function genderOf(g: string) {
  if (/^(f|female|women|woman|babae)$/i.test(g.trim())) return "female";
  if (/^(m|male|men|man|lalaki)$/i.test(g.trim())) return "male";
  return "unknown";
}
