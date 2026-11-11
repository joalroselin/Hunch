# Hunch MVP: ParallelOS Hackathon

Nov 12, 2026 · @Joal Rose Lin

## What we are building

Hunch is one social media workspace for small creators and influencers: plan content, create and publish posts, and see performance and useful insights across channels without jumping between tools. The MVP demonstrates that loop for Filipino creators. AI-generated audience hypotheses and a small comparable content test are one insight feature inside the workspace, not the whole product. A product or offer is optional; independent sellers are a secondary audience.

The strategy: Craftsmanship is 40% of the score, so the spine is ONE creator workspace that feels coherent from planning through publishing and performance review. The other three buckets (20% each) are scored through features of that same workspace: useful agent assistance, strong content, and one Filipino creator's journey. Anything that can't be polished by the deadline gets cut, not shipped rough.

## Team and timeline

Two people, one engineer. Code is complete by 17:00, 15 hours from the start of the build. After that comes demo prep and the deck, not code.

| Person | Owns | During the build |
| --- | --- | --- |
| Joal | Engineering (with Codex), design, and UX; possibly the demo | Builds Track A in the order on the Infrastructure tab |
| Angel | Everything else: deck, pitch, demo script, rules and submission, output review | Works the list below in parallel |

**Angel's parallel list**

- [x] Check whether we must declare a bucket on submission; if yes, Craftsmanship
- [ ] Make Elle's creator-product photo: homemade-looking chili garlic oil in a plain glass jar, no brand label, shot in daylight on a simple surface
- [x] Get the real Meta export headers: open Meta Ads Manager on her own Facebook account, add the columns from the Results section, and use Export table data to CSV (an empty export still has the headers)
- [ ] Write `sample-results.csv` in a spreadsheet with those headers, following the sample results rules
- [ ] Read every agent prompt and output in Taglish and Tagalog; flag anything forced, stereotyped, or untrue
- [ ] Test the share handoff on her phone (we need one iPhone and one Android between us)
- [ ] Draft the deck and the 5-minute demo script around Elle's creator journey; rehearse after 17:00

## Who it's for

Hunch's primary audience is creators and influencers who have a way to earn from their content. A creator with an offer is the best fit for this version because the test can measure clicks, leads, or sales. Independent product sellers remain a secondary audience. The demo follows Elle, a creator with her own food product, from start to finish.

| Persona | Who they are | Where they post | What they struggle with | What Hunch gives them |
| --- | --- | --- | --- | --- |
| Elle, food creator with her own product (demo) | 29; makes cooking content and small-batch chili garlic oil | Facebook, Instagram, and Shopee | Posts regularly but guesses which angle turns viewers into buyers | Tested audience hypotheses and a week of posts tied to product orders |
| Jade, fitness creator with an affiliate offer | 24; makes beginner workout content and earns from referrals | Instagram and TikTok | Generic growth advice does not tell her which audience clicks her offer | A small test that compares audience response and affiliate clicks |
| Louise, independent product seller (secondary) | 47; sells specialty items through a local shop page | Facebook and Messenger | Limited time; unsure which posts deserve promotion | Ready posts and a simple way to compare buyer response |
| Brie, creator manager | 31; supports several monetized creators | Her clients' pages | Needs evidence for sponsor or affiliate campaigns and fast localized variations | Repeatable test reports per creator (multi-client workspace on the roadmap) |

**Demo persona: Elle.** She's a food creator who makes cooking content and sells her own chili garlic oil. This creator-led use case keeps the output tied to a measurable offer: product clicks and orders.

Her situation going in:

- Publishes cooking content and promotes her chili garlic oil; she cannot tell which audience or message drives product clicks and orders
- Could buy, gift, or pasalubong: office workers, home cooks, OFW families, and Christmas gift exchanges all fit, which makes 8 distinct audiences feel real
- Can spare a small peso budget to promote content but has never run a structured test
- Wants to know who to make content for this Christmas season

Elle is a persona, and the demo says so. If a creator friend wants to try it, adapt the offer and photo while keeping the same test-and-learn journey.

## The workspace, screen by screen

Seven screens, designed for desktop and phone together, each with one job and one primary button. The workspace brings planning, creation, publishing, and performance into one flow. Desktop uses the width; on a phone the same screens stack into one column. A first-time creator should understand what to post, publish it, and learn from its performance without reading instructions.

1. **Home.** See this week's calendar, draft and scheduled posts, connected channels, and a small set of recent performance indicators.
2. **Create.** Describe the creator's niche and post idea, choose channels and a goal, and get help shaping the content.
3. **Audience insights.** See eight audience hypotheses and the content angles likely to resonate. This is an optional planning aid, not a requirement to publish.
4. **Composer.** Edit and preview the post for each channel, then save it as a draft or add it to the calendar.
5. **Publish.** Publish or schedule from Hunch where the connected platform permits it. For channels not connected in the MVP, use the phone's share handoff and mark the post as published.
6. **Analytics.** See post performance across channels in one place. In the first MVP, enter metrics or import available reports; connected analytics can replace this manual step as integrations are approved.
7. **Insights.** See what is resonating, compare performance by content and audience, and get a useful next action or a new post idea.

## The agent pipeline

Five agents, each with one job. The Reviewer is the one that makes this more than a chain of prompts: it can send any post back to the Copywriter with a reason, and the Studio screen shows that happen.

&#91;embedded content: Hunch agent pipeline · 5 agents, 1 review loop, 1 human step\]

Every handoff is logged as a short, human-readable event (proposed, rejected because, rewritten because, approved). The Studio screen is built from that log, so the Agents evidence and the UI come from the same work. The Reviewer gets at most 2 rewrite rounds per post so a run always finishes.

## How each bucket is scored by the build

Every bucket gets one screen where judges can see it without being told.

| Bucket | Weight | Evidence in the build | Demo moment |
| --- | --- | --- | --- |
| Craftsmanship | 40% | One coherent workspace for planning, publishing, and analytics; responsive, clear post status, no dead ends | Move from Home to composing a post, publishing it, then reviewing its performance |
| Agents | 20% | Agents assist with ideas, audience hypotheses, copy, and performance insights; the creator reviews before publishing | Show how an insight becomes a draft the creator can approve |
| Content | 20% | Strong, localized posts tailored to the creator's niche and chosen channel | Compare a draft and its channel previews |
| PH Community | 20% | A believable Filipino creator manages their social presence in one place; Taglish and Tagalog supported | Follow Elle through planning, posting, and seeing what resonates |

## Scope

Build the must-haves to a finished standard first. Nice-to-haves start only when every must-have is demo-ready.

**Must-have**

- [ ] A coherent creator workspace: home, create, audience insights, composer, publish, analytics, and next-step insights
- [ ] Draft, preview, schedule, and publish posts from one workspace, with channel-specific previews
- [ ] Connected channel status and a unified content calendar
- [ ] Analytics dashboard across connected channels; manual/import fallback where connections are not ready
- [ ] AI assistance for ideas, audience hypotheses, and captions; creator reviews every suggestion
- [ ] Captions in English, Taglish, and Tagalog, switchable per post
- [ ] Posting from Hunch where platform integration permits; phone share handoff as the MVP fallback, with caption ready to paste
- [ ] Unified analytics view: manual entry or Meta Ads Manager CSV import in the MVP, plus clearly labeled sample data
- [ ] Clear post states: draft, scheduled, published, and failed
- [ ] Insights that distinguish measured performance from AI-generated recommendations
- [ ] Cached run for the demo product so the demo never waits on an API

**Nice-to-have**

- [ ] AI-generated image variations per audience, with a brand-safety check
- [ ] Creator can swap or edit an audience and regenerate only that post
- [ ] Shareable link to a creator's results page
- [ ] Browser agent that walks through a supported promotion flow

**Cut for the hackathon**

- Full cross-platform account sync, auto-posting to every platform, and auto-boosting
- Accounts, login, payments, and saving multiple products
- TikTok, Shopee Ads, and other platforms
- Video posts

## Demo plan

The demo is one creator journey: Elle plans a post, gets an optional audience/content suggestion, publishes through the available handoff, then reviews performance and the next recommendation in the same workspace. Real channel connections and analytics coverage vary, so any sample metrics are clearly labeled.

**The analytics-data problem.** Where connected channel data is unavailable in the demo, use synthetic sample metrics labeled on screen as sample data. Never present sample numbers as real.

**Running order**

1. **Elle's problem, in one line.** She makes cooking content and promotes her chili garlic oil, but guesses which audience and message leads to clicks and orders. Then show quotes from creator friends, credited by name and niche.
2. **Home.** Show connected channels, scheduled posts, and recent performance in one place.
3. **Create.** Draft a post and show AI help as optional; Elle stays in control of the copy.
4. **Plan and publish.** Add the post to the calendar, preview it for its channel, and publish or use the labeled share handoff.
5. **Analytics.** Review cross-channel performance; label sample data if a live account is not connected.
6. **Insights.** Show one practical next action and where it came from.
7. **Close.** Name the roadmap: broader channel connections and deeper analytics as platform access allows.

**Timing (5 minutes):** creator problem and quotes 0:30 · Home and Create 1:00 · calendar and publish 1:15 · analytics and insights 1:15 · roadmap and business model 0:45 · buffer 0:15.

**Safety nets**

- Cached creator workspace and sample metrics, so a slow or unavailable platform connection never stalls the stage
- Screen recording of the full flow as a last resort
- Q&A only: if judges ask to try their own offer, run screens 1 to 4 on it while the cached run stays ready

## Roadmap

The hackathon builds only phase 1. On stage, the rest is one closing line: the same loop, with the manual steps replaced by official APIs and permitted partners as approvals come in.

&#91;embedded content: Hunch roadmap · 4 phases, 3 gates\]

Timings are estimates. Meta App Review and the TikTok posting audit set the pace of phases 3 and 4, so applications go in during the pilot, not after it. Gate targets are proposals to agree on as a team.

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
