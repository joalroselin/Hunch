// Shared contract for Hunch. UI, engine and post templates all code against these types.
// Additive: every field older screens read is still here; new fields follow the partner build spec.

export type Mode = "live" | "sample";

// The language is called Tagalog everywhere. Old saved data may still say "filipino"; read it with normalizeLanguage().
export type Language = "taglish" | "english" | "tagalog";
export type PostStyle = "bold" | "soft" | "note";

// Where the seller sells. Only these channels may appear in audiences and CTAs.
export type Channel = "shopee" | "facebook" | "instagram" | "tiktok" | "offline";

// Why someone buys. The Strategist covers at least 4 of these across 20 candidates.
export type Motive = "self_use" | "gifting" | "sharing" | "resale_bulk" | "occasion";

export interface ProductInput {
  name: string;
  description: string;
  price?: string;
  whereSold?: string;
  goal?: string;
  // Default language for the posts. Base post fields are written in this language.
  language: Language;
  // Parsed from whereSold when missing (see channelsOf in language.ts).
  channels?: Channel[];
  // Downscaled JPEG data URL (<= ~300 KB). Optional; used for vision context only.
  photo?: string;
}

// Spec mapping: name = label, situation = buyingMoment, whyItFits = angle.
export interface Audience {
  id: string; // "c01".."c20"
  name: string; // max 6 words, e.g. "Coworkers buying exchange gifts"
  who: string; // one plain sentence, a concrete situation, never sensitive traits
  situation: string; // the buying moment
  whyItFits: string; // the angle to test
  whereTheyAre: string[];
  tone: string;
  motive?: Motive;
  bestChannel?: Channel;
  code?: string; // "A1".."A8" once kept
  keptReason?: string; // Skeptic's reason, once kept
}

export type CheckKind = "policy" | "stereotype" | "duplicate";

// Reviewer issue categories from the guardrails table.
export type IssueType = "cringe" | "stereotype" | "ad_policy" | "language" | "claim";

export interface ReviewIssue {
  type: IssueType;
  quote: string; // exact text from the post
  note: string; // one-line fix note
  language?: Language; // which version the quote is in, when known
}

export interface CheckResult {
  kind: CheckKind;
  passed: boolean;
  note: string; // plain-English reason, shown in the UI
  rule?: string; // e.g. "Meta personal attributes"; unique within one send-back
  type?: IssueType; // set on Reviewer issues
  quote?: string; // exact quote, set on Reviewer issues
}

// One language version of a post.
export interface PostCopy {
  hook: string; // first line, max 90 chars
  slides: string[]; // 1-3 lines for the image; slides[0] = hook
  caption: string; // hook + caption max 600 chars
  cta: string; // "Message us", "Order on Shopee" or "Comment 'order'" (Tagalog equivalents in tagalog)
}

export type PostStatus = "drafting" | "in_review" | "approved" | "needs_attention";

export interface Revision {
  round: 1 | 2;
  issues: ReviewIssue[];
  before: Partial<Record<Language, string>>; // caption before
  after: Partial<Record<Language, string>>; // caption after
}

export interface Version {
  id: string;
  code: string; // "A1".."A8"; shown on cards and used to match results (old exports may say H1..H8)
  audienceId: string;
  audienceName: string;
  // Base copy, in `language` (the product's default language). Kept so older UI works.
  hook: string;
  slides: string[];
  caption: string;
  hashtags: string[]; // 3-6, lowercase, no spaces
  cta: string;
  style: PostStyle;
  checks: CheckResult[];
  round: number; // 1 = first draft passed, 2-3 = passed after rewrite
  // New, optional on old data:
  language?: Language; // language of the base fields
  copy?: Partial<Record<Language, PostCopy>>; // all three languages, same facts; use copyFor()
  status?: PostStatus;
  revisions?: Revision[];
  openIssues?: ReviewIssue[]; // set when status is needs_attention
  error?: string; // set when a step failed for this post; the card shows Retry
  handedOffAt?: number; // set by the share handoff (the store keeps these per post id)
}

export interface RejectedDraft {
  id: string;
  audienceId: string;
  audienceName: string;
  draft: { hook: string; caption: string; slides: string[] };
  reasons: CheckResult[]; // failed checks; type and quote set for Reviewer issues
  fixedVersionId?: string; // the version that replaced it
  round?: number; // which review round sent it back
}

export type CutCategory = "stereotype" | "duplicate" | "too_broad" | "implausible" | "off_channel";

export interface SkepticCut {
  id: string; // candidate id
  category: CutCategory;
  reason: string; // one plain sentence, shown in Studio
}

// Skeptic output: exactly 8 kept (in code order A1..A8) and the other 12 cut.
export interface SkepticDecision {
  keptReasons: Record<string, string>; // candidate id -> reason; insertion order = A1..A8
  cuts: SkepticCut[];
}

// Studio log, exactly as the build spec.
export type AgentName = "strategist" | "skeptic" | "copywriter" | "reviewer" | "analyst" | "planner" | "system";
export type StudioEventKind =
  | "run_started"
  | "candidate_proposed"
  | "candidate_rejected"
  | "audience_kept"
  | "post_drafted"
  | "revision_requested"
  | "post_revised"
  | "post_approved"
  | "post_flagged"
  | "step_failed"
  | "run_ready";

export interface StudioEvent {
  id: string;
  at: number; // ms since run start
  agent: AgentName;
  kind: StudioEventKind;
  refId?: string; // candidate id or audience code
  text: string; // one line for the seller, names the agent
  detail?: string; // optional second line (rejection reason, issue note)
}

export interface TestRun {
  id: string;
  createdAt: string;
  mode: Mode;
  product: Omit<ProductInput, "photo">;
  candidates: Audience[]; // 20 proposed
  chosen: Audience[]; // the 8 kept, in code order
  versions: Version[]; // one per kept audience
  rejected: RejectedDraft[]; // drafts the Reviewer sent back
  criticCanaryCaught?: boolean;
  // New, optional on old data:
  keptReasons?: Record<string, string>;
  cuts?: SkepticCut[];
  events?: StudioEvent[];
  notes?: string[]; // plain notes to show, e.g. that a sample run had its name swapped
  sample?: { of: string; swapped: ("name" | "price")[] }; // set on sample runs
}

// POST /api/hunch/test  body: ProductInput  ->  NDJSON stream of TestEvent, one JSON object per line.
// Order: event lines drive the Studio; candidate lines arrive just before their candidate_proposed event;
// audiences after the Skeptic; version when a post is final; done carries the whole run.
export type TestEvent =
  | { type: "status"; step: "audiences" | "choosing" | "writing" | "checking" | "rewriting" | "done"; message: string }
  | { type: "event"; event: StudioEvent }
  | { type: "candidate"; candidate: Audience }
  | { type: "audiences"; candidates: Audience[]; chosen: Audience[]; skeptic?: SkepticDecision }
  | { type: "version"; version: Version }
  | { type: "rejected"; rejected: RejectedDraft }
  | { type: "done"; run: TestRun }
  | { type: "error"; message: string };

// Test setup on the Run the test screen: the same amount on each of the 8 posts, 3 days.
export type BudgetPreset = 49 | 99 | 199; // per post
export interface TestSetup {
  budget: number; // perPost * 8
  perPost: BudgetPreset;
  days: 3;
}

// One row of the typed 8-row results grid. Missing values are null.
export interface GridRow {
  code: string; // "A1".."A8"
  spend: number | null; // PHP
  results: number | null;
  linkClicks: number | null;
  impressions: number | null;
}

// One normalised row of a Meta Ads Manager export.
export interface ResultsRow {
  rawName: string; // Ad name as exported
  audienceCode?: string; // set by matching
  spendPhp: number;
  impressions?: number;
  reach?: number;
  results?: number;
  resultType?: string; // "Messaging conversations started"
  linkClicks?: number;
  age?: string;
  gender?: string;
  starts?: string; // Reporting starts, YYYY-MM-DD
  ends?: string;
}

export interface UnmatchedRow {
  adName: string;
  spend: number;
  results: number | null;
  linkClicks: number | null;
  impressions: number | null;
}

export interface BreakdownCell {
  age: string; // "18-24"
  gender: string; // "female" | "male" | "unknown"
  impressions: number;
  engagements: number; // legacy; 0 when the export has no engagement columns
  results?: number;
  linkClicks?: number;
  spend?: number;
}

export interface RegionCell {
  region: string;
  impressions: number;
  engagements: number;
}

export interface VersionMetrics {
  versionId: string;
  code: string;
  audienceName: string;
  matchedBy: "code" | "caption" | "manual" | "grid" | "none";
  spend: number; // PHP
  impressions: number;
  reach: number;
  clicks: number; // = linkClicks ?? 0
  saves: number;
  shares: number;
  comments: number;
  reactions: number;
  engagements: number; // legacy score input; see engagementsPer100
  engagementsPer100: number; // legacy; the winner comes from verdict, not this
  savesSharesPer1k: number;
  breakdown: BreakdownCell[];
  regions?: RegionCell[];
  rank: number; // 1 = verdict winner
  // From the spec:
  results: number | null;
  resultType: string | null;
  linkClicks: number | null;
  costPerResult: number | null; // spend / results, computed (never read from the export)
  adName: string; // first matched ad name, "" for typed rows
  value?: number | null; // this row's value on the verdict metric
}

export type VerdictMetric = "cost_per_result" | "cost_per_link_click" | "ctr";
export type Confidence = "high" | "medium" | "low";

export interface CaveatCheck {
  rule: string; // "Total spend under ₱400"
  fired: boolean;
  value: string; // "₱800 total"
}

// Computed in code by pickWinner; the Analyst only writes explanation (and may add caveats).
export interface Verdict {
  metric: VerdictMetric;
  ranking: { code: string; value: number | null }[]; // best first; null = no value (ranked last)
  winnerCode: string;
  runnerUpCode: string; // "" when only one audience has data
  confidence: Confidence;
  explanation: string; // 2-3 plain sentences
  caveats: string[]; // max 3
  caveatChecks?: CaveatCheck[];
  margin?: { percent: number; winnerValue: number | null; runnerUpValue: number | null; winnerVolume: number; volumeUnit: "results" | "link clicks" };
}

export interface IcpCard {
  headline: string; // "Your people: coworkers buying exchange gifts."
  audienceName: string;
  who: string;
  reachedMostly: string; // from the breakdown, or "No breakdown in this export"
  whatWorked: string[];
  whatToPostNext: string[];
  confidence: "early" | "medium" | "strong"; // low | medium | high
  caveat: string;
  hasBreakdown?: boolean;
}

// POST /api/hunch/results  body: ResultsRequest (see client.ts) -> ResultsReport
export interface ResultsReport {
  runId: string;
  mode: Mode;
  days: number; // reporting days, inclusive
  totalSpend: number;
  metrics: VersionMetrics[]; // sorted by verdict rank
  winnerId: string;
  runnerUpId?: string;
  icp: IcpCard;
  unmatchedRows: string[]; // ad names that could not be matched
  notes?: string[];
  // New:
  verdict: Verdict;
  resultType?: string;
  source?: "csv" | "grid" | "sample";
  isSample?: boolean; // show "Sample data"
  hasBreakdown?: boolean;
  unmatched?: UnmatchedRow[]; // with their numbers, so the seller can type them in
  missingCodes?: string[]; // codes with no data
}

export type DayPurpose = "winner" | "runner_up_test";

export type FocusPost = Version & { day: string; dayNumber?: number; theme?: string; purpose?: DayPurpose };

// POST /api/hunch/focus  body: { run: TestRun; report: ResultsReport }
export interface FocusPlan {
  mode: Mode;
  audience: Audience;
  posts: FocusPost[]; // 7; day 4 tests the runner-up
  tests: (Version & { why: string })[];
  notes?: string[];
}

// GET /api/hunch/sample-csv[?file=breakdown][&seller=matcha] -> a sample seller's export as text/csv ("Sample data" in the file name).
