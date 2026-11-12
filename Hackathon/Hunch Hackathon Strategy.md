# Hunch Hackathon Strategy

Nov 12, 2026 · @Joal Rose Lin

We lead with one working outcome: Hunch turns a small seller’s test results into their next week of posts. Elle’s Candles is the sample story. The current evidence and remaining checks for every bucket live in `MVP Plan.md`; use that implementation audit when preparing the pitch.

## How we're scored

Our understanding: every project is scored on all four buckets, Craftsmanship weighs 40% and the other three 20% each, and one project can win every prize. That makes the overall score the real target, and Craftsmanship the biggest single lever.

| Prize | Amount | What wins it |
| --- | --- | --- |
| Best in Show | ₱50,000 | Highest overall score, from any bucket |
| Best Craftsmanship | ₱10,000 | Looks and feels finished, end to end |
| Best Content | ₱10,000 | Work people stop for: hooks, craft, payoff, on brand |
| Most Unique Use of Agents | ₱10,000 | Agents that plan, act, check each other, and do real work |
| Most Useful for the PH Community | ₱10,000 | Helps Filipinos with a real problem, starting tomorrow |

**Declaring a bucket.** Confirmed: we declare one on submission, and we declare Craftsmanship. It carries the most weight and it's the bucket we control most. The pitch still shows all four, since every bucket feeds the overall score.

## Where we stand

Craftsmanship is crowded but carries 40% and suits our team, so we win it on finish. Agents is our clearest edge. Content and PH Community depend on output quality and proof from real users.

&#91;embedded content: Our position per bucket · strength against expected competition\]

Move the dots at each checkpoint; the levers in the next section say what moves each one.

## Bucket evidence in the current build

- **Craftsmanship · 40%:** coherent flow, distinct planned-post gallery, evidence-linked chat, caption revision, date-based planning, export and share handoff. Rehearse one short path and test physical phones.
- **Agents · 20%:** audience selection, critique, drafting and bounded review/rewrite are implemented in the server pipeline. Verify the configured live model separately from sample or mocked runs. Prepared workspace chat is not the model-backed pipeline.
- **Content · 20%:** posts use Elle’s candle facts, local buying occasions and English/Taglish/Tagalog copy. Show the caption and visual together. Finish the editorial pass.
- **PH Community · 20%:** demonstrate the local seller workflow and phone handoff. Use credited feedback when available; do not present personas, sample metrics or generated photos as customer evidence.

## Best in Show

The product walkthrough gets 60–90 seconds of the five-minute pitch. Use the rest for the problem, market, business, evidence and roadmap. The memorable moment is one revised post moving into the week, with a clear reason for making it.

The pitch states what the product does. Sample labels stay beside sample data. Actual integration limits and missing customer validation are answered plainly in Q&A and the roadmap.

## Checkpoints during the build

Four times during the build, Joal and Angel spend 5 minutes on one question: is the build still on track for the overall score? When we're behind, we cut in this order, lowest weight first, so Craftsmanship (40%) is the last thing we give up.

| Time | Check | If on track | If behind |
| --- | --- | --- | --- |
| 05:00 | Home, calendar, and post status are coherent | Continue | Reduce the number of dashboard metrics; keep Create and Publish easy to reach |
| 07:00 | A creator can draft and preview a channel-ready post | Continue | Use one channel preview and a compact editing flow |
| 10:00 | Publish or share handoff works on a phone | Continue | Keep the clear fallback; cut extra framing options |
| 12:30 | Analytics and one next insight work with sample data | Go to demo mode | Drop import polish; keep the unified view and label sample data |

**Cut order when behind** (cut from the top)

1. Extra AI audience variations
2. Analytics import polish
3. Additional post-image layouts
4. Deep per-channel analytics breakdown
5. Revision history beyond the last round

**Never cut:** creating and previewing a post, a usable publish/share path, the unified analytics view, honest sample-data labels, and the final polish window.

## Judge Q&A prep

Short, honest answers. Whoever is asked answers in two sentences, and the other adds one line only if it helps.

| Likely question | Our answer |
| --- | --- |
| Are these results real? | Any demo metrics without a connected account are labeled sample data. A creator's connected channel data or imported report powers real analytics. |
| How is this different from asking ChatGPT? | Hunch puts planning, channel-ready posts, publishing, and performance in one workflow; AI helps with suggestions but does not replace creator approval. |
| Who actually wants this? | We can reach creators directly through our existing network. Show their quotes, credited by name and niche. |
| Why don't you post and boost automatically? | Meta and TikTok require app review and audits for that. We built the version that works today with no approvals, behind an adapter that plugs into official APIs or a partner like Parallel later. |
| Isn't automating social apps against platform rules? | We don't automate the apps. On a phone, Hunch hands the post to the app through the normal share menu, and the creator posts it. |
| How do the agents avoid stereotypes and bad Taglish? | A Skeptic rejects stereotyped audiences, and a Reviewer checks every post for cringe, stereotypes, ad policy, and language, sending it back with reasons. |
| Do posts publish directly? | Where a channel supports an approved integration, publish from Hunch. Elsewhere, Hunch offers a clear share handoff and post-status tracking. |
| How does this make money? | Pricing is still a hypothesis; we need to model channel and analytics costs before making a margin claim. |
| What did you build in the time? | A first creator workspace for planning, post creation, publishing handoff, and performance insights. |

## Stats for the deck

The story in five beats: Filipinos live on social media, creators are building businesses around their content, and brands and audiences respond to different angles. Hunch helps a monetized creator replace guesswork with a small test and learn which audience and message drives their chosen outcome.

| Beat | Stat | Source |
| --- | --- | --- |
| 1. Filipinos live online | 95.8 million social media user identities (not unique people), 81.9% of the population | [Digital 2026 Philippines, via Newsbytes](https://newsbytes.ph/?p=112521) |
| 1. Filipinos live online | 33 hours 50 minutes a week on social media; 97.8% of internet users go online by phone | [Digital 2026 Philippines, via Newsbytes](https://newsbytes.ph/?p=112521) |
| 2. Buying moved to social | PH digital economy estimated at $36B GMV in 2025; e-commerce is its largest component | [e-Conomy SEA 2025 Philippines report](https://services.google.com/fh/files/misc/philippines_e_conomy_sea_2025_report.pdf) |
| 2. Buying moved to social | Video commerce is a quarter of total e-commerce GMV in the Philippines | [e-Conomy SEA 2025, via Newsbytes](https://newsbytes.ph/?p=107954) |
| 2. Buying moved to social | Social commerce in the Philippines projected at $20.05B in 2026 | [Unbox Creator Network study, via Philstar Tech](https://philstartech.com/enterprise/2026/03/25/17544/study-trust-not-just-follower-count-drives-ph-creator-economy/) |
| 3. Sellers are small and many | 1.2 million MSMEs, 99.6% of registered establishments, employing 66.6% of the workforce | [ADB, via Manila Bulletin](https://mb.com.ph/2025/11/13/philippine-msmes-keep-growing-despite-challenges-says-adb) |
| 3. Sellers are small and many | 500,000 to 900,000 MSMEs actively selling online | [DTI, via Malaya](https://malaya.com.ph/business/business-news/dti-extends-e-commerce-trustmark-registration-deadline-to-december-31) |
| 3. Creators move the sale | 86% of Filipino social media users follow influencers; 44% of Gen Z social shoppers rely on creator endorsements | [Digital 2025 Philippines, via Manila Bulletin](https://mb.com.ph/2025/09/04/influencer-industry-new-capitalism) |
| 4. Posts don't reach people | A Facebook page post reaches about 1.65% of its followers on average | [Socialinsider](https://www.socialinsider.io/blog/facebook-organic-reach/) |
| 4. Making content is the hard part | 49% of surveyed Filipino social commerce sellers say creating effective content is challenging | [Ninja Van social commerce white paper](https://blog.ninjavan.co/en-ph/ninja-van-social-commerce-white-paper/) |
| 5. So money goes to ads | $2.12B of the Philippines' $3.53B ad spend in 2025 was digital | [Digital 2026 Philippines, via Newsbytes](https://newsbytes.ph/?p=112521) |
| 5. And to creators | Influencer advertising in the Philippines reached $125M, up 15% year on year | [Meltwater](https://meltwater.com/en/blog/social-media-statistics-philippines) |
| Why AI agents fit here | In the e-Conomy SEA 2025 survey, 94% of Philippine respondents said they were willing to share data access with AI agents | [e-Conomy SEA 2025 Philippines report](https://services.google.com/fh/files/misc/philippines_e_conomy_sea_2025_report.pdf) |

**Strongest pairing for one slide:** a sourced creator-economy or influencer-ad-spend figure and the creator friends' quotes as human proof. MSME counts describe the secondary seller market; do not present them as Hunch's primary addressable market.

**Before these go on slides:** most links are news reports of the original studies. Angel should open each original report (Digital 2026 Philippines, e-Conomy SEA 2025, DTI) and cite that on the slide, with the year. The reach figure is global, not Philippines-only, so label it that way.

## Assumptions to confirm

- [x] Scoring weights are 40% Craftsmanship and 20% for each other bucket, applied to every project
- [x] One project can win a bucket prize and Best in Show together (as recorded in the MVP plan; verify against the official rules before submission)
- [x] We must declare a bucket on submission; we declare Craftsmanship
- [x] Demo length: 5 minutes, plus Q&A
- [x] Influencer friends agreed to be quoted (as recorded in the MVP plan)
- [x] Credit each quote with the friend's name and niche for now; revise later if requested
