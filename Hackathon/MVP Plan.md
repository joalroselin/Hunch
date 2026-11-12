# Hunch MVP: ParallelOS Hackathon

Nov 12, 2026 · Current build and demo scope

## What we are showing

Hunch turns a small seller’s test results into their next week of posts. Elle’s Candles is the sample business: handmade soy candles at ₱350 per jar, aimed at Filipino buying occasions. Elle is a persona, and her test figures are sample data.

The working journey is product → audience hypotheses → reviewed posts → test results → next week. The workspace connects the last part through a single Hunch conversation: “What worked?” → “What should I post?” → “Make it more Taglish” → “Plan this for Friday.”

The public pitch leads with that outcome. Sample figures are identified where shown. Implementation limits belong in Q&A and the roadmap; they do not replace the product story.

## How each bucket is scored by the build

### Craftsmanship · 40%

- Evidence: a shared visual system across the landing page, product flow, Studio and workspace. Planned posts have dated previews, editable captions and distinct gallery photos. Chat cites a results row and saves its revised draft into Week without duplicating it.
- Demo moment: ask what to post, revise the caption, and watch that same post appear on the requested day.
- Publishing handoff: save the image, copy the caption, or use the supported phone share sheet. The seller publishes in the social app and marks the post as posted.
- Remaining verification: a physical iPhone and Android share test, a timed rehearsal, and a backup recording. Do not claim direct publishing or automatic scheduling.

### Agents · 20%

- Evidence: the server pipeline proposes audiences, cuts them with a Skeptic, writes posts, and reviews them. Checks cover unsupported claims, stereotypes, and duplication; a rejected draft can be rewritten. Studio renders pipeline events. Source: `src/lib/hunch/engine/agents/` and `src/components/hunch/flow/studio/`.
- Demo moment: show a rejected or revised draft in Studio and the resulting approved post. The agent work is visible as an outcome; workspace chat stays one Hunch voice.
- Mode distinction: a configured model endpoint supports the live pipeline; sample replay and a mocked-model mode also exist. The workspace chat uses prepared intents and copy, with calculations from the displayed posts. It is not an open-ended model conversation.
- Remaining verification: confirm the actual submission environment’s mode and capture a successful model-backed run before describing any recorded run as live. No test of a mock or replay proves live model execution.

### Content · 20%

- Evidence: sample candle captions and previews share the same product facts, price and buying occasions. English, Taglish and Tagalog variants already exist. Every planned gallery image is matched to its own caption rather than reusing one audience photo.
- Demo moment: change the proposed caption to Taglish, keep the product details, then save it with its own preview image.
- Remaining verification: Angel’s editorial pass for natural language and product accuracy. Images are generated sample assets, not photos supplied by customers.

### PH Community · 20%

- Evidence: peso pricing, Taglish/Tagalog, local buying occasions, and a phone handoff built around the apps small sellers already use. The creator retains the final publishing decision.
- Demo moment: a ₱350 candle post for a Christmas buying occasion, rewritten in the seller’s language and ready to publish from a phone.
- Remaining evidence: credited interviews, pilot use, or observed seller outcomes. Localized design demonstrates fit; it does not establish customer demand or real sales lift. Do not invent quotes or present Elle as a customer.

## Current must-haves

- [x] Product input, audience selection, Studio events, reviewed post previews, results, and a next-week plan.
- [x] Editable planned posts with dates, sample photos, image export and caption copying.
- [x] English, Taglish and Tagalog sample copy.
- [x] Workspace chat for the bounded demo questions, evidence links, language revisions, and date-based planning.
- [x] Recorded metrics, CSV processing in the main results flow, and sample replays.
- [x] Draft, Planned and Posted states. Direct platform publish/failure states are outside the handoff flow.
- [x] Cached sample run so the stage demo does not depend on a model response.
- [x] Reset sample workspace with personal posts preserved and an Undo action.
- [ ] Physical-device check of sharing on iPhone and Android.
- [ ] Confirm live model execution in the intended submission environment.
- [ ] Editorial pass and credited user feedback.
- [ ] Record and rehearse the short demo.

## What remains outside the demo build

Official platform connections, automatic analytics imports, background publishing/scheduling, account recovery, and cross-device workspaces remain separate integration work. Sample playback is kept separate from manually entered personal results. The workspace does not fetch real platform metrics today.

## Demo plan · 60–90 seconds of the pitch

1. Start in the populated Week gallery and name Elle’s problem in one line.
2. Ask “What worked?” and briefly open the cited results row. Identify the figures as sample data.
3. Ask “What should I post?” and then “Make it more Taglish.”
4. Ask “Plan this for Friday.” Show the same revised caption in Week.
5. Show Save image / Copy caption, or the phone share handoff. Finish publishing in the social app.

Keep the rest of the five-minute pitch for the problem, market, business, technical evidence and roadmap. Show the Studio review loop as brief technical evidence or during Q&A; do not read every agent message aloud.

Before rehearsing, use Reset sample. Keep a screen recording as the fallback.

## Roadmap

First prove the workflow with real sellers and repeat usage. Then replace manual publishing and analytics steps with official integrations as access permits. Account recovery and reliable scheduling need their own implementation and operational testing.

The historical business-model notes below are retained for discussion. They are not validation of the current workspace or a current cost model.

### Business model (draft for discussion)

Pricing is still a hypothesis. The amounts below are legacy discussion placeholders from the earlier audience-test concept; they are not a validated price list for the creator workspace.

**Pricing**

| Plan | Price | Includes | For |
| --- | --- | --- | --- |
| Free first test | ₱0 | 1 full test cycle | Everyone; the acquisition hook |
| Test pass | ₱99 one-time | 1 test cycle, no subscription | Creators who prefer to pay per use |
| Starter | ₱299 / month | 2 test cycles, weekly calendars | Elle, Jade |
| Pro | ₱699 / month | 6 test cycles, several offers, results auto-import (phase 3) | Growing creators |
| Agency | ₱2,999 / month | 20 test cycles, client workspaces | Brie |

For scale: Canva Pro runs about ₱840 a month for Filipino users ([source](https://itsourcecode.com/canva/canva-free-vs-pro/)), and Canva added one-day and seven-day plans with GCash payment in the Philippines ([source](https://www.adobomagazine.com/?p=254422)), which is the habit the ₱99 pass is built for.

**Unit economics**

The earlier model estimated AI cost for an audience-test cycle. It does not include the revised product's channel connections, publish/scheduling operations, analytics refreshes, storage, or account support, so it cannot support a gross-margin or break-even claim for the workspace. Rebuild costs after selecting the first integrations and measuring usage.

The tables and scenarios below are retained as historical pricing hypotheses only. Replace them with a workspace model that accounts for channel count, publishing volume, analytics refresh rate, AI usage, and support before using them to make business claims.

| Plan | Price | Model cost | Payment fees | Gross margin |
| --- | --- | --- | --- | --- |
| Starter | ₱299 | ₱79 | ₱7 | 71% |
| Pro | ₱699 | ₱211 | ₱17 | 67% |
| Agency | ₱2,999 | ₱725 | ₱75 | 73% |

**Scenarios**

All three use the same plan mix (70% Starter, 22% Pro, 8% Agency, about ₱603 average revenue per paying user), 6% of new signups buying a ₱99 pass, ₱5,000 a month for hosting (₱15,000 above 1,000 paying users), and a two-person team at ₱150,000 a month from month 1. Free first tests count as acquisition cost.

| Scenario | New signups, month 1 | Monthly signup growth | Free to paid | Monthly churn | Marketing per month |
| --- | --- | --- | --- | --- | --- |
| Conservative | 100 | 8% | 5% | 10% | ₱10,000 |
| Base | 300 | 10% | 8% | 7% | ₱20,000 |
| Upside | 600 | 12% | 10% | 5% | ₱40,000 |

&#91;embedded content: Hunch draft model · 24 months after paid launch · assumptions in the tables above\]

| Scenario | Paying users, month 12 | Paying users, month 24 | Break-even month (with team) | Cash needed before break-even |
| --- | --- | --- | --- | --- |
| Conservative | 62 | 174 | Not within 24 months | ₱3.3M over 24 months, still losing |
| Base | 384 | 1,366 | 14 | ₱1.3M |
| Upside | 1,184 | 5,254 | 7 | ₱0.7M |

Secondary-market check: DTI estimates 500,000 to 900,000 MSMEs actively selling online ([source](https://malaya.com.ph/business/business-news/dti-extends-e-commerce-trustmark-registration-deadline-to-december-31)). This is a potential secondary segment, not the primary customer count. The creator economy's overall output and ad spend are not a count of creators who can pay for Hunch.

**What moves the model most**

- Free-to-paid conversion and churn: the pilot's first job is to measure both.
- Model cost: a cheaper model for the Reviewer and prompt caching would lift margin further.
- Agency mix: each agency account is worth about ten Starter accounts.
- Team cost: founders unpaid through the pilot moves base-case break-even much earlier.

**To decide before the pilot:** whether the free test stays free, whether to bill in pesos through GCash from day one, and which two prices to test against each other.

## Open questions

**Decided**

- Build window: code complete by 17:00 (15 hours); demo prep and the deck after
- Team: Joal builds with Codex and owns design and UX; Angel owns everything else and reviews all output
- Stack: Next.js on Vercel with the Vercel AI SDK; Joal holds the Vercel account and the API key
- Demo: Elle is a persona; a creator who monetizes cooking content through her own product
- One project can win every prize, so the build aims at all four buckets
- Presenters: Joal and Angel together
- Meta export headers: captured from a real Ads-level export of a PHP ad account (see Results in Infrastructure)
- Bucket: we must declare one on submission, and we declare Craftsmanship
- Demo length: 5 minutes
- Influencer friends have agreed to be quoted
- Quote credit for now: each friend's name and niche; can be changed later

**Still open**

- [x] Credit creator-friend quotes by name and niche for now; revise later if requested

Infrastructure options for posting and reporting, now and later: Infrastructure
