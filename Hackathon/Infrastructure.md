# Infrastructure

This tab is the build spec for Hunch, written so an AI coding agent can build the MVP from it. Hunch is one social media workspace for small creators and influencers: plan content, create and publish posts, and see performance and insights across channels. Creator audience hypotheses and content tests support that workflow; they are not the whole product. The MVP uses Track A for posting and analytics where integrations are not yet available, with publishing and reporting kept behind adapters so approved official APIs can replace manual steps without rebuilding the workspace.

## Instructions for the build agent

This tab is the build spec. Build the focused first workspace exactly as specified; the main tab describes the creator workflow, screens, and demo. The product direction includes direct publishing and unified analytics; where platform approval or API capability is not ready, provide a clear manual handoff or import path and label it honestly.

**Using this with Codex.** Codex reads `AGENTS.md` at the repo root automatically, with a default size cap of 32 KiB, so keep that file short: this section, the stack, and the run and test commands. Export this whole tab as Markdown to `docs/SPEC.md` and add one line to AGENTS.md: "Read docs/SPEC.md before every task; it is the source of truth." Then give Codex one Build order block per task, and run and check each block before starting the next. Never put the API key in either file.

**Build**

- A Next.js web app with the 7 workspace screens from the main tab, responsive for desktop and phone
- The 5 agents (Strategist, Skeptic, Copywriter, Reviewer, Analyst) plus the Planner step, called from Next.js route handlers
- The Studio screen, driven by a client-side event log
- Client-side post preview, phone share handoff where direct publishing is unavailable, analytics import/manual entry, and insight logic
- Demo mode that replays Elle's saved run with no network calls

**Do not build**

- Full Meta or TikTok account synchronization and OAuth in the hackathon build; this is a product roadmap requirement, not an excluded product capability
- Accounts, databases, payments, or saved projects beyond the browser session
- AI image generation
- Automation of any social media app or device

**Rules for the agent**

- When this spec and your own judgment disagree, follow the spec. When the spec is silent, pick the simplest option that keeps the UI polished, and leave a `// DECISION:` comment.
- Every LLM output is validated with Zod. On a validation failure, retry once with the error message appended; on a second failure, show the screen's error state.
- The language is called Tagalog in code, UI, and prompts. Never label it "Filipino".
- All money is in Philippine pesos, shown as ₱ with no decimals in the UI.
- Sample data is always labeled "Sample data" on screen.
- Write UI copy in plain English, short sentences, no marketing jargon.

## At a glance

| Track | How posts go out | How results come back | Approvals needed | Policy risk | When |
| --- | --- | --- | --- | --- | --- |
| A. Manual handoff | Creator copies caption, saves image, posts and promotes by hand | Creator enters results or uploads the Meta Ads Manager export | None | None | Hackathon MVP |
| B. Official APIs | Instagram and Facebook publishing APIs; TikTok Content Posting API | Meta Marketing API insights; TikTok Marketing API reports | Meta App Review and business verification; TikTok developer approval and posting audit | Low, if we follow each platform's rules | After the hackathon |
| C. Device-level | Creator's own phone opens the app with the post ready; full ADB automation only with platform permission | Same as A or B | None for share handoff; platform permission for automation | Low for share handoff; high for unpermitted automation | Share handoff in the MVP; the rest explored only |

## Track A: the hackathon MVP stack

One web app, one agent server, and no platform connections. Everything a platform would do, the creator does by hand, behind an adapter that Tracks B and C can replace later.

&#91;embedded content: Hunch architecture · one distribution adapter, three back ends\]

Confirmed stack:

| Part | Proposal | Why |
| --- | --- | --- |
| Web app | Next.js (latest stable, App Router, TypeScript strict) on Vercel, responsive; Tailwind CSS and shadcn/ui | One codebase for desktop and phone; fast deploys for the demo |
| Agent server | Next.js server routes that run the 5 agents in sequence | No separate backend to host in 20 hours |
| Studio stream | A client-side event log fed by each agent call as it returns, plus streamed partial output from the Strategist | Live agent steps on screen with no websockets or long-lived connections |
| Model calls | Vercel AI SDK with one provider (default Anthropic), Zod-validated structured output per agent | Predictable output the UI can render; the provider can be swapped with an environment variable |
| Image framing | Browser canvas: crop, layout, and text overlay on the creator's offer photo | No image-generation cost or latency |
| Results upload | CSV parsing in the browser, mapped to known Meta export columns | No API approval needed |
| Demo cache | Saved JSON of a full run for the prepared product | The demo never waits on an API |
| Storage | None; state in the browser session | No login or database in scope |

The channel adapter keeps publishing and analytics behind one interface. In the first prototype, `publish` uses the share handoff and `fetchAnalytics` requests manual entry or a report import. Approved platform integrations can replace those fallbacks later.

```ts
// lib/adapter/types.ts
interface DistributionAdapter {
  id: "manual" | "meta_api" | "tiktok_api" | "device_partner";
  publish(post: Post, image: Blob, scheduleAt?: number): Promise<{ status: "handed_off" | "scheduled" | "published"; externalId?: string }>;
  fetchAnalytics(channelIds: string[], dateRange: { from: string; to: string }): Promise<ChannelAnalytics[] | "needs_import">;
}
// lib/adapter/manual.ts: publish returns "handed_off" after copy/save/share;
// fetchAnalytics returns "needs_import" so Analytics offers manual entry or import.
```

## Repository structure

One Next.js app. Agents live in `lib/agents`, one file each, so a prompt can change without touching the UI.

```text
hunch/
  app/
    layout.tsx                 # fonts, theme, app shell, navigation
    page.tsx                   # Screen 1: Home
    create/page.tsx            # Screen 2: Create
    audiences/page.tsx         # Screen 3: Audience insights
    posts/page.tsx             # Screen 4: Composer and publish
    calendar/page.tsx          # Screen 5: Content calendar
    analytics/page.tsx         # Screen 6: Unified analytics
    insights/page.tsx          # Screen 7: Insights and next actions
    api/agents/
      strategist/route.ts      # streams 20 audience candidates
      skeptic/route.ts
      copywriter/route.ts      # one audience per call
      reviewer/route.ts        # one post per call
      analyst/route.ts         # explains a verdict computed in code
      planner/route.ts         # 7-day calendar
  components/
    ui/                        # shadcn/ui primitives
    shell/                     # StepHeader, StepNav, DemoBadge, SampleDataBadge
    start/  studio/  audiences/  posts/  test/  results/  calendar/
  lib/
    agents/                    # strategist.ts, skeptic.ts, copywriter.ts, reviewer.ts, analyst.ts, planner.ts
    agents/prompts/            # one .ts file of prompt text per agent
    schemas.ts                 # Zod schemas for every type in Data model
    model.ts                   # provider + model setup from env
    orchestrator.ts            # client-side pipeline runner + event emitter
    events.ts                  # StudioEvent types + helpers
    store.ts                   # Zustand store, persisted to sessionStorage
    framing/                   # canvas layouts + export
    results/                   # parseCsv.ts, matchRows.ts, pickWinner.ts
    adapter/                   # DistributionAdapter interface + manual.ts
    demo/                      # replay.ts
  fixtures/elle/               # product.json, run.json, sample-results.csv, photo.jpg
  tests/                       # Vitest unit tests
```

## Data model

Every type below has a matching Zod schema in `lib/schemas.ts`; agents return these shapes and nothing else. A single `Run` object in the store holds the whole journey.

```ts
type Lang = "en" | "taglish" | "tl";            // tl = Tagalog
type Channel = "shopee" | "facebook" | "instagram" | "tiktok" | "offline";

interface CreatorInput {
  photoDataUrl?: string;         // optional content or offer image, resized to max 2048px
  description: string;           // creator niche and content idea, max 280 chars
  channels: Channel[];           // creator's publishing channels, at least 1
  offerUrl?: string;             // tracked product, affiliate, booking, or lead link
  pricePhp?: number;
  defaultLang: Lang;             // default "taglish"
  objective: "engagement" | "link_clicks" | "leads" | "purchases"; // same goal for all 8 posts
}

interface AudienceCandidate {     // Strategist output, 20 per run
  id: string;                    // "c01".."c20"
  label: string;                 // max 6 words, e.g. "Coworkers buying exchange-gift jars"
  who: string;                   // 1 sentence, concrete situation, not demographics alone
  responseMoment: string;        // when and why this person might engage or act
  angle: string;                 // the message or content angle we'd test
  bestChannel: Channel;
  bestLang: Lang;
}

interface SkepticDecision {
  kept: { id: string; reason: string }[];        // exactly 8
  rejected: {
    id: string;
    category: "stereotype" | "duplicate" | "too_broad" | "implausible" | "off_channel";
    reason: string;              // 1 sentence, shown in Studio
  }[];                           // the other 12
}

interface Audience extends AudienceCandidate {
  code: string;                  // "A1".."A8", used to match results rows
  keptReason: string;
}

interface Post {
  audienceCode: string;
  hook: Record<Lang, string>;    // first line, max 90 chars
  caption: Record<Lang, string>; // max 600 chars incl. hook
  hashtags: string[];            // 3-6, no spaces
  cta: Record<Lang, string>;
  frame: FrameSpec;              // see Image framing
  revisions: Revision[];         // Reviewer history, empty if approved first time
  status: "drafting" | "in_review" | "approved" | "needs_attention";
  publication: {
    status: "draft" | "scheduled" | "published" | "handed_off" | "failed";
    channel: Channel;
    scheduledAt?: number;
    publishedAt?: number;
    externalId?: string;
  }[];
}

interface SocialAccount {
  channel: Channel;
  displayName: string;
  connection: "connected" | "handoff_only" | "disconnected";
}

interface ChannelAnalytics {
  channel: Channel;
  periodStart: string;
  periodEnd: string;
  metrics: { name: string; value: number; unit: string }[];
  source: "platform" | "import" | "manual" | "sample";
}

interface Revision {
  round: 1 | 2;
  issues: { type: "cringe" | "stereotype" | "ad_policy" | "language" | "claim"; note: string; quote: string }[];
  before: Record<Lang, string>;  // caption before
  after: Record<Lang, string>;   // caption after
}

interface ResultsRow {           // one row of the uploaded export, normalised
  rawName: string;               // ad or post name as exported
  audienceCode?: string;         // set by matching
  spendPhp: number;
  impressions: number;
  reach?: number;
  results?: number;              // Meta "Results" for the chosen objective
  resultType?: string;           // e.g. "Messaging conversations started"
  linkClicks?: number;
}

interface Verdict {
  metric: "cost_per_result" | "cost_per_link_click" | "ctr";
  ranking: { audienceCode: string; value: number }[];   // best first
  winnerCode: string;
  runnerUpCode: string;
  confidence: "high" | "medium" | "low";
  explanation: string;           // Analyst, 2-3 plain sentences
  caveats: string[];             // max 3
}

interface CalendarDay {
  day: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  purpose: "winner" | "runner_up_test";
  theme: string;                 // e.g. "Gift-ready packaging"
  post: Post;
}

interface Run {
  id: string;
  mode: "live" | "demo";
  creator: CreatorInput;
  socialAccounts: SocialAccount[];
  channelAnalytics: ChannelAnalytics[];
  candidates: AudienceCandidate[];
  skeptic?: SkepticDecision;
  audiences: Audience[];
  posts: Post[];
  results?: ResultsRow[];
  isSampleResults: boolean;
  verdict?: Verdict;
  calendar?: CalendarDay[];
  events: StudioEvent[];         // see Orchestration
}
```

## Agent specs

Six agent steps make up the product flow: Strategist, Skeptic, Copywriter, Reviewer, Analyst, and Planner. A live run uses many model calls (including per-post calls and retries); the table below gives the expected call counts. Each agent is a function in `lib/agents/<name>.ts` that takes typed input, calls the model with `generateObject` or `streamObject` and a Zod schema, and returns typed output. Only the Analyst's explanation is free text, and it never chooses the winner.

| Agent | Input | Output | Calls per run | Temperature |
| --- | --- | --- | --- | --- |
| Strategist | CreatorInput (description, channels, objective, optional image) | 20 AudienceCandidate, streamed | 1 | 0.9 |
| Skeptic | 20 candidates + CreatorInput | SkepticDecision: 8 kept, 12 rejected | 1 | 0.2 |
| Copywriter | CreatorInput + 1 Audience (+ Reviewer issues on a rewrite) | 1 Post | 8, in parallel; up to 16 more for rewrites | 0.8 |
| Reviewer | 1 Post + its Audience | approve, or issues to fix | 8 to 24 | 0.1 |
| Analyst | Verdict computed in code + audiences + results | explanation and caveats | 1 | 0.3 |
| Planner | creator + calendar context + performance insights | Suggested schedule and post themes; posts via Copywriter and Reviewer | 1 + 7 Copywriter + 7 Reviewer | 0.7 |

**Strategist**

- Look at the photo and creator description and propose 20 audiences that differ in situation, response moment, and motive, not just age or gender.
- Each `who` names a concrete situation ("sends a balikbayan box every December"), never a demographic alone ("millennial women").
- Cover at least 4 different motives across the 20: self-use, gifting, sharing with family or work, resale or bulk, and occasion-driven.
- Use only channels the creator selected.

**Skeptic**

- Keep exactly 8, chosen for distinctness first and plausibility second. No two kept audiences may share the same response moment.
- Reject with one of five categories and one plain sentence, written for the creator to read in Studio.
- Reject any audience defined by a stereotype, by a sensitive personal attribute (health, religion, ethnicity, finances, sexuality), or as "everyone who likes X".
- Assign codes A1 to A8 in the order kept.

**Copywriter**

- Write one post for one audience: hook, caption, CTA, and hashtags in all three languages, plus a FrameSpec.
- The hook is the first line and must work on its own in the feed. It's specific to this audience's response moment and the creator's chosen goal.
- Taglish mixes Tagalog and English the way people actually text: Tagalog for warmth and connectors, English for product words. No forced slang, and no "lodi", "petmalu", or other dated memes unless the audience calls for it.
- Tagalog is natural, conversational Tagalog, not formal or textbook.
- On a rewrite, fix every Reviewer issue and change nothing else.

**Reviewer**

- Check each post against the Guardrails section. Return `approve`, or a list of issues each with type, the exact quote, and a one-line fix note.
- Allow at most 2 rewrite rounds per post. If issues remain after round 2, set status `needs_attention` and show the post with a visible flag rather than blocking the run.
- Never rewrite the post itself; only the Copywriter writes.

**Analyst**

- Receive the Verdict from `pickWinner.ts` (see Results and winner logic) and write a 2 to 3 sentence explanation a creator understands: who won, by how much, and what it means for next week.
- Add up to 3 caveats, such as low spend, few results, or a close runner-up.
- Never contradict the computed winner or confidence.

**Planner**

- Plan 7 days: 6 for the winner, 1 (day 4) testing the runner-up. Each day gets a distinct theme, such as gift packaging, a recipe idea, a customer moment, or a behind-the-scenes look.
- For each day, call the Copywriter with the theme added, then the Reviewer, using the same rules.

**All prompts**

- Include the creator's channels, price, description, and selected offer objective verbatim.
- State the output schema in the prompt as well as passing it to the SDK.
- Keep each prompt in `lib/agents/prompts/<name>.ts` as an exported template string.

## Orchestration, API routes, and the event log

The browser runs the pipeline. `lib/orchestrator.ts` calls one route per agent step, and each call stays far under Vercel's 300-second function limit. As each call returns, the orchestrator writes StudioEvents to the store, and the Studio screen renders that log.

**Pipeline sequence**

1. Strategist, streamed: emit `candidate_proposed` as each of the 20 arrives.
2. Skeptic: emit `candidate_rejected` for 12 and `audience_kept` for 8, spaced 150 ms apart so Studio reads as live.
3. Copywriter × 8 in parallel, with a concurrency limit of 4: emit `post_drafted` per post.
4. Reviewer per post as soon as its draft lands: emit `post_approved` or `revision_requested`. On a revision, run the Copywriter again with the issues, then the Reviewer again, up to 2 rounds.
5. When all 8 are approved or flagged, emit `run_ready` and enable "See your 8 hunches".
6. Later, on Results: `pickWinner` runs in the browser, then the Analyst route, then the Planner route, then 7 Copywriter and Reviewer passes for the calendar.

**Routes**

Every route is a POST to a Node.js route handler (never the Edge runtime) with `export const maxDuration = 60`. Inputs and outputs are validated with the Zod schemas.

| Route | Body | Returns |
| --- | --- | --- |
| `/api/agents/strategist` | `{ creator: CreatorInput }` | Streamed partial object `{ candidates: AudienceCandidate[] }` |
| `/api/agents/skeptic` | `{ product, candidates }` | `SkepticDecision` |
| `/api/agents/copywriter` | `{ product, audience, theme?, fixIssues? }` | `Post` |
| `/api/agents/reviewer` | `{ post, audience }` | `{ decision: "approve" } \| { decision: "revise", issues }` |
| `/api/agents/analyst` | `{ verdict, audiences, results }` | `{ explanation, caveats }` |
| `/api/agents/planner` | `{ product, winner, runnerUp }` | `{ days: { day, purpose, theme }[] }` |

On a model or validation error, a route returns `{ error: { code, message } }` with status 502. The orchestrator retries a failed call once after 1 second. If it fails again, it emits `step_failed` and shows a Retry button on that card only, so one bad post never blocks the other 7.

**StudioEvent**

```ts
type StudioEvent = {
  id: string;
  at: number;                     // ms since run start
  agent: "strategist" | "skeptic" | "copywriter" | "reviewer" | "analyst" | "planner" | "system";
  kind:
    | "run_started" | "candidate_proposed" | "candidate_rejected" | "audience_kept"
    | "post_drafted" | "revision_requested" | "post_revised" | "post_approved" | "post_flagged"
    | "step_failed" | "run_ready";
  refId?: string;                 // candidate id or audience code
  text: string;                   // one line shown in Studio, written for the creator
  detail?: string;                // optional second line (rejection reason, issue note)
};
```

Event text uses the agent's name and plain words, for example: "Skeptic dropped 'Health-conscious millennials': a stereotype, not a distinct response moment."

## Screens and components

Every screen has one primary button, a working empty, loading, and error state, and a layout that reflows from a desktop grid to a single phone column at 768 px. Desktop adds width; it never adds steps.

**App shell (all screens)**

- Step header: 7 numbered steps, current one highlighted, completed ones clickable; on phones it collapses to "Step 3 of 7 · Your 8 hunches".
- Sticky footer on phones holding the primary button; inline on desktop.
- `DemoBadge` in the header when `mode = demo`; `SampleDataBadge` anywhere sample results are shown.
- If the store is empty on any screen after Start, redirect to Start.

**1. Home** (`/`)

- Contents: channel connection/status cards, this week's content calendar, draft and scheduled posts, and key recent performance metrics. Offer a visible path to create a post and review insights.
- "Try with a sample creator" loads Elle's labeled demo workspace.
- Primary button: "Create a post".

**2. Create** (`/create`)

- Describe a niche, content idea, channels, and objective; draft or refine a post with agent help. The audience test can be started as an optional creation aid.
- Primary button: "Preview post".

**3. Audience insights** (`/audiences`)

- 8 audience cards: label, who, response moment, angle, and a small "Kept because" line. Audiences should be plausible people to reach with the creator's content and selected objective, not generic demographic segments. Desktop 4 × 2 grid; phone list.
- Cut for the hackathon: no Swap button.
- Clearly mark generated hypotheses as suggestions. The creator can use them to shape a post or skip them.

**4. Composer and publish** (`/posts`)

- 8 post cards: framed image, hook in bold, caption, hashtags, and CTA. A language toggle at the top switches all cards; each card also has its own toggle.
- One-tap actions per card: Copy caption (hook + caption + hashtags), Save image (PNG). On phones, a Share button runs the share handoff (see Share handoff).
- A "Reviewed" chip opens a sheet showing each revision: issue, quote, before, and after.
- Posts with `needs_attention` show an amber flag and the open issue.
- Desktop 4 × 2 grid that fits a 1440 × 900 screen with a short scroll; phone single column.
- Save draft, schedule, or publish using the connected channel adapter. When direct publishing is unavailable, offer the phone share handoff and let the creator mark the post as published.

**5. Content calendar** (`/calendar`)

- Show drafts, scheduled posts, and published posts by channel in one calendar.
- Let the creator open an item to edit, reschedule, or publish it.
- For the first prototype, channel actions can use the share handoff; label it clearly and let the creator update post status.

**6. Unified analytics** (`/analytics`)

- Show an overview of available channel performance with the metric source and date range visible.
- Compare reach, engagement, link clicks, and other metrics when the connected channel provides them; do not combine unlike metrics into a single ranking.
- When a channel is not connected, allow manual entry or import of its report. Label demo metrics as sample data.

**7. Insights** (`/insights`)

- Explain what is resonating and why, with one or two practical next actions. Recommendations may suggest a new audience angle, a post variation, or a publishing time; distinguish suggestions from observed analytics.

**Acceptance checks for the whole flow**

- A first-time creator can see what to publish, create a draft, reach the publish action, and find performance data without instructions.
- Every screen works at 375 px and at 1440 px wide with no horizontal scroll.
- Every button and form element is keyboard-reachable and has a visible focus state; text contrast meets WCAG AA.
- Refreshing any screen restores state from sessionStorage.

## Image framing

Each post's image is the creator's own offer/product photo, framed differently per audience in the browser with the Canvas API. No image generation, no server.

```ts
interface FrameSpec {
  layout: "full_bleed" | "split" | "card";
  crop: "center" | "top" | "bottom" | "tight";   // tight = zoom 1.3x on center
  overlayText: string;     // max 32 chars, from the hook, in the post's language
  overlayPosition: "top" | "bottom";
  palette: "warm" | "cool" | "neutral" | "festive";
}
```

| Layout | What it looks like | Good for |
| --- | --- | --- |
| full\_bleed | Photo fills the frame; overlay text on a soft gradient band | Impulse and self-use audiences |
| split | Photo on the top 65%; solid color block below with overlay text | Gifting and occasion audiences |
| card | Photo inset with a 48 px border in the palette color; overlay text under it | Bulk, resale, and practical audiences |

- Output size: 1080 × 1350 (4:5) for feed posts. Export as PNG via `canvas.toBlob`.
- Overlay type: the app's display font, bold, sized to fit the width with a 28 px minimum; text always passes 4.5:1 contrast against what's behind it.
- Palettes are 4 fixed sets of 2 colors defined in `lib/framing/palettes.ts`; the Copywriter picks one, it can't invent colors.
- No logos, watermarks, or Hunch branding on the image.
- Render previews at display size in the card; render full size only on Save or Share.

## Share handoff

On a phone, one tap hands a post's framed image to Instagram, Facebook, or TikTok through the system share sheet, with the caption already on the clipboard. It uses standard browser sharing (the Web Share API), so it needs no platform approval, and Hunch never opens, controls, or posts inside those apps.

**Flow**

1. The creator taps Share on a post card.
2. Hunch copies the full caption to the clipboard: hook, caption, hashtags, then the test code on its own line (for example `A3`), so results can be matched later.
3. In the same tap handler, Hunch calls `navigator.share({ files: [png], title })` with the pre-rendered 1080 × 1350 PNG. Pass the file only, no text, so apps that ignore text or paste it twice behave the same.
4. A toast says "Caption copied. Paste it in the app." for 4 seconds.
5. When the share resolves, set `post.handedOffAt = Date.now()` and show a "Shared" chip on the card. If the creator cancels (`AbortError`), do nothing and show no error.

**Engineering rules**

- Pre-render all 8 full-size PNGs in the background once the posts are approved, and keep them as Blobs. Safari only allows `navigator.share` straight from a tap, so no slow work can happen between the tap and the share call.
- Detect support with `navigator.canShare?.({ files: [file] })`. Where it's unsupported (most desktops), hide Share and show Save image and Copy caption instead, plus the hint "Open Hunch on your phone to share in one tap."
- Add `handedOffAt?: number` to the Post type. The manual adapter's `handOff` wraps this flow and returns `handed_off`.
- The Next week calendar uses the same Share button for each day's post.

**What the creator sees in each app** (test on one iPhone and one Android phone before demo day; flows differ by app version)

| App | After the share sheet | Creator then |
| --- | --- | --- |
| Instagram | Opens with the image, asking Feed, Story, or Reel | Chooses Feed, pastes the caption, posts |
| Facebook | Opens a new post with the image attached | Pastes the caption, posts |
| TikTok | Opens the photo editor with the image | Pastes the caption, posts |

**Acceptance checks**

- Works on current iOS Safari and Android Chrome: one tap opens the share sheet with the image attached and the caption on the clipboard.
- Cancelling leaves the card unchanged, with no error.
- Desktop never shows a Share button that fails.

## Optional campaign-result import and comparison

The winner is computed in code, not by the model, so it's the same every time and can be tested. The Analyst only explains it.

**Parsing (`lib/results/parseCsv.ts`)**

- Accept CSV only (Papa Parse), parsed in the browser; XLSX is cut for the hackathon. Skip blank and total rows. Parsed numbers fill the results grid, where the creator can check and edit every value.
- Match headers against the table below. The exact headers below come from a real Ads-level export of a PHP ad account (Nov 2026). Match exact names first, then the fallbacks.
- Strip currency symbols and thousands separators; treat "—" and empty cells as missing.

| Field | Exact header in Meta's export | Fallbacks |
| --- | --- | --- |
| rawName | `Ad name` | `Ad set name`, `Campaign name` |
| spendPhp | `Amount spent (PHP)` | any header starting `Amount spent` |
| impressions | `Impressions` | none |
| reach | `Reach` | none |
| results | `Results` | none |
| resultType | `Result indicator` | none |
| costPerResult (read, not trusted) | `Cost per results` (plural in Meta's export) | `Cost per result` |
| linkClicks | `Link clicks` | none |

The full header row from the real export, for the fixture and tests:

```csv
"Reporting starts","Reporting ends","Ad name","Ad delivery","Attribution setting",Results,"Result indicator","Cost per results","Ad set budget","Ad set budget type","Amount spent (PHP)",Impressions,Reach,Ends,Bid,"Bid type","Last significant edit","Quality ranking","Engagement rate ranking","Conversion rate ranking","Ad set name","Result rate","Results value","Result ROAS indicator","Results ROAS","Link clicks","Results (initial)","Results (initial) indicator"
```

**Parser rules from the real file**

- Match headers exactly (trimmed, case-insensitive). Never match by prefix for `Results`: the export also has `Results value`, `Results ROAS`, and `Results (initial)`, which must not be read as results.
- An export with no ads has one data row reading "No data available."; treat it as zero rows and show "This export has no ad results yet."
- Ignore every other column. Compute cost per result from spend and results rather than trusting `Cost per results`.
- Save this header row as `fixtures/meta-headers.csv` and add Vitest cases for the empty export and for a filled one built on these headers.
- `sample-results.csv` uses exactly this header row, with 8 data rows.

If no spend column is found, show "We couldn't read this file. Type your numbers into the grid instead." and leave the grid empty for typing. There is no column-mapping dialog.

**Matching rows to audiences (`matchRows.ts`)**

- Look for the code A1 to A8 in `rawName` (regex `/\bA[1-8]\b/i`). If several rows match one code, sum their numbers.
- Unmatched rows are listed under the grid with their numbers, so the creator can type them into the right row.

**Picking the winner (`pickWinner.ts`)**

1. Choose a metric for the selected creator objective. Reject negative or non-finite values. For engagement, leads, or purchases, if every audience has positive spend, at least one result, and the same non-empty `resultType`, use cost per result (spend ÷ results, lower is better). For leads or purchases, link clicks can be shown as a proxy only; do not call them a lead or purchase winner. For a link-click objective, use cost per link click when available, otherwise CTR (link clicks ÷ impressions, higher is better) only when every audience has clicks and impressions greater than zero. If no comparable metric is available for all eight audiences, do not produce a verdict. Never substitute `Clicks (all)` for `Link clicks`.
2. Aggregate duplicate rows only when their `resultType` values agree; if they differ, do not combine their result counts for cost-per-result comparisons. Rank all 8 audiences on the selected metric. Winner = first, runner-up = second.
3. Set confidence with these constants in `lib/results/constants.ts`:
   - high: winner beats the runner-up by 25% or more AND the winner has at least 10 results (or 50 link clicks on the click metrics)
   - medium: margin of 10% or more AND at least 5 results (or 20 link clicks)
   - low: anything else
4. Add caveats automatically when total spend is under ₱400, when the runner-up is within 10%, or when spend differs by more than 20% between audiences.

**Tests**

Write Vitest cases for: a clear winner (high), a close race (low), missing results falling back to cost per link click, missing clicks falling back to CTR only when every audience has clicks and impressions, insufficient data blocking a verdict, duplicate rows summed, conflicting result types, an unmatched row, and a file with "(PHP)" headers.

## Demo mode and fixtures

Demo mode replays a saved sample run of Elle's creator journey with realistic timing and zero network calls, so the stage never depends on an API.

**Turning it on**

- "Try with a sample creator" on Start, or the URL `/?demo=elle`.
- Sets `mode = demo`, shows the DemoBadge, and loads `fixtures/elle/*`.

**Fixtures**

| File | Contents | How it's made |
| --- | --- | --- |
| `photo.jpg` | Elle's product photo: a jar of chili garlic oil, well lit | Angel shoots it: homemade-looking oil in a plain glass jar, no brand label, daylight |
| `creator.json` | CreatorInput: niche, content idea, channels, optional offer, objective, default Taglish | Written by hand |
| `run.json` | A full Run from a real live pipeline run, including all StudioEvents with their `at` timings | Exported with a dev-only "Export run" button after a good live run |
| `sample-results.csv` | 8 rows in Meta Ads Manager export format, one per code A1 to A8 | Angel writes it in a spreadsheet using the real Meta headers; see rules below |

**Replay (`lib/demo/replay.ts`)**

- Re-emits the saved StudioEvents on their original `at` timings, compressed to a total of 25 to 35 seconds so the Studio screen is watchable on stage.
- A hidden keyboard shortcut (`Shift + →`) skips to `run_ready` if time is short.

**Sample results rules**

- Realistic for a ₱800 test over 3 days: ₱100 spend per audience.
- Use seeded synthetic values with modest, plausible variation and one clear illustrative winner. Keep every row internally consistent with an ₱800 total (₱100 planned per audience) and the winner-logic rules above. These are fabricated sample data, never evidence from a real campaign; label them on screen and in the file.
- The winner should be an audience a judge finds plausible but not obvious for Elle's creator-led offer, such as coworkers buying exchange gifts in November.
- The file name and every on-screen view say "Sample data".

## Design system

Warm, confident, and calm: it should feel like a sharp friend who runs a small studio, not an enterprise dashboard. Light theme only for the hackathon. These are starting values; adjust them in one place (`tailwind.config.ts` and CSS variables), never per component.

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | #FAF7F2 | App background |
| `--surface` | #FFFFFF | Cards, sheets |
| `--ink` | #1C1917 | Primary text |
| `--ink-muted` | #57534E | Secondary text |
| `--line` | #E7E5E4 | Borders, dividers |
| `--accent` | #C2410C | Primary buttons, current step, winner highlight (white text on it passes AA) |
| `--accent-soft` | #FDE7DC | Selected states, kept-audience background |
| `--success` | #15803D | Approved |
| `--warning` | #B45309 | Needs attention, low confidence |
| `--danger` | #B91C1C | Errors |

- **Type:** Plus Jakarta Sans via `next/font`, weights 400, 600, and 800. Scale: 14 / 16 / 20 / 28 / 40 px; body 16 px on all screens. Numbers use tabular figures.
- **Spacing and shape:** 4 px base grid; card padding 16 px on phones, 24 px on desktop; radius 12 px on cards, 8 px on buttons and inputs; 1 px borders in `--line`; at most one soft shadow level for raised cards.
- **Motion:** 150 to 250 ms, ease-out, with Motion (Framer Motion). Use it to explain change: cards sliding from Proposed to Kept, a strike-through on rejection, a status chip changing color. Respect `prefers-reduced-motion` by swapping movement for fades.
- **Layout:** max content width 1200 px; breakpoints at 768 px and 1200 px; 44 px minimum tap targets.
- **Icons:** Lucide, 20 px, stroke 1.75. No emoji in the UI.
- **Voice:** second person, short, encouraging, never cute. "Your 8 hunches", not "Woohoo, audiences found!".

## Guardrails

The Reviewer checks every post against this list. The same list goes in the Copywriter's prompt so most posts pass first time. The ad-policy rules are our summary of common Meta advertising rules, not legal advice; check Meta's Advertising Standards before real launches.

| Issue type | Flag when | Example to flag |
| --- | --- | --- |
| stereotype | The audience or copy leans on age, gender, region, or class clichés instead of a concrete response moment | "Para sa mga nanay na laging nasa kusina" |
| cringe | Forced slang, too many emoji (more than 2), all caps, fake urgency, or hype words ("insane", "must-have") | "GRABE SOBRANG SARAP!!! 🔥🔥🔥" |
| language | Taglish that reads machine-made, Tagalog that's formal or textbook, or English and Tagalog versions that say different things | Literal word-for-word Tagalog |
| claim | Health, weight, medical, or "best in the Philippines" claims; prices, discounts, or offer terms the creator didn't give | "Pampapayat", "cures colds" |
| ad\_policy | Copy that asserts or implies the reader's personal attributes (health, religion, ethnicity, finances, sexuality, age); before-and-after; shocking or sensational wording | "Are you struggling with money this Christmas?" |

**Rules for every post**

- Talk about the situation and the product, never about who the reader is.
- Use only facts from the creator's input: offer/product, price, channels, and link. No invented ingredients, awards, availability, or delivery promises.
- Hook ≤ 90 characters; caption ≤ 600 characters; 3 to 6 hashtags, lowercase, no banned or misleading tags.
- One CTA, matched to the offer: open the affiliate/product link, book a service, request details, or place an order. Never invent a link or claim.
- The three language versions carry the same meaning and the same facts.

## Environment, deployment, and testing

**Dependencies**

`next`, `react`, `typescript`, `tailwindcss`, shadcn/ui, `ai` (Vercel AI SDK) with `@ai-sdk/anthropic`, `zod`, `zustand`, `motion`, `papaparse`, `recharts`, `lucide-react`; dev: `vitest`.

**Environment variables**

| Variable | Example | Notes |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | (secret) | Server-side only, never sent to the browser |
| `MODEL_ID` | claude-sonnet-5-5 | One model for all agents; swap without code changes |
| `MODEL_ID_FAST` | claude-haiku-5-5 | Optional, for the Reviewer if speed matters more than depth |
| `NEXT_PUBLIC_DEMO_DEFAULT` | false | true makes the app open in demo mode |
| `NEXT_PUBLIC_SHOW_DEV_TOOLS` | false | Shows "Export run" and the event inspector |

**Deployment**

- Vercel, Node.js runtime for all route handlers, `maxDuration = 60` per route.
- Production URL used on stage; a preview deploy for every push.
- Keep a local build running on the demo laptop as the fallback.

**Testing**

- Vitest: `parseCsv`, `matchRows`, `pickWinner` (cases listed in Results), Zod schemas against fixture data, and the orchestrator's retry logic with a mocked fetch.
- Manual smoke check in demo mode, Start to Next week, at 375 × 812 and 1440 × 900 with the console open. Playwright is cut for time.
- Before the freeze: one full live run on the real model, timed, with the result exported as the new `run.json`.

## Build order

Joal builds alone with Codex, code complete by 17:00. Times assume a 02:00 start; shift them if you start later. Feature freeze at 14:00. If a block runs more than 30 minutes over, take its cut line and move on.

**02:00 to 03:00 · Foundation**

- [ ] Repo with a short `AGENTS.md` and this tab as `docs/SPEC.md`
- [ ] Scaffold Next.js, Tailwind, shadcn/ui, Plus Jakarta Sans, design tokens
- [ ] App shell with all 7 routes; deploy to Vercel and open it on a phone

**03:00 to 05:00 · Data and workspace shell**

- [ ] Workspace, channel, post, and analytics schemas/store
- [ ] Home dashboard and responsive navigation

* Cut line: show demo channel status without real OAuth connections

**05:00 to 07:00 · Create and calendar**

- [ ] Draft composer with channel previews
- [ ] Calendar with draft, scheduled, and published states
- [ ] Optional AI audience/content suggestion

* Cut line: one channel preview and a compact calendar list

**07:00 to 07:30 · Break away from the screen**

**07:30 to 10:00 · Publish path**

- [ ] Post preview and clear publish/share handoff
- [ ] Channel-specific post status and retry/failure state
- [ ] One-click path from calendar item to composer

* Cut line: share handoff and manual status update; no API integrations

**10:00 to 12:30 · Analytics and insights**

- [ ] Unified analytics overview with metric source/date range
- [ ] Manual metric entry or one report import path
- [ ] One insight grounded in the displayed sample/entered data

* Cut line: clearly labeled sample metrics; keep source labeling and chart

**12:30 to 14:00 · Demo mode**

- [ ] Prepare Elle's sample workspace: calendar, posts, and clearly labeled analytics
- [ ] Confirm the whole plan-create-publish-review demo does not require network calls

**14:00 · Feature freeze**

**14:00 to 16:00 · Polish**

- [ ] Empty, loading, and error states; check every screen at 375 px and 1440 px
- [ ] Keyboard, contrast, and reduced-motion pass
- [ ] Angel reviews all output on both phones; fix prompts and re-export `run.json` if needed

**16:00 to 17:00 · Ship**

- [ ] Final deploy; local build running as a fallback
- [ ] Share handoff checked on an iPhone and an Android phone
- [ ] Give Angel the production URL and a screen recording of the full flow

## Track B: official APIs

The APIs cost nothing to call; the cost is approval time, which is why they come after the hackathon. Start the applications early if Hunch continues.

| Job | Platform route | What it needs | Catch |
| --- | --- | --- | --- |
| Publish to Instagram | [Instagram Content Publishing API](https://developers.facebook.com/docs/instagram-platform/content-publishing/) | Professional (Business or Creator) account; publish permission via Instagram or Facebook login; App Review for users outside the app's roles | Personal accounts can't publish via API; 50 API posts per account per 24 hours ([limit](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media_publish)) |
| Read ad results | [Meta Marketing API](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/authorization) with ads\_read | App Review for the full Marketing API Access Tier | Before review, works only for people with a role on our app |
| Create and boost ads | Meta Marketing API with ads\_management | Same as above, plus business verification | Real ad spend; mistakes cost the creator money |
| Publish to TikTok | [TikTok Content Posting API](https://developers.tiktok.com/docs/en/content-sharing-guidelines) | Developer app approval, then a separate posting audit | Before the audit, posts are private only and at most 5 users can post per 24 hours |
| Read TikTok ad results | TikTok Marketing API | Business Center account and developer approval | Approval takes days |

TikTok's posting rules also shape our UI: users must see a preview, be able to edit preset captions and hashtags, and consent before upload. Hunch's posts screen already works this way, so it's a good fit.

## Track C: device-level, like ParallelOS

The policy-safe version of device-level distribution is a handoff, not automation: the creator's own phone opens the real app with the post ready, and the creator taps Post.

**How ParallelOS-style systems likely work.** Software on real Android phones drives the social apps through ADB (Android Debug Bridge), Android's standard developer tool for sending taps, swipes, and text from a computer. Agents use the app the way a person would, which avoids API approvals and the blocking that scraping runs into. This is our reading of their keynote; we have no public documentation for it.

**Where the line sits.** Meta's terms say you may not access or collect data from its products using automated means without prior permission, and its developer docs call Platform APIs the only allowable programmatic route without written permission ([Meta automated data collection](https://developers.facebook.com/docs/development/terms-and-policies/automated-data-collection/)). Unpermitted automation of the apps puts the seller's account at risk, so Hunch won't do it on its own.

**Three levels, lowest risk first**

1. **Share handoff (safe now).** On a phone, Hunch uses the system share sheet to send the image to Instagram, Facebook, or TikTok and copies the caption to the clipboard. The creator pastes, checks, and posts. This uses standard OS sharing, not app automation. It's in the MVP; see Share handoff.
2. **Assisted device agent (needs a policy check).** An agent on the creator's own phone prepares the post in the app but stops before Post or Boost, and the creator confirms. It's one person, one account, and a human makes every final action. It's still automation of the app, so confirm platform terms before building it.
3. **Full device automation (partner only).** Fleets of phones posting and boosting on their own. Do this only through a partner that has platform permission, for example a ParallelOS integration through the distribution adapter, never in-house.

## Sources

- [Instagram Content Publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing/), Meta for Developers
- [IG User Media Publish limits](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media_publish), Meta for Developers
- [Marketing API authorization and access tier](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/authorization), Meta for Developers
- [Automated Data Collection](https://developers.facebook.com/docs/development/terms-and-policies/automated-data-collection/), Meta for Developers
- [Content Sharing Guidelines](https://developers.tiktok.com/docs/en/content-sharing-guidelines), TikTok for Developers
- [Content Posting API, Direct Post](https://developers.tiktok.com/docs/en/content-posting-api-reference-direct-post), TikTok for Developers
